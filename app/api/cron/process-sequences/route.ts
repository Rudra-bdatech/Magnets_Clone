import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, MagnetPageModel, SequenceModel, AccountModel, EmailEventModel } from "@/lib/models";
import { sendMail } from "@/lib/email";
import { parseFlexibleDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron Endpoint: Multi-Day Email Sequence Processing Engine
 * 
 * Scheduled trigger: Runs automatically via vercel.json (e.g., every 15 minutes).
 * Security: Verifies Authorization header with CRON_SECRET or Vercel Cron Header.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Security Check: Protect cron endpoint against unauthorized external triggers
    const authHeader = req.headers.get("authorization");
    const vercelCronHeader = req.headers.get("x-vercel-cron");
    const querySecret = req.nextUrl.searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret && !vercelCronHeader) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await dbConnect();

    // 2. Fetch active leads with sequences attached (chronologically sorted, scaled batch size)
    const activeLeads = await LeadModel.find({
      status: { $ne: "stopped" },
      sequenceStep: { $exists: true, $ne: "" },
    })
      .sort({ signedUpAt: 1 })
      .limit(1000);

    let processedCount = 0;
    let deliveredCount = 0;
    const now = new Date().getTime();
    const debugLogs: any[] = [];

    // 3. Pre-fetch all unique magnet pages in ONE query instead of one-per-lead.
    const uniquePageIds = Array.from(
      new Set(activeLeads.map((l) => l.pageId).filter((id): id is string => Boolean(id)))
    );
    const uniquePageNames = Array.from(
      new Set(activeLeads.map((l) => l.page).filter((n): n is string => Boolean(n)))
    );

    const pageDocs = await MagnetPageModel.find({
      $or: [
        ...(uniquePageIds.length > 0 ? [{ id: { $in: uniquePageIds } }] : []),
        ...(uniquePageNames.length > 0 ? [{ name: { $in: uniquePageNames } }] : []),
      ],
    }).lean();

    const uniqueOwnerEmails = Array.from(
      new Set([
        ...pageDocs.map((p) => p.userEmail).filter(Boolean),
        ...activeLeads.map((l) => l.userEmail).filter(Boolean),
      ])
    );

    const accountDocs = await AccountModel.find({
      email: { $in: uniqueOwnerEmails.map((e) => e.toLowerCase().trim()) },
    }).lean();

    const accountByEmail = new Map(accountDocs.map((a) => [a.email.toLowerCase().trim(), a]));

    // Build O(1) lookup maps so the loop never touches the database for pages
    const pageById = new Map(pageDocs.filter((p) => p.id).map((p) => [p.id, p]));
    const pageByName = new Map(pageDocs.filter((p) => p.name).map((p) => [p.name, p]));

    const uniqueRecipientEmails = Array.from(
      new Set(activeLeads.map((l) => (l.email || "").toLowerCase().trim()).filter(Boolean))
    );

    const sentEvents = await EmailEventModel.find({
      recipientEmail: { $in: uniqueRecipientEmails },
      eventType: "sent",
    }).lean();

    const sentEventsMap = new Map<string, { stepIds: Set<string>; lastSentTime: number }>();
    for (const ev of sentEvents) {
      const key = `${(ev.recipientEmail || "").toLowerCase().trim()}_${ev.pageId || ""}`;
      if (!sentEventsMap.has(key)) {
        sentEventsMap.set(key, { stepIds: new Set(), lastSentTime: 0 });
      }
      const entry = sentEventsMap.get(key)!;
      if (ev.stepId) {
        entry.stepIds.add(ev.stepId);
      }
      const evTime = ev.createdAt ? new Date(ev.createdAt).getTime() : 0;
      if (evTime > entry.lastSentTime) {
        entry.lastSentTime = evTime;
      }
    }

    for (const lead of activeLeads) {
      if (!lead.pageId && !lead.page) {
        debugLogs.push({ email: lead.email, reason: "No pageId or page" });
        continue;
      }

      // Map lookup — zero DB calls
      const pageDoc = (lead.pageId ? pageById.get(lead.pageId) : null) ??
        (lead.page ? pageByName.get(lead.page) : null) ??
        null;

      if (!pageDoc) {
        debugLogs.push({ email: lead.email, page: lead.page, pageId: lead.pageId, reason: "Page doc not found in DB" });
        continue;
      }

      const ownerEmail = (pageDoc.userEmail || lead.userEmail || "").toLowerCase().trim();
      const ownerAccount = accountByEmail.get(ownerEmail) || null;

      if (!pageDoc.sequenceEmails || pageDoc.sequenceEmails.length === 0) {
        debugLogs.push({ email: lead.email, pageName: pageDoc.name, reason: "No sequenceEmails on page doc", sequenceEmailsCount: pageDoc.sequenceEmails?.length || 0 });
        continue;
      }

      const sequenceEmails = pageDoc.sequenceEmails;
      const sentKey = `${(lead.email || "").toLowerCase().trim()}_${pageDoc.id || ""}`;
      const sentEntry = sentEventsMap.get(sentKey) || { stepIds: new Set<string>(), lastSentTime: 0 };
      const sentStepIds = sentEntry.stepIds;

      // Find the first sequence email in sequenceEmails that hasn't been sent to this lead yet
      let nextEmailIndex = -1;
      for (let idx = 0; idx < sequenceEmails.length; idx++) {
        const item = sequenceEmails[idx];
        const stepIdentifier = item.id || `step_${idx + 1}`;
        const altIdentifier = `se_${pageDoc.id}_${idx + 1}`;
        if (!sentStepIds.has(stepIdentifier) && !sentStepIds.has(altIdentifier)) {
          nextEmailIndex = idx;
          break;
        }
      }

      if (nextEmailIndex === -1) {
        if (lead.sequenceStep !== "Completed") {
          lead.sequenceStep = "Completed";
          lead.status = "completed";
          await lead.save();
        }
        debugLogs.push({ email: lead.email, sequenceEmailsTotal: sequenceEmails.length, reason: "All sequence steps already delivered" });
        continue;
      }

      const parsedDate = parseFlexibleDate(lead.signedUpAt);
      let signupTime = parsedDate ? parsedDate.getTime() : NaN;

      // If signupTime is NaN or in the future (caused by client localized date string timezone offset),
      // resolve the exact UTC creation timestamp directly from MongoDB _id or createdAt.
      if (isNaN(signupTime) || signupTime > now) {
        if ((lead as any).createdAt) {
          const parsedCreated = parseFlexibleDate((lead as any).createdAt);
          if (parsedCreated && parsedCreated.getTime() <= now) {
            signupTime = parsedCreated.getTime();
          }
        }
        if (isNaN(signupTime) || signupTime > now) {
          if ((lead as any)._id && typeof (lead as any)._id.getTimestamp === "function") {
            signupTime = (lead as any)._id.getTimestamp().getTime();
          } else {
            signupTime = now;
          }
        }
      }

      // Base time: For step 1 (idx 0), calculate from signupTime.
      // For step 2+ (idx > 0), calculate from the exact time the previous email was sent!
      const baseTime = (nextEmailIndex > 0 && sentEntry.lastSentTime > 0)
        ? sentEntry.lastSentTime
        : signupTime;

      const elapsedMinutes = Math.floor((now - baseTime) / (1000 * 60));

      const nextEmail = sequenceEmails[nextEmailIndex];
      let stepRequiredDelay = 0;
      if (typeof nextEmail.delayMinutes === "number" && !isNaN(nextEmail.delayMinutes)) {
        stepRequiredDelay = nextEmail.delayMinutes;
      } else {
        const num = Number(nextEmail.delayDays) || 0;
        if (nextEmail.delayUnit === "minutes") stepRequiredDelay = num;
        else if (nextEmail.delayUnit === "hours") stepRequiredDelay = num * 60;
        else stepRequiredDelay = num * 1440; // days default
      }

      if (elapsedMinutes < stepRequiredDelay) {
        debugLogs.push({
          email: lead.email,
          stepIndex: nextEmailIndex + 1,
          elapsedMinutes,
          stepRequiredDelay,
          remainingMinutes: stepRequiredDelay - elapsedMinutes,
          reason: `Waiting: ${stepRequiredDelay - elapsedMinutes} min(s) remaining after previous email`,
        });
        continue;
      }

      processedCount++;

      const formattedSubject = (nextEmail.subject || `Follow-up on ${pageDoc.name}`)
        .replace(/\{name\}/gi, lead.name || "there");

      let rawBody = (nextEmail.body || `Hi {name},\n\nJust checking in to see if you had a chance to look at ${pageDoc.name}! Let me know if you have any questions.\n\nBest regards`)
        .replace(/\{name\}/gi, lead.name || "there")
        .replace(/\{email\}/gi, lead.email || "");

      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawBody);
      let formattedBodyHtml = hasHtmlTags ? rawBody : rawBody.replace(/\n/g, "<br/>");

      // Auto-convert standalone YouTube links into clickable video cards
      formattedBodyHtml = formattedBodyHtml.replace(
        /(?<!href=["'])(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11}))/g,
        (_match: string, url: string, ytId: string) => {
          const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          return `<div style="text-align: center; margin: 16px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${thumb}" alt="Watch Video on YouTube" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></a><br/><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066B2; font-weight: 600; text-decoration: underline;">▶ Watch Video on YouTube</a></div>`;
        }
      );

      const brandColor = ownerAccount?.brandColor || "#0066B2";
      const senderName = ownerAccount?.senderDisplayName || ownerAccount?.name || "LeadMagnets";
      const defaultFrom = process.env.SMTP_FROM || "non-reply@bdatech.in";
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "https://magnets.bdatech.in").replace(/\/$/, "");
      const logoUrl = `${appUrl}/brand/custom-logo-light.png`;
      const accessUrl = `${appUrl}/r/${pageDoc.id}`;

      // Clean up localhost occurrences in body text
      formattedBodyHtml = formattedBodyHtml.replace(/http:\/\/localhost:3000/g, appUrl);

      // Convert bare URLs into clean styled links if not already wrapped
      formattedBodyHtml = formattedBodyHtml.replace(
        /(?<!href=["']|src=["'])(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" style="color: #0066B2; text-decoration: underline; font-weight: 500; word-break: break-all;">$1</a>'
      );

      // Inline email client compatible table formatting
      formattedBodyHtml = formattedBodyHtml
        .replace(/<table(\s+[^>]*)?>/gi, (match: string) => {
          if (match.includes('style="')) {
            return match.replace('style="', 'style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e2e8f0; ');
          }
          return '<table cellpadding="10" cellspacing="0" border="1" style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e2e8f0;">';
        })
        .replace(/<th(\s+[^>]*)?>/gi, (match: string) => {
          if (match.includes('style="')) {
            return match.replace('style="', 'style="border: 1px solid #e2e8f0; padding: 10px 14px; background-color: #f8fafc; color: #0f172a; font-weight: 700; text-align: left; vertical-align: top; font-size: 13px; ');
          }
          return '<th style="border: 1px solid #e2e8f0; padding: 10px 14px; background-color: #f8fafc; color: #0f172a; font-weight: 700; text-align: left; vertical-align: top; font-size: 13px;">';
        })
        .replace(/<td(\s+[^>]*)?>/gi, (match: string) => {
          if (match.includes('style="')) {
            return match.replace('style="', 'style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #334155; text-align: left; vertical-align: top; font-size: 13px; ');
          }
          return '<td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #334155; text-align: left; vertical-align: top; font-size: 13px;">';
        });

      const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formattedSubject}</title>
  <style>
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; vertical-align: top; font-size: 13px; line-height: 1.5; }
    th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
    td p, th p { margin: 0 !important; line-height: 1.5; }
    hr { border: none; border-top: 1px solid #f1f5f9; margin: 24px 0; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0f172a;">
  <div style="background-color: #f8fafc; padding: 48px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin: 0 auto;">
      
      <!-- Brand Logo Header -->
      <tr>
        <td style="padding-bottom: 28px; text-align: center;">
          <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoUrl}" 
              alt="${senderName}" 
              height="30" 
              style="height: 30px; width: auto; max-height: 34px; display: inline-block; border: 0; outline: none; vertical-align: middle;" 
            />
          </a>
        </td>
      </tr>

      <!-- Main Card Container -->
      <tr>
        <td>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);">
            
            <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; line-height: 1.3; letter-spacing: -0.02em;">
              ${formattedSubject}
            </h1>

            <div style="color: #334155; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
              ${formattedBodyHtml}
            </div>

            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; line-height: 1.5; border: none; padding: 0;">
                    Sent by <strong style="color: #64748b; font-weight: 600;">${senderName}</strong>
                  </td>
                </tr>
              </table>
            </div>

          </div>
        </td>
      </tr>

      <!-- Minimal Outer Footer -->
      <tr>
        <td style="padding-top: 24px; text-align: center;">
          <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            Powered by <strong style="color: #64748b; font-weight: 600;">LeadMagnets</strong> · Automated Follow-up
          </div>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
      `;

      const sendResult = await sendMail(
        {
          to: lead.email.trim(),
          subject: formattedSubject,
          html: htmlBody,
          tracking: {
            leadId: lead.id,
            pageId: pageDoc.id || lead.pageId,
            sequenceId: pageDoc.id,
            stepId: nextEmail.id || `step_${nextEmailIndex + 1}`,
            userEmail: ownerEmail || lead.userEmail,
            recipient: lead.email.trim(),
          },
        },
        ownerEmail || lead.userEmail
      );

      if (sendResult.success) {
        deliveredCount++;
      }

      // Advance lead to next sequence step in MongoDB
      const updatedStepNum = nextEmailIndex + 2; // Step number for the upcoming email
      if (nextEmailIndex + 1 >= sequenceEmails.length) {
        lead.sequenceStep = "Completed";
        lead.status = "completed";
      } else {
        lead.sequenceStep = `Step ${updatedStepNum} of ${sequenceEmails.length} (In Progress)`;
        lead.status = "delivered";
      }
      await lead.save();
      debugLogs.push({ email: lead.email, status: "SUCCESS", emailSubject: nextEmail.subject });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeLeadsChecked: activeLeads.length,
      processedCount,
      deliveredCount,
      debugLogs,
    });
  } catch (error: any) {
    console.error("Sequence Cron Execution Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

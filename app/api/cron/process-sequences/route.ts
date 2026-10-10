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

      const senderInitials = (senderName || "LM")
        .split(" ")
        .filter(Boolean)
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "LM";

      const htmlBody = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${formattedSubject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .card-padding { padding: 28px 22px 22px 22px !important; }
      .heading-text { font-size: 24px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f6f8f9; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f8f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="568" style="width:568px; max-width:568px;">
          
          <!-- Brand header -->
          <tr>
            <td style="padding:0 4px 20px 4px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:19px; font-weight:700; color:#2a3138;">
                    <a href="${appUrl}" target="_blank" style="text-decoration:none; display:inline-block;">
                      <img src="${logoUrl}" alt="LeadMagnets" height="26" style="height:26px; width:auto; max-height:30px; display:block; border:0; outline:none;" />
                    </a>
                  </td>
                  <td align="right" class="hide-mobile" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; font-weight:600; letter-spacing:1px; color:#7b858c;">
                    FOLLOW-UP
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#ffffff; border:1px solid #e2e7ea; border-radius:8px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="card-padding" style="padding:40px 40px 30px 40px;">
                    
                    <h1 class="heading-text" style="margin:0 0 20px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:24px; line-height:1.3; font-weight:600; color:#2a3138;">
                      ${formattedSubject}
                    </h1>

                    <div style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; color:#334155; font-size:15px; line-height:1.7;">
                      ${formattedBodyHtml}
                    </div>

                  </td>
                </tr>

                <!-- Sender footer inside card -->
                <tr>
                  <td style="padding:20px 40px; border-top:1px solid #e2e7ea;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36" valign="middle" style="width:36px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="36" height="36" align="center" valign="middle" style="width:36px; height:36px; background-color:#f6f8f9; border:1px solid #e2e7ea; border-radius:18px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; font-weight:600; color:#7b858c;">
                                ${senderInitials}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left:12px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                          <p style="margin:0 0 3px 0; font-size:10px; color:#7b858c;">Sent by</p>
                          <p style="margin:0; font-size:12px; font-weight:600; color:#2a3138;">${senderName}</p>
                        </td>
                        <td class="hide-mobile" align="right" valign="middle">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="19" height="19" align="center" valign="middle" style="width:19px; height:19px; background-color:#eff6ff; border-radius:10px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; color:#0066cc;">
                                &#10003;
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Page footer -->
          <tr>
            <td style="padding:24px 4px 8px 4px; text-align:center; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
              <p style="margin:0; font-size:11px; line-height:1.8; color:#7b858c;">
                You&rsquo;re receiving this email because you subscribed to <strong>${pageDoc.name}</strong>.
              </p>
              <p style="margin:8px 0 0 0; font-size:11px; color:#7b858c;">
                Powered by <a href="${appUrl}" target="_blank" style="color:#2a3138; font-weight:500; text-decoration:none;">LeadMagnets</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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

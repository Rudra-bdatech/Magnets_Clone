import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { emailLinkBaseUrl, signDownloadLinks } from "@/lib/magnet-access";
import { LeadModel, MagnetPageModel, AccountModel, EmailEventModel } from "@/lib/models";
import { sendMail } from "@/lib/email";
import { parseFlexibleDate } from "@/lib/utils";
import { getPlanLimits } from "@/lib/plan-limits";
import { escapeHtml, isValidEmailAddress, countOwnerLeadEmailsLast24h, LEAD_EMAIL_DAILY_CAP } from "@/lib/email-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MINUTE = 60 * 1000;
// Leads examined per run. Only leads that are due are fetched, so this is never a hard ceiling.
const BATCH_SIZE = 500;
// Stop starting new sends after this long so the run finishes inside maxDuration.
const TIME_BUDGET_MS = 45 * 1000;
// How long a run holds a lead while sending to it. Longer than any single send can take.
const LOCK_MS = 5 * MINUTE;
// Consecutive delivery failures before a lead is stopped instead of retried.
const MAX_SEND_FAILURES = 8;
// Sends per owner per run, so a backlog (e.g. right after Gmail is reconnected) drains gradually.
const OWNER_SENDS_PER_RUN = 25;
// Failures for one owner in a single run before the rest of their leads wait for the next run.
const OWNER_FAILURES_PER_RUN = 3;
const NO_SENDER_RETRY_MS = 60 * MINUTE;
const OWNER_DEFERRED_RETRY_MS = 15 * MINUTE;
const DAILY_CAP_RETRY_MS = 60 * MINUTE;
const PAUSED_RECHECK_MS = 60 * MINUTE;
const NO_PAGE_RECHECK_MS = 24 * 60 * MINUTE;

// 15m, 30m, 1h, 2h ... capped at 12h
function failureBackoffMs(failCount: number): number {
  return Math.min(15 * MINUTE * 2 ** Math.max(0, failCount - 1), 12 * 60 * MINUTE);
}

function stepDelayMinutes(step: any): number {
  if (typeof step?.delayMinutes === "number" && Number.isFinite(step.delayMinutes)) {
    return Math.max(0, step.delayMinutes);
  }
  const num = Number(step?.delayDays) || 0;
  if (step?.delayUnit === "minutes") return Math.max(0, num);
  if (step?.delayUnit === "hours") return Math.max(0, num * 60);
  return Math.max(0, num * 1440); // days default
}

interface OwnerRunState {
  sent: number;
  failures: number;
  noSender: boolean;
  dailyRemaining: number | null; // loaded on first due lead
}

/**
 * Cron Endpoint: Multi-Day Email Sequence Processing Engine
 *
 * Triggered externally every few minutes. Security: requires CRON_SECRET (see lib/cron-auth.ts).
 *
 * Safe to run concurrently: a lead is claimed atomically (seqLockUntil) before each send, and the
 * step is re-checked against delivered events after the claim, so overlapping runs never send twice.
 */
export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await dbConnect();

    const nowDate = new Date();
    const now = nowDate.getTime();

    // Only leads that are due and not held by another run. Completed, stopped and pending leads
    // never come back, so they cannot crowd new leads out of the batch.
    const activeLeads: any[] = await LeadModel.find({
      status: { $nin: ["stopped", "completed", "pending_email"] },
      unsubscribedAt: null, // matches leads without the field too
      sequenceStep: { $exists: true, $nin: ["", "Completed"] },
      $and: [
        { $or: [{ seqNextAt: null }, { seqNextAt: { $lte: nowDate } }] },
        { $or: [{ seqLockUntil: null }, { seqLockUntil: { $lte: nowDate } }] },
      ],
    })
      .sort({ seqNextAt: 1, _id: 1 })
      .limit(BATCH_SIZE)
      .lean();

    let processedCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    let deferredCount = 0;
    let errorCount = 0;
    let timedOut = false;
    const debugLogs: any[] = [];

    // Pre-fetch all unique magnet pages in ONE query instead of one-per-lead.
    const uniquePageIds = Array.from(
      new Set(activeLeads.map((l) => l.pageId).filter((id): id is string => Boolean(id)))
    );
    const uniquePageNames = Array.from(
      new Set(activeLeads.map((l) => l.page).filter((n): n is string => Boolean(n)))
    );

    const pageQuery = [
      ...(uniquePageIds.length > 0 ? [{ id: { $in: uniquePageIds } }] : []),
      ...(uniquePageNames.length > 0 ? [{ name: { $in: uniquePageNames } }] : []),
    ];
    const pageDocs: any[] = pageQuery.length > 0 ? await MagnetPageModel.find({ $or: pageQuery }).lean() : [];

    const uniqueOwnerEmails = Array.from(
      new Set(
        [...pageDocs.map((p) => p.userEmail), ...activeLeads.map((l) => l.userEmail)]
          .filter(Boolean)
          .map((e: string) => e.toLowerCase().trim())
      )
    );

    const accountDocs: any[] = uniqueOwnerEmails.length > 0
      ? await AccountModel.find(
          { email: { $in: uniqueOwnerEmails } },
          { email: 1, plan: 1, role: 1, name: 1, senderDisplayName: 1 }
        ).lean()
      : [];

    const accountByEmail = new Map(accountDocs.map((a) => [a.email.toLowerCase().trim(), a]));

    // Build O(1) lookup maps so the loop never touches the database for pages
    const pageById = new Map(pageDocs.filter((p) => p.id).map((p) => [p.id, p]));
    const pageByName = new Map(pageDocs.filter((p) => p.name).map((p) => [p.name, p]));

    const uniqueRecipientEmails = Array.from(
      new Set(activeLeads.map((l) => (l.email || "").toLowerCase().trim()).filter(Boolean))
    );

    // Plan limit: each owner's oldest `sequencesLimit` enabled sequences send; the rest wait for an upgrade
    const enabledSeqPages: any[] = accountByEmail.size > 0
      ? await MagnetPageModel.find(
          { userEmail: { $in: Array.from(accountByEmail.keys()) }, sequenceEnabled: true },
          { id: 1, userEmail: 1 }
        ).sort({ _id: 1 }).lean()
      : [];
    const allowedSeqPageIds = new Set<string>();
    const seqCountByOwner = new Map<string, number>();
    for (const p of enabledSeqPages) {
      const owner = (p.userEmail || "").toLowerCase().trim();
      const acc: any = accountByEmail.get(owner);
      const used = seqCountByOwner.get(owner) || 0;
      if (used < getPlanLimits(acc?.plan, owner, acc?.role).sequencesLimit) {
        allowedSeqPageIds.add(p.id);
        seqCountByOwner.set(owner, used + 1);
      }
    }

    const sentEvents: any[] = uniqueRecipientEmails.length > 0
      ? await EmailEventModel.find(
          { recipientEmail: { $in: uniqueRecipientEmails }, eventType: "sent" },
          { recipientEmail: 1, pageId: 1, stepId: 1, createdAt: 1 }
        ).lean()
      : [];

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

    const ownerState = new Map<string, OwnerRunState>();
    const getOwnerState = (owner: string): OwnerRunState => {
      let st = ownerState.get(owner);
      if (!st) {
        st = { sent: 0, failures: 0, noSender: false, dailyRemaining: null };
        ownerState.set(owner, st);
      }
      return st;
    };

    // Writes for a lead this run is NOT sending to. Never touches a lead another run has claimed.
    const reschedule = (lead: any, set: Record<string, any>) =>
      LeadModel.updateOne(
        { _id: lead._id, $or: [{ seqLockUntil: null }, { seqLockUntil: { $lte: new Date() } }] },
        { $set: set }
      );

    const appUrl = emailLinkBaseUrl(req.nextUrl.origin);

    for (const lead of activeLeads) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        timedOut = true;
        break;
      }

      // Each lead is isolated: a malformed page or step affects only that lead, never the whole run.
      let claimed = false;
      try {
        if (!lead.pageId && !lead.page) {
          debugLogs.push({ leadId: lead.id, reason: "No pageId or page" });
          await reschedule(lead, { seqNextAt: new Date(now + NO_PAGE_RECHECK_MS) });
          continue;
        }

        // Map lookup — zero DB calls
        let pageDoc: any = lead.pageId ? pageById.get(lead.pageId) : null;
        if (!pageDoc && lead.page) {
          const candidate: any = pageByName.get(lead.page);
          if (candidate && (!lead.userEmail || !candidate.userEmail || candidate.userEmail.toLowerCase().trim() === lead.userEmail.toLowerCase().trim())) {
            pageDoc = candidate;
          }
        }

        if (!pageDoc) {
          debugLogs.push({ leadId: lead.id, pageId: lead.pageId, reason: "Page doc not found in DB" });
          await reschedule(lead, { seqNextAt: new Date(now + NO_PAGE_RECHECK_MS) });
          continue;
        }

        const ownerEmail = (pageDoc.userEmail || lead.userEmail || "").toLowerCase().trim();
        const ownerAccount: any = accountByEmail.get(ownerEmail) || null;

        if (!allowedSeqPageIds.has(pageDoc.id)) {
          debugLogs.push({ leadId: lead.id, pageId: pageDoc.id, reason: "Sequence paused or over the plan's sequence limit" });
          await reschedule(lead, { seqNextAt: new Date(now + PAUSED_RECHECK_MS) });
          continue;
        }

        const sequenceEmails: any[] = Array.isArray(pageDoc.sequenceEmails) ? pageDoc.sequenceEmails : [];
        if (sequenceEmails.length === 0) {
          debugLogs.push({ leadId: lead.id, pageId: pageDoc.id, reason: "No sequenceEmails on page doc" });
          await reschedule(lead, { seqNextAt: new Date(now + PAUSED_RECHECK_MS) });
          continue;
        }

        if ((lead.seqFailCount || 0) >= MAX_SEND_FAILURES) {
          // e.g. a dashboard save restored an old status on a lead the engine had already stopped
          await reschedule(lead, { status: "stopped", sequenceStep: "Stopped: delivery failed" });
          continue;
        }

        const recipient = String(lead.email || "").trim().toLowerCase();
        if (!isValidEmailAddress(recipient)) {
          debugLogs.push({ leadId: lead.id, reason: "Invalid recipient address" });
          await reschedule(lead, { status: "stopped", sequenceStep: "Stopped: invalid email", seqLastError: "Invalid email address" });
          continue;
        }

        const sentKey = `${recipient}_${pageDoc.id || ""}`;
        const sentEntry = sentEventsMap.get(sentKey) || { stepIds: new Set<string>(), lastSentTime: 0 };
        const sentStepIds = new Set<string>([...Array.from(sentEntry.stepIds), ...(lead.seqSentSteps || [])]);

        // Find the first sequence email in sequenceEmails that hasn't been sent to this lead yet.
        // Malformed entries (null, strings) are skipped rather than crashing the run.
        let nextEmailIndex = -1;
        for (let idx = 0; idx < sequenceEmails.length; idx++) {
          const item = sequenceEmails[idx];
          if (!item || typeof item !== "object") continue;
          const stepIdentifier = item.id || `step_${idx + 1}`;
          const altIdentifier = `se_${pageDoc.id}_${idx + 1}`;
          if (!sentStepIds.has(stepIdentifier) && !sentStepIds.has(altIdentifier)) {
            nextEmailIndex = idx;
            break;
          }
        }

        if (nextEmailIndex === -1) {
          await reschedule(lead, { sequenceStep: "Completed", status: "completed", seqNextAt: null });
          debugLogs.push({ leadId: lead.id, reason: "All sequence steps already delivered" });
          continue;
        }

        const parsedDate = parseFlexibleDate(lead.signedUpAt);
        let signupTime = parsedDate ? parsedDate.getTime() : NaN;

        // If signupTime is NaN or in the future (caused by client localized date string timezone offset),
        // resolve the exact UTC creation timestamp directly from MongoDB _id or createdAt.
        if (isNaN(signupTime) || signupTime > now) {
          if (lead.createdAt) {
            const parsedCreated = parseFlexibleDate(lead.createdAt);
            if (parsedCreated && parsedCreated.getTime() <= now) {
              signupTime = parsedCreated.getTime();
            }
          }
          if (isNaN(signupTime) || signupTime > now) {
            if (lead._id && typeof lead._id.getTimestamp === "function") {
              signupTime = lead._id.getTimestamp().getTime();
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

        const nextEmail = sequenceEmails[nextEmailIndex];
        const stepRequiredDelay = stepDelayMinutes(nextEmail);
        const dueAt = baseTime + stepRequiredDelay * MINUTE;

        if (now < dueAt) {
          // Not due yet: the next run that needs to look at this lead is the one after dueAt
          await reschedule(lead, { seqNextAt: new Date(dueAt) });
          continue;
        }

        // Per-owner volume limits protect the owner's Gmail quota and sender reputation
        const st = getOwnerState(ownerEmail);
        if (st.noSender) {
          await reschedule(lead, { seqNextAt: new Date(now + NO_SENDER_RETRY_MS) });
          deferredCount++;
          continue;
        }
        if (st.sent >= OWNER_SENDS_PER_RUN || st.failures >= OWNER_FAILURES_PER_RUN) {
          await reschedule(lead, { seqNextAt: new Date(now + OWNER_DEFERRED_RETRY_MS) });
          deferredCount++;
          continue;
        }
        if (st.dailyRemaining === null) {
          st.dailyRemaining = LEAD_EMAIL_DAILY_CAP - (await countOwnerLeadEmailsLast24h(ownerEmail));
        }
        if (st.dailyRemaining <= 0) {
          await reschedule(lead, { seqNextAt: new Date(now + DAILY_CAP_RETRY_MS) });
          deferredCount++;
          continue;
        }

        const stepId = nextEmail.id || `step_${nextEmailIndex + 1}`;
        const altStepId = `se_${pageDoc.id}_${nextEmailIndex + 1}`;

        // Claim the lead. Only one run can hold it; the filter also re-checks unsubscribe/stop,
        // which may have changed since the batch was read.
        const claim: any = await LeadModel.findOneAndUpdate(
          {
            _id: lead._id,
            status: { $nin: ["stopped", "completed", "pending_email"] },
            unsubscribedAt: null,
            $or: [{ seqLockUntil: null }, { seqLockUntil: { $lte: new Date() } }],
          },
          { $set: { seqLockUntil: new Date(Date.now() + LOCK_MS) } },
          { returnDocument: "after", projection: { seqSentSteps: 1 } }
        ).lean();
        if (!claim) continue;
        claimed = true;

        // Another run may have sent this step after our batch was read
        const alreadySent =
          (claim.seqSentSteps || []).includes(stepId) ||
          Boolean(await EmailEventModel.exists({
            recipientEmail: recipient,
            pageId: pageDoc.id,
            eventType: "sent",
            stepId: { $in: [stepId, altStepId] },
          }));
        if (alreadySent) {
          await LeadModel.updateOne(
            { _id: lead._id },
            { $set: { seqLockUntil: null, seqNextAt: null }, $addToSet: { seqSentSteps: stepId } }
          );
          claimed = false;
          continue;
        }

        processedCount++;

        const { subject, html } = renderSequenceEmail({
          appUrl,
          pageName: String(pageDoc.name || ""),
          stepSubject: nextEmail.subject,
          stepBody: nextEmail.body,
          leadName: String(lead.name || "").trim() || "there",
          leadEmail: recipient,
          senderName: ownerAccount?.senderDisplayName || ownerAccount?.name || "Funnels",
        });

        const sendResult = await sendMail(
          {
            to: recipient,
            subject,
            // Download links only work with an access token (lib/magnet-access.ts)
            html: await signDownloadLinks(html, ownerEmail || lead.userEmail),
            tracking: {
              leadId: lead.id,
              pageId: pageDoc.id || lead.pageId,
              sequenceId: pageDoc.id,
              stepId,
              userEmail: ownerEmail || lead.userEmail,
              recipient,
            },
            unsubscribeLeadId: lead.id,
          },
          ownerEmail || lead.userEmail
        );

        if (sendResult.success) {
          deliveredCount++;
          st.sent++;
          st.dailyRemaining--;

          const isLastStep = nextEmailIndex + 1 >= sequenceEmails.length;
          const following = isLastStep ? null : sequenceEmails[nextEmailIndex + 1];
          await LeadModel.updateOne(
            { _id: lead._id },
            {
              $set: {
                sequenceStep: isLastStep
                  ? "Completed"
                  : `Step ${nextEmailIndex + 2} of ${sequenceEmails.length} (In Progress)`,
                status: isLastStep ? "completed" : "delivered",
                seqNextAt: following ? new Date(Date.now() + stepDelayMinutes(following) * MINUTE) : null,
                seqLockUntil: null,
                seqFailCount: 0,
                seqLastError: "",
              },
              $addToSet: { seqSentSteps: stepId },
            }
          );
          claimed = false;
          debugLogs.push({ leadId: lead.id, status: "SUCCESS", step: nextEmailIndex + 1 });
          continue;
        }

        // Failed: the lead stays on this step and retries later; it is never advanced past an unsent email.
        if (sendResult.errorCode === "NO_SENDER") {
          // The owner has no Gmail/SMTP connected. Not the lead's fault: wait without counting a failure.
          st.noSender = true;
          deferredCount++;
          await LeadModel.updateOne(
            { _id: lead._id },
            { $set: { seqLockUntil: null, seqNextAt: new Date(Date.now() + NO_SENDER_RETRY_MS), seqLastError: sendResult.error || "No sender connected" } }
          );
        } else if (sendResult.errorCode === "INVALID_RECIPIENT") {
          failedCount++;
          await LeadModel.updateOne(
            { _id: lead._id },
            { $set: { seqLockUntil: null, status: "stopped", sequenceStep: "Stopped: invalid email", seqLastError: "Invalid email address" } }
          );
        } else {
          failedCount++;
          st.failures++;
          await recordFailure(lead, sendResult.error || "Send failed");
        }
        claimed = false;
        debugLogs.push({ leadId: lead.id, status: "FAILED", code: sendResult.errorCode, error: sendResult.error });
      } catch (err: any) {
        errorCount++;
        console.error(`[cron/process-sequences] Lead ${lead.id} failed:`, err);
        if (claimed) {
          await recordFailure(lead, err?.message || "Processing error").catch((e) =>
            console.error("[cron/process-sequences] Could not record failure:", e)
          );
        }
      }
    }

    if (debugLogs.length > 0) console.log("[cron/process-sequences]", JSON.stringify(debugLogs));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeLeadsChecked: activeLeads.length,
      processedCount,
      deliveredCount,
      failedCount,
      deferredCount,
      errorCount,
      timedOut,
    });
  } catch (error: any) {
    console.error("Sequence Cron Execution Error:", error);
    return NextResponse.json({ error: "Sequence processing failed" }, { status: 500 });
  }
}

// Counts a delivery failure, releases the claim, and backs off; stops the lead after MAX_SEND_FAILURES.
async function recordFailure(lead: any, message: string) {
  const failCount = (lead.seqFailCount || 0) + 1;
  const giveUp = failCount >= MAX_SEND_FAILURES;
  await LeadModel.updateOne(
    { _id: lead._id },
    {
      $set: {
        seqLockUntil: null,
        seqFailCount: failCount,
        seqLastError: String(message).slice(0, 300),
        ...(giveUp
          ? { status: "stopped", sequenceStep: "Stopped: delivery failed" }
          : { seqNextAt: new Date(Date.now() + failureBackoffMs(failCount)) }),
      },
    }
  );
}

// Private-use placeholders: merge fields are filled in only after links are auto-linked,
// so a lead's name or email can never become a clickable link.
const NAME_TOKEN = "LM_NAME";
const EMAIL_TOKEN = "LM_EMAIL";

function renderSequenceEmail(input: {
  appUrl: string;
  pageName: string;
  stepSubject: unknown;
  stepBody: unknown;
  leadName: string;
  leadEmail: string;
  senderName: string;
}): { subject: string; html: string } {
  const { appUrl, pageName, leadName, leadEmail, senderName } = input;
  const logoUrl = `${appUrl}/brand/custom-logo-light.png`;

  // Plain text (header); escaped wherever it is placed in the HTML
  const formattedSubject = String(input.stepSubject || `Follow-up on ${pageName}`)
    .replace(/\{name\}/gi, leadName)
    .replace(/[\r\n]+/g, " ")
    .trim();

  const rawBody = String(input.stepBody || `Hi {name},\n\nJust checking in to see if you had a chance to look at ${pageName}! Let me know if you have any questions.\n\nBest regards`)
    .replace(/\{name\}/gi, NAME_TOKEN)
    .replace(/\{email\}/gi, EMAIL_TOKEN);

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

  // Clean up localhost occurrences in body text
  formattedBodyHtml = formattedBodyHtml.replace(/http:\/\/localhost:3000/g, appUrl);

  // Convert bare URLs into clean styled links if not already wrapped
  formattedBodyHtml = formattedBodyHtml.replace(
    /(?<!href=["']|src=["'])(https?:\/\/[^\s<]+)/g,
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

  // Lead-supplied values are escaped and inserted last
  formattedBodyHtml = formattedBodyHtml
    .split(NAME_TOKEN).join(escapeHtml(leadName))
    .split(EMAIL_TOKEN).join(escapeHtml(leadEmail));

  const senderInitials = (senderName || "LM")
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "LM";

  const safeSubject = escapeHtml(formattedSubject);
  const safeSenderName = escapeHtml(senderName);
  const safeInitials = escapeHtml(senderInitials);
  const safePageName = escapeHtml(pageName);

  const htmlBody = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeSubject}</title>
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
                      <img src="${logoUrl}" alt="Funnels" height="26" style="height:26px; width:auto; max-height:30px; display:block; border:0; outline:none;" />
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
                      ${safeSubject}
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
                                ${safeInitials}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left:12px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                          <p style="margin:0 0 3px 0; font-size:10px; color:#7b858c;">Sent by</p>
                          <p style="margin:0; font-size:12px; font-weight:600; color:#2a3138;">${safeSenderName}</p>
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
                You&rsquo;re receiving this email because you subscribed to <strong>${safePageName}</strong>.
              </p>
              <p style="margin:8px 0 0 0; font-size:11px; color:#7b858c;">
                Powered by <a href="${appUrl}" target="_blank" style="color:#2a3138; font-weight:500; text-decoration:none;">Funnels</a>
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

  return { subject: formattedSubject, html: htmlBody };
}


import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { EmailEventModel, LeadModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const days = parseInt(request.nextUrl.searchParams.get("period") || "7", 10);
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - (days === 30 ? 30 : 7));

  const [
    platformCounts,
    perUserStats,
    recentProblems,
    failedLeadGroups,
    pendingLeads,
  ] = await Promise.all([
    // 1. Platform-wide counts — opened and clicked deduplicated per lead+step so historical
    // duplicate rows (from pre-fix pixel + webhook double-writes) don't inflate rates.
    // Stage A: collapse duplicates into one row per (eventType, lead, step).
    // Stage B: count collapsed rows per eventType.
    // - opened/clicked/delivered: deduplicated per lead+step because:
    //     • opened/clicked: tracking pixel + ESP webhook both fire for the same event.
    //     • delivered: logEmailEvent writes one at send time AND the ESP webhook writes another on actual delivery.
    // - sent/bounced/complained: each raw row counts once (always unique events).
    // $ifNull is intentionally NOT used for the lead key because MongoDB treats "" as a valid
    // non-null value — an empty string leadId would never fall back to recipientEmail.
    // The $cond below explicitly checks for both null and "".
    EmailEventModel.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      {
        $group: {
          _id: {
            eventType: "$eventType",
            dedupeKey: {
              $cond: {
                if: { $in: ["$eventType", ["opened", "clicked", "delivered"]] },
                then: {
                  lead: {
                    $cond: {
                      if: { $and: [{ $ne: ["$leadId", null] }, { $ne: ["$leadId", ""] }] },
                      then: "$leadId",
                      else: "$recipientEmail",
                    },
                  },
                  step: "$stepId",
                },
                else: "$_id",
              },
            },
          },
        },
      },
      { $group: { _id: "$_id.eventType", count: { $sum: 1 } } },
    ]),

    // 2. Per-user breakdown — opened/clicked/delivered deduplicated per lead+step.
    EmailEventModel.aggregate([
      { $match: { createdAt: { $gte: periodStart } } },
      // Stage A: collapse duplicate rows — same dedup logic as platform counts above
      {
        $group: {
          _id: {
            userEmail: "$userEmail",
            eventType: "$eventType",
            dedupeKey: {
              $cond: {
                if: { $in: ["$eventType", ["opened", "clicked", "delivered"]] },
                then: {
                  lead: {
                    $cond: {
                      if: { $and: [{ $ne: ["$leadId", null] }, { $ne: ["$leadId", ""] }] },
                      then: "$leadId",
                      else: "$recipientEmail",
                    },
                  },
                  step: "$stepId",
                },
                else: "$_id",
              },
            },
          },
        },
      },
      // Stage B: pivot deduplicated rows into per-user counters
      {
        $group: {
          _id: "$_id.userEmail",
          sent:       { $sum: { $cond: [{ $eq: ["$_id.eventType", "sent"] },       1, 0] } },
          delivered:  { $sum: { $cond: [{ $eq: ["$_id.eventType", "delivered"] },  1, 0] } },
          opened:     { $sum: { $cond: [{ $eq: ["$_id.eventType", "opened"] },     1, 0] } },
          bounced:    { $sum: { $cond: [{ $eq: ["$_id.eventType", "bounced"] },    1, 0] } },
          complained: { $sum: { $cond: [{ $eq: ["$_id.eventType", "complained"] }, 1, 0] } },
        },
      },
      { $match: { sent: { $gt: 0 } } },
      {
        $addFields: {
          bounceRate:    { $divide: ["$bounced",    "$sent"] },
          complaintRate: { $divide: ["$complained", "$sent"] },
          openRate: {
            $cond: [
              { $gt: ["$delivered", 0] },
              { $divide: ["$opened", "$delivered"] },
              0,
            ],
          },
        },
      },
      { $sort: { bounceRate: -1, complaintRate: -1 } },
      { $limit: 30 },
    ]),

    // 3. Recent bounce & complaint events
    EmailEventModel.find(
      {
        eventType: { $in: ["bounced", "complained"] },
        createdAt: { $gte: periodStart },
      },
      {
        // recipientEmail excluded — lead personal data; admin needs delivery stats only
        userEmail: 1, eventType: 1,
        subject: 1, createdAt: 1, sequenceId: 1, pageId: 1, messageId: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),

    // 4. Sequences with persistent failures (leads stuck with seqFailCount > 3)
    LeadModel.aggregate([
      { $match: { seqFailCount: { $gt: 3 } } },
      {
        $group: {
          _id: {
            sequenceId: "$sequence",
            userEmail:  "$userEmail",
          },
          failedLeads:  { $sum: 1 },
          maxFailCount: { $max: "$seqFailCount" },
          lastError:    { $first: "$seqLastError" },
          pageId:       { $first: "$pageId" },
          // sampleEmails excluded — individual lead emails are third-party personal data
        },
      },
      { $sort: { failedLeads: -1, maxFailCount: -1 } },
      { $limit: 20 },
    ]),

    // 5. Leads stuck in pending_email that are genuinely waiting for email delivery.
    // LinkedIn leads legitimately sit in pending_email while awaiting contact info from the
    // LinkedIn extension — they are not stuck, so they are excluded from this warning.
    LeadModel.countDocuments({ status: "pending_email", source: { $ne: "linkedin-comment" } }),
  ]);

  // Build platform stats map
  const statsMap: Record<string, number> = {};
  for (const { _id, count } of platformCounts as any[]) {
    if (_id) statsMap[_id] = count;
  }

  const sent       = statsMap["sent"]       || 0;
  const delivered  = statsMap["delivered"]  || 0;
  const opened     = statsMap["opened"]     || 0;
  const clicked    = statsMap["clicked"]    || 0;
  const bounced    = statsMap["bounced"]    || 0;
  const complained = statsMap["complained"] || 0;

  const platform = {
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    complained,
    deliveryRate:  sent      > 0 ? (delivered  / sent)      * 100 : null,
    openRate:      delivered > 0 ? (opened     / delivered) * 100 : null,
    clickRate:     opened    > 0 ? (clicked    / opened)    * 100 : null,
    bounceRate:    sent      > 0 ? (bounced    / sent)      * 100 : null,
    complaintRate: sent      > 0 ? (complained / sent)      * 100 : null,
  };

  const perUser = (perUserStats as any[]).map((u) => ({
    email:         u._id || "",
    sent:          u.sent,
    delivered:     u.delivered,
    opened:        u.opened,
    bounced:       u.bounced,
    complained:    u.complained,
    bounceRate:    u.bounceRate    * 100,
    complaintRate: u.complaintRate * 100,
    openRate:      u.openRate      * 100,
  }));

  const problems = (recentProblems as any[]).map((e) => ({
    eventType:  e.eventType,
    userEmail:  e.userEmail  || "",
    // recipientEmail omitted — lead's personal email address; not needed for admin diagnostics
    subject:    e.subject    || "(no subject)",
    sequenceId: e.sequenceId || "",
    pageId:     e.pageId     || "",
    createdAt:  e.createdAt,
  }));

  const failedSequences = (failedLeadGroups as any[]).map((g) => ({
    sequenceId:   g._id.sequenceId || "",
    userEmail:    g._id.userEmail  || "",
    pageId:       g.pageId         || "",
    failedLeads:  g.failedLeads,
    maxFailCount: g.maxFailCount,
    lastError:    g.lastError      || "",
    // sampleEmails omitted — lead email addresses are third-party personal data
  }));

  return NextResponse.json({
    period: days,
    platform,
    perUser,
    problems,
    failedSequences,
    pendingLeads,
  }, { headers: { "Cache-Control": "private, max-age=60" } });
}

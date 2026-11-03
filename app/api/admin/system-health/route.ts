import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, AccountModel, EmailEventModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const now = new Date();

  const [
    // Sequence cron signals
    lastEmailEvent,
    overdueLeads,
    staleLockedLeads,
    currentlyLockedLeads,
    pendingEmailLeads,

    // Failed sequences
    highFailLeadGroups,
    highFailTotal,

    // LinkedIn cron
    linkedinConnected,
    linkedinCampaignUsers,

    // SSL / domain health
    sslFailedAccounts,
    sslPendingVerified,
    sslActiveCount,

    // General queue size
    activeSequenceLeads,
  ] = await Promise.all([
    // Last time the sequence cron successfully sent an email
    EmailEventModel.findOne(
      { eventType: "sent" },
      { createdAt: 1 }
    ).sort({ createdAt: -1 }).lean(),

    // Leads that are due but haven't been processed (seqNextAt is in the past)
    LeadModel.countDocuments({
      status: { $nin: ["stopped", "completed", "pending_email"] },
      unsubscribedAt: null,
      sequenceStep: { $exists: true, $nin: ["", "Completed"] },
      seqNextAt: { $lte: now, $ne: null },
      $or: [{ seqLockUntil: null }, { seqLockUntil: { $lte: now } }],
    }),

    // Leads with stale lock (seqLockUntil was set but cron never cleared it — indicates a crash)
    LeadModel.countDocuments({
      seqLockUntil: { $lte: now, $ne: null },
      status: { $nin: ["stopped", "completed"] },
    }),

    // Leads currently being actively processed by the cron right now
    LeadModel.countDocuments({
      seqLockUntil: { $gt: now },
    }),

    // Leads stuck in pending_email (delivery system issue)
    LeadModel.countDocuments({ status: "pending_email" }),

    // Sequences with persistent failures — group by sequence + owner
    LeadModel.aggregate([
      { $match: { seqFailCount: { $gt: 3 } } },
      {
        $group: {
          _id: { sequence: "$sequence", userEmail: "$userEmail" },
          failedLeads:  { $sum: 1 },
          maxFailCount: { $max: "$seqFailCount" },
          lastError:    { $first: "$seqLastError" },
          pageId:       { $first: "$pageId" },
        },
      },
      { $sort: { failedLeads: -1 } },
      { $limit: 15 },
    ]),

    // Total count of leads with seqFailCount > 3
    LeadModel.countDocuments({ seqFailCount: { $gt: 3 } }),

    // LinkedIn
    AccountModel.countDocuments({ linkedinConnected: true }),
    AccountModel.countDocuments({
      "linkedinPostCampaigns.0": { $exists: true },
      "linkedinPostCampaigns.enabled": true,
    }),

    // SSL failures — include email + domain for the table
    AccountModel.find(
      { sslStatus: "failed", customDomain: { $nin: ["", null] } },
      { email: 1, customDomain: 1, customSubdomain: 1, domainVerified: 1, cnameVerified: 1 }
    ).sort({ _id: -1 }).limit(20).lean(),

    // SSL pending AND domain already verified (should have issued cert but didn't)
    AccountModel.countDocuments({
      sslStatus: "pending",
      domainVerified: true,
      cnameVerified: true,
      customDomain: { $nin: ["", null] },
    }),

    AccountModel.countDocuments({ sslStatus: "active" }),

    // Total active leads in any sequence
    LeadModel.countDocuments({
      status: { $nin: ["stopped", "completed", "pending_email"] },
      sequenceStep: { $exists: true, $nin: ["", "Completed"] },
      unsubscribedAt: null,
    }),
  ]);

  // Infer sequence cron staleness from last email sent time
  const lastSentAt = (lastEmailEvent as any)?.createdAt ?? null;
  let sequenceCronStatus: "healthy" | "warn" | "stale" | "unknown" = "unknown";
  let lastSentMinutesAgo: number | null = null;

  if (lastSentAt) {
    lastSentMinutesAgo = Math.floor((now.getTime() - new Date(lastSentAt).getTime()) / 60000);
    if (overdueLeads > 50 && lastSentMinutesAgo > 120)  sequenceCronStatus = "stale";
    else if (overdueLeads > 20 || lastSentMinutesAgo > 60) sequenceCronStatus = "warn";
    else sequenceCronStatus = "healthy";
  } else if (activeSequenceLeads > 0) {
    // Has active leads but never sent — cron may not be configured
    sequenceCronStatus = "stale";
  }

  const failedGroups = (highFailLeadGroups as any[]).map((g) => ({
    sequenceId: g._id.sequence || "",
    userEmail:  g._id.userEmail || "",
    pageId:     g.pageId || "",
    failedLeads: g.failedLeads,
    maxFailCount: g.maxFailCount,
    lastError:  g.lastError || "",
  }));

  const sslFailed = (sslFailedAccounts as any[]).map((a) => ({
    email:         a.email,
    customDomain:  a.customDomain,
    customSubdomain: a.customSubdomain || "get",
    domainVerified: Boolean(a.domainVerified),
    cnameVerified:  Boolean(a.cnameVerified),
  }));

  return NextResponse.json({
    generatedAt: now.toISOString(),

    sequenceCron: {
      status: sequenceCronStatus,
      lastSentAt,
      lastSentMinutesAgo,
      overdueLeads,
      staleLockedLeads,
      currentlyLockedLeads,
      pendingEmailLeads,
      activeSequenceLeads,
    },

    failedSequences: {
      totalAffectedLeads: highFailTotal,
      groups: failedGroups,
    },

    linkedinCron: {
      connectedAccounts: linkedinConnected,
      campaignUsers: linkedinCampaignUsers,
      // No run-time log stored in DB — status inferred from connected account count
      hasAccounts: linkedinConnected > 0,
    },

    sslHealth: {
      failedCount: sslFailed.length,
      pendingVerifiedCount: sslPendingVerified,
      activeCount: sslActiveCount,
      failedDomains: sslFailed,
    },
  });
}

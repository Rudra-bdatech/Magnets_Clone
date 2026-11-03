import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const [
    totalUsers,
    totalFunnels,

    // Integration counts
    gmailConnected,
    smtpConnected,
    slackConnected,
    zapierConnected,
    pipedriveConnected,
    kitConnected,
    linkedinConnected,
    calendarConnected,

    // Pixel / Analytics
    ga4Connected,
    metaPixelConnected,

    // Custom domain
    domainConfigured,
    domainVerified,
    sslActive,
    sslFailed,
    spfVerified,
    dkimVerified,

    // LinkedIn campaigns
    linkedinCampaignUsers,

    // Funnel features
    abTestingUsers,
    abTestsRunning,
    aiPersonalizedFunnels,
    aiPersonalizedUserEmails,
    quizFunnels,
    lockedPdfFunnels,
    sequenceEnabledFunnels,
    videoFunnels,

    // Template breakdown
    templateBreakdown,
  ] = await Promise.all([
    AccountModel.countDocuments({}),
    MagnetPageModel.countDocuments({}),

    // Integrations
    AccountModel.countDocuments({ "gmailOAuth.connected": true }),
    AccountModel.countDocuments({ "customSmtp.enabled": true, "customSmtp.isVerified": true }),
    AccountModel.countDocuments({ slackWebhookUrl: { $nin: ["", null] } }),
    AccountModel.countDocuments({ zapierWebhookUrl: { $nin: ["", null] } }),
    AccountModel.countDocuments({ pipedriveApiToken: { $nin: ["", null] } }),
    AccountModel.countDocuments({ kitConnected: true }),
    AccountModel.countDocuments({ linkedinConnected: true }),
    AccountModel.countDocuments({ calendarConnected: true }),

    // Pixel / Analytics
    AccountModel.countDocuments({ ga4MeasurementId: { $nin: ["", null] } }),
    AccountModel.countDocuments({ metaPixelId: { $nin: ["", null] } }),

    // Custom domain
    AccountModel.countDocuments({ customDomain: { $nin: ["", null] } }),
    AccountModel.countDocuments({ domainVerified: true, cnameVerified: true }),
    AccountModel.countDocuments({ sslStatus: "active" }),
    AccountModel.countDocuments({ sslStatus: "failed" }),
    AccountModel.countDocuments({ spfVerified: true }),
    AccountModel.countDocuments({ dkimVerified: true }),

    // LinkedIn campaigns (users with at least 1 active post campaign)
    AccountModel.countDocuments({
      "linkedinPostCampaigns.0": { $exists: true },
      "linkedinPostCampaigns.enabled": true,
    }),

    // A/B testing: distinct owners
    MagnetPageModel.distinct("userEmail", { hasVariantB: true }),
    MagnetPageModel.countDocuments({ testStarted: true }),

    // AI personalization
    MagnetPageModel.countDocuments({ enableAiPersonalizedDeliverable: true }),
    MagnetPageModel.distinct("userEmail", { enableAiPersonalizedDeliverable: true }),

    // Funnel feature counts
    MagnetPageModel.countDocuments({ quizFunnelEnabled: true }),
    MagnetPageModel.countDocuments({ "pdfPages.0": { $exists: true } }),
    MagnetPageModel.countDocuments({ sequenceEnabled: true }),
    MagnetPageModel.countDocuments({ videoUrl: { $nin: ["", null] } }),

    // Template breakdown
    MagnetPageModel.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$quizFunnelEnabled", true] },
              "quiz",
              {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ["$pdfPages", []] } }, 0] },
                  "locked-pdf",
                  {
                    $cond: [
                      { $and: [{ $ne: ["$videoUrl", ""] }, { $ne: ["$videoUrl", null] }] },
                      "video",
                      { $ifNull: ["$template", "classic"] },
                    ],
                  },
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return NextResponse.json({
    totalUsers,
    totalFunnels,

    integrations: {
      gmail: gmailConnected,
      smtp: smtpConnected,
      slack: slackConnected,
      zapier: zapierConnected,
      pipedrive: pipedriveConnected,
      kit: kitConnected,
      linkedin: linkedinConnected,
      calendar: calendarConnected,
    },

    tracking: {
      ga4: ga4Connected,
      metaPixel: metaPixelConnected,
    },

    customDomain: {
      configured: domainConfigured,
      verified: domainVerified,
      sslActive,
      sslFailed,
      spfVerified,
      dkimVerified,
    },

    linkedin: {
      connected: linkedinConnected,
      campaignUsers: linkedinCampaignUsers,
    },

    funnelFeatures: {
      abTestingUsers: (abTestingUsers as string[]).length,
      abTestsRunning,
      aiPersonalizedFunnels,
      aiPersonalizedUsers: (aiPersonalizedUserEmails as string[]).length,
      quizFunnels,
      lockedPdfFunnels,
      sequenceEnabledFunnels,
      videoFunnels,
    },

    templateBreakdown: (templateBreakdown as { _id: string; count: number }[]).map((t) => ({
      template: t._id || "classic",
      count: t.count,
    })),
  });
}

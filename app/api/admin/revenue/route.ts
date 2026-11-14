import { NextResponse } from "next/server";
import { PLAN_PRICING } from "@/lib/billing";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    planBreakdown,
    providerBreakdown,
    statusBreakdown,
    recentConversions,
    recentSignups,
  ] = await Promise.all([
    AccountModel.countDocuments({}),

    AccountModel.aggregate([
      { $group: { _id: { $ifNull: ["$plan", "Free"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    AccountModel.aggregate([
      { $match: { plan: "Pro" } },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ["$stripeSubscriptionId", ""] },
              "stripe",
              {
                $cond: [
                  { $gt: ["$chargebeeSubscriptionId", ""] },
                  "chargebee",
                  "other",
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]),

    AccountModel.aggregate([
      { $match: { plan: "Pro" } },
      {
        $group: {
          _id: { $ifNull: ["$paymentStatus", "unknown"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Users who became Pro in the last 30 days
    AccountModel.find(
      {
        plan: "Pro",
        lastPaymentDate: { $gte: thirtyDaysAgo },
      },
      {
        email: 1,
        name: 1,
        paymentProvider: 1,
        paymentStatus: 1,
        lastPaymentDate: 1,
        stripeSubscriptionId: 1,
        chargebeeSubscriptionId: 1,
        chargebeeInvoiceId: 1,
      }
    )
      .sort({ lastPaymentDate: -1 })
      .limit(20)
      .lean(),

    // All signups in last 30 days
    AccountModel.countDocuments({ joinedAt: { $gte: thirtyDaysAgo } }),
  ]);

  // Compute plan counts
  const planMap: Record<string, number> = {};
  for (const { _id, count } of planBreakdown as any[]) {
    planMap[_id || "Free"] = count;
  }
  const proUsers = planMap["Pro"] || 0;
  const freeUsers = planMap["Free"] || 0;

  // Provider counts among Pro users
  const providerMap: Record<string, number> = {};
  for (const { _id, count } of providerBreakdown as any[]) {
    providerMap[_id] = count;
  }
  const stripeProUsers = providerMap["stripe"] || 0;
  // Chargebee can be INR one-time OR USD monthly — we can't fully distinguish from DB
  const chargebeeProUsers = providerMap["chargebee"] || 0;
  const otherProUsers = providerMap["other"] || 0;

  // Status breakdown
  const statusMap: Record<string, number> = {};
  for (const { _id, count } of statusBreakdown as any[]) {
    statusMap[_id] = count;
  }

  // Revenue estimates
  // Stripe Pro = $67/month USD recurring
  const mrrUsd = stripeProUsers * 67;
  // Chargebee Pro = ₹299/month subscription (GST inclusive). Old ₹4,999 lifetime buyers move to
  // plan "Free" + lifetimeCustomDomain on their next sign-in, so this is an estimate until then.
  const mrrInr = chargebeeProUsers * PLAN_PRICING.PRO_MONTHLY_INR.amount;
  // Custom domain = separate one-time ₹4,999 purchase (lifetimeCustomDomain)
  const lifetimeDomainUsers = await AccountModel.countDocuments({ lifetimeCustomDomain: true });
  const lifetimeDomainRevenueInr = lifetimeDomainUsers * PLAN_PRICING.PRO_INR.amount;

  const conversions = (recentConversions as any[]).map((u) => {
    const isStripe = Boolean(u.stripeSubscriptionId);
    const isChargebee = Boolean(u.chargebeeSubscriptionId);
    return {
      email: u.email,
      name: u.name || "",
      provider: isStripe ? "stripe" : isChargebee ? "chargebee" : u.paymentProvider || "unknown",
      paymentStatus: u.paymentStatus || "",
      lastPaymentDate: u.lastPaymentDate,
      isRecurring: isStripe,
    };
  });

  return NextResponse.json({
    totalUsers,
    proUsers,
    freeUsers,
    otherPlanUsers: totalUsers - proUsers - freeUsers,
    recentSignups,

    // Revenue breakdown
    stripeProUsers,      // USD $67/month recurring
    chargebeeProUsers,   // INR ₹4,999 one-time (primarily)
    otherProUsers,

    mrrUsd,                    // confirmed MRR from Stripe
    mrrInr,      // estimated INR monthly recurring revenue
    lifetimeDomainUsers,
    lifetimeDomainRevenueInr, // estimated one-time custom domain revenue (INR)

    // Payment status among Pro users
    activeProUsers: statusMap["active"] || 0,
    cancelledProUsers: statusMap["cancelled"] || 0,
    unknownStatusProUsers: statusMap["unknown"] || 0,

    recentConversions: conversions,
  }, { headers: { "Cache-Control": "private, max-age=60" } });
}

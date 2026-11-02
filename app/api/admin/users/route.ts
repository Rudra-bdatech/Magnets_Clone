import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";
import { determineRoleForEmail } from "@/lib/roles";

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const search = searchParams.get("search")?.trim() || "";
  const planFilter = searchParams.get("plan") || "";
  const roleFilter = searchParams.get("role") || "";

  const query: Record<string, any> = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }
  if (planFilter) query.plan = planFilter;
  if (roleFilter) query.role = roleFilter;

  const projection = {
    email: 1, name: 1, plan: 1, role: 1, paymentStatus: 1, paymentProvider: 1,
    emailVerified: 1, joinedAt: 1, customDomain: 1, linkedinConnected: 1,
    "gmailOAuth.connected": 1, "customSmtp.enabled": 1, "customSmtp.isVerified": 1,
    stripeSubscriptionId: 1, chargebeeSubscriptionId: 1,
  };

  const [accounts, total] = await Promise.all([
    AccountModel.find(query, projection)
      .sort({ _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    AccountModel.countDocuments(query),
  ]);

  const emails = (accounts as any[]).map((a) => a.email);

  const [magnetCounts, leadCounts] = await Promise.all([
    MagnetPageModel.aggregate([
      { $match: { userEmail: { $in: emails } } },
      { $group: { _id: "$userEmail", count: { $sum: 1 } } },
    ]),
    LeadModel.aggregate([
      { $match: { userEmail: { $in: emails } } },
      { $group: { _id: "$userEmail", count: { $sum: 1 } } },
    ]),
  ]);

  const magnetMap = new Map<string, number>(magnetCounts.map((m: any) => [m._id, m.count]));
  const leadMap = new Map<string, number>(leadCounts.map((l: any) => [l._id, l.count]));

  const users = (accounts as any[]).map((a) => {
    const computedRole = determineRoleForEmail(a.email);
    const effectiveRole =
      computedRole === "super_admin" ? "super_admin" : (a.role || computedRole);
    return {
      email: a.email,
      name: a.name,
      plan: a.plan || "Free",
      role: effectiveRole,
      paymentStatus: a.paymentStatus || "",
      paymentProvider: a.paymentProvider || "",
      emailVerified: Boolean(a.emailVerified),
      joinedAt: a.joinedAt || "",
      customDomain: a.customDomain || "",
      linkedinConnected: Boolean(a.linkedinConnected),
      gmailConnected: Boolean(a.gmailOAuth?.connected),
      smtpConnected: Boolean(a.customSmtp?.enabled && a.customSmtp?.isVerified),
      hasPaidSubscription: Boolean(a.stripeSubscriptionId || a.chargebeeSubscriptionId),
      magnetCount: magnetMap.get(a.email) || 0,
      leadCount: leadMap.get(a.email) || 0,
    };
  });

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}

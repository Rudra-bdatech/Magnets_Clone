import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, ResourceModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";
import { determineRoleForEmail, getSuperAdminEmails } from "@/lib/roles";

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
  const dateRange = searchParams.get("dateRange") || "";
  const startDateStr = searchParams.get("startDate") || "";
  const endDateStr = searchParams.get("endDate") || "";

  const superAdminEmails = getSuperAdminEmails();

  // Self-heal: ensure designated system super admin accounts have their DB role in sync
  if (superAdminEmails.length > 0) {
    AccountModel.updateMany(
      { email: { $in: superAdminEmails }, role: { $ne: "super_admin" } },
      { $set: { role: "super_admin" } }
    ).catch(() => {});
  }

  const andConditions: any[] = [];
  if (search) {
    andConditions.push({
      $or: [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { signupCity: { $regex: search, $options: "i" } },
        { signupCountry: { $regex: search, $options: "i" } },
      ],
    });
  }
  if (planFilter) andConditions.push({ plan: planFilter });

  if (roleFilter === "super_admin") {
    andConditions.push({
      $or: [
        { role: "super_admin" },
        { email: { $in: superAdminEmails } },
      ],
    });
  } else if (roleFilter === "user") {
    andConditions.push({
      role: { $ne: "super_admin" },
      email: { $nin: superAdminEmails },
    });
  }

  // Date Range Filtering using ObjectId timestamp encoding
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (dateRange === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "90d") {
    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "custom") {
    if (startDateStr) startDate = new Date(startDateStr);
    if (endDateStr) {
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  function dateToObjectId(date: Date, padHex: string): mongoose.Types.ObjectId {
    const timestamp = Math.floor(date.getTime() / 1000);
    const hex = timestamp.toString(16).padStart(8, "0") + padHex;
    return new mongoose.Types.ObjectId(hex);
  }

  if (startDate && endDate) {
    const minId = dateToObjectId(startDate, "0000000000000000");
    const maxId = dateToObjectId(endDate, "ffffffffffffffff");
    andConditions.push({ _id: { $gte: minId, $lte: maxId } });
  } else if (startDate) {
    const minId = dateToObjectId(startDate, "0000000000000000");
    andConditions.push({ _id: { $gte: minId } });
  } else if (endDate) {
    const maxId = dateToObjectId(endDate, "ffffffffffffffff");
    andConditions.push({ _id: { $lte: maxId } });
  }

  const query: Record<string, any> = andConditions.length > 0 ? { $and: andConditions } : {};

  const projection = {
    email: 1, name: 1, plan: 1, role: 1, paymentStatus: 1, paymentProvider: 1,
    emailVerified: 1, joinedAt: 1, customDomain: 1, linkedinConnected: 1,
    "gmailOAuth.connected": 1, "customSmtp.enabled": 1, "customSmtp.isVerified": 1,
    stripeSubscriptionId: 1, chargebeeSubscriptionId: 1, suspended: 1,
    signupCountry: 1, signupCountryCode: 1, signupCity: 1, signupRegion: 1, signupIp: 1,
  };

  const [accounts, total, summaryAgg] = await Promise.all([
    AccountModel.find(query, projection)
      .sort({ _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    AccountModel.countDocuments(query),
    AccountModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          verifiedCount: {
            $sum: { $cond: [{ $eq: ["$emailVerified", true] }, 1, 0] },
          },
          paidCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $gt: ["$stripeSubscriptionId", null] },
                    { $gt: ["$chargebeeSubscriptionId", null] },
                    { $and: [{ $ne: ["$plan", "Free"] }, { $ne: ["$plan", ""] }, { $ne: ["$plan", null] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          adminCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$role", "super_admin"] },
                    { $in: ["$email", superAdminEmails] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const emails = (accounts as any[]).map((a) => a.email);

  const [magnetCounts, leadCounts, storageCounts] = await Promise.all([
    MagnetPageModel.aggregate([
      { $match: { userEmail: { $in: emails } } },
      { $group: { _id: "$userEmail", count: { $sum: 1 } } },
    ]),
    LeadModel.aggregate([
      { $match: { userEmail: { $in: emails } } },
      { $group: { _id: "$userEmail", count: { $sum: 1 } } },
    ]),
    ResourceModel.aggregate([
      { $match: { userEmail: { $in: emails } } },
      { $group: { _id: "$userEmail", totalBytes: { $sum: "$size" } } },
    ]),
  ]);

  const magnetMap = new Map<string, number>(magnetCounts.map((m: any) => [m._id, m.count]));
  const leadMap = new Map<string, number>(leadCounts.map((l: any) => [l._id, l.count]));
  const storageMap = new Map<string, number>(storageCounts.map((s: any) => [s._id, s.totalBytes]));

  const users = (accounts as any[]).map((a) => {
    const computedRole = determineRoleForEmail(a.email);
    const effectiveRole =
      computedRole === "super_admin" ? "super_admin" : (a.role || computedRole);
    const isDesignated = superAdminEmails.includes(a.email ? a.email.toLowerCase().trim() : "");
    return {
      email: a.email,
      name: a.name,
      plan: a.plan || "Free",
      role: effectiveRole,
      isDesignatedSuperAdmin: isDesignated,
      paymentStatus: a.paymentStatus || "",
      paymentProvider: a.paymentProvider || "",
      emailVerified: Boolean(a.emailVerified),
      joinedAt: a._id ? new Date(parseInt(a._id.toString().substring(0, 8), 16) * 1000).toISOString() : (a.joinedAt || ""),
      customDomain: a.customDomain || "",
      linkedinConnected: Boolean(a.linkedinConnected),
      gmailConnected: Boolean(a.gmailOAuth?.connected),
      smtpConnected: Boolean(a.customSmtp?.enabled && a.customSmtp?.isVerified),
      hasPaidSubscription: Boolean(a.stripeSubscriptionId || a.chargebeeSubscriptionId),
      suspended: Boolean(a.suspended),
      signupCountry: a.signupCountry || "",
      signupCountryCode: a.signupCountryCode || "",
      signupCity: a.signupCity || "",
      signupRegion: a.signupRegion || "",
      signupIp: a.signupIp || "",
      magnetCount: magnetMap.get(a.email) || 0,
      leadCount: leadMap.get(a.email) || 0,
      storageBytes: storageMap.get(a.email) || 0,
    };
  });

  const summary = {
    totalAccounts: total,
    verifiedCount: summaryAgg[0]?.verifiedCount || 0,
    paidCount: summaryAgg[0]?.paidCount || 0,
    adminCount: summaryAgg[0]?.adminCount || 0,
  };

  return NextResponse.json({
    users,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
    summary,
  });
}

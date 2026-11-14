import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, ResourceModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";
import { getAccountAccess, hasCustomDomainAccess } from "@/lib/subscription";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Cache Cloudinary usage in-memory for 5 minutes to avoid exhausting Cloudinary Admin API rate limits
let cachedCloudinaryUsage: { data: any; expiresAt: number } | null = null;
const CLOUDINARY_CACHE_TTL_MS = 5 * 60 * 1000;

async function getCloudinaryUsageSafe() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return null;
  }
  const now = Date.now();
  if (cachedCloudinaryUsage && cachedCloudinaryUsage.expiresAt > now) {
    return cachedCloudinaryUsage.data;
  }
  try {
    const usage = await cloudinary.api.usage();
    cachedCloudinaryUsage = { data: usage, expiresAt: now + CLOUDINARY_CACHE_TTL_MS };
    return usage;
  } catch (err: any) {
    console.warn("[Admin Stats] Cloudinary API usage check failed:", err?.message || err);
    return cachedCloudinaryUsage?.data || null;
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // ObjectId encodes creation time in the first 4 bytes — use it to count new accounts
  const minId = new mongoose.Types.ObjectId(
    Math.floor(thirtyDaysAgo.getTime() / 1000).toString(16).padStart(8, "0") +
    "0000000000000000"
  );

  const [
    totalUsers,
    totalMagnets,
    totalLeads,
    newUsersLast30,
    byPlan,
    byRole,
    accessDocs,
    dbStorageAgg,
    topUsersAgg,
    categoryAgg,
    cloudinaryUsage,
  ] = await Promise.all([
    AccountModel.countDocuments(),
    MagnetPageModel.countDocuments(),
    LeadModel.countDocuments(),
    AccountModel.countDocuments({ _id: { $gte: minId } }),
    AccountModel.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    AccountModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    // Only the fields the trial/subscription rules read (lib/subscription.ts)
    AccountModel.find(
      {},
      { _id: 0, email: 1, role: 1, plan: 1, trialEndsAt: 1, trialReused: 1, subscriptionStatus: 1, currentPeriodEnd: 1, lifetimeCustomDomain: 1 }
    ).lean(),
    ResourceModel.aggregate([
      { $group: { _id: null, totalBytes: { $sum: "$size" }, totalFiles: { $sum: 1 } } },
    ]),
    ResourceModel.aggregate([
      { $match: { userEmail: { $exists: true, $ne: "" } } },
      { $group: { _id: "$userEmail", totalBytes: { $sum: "$size" }, totalFiles: { $sum: 1 } } },
      { $sort: { totalBytes: -1 } },
      { $limit: 15 },
    ]),
    ResourceModel.aggregate([
      {
        $project: {
          size: 1,
          ext: { $toLower: { $ifNull: ["$fileExt", ""] } },
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$ext", "pdf"] },
              "pdf",
              {
                $cond: [
                  { $in: ["$ext", ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]] },
                  "image",
                  "data",
                ],
              },
            ],
          },
          bytes: { $sum: "$size" },
        },
      },
    ]),
    getCloudinaryUsageSafe(),
  ]);

  const byPlanMap: Record<string, number> = {};
  byPlan.forEach((p: any) => { byPlanMap[p._id || "Free"] = p.count; });

  // Users by plan, using the same rules as the rest of the app: trial / trial ended / Pro monthly /
  // super admin. The custom domain is a separate one-time add-on, counted on its own.
  const byAccess = { trial: 0, expired: 0, pro: 0, staff: 0 };
  let customDomainUnlocked = 0;
  for (const acc of accessDocs as any[]) {
    const state = getAccountAccess(acc).state;
    byAccess[state] += 1;
    if (state !== "staff" && hasCustomDomainAccess(acc)) customDomainUnlocked += 1;
  }

  const byRoleMap: Record<string, number> = {};
  byRole.forEach((r: any) => { byRoleMap[r._id || "user"] = r.count; });

  // Map top storage consumers to account profiles
  const topEmails = topUsersAgg.map((u: any) => u._id).filter(Boolean);
  const topAccounts: any[] = topEmails.length > 0
    ? await AccountModel.find({ email: { $in: topEmails } }, { email: 1, name: 1, plan: 1 }).lean()
    : [];
  const topAccountMap: Record<string, any> = {};
  topAccounts.forEach((acc) => {
    if (acc?.email) topAccountMap[acc.email.toLowerCase()] = acc;
  });

  const formattedTopUsers = topUsersAgg.map((u: any) => {
    const norm = (u._id || "").toLowerCase();
    const acc = topAccountMap[norm] || {};
    return {
      email: u._id,
      name: acc.name || u._id.split("@")[0],
      plan: acc.plan || "Free",
      bytes: u.totalBytes || 0,
      files: u.totalFiles || 0,
    };
  });

  // Calculate storage metrics: dynamically prioritize live Cloudinary credit/storage limit if available
  const liveLimitGb =
    (typeof cloudinaryUsage?.credits?.limit === "number" && cloudinaryUsage.credits.limit > 0)
      ? cloudinaryUsage.credits.limit
      : (typeof cloudinaryUsage?.storage?.limit === "number" && cloudinaryUsage.storage.limit > 0)
        ? Math.round(cloudinaryUsage.storage.limit / (1024 * 1024 * 1024))
        : (parseInt(process.env.CLOUDINARY_STORAGE_LIMIT_GB || "25", 10) || 25);
  const limitBytes = liveLimitGb * 1024 * 1024 * 1024;
  const dbBytes = dbStorageAgg[0]?.totalBytes || 0;
  const dbFiles = dbStorageAgg[0]?.totalFiles || 0;

  // Real breakdown from database resources
  let rawPdfBytes = 0;
  let rawImageBytes = 0;
  let rawDataBytes = 0;
  if (Array.isArray(categoryAgg)) {
    categoryAgg.forEach((c: any) => {
      if (c._id === "pdf") rawPdfBytes = c.bytes || 0;
      else if (c._id === "image") rawImageBytes = c.bytes || 0;
      else rawDataBytes = (rawDataBytes || 0) + (c.bytes || 0);
    });
  }

  // Cloudinary storage usage includes derived transformations/thumbnails; DB tracks original uploaded resources
  const totalBytes = cloudinaryUsage?.storage?.usage ?? dbBytes;
  const totalFiles = cloudinaryUsage?.objects?.usage ?? dbFiles;

  // Scale category breakdown proportionally to totalBytes
  const scale = dbBytes > 0 ? totalBytes / dbBytes : 1;
  const pdfBytes = Math.round(rawPdfBytes * scale);
  const imageBytes = Math.round(rawImageBytes * scale);
  const dataBytes = Math.max(0, totalBytes - pdfBytes - imageBytes);

  const usedPercent = limitBytes > 0 ? (totalBytes / limitBytes) * 100 : 0;

  return NextResponse.json({
    totalUsers,
    newUsersLast30,
    totalMagnets,
    totalLeads,
    byPlan: byPlanMap,
    byAccess,
    customDomainUnlocked,
    byRole: byRoleMap,
    storage: {
      totalBytes,
      totalFiles,
      dbTotalBytes: dbBytes,
      dbTotalFiles: dbFiles,
      pdfBytes,
      imageBytes,
      dataBytes,
      limitBytes,
      limitGb: liveLimitGb,
      usedPercent: Number(usedPercent.toFixed(2)),
      provider: "Cloudinary",
      plan: cloudinaryUsage?.plan || "Free",
      creditsUsage: cloudinaryUsage?.credits?.usage ?? null,
      creditsLimit: cloudinaryUsage?.credits?.limit ?? liveLimitGb,
      bandwidthBytes: cloudinaryUsage?.bandwidth?.usage ?? 0,
      topUsers: formattedTopUsers,
    },
  }, { headers: { "Cache-Control": "private, max-age=60" } });
}

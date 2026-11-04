import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, ResourceModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

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
    dbStorageAgg,
    topUsersAgg,
    cloudinaryUsage,
  ] = await Promise.all([
    AccountModel.countDocuments(),
    MagnetPageModel.countDocuments(),
    LeadModel.countDocuments(),
    AccountModel.countDocuments({ _id: { $gte: minId } }),
    AccountModel.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
    AccountModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ResourceModel.aggregate([
      { $group: { _id: null, totalBytes: { $sum: "$size" }, totalFiles: { $sum: 1 } } },
    ]),
    ResourceModel.aggregate([
      { $match: { userEmail: { $exists: true, $ne: "" } } },
      { $group: { _id: "$userEmail", totalBytes: { $sum: "$size" }, totalFiles: { $sum: 1 } } },
      { $sort: { totalBytes: -1 } },
      { $limit: 15 },
    ]),
    getCloudinaryUsageSafe(),
  ]);

  const byPlanMap: Record<string, number> = {};
  byPlan.forEach((p: any) => { byPlanMap[p._id || "Free"] = p.count; });

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

  // Calculate storage metrics
  const limitGb = parseInt(process.env.CLOUDINARY_STORAGE_LIMIT_GB || "25", 10) || 25;
  const limitBytes = limitGb * 1024 * 1024 * 1024;
  const dbBytes = dbStorageAgg[0]?.totalBytes || 0;
  const dbFiles = dbStorageAgg[0]?.totalFiles || 0;

  // Cloudinary storage usage includes derived transformations/thumbnails; DB tracks original uploaded resources
  const totalBytes = cloudinaryUsage?.storage?.usage ?? dbBytes;
  const totalFiles = cloudinaryUsage?.objects?.usage ?? dbFiles;
  const usedPercent = limitBytes > 0 ? (totalBytes / limitBytes) * 100 : 0;

  return NextResponse.json({
    totalUsers,
    newUsersLast30,
    totalMagnets,
    totalLeads,
    byPlan: byPlanMap,
    byRole: byRoleMap,
    storage: {
      totalBytes,
      totalFiles,
      dbTotalBytes: dbBytes,
      dbTotalFiles: dbFiles,
      limitBytes,
      limitGb,
      usedPercent: Number(usedPercent.toFixed(2)),
      provider: "Cloudinary",
      plan: cloudinaryUsage?.plan || "Free",
      creditsUsage: cloudinaryUsage?.credits?.usage ?? null,
      creditsLimit: cloudinaryUsage?.credits?.limit ?? limitGb,
      bandwidthBytes: cloudinaryUsage?.bandwidth?.usage ?? 0,
      topUsers: formattedTopUsers,
    },
  }, { headers: { "Cache-Control": "private, max-age=60" } });
}

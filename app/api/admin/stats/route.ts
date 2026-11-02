import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

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

  const [totalUsers, totalMagnets, totalLeads, newUsersLast30, byPlan, byRole] =
    await Promise.all([
      AccountModel.countDocuments(),
      MagnetPageModel.countDocuments(),
      LeadModel.countDocuments(),
      AccountModel.countDocuments({ _id: { $gte: minId } }),
      AccountModel.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
      AccountModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);

  const byPlanMap: Record<string, number> = {};
  byPlan.forEach((p: any) => { byPlanMap[p._id || "Free"] = p.count; });

  const byRoleMap: Record<string, number> = {};
  byRole.forEach((r: any) => { byRoleMap[r._id || "user"] = r.count; });

  return NextResponse.json({
    totalUsers,
    newUsersLast30,
    totalMagnets,
    totalLeads,
    byPlan: byPlanMap,
    byRole: byRoleMap,
  });
}

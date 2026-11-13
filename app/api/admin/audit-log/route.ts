import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AuditLogModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

const PAGE_SIZE = 50;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const action = searchParams.get("action") || "";
  const adminFilter = searchParams.get("admin") || "";
  const targetFilter = searchParams.get("target") || "";
  const search = searchParams.get("search")?.trim() || "";
  const dateRange = searchParams.get("dateRange") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const query: Record<string, any> = {};
  if (action) query.action = action;
  if (adminFilter) query.adminEmail = { $regex: escapeRegex(adminFilter), $options: "i" };
  if (targetFilter) query.targetEmail = { $regex: escapeRegex(targetFilter), $options: "i" };

  if (search) {
    const escaped = escapeRegex(search);
    query.$or = [
      { adminEmail: { $regex: escaped, $options: "i" } },
      { targetEmail: { $regex: escaped, $options: "i" } },
      { targetName: { $regex: escaped, $options: "i" } },
    ];
  }

  // Date filtering
  const now = new Date();
  if (dateRange === "today") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    query.createdAt = { $gte: startOfToday };
  } else if (dateRange === "7d") {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: cutoff };
  } else if (dateRange === "30d") {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: cutoff };
  } else if (dateRange === "90d") {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: cutoff };
  } else if (dateRange === "custom" || startDate || endDate) {
    const dateQuery: Record<string, any> = {};
    if (startDate) {
      const s = new Date(startDate);
      if (!isNaN(s.getTime())) dateQuery.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      if (!isNaN(e.getTime())) {
        if (endDate.length === 10) {
          e.setHours(23, 59, 59, 999);
        }
        dateQuery.$lte = e;
      }
    }
    if (Object.keys(dateQuery).length > 0) {
      query.createdAt = dateQuery;
    }
  }

  const [entries, total] = await Promise.all([
    AuditLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    AuditLogModel.countDocuments(query),
  ]);

  return NextResponse.json({
    entries: entries.map((e: any) => ({
      id: e._id.toString(),
      adminEmail: e.adminEmail,
      adminRole: e.adminRole,
      action: e.action,
      targetEmail: e.targetEmail,
      targetName: e.targetName,
      before: e.before,
      after: e.after,
      createdAt: e.createdAt,
    })),
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  try {
    const body = await request.json().catch(() => ({}));
    const { mode, days, confirmPhrase } = body;

    if (confirmPhrase !== "CLEAR AUDIT LOGS") {
      return NextResponse.json(
        { error: "Confirmation phrase does not match. Please type CLEAR AUDIT LOGS exactly." },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    let targetDescription = "";
    let beforeState: Record<string, string> = {};
    let afterState: Record<string, string> = {};

    if (mode === "older_than") {
      const retentionDays = Number(days);
      if (!retentionDays || retentionDays < 1) {
        return NextResponse.json({ error: "Invalid days specified." }, { status: 400 });
      }
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const res = await AuditLogModel.deleteMany({ createdAt: { $lt: cutoff } });
      deletedCount = res.deletedCount || 0;
      targetDescription = `Purged logs older than ${retentionDays} days`;
      beforeState = { retentionDays: `${retentionDays} days`, cutoffDate: cutoff.toISOString() };
      afterState = { deletedCount: String(deletedCount), status: "purged" };
    } else if (mode === "all") {
      const countBefore = await AuditLogModel.countDocuments();
      const res = await AuditLogModel.deleteMany({});
      deletedCount = res.deletedCount || 0;
      targetDescription = `Purged all audit logs`;
      beforeState = { totalBefore: String(countBefore) };
      afterState = { deletedCount: String(deletedCount), status: "cleared_all" };
    } else {
      return NextResponse.json({ error: "Invalid purge mode." }, { status: 400 });
    }

    // Always create an immutable audit record documenting that the purge was performed
    await AuditLogModel.create({
      adminEmail: auth.email,
      adminRole: auth.role,
      action: "audit_logs_purged",
      targetEmail: auth.email,
      targetName: `${targetDescription} (${deletedCount} removed)`,
      before: beforeState,
      after: afterState,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully purged ${deletedCount} audit log ${deletedCount === 1 ? "entry" : "entries"}.`,
    });
  } catch (err: any) {
    console.error("[audit-log] DELETE error:", err);
    return NextResponse.json({ error: err.message || "Failed to purge audit logs." }, { status: 500 });
  }
}

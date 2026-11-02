import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AuditLogModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const action = searchParams.get("action") || "";
  const adminFilter = searchParams.get("admin") || "";
  const targetFilter = searchParams.get("target") || "";

  const query: Record<string, any> = {};
  if (action) query.action = action;
  if (adminFilter) query.adminEmail = { $regex: adminFilter, $options: "i" };
  if (targetFilter) query.targetEmail = { $regex: targetFilter, $options: "i" };

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

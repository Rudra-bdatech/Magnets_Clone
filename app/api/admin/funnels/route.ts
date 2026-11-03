import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const search = searchParams.get("search")?.trim() || "";
  const statusFilter = searchParams.get("status") || "";
  const templateFilter = searchParams.get("template") || "";

  const query: Record<string, any> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { userEmail: { $regex: search, $options: "i" } },
    ];
  }
  if (statusFilter) query.status = statusFilter;
  if (templateFilter) {
    if (templateFilter === "quiz") query.quizFunnelEnabled = true;
    else if (templateFilter === "locked-pdf") query["pdfPages.0"] = { $exists: true };
    else query.template = templateFilter;
  }

  const projection = {
    id: 1, userEmail: 1, name: 1, slug: 1, status: 1,
    views: 1, signups: 1, conversionRate: 1, template: 1,
    createdAt: 1, publishedAt: 1,
    quizFunnelEnabled: 1, hasVariantB: 1, testStarted: 1,
    pdfPages: 1,
  };

  const [funnels, total] = await Promise.all([
    MagnetPageModel.find(query, projection)
      .sort({ _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    MagnetPageModel.countDocuments(query),
  ]);

  const result = (funnels as any[]).map((f) => ({
    id: f.id,
    userEmail: f.userEmail || "",
    name: f.name,
    slug: f.slug || "",
    status: f.status || "draft",
    views: f.views || 0,
    signups: f.signups || 0,
    conversionRate: f.conversionRate || 0,
    template: f.template || "template1",
    createdAt: f.createdAt || "",
    publishedAt: f.publishedAt || null,
    isQuiz: Boolean(f.quizFunnelEnabled),
    isLockedPdf: Array.isArray(f.pdfPages) && f.pdfPages.length > 0,
    hasVariantB: Boolean(f.hasVariantB),
    testStarted: Boolean(f.testStarted),
  }));

  return NextResponse.json({ funnels: result, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}

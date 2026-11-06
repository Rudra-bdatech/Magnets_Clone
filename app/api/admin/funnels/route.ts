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
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

  const query: Record<string, any> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { userEmail: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
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
    // pdfPages excluded — it is an array of Cloudinary image URLs for each locked PDF page.
    // pdfPageCount is a single integer that tells us whether a locked PDF exists.
    pdfPageCount: 1,
  };

  let sortCriteria: Record<string, 1 | -1> = { _id: -1 };
  if (sortBy === "views") sortCriteria = { views: sortOrder, _id: -1 };
  else if (sortBy === "signups") sortCriteria = { signups: sortOrder, _id: -1 };
  else if (sortBy === "conversionRate") sortCriteria = { conversionRate: sortOrder, _id: -1 };
  else if (sortBy === "name") sortCriteria = { name: sortOrder };
  else if (sortBy === "status") sortCriteria = { status: sortOrder, _id: -1 };
  else if (sortBy === "createdAt") sortCriteria = { _id: sortOrder };

  const [funnels, total, aggStats] = await Promise.all([
    MagnetPageModel.find(query, projection)
      .sort(sortCriteria)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    MagnetPageModel.countDocuments(query),
    MagnetPageModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalSignups: { $sum: "$signups" },
          liveCount: {
            $sum: { $cond: [{ $eq: ["$status", "live"] }, 1, 0] },
          },
        },
      },
    ]),
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
    isLockedPdf: (f.pdfPageCount || 0) > 0,
    hasVariantB: Boolean(f.hasVariantB),
    testStarted: Boolean(f.testStarted),
  }));

  const summary = {
    totalViews: aggStats[0]?.totalViews || 0,
    totalSignups: aggStats[0]?.totalSignups || 0,
    liveCount: aggStats[0]?.liveCount || 0,
  };

  return NextResponse.json({
    funnels: result,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
    summary,
  });
}

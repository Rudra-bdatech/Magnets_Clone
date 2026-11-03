import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, LeadModel, SequenceModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit-log";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const funnel = await MagnetPageModel.findOne(
    { id: params.id },
    {
      id: 1, userEmail: 1, name: 1, slug: 1, status: 1,
      views: 1, signups: 1, conversionRate: 1, template: 1,
      headline: 1, subheadline: 1, pitch: 1, cta: 1, imageUrl: 1,
      createdAt: 1, publishedAt: 1, updatedAt: 1,
      quizFunnelEnabled: 1, hasVariantB: 1, testStarted: 1,
      variantAViews: 1, variantASignups: 1, variantBViews: 1, variantBSignups: 1,
      pdfPages: 1, pdfPageCount: 1, pdfTitle: 1, pdfFreePages: 1, pdfUrl: 1,
      sequenceEnabled: 1, afterSignupOption: 1, destinationUrl: 1,
      enableAiPersonalizedDeliverable: 1,
      formTitle: 1, formButtonText: 1,
      accent: 1,
    }
  ).lean() as any;

  if (!funnel) {
    return NextResponse.json({ error: "Funnel not found." }, { status: 404 });
  }

  const [leadCount, sequenceCount] = await Promise.all([
    LeadModel.countDocuments({ pageId: params.id }),
    SequenceModel.countDocuments({ pageId: params.id }),
  ]);

  const { _id, ...rest } = funnel;
  return NextResponse.json({ funnel: rest, leadCount, sequenceCount });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { action } = body as { action: "pause" | "restore" };
  if (!action || !["pause", "restore"].includes(action)) {
    return NextResponse.json({ error: "action must be 'pause' or 'restore'." }, { status: 400 });
  }

  await dbConnect();

  const funnel = await MagnetPageModel.findOne(
    { id: params.id },
    { id: 1, name: 1, userEmail: 1, status: 1 }
  ).lean() as any;

  if (!funnel) {
    return NextResponse.json({ error: "Funnel not found." }, { status: 404 });
  }

  if (action === "pause" && funnel.status !== "live") {
    return NextResponse.json({ error: "Only live funnels can be force-paused." }, { status: 400 });
  }
  if (action === "restore" && funnel.status !== "paused") {
    return NextResponse.json({ error: "Only paused funnels can be restored." }, { status: 400 });
  }

  const newStatus = action === "pause" ? "paused" : "live";

  await MagnetPageModel.findOneAndUpdate(
    { id: params.id },
    { $set: { status: newStatus } }
  );

  await logAdminAction({
    adminEmail: auth.email,
    adminRole: auth.role,
    action: action === "pause" ? "funnel_pause" : "funnel_restore",
    targetEmail: funnel.userEmail || "",
    targetName: funnel.name,
    before: { status: funnel.status },
    after: { status: newStatus },
  });

  return NextResponse.json({ success: true, id: params.id, status: newStatus });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  // Only super_admin can delete funnels
  if (auth.role !== "super_admin") {
    return NextResponse.json({ error: "Only super_admin can delete funnels." }, { status: 403 });
  }

  await dbConnect();

  const funnel = await MagnetPageModel.findOne(
    { id: params.id },
    { id: 1, name: 1, userEmail: 1, status: 1 }
  ).lean() as any;

  if (!funnel) {
    return NextResponse.json({ error: "Funnel not found." }, { status: 404 });
  }

  // Delete funnel + all associated leads and sequences
  await Promise.all([
    MagnetPageModel.deleteOne({ id: params.id }),
    LeadModel.deleteMany({ pageId: params.id }),
    SequenceModel.deleteMany({ pageId: params.id }),
  ]);

  await logAdminAction({
    adminEmail: auth.email,
    adminRole: auth.role,
    action: "funnel_delete",
    targetEmail: funnel.userEmail || "",
    targetName: funnel.name,
    before: { status: funnel.status },
    after: { deleted: "true" },
  });

  return NextResponse.json({ success: true });
}

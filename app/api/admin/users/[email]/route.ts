import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, ResourceModel, IntegrationModel, EmailEventModel, PdfOtpModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";
import { determineRoleForEmail } from "@/lib/roles";
import { logAdminAction } from "@/lib/audit-log";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";
import { removeDomainFromVercel } from "@/lib/domain-verify";
import { revokeGmailAccess } from "@/lib/gmail-oauth";

const ALLOWED_PLANS = ["Free", "Pro", "Growth", "Unlimited"];
const ALLOWED_ROLES = ["user", "admin", "super_admin"];

export async function GET(
  _request: NextRequest,
  { params }: { params: { email: string } }
) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  const targetEmail = decodeURIComponent(params.email).trim().toLowerCase();

  await dbConnect();

  const account = await AccountModel.findOne(
    { email: targetEmail },
    // Exclude all sensitive credentials
    {
      password: 0,
      resetPasswordToken: 0,
      resetPasswordExpires: 0,
      emailVerifyTokenHash: 0,
      emailVerifyExpires: 0,
      linkedinLiAt: 0,
      linkedinJSessionId: 0,
      linkedinWebhookSecret: 0,
      "customSmtp.pass": 0,
      "gmailOAuth.accessToken": 0,
      "gmailOAuth.refreshToken": 0,
      notifyEmailTokenHash: 0,
      notifyEmailTokenExpires: 0,
      stripeCheckoutSessionId: 0,
    }
  ).lean() as any;

  if (!account) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const [magnets, leads, resources, sequences] = await Promise.all([
    MagnetPageModel.find(
      { userEmail: targetEmail },
      { id: 1, name: 1, slug: 1, status: 1, views: 1, signups: 1, template: 1, createdAt: 1, updatedAt: 1, pdfPages: 1, quizFunnelEnabled: 1, _id: 0 }
    ).sort({ updatedAt: -1 }).lean(),
    LeadModel.find(
      { userEmail: targetEmail },
      { id: 1, name: 1, email: 1, page: 1, signedUpAt: 1, status: 1, source: 1, _id: 0 }
    ).sort({ signedUpAt: -1 }).limit(100).lean(),
    ResourceModel.find(
      { userEmail: targetEmail },
      { id: 1, name: 1, size: 1, fileUrl: 1, url: 1, uploadedAt: 1, fileExt: 1, type: 1, _id: 0 }
    ).sort({ uploadedAt: -1 }).lean(),
    SequenceModel.find(
      { userEmail: targetEmail },
      { id: 1, name: 1, pageId: 1, status: 1, "emails.id": 1, stats: 1, _id: 0 }
    ).lean(),
  ]);

  const computedRole = determineRoleForEmail(account.email);
  const effectiveRole =
    computedRole === "super_admin" ? "super_admin" : (account.role || computedRole);

  const { _id, ...rest } = account;
  return NextResponse.json({
    user: { ...rest, role: effectiveRole },
    stats: {
      magnetCount: magnets.length,
      leadCount: leads.length,
      sequenceCount: sequences.length,
      resourceCount: resources.length,
      storageBytes: (resources as any[]).reduce((sum: number, r: any) => sum + (r.size || 0), 0),
      lastLoginAt: account.lastLoginAt ?? null,
      lastFunnelCreatedAt: (magnets as any[]).length > 0 ? (magnets as any[])[0].createdAt ?? (magnets as any[])[0].updatedAt ?? null : null,
      lastLeadReceivedAt: (leads as any[]).length > 0 ? (leads as any[])[0].signedUpAt ?? null : null,
    },
    magnets,
    leads,
    resources,
    sequences,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  const targetEmail = decodeURIComponent(params.email).trim().toLowerCase();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { plan, role, action } = body as { plan?: string; role?: string; action?: string };

  if (!plan && !role && !action) {
    return NextResponse.json({ error: "Provide plan, role, or action to update." }, { status: 400 });
  }

  // Suspend / unsuspend — any admin can do this
  if (action === "suspend" || action === "unsuspend") {
    await dbConnect();
    const target = await AccountModel.findOne({ email: targetEmail }, { email: 1, name: 1, suspended: 1 }).lean() as any;
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (targetEmail === auth.email) return NextResponse.json({ error: "You cannot suspend yourself." }, { status: 400 });

    const isSuspending = action === "suspend";
    const updateFields: any = { suspended: isSuspending };
    // Increment tokenVersion on suspend so all existing sessions are immediately invalidated
    if (isSuspending) updateFields.$inc = { tokenVersion: 1 };

    await AccountModel.findOneAndUpdate(
      { email: targetEmail },
      isSuspending ? { $set: { suspended: true }, $inc: { tokenVersion: 1 } } : { $set: { suspended: false } }
    );

    await logAdminAction({
      adminEmail: auth.email,
      adminRole: auth.role,
      action: isSuspending ? "account_suspend" : "account_unsuspend",
      targetEmail: target.email,
      targetName: target.name || "",
      before: { suspended: String(!isSuspending) },
      after: { suspended: String(isSuspending) },
    });

    return NextResponse.json({ success: true, suspended: isSuspending });
  }

  if (role && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Only super_admin can change user roles." }, { status: 403 });
  }

  if (plan && !ALLOWED_PLANS.includes(plan)) {
    return NextResponse.json(
      { error: `Invalid plan. Must be one of: ${ALLOWED_PLANS.join(", ")}` },
      { status: 400 }
    );
  }

  if (role && !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  if (role && targetEmail === auth.email) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  await dbConnect();

  const update: Record<string, string> = {};
  if (plan) update.plan = plan;
  if (role) update.role = role;

  const target = await AccountModel.findOne(
    { email: targetEmail },
    { email: 1, name: 1, plan: 1, role: 1 }
  ).lean() as any;

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updated = await AccountModel.findOneAndUpdate(
    { email: targetEmail },
    { $set: update },
    { new: true, projection: { email: 1, name: 1, plan: 1, role: 1 } }
  ).lean() as any;

  if (!updated) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (plan && plan !== target.plan) {
    await logAdminAction({
      adminEmail: auth.email,
      adminRole: auth.role,
      action: "plan_change",
      targetEmail: updated.email,
      targetName: updated.name || "",
      before: { plan: target.plan || "Free" },
      after: { plan: updated.plan },
    });
  }

  if (role && role !== target.role) {
    await logAdminAction({
      adminEmail: auth.email,
      adminRole: auth.role,
      action: "role_change",
      targetEmail: updated.email,
      targetName: updated.name || "",
      before: { role: target.role || "user" },
      after: { role: updated.role },
    });
  }

  return NextResponse.json({
    success: true,
    email: updated.email,
    plan: updated.plan,
    role: updated.role,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { email: string } }
) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  if (auth.role !== "super_admin") {
    return NextResponse.json({ error: "Only super_admin can delete user accounts." }, { status: 403 });
  }

  const targetEmail = decodeURIComponent(params.email).trim().toLowerCase();

  if (targetEmail === auth.email) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  await dbConnect();

  const account = await AccountModel.findOne({ email: targetEmail }).lean() as any;
  if (!account) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const userPages = await MagnetPageModel.find({ userEmail: targetEmail }).lean() as any[];
  const userResources = await ResourceModel.find({ userEmail: targetEmail }).lean() as any[];

  const userPageIds: string[] = [];
  const allAssets: string[] = [];

  if (account.logo) allAssets.push(account.logo);
  if (account.avatar) allAssets.push(account.avatar);
  if (account.faviconUrl) allAssets.push(account.faviconUrl);
  if (account.ogImageUrl) allAssets.push(account.ogImageUrl);

  userPages.forEach((p: any) => {
    if (p.id) userPageIds.push(p.id);
    if (p._id) userPageIds.push(p._id.toString());
    if (p.imageUrl) allAssets.push(p.imageUrl);
    if (p.variantBImage) allAssets.push(p.variantBImage);
    if (p.assetUrl) allAssets.push(p.assetUrl);
    if (Array.isArray(p.pdfPages)) p.pdfPages.forEach((u: string) => { if (u) allAssets.push(u); });
  });

  userResources.forEach((r: any) => {
    const u = r.fileUrl || r.url;
    if (u) allAssets.push(u);
  });

  // Release external resources (best-effort, never block deletion)
  await Promise.all([
    revokeGmailAccess(account.gmailOAuth?.refreshToken),
    account.customDomain ? removeDomainFromVercel(account.customDomain, account.customSubdomain || "get") : null,
  ]);

  // Wipe all DB collections for this user
  await Promise.all([
    AccountModel.deleteOne({ email: targetEmail }),
    MagnetPageModel.deleteMany({ userEmail: targetEmail }),
    LeadModel.deleteMany({
      $or: [
        { userEmail: targetEmail },
        ...(userPageIds.length > 0 ? [{ pageId: { $in: userPageIds }, userEmail: { $in: [null, ""] } }] : []),
      ],
    }),
    SequenceModel.deleteMany({ userEmail: targetEmail }),
    IntegrationModel.deleteMany({ userEmail: targetEmail }),
    ResourceModel.deleteMany({ userEmail: targetEmail }),
    EmailEventModel.deleteMany({ userEmail: targetEmail }),
    ...(userPageIds.length > 0 ? [PdfOtpModel.deleteMany({ magnetId: { $in: userPageIds } })] : []),
  ]);

  // Cloudinary cleanup (fire-and-forget — never block the response)
  if (allAssets.length > 0) {
    deleteCloudinaryAssets(allAssets, targetEmail).catch((err) =>
      console.error("[admin/delete-user] Cloudinary cleanup error:", err)
    );
  }

  await logAdminAction({
    adminEmail: auth.email,
    adminRole: auth.role,
    action: "account_delete",
    targetEmail,
    targetName: account.name || "",
    before: { plan: account.plan || "Free", role: account.role || "user" },
    after: { deleted: "true" },
  });

  return NextResponse.json({ success: true });
}

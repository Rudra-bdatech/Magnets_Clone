import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, ResourceModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";
import { determineRoleForEmail } from "@/lib/roles";
import { logAdminAction } from "@/lib/audit-log";

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

  const [magnetCount, leadCount, sequenceCount, resourceCount] = await Promise.all([
    MagnetPageModel.countDocuments({ userEmail: targetEmail }),
    LeadModel.countDocuments({ userEmail: targetEmail }),
    SequenceModel.countDocuments({ userEmail: targetEmail }),
    ResourceModel.countDocuments({ userEmail: targetEmail }),
  ]);

  const computedRole = determineRoleForEmail(account.email);
  const effectiveRole =
    computedRole === "super_admin" ? "super_admin" : (account.role || computedRole);

  const { _id, ...rest } = account;
  return NextResponse.json({
    user: { ...rest, role: effectiveRole },
    stats: { magnetCount, leadCount, sequenceCount, resourceCount },
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

  const { plan, role } = body as { plan?: string; role?: string };

  if (!plan && !role) {
    return NextResponse.json({ error: "Provide plan or role to update." }, { status: 400 });
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

  // Log each field that changed as a separate audit entry
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

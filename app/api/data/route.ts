import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel } from "@/lib/models";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import {
  handleSaveAccount,
  handleCheckEmail,
  handleDeleteAccount,
  handleLogin,
  handleUpdatePassword,
  handleGetAccountByEmail,
  handleSendResetEmail,
  handleResetPassword,
  handleSendVerificationEmail,
  handleGetLinkedInConfig,
  handleRegenerateLinkedInSecret,
  handleConnectLinkedInExtension,
  handleConnectLinkedInNative,
  handleLoginLinkedInCredentials,
  handleSubmitLinkedInPin,
  handleDisconnectLinkedIn,
  handleSaveLinkedInCampaignSettings,
  handleSyncLinkedInNow,
  handleGetLinkedInRecentPosts,
  handleSaveLinkedInPostCampaign,
} from "@/lib/controllers/account";
import {
  handleSavePages,
  handleAddPage,
  handleDeletePage,
  handleIncrementViews,
  handleSaveSequences,
  handleDeleteSequence,
  handleSendTestSequenceEmail,
} from "@/lib/controllers/magnets";
import {
  handleAddLead,
  handleDeleteLead,
  handleSaveLeads,
  handleSendTestLeadAlert,
  handleResendLeadEmail,
  handleSaveLeadQuizAnswers,
} from "@/lib/controllers/leads";
import {
  handleSaveIntegrations,
  handleSaveResources,
  handleDeleteResource,
  handleAddResource,
  handleUpdateResource,
  handleSendTestKitAlert,
  handleSendTestPipedriveAlert,
  handleSendTestZapierAlert,
  handleSendTestSlackAlert,
  handleTestCalendarToken,
} from "@/lib/controllers/integrations";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseFlexibleDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authEmail = await getAuthenticatedUserEmail();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const normEmail = authEmail || (email ? email.trim().toLowerCase() : null);

    if (!normEmail) {
      return NextResponse.json({
        account: null,
        pages: [],
        leads: [],
        sequences: [],
        integrations: [],
        resources: [],
      });
    }

// ── Phase 1: Fetch pages first (needed to build pageIds/pageNames for the leads query) ──────
// Pages are fetched alone so we can use their IDs immediately in Phase 2.
const pages = await MagnetPageModel.find({ userEmail: normEmail })
  .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
  .lean();

const pageIds   = (pages as any[]).map((p) => p.id).filter(Boolean);
const pageNames = (pages as any[]).map((p) => p.name).filter(Boolean);

// ── Phase 2: Run the remaining 5 queries in parallel ────────────────────────────────────────
// The leads query uses the same wider $or that was previously run as a *second* serial query.
// Result is byte-for-byte identical to the original code — no data is lost or changed.
// The only difference: we eliminated one full extra DB round-trip.
const [account, rawLeads, sequences, integrations, resources] = await Promise.all([
  AccountModel.findOne({ email: normEmail }).select("-password").lean(),
  LeadModel.find({
    $or: [
      { userEmail: normEmail },
      ...(pageIds.length   ? [{ pageId: { $in: pageIds } }]   : []),
      ...(pageNames.length ? [{ page:   { $in: pageNames } }] : []),
    ],
  }).sort({ createdAt: -1, _id: -1 }).lean(),
  SequenceModel.find({ userEmail: normEmail }).sort({ updatedAt: -1, createdAt: -1, _id: -1 }).lean(),
  IntegrationModel.find({ userEmail: normEmail }).lean(),
  ResourceModel.find({ userEmail: normEmail, isPageAsset: { $ne: true }, type: { $ne: "page_asset" } })
    .sort({ uploadedAt: -1, createdAt: -1, _id: -1 })
    .lean(),
]);

const leads = Array.isArray(rawLeads)
  ? [...rawLeads].sort((a: any, b: any) => {
      const timeA = parseFlexibleDate(a.signedUpAt)?.getTime() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = parseFlexibleDate(b.signedUpAt)?.getTime() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    })
  : [];

return NextResponse.json({
  account,
  pages,
  leads,
  sequences,
  integrations,
  resources,
});
  } catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { action, data, email } = body;

    const publicActions = [
      "addLead",
      "checkEmail",
      "login",
      "resetPassword",
      "sendResetEmail",
      "sendVerificationEmail",
      "sendForgotPasswordEmail",
      "verifyEmailToken",
      "getLinkedInRecentPosts",
      "saveLinkedInPostCampaign",
    ];

    const isPublic = publicActions.includes(action);
    let normEmail = email ? email.trim().toLowerCase() : (body.userEmail || "").trim().toLowerCase();
    let authEmail: string | null = null;
    if (!normEmail && !isPublic) {
      authEmail = await getAuthenticatedUserEmail();
      normEmail = authEmail || "";
    }

    if (!normEmail && !isPublic && action !== "saveAccount") {
      return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
    }

    // Dispatch to modular controllers (Facade Router)
    switch (action) {
      // Account Controller
      case "saveAccount":
        return handleSaveAccount(data, authEmail);
      case "checkEmail": {
        // Rate-limit email existence checks to prevent user enumeration attacks.
        const rlIp =
          (req as any).headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          (req as any).headers?.get?.("x-real-ip") ||
          "unknown";
        const rl = await checkRateLimit(rlIp, "check_email", 10, 60 * 1000);
        if (!rl.success) {
          return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429 }
          );
        }
        return handleCheckEmail(data);
      }
      case "deleteAccount":
        return handleDeleteAccount(data, authEmail);
      case "login": {
        const rlIp =
          (req as any).headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          (req as any).headers?.get?.("x-real-ip") ||
          "unknown";
        const rl = await checkRateLimit(rlIp, "login_attempt", 15, 60 * 1000);
        if (!rl.success) {
          return NextResponse.json(
            { error: "Too many login attempts. Please wait 1 minute before trying again." },
            { status: 429 }
          );
        }
        return handleLogin(data);
      }
      case "updatePassword":
        return handleUpdatePassword(data, authEmail);
      case "getAccountByEmail":
        return handleGetAccountByEmail(authEmail);

      // LinkedIn Automation
      case "getLinkedInConfig":
        return handleGetLinkedInConfig(authEmail);
      case "regenerateLinkedInSecret":
        return handleRegenerateLinkedInSecret(authEmail);
      case "connectLinkedInExtension":
      case "setLinkedInExtensionConnected":
        return handleConnectLinkedInExtension(data, normEmail);
      case "connectLinkedInNative":
      case "connectLinkedIn":
        return handleConnectLinkedInNative(data, normEmail);
      case "loginLinkedInCredentials":
        return handleLoginLinkedInCredentials(data, normEmail);
      case "submitLinkedInPin":
        return handleSubmitLinkedInPin(data, normEmail);
      case "disconnectLinkedIn":
        return handleDisconnectLinkedIn(normEmail);
      case "saveLinkedInSettings":
        return handleSaveLinkedInCampaignSettings(data, normEmail);
      case "syncLinkedInNow":
        return handleSyncLinkedInNow(normEmail);
      case "getLinkedInRecentPosts":
        return handleGetLinkedInRecentPosts(normEmail);
      case "saveLinkedInPostCampaign":
        return handleSaveLinkedInPostCampaign(data, normEmail);
      case "sendResetEmail":
      case "sendForgotPasswordEmail": {
        const rlIp =
          (req as any).headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          (req as any).headers?.get?.("x-real-ip") ||
          "unknown";
        const rl = await checkRateLimit(rlIp, "forgot_password", 5, 60 * 1000);
        if (!rl.success) {
          return NextResponse.json(
            { error: "Too many reset requests. Please wait a minute before requesting another link." },
            { status: 429 }
          );
        }
        const reqHost = req.headers.get("origin") || req.headers.get("referer") || undefined;
        return handleSendResetEmail(data, reqHost);
      }
      case "resetPassword": {
        const rlIp =
          (req as any).headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          (req as any).headers?.get?.("x-real-ip") ||
          "unknown";
        const rl = await checkRateLimit(rlIp, "reset_password", 10, 60 * 1000);
        if (!rl.success) {
          return NextResponse.json(
            { error: "Too many reset attempts. Please wait a minute." },
            { status: 429 }
          );
        }
        return handleResetPassword(data);
      }
      case "sendVerificationEmail":
        const reqHost = req.headers.get("origin") || "http://localhost:3000";
        return handleSendVerificationEmail(data, reqHost);

      // Magnets Controller
      case "savePages":
        return handleSavePages(data, normEmail);
      case "addPage":
        return handleAddPage(data, normEmail);
      case "deletePage":
        return handleDeletePage(data, normEmail);
      case "incrementViews":
        return handleIncrementViews(data);
      case "saveSequences":
        return handleSaveSequences(data, normEmail);
      case "deleteSequence":
        return handleDeleteSequence(data, normEmail);
      case "sendTestSequenceEmail":
        return handleSendTestSequenceEmail(data, normEmail);

      // Leads Controller
      case "addLead":
        return handleAddLead(data, req, normEmail);
      case "deleteLead":
        return handleDeleteLead(data, normEmail);
      case "saveLeads":
        return handleSaveLeads(data, normEmail);
      case "sendTestLeadAlert":
        return handleSendTestLeadAlert(data, normEmail);
      case "resendLeadEmail":
        return handleResendLeadEmail(data, normEmail);
      case "saveLeadQuizAnswers":
        return handleSaveLeadQuizAnswers(data, normEmail);

      // Integrations & Resources Controller
      case "saveIntegrations":
        return handleSaveIntegrations(data, normEmail);
      case "saveResources":
        return handleSaveResources(data, normEmail);
      case "deleteResource":
        return handleDeleteResource(data, normEmail);
      case "addResource":
        return handleAddResource(data);
      case "updateResource":
        return handleUpdateResource(data, normEmail);
      case "sendTestKitAlert":
        return handleSendTestKitAlert(data, normEmail);
      case "sendTestPipedriveAlert":
        return handleSendTestPipedriveAlert(data, normEmail);
      case "sendTestZapierAlert":
        return handleSendTestZapierAlert(data, normEmail);
      case "sendTestSlackAlert":
        return handleSendTestSlackAlert(data, normEmail);
      case "testCalendarToken":
        return handleTestCalendarToken(data, normEmail);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

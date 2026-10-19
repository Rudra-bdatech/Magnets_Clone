import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel } from "@/lib/models";
import { getAuthenticatedUserEmail, getSessionEmail } from "@/lib/auth";
import {
  handleSaveAccount,
  handleCheckEmail,
  handleDeleteAccount,
  handleLogin,
  handleUpdatePassword,
  handleGetAccountByEmail,
  sanitizeAccount,
  handleSendResetEmail,
  handleResetPassword,
  handleSendVerificationEmail,
  handleVerifyEmailToken,
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
} from "@/lib/controllers/integrations";
import { checkRateLimit, getClientIp, rateLimitMessage, type RateLimitResult } from "@/lib/rate-limit";
import { parseFlexibleDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function rateLimitedResponse(rl: RateLimitResult, limitedMessage: string) {
  const { error, status } = rateLimitMessage(rl, limitedMessage);
  return NextResponse.json({ error }, { status, headers: { "Retry-After": String(rl.reset) } });
}

// Lowercased email used as a per-account / per-inbox rate-limit identifier.
function normalizeEmailKey(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    // Only ever return the logged-in user's own data. The ?email= query param is ignored for
    // access control - trusting it let anyone read any account's data without logging in.
    const normEmail = await getAuthenticatedUserEmail();

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

const pageIds = (pages as any[]).map((p) => p.id).filter(Boolean);

// ── Phase 2: Run the remaining 5 queries in parallel ────────────────────────────────────────
// Strictly tenant-isolated: Leads must have userEmail === normEmail,
// or be unassigned legacy leads specifically matching this user's pageIds.
// We never query globally by page title/name, preventing cross-account leaks.
const [account, rawLeads, sequences, integrations, resources] = await Promise.all([
  AccountModel.findOne({ email: normEmail }).lean(), // password stripped by sanitizeAccount (needed for hasPassword)
  LeadModel.find({
    $or: [
      { userEmail: normEmail },
      ...(pageIds.length
        ? [{ pageId: { $in: pageIds }, userEmail: { $in: [null, "", undefined] } }]
        : []),
    ],
  }).sort({ createdAt: -1, _id: -1 }).lean(),
  SequenceModel.find({ userEmail: normEmail }).sort({ updatedAt: -1, createdAt: -1, _id: -1 }).lean(),
  IntegrationModel.find({ userEmail: normEmail }).lean(),
  ResourceModel.find({ userEmail: normEmail, isPageAsset: { $ne: true }, type: { $ne: "page_asset" } })
    .sort({ uploadedAt: -1, createdAt: -1, _id: -1 })
    .lean(),
]);

// Asynchronously backfill userEmail on any unassigned legacy leads for this user's pages
if (pageIds.length > 0) {
  LeadModel.updateMany(
    { pageId: { $in: pageIds }, userEmail: { $in: [null, "", undefined] } },
    { $set: { userEmail: normEmail } }
  ).exec().catch(() => {});
}

const leads = Array.isArray(rawLeads)
  ? [...rawLeads].sort((a: any, b: any) => {
      const timeA = parseFlexibleDate(a.signedUpAt)?.getTime() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = parseFlexibleDate(b.signedUpAt)?.getTime() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    })
  : [];

return NextResponse.json({
  account: sanitizeAccount(account),
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
      "getLinkedInRecentPosts", // read-only; called by the browser extension with just an email
    ];

    const isPublic = publicActions.includes(action);
    const bodyEmail = String(email || body.userEmail || "").trim().toLowerCase();
    const authEmail = await getAuthenticatedUserEmail();
    let normEmail: string;
    if (isPublic) {
      normEmail = bodyEmail || authEmail || "";
    } else {
      // Private actions always act on the logged-in user. An email in the body is never trusted:
      // a mismatch is rejected instead of silently acting on someone else's account.
      if (authEmail && bodyEmail && bodyEmail !== authEmail) {
        return NextResponse.json({ error: "Forbidden. You can only access your own account." }, { status: 403 });
      }
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
        const rl = await checkRateLimit(getClientIp(req.headers), "check_email", 10, 60 * 1000, { failClosed: true });
        if (!rl.success) return rateLimitedResponse(rl, "Too many requests. Please slow down.");
        return handleCheckEmail(data);
      }
      case "deleteAccount":
        return handleDeleteAccount(data, authEmail);
      case "login": {
        const rl = await checkRateLimit(getClientIp(req.headers), "login_attempt", 15, 60 * 1000, { failClosed: true });
        if (!rl.success) {
          return rateLimitedResponse(rl, "Too many login attempts. Please wait 1 minute before trying again.");
        }
        // Per-account limit stops password guessing spread across many IPs.
        const loginEmail = normalizeEmailKey(data?.email);
        if (loginEmail) {
          const accountRl = await checkRateLimit(loginEmail, "login_account", 10, 15 * 60 * 1000, { failClosed: true });
          if (!accountRl.success) {
            return rateLimitedResponse(accountRl, "Too many login attempts for this account. Please wait 15 minutes or reset your password.");
          }
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
        const rl = await checkRateLimit(getClientIp(req.headers), "forgot_password", 5, 60 * 1000, { failClosed: true });
        if (!rl.success) {
          return rateLimitedResponse(rl, "Too many reset requests. Please wait a minute before requesting another link.");
        }
        // Per-recipient limit stops one inbox being flooded from many IPs.
        const resetEmail = normalizeEmailKey(data?.email);
        if (resetEmail) {
          const inboxRl = await checkRateLimit(resetEmail, "forgot_password_inbox", 3, 15 * 60 * 1000, { failClosed: true });
          if (!inboxRl.success) {
            return rateLimitedResponse(inboxRl, "A reset link was already sent to this email. Please check your inbox or wait 15 minutes.");
          }
        }
        const reqHost = req.headers.get("origin") || req.headers.get("referer") || undefined;
        return handleSendResetEmail(data, reqHost);
      }
      case "resetPassword": {
        const rl = await checkRateLimit(getClientIp(req.headers), "reset_password", 10, 60 * 1000, { failClosed: true });
        if (!rl.success) return rateLimitedResponse(rl, "Too many reset attempts. Please wait a minute.");
        return handleResetPassword(data);
      }
      case "sendVerificationEmail": {
        // Unverified users have no authEmail yet, so read the raw session. The recipient is
        // always the signed-in account, never an address from the request body.
        const sessionEmail = await getSessionEmail();
        const rl = await checkRateLimit(getClientIp(req.headers), "verification_email", 5, 15 * 60 * 1000, { failClosed: true });
        if (!rl.success) return rateLimitedResponse(rl, "Too many verification emails requested. Please wait 15 minutes.");
        if (sessionEmail) {
          const inboxRl = await checkRateLimit(sessionEmail, "verification_email_inbox", 3, 15 * 60 * 1000, { failClosed: true });
          if (!inboxRl.success) {
            return rateLimitedResponse(inboxRl, "A verification email was already sent. Please check your inbox or wait 15 minutes.");
          }
        }
        return handleSendVerificationEmail(sessionEmail);
      }
      case "verifyEmailToken": {
        const rl = await checkRateLimit(getClientIp(req.headers), "verify_email_token", 20, 60 * 1000, { failClosed: true });
        if (!rl.success) return rateLimitedResponse(rl, "Too many attempts. Please wait a minute.");
        return handleVerifyEmailToken(data, await getSessionEmail());
      }

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
      case "addLead": {
        if (!authEmail) {
          const targetKey = String(data?.pageId || data?.pageSlug || "signup").slice(0, 50);
          // Fails open: a limiter outage must not stop real leads from being captured.
          const rl = await checkRateLimit(getClientIp(req.headers), `add_lead_${targetKey}`, 30, 60 * 1000);
          if (!rl.success) return rateLimitedResponse(rl, "Too many signups submitted. Please try again in a moment.");
        }
        return handleAddLead(data, req, normEmail, authEmail);
      }
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

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel, EmailEventModel, PdfOtpModel } from "@/lib/models";
import { type MagnetPage, type Resource } from "@/lib/data";
import { clearAuthCookie, setAuthCookie, hasRecentOAuthLogin } from "@/lib/auth";
import { hashPassword, comparePassword } from "@/lib/auth-helpers";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";
import { sendMail } from "@/lib/email";
import { determineRoleForEmail } from "@/lib/roles";
import { cleanDomain as sanitizeDomain, formatSubdomain, removeDomainFromVercel } from "@/lib/domain-verify";
import { revokeGmailAccess } from "@/lib/gmail-oauth";
import { isReservedUsername } from "@/lib/reserved-usernames";
import { createHash, randomBytes } from "crypto";
import { isMaskedSecret, maskSecret, maskWebhookUrl } from "@/lib/secret-mask";
import { isValidEmailAddress } from "@/lib/email-guard";
import { checkRateLimit } from "@/lib/rate-limit";

/** Generates a cryptographically random 64-char hex webhook secret. */
function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

function serverValidatePassword(pass: string): string | null {
  if (!pass || pass.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pass)) return "Password must contain at least one number (0–9).";
  if (!/[^a-zA-Z0-9]/.test(pass)) return "Password must contain at least one special symbol (e.g. !@#$%).";
  return null;
}

export function sanitizeAccount(accountDoc: any) {
  if (!accountDoc) return null;
  const acc = typeof accountDoc.toObject === "function" ? accountDoc.toObject() : { ...accountDoc };
  // Google-only accounts have no password; the UI uses this to show "Set password" instead of "Change password"
  acc.hasPassword = Boolean(acc.password);
  delete acc.password;
  delete acc.resetPasswordToken;
  delete acc.resetPasswordExpires;
  delete acc.emailVerifyTokenHash;
  delete acc.emailVerifyExpires;
  delete acc.linkedinLiAt;
  delete acc.linkedinJSessionId;
  delete acc.linkedinWebhookSecret; // served only via the dedicated webhook-secret endpoint
  delete acc.calendarToken; // calendar integration removed; never expose a leftover token
  delete acc.notifyEmailTokenHash;
  delete acc.notifyEmailTokenExpires;
  delete acc.stripeCheckoutSessionId;
  // Integration secrets stay on the server; the UI gets a masked placeholder (lib/secret-mask.ts)
  acc.slackWebhookUrl = maskWebhookUrl(acc.slackWebhookUrl);
  acc.zapierWebhookUrl = maskWebhookUrl(acc.zapierWebhookUrl);
  acc.pipedriveApiToken = maskSecret(acc.pipedriveApiToken);
  acc.kitApiKey = maskSecret(acc.kitApiKey);
  const computedRole = determineRoleForEmail(acc.email);
  acc.role = computedRole === "super_admin" ? "super_admin" : (acc.role || computedRole);
  // Strip encrypted secrets — never send raw credentials to the client
  if (acc.customSmtp) {
    acc.customSmtp = {
      enabled: acc.customSmtp.enabled ?? false,
      host: acc.customSmtp.host ?? "",
      port: acc.customSmtp.port ?? 587,
      secure: acc.customSmtp.secure ?? false,
      user: acc.customSmtp.user ?? "",
      fromEmail: acc.customSmtp.fromEmail ?? "",
      fromName: acc.customSmtp.fromName ?? "",
      isVerified: acc.customSmtp.isVerified ?? false,
      // pass is intentionally omitted
    };
  }
  if (acc.gmailOAuth) {
    acc.gmailOAuth = {
      connected: acc.gmailOAuth.connected ?? false,
      gmailAddress: acc.gmailOAuth.gmailAddress ?? "",
      fromName: acc.gmailOAuth.fromName ?? "",
      // accessToken and refreshToken are intentionally omitted
    };
  }
  return acc;
}

function sanitizeHttpUrl(url: any): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Disallow pseudo-protocols like javascript:, data:, vbscript:, etc.
  if (/^[a-z0-9+.-]+:/i.test(trimmed)) return "";
  return `https://${trimmed}`;
}

function sanitizeBrandColor(val: any): string {
  if (typeof val !== "string") return "#0066B2";
  let trimmed = val.trim();
  if (!trimmed) return "#0066B2";
  // Auto-prepend leading # if user supplied valid hex chars without #
  if (!trimmed.startsWith("#") && /^[0-9a-f]{3,8}$/i.test(trimmed) && (trimmed.length === 3 || trimmed.length === 4 || trimmed.length === 6 || trimmed.length === 8)) {
    trimmed = `#${trimmed}`;
  }
  // Validate strict hex pattern (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return trimmed;
  }
  return "#0066B2";
}

/** Validates that Slack webhooks are secure HTTPS endpoints hosted on slack.com */
export function isValidSlackWebhookUrl(rawUrl: string): boolean {
  if (!rawUrl || !rawUrl.trim()) return true; // Empty string allowed so users can disconnect
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();
    const isAllowedHost = hostname === "hooks.slack.com" || hostname.endsWith(".slack.com");
    return parsed.protocol === "https:" && isAllowedHost;
  } catch {
    return false;
  }
}

/** Validates that Zapier/Make webhooks are secure HTTPS endpoints hosted on official domains */
export function isValidZapierWebhookUrl(rawUrl: string): boolean {
  if (!rawUrl || !rawUrl.trim()) return true; // Empty string allowed so users can disconnect
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();
    const isAllowedHost =
      hostname === "hooks.zapier.com" ||
      hostname.endsWith(".zapier.com") ||
      hostname === "hook.integromat.com" ||
      hostname.endsWith(".integromat.com") ||
      hostname === "hook.eu1.make.com" ||
      hostname.endsWith(".make.com");
    return parsed.protocol === "https:" && isAllowedHost;
  } catch {
    return false;
  }
}

export async function handleSaveAccount(data: any, authEmail: string | null) {
  let normalizedEmail = authEmail ? authEmail.trim().toLowerCase() : null;
  if (!normalizedEmail && data?.email && typeof data.email === "string") {
    normalizedEmail = data.email.trim().toLowerCase();
  }

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in to update your account." }, { status: 401 });
  }

  // If user is authenticated, they cannot modify someone else's account
  if (authEmail && data?.email && data.email.trim().toLowerCase() !== normalizedEmail) {
    return NextResponse.json({ error: "Forbidden. You can only update your own account." }, { status: 403 });
  }

  data.email = normalizedEmail;

  // Validate GA4 Measurement ID and Meta Pixel ID to prevent script injection
  if (data.ga4MeasurementId !== undefined && data.ga4MeasurementId !== null) {
    const trimmed = String(data.ga4MeasurementId).trim();
    if (trimmed !== "" && !/^G-[A-Z0-9]+$/i.test(trimmed)) {
      return NextResponse.json({ error: "Invalid GA4 Measurement ID format. Expected G-XXXXXXXXXX" }, { status: 400 });
    }
    data.ga4MeasurementId = trimmed;
  }

  if (data.metaPixelId !== undefined && data.metaPixelId !== null) {
    const trimmed = String(data.metaPixelId).trim();
    if (trimmed !== "" && !/^\d{1,30}$/.test(trimmed)) {
      return NextResponse.json({ error: "Invalid Meta Pixel ID format. Expected numbers only." }, { status: 400 });
    }
    data.metaPixelId = trimmed;
  }

  // Sanitize Privacy Policy & Terms of Service URLs: only allow http/https, auto-prefix https://
  if (data.privacyPolicy !== undefined && data.privacyPolicy !== null) {
    data.privacyPolicy = sanitizeHttpUrl(data.privacyPolicy);
  }
  if (data.termsOfService !== undefined && data.termsOfService !== null) {
    data.termsOfService = sanitizeHttpUrl(data.termsOfService);
  }

  // Validate brandColor: only valid hex allowed, otherwise fall back to #0066B2
  if (data.brandColor !== undefined && data.brandColor !== null) {
    data.brandColor = sanitizeBrandColor(data.brandColor);
  }

  let existing = await AccountModel.findOne({ email: normalizedEmail });
  if (!existing && data.id) {
    existing = await AccountModel.findOne({ id: data.id, email: normalizedEmail });
  }

  // CRITICAL SECURITY GUARD:
  // Unauthenticated requests (authEmail === null) are strictly new registrations.
  // They MUST NOT be allowed to overwrite an existing account!
  if (!authEmail && existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in instead." },
      { status: 409 }
    );
  }

  let account;
  if (existing) {
    existing.name = data.name || existing.name;
    existing.brandName = data.brandName !== undefined ? data.brandName : existing.brandName;
    if (data.username !== undefined && data.username !== existing.username) {
      const cleanUser = String(data.username).trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (cleanUser && cleanUser !== existing.username) {
        if (isReservedUsername(cleanUser)) {
          return NextResponse.json({ error: "This username is reserved. Please choose another." }, { status: 400 });
        }
        const collision = await AccountModel.findOne({ username: cleanUser, email: { $ne: normalizedEmail } });
        if (collision) {
          return NextResponse.json({ error: "This username is already taken. Please choose another." }, { status: 400 });
        }
        existing.username = cleanUser;
      }
    }
    existing.brandColor = data.brandColor || existing.brandColor;
    existing.logo = data.logo !== undefined ? data.logo : existing.logo;
    existing.avatar = data.avatar !== undefined ? data.avatar : existing.avatar;
    existing.leadAlertsEnabled = data.leadAlertsEnabled !== undefined ? data.leadAlertsEnabled : existing.leadAlertsEnabled;
    // A different alert inbox only takes effect once that inbox confirms it (handleConfirmNotifyEmail),
    // so lead alerts cannot be pointed at someone else's address.
    let notifyEmailToConfirm: { address: string; token: string } | null = null;
    if (data.notifyEmail !== undefined && data.notifyEmail !== null) {
      const requested = String(data.notifyEmail).trim().toLowerCase();
      const current = String(existing.notifyEmail || "").trim().toLowerCase();
      const pendingStillValid =
        requested === String(existing.notifyEmailPending || "").toLowerCase() &&
        existing.notifyEmailTokenExpires &&
        new Date(existing.notifyEmailTokenExpires).getTime() > Date.now();

      if (!requested || requested === existing.email) {
        existing.notifyEmail = requested;
        existing.notifyEmailPending = "";
        existing.notifyEmailTokenHash = null;
        existing.notifyEmailTokenExpires = null;
      } else if (requested === current || pendingStillValid) {
        // Unchanged, or already waiting for confirmation: nothing to do
      } else if (!isValidEmailAddress(requested)) {
        return NextResponse.json({ error: "Please enter a valid notification email address." }, { status: 400 });
      } else if (!existing.emailVerified) {
        return NextResponse.json(
          { error: "Verify your account email before sending alerts to a different address." },
          { status: 403 }
        );
      } else {
        const rl = await checkRateLimit(existing.email, "notify_email_confirm", 5, 60 * 60 * 1000, { failClosed: true });
        if (!rl.success) {
          return NextResponse.json(
            { error: "Too many confirmation emails requested. Please try again later." },
            { status: rl.unavailable ? 503 : 429 }
          );
        }
        const token = randomBytes(32).toString("hex");
        existing.notifyEmailPending = requested;
        existing.notifyEmailTokenHash = hashToken(token);
        existing.notifyEmailTokenExpires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
        notifyEmailToConfirm = { address: requested, token };
      }
    }
    existing.themeMode = data.themeMode || existing.themeMode;
    existing.highlightIntensity = data.highlightIntensity ?? existing.highlightIntensity;
    existing.templateId = data.templateId || existing.templateId;
    if (data.slackWebhookUrl !== undefined && data.slackWebhookUrl !== null && !isMaskedSecret(data.slackWebhookUrl)) {
      const rawSlack = String(data.slackWebhookUrl).trim();
      if (rawSlack && !isValidSlackWebhookUrl(rawSlack)) {
        return NextResponse.json(
          { error: "Invalid Slack Webhook URL. Must be a secure HTTPS URL from hooks.slack.com." },
          { status: 400 }
        );
      }
      existing.slackWebhookUrl = rawSlack;
    }
    if (data.zapierWebhookUrl !== undefined && data.zapierWebhookUrl !== null && !isMaskedSecret(data.zapierWebhookUrl)) {
      const rawZapier = String(data.zapierWebhookUrl).trim();
      if (rawZapier && !isValidZapierWebhookUrl(rawZapier)) {
        return NextResponse.json(
          { error: "Invalid Webhook URL. Must be a secure HTTPS URL from Zapier (hooks.zapier.com) or Make/Integromat." },
          { status: 400 }
        );
      }
      existing.zapierWebhookUrl = rawZapier;
    }
    // Masked placeholders (see sanitizeAccount) come back unchanged from the UI: keep the stored secret
    if (typeof data.pipedriveApiToken === "string" && !isMaskedSecret(data.pipedriveApiToken)) {
      existing.pipedriveApiToken = data.pipedriveApiToken.trim();
    }
    existing.kitConnected = data.kitConnected !== undefined ? data.kitConnected : existing.kitConnected;
    if (typeof data.kitApiKey === "string" && !isMaskedSecret(data.kitApiKey)) {
      existing.kitApiKey = data.kitApiKey.trim();
    }
    existing.senderDisplayName = data.senderDisplayName !== undefined ? data.senderDisplayName : existing.senderDisplayName;
    existing.senderAddress = data.senderAddress !== undefined ? data.senderAddress : existing.senderAddress;
    // Domain verification flags are owned by /api/domain/verify.
    // This save may change the requested host, and clears proof when the host changes.
    // It never copies domainVerified / cnameVerified from the client.
    if (data.customDomain !== undefined) {
      const sanitizedDom = sanitizeDomain(data.customDomain);
      const prevDom = sanitizeDomain(existing.customDomain);
      const nextSub = formatSubdomain(
        data.customSubdomain !== undefined ? data.customSubdomain : (existing.customSubdomain || "get")
      );
      const prevSub = formatSubdomain(existing.customSubdomain || "get");

      if (sanitizedDom && sanitizedDom !== prevDom) {
        const domainInUse = await AccountModel.findOne({
          email: { $ne: existing.email },
          customDomain: sanitizedDom,
          cnameVerified: true,
        }).lean();
        if (domainInUse) {
          return NextResponse.json(
            { error: "This custom domain is already verified on another workspace.", code: "DOMAIN_ALREADY_CLAIMED" },
            { status: 409 }
          );
        }
        // Only clear proof if this save still owns the previous host.
        // A verify request that already moved the host must keep its result.
        await AccountModel.updateOne(
          {
            _id: existing._id,
            $or: [
              { customDomain: prevDom },
              { customDomain: "" },
              { customDomain: null },
              { customDomain: { $exists: false } },
            ],
          },
          {
            $set: {
              customDomain: sanitizedDom,
              customSubdomain: nextSub,
              domainVerified: false,
              cnameVerified: false,
              sslStatus: "pending",
            },
          }
        );
      } else if (!sanitizedDom) {
        await AccountModel.updateOne(
          { _id: existing._id },
          {
            $set: {
              customDomain: "",
              customSubdomain: "get",
              domainVerified: false,
              cnameVerified: false,
              sslStatus: "pending",
            },
          }
        );
      } else if (data.customSubdomain !== undefined && nextSub !== prevSub) {
        await AccountModel.updateOne(
          {
            _id: existing._id,
            customDomain: sanitizedDom,
            $or: [
              { customSubdomain: existing.customSubdomain },
              { customSubdomain: prevSub },
              { customSubdomain: { $in: ["", null] } },
              { customSubdomain: { $exists: false } },
            ],
          },
          {
            $set: {
              customSubdomain: nextSub,
              cnameVerified: false,
              sslStatus: "pending",
            },
          }
        );
      }
    }
    existing.ga4MeasurementId = data.ga4MeasurementId !== undefined ? data.ga4MeasurementId : existing.ga4MeasurementId;
    existing.metaPixelId = data.metaPixelId !== undefined ? data.metaPixelId : existing.metaPixelId;
    existing.faviconUrl = data.faviconUrl !== undefined ? data.faviconUrl : existing.faviconUrl;
    existing.privacyPolicy = data.privacyPolicy !== undefined ? data.privacyPolicy : existing.privacyPolicy;
    existing.termsOfService = data.termsOfService !== undefined ? data.termsOfService : existing.termsOfService;
    existing.substackPublication = data.substackPublication !== undefined ? data.substackPublication : existing.substackPublication;
    // spfVerified / dkimVerified are verification results: only server-side DNS checks may set them,
    // never the client.

    // Security: Existing accounts CANNOT update password through handleSaveAccount.
    // Password updates must strictly use handleUpdatePassword with verification.
    account = await existing.save();

    if (notifyEmailToConfirm) {
      const sent = await sendNotifyEmailConfirmation(account, notifyEmailToConfirm.address, notifyEmailToConfirm.token)
        .catch((err) => ({ success: false, error: String(err) }));
      if (!sent.success) {
        console.error("[notify-email] Confirmation email failed:", sent.error);
        // Clear the pending request so saving again sends a fresh link instead of waiting out the expiry
        await AccountModel.updateOne(
          { _id: account._id, notifyEmailPending: notifyEmailToConfirm.address },
          { $set: { notifyEmailPending: "", notifyEmailTokenHash: null, notifyEmailTokenExpires: null } }
        );
        account.notifyEmailPending = "";
        return NextResponse.json(
          { error: "We couldn't send the confirmation email to that address. Please try again.", account: sanitizeAccount(account) },
          { status: 502 }
        );
      }
    }
  } else {
    let username = String(data.username || "user").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 15) || "user";
    let count = 0;
    let uniqueUsername = username;
    while (isReservedUsername(uniqueUsername) || (await AccountModel.findOne({ username: uniqueUsername }))) {
      count++;
      uniqueUsername = `${username.slice(0, 15 - String(count).length)}${count}`;
    }
    data.username = uniqueUsername;
    if (data.password && !/^\$2[aby]\$\d+\$/.test(data.password)) {
      const pwdErr = serverValidatePassword(data.password);
      if (pwdErr) {
        return NextResponse.json({ error: pwdErr }, { status: 400 });
      }
      data.password = await hashPassword(data.password);
    }
    if (!data.joinedAt) {
      data.joinedAt = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    // Build new account document from an explicit allowlist of legitimate signup fields.
    // Privileged, server-managed, and lead-routing fields (webhooks, notify email, tokens)
    // are strictly excluded to prevent pre-account takeover attacks.
    const newAccountData: Record<string, any> = {
      email: normalizedEmail,
      name: typeof data.name === "string" && data.name.trim() ? data.name.trim().slice(0, 100) : "Subscriber",
      username: uniqueUsername,
      password: data.password,
      brandName: typeof data.brandName === "string" ? data.brandName.trim().slice(0, 100) : "",
      brandColor: data.brandColor || "#0066B2",
      logo: typeof data.logo === "string" && data.logo.trim() ? data.logo.trim() : null,
      avatar: typeof data.avatar === "string" && data.avatar.trim() ? data.avatar.trim() : null,
      themeMode: data.themeMode === "dark" ? "dark" : "light",
      highlightIntensity: typeof data.highlightIntensity === "number" ? data.highlightIntensity : 100,
      templateId: typeof data.templateId === "string" && data.templateId.trim() ? data.templateId.trim().slice(0, 50) : "template1",
      joinedAt: data.joinedAt || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      role: determineRoleForEmail(data.email || normalizedEmail),
      // Always server-generated: a client-chosen secret would let whoever pre-registers
      // this email post leads into the account after the real owner claims it.
      linkedinWebhookSecret: generateWebhookSecret(),
      plan: "Free",
      emailVerified: null,
      tokenVersion: 0,
      domainVerified: false,
      cnameVerified: false,
      sslStatus: "pending",
      customDomain: sanitizeDomain(data.customDomain),
      customSubdomain: formatSubdomain(data.customSubdomain),
    };
    account = await AccountModel.create(newAccountData);

    // A failed send must not fail the signup: the "check your inbox" page can resend.
    const verifyResult = await issueEmailVerification(account).catch((err) => ({ success: false, error: String(err) }));
    if (!verifyResult.success) {
      console.error("[signup] Verification email failed:", verifyResult.error);
    }
  }

  const res = NextResponse.json({ success: true, account: sanitizeAccount(account) });
  setAuthCookie(res, normalizedEmail, account?.name, account?.tokenVersion ?? 0, Boolean(account?.emailVerified));
  return res;
}

export async function handleCheckEmail(data: any) {
  const existing = await AccountModel.findOne({ email: data.email.trim().toLowerCase() });
  return NextResponse.json({ exists: !!existing });
}

export async function handleDeleteAccount(data: any, authEmail: string | null) {
  const { email, password } = data;
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
  }

  if (authEmail !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Forbidden. You can only delete your own account." }, { status: 403 });
  }

  const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }
  if (account.password) {
    const { isValid } = await comparePassword(password, account.password);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }
  } else {
    // Google-only account: confirm by typing the email, plus a fresh Google sign-in
    if (String(data.confirmEmail || "").trim().toLowerCase() !== authEmail) {
      return NextResponse.json({ error: "The email you typed doesn't match your account email." }, { status: 400 });
    }
    if (!(await hasRecentOAuthLogin(authEmail))) {
      return NextResponse.json(
        { error: "For your security, please confirm with Google before deleting your account.", code: "REAUTH_REQUIRED" },
        { status: 403 }
      );
    }
  }
  const normDelEmail = email.trim().toLowerCase();

  const userPages = (await MagnetPageModel.find({ userEmail: normDelEmail }).lean()) as unknown as MagnetPage[];
  const userResources = (await ResourceModel.find({ userEmail: normDelEmail }).lean()) as unknown as Resource[];

  // Collect page identifiers to delete all associated leads & OTPs
  const userPageIds: string[] = [];
  const allUserAssets: string[] = [];

  // Account level assets (logo, avatar, favicon, ogImage)
  if (account.logo) allUserAssets.push(account.logo);
  if (account.avatar) allUserAssets.push(account.avatar);
  if (account.faviconUrl) allUserAssets.push(account.faviconUrl);
  if (account.ogImageUrl) allUserAssets.push(account.ogImageUrl);

  // Magnet Pages & locked PDF page images & deliverable files
  userPages.forEach((p) => {
    if (p.id) userPageIds.push(p.id);
    if ((p as any)._id) userPageIds.push((p as any)._id.toString());
    if (p.imageUrl) allUserAssets.push(p.imageUrl);
    if (p.variantBImage) allUserAssets.push(p.variantBImage);
    if ((p as any).assetUrl) allUserAssets.push((p as any).assetUrl);
    if (Array.isArray(p.pdfPages)) {
      p.pdfPages.forEach((u: string) => { if (u) allUserAssets.push(u); });
    }
  });

  // Uploaded media & resource deliverable files
  userResources.forEach((r) => {
    const u = r.fileUrl || r.url;
    if (u) allUserAssets.push(u);
  });

  // Release external resources tied to the account (both best-effort, never block deletion):
  // revoke Gmail access at Google and detach the custom domain from our Vercel project
  await Promise.all([
    revokeGmailAccess((account as any).gmailOAuth?.refreshToken),
    account.customDomain ? removeDomainFromVercel(account.customDomain, account.customSubdomain || "get") : null,
  ]);

  // Completely purge all collections from top to bottom
  await Promise.all([
    AccountModel.deleteOne({ email: normDelEmail }),
    MagnetPageModel.deleteMany({ userEmail: normDelEmail }),
    LeadModel.deleteMany({
      $or: [
        { userEmail: normDelEmail },
        // Only unassigned legacy leads by pageId: page ids are not unique across tenants
        ...(userPageIds.length > 0 ? [{ pageId: { $in: userPageIds }, userEmail: { $in: [null, ""] } }] : []),
      ],
    }),
    SequenceModel.deleteMany({ userEmail: normDelEmail }),
    IntegrationModel.deleteMany({ userEmail: normDelEmail }),
    ResourceModel.deleteMany({ userEmail: normDelEmail }),
    EmailEventModel.deleteMany({ userEmail: normDelEmail }),
    ...(userPageIds.length > 0 ? [PdfOtpModel.deleteMany({ magnetId: { $in: userPageIds } })] : []),
  ]);

  // Permanently delete all Cloudinary media assets with tenant verification
  if (allUserAssets.length > 0) {
    deleteCloudinaryAssets(allUserAssets, normDelEmail).catch((err) =>
      console.error("Cloudinary cleanup error on deleteAccount:", err)
    );
  }

  const res = NextResponse.json({ success: true });
  clearAuthCookie(res);
  return res;
}

export async function handleLogin(data: any) {
  const { email, password } = data || {};
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const account = await AccountModel.findOne({ email: email.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "No account found with this email. Sign up instead." }, { status: 400 });
  }
  const { isValid, needsRehash } = await comparePassword(password, account.password);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
  }

  if (needsRehash) {
    account.password = await hashPassword(password);
    await account.save();
  }

  // Set the HttpOnly session cookie right here — identity is verified above.
  // Sensitive fields (password, tokens, LinkedIn session cookies) are completely sanitized.
  const res = NextResponse.json({ success: true, account: sanitizeAccount(account) });
  setAuthCookie(res, account.email, account.name, account.tokenVersion ?? 0, Boolean(account.emailVerified));

  // Set persistent client-accessible cookies for Last Used login indicator
  res.cookies.set("leadmagnets_last_auth_method", "email", {
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
    httpOnly: false,
  });
  res.cookies.set("leadmagnets_last_auth_email", account.email, {
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
    httpOnly: false,
  });

  return res;
}

export async function handleUpdatePassword(data: any, authEmail: string | null) {
  const { email, currentPassword, newPassword } = data || {};
  if (!newPassword || typeof newPassword !== "string") {
    return NextResponse.json({ error: "New password is required." }, { status: 400 });
  }
  const pwdErr = serverValidatePassword(newPassword);
  if (pwdErr) {
    return NextResponse.json({ error: pwdErr }, { status: 400 });
  }

  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
  }

  if (authEmail !== email?.trim().toLowerCase()) {
    return NextResponse.json({ error: "Forbidden. You can only update your own password." }, { status: 403 });
  }

  const account = await AccountModel.findOne({ email: authEmail });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 400 });
  }
  if (account.password) {
    const { isValid } = await comparePassword(currentPassword, account.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  } else if (!(await hasRecentOAuthLogin(authEmail))) {
    // Google-only account setting its first password: require a fresh Google sign-in instead
    return NextResponse.json(
      { error: "For your security, please confirm with Google before setting a password.", code: "REAUTH_REQUIRED" },
      { status: 403 }
    );
  }
  account.password = await hashPassword(newPassword);
  // Increment tokenVersion so all other active sessions are revoked
  account.tokenVersion = (account.tokenVersion || 0) + 1;
  await account.save();

  const updateRes = NextResponse.json({ success: true });
  // Refresh auth cookie for current session with new tokenVersion
  setAuthCookie(updateRes, account.email, account.name, account.tokenVersion, Boolean(account.emailVerified));
  return updateRes;
}

export async function handleGetAccountByEmail(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }
  // sanitizeAccount strips the password hash; it needs it present to compute hasPassword
  const account = await AccountModel.findOne({ email: authEmail }).lean();
  return NextResponse.json({ account: sanitizeAccount(account) });
}

/**
 * Origin for links in account emails. Local dev links back to the dev server; production always
 * uses the canonical app URL, never a request header (Origin/Host), which an attacker controls.
 */
function getAppOrigin(): string {
  const appUrl =
    process.env.NODE_ENV !== "production" && process.env.NEXTAUTH_URL
      ? process.env.NEXTAUTH_URL
      : process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  return appUrl.replace(/\/$/, "");
}

export async function handleSendResetEmail(data: any) {
  const { email } = data || {};
  if (!email || typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const normEmail = email.trim().toLowerCase();
  const account = await AccountModel.findOne({ email: normEmail });

  // Production security best practice (OWASP):
  // Return success without leaking whether an account exists to prevent account enumeration.
  if (!account) {
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset password link has been sent."
    });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  account.resetPasswordToken = hashToken(token);
  account.resetPasswordExpires = expires;
  await account.save();

  const cleanOrigin = getAppOrigin();
  const resetUrl = `${cleanOrigin}/reset-password?token=${token}`;

  const sendResult = await sendMail({
    to: normEmail,
    subject: "Reset your LeadMagnets password",
    isTransactional: true,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0f172a;">
  <div style="background-color: #f8fafc; padding: 48px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; width: 100%; margin: 0 auto;">
      
      <!-- Brand Logo Header -->
      <tr>
        <td style="padding-bottom: 28px; text-align: center;">
          <a href="${cleanOrigin}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${cleanOrigin}/brand/custom-logo-light.png" 
              alt="LeadMagnets" 
              height="30" 
              style="height: 30px; width: auto; max-height: 34px; display: inline-block; border: 0; outline: none;" 
            />
          </a>
        </td>
      </tr>

      <!-- Main Card Container -->
      <tr>
        <td>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);">
            
            <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.3; letter-spacing: -0.02em;">
              Reset your password
            </h1>
            <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0; line-height: 1.6;">
              Hi ${account.name || "there"},
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 28px 0; line-height: 1.6;">
              We received a request to reset your LeadMagnets account password. Click the button below to choose a new password:
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 28px;">
              <tr>
                <td style="text-align: center;">
                  <a href="${resetUrl}" style="background-color: #0066B2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; letter-spacing: -0.01em;">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>

            <div style="background-color: #f8fafc; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
              <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
                ⏱ This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; word-break: break-all;">
              Button not working? Copy and paste this URL into your browser:<br />
              <a href="${resetUrl}" style="color: #0066B2; text-decoration: underline;">${resetUrl}</a>
            </p>

          </div>
        </td>
      </tr>

      <!-- Minimal Footer -->
      <tr>
        <td style="padding-top: 24px; text-align: center;">
          <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            Sent by <strong style="color: #64748b; font-weight: 600;">LeadMagnets</strong> · Account Security
          </div>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
    `,
  }, normEmail);

  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.error || "Failed to send reset email. Please try again later." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Reset link sent! Please check your email inbox." });
}

export async function handleResetPassword(data: any) {
  const { token, newPassword } = data || {};
  if (!token || !newPassword || typeof token !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Invalid request parameters." }, { status: 400 });
  }

  const pwdErr = serverValidatePassword(newPassword);
  if (pwdErr) {
    return NextResponse.json({ error: pwdErr }, { status: 400 });
  }

  const cleanToken = token.trim();

  const account = await AccountModel.findOne({
    resetPasswordToken: hashToken(cleanToken),
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!account) {
    return NextResponse.json({ error: "Password reset token is invalid or has expired." }, { status: 400 });
  }

  account.password = await hashPassword(newPassword);
  account.resetPasswordToken = null;
  account.resetPasswordExpires = null;
  // Opening the reset link proves the user controls this inbox
  if (!account.emailVerified) {
    account.emailVerified = new Date();
    account.emailVerifyTokenHash = null;
    account.emailVerifyExpires = null;
  }
  // Increment tokenVersion so all previous sessions are revoked immediately
  account.tokenVersion = (account.tokenVersion || 0) + 1;
  await account.save();

  return NextResponse.json({ success: true });
}

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

/** Tokens are stored only as SHA-256 hashes, so a leaked database cannot be used to verify or reset accounts. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Emails the confirmation link for a new lead-alert inbox. The link is the only way an address
 * other than the account email becomes notifyEmail.
 */
async function sendNotifyEmailConfirmation(account: any, address: string, token: string) {
  const origin = getAppOrigin();
  const confirmUrl = `${origin}/api/account/notify-email/confirm?token=${token}`;
  // Only the (verified) account email is shown: the display name is free text anyone can set
  const safeAccountEmail = escapeHtml(String(account.email || ""));

  // Platform sender (transactional): the owner's own Gmail must not be used to send this.
  return sendMail({
    to: address,
    subject: "Confirm lead alerts for your inbox",
    isTransactional: true,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Confirm lead alerts</title></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="padding:48px 16px;">
    <div style="max-width:500px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;">Confirm lead alerts</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
        The LeadMagnets account ${safeAccountEmail} asked to send its new-lead alerts to this address.
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
        If you expected this, confirm below. If not, ignore this email and nothing will be sent to you.
      </p>
      <a href="${confirmUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background:#0066cc;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Confirm this inbox</a>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">This link expires in 24 hours.</p>
    </div>
  </div>
</body>
</html>`,
  });
}

/** Consumes a notify-email confirmation token; the confirmed address becomes the alert inbox. */
export async function handleConfirmNotifyEmail(token: string): Promise<{ success: boolean; address?: string }> {
  if (!token || !/^[a-f0-9]{64}$/i.test(token.trim())) return { success: false };
  const account: any = await AccountModel.findOne({
    notifyEmailTokenHash: hashToken(token.trim().toLowerCase()),
    notifyEmailTokenExpires: { $gt: new Date() },
  });
  if (!account || !account.notifyEmailPending) return { success: false };

  const address = String(account.notifyEmailPending).trim().toLowerCase();
  account.notifyEmail = address;
  account.notifyEmailPending = "";
  account.notifyEmailTokenHash = null;
  account.notifyEmailTokenExpires = null;
  await account.save();
  return { success: true, address };
}

/**
 * Creates a fresh single-use verification token for `account` (replacing any earlier one)
 * and emails the confirmation link to the account's address.
 */
async function issueEmailVerification(account: any): Promise<{ success: boolean; error?: string }> {
  const token = randomBytes(32).toString("hex");
  account.emailVerifyTokenHash = hashToken(token);
  account.emailVerifyExpires = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
  await account.save();

  const origin = getAppOrigin();
  const confirmUrl = `${origin}/register/confirm?token=${token}`;
  const safeEmail = escapeHtml(account.email);

  // No owner argument: this system email must always come from the platform sender (SMTP_FROM),
  // never from a Gmail or SMTP account the user connected.
  return sendMail({
    to: account.email,
    subject: "Verify your LeadMagnets email",
    isTransactional: true,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0f172a;">
  <div style="background-color: #f8fafc; padding: 48px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; width: 100%; margin: 0 auto;">
      
      <!-- Brand Logo Header -->
      <tr>
        <td style="padding-bottom: 28px; text-align: center;">
          <a href="${origin}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${origin}/brand/custom-logo-light.png" 
              alt="LeadMagnets" 
              height="30" 
              style="height: 30px; width: auto; max-height: 34px; display: inline-block; border: 0; outline: none;" 
            />
          </a>
        </td>
      </tr>

      <!-- Main Card Container -->
      <tr>
        <td>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04); text-align: center;">
            
            <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 10px 0; line-height: 1.3; letter-spacing: -0.02em;">
              Verify your email address
            </h1>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 28px 0; line-height: 1.6;">
              Please confirm your email address (<strong style="color: #0f172a;">${safeEmail}</strong>) to finish setting up your LeadMagnets account.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 28px;">
              <tr>
                <td style="text-align: center;">
                  <a href="${confirmUrl}" style="background-color: #0066B2; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; letter-spacing: -0.01em;">
                    Verify Email Address →
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
              This link will expire in 24 hours. If you did not create an account, no further action is required.
            </p>

          </div>
        </td>
      </tr>

      <!-- Minimal Footer -->
      <tr>
        <td style="padding-top: 24px; text-align: center;">
          <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            Sent by <strong style="color: #64748b; font-weight: 600;">LeadMagnets</strong> · Account Verification
          </div>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
    `,
  });
}

/**
 * Resends the verification link to the signed-in user's own address.
 * The recipient always comes from the session, never from the request body.
 */
export async function handleSendVerificationEmail(sessionEmail: string | null) {
  if (!sessionEmail) {
    return NextResponse.json({ error: "Please sign in to resend the verification email." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: sessionEmail });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (account.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  const sendResult = await issueEmailVerification(account);
  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.error || "Failed to send verification email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * Consumes a verification token from the email link. If the same browser is signed in
 * to that account, its session cookie is reissued so the gate opens without a new login.
 */
export async function handleVerifyEmailToken(data: any, sessionEmail: string | null) {
  const { token } = data || {};
  if (!token || typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token.trim())) {
    return NextResponse.json({ error: "This verification link is invalid." }, { status: 400 });
  }

  const tokenFilter = {
    emailVerifyTokenHash: hashToken(token.trim().toLowerCase()),
    emailVerifyExpires: { $gt: new Date() },
  };

  // The link alone must not verify: anyone can sign up with someone else's address, and
  // verifying from the owner's click would keep the squatter's password on the account.
  // Only the browser signed in to this account (i.e. someone who knows its password) may
  // finish. The real owner who never signed up can take the account over via password reset.
  const pending: any = await AccountModel.findOne(tokenFilter, { email: 1 }).lean();
  if (pending && sessionEmail !== pending.email) {
    return NextResponse.json(
      { error: "Sign in to finish verifying your email.", code: "SIGN_IN_REQUIRED" },
      { status: 401 }
    );
  }

  const account = await AccountModel.findOneAndUpdate(
    { ...tokenFilter, email: sessionEmail },
    {
      $set: { emailVerified: new Date() },
      $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 },
    },
    { returnDocument: "after" }
  );

  if (!account) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired. Sign in to request a new one.", code: "TOKEN_INVALID" },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ success: true, signedIn: true });
  setAuthCookie(res, account.email, account.name, account.tokenVersion ?? 0, true);
  return res;
}

// ---------------------------------------------------------------------------
// LinkedIn Automation Handlers
// ---------------------------------------------------------------------------

/**
 * Returns the user's personal LinkedIn webhook URL and their secret.
 * If the account was created before this feature existed and has no secret,
 * we auto-generate one now (lazy provisioning — same as GitHub's PAT system).
 */
export async function handleGetLinkedInConfig(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Lazy provisioning: generate secret for existing accounts that predate this feature
  if (!account.linkedinWebhookSecret) {
    account.linkedinWebhookSecret = generateWebhookSecret();
    await account.save();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";

  return NextResponse.json({
    success: true,
    webhookUrl: `${appUrl}/api/webhooks/linkedin`,
    secret: account.linkedinWebhookSecret,
  });
}

/**
 * Generates a brand-new webhook secret for the user and saves it.
 * Invalidates the old secret immediately — any Make.com scenarios using
 * the old secret must be updated. Same "Regenerate" pattern as Stripe API keys.
 */
export async function handleRegenerateLinkedInSecret(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const newSecret = generateWebhookSecret();
  account.linkedinWebhookSecret = newSecret;
  await account.save();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";

  return NextResponse.json({
    success: true,
    webhookUrl: `${appUrl}/api/webhooks/linkedin`,
    secret: newSecret,
    message: "New secret generated. Update your Make.com scenario with this new secret.",
  });
}



/**
 * Directly connects LinkedIn using in-house native session cookie (li_at).
 * Validates the cookie with LinkedIn, fetches the user's profile info,
 * and saves connection state to MongoDB.
 */
export async function handleConnectLinkedInNative(data: any, authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { liAt, jsessionId } = data || {};
  if (!liAt || typeof liAt !== "string" || liAt.trim().length < 15) {
    return NextResponse.json({ error: "Please enter a valid li_at session cookie." }, { status: 400 });
  }

  const cleanLiAt = liAt.trim();
  const cleanJsessionId = (jsessionId || "").trim();

  const { validateLinkedInSession } = await import("@/lib/linkedin-native");
  const validation = await validateLinkedInSession(cleanLiAt, cleanJsessionId);

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // If validation succeeded with profile info, use it.
  // Otherwise if Cloudflare challenged the raw API, still save the valid cookies!
  account.linkedinConnected = true;
  account.linkedinLiAt = cleanLiAt;
  account.linkedinJSessionId = cleanJsessionId;

  if (validation.success && validation.profile) {
    account.linkedinAccountId = validation.profile.id;
    account.linkedinProfileId = validation.profile.id;
    account.linkedinAccountName = validation.profile.fullName;
    account.linkedinProfileImage = validation.profile.avatarUrl;
  } else {
    // Keep existing or set defaults if first time
    if (!account.linkedinAccountName) {
      account.linkedinAccountName = "Connected LinkedIn User";
    }
  }

  await account.save();

  return NextResponse.json({
    success: true,
    message: "LinkedIn connected successfully!",
    profile: validation.profile || {
      id: account.linkedinProfileId || "me",
      fullName: account.linkedinAccountName || "LinkedIn User",
      avatarUrl: account.linkedinProfileImage || "",
    },
    account: sanitizeAccount(account),
  });
}

/**
 * In-App Login with LinkedIn Email & Password.
 * Handles credentials, automatic session extraction, and 2FA challenge initiation.
 */
export async function handleLoginLinkedInCredentials(data: any, authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { email, password } = data || {};
  if (!email || !password) {
    return NextResponse.json({ error: "Please provide both LinkedIn email and password." }, { status: 400 });
  }

  const { loginWithLinkedInCredentials } = await import("@/lib/linkedin-auth-direct");
  const result = await loginWithLinkedInCredentials(email, password);

  if (result.requiresPin) {
    return NextResponse.json({
      success: false,
      requiresPin: true,
      challengeId: result.challengeId,
      transactionData: result.transactionData,
      message: result.error,
    });
  }

  if (!result.success || !result.session || !result.profile) {
    return NextResponse.json({
      success: false,
      error: result.error || "Could not sign into LinkedIn. Please check your credentials.",
    }, { status: 400 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  account.linkedinConnected = true;
  account.linkedinLiAt = result.session.liAt;
  account.linkedinJSessionId = result.session.jsessionId;
  account.linkedinAccountId = result.profile.id;
  account.linkedinProfileId = result.profile.id;
  account.linkedinAccountName = result.profile.fullName;
  account.linkedinProfileImage = result.profile.avatarUrl;
  await account.save();

  return NextResponse.json({
    success: true,
    message: "LinkedIn connected successfully!",
    profile: result.profile,
    account: sanitizeAccount(account),
  });
}

/**
 * Submits 2FA / Verification PIN code sent to user by LinkedIn.
 */
export async function handleSubmitLinkedInPin(data: any, authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { pin, transactionData } = data || {};
  if (!pin) {
    return NextResponse.json({ error: "Please enter the 6-digit verification PIN." }, { status: 400 });
  }

  const { submitLinkedInChallengePin } = await import("@/lib/linkedin-auth-direct");
  const result = await submitLinkedInChallengePin(pin, transactionData || "");

  if (!result.success || !result.session || !result.profile) {
    return NextResponse.json({
      success: false,
      error: result.error || "Verification PIN was incorrect or expired.",
    }, { status: 400 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  account.linkedinConnected = true;
  account.linkedinLiAt = result.session.liAt;
  account.linkedinJSessionId = result.session.jsessionId;
  account.linkedinAccountId = result.profile.id;
  account.linkedinProfileId = result.profile.id;
  account.linkedinAccountName = result.profile.fullName;
  account.linkedinProfileImage = result.profile.avatarUrl;
  await account.save();

  return NextResponse.json({
    success: true,
    message: "LinkedIn verified and connected successfully!",
    profile: result.profile,
    account: sanitizeAccount(account),
  });
}

/**
 * Connects / marks LinkedIn as connected via Chrome Extension.
 */
export async function handleConnectLinkedInExtension(data: any, authEmail: string | null) {
  const email = (authEmail || data?.email || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }

  const account = await AccountModel.findOne({ email });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  account.linkedinConnected = true;
  account.linkedinConnectedVia = "extension";
  if (data?.accountName && !account.linkedinAccountName) {
    account.linkedinAccountName = data.accountName;
  }
  if (data?.avatarUrl && !account.linkedinProfileImage) {
    account.linkedinProfileImage = data.avatarUrl;
  }
  await account.save();

  return NextResponse.json({
    success: true,
    message: "LinkedIn connected via Chrome Extension!",
    account: sanitizeAccount(account),
  });
}

/**
 * Disconnects the user's LinkedIn account.
 */
export async function handleDisconnectLinkedIn(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  account.linkedinConnected = false;
  account.linkedinLiAt = "";
  account.linkedinJSessionId = "";
  account.linkedinAccountId = "";
  account.linkedinAccountName = "";
  account.linkedinProfileId = "";
  account.linkedinProfileImage = "";
  await account.save();

  return NextResponse.json({ success: true, message: "LinkedIn account disconnected." });
}

/**
 * Updates default lead magnet and trigger keyword settings for LinkedIn.
 */
export async function handleSaveLinkedInCampaignSettings(data: any, authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (typeof data.defaultMagnetId === "string") {
    account.linkedinDefaultMagnetId = data.defaultMagnetId.trim();
  }
  if (typeof data.triggerWord === "string") {
    account.linkedinTriggerWord = data.triggerWord.trim().toLowerCase() || "resource";
  }

  await account.save();
  return NextResponse.json({ success: true, message: "LinkedIn settings saved." });
}

/**
 * Runs an immediate comment sync for the authenticated user's account.
 */
export async function handleSyncLinkedInNow(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() }).lean();
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const { syncUserLinkedInComments } = await import("@/lib/linkedin-automation");
  const result = await syncUserLinkedInComments(account);

  const updatedAccount = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() }).lean();
  return NextResponse.json({ ...result, account: sanitizeAccount(updatedAccount) });
}

/**
 * Fetches recent LinkedIn posts for the user and merges them with any per-post campaigns.
 * Uses 100% in-house native LinkedIn engine.
 */
export async function handleGetLinkedInRecentPosts(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account || !account.linkedinConnected) {
    return NextResponse.json({ success: false, posts: [], message: "LinkedIn not connected." });
  }

  const savedCampaigns = (account.linkedinPostCampaigns || []).map((c: any) => ({
    postId: c.postId,
    postUrl: c.postUrl || `https://www.linkedin.com/feed/update/${c.postId}`,
    postText: c.postText || `LinkedIn Post (${c.postId})`,
    commentsCount: Number(c.commentsCount) || 0,
    createdAt: c.createdAt || "",
    enabled: c.enabled !== undefined ? c.enabled : true,
    magnetId: c.magnetId || (account.linkedinDefaultMagnetId || ""),
    triggerWord: c.triggerWord || (account.linkedinTriggerWord || "resource"),
  }));

  const liAt = account.linkedinLiAt || account.linkedinAccountId;
  if (!liAt) {
    return NextResponse.json({ success: true, posts: savedCampaigns });
  }

  try {
    const { fetchUserLinkedInPosts } = await import("@/lib/linkedin-native");
    const postsRes = await fetchUserLinkedInPosts(
      liAt,
      account.linkedinProfileId || "me",
      account.linkedinJSessionId || "",
      20
    );

    const rawPosts = postsRes.posts || [];
    const postMap = new Map<string, any>();

    // 1. Add all saved campaigns first
    for (const sc of savedCampaigns) {
      postMap.set(sc.postId, sc);
    }

    // 2. Overlay / add feed posts
    for (const p of rawPosts) {
      const postId = p.social_id || p.id || "";
      if (!postId) continue;
      const existing = postMap.get(postId);
      postMap.set(postId, {
        postId,
        postUrl: p.postUrl || (postId ? `https://www.linkedin.com/feed/update/${postId}` : ""),
        postText: p.text || (existing?.postText || "LinkedIn Post"),
        commentsCount: Number(p.commentsCount) || (existing?.commentsCount || 0),
        createdAt: p.createdAt || (existing?.createdAt || ""),
        enabled: existing ? existing.enabled : true,
        magnetId: existing ? existing.magnetId : (account.linkedinDefaultMagnetId || ""),
        triggerWord: existing ? existing.triggerWord : (account.linkedinTriggerWord || "resource"),
      });
    }

    return NextResponse.json({ success: true, posts: Array.from(postMap.values()) });
  } catch (err: any) {
    console.error("[LinkedIn Native Recent Posts Error]:", err);
    // Fallback gracefully to saved campaigns so user never sees an empty screen!
    return NextResponse.json({ success: true, posts: savedCampaigns });
  }
}

/**
 * Saves or updates automation configuration for a specific LinkedIn post.
 */
export async function handleSaveLinkedInPostCampaign(data: any, authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { postId, enabled, magnetId, triggerWord, postUrl, postText, commentsCount, createdAt } = data;
  if (!postId) {
    return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
  }

  const account = await AccountModel.findOne({ email: authEmail.trim().toLowerCase() });
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (!account.linkedinPostCampaigns) {
    account.linkedinPostCampaigns = [];
  }

  const existingIdx = account.linkedinPostCampaigns.findIndex((c: any) => c.postId === postId);
  const updatedEntry = {
    postId,
    postUrl: postUrl || "",
    postText: postText || "",
    enabled: enabled !== undefined ? enabled : true,
    magnetId: magnetId || "",
    triggerWord: triggerWord ? triggerWord.trim().toLowerCase() : "resource",
    commentsCount: commentsCount || 0,
    createdAt: createdAt || "",
  };

  if (existingIdx >= 0) {
    account.linkedinPostCampaigns[existingIdx] = updatedEntry;
  } else {
    account.linkedinPostCampaigns.push(updatedEntry);
  }

  await account.save();
  return NextResponse.json({ success: true, message: "Post campaign updated." });
}

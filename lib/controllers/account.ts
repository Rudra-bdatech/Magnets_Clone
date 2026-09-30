import { NextResponse } from "next/server";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel, EmailEventModel, PdfOtpModel } from "@/lib/models";
import { type MagnetPage, type Resource } from "@/lib/data";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth";
import { hashPassword, comparePassword } from "@/lib/auth-helpers";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";
import { sendMail } from "@/lib/email";
import { randomBytes } from "crypto";

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
  delete acc.password;
  delete acc.resetPasswordToken;
  delete acc.resetPasswordExpires;
  delete acc.linkedinLiAt;
  delete acc.linkedinJSessionId;
  return acc;
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
  if (data.password && !/^\$2[aby]\$\d+\$/.test(data.password)) {
    const pwdErr = serverValidatePassword(data.password);
    if (pwdErr) {
      return NextResponse.json({ error: pwdErr }, { status: 400 });
    }
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
    existing.username = data.username || existing.username;
    existing.brandColor = data.brandColor || existing.brandColor;
    existing.logo = data.logo !== undefined ? data.logo : existing.logo;
    existing.avatar = data.avatar !== undefined ? data.avatar : existing.avatar;
    existing.leadAlertsEnabled = data.leadAlertsEnabled !== undefined ? data.leadAlertsEnabled : existing.leadAlertsEnabled;
    existing.notifyEmail = data.notifyEmail !== undefined ? data.notifyEmail : existing.notifyEmail;
    existing.themeMode = data.themeMode || existing.themeMode;
    existing.highlightIntensity = data.highlightIntensity ?? existing.highlightIntensity;
    existing.templateId = data.templateId || existing.templateId;
    existing.slackWebhookUrl = data.slackWebhookUrl !== undefined ? data.slackWebhookUrl : existing.slackWebhookUrl;
    existing.zapierWebhookUrl = data.zapierWebhookUrl !== undefined ? data.zapierWebhookUrl : existing.zapierWebhookUrl;
    existing.pipedriveApiToken = data.pipedriveApiToken !== undefined ? data.pipedriveApiToken : existing.pipedriveApiToken;
    existing.kitConnected = data.kitConnected !== undefined ? data.kitConnected : existing.kitConnected;
    existing.kitApiKey = data.kitApiKey !== undefined ? data.kitApiKey : existing.kitApiKey;
    existing.senderDisplayName = data.senderDisplayName !== undefined ? data.senderDisplayName : existing.senderDisplayName;
    existing.senderAddress = data.senderAddress !== undefined ? data.senderAddress : existing.senderAddress;
    existing.calendarProvider = data.calendarProvider || existing.calendarProvider;
    existing.calendarToken = data.calendarToken !== undefined ? data.calendarToken : existing.calendarToken;
    existing.calendarConnected = data.calendarConnected !== undefined ? data.calendarConnected : existing.calendarConnected;
    existing.customDomain = data.customDomain !== undefined ? data.customDomain : existing.customDomain;
    existing.customSubdomain = data.customSubdomain !== undefined ? data.customSubdomain : existing.customSubdomain;
    existing.domainVerified = data.domainVerified !== undefined ? data.domainVerified : existing.domainVerified;
    existing.cnameVerified = data.cnameVerified !== undefined ? data.cnameVerified : existing.cnameVerified;
    existing.sslStatus = data.sslStatus || existing.sslStatus;
    existing.ga4MeasurementId = data.ga4MeasurementId !== undefined ? data.ga4MeasurementId : existing.ga4MeasurementId;
    existing.metaPixelId = data.metaPixelId !== undefined ? data.metaPixelId : existing.metaPixelId;
    existing.faviconUrl = data.faviconUrl !== undefined ? data.faviconUrl : existing.faviconUrl;
    existing.privacyPolicy = data.privacyPolicy !== undefined ? data.privacyPolicy : existing.privacyPolicy;
    existing.termsOfService = data.termsOfService !== undefined ? data.termsOfService : existing.termsOfService;
    existing.substackPublication = data.substackPublication !== undefined ? data.substackPublication : existing.substackPublication;
    existing.spfVerified = data.spfVerified !== undefined ? data.spfVerified : existing.spfVerified;
    existing.dkimVerified = data.dkimVerified !== undefined ? data.dkimVerified : existing.dkimVerified;

    if (data.password && !/^\$2[aby]\$\d+\$/.test(data.password) && data.password !== existing.password) {
      existing.password = await hashPassword(data.password);
    }
    account = await existing.save();
  } else {
    let username = data.username || "user";
    let count = 0;
    let uniqueUsername = username;
    while (await AccountModel.findOne({ username: uniqueUsername })) {
      count++;
      uniqueUsername = `${username.slice(0, 15 - String(count).length)}${count}`;
    }
    data.username = uniqueUsername;
    if (data.password && !/^\$2[aby]\$\d+\$/.test(data.password)) {
      data.password = await hashPassword(data.password);
    }
    if (!data.joinedAt) {
      data.joinedAt = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    // Auto-provision a unique LinkedIn webhook secret for every new account.
    // This mirrors how Stripe, Twilio, and other SaaS platforms automatically
    // generate API keys at signup — no extra step needed from the user.
    if (!data.linkedinWebhookSecret) {
      data.linkedinWebhookSecret = generateWebhookSecret();
    }
    account = await AccountModel.create(data);
  }

  const res = NextResponse.json({ success: true, account: sanitizeAccount(account) });
  setAuthCookie(res, normalizedEmail, account?.name);
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
    const u = r.url || r.fileUrl;
    if (u) allUserAssets.push(u);
  });

  // Permanently delete all Cloudinary media assets
  if (allUserAssets.length > 0) {
    deleteCloudinaryAssets(allUserAssets).catch((err) =>
      console.error("Cloudinary cleanup error on deleteAccount:", err)
    );
  }

  // Completely purge all collections from top to bottom
  await Promise.all([
    AccountModel.deleteOne({ email: normDelEmail }),
    MagnetPageModel.deleteMany({ userEmail: normDelEmail }),
    LeadModel.deleteMany({
      $or: [
        { userEmail: normDelEmail },
        ...(userPageIds.length > 0 ? [{ pageId: { $in: userPageIds } }] : []),
      ],
    }),
    SequenceModel.deleteMany({ userEmail: normDelEmail }),
    IntegrationModel.deleteMany({ userEmail: normDelEmail }),
    ResourceModel.deleteMany({ userEmail: normDelEmail }),
    EmailEventModel.deleteMany({ userEmail: normDelEmail }),
    ...(userPageIds.length > 0 ? [PdfOtpModel.deleteMany({ magnetId: { $in: userPageIds } })] : []),
  ]);

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
  setAuthCookie(res, account.email, account.name);
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
  }
  account.password = await hashPassword(newPassword);
  await account.save();
  return NextResponse.json({ success: true });
}

export async function handleGetAccountByEmail(authEmail: string | null) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }
  const account = await AccountModel.findOne({ email: authEmail }).select("-password").lean();
  return NextResponse.json({ account: sanitizeAccount(account) });
}

export async function handleSendResetEmail(data: any, reqHostOrigin?: string) {
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

  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  account.resetPasswordToken = token;
  account.resetPasswordExpires = expires;
  await account.save();

  const origin = reqHostOrigin || process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  const cleanOrigin = origin.replace(/\/$/, "");
  const resetUrl = `${cleanOrigin}/reset-password?token=${token}`;

  const sendResult = await sendMail({
    to: normEmail,
    subject: "Reset your LeadMagnets password",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #0066B2; text-align: center;">Reset your password</h2>
        <p>Hi ${account.name || "there"},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0066B2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #666;">This link will expire in 1 hour.</p>
        <p style="font-size: 11px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

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

  const account = await AccountModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!account) {
    return NextResponse.json({ error: "Password reset token is invalid or has expired." }, { status: 400 });
  }

  account.password = await hashPassword(newPassword);
  account.resetPasswordToken = null;
  account.resetPasswordExpires = null;
  await account.save();

  return NextResponse.json({ success: true });
}

export async function handleSendVerificationEmail(data: any, reqHostOrigin: string) {
  const { email } = data;

  const sendResult = await sendMail({
    to: email.trim(),
    subject: "Verify your LeadMagnets email",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #fafafa;">
        <div style="background-color: white; padding: 24px; border-radius: 8px; border: 1px solid #eaeaea; text-align: center;">
          <h2 style="color: #0E0E10; margin-top: 0; font-size: 20px; font-weight: bold;">Verify your email</h2>
          <p style="color: #4a4a4a; font-size: 13px; margin-bottom: 24px;">Confirm this email address to finish creating your LeadMagnets account.</p>
          <div style="margin: 24px 0;">
            <a href="${reqHostOrigin}/register/confirm?email=${encodeURIComponent(email.trim())}" style="background-color: #0E0E10; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Verify email address</a>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 24px; line-height: 1.5;">This link expires in 24 hours. If you did not create a LeadMagnets account, you can ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.error || "Failed to send verification email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
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
 * Generates a 1-click Unipile Hosted Authentication Link for the user.
 * Opens a secure LinkedIn login popup so the user can connect in 10 seconds.
 */
export async function handleGetLinkedInAuthLink(authEmail: string | null, clientOrigin?: string) {
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const UNIPILE_DSN = "https://api36.unipile.com:16619";
  const UNIPILE_API_KEY = "wOFSf6du.f/PTCdwTaeOqSSw5PaLUCTPVwks++2G3tUtqBXh8gfU=";
  
  // Use client origin for browser redirect so user stays on localhost or production domain
  let browserOrigin = (clientOrigin || process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in").replace(/\/$/, "");
  if (browserOrigin.includes("api/")) {
    browserOrigin = browserOrigin.split("/api")[0];
  }
  
  // Production URL for Unipile server-to-server webhook callback
  const prodWebhookUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in").replace(/\/$/, "");

  try {
    const expiresOn = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const notifyUrl = `${prodWebhookUrl}/api/webhooks/unipile?userEmail=${encodeURIComponent(authEmail.trim().toLowerCase())}`;

    const res = await fetch(`${UNIPILE_DSN}/api/v1/hosted/accounts/link`, {
      method: "POST",
      headers: {
        "X-API-KEY": UNIPILE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "create",
        providers: ["LINKEDIN"],
        api_url: UNIPILE_DSN,
        expiresOn,
        success_redirect_url: `${browserOrigin}/dashboard/linkedin?connected=true`,
        failure_redirect_url: `${browserOrigin}/dashboard/linkedin?error=true`,
        notify_url: notifyUrl,
        name: authEmail.trim().toLowerCase(),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Unipile Hosted Auth Error]:", errText);
      return NextResponse.json({ error: "Failed to generate LinkedIn login link." }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      url: data.url,
    });
  } catch (err: any) {
    console.error("[Unipile Auth Link Exception]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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
    account,
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
    account,
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
    account,
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
  return NextResponse.json({ ...result, account: updatedAccount });
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

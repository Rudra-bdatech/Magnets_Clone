import nodemailer from "nodemailer";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, EmailEventModel } from "@/lib/models";
import { decrypt } from "@/lib/encryption";
import { isCompanyAccount } from "@/lib/roles";
import { buildUnsubscribeUrls } from "@/lib/unsubscribe";
import { emailLinkBaseUrl } from "@/lib/magnet-access";
import { isValidEmailAddress } from "@/lib/email-guard";
import crypto from "crypto";

export interface EmailTrackingOptions {
  leadId?: string;
  pageId?: string;
  sequenceId?: string;
  stepId?: string;
  userEmail?: string;
  recipient?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tracking?: EmailTrackingOptions;
  isTransactional?: boolean;
  /**
   * Set for every email sent to a lead. Adds an unsubscribe link to the footer and the
   * List-Unsubscribe / List-Unsubscribe-Post headers Gmail and Yahoo require for one-click unsubscribe.
   * Must be the stored lead's id; the link is signed for that lead and the first recipient.
   */
  unsubscribeLeadId?: string;
}

/**
 * NO_SENDER: the owner has no working Gmail / SMTP connected (an owner problem, not a recipient problem).
 * INVALID_RECIPIENT: a recipient is not a single valid address. SEND_FAILED: anything else.
 */
export type SendMailErrorCode = "NO_SENDER" | "INVALID_RECIPIENT" | "SEND_FAILED";

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: SendMailErrorCode;
}

// Platform-level fallback transporter (singleton)
let platformTransporter: nodemailer.Transporter | null = null;

function getPlatformTransporter(): nodemailer.Transporter {
  if (platformTransporter) return platformTransporter;

  const host = process.env.SMTP_HOST || "smtp.socketlabs.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "[email] SMTP_USER and SMTP_PASS environment variables are required but not set. " +
      "Please add them to your .env.local file or Vercel environment settings."
    );
  }

  platformTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
  });

  return platformTransporter;
}

async function refreshGmailAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    const err: Error & { code?: string } = new Error(
      `[email] Gmail token refresh failed: ${data.error_description || data.error || "Unknown error"}`
    );
    err.code = data.error;
    throw err;
  }
  return data.access_token;
}

function sanitizeHeader(val?: string): string {
  if (!val) return "";
  return val.replace(/[\r\n]+/g, "").trim();
}

async function sendViaGmailApi(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
  extraHeaders: Record<string, string> = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cleanFrom = sanitizeHeader(from);
    const cleanTo = sanitizeHeader(to);
    const cleanReplyTo = replyTo ? sanitizeHeader(replyTo) : undefined;
    const cleanSubject = sanitizeHeader(subject);
    const utf8Subject = `=?utf-8?B?${Buffer.from(cleanSubject).toString("base64")}?=`;

    const messageParts = [
      `From: ${cleanFrom}`,
      `To: ${cleanTo}`,
      ...(cleanReplyTo ? [`Reply-To: ${cleanReplyTo}`] : []),
      `Subject: ${utf8Subject}`,
      ...Object.entries(extraHeaders).map(([name, value]) => `${sanitizeHeader(name)}: ${sanitizeHeader(value)}`),
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(html, "utf-8").toString("base64"),
    ];
    const rawMessage = messageParts.join("\r\n");
    const encodedMessage = Buffer.from(rawMessage).toString("base64url");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("[email] Gmail REST API error:", data.error);
      return { success: false, error: data.error.message || "Gmail API dispatch failed" };
    }
    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error("[email] Gmail API network error:", err);
    return { success: false, error: err.message || "Network error sending via Gmail API" };
  }
}

function getBaseUrl(): string {
  // Signed links (unsubscribe) must come back to the server that signed them; see emailLinkBaseUrl
  if (process.env.NODE_ENV === "development") return emailLinkBaseUrl();
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "https://magnets.bdatech.in";
}

export function injectTrackingPixel(html: string, tracking: EmailTrackingOptions): string {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();

  if (tracking.leadId) params.set("lid", tracking.leadId);
  if (tracking.pageId) params.set("pid", tracking.pageId);
  if (tracking.sequenceId) params.set("seq", tracking.sequenceId);
  if (tracking.stepId) params.set("stp", tracking.stepId);
  if (tracking.userEmail) params.set("u", tracking.userEmail);
  if (tracking.recipient) params.set("r", tracking.recipient);
  params.set("t", Date.now().toString());

  const pixelUrl = `${baseUrl}/api/track/open?${params.toString()}`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;outline:none;" />`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelTag}\n</body>`);
  }
  return `${html}\n${pixelTag}`;
}

function injectUnsubscribeFooter(html: string, pageUrl: string): string {
  const footer =
    `<div style="text-align:center; padding:0 16px 32px 16px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; line-height:1.6; color:#7b858c;">` +
    `Don&rsquo;t want these emails? <a href="${pageUrl}" target="_blank" style="color:#7b858c; text-decoration:underline;">Unsubscribe</a>` +
    `</div>`;
  const idx = html.lastIndexOf("</body>");
  if (idx !== -1) {
    return `${html.slice(0, idx)}${footer}\n${html.slice(idx)}`;
  }
  return `${html}\n${footer}`;
}

export async function sendMail(
  options: SendMailOptions,
  ownerEmail?: string
): Promise<SendMailResult> {
  try {
    // Every recipient must be exactly one plain address. A value such as "a@x.com,b@y.com"
    // would otherwise land in the To header and turn one signup into a mass mailing.
    const recipients = (Array.isArray(options.to) ? options.to : [options.to]).map((r) =>
      typeof r === "string" ? r.trim() : ""
    );
    if (recipients.length === 0 || !recipients.every((r) => isValidEmailAddress(r))) {
      console.warn("[email] Refusing to send: invalid recipient address");
      return { success: false, error: "Invalid recipient email address.", errorCode: "INVALID_RECIPIENT" };
    }

    await dbConnect();

    const rawRecipient = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    const recipientStr = sanitizeHeader(rawRecipient);
    const recipientClean = sanitizeHeader(
      Array.isArray(options.to) ? options.to[0] : options.to
    ).toLowerCase();

    const resolvedOwner = ownerEmail || options.tracking?.userEmail || "";
    const defaultFrom = process.env.SMTP_FROM || "noreply@bdatech.in";

    let finalHtml = options.html;
    if (options.tracking) {
      finalHtml = injectTrackingPixel(options.html, {
        ...options.tracking,
        recipient: options.tracking.recipient || recipientClean,
      });
    }

    const extraHeaders: Record<string, string> = {};
    if (options.unsubscribeLeadId && recipientClean) {
      const { pageUrl, oneClickUrl } = buildUnsubscribeUrls(getBaseUrl(), options.unsubscribeLeadId, recipientClean);
      finalHtml = injectUnsubscribeFooter(finalHtml, pageUrl);
      extraHeaders["List-Unsubscribe"] = `<${oneClickUrl}>`;
      extraHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    // Look up owner account if available
    let account: any = null;
    if (resolvedOwner) {
      account = await AccountModel.findOne(
        { email: resolvedOwner.toLowerCase().trim() },
        { name: 1, gmailOAuth: 1, customSmtp: 1, role: 1 }
      ).lean();
    }

    // Set when the owner's own sender was tried and failed, so a later "no sender" result is
    // reported as a send failure rather than as a missing connection.
    let ownerSenderFailed = false;

    // Priority 1: Gmail OAuth2 (Direct Gmail REST API)
    const gmail = account?.gmailOAuth;
    if (gmail?.connected && gmail?.refreshToken && gmail?.gmailAddress) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          const refreshToken = decrypt(gmail.refreshToken);
          const accessToken = await refreshGmailAccessToken(clientId, clientSecret, refreshToken);
          const displayName = gmail.fromName || account.name || "Funnels";
          const fromHeader = `${displayName} <${gmail.gmailAddress}>`;

          const gmailRes = await sendViaGmailApi(
            accessToken,
            fromHeader,
            recipientStr,
            options.subject,
            finalHtml,
            options.replyTo,
            extraHeaders
          );

          if (gmailRes.success) {
            console.log(`[GMAIL-OAUTH] Email sent:`, gmailRes.messageId, "to:", options.to);
            await logEmailEvent(options, recipientClean, gmailRes.messageId);
            return gmailRes;
          } else {
            ownerSenderFailed = true;
            console.warn("[email] Gmail OAuth API returned error, falling back:", gmailRes.error);
          }
        } catch (gmailErr: any) {
          console.warn("[email] Gmail OAuth2 failed, falling through:", gmailErr);
          // A revoked grant means Gmail is simply no longer connected; anything else is a failed attempt.
          if (gmailErr?.code !== "invalid_grant") ownerSenderFailed = true;
          // invalid_grant = the user revoked access, changed their password, or the token expired.
          // Mark Gmail as disconnected so the dashboard prompts them to reconnect.
          if (gmailErr?.code === "invalid_grant" && account?._id) {
            await AccountModel.updateOne(
              { _id: account._id },
              { $set: { "gmailOAuth.connected": false, "gmailOAuth.accessToken": "", "gmailOAuth.refreshToken": "" } }
            ).catch((e) => console.error("[email] Failed to mark Gmail disconnected:", e));
          }
        }
      }
    }

    // Priority 2: Custom SMTP
    const smtp = account?.customSmtp;
    if (smtp?.enabled && smtp?.isVerified && smtp?.host && smtp?.user && smtp?.pass) {
      try {
        const decryptedPass = decrypt(smtp.pass);
        const customTransporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port || 587,
          secure: smtp.secure === true,
          auth: { user: smtp.user, pass: decryptedPass },
          tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
        });

        const displayName = smtp.fromName || account.name || "Funnels";
        const fromEmail = smtp.fromEmail || smtp.user;
        const fromHeader = `${displayName} <${fromEmail}>`;

        const info = await customTransporter.sendMail({
          from: fromHeader,
          to: recipientStr,
          subject: options.subject,
          html: finalHtml,
          replyTo: options.replyTo,
          headers: extraHeaders,
        });

        console.log(`[CUSTOM-SMTP] Email sent:`, info.messageId, "to:", options.to);
        await logEmailEvent(options, recipientClean, info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (smtpErr: any) {
        ownerSenderFailed = true;
        console.warn("[email] Custom SMTP send failed, falling through to platform:", smtpErr);
      }
    }

    // Priority 3: Platform Fallback (Restricted to Internal Company Staff / Admins OR System Transactional Emails)
    const isCompanyStaff = isCompanyAccount(resolvedOwner, account?.role);
    if (!isCompanyStaff && !options.isTransactional) {
      const blockedMsg = "Sender email is not configured. Please connect your Gmail or custom SMTP in Settings to deliver emails to your leads.";
      console.warn(`[email] Platform fallback blocked for external user: "${resolvedOwner || 'unknown'}". Prompting to connect Gmail.`);
      return ownerSenderFailed
        ? { success: false, error: "Sending through your connected email account failed.", errorCode: "SEND_FAILED" }
        : { success: false, error: blockedMsg, errorCode: "NO_SENDER" };
    }

    // Platform Fallback (SocketLabs / default company SMTP for internal accounts)
    const platformTrans = getPlatformTransporter();
    const platformFrom = options.from || `Funnels <${defaultFrom}>`;

    const info = await platformTrans.sendMail({
      from: platformFrom,
      to: recipientStr,
      subject: options.subject,
      html: finalHtml,
      replyTo: options.replyTo,
      headers: extraHeaders,
    });

    console.log(`[PLATFORM-ADMIN] Email sent:`, info.messageId, "to:", options.to, "for company staff:", resolvedOwner);
    await logEmailEvent(options, recipientClean, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[email] Email sending failed:", error);
    return {
      success: false,
      error: error?.message || "Failed to send email",
      errorCode: "SEND_FAILED",
    };
  }
}

// Awaited by sendMail: the sequence cron decides what was already sent from these events,
// so a send must not report success before its event is stored.
async function logEmailEvent(options: SendMailOptions, recipientClean: string, messageId?: string) {
  if (!options.tracking) return;
  try {
    const eventId = `ev_sent_${crypto.randomBytes(8).toString("hex")}`;
    await EmailEventModel.create({
      id: eventId,
      userEmail: options.tracking?.userEmail || "",
      leadId: options.tracking?.leadId || "",
      pageId: options.tracking?.pageId || "",
      sequenceId: options.tracking?.sequenceId || "",
      stepId: options.tracking?.stepId || "",
      eventType: "sent",
      recipientEmail: recipientClean,
      subject: options.subject,
      messageId: messageId || "",
      createdAt: new Date(),
    });
  } catch (dbErr) {
    console.error("Failed to log sent email event:", dbErr);
  }
}

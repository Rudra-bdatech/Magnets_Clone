import nodemailer from "nodemailer";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, EmailEventModel } from "@/lib/models";
import { decrypt } from "@/lib/encryption";
import { isCompanyAccount } from "@/lib/roles";
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
    throw new Error(`[email] Gmail token refresh failed: ${data.error_description || data.error || "Unknown error"}`);
  }
  return data.access_token;
}

async function sendViaGmailApi(
  accessToken: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
      `Subject: ${utf8Subject}`,
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

export async function sendMail(
  options: SendMailOptions,
  ownerEmail?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    await dbConnect();

    const recipientStr = Array.isArray(options.to) ? options.to.join(", ") : options.to;
    const recipientClean = Array.isArray(options.to)
      ? options.to[0]?.trim().toLowerCase()
      : options.to.trim().toLowerCase();

    const resolvedOwner = ownerEmail || options.tracking?.userEmail || "";
    const defaultFrom = process.env.SMTP_FROM || "noreply@bdatech.in";

    let finalHtml = options.html;
    if (options.tracking) {
      finalHtml = injectTrackingPixel(options.html, {
        ...options.tracking,
        recipient: options.tracking.recipient || recipientClean,
      });
    }

    // Look up owner account if available
    let account: any = null;
    if (resolvedOwner) {
      account = await AccountModel.findOne(
        { email: resolvedOwner.toLowerCase().trim() },
        { name: 1, gmailOAuth: 1, customSmtp: 1, role: 1 }
      ).lean();
    }

    // Priority 1: Gmail OAuth2 (Direct Gmail REST API)
    const gmail = account?.gmailOAuth;
    if (gmail?.connected && gmail?.refreshToken && gmail?.gmailAddress) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          const refreshToken = decrypt(gmail.refreshToken);
          const accessToken = await refreshGmailAccessToken(clientId, clientSecret, refreshToken);
          const displayName = gmail.fromName || account.name || "LeadMagnets";
          const fromHeader = `${displayName} <${gmail.gmailAddress}>`;

          const gmailRes = await sendViaGmailApi(
            accessToken,
            fromHeader,
            recipientStr,
            options.subject,
            finalHtml,
            options.replyTo
          );

          if (gmailRes.success) {
            console.log(`[GMAIL-OAUTH] Email sent:`, gmailRes.messageId, "to:", options.to);
            logEmailEvent(options, recipientClean, gmailRes.messageId);
            return gmailRes;
          } else {
            console.warn("[email] Gmail OAuth API returned error, falling back:", gmailRes.error);
          }
        } catch (gmailErr) {
          console.warn("[email] Gmail OAuth2 failed, falling through:", gmailErr);
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

        const displayName = smtp.fromName || account.name || "LeadMagnets";
        const fromEmail = smtp.fromEmail || smtp.user;
        const fromHeader = `${displayName} <${fromEmail}>`;

        const info = await customTransporter.sendMail({
          from: fromHeader,
          to: recipientStr,
          subject: options.subject,
          html: finalHtml,
          replyTo: options.replyTo,
        });

        console.log(`[CUSTOM-SMTP] Email sent:`, info.messageId, "to:", options.to);
        logEmailEvent(options, recipientClean, info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (smtpErr: any) {
        console.warn("[email] Custom SMTP send failed, falling through to platform:", smtpErr);
      }
    }

    // Priority 3: Platform Fallback (Restricted to Internal Company Staff / Admins)
    const isCompanyStaff = isCompanyAccount(resolvedOwner, account?.role);
    if (!isCompanyStaff) {
      const blockedMsg = "Sender email is not configured. Please connect your Gmail or custom SMTP in Settings to deliver emails to your leads.";
      console.warn(`[email] Platform fallback blocked for external user: "${resolvedOwner || 'unknown'}". Prompting to connect Gmail.`);
      return {
        success: false,
        error: blockedMsg,
      };
    }

    // Platform Fallback (SocketLabs / default company SMTP for internal accounts)
    const platformTrans = getPlatformTransporter();
    const platformFrom = options.from || `LeadMagnets <${defaultFrom}>`;

    const info = await platformTrans.sendMail({
      from: platformFrom,
      to: recipientStr,
      subject: options.subject,
      html: finalHtml,
      replyTo: options.replyTo,
    });

    console.log(`[PLATFORM-ADMIN] Email sent:`, info.messageId, "to:", options.to, "for company staff:", resolvedOwner);
    logEmailEvent(options, recipientClean, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[email] Email sending failed:", error);
    return {
      success: false,
      error: error?.message || "Failed to send email",
    };
  }
}

function logEmailEvent(options: SendMailOptions, recipientClean: string, messageId?: string) {
  if (!options.tracking) return;
  (async () => {
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
  })();
}

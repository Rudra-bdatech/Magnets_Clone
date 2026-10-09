import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { sendMail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { PdfOtpModel, MagnetPageModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// OTP expires in 10 minutes
const OTP_TTL_MS = 10 * 60 * 1000;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: max 5 send-code attempts per IP per 15 minutes ────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rl = await checkRateLimit(ip, "pdf_send_code", 5, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: { email?: string; magnetId?: string; name?: string; customFields?: Record<string, any> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = (body.email || "").trim().toLowerCase();
    const magnetId = (body.magnetId || "").trim();
    const name = (body.name || "").trim();
    const customFields = body.customFields || {};

    if (!name || !email || !magnetId) {
      return NextResponse.json({ error: "Name, email, and magnetId are required." }, { status: 400 });
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await dbConnect();

    // Look up page owner so we send via their synced email if available
    const pageDoc = await MagnetPageModel.findOne({
      $or: [{ id: magnetId }, { slug: magnetId }, { customUrl: magnetId }],
    }).lean().catch(() => null);
    const ownerEmail = (pageDoc as any)?.userEmail || "";

    // ── Clean up any old unused OTPs for this email+magnet ────────────────
    await PdfOtpModel.deleteMany({ email, magnetId, used: false }).catch(() => {});

    // ── Create new OTP record ─────────────────────────────────────────────
    const code = generateOtp();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await PdfOtpModel.create({ email, magnetId, code, token, expiresAt, used: false, name, customFields });

    // ── Send email ────────────────────────────────────────────────────────
    // IMPORTANT: sendMail() returns { success, error } — it does NOT throw.
    // We must check the return value explicitly.
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in").replace(/\/$/, "");
    const logoUrl = `${appUrl}/brand/custom-logo-light.png`;

    const mailResult = await sendMail(
      {
        to: email,
        subject: `🔐 Your Access Code: ${code}`,
        tracking: {
          userEmail: ownerEmail,
          pageId: (pageDoc as any)?.id || magnetId,
          recipient: email,
        },
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0f172a;">
  <div style="background-color: #f8fafc; padding: 48px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; width: 100%; margin: 0 auto;">
      
      <!-- Brand Logo Header -->
      <tr>
        <td style="padding-bottom: 28px; text-align: center;">
          <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoUrl}" 
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
            
            <h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3; letter-spacing: -0.02em;">
              Verification Code
            </h1>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
              Use the single-use code below to verify your email and access your document:
            </p>

            <!-- Code Display Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 16px; margin: 0 0 24px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 0.28em; color: #0066B2; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: block; margin-left: 0.28em;">
                ${code}
              </span>
            </div>

            <!-- Expiry Note -->
            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
              This code will expire in <strong>10 minutes</strong>.<br />
              If you did not request this, please disregard this email.
            </p>

          </div>
        </td>
      </tr>

      <!-- Minimal Footer -->
      <tr>
        <td style="padding-top: 24px; text-align: center;">
          <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            Powered by <strong style="color: #64748b; font-weight: 600;">LeadMagnets</strong> · Secure Access
          </div>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
      `,
    });

    if (!mailResult.success) {
      console.error("[pdf-gate/send-code] Email send failed:", mailResult.error);
      // Clean up the OTP record so the user can retry
      await PdfOtpModel.deleteOne({ token }).catch(() => {});
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, token });

  } catch (err: any) {
    console.error("[pdf-gate/send-code] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

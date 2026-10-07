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
  <title>Your Access Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <div style="background-color: #f1f5f9; padding: 36px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; width: 100%; margin: 0 auto;">
      
      <!-- Top Brand Header -->
      <tr>
        <td style="padding-bottom: 20px; text-align: center;">
          <a href="${appUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoUrl}" 
              alt="LeadMagnets" 
              height="32" 
              style="height: 32px; width: auto; max-height: 36px; display: inline-block; border: 0; outline: none;" 
            />
          </a>
        </td>
      </tr>

      <!-- Main Card Container -->
      <tr>
        <td>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px 28px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02); text-align: center;">
            
            <!-- Badge -->
            <div style="display: inline-block; background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">
              🔐 Security Verification
            </div>

            <h1 style="color: #0f172a; font-size: 21px; font-weight: 800; margin: 0 0 8px 0; line-height: 1.3;">
              Unlock Your Document
            </h1>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
              Enter this 6-digit verification code to instantly access and read your document:
            </p>

            <!-- Code Box -->
            <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 14px; padding: 22px 16px; margin: 0 0 20px 0;">
              <span style="font-size: 38px; font-weight: 900; letter-spacing: 0.25em; color: #0066B2; font-family: 'Courier New', Courier, monospace; display: block; margin-left: 0.25em;">
                ${code}
              </span>
            </div>

            <!-- Expiry Note -->
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 24px 0; line-height: 1.5;">
              ⏱ This code is valid for <strong>10 minutes</strong>. If you did not request this access code, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 16px 0;" />
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
              Sent by <strong>LeadMagnets Platform</strong> · Secure Document Verification
            </p>

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

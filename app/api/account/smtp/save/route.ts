import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import nodemailer from "nodemailer";

import { isPrivateOrReservedHost } from "@/lib/ssrf";

const ALLOWED_SMTP_PORTS = [25, 465, 587, 2525];

function sanitizeSmtpError(err: any): string {
  const msg = String(err?.message || "");
  const code = err?.code;
  const responseCode = err?.responseCode;

  if (code === "EAUTH" || responseCode === 535 || msg.includes("535") || msg.toLowerCase().includes("badcredentials") || msg.toLowerCase().includes("invalid login")) {
    return "SMTP authentication failed. Please check your username and password.";
  }
  if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return "Could not connect to SMTP server. Please verify the host and port.";
  }
  if (code === "EENVELOPE") {
    return "SMTP envelope error. Please verify the sender email address.";
  }
  if (/^\d{3}\s/.test(msg)) {
    return `SMTP server error: ${msg.substring(0, 100)}`;
  }
  return "SMTP connection failed. Check your credentials and server settings.";
}

export async function POST(req: NextRequest) {
  const authEmail = await getAuthenticatedUserEmail();
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { host, port, secure, user, pass, fromEmail, fromName } = body;

  if (!host || !user || !pass) {
    return NextResponse.json({ error: "host, user, and pass are required" }, { status: 400 });
  }

  const numericPort = Number(port) || 587;
  if (!ALLOWED_SMTP_PORTS.includes(numericPort)) {
    return NextResponse.json(
      { error: "Invalid SMTP port. Standard ports are 587, 465, 25, or 2525." },
      { status: 400 }
    );
  }

  const cleanHost = String(host).trim();
  if (await isPrivateOrReservedHost(cleanHost)) {
    return NextResponse.json(
      { error: "Private or internal hostnames cannot be used as SMTP servers." },
      { status: 400 }
    );
  }

  // Verify the credentials on the server before marking them as verified, with the same TLS
  // settings that lib/email.ts uses when sending.
  try {
    const transporter = nodemailer.createTransport({
      host: cleanHost,
      port: numericPort,
      secure: secure === true,
      auth: { user: String(user).trim(), pass },
      tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
      connectionTimeout: 8000,
      socketTimeout: 8000,
    });
    await transporter.verify();
  } catch (err: any) {
    console.error("[smtp/save] verify failed", err);
    return NextResponse.json(
      { error: sanitizeSmtpError(err) },
      { status: 400 }
    );
  }

  await dbConnect();

  const encryptedPass = encrypt(pass);

  await AccountModel.findOneAndUpdate(
    { email: authEmail },
    {
      $set: {
        "customSmtp.enabled": true,
        "customSmtp.host": host.trim(),
        "customSmtp.port": Number(port) || 587,
        "customSmtp.secure": secure === true,
        "customSmtp.user": user.trim(),
        "customSmtp.pass": encryptedPass,
        "customSmtp.fromEmail": (fromEmail || user).trim(),
        "customSmtp.fromName": (fromName || "").trim(),
        "customSmtp.isVerified": true,
      },
    }
  );

  return NextResponse.json({ success: true });
}

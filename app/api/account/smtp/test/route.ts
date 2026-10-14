import { NextRequest, NextResponse } from "next/server";
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

  try {
    const transporter = nodemailer.createTransport({
      host: cleanHost,
      port: numericPort,
      secure: secure === true,
      auth: { user: user.trim(), pass },
      tls: { rejectUnauthorized: process.env.NODE_ENV === "production" }, // match lib/email.ts
      connectionTimeout: 8000,
      socketTimeout: 8000,
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `${fromName || "LeadMagnets"} <${fromEmail || user}>`,
      to: authEmail,
      subject: "SMTP connection verified",
      html: `<p>Your custom SMTP is connected. Emails to your leads will now be sent from <strong>${escapeHtml(String(fromEmail || user))}</strong>.</p>`,
    });

    return NextResponse.json({ success: true, message: "Test email sent! Check your inbox." });
  } catch (err: any) {
    console.error("[smtp/test]", err);
    return NextResponse.json(
      { success: false, error: sanitizeSmtpError(err) },
      { status: 400 }
    );
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

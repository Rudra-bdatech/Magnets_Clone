import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import nodemailer from "nodemailer";

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

  try {
    const transporter = nodemailer.createTransport({
      host: host.trim(),
      port: Number(port) || 587,
      secure: secure === true,
      auth: { user: user.trim(), pass },
      tls: { rejectUnauthorized: false }, // allow test with self-signed
      connectionTimeout: 8000,
      socketTimeout: 8000,
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `${fromName || "LeadMagnets"} <${fromEmail || user}>`,
      to: authEmail,
      subject: "SMTP connection verified",
      html: `<p>Your custom SMTP is connected. Emails to your leads will now be sent from <strong>${fromEmail || user}</strong>.</p>`,
    });

    return NextResponse.json({ success: true, message: "Test email sent! Check your inbox." });
  } catch (err: any) {
    console.error("[smtp/test]", err);
    return NextResponse.json(
      { success: false, error: err.message || "SMTP connection failed. Check your credentials." },
      { status: 400 }
    );
  }
}

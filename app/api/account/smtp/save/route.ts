import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
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

  // Verify the credentials on the server before marking them as verified, with the same TLS
  // settings that lib/email.ts uses when sending.
  try {
    const transporter = nodemailer.createTransport({
      host: String(host).trim(),
      port: Number(port) || 587,
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
      { error: err.message || "SMTP connection failed. Check your credentials." },
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

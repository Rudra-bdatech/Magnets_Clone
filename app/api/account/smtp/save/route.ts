import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

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

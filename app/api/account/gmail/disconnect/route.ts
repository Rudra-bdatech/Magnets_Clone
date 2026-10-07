import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  const authEmail = await getAuthenticatedUserEmail();
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const account = await AccountModel.findOne({ email: authEmail }).lean();
  const refreshToken = decrypt((account as any)?.gmailOAuth?.refreshToken || "");

  // Best-effort revoke the token on Google's side
  if (refreshToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch {
      // Non-fatal — continue removing from DB regardless
    }
  }

  await AccountModel.findOneAndUpdate(
    { email: authEmail },
    {
      $set: {
        "gmailOAuth.connected": false,
        "gmailOAuth.gmailAddress": "",
        "gmailOAuth.accessToken": "",
        "gmailOAuth.refreshToken": "",
        "gmailOAuth.tokenExpiry": null,
        "gmailOAuth.fromName": "",
      },
    }
  );

  return NextResponse.json({ success: true });
}

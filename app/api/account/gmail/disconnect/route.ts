import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { revokeGmailAccess } from "@/lib/gmail-oauth";

export async function POST(req: NextRequest) {
  const authEmail = await getAuthenticatedUserEmail();
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const account = await AccountModel.findOne({ email: authEmail }).lean();

  // Best-effort revoke the token on Google's side
  await revokeGmailAccess((account as any)?.gmailOAuth?.refreshToken);

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

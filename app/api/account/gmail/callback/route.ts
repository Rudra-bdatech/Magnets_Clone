import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = req.nextUrl.origin;
  const settingsUrl = `${origin}/dashboard/integration`;

  if (error) {
    console.error("[gmail/callback] OAuth error:", error);
    return NextResponse.redirect(`${settingsUrl}?gmailError=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?gmailError=missing_params`);
  }

  let ownerEmail: string;
  let stateRedirectUri = "";
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    ownerEmail = decoded.email;
    stateRedirectUri = decoded.redirectUri || "";
    if (!ownerEmail) throw new Error("Missing email in state");
  } catch {
    return NextResponse.redirect(`${settingsUrl}?gmailError=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = stateRedirectUri || process.env.GOOGLE_GMAIL_REDIRECT_URI || `${origin}/api/account/gmail/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${settingsUrl}?gmailError=server_config`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    // Fetch the Gmail address via userinfo
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    const gmailAddress = (userInfo.email || "").toLowerCase().trim();
    const fromName = userInfo.name || "";

    if (!gmailAddress) {
      throw new Error("Could not retrieve Gmail address from Google");
    }

    await dbConnect();

    const encryptedAccess = encrypt(tokens.access_token || "");
    const encryptedRefresh = encrypt(tokens.refresh_token || "");
    const expiry = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

    await AccountModel.findOneAndUpdate(
      { email: ownerEmail.toLowerCase().trim() },
      {
        $set: {
          "gmailOAuth.connected": true,
          "gmailOAuth.gmailAddress": gmailAddress,
          "gmailOAuth.accessToken": encryptedAccess,
          "gmailOAuth.refreshToken": encryptedRefresh,
          "gmailOAuth.tokenExpiry": expiry,
          "gmailOAuth.fromName": fromName,
        },
      }
    );

    console.log("[gmail/callback] Gmail connected for:", ownerEmail, "->", gmailAddress);
    return NextResponse.redirect(`${settingsUrl}?gmail=connected`);
  } catch (err: any) {
    console.error("[gmail/callback] Failed to connect Gmail:", err);
    return NextResponse.redirect(`${settingsUrl}?gmailError=${encodeURIComponent(err.message || "token_exchange_failed")}`);
  }
}

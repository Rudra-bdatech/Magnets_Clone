import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { encrypt } from "@/lib/encryption";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { GMAIL_STATE_COOKIE } from "@/lib/gmail-oauth";
import { timingSafeEqual } from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = req.nextUrl.origin;
  const settingsUrl = `${origin}/dashboard/settings?tab=email`;

  // Every response clears the one-time state cookie.
  const redirectTo = (query: string) => {
    const res = NextResponse.redirect(`${settingsUrl}&${query}`);
    res.cookies.set({ name: GMAIL_STATE_COOKIE, value: "", path: "/api/account/gmail", maxAge: 0 });
    return res;
  };

  if (error) {
    console.error("[gmail/callback] OAuth error:", error);
    return redirectTo(`gmailError=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return redirectTo("gmailError=missing_params");
  }

  // CSRF protection: the state must match the random value set by /connect in this browser.
  const expectedState = req.cookies.get(GMAIL_STATE_COOKIE)?.value || "";
  const a = Buffer.from(state);
  const b = Buffer.from(expectedState);
  if (!expectedState || a.length !== b.length || !timingSafeEqual(a, b)) {
    console.warn("[gmail/callback] State mismatch - possible CSRF or expired attempt");
    return redirectTo("gmailError=invalid_state");
  }

  // The account owner always comes from the logged-in session, never from the URL.
  const ownerEmail = await getAuthenticatedUserEmail();
  if (!ownerEmail) {
    return redirectTo("gmailError=not_logged_in");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || `${origin}/api/account/gmail/callback`;

  if (!clientId || !clientSecret) {
    return redirectTo("gmailError=server_config");
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

    const expiry = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
    const update: Record<string, unknown> = {
      "gmailOAuth.connected": true,
      "gmailOAuth.gmailAddress": gmailAddress,
      "gmailOAuth.accessToken": encrypt(tokens.access_token || ""),
      "gmailOAuth.tokenExpiry": expiry,
      "gmailOAuth.fromName": fromName,
    };

    if (tokens.refresh_token) {
      update["gmailOAuth.refreshToken"] = encrypt(tokens.refresh_token);
    } else {
      // Google only omits the refresh token when it already issued one. Keep the stored one if it
      // belongs to the same Gmail address; otherwise we would be unable to send, so fail clearly.
      const existing = await AccountModel.findOne(
        { email: ownerEmail },
        { "gmailOAuth.refreshToken": 1, "gmailOAuth.gmailAddress": 1 }
      ).lean<any>();
      if (!existing?.gmailOAuth?.refreshToken || existing.gmailOAuth.gmailAddress !== gmailAddress) {
        throw new Error("Google did not return a refresh token. Remove Funnels at myaccount.google.com/permissions and connect again.");
      }
    }

    await AccountModel.findOneAndUpdate({ email: ownerEmail }, { $set: update });

    console.log("[gmail/callback] Gmail connected for:", ownerEmail, "->", gmailAddress);
    return redirectTo("gmail=connected");
  } catch (err: any) {
    console.error("[gmail/callback] Failed to connect Gmail:", err);
    return redirectTo(`gmailError=${encodeURIComponent(err.message || "token_exchange_failed")}`);
  }
}

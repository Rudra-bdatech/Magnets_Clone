import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { GMAIL_STATE_COOKIE } from "@/lib/gmail-oauth";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export async function GET(req: NextRequest) {
  const authEmail = await getAuthenticatedUserEmail();
  if (!authEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = req.nextUrl.origin;
  const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || `${origin}/api/account/gmail/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  // CSRF protection: a random, unguessable state value is sent to Google and also stored in an
  // httpOnly cookie. The callback only accepts the code if both match, and it takes the account
  // owner from the logged-in session (never from the state).
  const state = randomBytes(32).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent select_account",
    state,
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set({
    name: GMAIL_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must be sent on the top-level redirect back from Google
    path: "/api/account/gmail",
    maxAge: 10 * 60,
  });
  return res;
}

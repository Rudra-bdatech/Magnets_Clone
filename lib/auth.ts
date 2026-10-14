import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createSessionToken, verifySessionToken, AUTH_COOKIE_NAME, type SessionUser } from "@/lib/session-token";

export { createSessionToken, verifySessionToken, AUTH_COOKIE_NAME, type SessionUser };

export function setAuthCookie(res: NextResponse, email: string, name?: string, tokenVersion?: number): NextResponse {
  const token = createSessionToken({ email: email.trim().toLowerCase(), name, tokenVersion });
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds

  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAge,
  });

  return res;
}

export function clearAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  res.cookies.set({
    name: "next-auth.session-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  res.cookies.set({
    name: "__Secure-next-auth.session-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return res;
}

const RECENT_AUTH_WINDOW_MS = 10 * 60 * 1000;

/**
 * True when `email` completed an OAuth (Google) sign-in within the last 10 minutes.
 * Password-less accounts must pass this before setting a password or deleting the account.
 */
export async function hasRecentOAuthLogin(email: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email?.trim().toLowerCase();
    const authTime = Number((session as any)?.authTime || 0);
    return sessionEmail === email && Date.now() - authTime < RECENT_AUTH_WINDOW_MS;
  } catch {
    return false;
  }
}

export async function getAuthenticatedUserEmail(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const session = verifySessionToken(token);
      if (session?.email) {
        const cleanEmail = session.email.trim().toLowerCase();
        try {
          const { dbConnect } = await import("@/lib/mongodb");
          const { AccountModel } = await import("@/lib/models");
          await dbConnect();
          const acc = await AccountModel.findOne({ email: cleanEmail }, { tokenVersion: 1 }).lean();
          if (!acc) return null; // Account was deleted
          const expectedVersion = (acc as any).tokenVersion ?? 0;
          const actualVersion = session.tokenVersion ?? 0;
          if (actualVersion < expectedVersion) return null; // Session was revoked (e.g. password changed)
        } catch (dbErr) {
          // If DB check is temporarily unavailable, fallback to session token validation
        }
        return cleanEmail;
      }
    }
  } catch (err) {
    // Custom session token error - not critical
  }

  try {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      return nextAuthSession.user.email.trim().toLowerCase();
    }
  } catch (err: any) {
    // Silently ignore JWEDecryptionFailed (stale cookies from old NEXTAUTH_SECRET).
    // This is expected when NEXTAUTH_SECRET changes and users still have old cookies.
    // They'll need to log in again; this is NOT an application error.
    if (err?.name === "JWEDecryptionFailed" || err?.message?.includes("decryption")) {
      // Not logged in via NextAuth — fall through to return null
    } else {
      console.warn("[Auth] Session read error:", err?.name || err?.message);
    }
  }
  return null;
}

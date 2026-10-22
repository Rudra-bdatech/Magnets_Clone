import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { AUTH_COOKIE_NAME, verifySessionToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { authOptions } from "@/lib/auth-options";
import { sanitizeAccount } from "@/lib/controllers/account";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    let email: string | null = null;
    let name: string | undefined = undefined;

    if (token) {
      const session = verifySessionToken(token);
      if (session && session.email) {
        email = session.email;
        name = session.name;
      }
    }

    let nextAuthImage: string | null = null;
    let emailFromNextAuth = false;
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user?.email) {
      if (!email) {
        email = nextAuthSession.user.email.trim().toLowerCase();
        name = nextAuthSession.user.name || undefined;
        emailFromNextAuth = true;
      }
      if (nextAuthSession.user.image) {
        let cleanImage = nextAuthSession.user.image;
        if (cleanImage.includes("googleusercontent.com") && cleanImage.includes("=s")) {
          cleanImage = cleanImage.replace(/=s\d+(-c)?/, "=s256-c");
        }
        nextAuthImage = cleanImage;
      }
    }

    if (!email) {
      const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      clearAuthCookie(response);
      return response;
    }

    let account: any = null;
    try {
      await dbConnect();
      account = await AccountModel.findOne({ email }).lean();

      // Clean up legacy logo if it contains Google user avatar
      if (account) {
        let needsUpdate = false;
        const updateObj: any = {};
        if (nextAuthImage && (!account.avatar || account.avatar !== nextAuthImage)) {
          updateObj.avatar = nextAuthImage;
          account.avatar = nextAuthImage;
          needsUpdate = true;
        }
        if (account.logo && (account.logo.includes("googleusercontent.com") || account.logo === nextAuthImage)) {
          updateObj.logo = null;
          account.logo = null;
          needsUpdate = true;
        }
        if (needsUpdate) {
          await AccountModel.updateOne({ email }, { $set: updateObj });
        }
      }
    } catch (e) {
      console.warn("Could not query DB for account in /api/auth/me:", e);
    }

    if (!account) {
      const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      clearAuthCookie(response);
      return response;
    }

    // Security check: If password was changed or session was revoked, reject stale token
    // (a Google session is checked too, or this route would re-issue a cookie for it)
    if (token || emailFromNextAuth) {
      const expectedVersion = account.tokenVersion ?? 0;
      const actualVersion = emailFromNextAuth
        ? (nextAuthSession as any)?.tokenVersion ?? 0
        : verifySessionToken(token as string)?.tokenVersion ?? 0;
      if (actualVersion < expectedVersion) {
        const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
        clearAuthCookie(response);
        return response;
      }
    }

    // Sanitize user object to never leak password hashes or third-party credentials to client
    // (this response is cached in localStorage by lib/store.ts)
    const sanitizedUser = sanitizeAccount(account);

    const emailVerified = Boolean(account.emailVerified);
    const response = NextResponse.json({
      authenticated: true,
      email: email,
      emailVerified,
      user: sanitizedUser || { email: email, name: name || email.split("@")[0] },
    });

    // Ensure custom session_token cookie is issued for NextAuth / Google users if missing,
    // or refreshed if older than 7 days (prevents endless sliding window vulnerability).
    // Also refreshed when the email was verified elsewhere (e.g. link opened on another device),
    // so the middleware's verification gate sees the new state.
    const currentSession = token ? verifySessionToken(token) : null;
    const nowSec = Math.floor(Date.now() / 1000);
    const shouldRefresh =
      !currentSession ||
      !currentSession.iat ||
      (nowSec - currentSession.iat > 7 * 24 * 60 * 60) ||
      (currentSession.ev === true) !== emailVerified;
    if (shouldRefresh) {
      setAuthCookie(response, email, name, account.tokenVersion ?? 0, emailVerified);
    }

    if (nextAuthSession?.user?.email) {
      response.cookies.set("leadmagnets_last_auth_method", "google", {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });
      response.cookies.set("leadmagnets_last_auth_email", email, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        httpOnly: false,
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}


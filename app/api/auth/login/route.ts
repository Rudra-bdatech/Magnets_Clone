import { NextResponse } from "next/server";
import { setAuthCookie, getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

/**
 * POST /api/auth/login
 *
 * INTERNAL USE ONLY — Google OAuth / onboarding session synchronisation.
 *
 * This endpoint converts an existing NextAuth Google session into a custom
 * HttpOnly session_token cookie. It requires that the caller ALREADY holds
 * a valid session (either a custom session_token or a NextAuth session-token
 * cookie). Without a prior verified session it returns 403.
 *
 * For password-based login, the cookie is set directly by handleLogin()
 * inside /api/data, which verifies the password before issuing the cookie.
 */
export async function POST(req: Request) {
  try {
    // ── Require an already-authenticated session ─────────────────────────
    // getAuthenticatedUserEmail() checks both the custom session_token cookie
    // and the NextAuth session-token cookie. If neither is present and valid,
    // it returns null and we reject the request.
    const sessionEmail = await getAuthenticatedUserEmail();

    if (!sessionEmail) {
      return NextResponse.json(
        { error: "Forbidden. A valid session is required to call this endpoint." },
        { status: 403 }
      );
    }

    // ── Optionally accept a display name from the body ────────────────────
    let name: string | undefined;
    try {
      const body = await req.json();
      name = typeof body?.name === "string" ? body.name : undefined;
    } catch {
      // body is optional — ignore parse failures
    }

    // ── Issue / refresh the custom session cookie ─────────────────────────
    // getAuthenticatedUserEmail() only returns verified accounts, so the new cookie is verified too.
    // Keep the account's tokenVersion, or the fresh cookie would count as revoked.
    await dbConnect();
    const account: any = await AccountModel.findOne({ email: sessionEmail }, { tokenVersion: 1 }).lean();
    const response = NextResponse.json({ success: true, email: sessionEmail });
    setAuthCookie(response, sessionEmail, name, account?.tokenVersion ?? 0, true);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to synchronise session." },
      { status: 500 }
    );
  }
}


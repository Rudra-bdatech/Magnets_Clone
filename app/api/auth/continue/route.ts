import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { authOptions } from "@/lib/auth-options";
import { sanitizeRedirect } from "@/lib/redirect";

/**
 * Post-OAuth landing route. First-time OAuth users (needsOnboarding) are sent to
 * the onboarding wizard once; returning users continue to `next` (default /dashboard).
 */
export async function GET(request: NextRequest) {
  const rawNext = request.nextUrl.searchParams.get("next");
  const next = sanitizeRedirect(rawNext, "/dashboard");

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await dbConnect();
    // Atomically consume the flag so onboarding is shown exactly once
    const firstVisit = await AccountModel.findOneAndUpdate(
      { email, needsOnboarding: true },
      { needsOnboarding: false }
    );
    if (firstVisit) {
      return NextResponse.redirect(new URL("/register/onboarding", request.url));
    }
  } catch (err) {
    console.error("Post-login onboarding check failed:", err);
  }

  return NextResponse.redirect(new URL(next, request.url));
}

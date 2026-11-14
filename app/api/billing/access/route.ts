import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { getAccessForEmail } from "@/lib/subscription-server";
import { hasCustomDomainAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/**
 * The signed-in account's trial / subscription state for the dashboard (trial pill, paywall).
 * Starts the 14-day trial on the first call for a verified account. The UI only renders what
 * this returns; every write route enforces the same rules on its own (requireFullAccess).
 */
export async function GET() {
  try {
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const result = await getAccessForEmail(email);
    if (!result) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json(
      {
        access: result.access,
        plan: result.account?.plan || "Free",
        // Separate one-time product (₹4,999): staff, buyers and admin grants
        customDomainUnlocked: hasCustomDomainAccess(result.account),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("[billing/access] Error:", error);
    return NextResponse.json({ error: "Could not load billing status" }, { status: 500 });
  }
}

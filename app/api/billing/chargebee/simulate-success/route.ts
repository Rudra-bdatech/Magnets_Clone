import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { hasActivePaidPlan, isSimulatedBillingAllowed, ALREADY_SUBSCRIBED_RESPONSE } from "@/lib/billing";
import { hasCustomDomainAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

// Sandbox simulation endpoint: upgrades the authenticated user to Pro without a real payment.
// Disabled unless ALLOW_SIMULATED_BILLING=true AND Chargebee keys are absent, in every environment.
// (Gating on NODE_ENV alone handed out free Pro on any dev/staging server.)
export async function POST(req: Request) {
  if (!isSimulatedBillingAllowed()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { isSimulated, product } = await req.json();

    if (!isSimulated) {
      return NextResponse.json({ error: "Invalid simulation request" }, { status: 400 });
    }

    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    await dbConnect();
    const current = await AccountModel.findOne(
      { email },
      { plan: 1, email: 1, role: 1, subscriptionStatus: 1, currentPeriodEnd: 1, lifetimeCustomDomain: 1 }
    ).lean();

    // Default is the custom domain, as the custom-domain upgrade modal has always called this route
    const isProMonthly = product === "pro_monthly";
    if (isProMonthly ? hasActivePaidPlan(current as any) : hasCustomDomainAccess(current as any)) {
      return NextResponse.json(ALREADY_SUBSCRIBED_RESPONSE, { status: 409 });
    }
    const set: Record<string, unknown> = isProMonthly
      ? {
          plan: "Pro",
          paymentProvider: "chargebee",
          paymentStatus: "simulated",
          lastPaymentDate: new Date(),
          chargebeeInvoiceId: `sim_${Date.now()}`,
          // Sandbox stand-in for one paid month of the Pro monthly subscription
          subscriptionStatus: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      : {
          // Sandbox stand-in for the one-time custom-domain purchase
          lifetimeCustomDomain: true,
          lastPaymentDate: new Date(),
          chargebeeInvoiceId: `sim_${Date.now()}`,
        };
    const updatedAccount = await AccountModel.findOneAndUpdate({ email }, { $set: set }, { new: true });

    if (!updatedAccount) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan: "Pro",
      message: "Simulated subscription activated! Pro features unlocked.",
      account: {
        email: updatedAccount.email,
        plan: updatedAccount.plan,
        name: updatedAccount.name,
      },
    });
  } catch (error: any) {
    console.error("[Chargebee Simulate Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Simulation failed" },
      { status: 500 }
    );
  }
}

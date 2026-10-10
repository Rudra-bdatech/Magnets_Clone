import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const dynamic = "force-dynamic";

// Development-only sandbox simulation endpoint.
// Upgrades the authenticated user to Pro without a real payment.
// This route is only reached when CHARGEBEE_API_KEY is not configured in .env.local.
export async function POST(req: Request) {
  try {
    const { isSimulated } = await req.json();

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
    const updatedAccount = await AccountModel.findOneAndUpdate(
      { email },
      {
        $set: {
          plan: "Pro",
          paymentProvider: "chargebee",
          paymentStatus: "simulated",
          lastPaymentDate: new Date(),
          chargebeeHostedPageId: `sim_${Date.now()}`,
        },
      },
      { new: true }
    );

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

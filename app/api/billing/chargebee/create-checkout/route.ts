import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getChargebeeClient, PLAN_PRICING } from "@/lib/billing";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Please log in to upgrade your subscription", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    await dbConnect();
    const account = await AccountModel.findOne({ email });
    if (!account) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // 2. Get Chargebee client
    const cb = getChargebeeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 3. Graceful sandbox simulation if keys are not yet configured
    if (!cb) {
      return NextResponse.json({
        success: true,
        isSimulated: true,
        checkoutUrl: null, // signals the UI to open the sandbox modal
        planName: "Pro Plan Monthly",
        amount: PLAN_PRICING.PRO_INR.amount,
        currency: PLAN_PRICING.PRO_INR.currency,
        displayPrice: PLAN_PRICING.PRO_INR.displayPrice,
        user: {
          name: account.name || account.username || "Subscriber",
          email: account.email,
        },
        message:
          "Chargebee keys not yet configured. Add CHARGEBEE_SITE & CHARGEBEE_API_KEY to .env.local for live checkout.",
      });
    }

    // 4. Create a real Chargebee Hosted Payment Page
    const result = await (cb as any).hostedPage
      .checkoutOneTime({
        charges: [
          {
            amount: PLAN_PRICING.PRO_INR.amount * 100, // Chargebee uses cents/paise
            description: "Magnets Pro Plan – Monthly (INR)",
          },
        ],
        currency_code: PLAN_PRICING.PRO_INR.currency,
        customer: {
          email: account.email,
          first_name: (account.name || account.username || "").split(" ")[0] || "",
          last_name: (account.name || account.username || "").split(" ").slice(1).join(" ") || "",
        },
        redirect_url: `${appUrl}/api/billing/chargebee/success`,
        cancel_url: `${appUrl}/dashboard`,
        pass_thru_content: JSON.stringify({
          userId: account._id.toString(),
          userEmail: account.email,
          plan: "Pro",
        }),
      })
      .request();

    const page = result.hosted_page;

    return NextResponse.json({
      success: true,
      isSimulated: false,
      checkoutUrl: page.url,
      hostedPageId: page.id,
      planName: "Pro Plan Monthly",
      amount: PLAN_PRICING.PRO_INR.amount,
      currency: PLAN_PRICING.PRO_INR.currency,
      displayPrice: PLAN_PRICING.PRO_INR.displayPrice,
      user: {
        name: account.name || account.username || "Subscriber",
        email: account.email,
      },
    });
  } catch (error: any) {
    console.error("[Chargebee Checkout Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize Chargebee checkout" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import {
  getChargebeeClient,
  PLAN_PRICING,
  hasActivePaidPlan,
  isSimulatedBillingAllowed,
  ALREADY_SUBSCRIBED_RESPONSE,
} from "@/lib/billing";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// This route is kept for backward compatibility.
// The primary checkout flow now uses /api/billing/chargebee/create-checkout
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

    if (hasActivePaidPlan(account)) {
      return NextResponse.json(ALREADY_SUBSCRIBED_RESPONSE, { status: 409 });
    }

    // 2. Get Chargebee client (replaces Razorpay)
    const cb = getChargebeeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 3. Simulation only when explicitly enabled (see isSimulatedBillingAllowed)
    if (!cb) {
      if (!isSimulatedBillingAllowed()) {
        return NextResponse.json(
          { error: "Payments are temporarily unavailable. Please try again later.", code: "BILLING_NOT_CONFIGURED" },
          { status: 503 }
        );
      }
      const mockOrderId = `order_sim_${crypto.randomBytes(8).toString("hex")}`;
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: PLAN_PRICING.PRO_INR.amountPaise,
        currency: PLAN_PRICING.PRO_INR.currency,
        keyId: "cb_test_mock_key",
        isSimulated: true,
        planName: "Pro Plan Monthly",
        user: {
          name: account.name || account.username || "Subscriber",
          email: account.email,
        },
        message:
          "Chargebee simulated order generated (Configure CHARGEBEE_SITE & CHARGEBEE_API_KEY for production).",
      });
    }

    // 4. Create Chargebee hosted page checkout (One-Time Payment)
    const itemPriceId = PLAN_PRICING.PRO_INR.itemPriceId || "pro-lifetime-4999-INR";
    const result = await cb.hostedPage.checkoutNewForItems({
      subscription_items: [
        {
          item_price_id: itemPriceId,
          quantity: 1,
          billing_cycles: 1,
        },
      ],
      billing_cycles: 1,
      customer: {
        email: account.email,
      },
      redirect_url: `${appUrl}/api/billing/chargebee/success`,
      cancel_url: `${appUrl}/dashboard`,
      pass_thru_content: JSON.stringify({
        userId: account._id.toString(),
        userEmail: account.email,
        plan: "Pro",
      }),
    });

    const page = result.hosted_page;

    return NextResponse.json({
      success: true,
      orderId: page.id,
      checkoutUrl: page.url,
      amount: PLAN_PRICING.PRO_INR.amountPaise,
      currency: PLAN_PRICING.PRO_INR.currency,
      keyId: process.env.CHARGEBEE_SITE,
      isSimulated: false,
      planName: "Pro Plan Monthly",
      user: {
        name: account.name || account.username || "Subscriber",
        email: account.email,
      },
    });
  } catch (error: any) {
    console.error("[Billing Order Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize payment order" },
      { status: 500 }
    );
  }
}

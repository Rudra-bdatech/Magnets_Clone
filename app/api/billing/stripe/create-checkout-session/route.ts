import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getStripeClient, PLAN_PRICING } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const email = await getAuthenticatedUserEmail();
    if (!email) {
      return NextResponse.json(
        { error: "Authentication required to initiate checkout", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    await dbConnect();
    const account = await AccountModel.findOne({ email });
    if (!account) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const stripe = getStripeClient();
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Graceful simulation/fallback if STRIPE_SECRET_KEY is not configured
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        success: true,
        isSimulated: true,
        url: `${origin}/dashboard/integration?payment_simulated=stripe_pro&status=success`,
        message: "Stripe test simulation ready (Configure STRIPE_SECRET_KEY for live hosted checkout).",
      });
    }

    // Create live Stripe Checkout Session ($29 USD)
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: PLAN_PRICING.PRO_USD.currency.toLowerCase(),
            product_data: {
              name: "Magnets Pro Plan (Monthly)",
              description: "Custom Domains, Unlimited Leads, Zero Watermarks, and Edge SSL.",
              images: [`${origin}/logo.png`],
            },
            unit_amount: PLAN_PRICING.PRO_USD.amountCents, // $29.00 = 2900 cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: account.email,
      client_reference_id: account._id.toString(),
      metadata: {
        userId: account._id.toString(),
        userEmail: account.email,
        plan: "Pro",
      },
      success_url: `${origin}/dashboard/integration?payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/integration?payment=stripe_cancelled`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("[Stripe Checkout Session Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Stripe checkout session" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getStripeClient, PLAN_PRICING, hasActivePaidPlan, ALREADY_SUBSCRIBED_RESPONSE } from "@/lib/billing";
import { createHash } from "crypto";

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

    if (hasActivePaidPlan(account)) {
      return NextResponse.json(ALREADY_SUBSCRIBED_RESPONSE, { status: 409 });
    }

    const stripe = getStripeClient();
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      console.error("[Stripe Checkout]: STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Card payments are temporarily unavailable. Please try again later.", code: "BILLING_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    // Reuse this account's checkout session while it is still open, so repeated clicks
    // (or a second tab) never produce several payable sessions.
    if (account.stripeCheckoutSessionId) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(account.stripeCheckoutSessionId);
        if (existing.status === "open" && existing.url) {
          return NextResponse.json({ success: true, url: existing.url, sessionId: existing.id, isSimulated: false });
        }
      } catch (err) {
        console.warn("[Stripe Checkout]: could not reuse previous session:", err);
      }
    }

    // Concurrent requests (double-click) within the same minute get the same session from Stripe
    const idempotencyKey = `checkout_${account._id.toString()}_${Math.floor(Date.now() / 60000)}_${createHash("sha256")
      .update(origin)
      .digest("hex")
      .slice(0, 12)}`;

    // Create live Stripe Checkout Session ($67 USD One-Time Lifetime)
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: PLAN_PRICING.PRO_USD.currency.toLowerCase(),
            product_data: {
              name: "Funnels Pro Plan (Lifetime License)",
              description: "Custom Domains, Unlimited Leads, Zero Watermarks, and Edge SSL.",
              images: [`${origin}/logo.png`],
            },
            unit_amount: PLAN_PRICING.PRO_USD.amountCents, // $67.00 = 6700 cents
            
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: account.email,
      client_reference_id: account._id.toString(),
      metadata: {
        userId: account._id.toString(),
        userEmail: account.email,
        plan: "Pro",
      },
      success_url: `${origin}/dashboard/integration?payment=stripe_success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/integration?payment=stripe_cancelled`,
    }, { idempotencyKey });

    await AccountModel.updateOne({ _id: account._id }, { $set: { stripeCheckoutSessionId: session.id } });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("[Stripe Checkout Session Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to start card checkout. Please try again." },
      { status: 500 }
    );
  }
}

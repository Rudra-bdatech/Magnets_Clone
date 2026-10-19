import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { getStripeClient } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = getStripeClient();
    let event: any;

    // Fail closed: never process an event we cannot verify.
    if (!stripe || !webhookSecret) {
      console.error("[Stripe Webhook]: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook Signature Error]:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[Stripe Webhook Event]:", event.type);
    await dbConnect();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status !== "paid") break;
        const userEmail = session.metadata?.userEmail || session.customer_email;
        if (userEmail) {
          await AccountModel.findOneAndUpdate(
            { email: userEmail.trim().toLowerCase() },
            {
              $set: {
                plan: "Pro",
                paymentProvider: "stripe",
                paymentStatus: "active",
                lastPaymentDate: new Date(),
                stripeCustomerId: session.customer || "",
                stripeSubscriptionId: session.subscription || "",
              },
            }
          );
          console.log(`[Stripe Webhook]: Plan upgraded to Pro for ${userEmail}`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        // Downgrade to Free on cancellation
        await AccountModel.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          {
            $set: {
              plan: "Free",
              paymentStatus: "canceled",
            },
          }
        );
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook Error]:", error);
    return NextResponse.json({ error: "Stripe webhook handling error" }, { status: 500 });
  }
}

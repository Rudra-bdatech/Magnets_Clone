import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("[Razorpay Webhook]: Signature mismatch");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log("[Razorpay Webhook Event]:", event.event);

    await dbConnect();

    if (
      event.event === "payment.captured" ||
      event.event === "order.paid" ||
      event.event === "subscription.activated"
    ) {
      const payment = event.payload?.payment?.entity || event.payload?.order?.entity;
      const userEmail = payment?.notes?.userEmail || payment?.email;

      if (userEmail) {
        await AccountModel.findOneAndUpdate(
          { email: userEmail.trim().toLowerCase() },
          {
            $set: {
              plan: "Pro",
              paymentProvider: "razorpay",
              paymentStatus: "active",
              lastPaymentDate: new Date(),
              razorpayPaymentId: payment?.id || "",
            },
          }
        );
        console.log(`[Razorpay Webhook]: Plan upgraded to Pro for ${userEmail}`);
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}

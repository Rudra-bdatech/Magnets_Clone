import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Chargebee sends POST events here.
// Configure this URL in Chargebee → Settings → Webhooks:
// https://your-domain.com/api/webhooks/chargebee
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // ── Optional: Verify Chargebee webhook signature ─────────────────────────
    const webhookPassword = process.env.CHARGEBEE_WEBHOOK_USERNAME
      ? `${process.env.CHARGEBEE_WEBHOOK_USERNAME}:${process.env.CHARGEBEE_WEBHOOK_PASSWORD}`
      : null;

    if (webhookPassword) {
      const authHeader = req.headers.get("authorization") || "";
      const expectedAuth =
        "Basic " + Buffer.from(webhookPassword).toString("base64");
      if (authHeader !== expectedAuth) {
        console.error("[Chargebee Webhook]: Auth mismatch");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event_type || "";

    console.log("[Chargebee Webhook Event]:", eventType);

    await dbConnect();

    // ── Handle payment success events ─────────────────────────────────────────
    if (
      eventType === "payment_succeeded" ||
      eventType === "invoice_generated" ||
      eventType === "hosted_page_state_changed"
    ) {
      const customer =
        event.content?.customer ||
        event.content?.invoice?.customer ||
        event.content?.hosted_page?.content?.customer;

      const invoice =
        event.content?.invoice ||
        event.content?.hosted_page?.content?.invoice;

      const userEmail = customer?.email;

      if (userEmail) {
        await AccountModel.findOneAndUpdate(
          { email: userEmail.trim().toLowerCase() },
          {
            $set: {
              plan: "Pro",
              paymentProvider: "chargebee",
              paymentStatus: "active",
              lastPaymentDate: new Date(),
              chargebeeCustomerId: customer?.id || "",
              chargebeeInvoiceId: invoice?.id || "",
            },
          }
        );
        console.log(
          `[Chargebee Webhook]: Plan upgraded to Pro for ${userEmail}`
        );
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (error: any) {
    console.error("[Chargebee Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}

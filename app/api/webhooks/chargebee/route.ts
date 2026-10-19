import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { PLAN_PRICING } from "@/lib/billing";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Item prices that grant the Pro plan. A payment for anything else on the
// Chargebee site must not upgrade the customer.
const PRO_ITEM_PRICE_IDS = new Set<string>([
  PLAN_PRICING.PRO_INR.itemPriceId,
  PLAN_PRICING.PRO_USD.itemPriceId,
]);

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Chargebee sends POST events here.
// Configure this URL in Chargebee → Settings → Webhooks, with Basic Auth
// matching CHARGEBEE_WEBHOOK_USERNAME / CHARGEBEE_WEBHOOK_PASSWORD:
// https://your-domain.com/api/webhooks/chargebee
export async function POST(req: NextRequest) {
  try {
    // ── Verify Basic Auth (fail closed) ─────────────────────────────────────
    const username = process.env.CHARGEBEE_WEBHOOK_USERNAME;
    const password = process.env.CHARGEBEE_WEBHOOK_PASSWORD;
    if (!username || !password) {
      console.error("[Chargebee Webhook]: CHARGEBEE_WEBHOOK_USERNAME/PASSWORD not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const expectedAuth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    if (!safeEqual(authHeader, expectedAuth)) {
      console.error("[Chargebee Webhook]: Auth mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = JSON.parse(await req.text());
    const eventType: string = event.event_type || "";

    console.log("[Chargebee Webhook Event]:", eventType);

    // ── Only a completed payment for the Pro item grants Pro ───────────────
    if (eventType !== "payment_succeeded") {
      return NextResponse.json({ status: "ok", received: true });
    }

    const customer = event.content?.customer;
    const invoice = event.content?.invoice;
    const userEmail: string | undefined = customer?.email;

    const isPaid = invoice?.status === "paid";
    const isProItem =
      Array.isArray(invoice?.line_items) &&
      invoice.line_items.some((li: any) => PRO_ITEM_PRICE_IDS.has(li?.entity_id));

    if (!userEmail || !isPaid || !isProItem) {
      console.warn("[Chargebee Webhook]: payment_succeeded ignored (not a paid Pro invoice)", {
        invoiceId: invoice?.id,
      });
      return NextResponse.json({ status: "ok", received: true });
    }

    await dbConnect();
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
    console.log(`[Chargebee Webhook]: Plan upgraded to Pro for ${userEmail}`);

    return NextResponse.json({ status: "ok", received: true });
  } catch (error: any) {
    console.error("[Chargebee Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}

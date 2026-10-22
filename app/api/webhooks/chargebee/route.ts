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

// Events after which the customer has not (or no longer) paid for Pro
const REVOKING_EVENTS = new Set<string>([
  "payment_refunded",
  "refund_initiated",
  "subscription_cancelled",
  "subscription_deleted",
]);

function isRevokingEvent(eventType: string): boolean {
  // Dispute/chargeback event names differ by gateway; match them by name
  return REVOKING_EVENTS.has(eventType) || /dispute|chargeback/i.test(eventType);
}

/**
 * Moves the Chargebee customer in `content` back to Free. Matches on the Chargebee
 * customer id stored at upgrade time, falling back to the customer's email.
 * Pro granted through another provider (or to staff by role) is left alone.
 */
async function downgradeChargebeeAccount(content: any): Promise<string> {
  const customerId: string =
    content.customer?.id || content.subscription?.customer_id || content.transaction?.customer_id || content.invoice?.customer_id || "";
  const customerEmail: string = (content.customer?.email || "").trim().toLowerCase();

  const match: Record<string, unknown>[] = [];
  if (customerId) match.push({ chargebeeCustomerId: customerId });
  if (customerEmail) match.push({ email: customerEmail, paymentProvider: "chargebee" });
  if (match.length === 0) return "ignored (no customer in payload)";

  const updated = await AccountModel.findOneAndUpdate(
    { paymentProvider: "chargebee", plan: { $ne: "Free" }, $or: match },
    { $set: { plan: "Free", paymentStatus: "revoked" } }
  );
  return updated ? `downgraded ${updated.email} to Free` : "no matching Pro account";
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

    // ── Refunds, cancellations and chargebacks take Pro away ───────────────
    if (isRevokingEvent(eventType)) {
      await dbConnect();
      const result = await downgradeChargebeeAccount(event.content || {});
      console.log(`[Chargebee Webhook]: ${eventType} → ${result}`);
      return NextResponse.json({ status: "ok", received: true });
    }

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
          chargebeeSubscriptionId: invoice?.subscription_id || "",
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

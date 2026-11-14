import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { PLAN_PRICING, CUSTOM_DOMAIN_ITEM_PRICE_IDS } from "@/lib/billing";
import { LIVE_SUBSCRIPTION_STATUSES } from "@/lib/subscription";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Pro monthly subscription item price (₹299/month). Its subscription events drive plan access.
const PRO_MONTHLY_ITEM_PRICE_IDS = new Set<string>([PLAN_PRICING.PRO_MONTHLY_INR.itemPriceId]);

// One-time custom-domain item prices (₹4,999, lifetime). A paid invoice unlocks the custom
// domain for life (lifetimeCustomDomain); a refund takes it away.
const LEGACY_LIFETIME_ITEM_PRICE_IDS = new Set<string>(CUSTOM_DOMAIN_ITEM_PRICE_IDS);

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Events after which the customer has not (or no longer) paid
function isRefundEvent(eventType: string): boolean {
  // Dispute/chargeback event names differ by gateway; match them by name
  return eventType === "payment_refunded" || eventType === "refund_initiated" || /dispute|chargeback/i.test(eventType);
}

function isProMonthlySubscription(sub: any): boolean {
  return (
    Array.isArray(sub?.subscription_items) &&
    sub.subscription_items.some((it: any) => PRO_MONTHLY_ITEM_PRICE_IDS.has(it?.item_price_id))
  );
}

function invoiceHasItem(invoice: any, ids: Set<string>): boolean {
  return Array.isArray(invoice?.line_items) && invoice.line_items.some((li: any) => ids.has(li?.entity_id));
}

/**
 * Finds the account an event belongs to: by subscription id, then Chargebee customer id,
 * then the customer's email (checkout creates the customer with the account email).
 */
async function findAccountForEvent(content: any): Promise<any | null> {
  const subId: string = content.subscription?.id || content.invoice?.subscription_id || "";
  const customerId: string =
    content.customer?.id || content.subscription?.customer_id || content.transaction?.customer_id || content.invoice?.customer_id || "";
  const customerEmail: string = (content.customer?.email || "").trim().toLowerCase();

  if (subId) {
    const bySub = await AccountModel.findOne({ chargebeeSubscriptionId: subId }, { _id: 1, email: 1 }).lean();
    if (bySub) return bySub;
  }
  if (customerId) {
    const byCustomer = await AccountModel.findOne({ chargebeeCustomerId: customerId }, { _id: 1, email: 1 }).lean();
    if (byCustomer) return byCustomer;
  }
  if (customerEmail) {
    return AccountModel.findOne({ email: customerEmail }, { _id: 1, email: 1 }).lean();
  }
  return null;
}

/**
 * Mirrors a Pro monthly subscription onto the account. Events can arrive out of order, so an
 * event older than the last one applied (Chargebee resource_version) is skipped.
 *
 * Cancellation: with "cancel at end of term" in Chargebee, the subscription is non_renewing
 * (still Pro) until the term ends, then cancelled. A failed renewal stays active while Chargebee
 * retries; lib/subscription.ts also allows PAYMENT_GRACE_DAYS past the term as a safety net.
 */
async function syncProSubscription(eventType: string, content: any): Promise<string> {
  const sub = content.subscription;
  const account: any = await findAccountForEvent(content);
  if (!account) return "no matching account";

  // A deleted subscription is gone, whatever status the payload still shows
  const status: string = eventType === "subscription_deleted" ? "cancelled" : sub.status || "";
  const isLive = LIVE_SUBSCRIPTION_STATUSES.has(status);
  const set: Record<string, unknown> = {
    plan: isLive ? "Pro" : "Free",
    subscriptionStatus: status,
    paymentProvider: "chargebee",
    chargebeeSubscriptionId: sub.id,
  };
  const customerId = content.customer?.id || sub.customer_id;
  if (customerId) set.chargebeeCustomerId = customerId;

  // Access runs until the paid term ends, or until the moment it was cancelled/paused.
  // Chargebee moves current_term_end forward at renewal even when the renewal payment fails, so
  // an unpaid invoice caps access at the date it fell due (lib/subscription.ts then adds the
  // PAYMENT_GRACE_DAYS while Chargebee retries).
  const dueSince = Number(sub.due_invoices_count) > 0 && sub.due_since ? sub.due_since : null;
  if (isLive) {
    const paidUntil = dueSince ?? sub.current_term_end;
    if (paidUntil) set.currentPeriodEnd = new Date(paidUntil * 1000);
  } else {
    const endedAt = eventType === "subscription_deleted" ? null : sub.cancelled_at || sub.pause_date || sub.current_term_end;
    set.currentPeriodEnd = endedAt ? new Date(endedAt * 1000) : new Date();
  }

  if (eventType === "payment_succeeded") {
    set.paymentStatus = "active";
    set.lastPaymentDate = new Date();
    if (content.invoice?.id) set.chargebeeInvoiceId = content.invoice.id;
  } else if (eventType === "payment_failed") {
    set.paymentStatus = "failed";
  } else if (!isLive) {
    set.paymentStatus = status;
  }

  const version = Number(sub.resource_version) || 0;
  const filter: Record<string, unknown> = { _id: account._id };
  if (version) {
    filter.$or = [{ chargebeeSubVersion: { $lt: version } }, { chargebeeSubVersion: { $exists: false } }];
    set.chargebeeSubVersion = version;
  }
  const res = await AccountModel.updateOne(filter, { $set: set });
  return res.matchedCount ? `${account.email} → ${status}` : `stale event skipped for ${account.email}`;
}

/** Refund / chargeback: Pro monthly ends now; a lifetime refund removes the custom-domain perk. */
async function handleRefund(content: any): Promise<string> {
  const account: any = await findAccountForEvent(content);
  if (!account) return "no matching account";

  if (invoiceHasItem(content.invoice, LEGACY_LIFETIME_ITEM_PRICE_IDS)) {
    await AccountModel.updateOne({ _id: account._id }, { $set: { lifetimeCustomDomain: false } });
    // A lifetime buyer not yet moved to the trial model still has plan Pro and no subscription
    await AccountModel.updateOne(
      { _id: account._id, subscriptionStatus: { $in: ["", null] }, plan: { $ne: "Free" } },
      { $set: { plan: "Free", paymentStatus: "revoked" } }
    );
    return `lifetime perk revoked for ${account.email}`;
  }

  const isMonthly =
    isProMonthlySubscription(content.subscription) || invoiceHasItem(content.invoice, PRO_MONTHLY_ITEM_PRICE_IDS);
  if (!isMonthly) {
    // Dispute / refund payloads often carry only a transaction or credit note. If this customer
    // has a live Pro subscription, treat it as that subscription's refund (as the old code did).
    const full: any = await AccountModel.findOne({ _id: account._id }, { subscriptionStatus: 1 }).lean();
    if (!LIVE_SUBSCRIPTION_STATUSES.has(String(full?.subscriptionStatus || ""))) {
      return `ignored (no Pro invoice or live subscription) for ${account.email}`;
    }
  }

  await AccountModel.updateOne(
    { _id: account._id },
    { $set: { plan: "Free", subscriptionStatus: "cancelled", currentPeriodEnd: new Date(), paymentStatus: "revoked" } }
  );
  return `Pro revoked for ${account.email}`;
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
    const content = event.content || {};

    console.log("[Chargebee Webhook Event]:", eventType);

    // ── Refunds and chargebacks ─────────────────────────────────────────────
    if (isRefundEvent(eventType)) {
      await dbConnect();
      const result = await handleRefund(content);
      console.log(`[Chargebee Webhook]: ${eventType} → ${result}`);
      return NextResponse.json({ status: "ok", received: true });
    }

    // ── Pro monthly subscription lifecycle (created, activated, renewed, payment
    //    succeeded/failed, cancellation scheduled, cancelled, reactivated, paused…) ──
    if (content.subscription && isProMonthlySubscription(content.subscription)) {
      await dbConnect();
      const result = await syncProSubscription(eventType, content);
      console.log(`[Chargebee Webhook]: ${eventType} → ${result}`);
      return NextResponse.json({ status: "ok", received: true });
    }

    // ── A paid custom-domain invoice (₹4,999 one-time) unlocks the custom domain for life ──
    if (
      eventType === "payment_succeeded" &&
      content.invoice?.status === "paid" &&
      invoiceHasItem(content.invoice, LEGACY_LIFETIME_ITEM_PRICE_IDS)
    ) {
      await dbConnect();
      const account: any = await findAccountForEvent(content);
      if (account) {
        const set: Record<string, unknown> = { lifetimeCustomDomain: true, lastPaymentDate: new Date() };
        if (content.customer?.id) set.chargebeeCustomerId = content.customer.id;
        await AccountModel.updateOne({ _id: account._id }, { $set: set });
        console.log(`[Chargebee Webhook]: lifetime custom domain granted to ${account.email}`);
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

import { NextRequest, NextResponse } from "next/server";
import { getChargebeeClient, PLAN_PRICING, CUSTOM_DOMAIN_ITEM_PRICE_IDS } from "@/lib/billing";
import { LIVE_SUBSCRIPTION_STATUSES } from "@/lib/subscription";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const dynamic = "force-dynamic";

/** True when the hosted page's invoice or subscription contains one of these item prices. */
function pageHasItem(content: any, ids: Set<string>): boolean {
  const invoiceItems = Array.isArray(content?.invoice?.line_items) ? content.invoice.line_items : [];
  const subItems = Array.isArray(content?.subscription?.subscription_items) ? content.subscription.subscription_items : [];
  return (
    invoiceItems.some((li: any) => ids.has(li?.entity_id)) ||
    subItems.some((it: any) => ids.has(it?.item_price_id))
  );
}

// Chargebee redirects here after successful hosted page payment:
// GET /api/billing/chargebee/success?id=<hosted_page_id>
// Handles both products: the one-time custom domain (₹4,999) and Pro monthly (₹299).
export async function GET(req: NextRequest) {
  const hostedPageId = req.nextUrl.searchParams.get("id");
  const reqHost = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (reqHost.includes("localhost") ? "http" : "https");
  const appUrl = `${proto}://${reqHost}`;
  const domainPage = `${appUrl}/dashboard/integration`;

  if (!hostedPageId) {
    return NextResponse.redirect(`${domainPage}?payment=error`);
  }

  try {
    const cb = getChargebeeClient();
    if (!cb) {
      // If no keys — still redirect to integration; webhook will handle the upgrade
      return NextResponse.redirect(`${domainPage}?payment=pending`);
    }

    // Retrieve and verify the hosted page to confirm payment status
    const result = await (cb as any).hostedPage.retrieve(hostedPageId);
    const page = result.hosted_page;
    const content = page.content || {};

    let passThru: any = {};
    try {
      passThru = JSON.parse(page.pass_thru_content || "{}");
    } catch (_) {}

    const isProMonthly = pageHasItem(content, new Set([PLAN_PRICING.PRO_MONTHLY_INR.itemPriceId]));
    const isCustomDomain = !isProMonthly && pageHasItem(content, new Set(CUSTOM_DOMAIN_ITEM_PRICE_IDS));
    const returnUrl = isProMonthly || passThru.product === "pro_monthly" ? `${appUrl}/dashboard` : domainPage;

    if (page.state !== "succeeded") {
      console.warn("[Chargebee Success]: Page not in succeeded state:", page.state);
      return NextResponse.redirect(`${returnUrl}?payment=pending`);
    }

    const userEmail: string | null = passThru.userEmail || content.customer?.email || null;
    if (!userEmail) {
      return NextResponse.redirect(`${returnUrl}?payment=pending`);
    }
    await dbConnect();
    const email = userEmail.trim().toLowerCase();

    // ── Custom domain (one-time ₹4,999): unlocked for life ──
    if (isCustomDomain) {
      const set: Record<string, unknown> = {
        lifetimeCustomDomain: true,
        lastPaymentDate: new Date(),
      };
      if (content.customer?.id) set.chargebeeCustomerId = content.customer.id;
      if (content.invoice?.id) set.chargebeeInvoiceId = content.invoice.id;
      await AccountModel.updateOne({ email }, { $set: set });
      console.log(`[Chargebee Success]: Custom domain unlocked for ${email}`);
      return NextResponse.redirect(`${domainPage}?payment=success`);
    }

    // ── Pro monthly: only a live subscription grants Pro here ──
    const subscription = content.subscription;
    const status: string = subscription?.status || "";
    if (isProMonthly && subscription?.id && LIVE_SUBSCRIPTION_STATUSES.has(status)) {
      const set: Record<string, unknown> = {
        plan: "Pro",
        paymentProvider: "chargebee",
        paymentStatus: "paid",
        lastPaymentDate: new Date(),
        chargebeeCustomerId: content.customer?.id || "",
        chargebeeSubscriptionId: subscription.id,
        chargebeeInvoiceId: content.invoice?.id || "",
        subscriptionStatus: status,
      };
      if (subscription.current_term_end) set.currentPeriodEnd = new Date(subscription.current_term_end * 1000);
      // Never roll back a newer state the webhook may already have written
      const version = Number(subscription.resource_version) || 0;
      const filter: Record<string, unknown> = { email };
      if (version) {
        filter.$or = [{ chargebeeSubVersion: { $lt: version } }, { chargebeeSubVersion: { $exists: false } }];
        set.chargebeeSubVersion = version;
      }
      const res = await AccountModel.updateOne(filter, { $set: set });
      console.log(
        res.matchedCount
          ? `[Chargebee Success]: Upgraded ${email} → Pro`
          : `[Chargebee Success]: ${email} already has a newer subscription state`
      );
      return NextResponse.redirect(`${appUrl}/dashboard?payment=success`);
    }

    console.warn("[Chargebee Success]: hosted page is not a recognised paid product; left to the webhook", {
      hostedPageId,
    });
    return NextResponse.redirect(`${returnUrl}?payment=pending`);
  } catch (error: any) {
    console.error("[Chargebee Success Error]:", error);
    return NextResponse.redirect(`${domainPage}?payment=error`);
  }
}

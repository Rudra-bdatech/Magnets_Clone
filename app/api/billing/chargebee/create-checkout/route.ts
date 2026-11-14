import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import {
  getChargebeeClient,
  PLAN_PRICING,
  isStaffCoupon,
  hasActivePaidPlan,
  isSimulatedBillingAllowed,
  ALREADY_SUBSCRIBED_RESPONSE,
} from "@/lib/billing";
import { isCompanyAccount } from "@/lib/roles";
import { ensureTrialStarted } from "@/lib/subscription-server";
import { getAccountAccess, hasCustomDomainAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/**
 * Two separate products:
 *  - "custom_domain" (default, as the custom-domain upgrade has always called this route):
 *    one-time ₹4,999 payment that unlocks the custom domain for life.
 *  - "pro_monthly": ₹299/month Chargebee subscription for dashboard access after the trial.
 */
type Product = "custom_domain" | "pro_monthly";

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

    const body = await req.json().catch(() => ({}));
    const product: Product = body?.product === "pro_monthly" ? "pro_monthly" : "custom_domain";
    const rawCoupon = typeof body?.couponCode === "string" ? body.couponCode : "";
    const cleanCoupon = rawCoupon.trim().toUpperCase();

    // Moves an old lifetime buyer to the trial model first (keeps their custom domain unlocked)
    const migrated = await ensureTrialStarted(account.toObject());

    if (product === "custom_domain") {
      if (hasCustomDomainAccess(migrated)) {
        return NextResponse.json(
          { error: "Your custom domain is already unlocked. There's nothing more to pay.", code: "ALREADY_UNLOCKED" },
          { status: 409 }
        );
      }
    } else if (hasActivePaidPlan(migrated) || getAccountAccess(migrated).state === "pro") {
      // Already paid up: an active subscription, or a cancelled one still inside its paid month
      return NextResponse.json(ALREADY_SUBSCRIBED_RESPONSE, { status: 409 });
    }

    // Staff coupons are for company accounts only; Chargebee must restrict them too.
    if (isStaffCoupon(cleanCoupon) && !isCompanyAccount(account.email, account.role)) {
      return NextResponse.json(
        { error: "Invalid or expired coupon code.", code: "INVALID_COUPON" },
        { status: 400 }
      );
    }

    const pricing = product === "pro_monthly" ? PLAN_PRICING.PRO_MONTHLY_INR : PLAN_PRICING.PRO_INR;
    const isCouponApplied = Boolean(cleanCoupon);
    const couponPlanName = product === "pro_monthly" ? "Pro Plan (₹1 Coupon Applied)" : "Custom Domain (₹1 Coupon Applied)";

    // 2. Get Chargebee client & determine dynamic return URL
    const cb = getChargebeeClient();
    const reqHost = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (reqHost.includes("localhost") ? "http" : "https");
    const appUrl = `${proto}://${reqHost}`;

    // 3. No Chargebee keys: sandbox simulation only when explicitly enabled, otherwise a clear error
    // (a "success" without a checkout URL left the checkout page stuck on "Processing...").
    if (!cb) {
      if (!isSimulatedBillingAllowed()) {
        console.error("[Chargebee Checkout]: CHARGEBEE_SITE / CHARGEBEE_API_KEY are not configured");
        return NextResponse.json(
          { error: "Payments are temporarily unavailable. Please try again later.", code: "BILLING_NOT_CONFIGURED" },
          { status: 503 }
        );
      }
      const isCoupon = isStaffCoupon(cleanCoupon);
      return NextResponse.json({
        success: true,
        isSimulated: true,
        checkoutUrl: null, // signals the UI to open the sandbox modal
        product,
        planName: isCoupon ? couponPlanName : pricing.name,
        amount: isCoupon ? 1 : pricing.amount,
        currency: pricing.currency,
        displayPrice: isCoupon ? "₹1" : pricing.displayPrice,
        couponApplied: isCoupon ? cleanCoupon : null,
        user: {
          name: account.name || account.username || "Subscriber",
          email: account.email,
        },
        message:
          "Chargebee keys not yet configured. Add CHARGEBEE_SITE & CHARGEBEE_API_KEY to .env.local for live checkout.",
      });
    }

    const passThru = JSON.stringify({
      userId: account._id.toString(),
      userEmail: account.email,
      product,
      plan: product === "pro_monthly" ? "Pro" : "CustomDomain",
      coupon: cleanCoupon || null,
    });

    let page: any = null;

    if (product === "pro_monthly") {
      // 4a. Pro monthly subscription (Product Catalog 2.0). No billing_cycles: renews until cancelled.
      // Reuse the Chargebee customer from an earlier purchase so one person stays one customer.
      const customerData: Record<string, string> = account.chargebeeCustomerId
        ? { id: account.chargebeeCustomerId }
        : {
            email: account.email,
            first_name: (account.name || account.username || "").split(" ")[0] || "",
            last_name: (account.name || account.username || "").split(" ").slice(1).join(" ") || "",
          };
      const subParams: any = {
        subscription_items: [{ item_price_id: PLAN_PRICING.PRO_MONTHLY_INR.itemPriceId, quantity: 1 }],
        customer: customerData,
        redirect_url: `${appUrl}/api/billing/chargebee/success`,
        cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
        pass_thru_content: passThru,
      };
      if (cleanCoupon) subParams.coupon_ids = [cleanCoupon];
      const res = await (cb as any).hostedPage.checkoutNewForItems(subParams);
      page = res.hosted_page;
    } else {
      // 4b. Custom domain: one-time ₹4,999 Hosted Payment Page (unchanged from before)
      const rawPriceId = PLAN_PRICING.PRO_INR.itemPriceId || "funnels-custom-domain-INR";
      const itemPriceId = rawPriceId === "funnels-custom-domain" ? "funnels-custom-domain-INR" : rawPriceId;
      const customerData = {
        email: account.email,
        first_name: (account.name || account.username || "").split(" ")[0] || "",
        last_name: (account.name || account.username || "").split(" ").slice(1).join(" ") || "",
      };

      // Try checkoutOneTimeForItems first (for Chargebee one-time Charges)
      try {
        const oneTimeParams: any = {
          item_prices: {
            item_price_id: [itemPriceId],
            quantity: [1],
          },
          customer: customerData,
          redirect_url: `${appUrl}/api/billing/chargebee/success`,
          cancel_url: `${appUrl}/dashboard/integration`,
          pass_thru_content: passThru,
        };
        if (cleanCoupon) oneTimeParams.coupon_ids = [cleanCoupon];
        const res = await (cb as any).hostedPage.checkoutOneTimeForItems(oneTimeParams);
        page = res.hosted_page;
      } catch (oneTimeErr: any) {
        console.warn("[Chargebee Checkout]: checkoutOneTimeForItems fallback to checkoutNewForItems:", oneTimeErr?.message);
        const subParams: any = {
          subscription_items: [{ item_price_id: itemPriceId, quantity: 1, billing_cycles: 1 }],
          billing_cycles: 1,
          customer: customerData,
          redirect_url: `${appUrl}/api/billing/chargebee/success`,
          cancel_url: `${appUrl}/dashboard/integration`,
          pass_thru_content: passThru,
        };
        if (cleanCoupon) subParams.coupon_ids = [cleanCoupon];
        const res = await (cb as any).hostedPage.checkoutNewForItems(subParams);
        page = res.hosted_page;
      }
    }

    return NextResponse.json({
      success: true,
      isSimulated: false,
      checkoutUrl: page.url,
      hostedPageId: page.id,
      hostedPage: page,
      hosted_page: page,
      product,
      planName: isCouponApplied ? couponPlanName : pricing.name,
      amount: isCouponApplied ? 1 : pricing.amount,
      currency: pricing.currency,
      displayPrice: isCouponApplied ? "₹1" : pricing.displayPrice,
      couponApplied: cleanCoupon || null,
      user: {
        name: account.name || account.username || "Subscriber",
        email: account.email,
      },
    });
  } catch (error: any) {
    // Full detail stays in the server log; users get a plain message (never raw Chargebee errors
    // such as "funnels-pro-INR-Monthly not found" when a plan is not set up yet).
    console.error("[Chargebee Checkout Error]:", error?.api_error_code || "", error?.message || error);
    const isCouponError = /coupon/i.test(String(error?.param || error?.message || ""));
    return NextResponse.json(
      {
        error: isCouponError
          ? "That promo code can't be used for this purchase."
          : "We couldn't open the payment page right now. Please try again in a few minutes.",
        code: "CHECKOUT_UNAVAILABLE",
      },
      { status: 502 }
    );
  }
}

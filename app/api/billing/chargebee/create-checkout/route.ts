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
import crypto from "crypto";

export const dynamic = "force-dynamic";

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

    if (hasActivePaidPlan(account)) {
      return NextResponse.json(ALREADY_SUBSCRIBED_RESPONSE, { status: 409 });
    }

    // Parse coupon code if provided
    const body = await req.json().catch(() => ({}));
    const rawCoupon = typeof body?.couponCode === "string" ? body.couponCode : "";
    const cleanCoupon = rawCoupon.trim().toUpperCase();

    // Staff coupons are for company accounts only; Chargebee must restrict them too.
    if (isStaffCoupon(cleanCoupon) && !isCompanyAccount(account.email, account.role)) {
      return NextResponse.json(
        { error: "Invalid or expired coupon code.", code: "INVALID_COUPON" },
        { status: 400 }
      );
    }

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
        planName: isCoupon ? "Pro Plan (₹1 Coupon Applied)" : "Pro Plan Lifetime (One-Time)",
        amount: isCoupon ? 1 : PLAN_PRICING.PRO_INR.amount,
        currency: PLAN_PRICING.PRO_INR.currency,
        displayPrice: isCoupon ? "₹1" : PLAN_PRICING.PRO_INR.displayPrice,
        couponApplied: isCoupon ? cleanCoupon : null,
        user: {
          name: account.name || account.username || "Subscriber",
          email: account.email,
        },
        message:
          "Chargebee keys not yet configured. Add CHARGEBEE_SITE & CHARGEBEE_API_KEY to .env.local for live checkout.",
      });
    }

    // 4. Create a real Chargebee Hosted Payment Page (Product Catalog 2.0 - One-Time Payment)
    const itemPriceId = PLAN_PRICING.PRO_INR.itemPriceId || "pro-lifetime-4999-INR";
    const checkoutParams: any = {
      subscription_items: [
        {
          item_price_id: itemPriceId,
          quantity: 1,
          billing_cycles: 1,
        },
      ],
      billing_cycles: 1,
      customer: {
        email: account.email,
        first_name: (account.name || account.username || "").split(" ")[0] || "",
        last_name: (account.name || account.username || "").split(" ").slice(1).join(" ") || "",
      },
      redirect_url: `${appUrl}/api/billing/chargebee/success`,
      cancel_url: `${appUrl}/dashboard/integration`,
      pass_thru_content: JSON.stringify({
        userId: account._id.toString(),
        userEmail: account.email,
        plan: "Pro",
        coupon: cleanCoupon || null,
      }),
    };

    if (cleanCoupon) {
      checkoutParams.coupon_ids = [cleanCoupon];
    }

    const result = await (cb as any).hostedPage.checkoutNewForItems(checkoutParams);
    const page = result.hosted_page;

    const isCouponApplied = Boolean(cleanCoupon);
    const chargedAmount = isCouponApplied ? 1 : PLAN_PRICING.PRO_INR.amount;
    const chargedDisplay = isCouponApplied ? "₹1" : PLAN_PRICING.PRO_INR.displayPrice;

    return NextResponse.json({
      success: true,
      isSimulated: false,
      checkoutUrl: page.url,
      hostedPageId: page.id,
      hostedPage: page,
      hosted_page: page,
      planName: isCouponApplied ? "Pro Plan (₹1 Coupon Applied)" : "Pro Plan Lifetime (One-Time)",
      amount: chargedAmount,
      currency: PLAN_PRICING.PRO_INR.currency,
      displayPrice: chargedDisplay,
      couponApplied: cleanCoupon || null,
      user: {
        name: account.name || account.username || "Subscriber",
        email: account.email,
      },
    });
  } catch (error: any) {
    console.error("[Chargebee Checkout Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize Chargebee checkout" },
      { status: 500 }
    );
  }
}

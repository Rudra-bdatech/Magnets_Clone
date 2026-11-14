import Stripe from "stripe";
import {
  PAID_PLANS,
  PRO_MONTHLY_PRICE_INR,
  PRO_MONTHLY_DISPLAY_PRICE,
  getAccountAccess,
  type AccessAccountFields,
} from "@/lib/subscription";

// ─── Chargebee Client (Server-side) ─────────────────────────────────────────
// Chargebee v3 uses `new Chargebee(config)` constructor pattern.
// We use require() to avoid ESM/CJS interop issues with Next.js.
let _cbInstance: any | null = null;

export function getChargebeeClient() {
  const site = process.env.CHARGEBEE_SITE;
  const apiKey = process.env.CHARGEBEE_API_KEY;

  if (!site || !apiKey) return null;

  if (!_cbInstance) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ChargeBee = require("chargebee");
    _cbInstance = new ChargeBee({ site, apiKey });
  }

  return _cbInstance;
}

// ─── Stripe Client (Server-side) ─────────────────────────────────────────────
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: "2024-06-20" as any,
    typescript: true,
  });
}

// ─── Pricing Constants ────────────────────────────────────────────────────────
// Two separate products:
//  - Pro monthly: recurring ₹299/month (GST inclusive) after the 14-day trial — dashboard access.
//    Create it in Chargebee → Product Catalog as a monthly INR item price with tax-inclusive
//    pricing, and put its Item Price ID in CHARGEBEE_PRO_MONTHLY_ITEM_PRICE_ID.
//  - Custom domain: one-time ₹4,999 lifetime unlock (PRO_INR, the existing Chargebee item).
export const PLAN_PRICING = {
  PRO_MONTHLY_INR: {
    amount: PRO_MONTHLY_PRICE_INR,
    currency: "INR",
    name: "Funnels Pro (Monthly)",
    displayPrice: PRO_MONTHLY_DISPLAY_PRICE,
    itemPriceId: process.env.CHARGEBEE_PRO_MONTHLY_ITEM_PRICE_ID || "funnels-pro-INR-Monthly",
  },
  // Custom domain: one-time ₹4,999, unlocked for life (sets lifetimeCustomDomain).
  PRO_INR: {
    amount: 4999,
    amountPaise: 499900,
    currency: "INR",
    name: "Custom Domain (Lifetime, One-Time)",
    displayPrice: "₹4,999",
    itemPriceId: (process.env.CHARGEBEE_ITEM_PRICE_ID_INR && process.env.CHARGEBEE_ITEM_PRICE_ID_INR !== "funnels-custom-domain" ? process.env.CHARGEBEE_ITEM_PRICE_ID_INR : "funnels-custom-domain-INR"),
  },
  PRO_USD: {
    amount: 67,
    amountCents: 6700,
    currency: "USD",
    name: "Pro Plan Lifetime (Global)",
    displayPrice: "$67",
    itemPriceId: process.env.CHARGEBEE_ITEM_PRICE_ID_USD || "pro-monthly-USD",
  },
} as const;

/** Chargebee item prices of the one-time custom-domain product (current and older ids). */
export const CUSTOM_DOMAIN_ITEM_PRICE_IDS: string[] = Array.from(
  new Set([
    PLAN_PRICING.PRO_INR.itemPriceId,
    PLAN_PRICING.PRO_USD.itemPriceId,
    "funnels-custom-domain",
    "funnels-custom-domain-INR",
    "funnels-pro-domain-onetime",
    "pro-lifetime-4999-INR",
  ])
);

/** Stripe and Razorpay checkouts are retired: payments are India-only through Chargebee for now. */
export const PLAN_RETIRED_RESPONSE = {
  error: "This payment option is no longer available. Please pay with UPI or an Indian card.",
  code: "PLAN_RETIRED",
} as const;

// ₹1 staff coupons. Only company accounts (isCompanyAccount) may use them; the
// same codes must also be restricted in Chargebee, which applies the real discount.
export const STAFF_COUPON_CODES = ["BDA1", "STAFF1"];

export function isStaffCoupon(code: string): boolean {
  return STAFF_COUPON_CODES.includes(code);
}

// Plans that mean "has Pro right now". Checkout is refused while one is active, so nobody pays twice.
export { PAID_PLANS };

export function hasActivePaidPlan(account: AccessAccountFields | null | undefined): boolean {
  if (!PAID_PLANS.includes(String(account?.plan || ""))) return false;
  // A subscription whose period (plus payment grace) has run out may subscribe again even if a
  // missed webhook left plan = "Pro" behind.
  return getAccountAccess(account).state !== "expired";
}

export const ALREADY_SUBSCRIBED_RESPONSE = {
  error: "Your account already has Pro. There's nothing more to pay.",
  code: "ALREADY_SUBSCRIBED",
} as const;

/**
 * Sandbox "payments" that grant Pro without charging. Only with an explicit opt-in
 * (ALLOW_SIMULATED_BILLING=true) AND no real Chargebee keys - never just because NODE_ENV
 * is not "production" (staging and preview servers are not production).
 */
export function isSimulatedBillingAllowed(): boolean {
  return process.env.ALLOW_SIMULATED_BILLING === "true" && !getChargebeeClient();
}

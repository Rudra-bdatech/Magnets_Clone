import Stripe from "stripe";

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
export const PLAN_PRICING = {
  PRO_INR: {
    amount: 1999,
    amountPaise: 199900,   // kept for any legacy references (1 INR = 100 paise)
    currency: "INR",
    name: "Pro Plan Monthly (India)",
    displayPrice: "₹1,999",
    // Item Price ID from Chargebee Product Catalog → Item Prices
    itemPriceId: process.env.CHARGEBEE_ITEM_PRICE_ID_INR || "pro-monthly-INR",
  },
  PRO_USD: {
    amount: 29,
    amountCents: 2900,     // kept for Stripe (1 USD = 100 cents)
    currency: "USD",
    name: "Pro Plan Monthly (Global)",
    displayPrice: "$29",
    itemPriceId: process.env.CHARGEBEE_ITEM_PRICE_ID_USD || "pro-monthly-USD",
  },
} as const;

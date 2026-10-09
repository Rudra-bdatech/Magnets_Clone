import Razorpay from "razorpay";
import Stripe from "stripe";

// Initialize Razorpay Client (Server-side)
export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

// Initialize Stripe Client (Server-side)
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-06-20" as any,
    typescript: true,
  });
}

// Pricing constants
export const PLAN_PRICING = {
  PRO_INR: {
    amount: 1999,
    amountPaise: 199900,
    currency: "INR",
    name: "Pro Plan Monthly (India)",
    displayPrice: "₹1,999",
  },
  PRO_USD: {
    amount: 29,
    amountCents: 2900,
    currency: "USD",
    name: "Pro Plan Monthly (Global)",
    displayPrice: "$29",
  },
} as const;

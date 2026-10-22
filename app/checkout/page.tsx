"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Tag,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Globe2,
} from "lucide-react";
import BrandLogo from "@/components/brand";
import { loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function CheckoutPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<"chargebee" | "stripe">("chargebee");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Promo code state
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponCode: string;
    discountAmount: number;
    finalAmount: number;
    name: string;
    displayFinal: string;
    savingsMessage?: string;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Blocks a second checkout request (double-click) while the first is in flight or redirecting
  const checkoutInFlight = useRef(false);

  useEffect(() => {
    const acc = loadAccount();
    if (acc) setAccount(acc);
  }, []);

  // Coming back from the payment page with the browser Back button restores this page from the
  // back/forward cache with "Processing..." still showing; reset it so the user can act again.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        checkoutInFlight.current = false;
        setIsLoading(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const alreadyPaid = ["Pro", "Growth", "Unlimited"].includes(String(account?.plan || ""));

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/billing/chargebee/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid coupon code");
      }
      setAppliedCoupon(data);
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setShowPromoInput(false);
  };

  const handleProceedToPayment = async () => {
    if (checkoutInFlight.current || alreadyPaid) return;
    checkoutInFlight.current = true;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (selectedGateway === "chargebee") {
        const res = await fetch("/api/billing/chargebee/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: appliedCoupon?.couponCode || "",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to initialize payment");
        }

        if (!data.checkoutUrl) {
          throw new Error("We couldn't open the payment page. Please try again.");
        }
        window.location.href = data.checkoutUrl;
        return;
      } else {
        const res = await fetch("/api/billing/stripe/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to initialize Stripe checkout");
        }
        if (!data.url) {
          throw new Error("We couldn't open the payment page. Please try again.");
        }
        window.location.href = data.url;
        return;
      }
    } catch (err: any) {
      console.error("Checkout Error:", err);
      setErrorMsg(err.message || "Something went wrong initiating checkout.");
      setIsLoading(false);
      checkoutInFlight.current = false;
    }
  };

  const originalPrice = 4999;
  const finalPrice = appliedCoupon ? appliedCoupon.finalAmount : originalPrice;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#090A0F] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-[#0066B2]/20 flex flex-col justify-between">
      {/* Sleek Top Navigation */}
      <header className="border-b border-zinc-200/80 dark:border-white/5 py-4 px-6 sm:px-12 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-2">
          <BrandLogo height="h-7" />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          <Lock className="h-3.5 w-3.5 text-emerald-500" />
          <span className="hidden sm:inline">256-bit Encryption</span>
        </div>
      </header>

      {/* Main Split Layout — Stripe Caliber Cleanliness */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 sm:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Clean Product Context (No nested cards) */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Lifetime License
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Magnets Pro
              </h1>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  one-time payment • lifetime access
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Connect your custom domain, capture unlimited leads, and remove all platform branding permanently.
              </p>
            </div>

            {/* Clean Feature List — Typography & Checkmarks (No heavy boxes) */}
            <div className="pt-6 border-t border-zinc-200 dark:border-white/5 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Included in your license
              </p>

              <ul className="space-y-3.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>
                    <strong className="text-zinc-900 dark:text-white font-semibold">Custom root & subdomains</strong> (e.g. get.yourbrand.com) with automated edge SSL
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>
                    <strong className="text-zinc-900 dark:text-white font-semibold">2,500 leads per month</strong> with automated CSV export & CRM sync
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>
                    <strong className="text-zinc-900 dark:text-white font-semibold">1,024 MB cloud asset hosting</strong> for guides, PDFs & templates
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>
                    <strong className="text-zinc-900 dark:text-white font-semibold">100% white-label</strong> — removes all platform badges & watermarks
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>
                    <strong className="text-zinc-900 dark:text-white font-semibold">Automated email sequences</strong> via SMTP or direct Gmail sync
                  </span>
                </li>
              </ul>
            </div>

            {/* Subtle Guarantee Footer */}
            <div className="pt-6 border-t border-zinc-200 dark:border-white/5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Full 14-day money-back guarantee. No questions asked.</span>
            </div>
          </div>

          {/* Right Column: Refined Payment Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-6">
                Payment Details
              </h2>

              {/* Payment Method Switcher */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("chargebee")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedGateway === "chargebee"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>UPI & Indian Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("stripe")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedGateway === "stripe"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <Globe2 className="h-3.5 w-3.5" />
                    <span>Global Cards ($29)</span>
                  </button>
                </div>
              </div>

              {/* Order Breakdown */}
              <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-400 pb-5 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center justify-between font-medium text-zinc-900 dark:text-white">
                  <span>Magnets Pro (Lifetime License)</span>
                  <span>₹{originalPrice.toLocaleString("en-IN")}.00</span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      <span>Promotion code ({appliedCoupon.couponCode})</span>
                    </span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}.00</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-zinc-500">
                  <span>Taxes & GST</span>
                  <span>Included</span>
                </div>
              </div>

              {/* Promo Code Section (Modern Collapsible / Clean Inline) */}
              {selectedGateway === "chargebee" && (
                <div className="py-4 border-b border-zinc-200 dark:border-white/10">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ {appliedCoupon.couponCode} applied ({appliedCoupon.savingsMessage || "Pay only ₹1"})
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-zinc-400 hover:text-red-500 underline ml-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : showPromoInput ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          autoFocus
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="Promo code"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                        />
                        <button
                          type="button"
                          disabled={!couponInput.trim() || isApplyingCoupon}
                          onClick={handleApplyCoupon}
                          className="py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                          {isApplyingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPromoInput(false);
                            setCouponError(null);
                          }}
                          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1"
                        >
                          Cancel
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPromoInput(true)}
                      className="text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      <span>Add promotion code</span>
                    </button>
                  )}
                </div>
              )}

              {/* Total Due Today */}
              <div className="py-5 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white block">
                    Total due today
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    One-time payment
                  </span>
                </div>
                <div className="text-right">
                  {appliedCoupon ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs line-through text-zinc-400">
                        ₹{originalPrice.toLocaleString("en-IN")}.00
                      </span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹{finalPrice}.00
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">
                      ₹{originalPrice.toLocaleString("en-IN")}.00
                    </span>
                  )}
                </div>
              </div>

              {alreadyPaid && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
                  Your account already has Pro. There&apos;s nothing more to pay.{" "}
                  <Link href="/dashboard" className="underline font-semibold">Go to dashboard</Link>
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Primary High-Contrast Checkout Button */}
              <button
                type="button"
                disabled={isLoading || alreadyPaid}
                onClick={handleProceedToPayment}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      Pay ₹{finalPrice.toLocaleString("en-IN")}.00
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Discreet Trust Footer */}
              <div className="mt-4 text-center">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Secured by Chargebee • Instant account upgrade upon completion
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-white/5 py-4 px-6 sm:px-12 text-center text-xs text-zinc-400">
        <span>© {new Date().getFullYear()} Magnets. All rights reserved.</span>
      </footer>
    </div>
  );
}

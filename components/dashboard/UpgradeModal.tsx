"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Sparkles,
  Lock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  CreditCard,
  QrCode,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  Shield,
} from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  featureHighlight?: string;
  currentPlan?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  onSuccess,
  featureHighlight = "Custom Domains & White-Labeling",
  currentPlan = "Free",
}: UpgradeModalProps) {
  const [selectedGateway, setSelectedGateway] = useState<"chargebee" | "stripe">("chargebee");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Interactive Sandbox Simulator State (Active when .env API keys are not yet configured)
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxOrder, setSandboxOrder] = useState<any>(null);
  const [sandboxMethod, setSandboxMethod] = useState<"upi" | "card" | "qr">("upi");
  const [simulatedUpiId, setSimulatedUpiId] = useState("user@okaxis");

  if (!isOpen) return null;

  // ── 1. Handle Chargebee Hosted Checkout (INR ₹1,999) ─────────────────────
  const handleChargebeeCheckout = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/billing/chargebee/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize Chargebee checkout");
      }

      // Chargebee keys not yet in .env → show interactive sandbox simulator
      if (data.isSimulated || !data.checkoutUrl) {
        setSandboxOrder(data);
        setShowSandboxModal(true);
        setIsLoading(false);
        return;
      }

      // Redirect to Chargebee Hosted Payment Page
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("Chargebee Error:", err);
      setErrorMsg(err.message || "Something went wrong initiating payment.");
      setIsLoading(false);
    }
  };

  // ── Complete simulated sandbox payment ────────────────────────────────────
  const handleCompleteSandboxPayment = async () => {
    setIsLoading(true);
    try {
      // Simulate a successful payment by calling a lightweight upgrade endpoint
      const res = await fetch("/api/billing/chargebee/simulate-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSimulated: true }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSandboxModal(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to complete simulation.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Simulation error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 2. Handle Stripe Checkout ($29 USD) ───────────────────────────────────
  const handleStripeCheckout = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/billing/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize Stripe checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Stripe Error:", err);
      setErrorMsg(err.message || "Something went wrong with Stripe checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = () => {
    if (selectedGateway === "chargebee") {
      handleChargebeeCheckout();
    } else {
      handleStripeCheckout();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isLoading) {
              setShowSandboxModal(false);
              onClose();
            }
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Interactive Chargebee Sandbox Modal (When keys are not yet configured) */}
        {showSandboxModal ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-blue-500/30 bg-[#0F172A] text-white shadow-2xl z-20 my-8 p-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0066B2] text-white">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Chargebee Checkout Sandbox</h4>
                  <p className="text-[11px] text-blue-300">Test Payment Simulation (₹1,999)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSandboxModal(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Test Mode Banner */}
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold">Chargebee Test Mode Active</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  To open the live Chargebee checkout, add{" "}
                  <code className="bg-amber-950/60 px-1 py-0.5 rounded text-[10px] font-mono text-amber-300">CHARGEBEE_SITE</code>{" "}
                  &amp;{" "}
                  <code className="bg-amber-950/60 px-1 py-0.5 rounded text-[10px] font-mono text-amber-300">CHARGEBEE_API_KEY</code>{" "}
                  in your{" "}
                  <code className="bg-amber-950/60 px-1 py-0.5 rounded text-[10px] font-mono text-amber-300">.env.local</code>.
                </p>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSandboxMethod("upi")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                  sandboxMethod === "upi"
                    ? "border-[#0066B2] bg-[#0066B2]/20 text-white"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone className="h-5 w-5 mb-1 text-sky-400" />
                <span>UPI Apps</span>
              </button>
              <button
                type="button"
                onClick={() => setSandboxMethod("qr")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                  sandboxMethod === "qr"
                    ? "border-[#0066B2] bg-[#0066B2]/20 text-white"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <QrCode className="h-5 w-5 mb-1 text-emerald-400" />
                <span>QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setSandboxMethod("card")}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                  sandboxMethod === "card"
                    ? "border-[#0066B2] bg-[#0066B2]/20 text-white"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1 text-purple-400" />
                <span>Cards</span>
              </button>
            </div>

            {/* Method Content */}
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              {sandboxMethod === "upi" && (
                <div className="space-y-3">
                  <label className="text-xs text-zinc-300 font-medium block">
                    Select Test UPI App / ID:
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => setSimulatedUpiId("user@okaxis")}
                      className={`p-2 rounded-lg border text-[11px] font-bold ${
                        simulatedUpiId === "user@okaxis"
                          ? "border-[#0066B2] bg-[#0066B2]/30 text-white"
                          : "border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Google Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedUpiId("user@ybl")}
                      className={`p-2 rounded-lg border text-[11px] font-bold ${
                        simulatedUpiId === "user@ybl"
                          ? "border-[#0066B2] bg-[#0066B2]/30 text-white"
                          : "border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      PhonePe
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedUpiId("user@paytm")}
                      className={`p-2 rounded-lg border text-[11px] font-bold ${
                        simulatedUpiId === "user@paytm"
                          ? "border-[#0066B2] bg-[#0066B2]/30 text-white"
                          : "border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Paytm UPI
                    </button>
                  </div>
                  <input
                    type="text"
                    value={simulatedUpiId}
                    onChange={(e) => setSimulatedUpiId(e.target.value)}
                    className="w-full mt-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-xs text-white"
                    placeholder="e.g. yourname@upi"
                  />
                </div>
              )}

              {sandboxMethod === "qr" && (
                <div className="text-center py-2 space-y-2">
                  <div className="mx-auto h-32 w-32 rounded-xl bg-white p-2 flex items-center justify-center">
                    <QrCode className="h-28 w-28 text-zinc-900" />
                  </div>
                  <p className="text-[11px] text-zinc-400">Scan using any UPI App (GPay / PhonePe / Paytm)</p>
                </div>
              )}

              {sandboxMethod === "card" && (
                <div className="space-y-2 text-xs">
                  <p className="text-zinc-300 font-medium">Test Card Number</p>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/20 font-mono text-zinc-200">
                    4111 1111 1111 1111 (Visa Sandbox)
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 rounded-lg bg-black/40 border border-white/20 font-mono text-zinc-200">
                      12 / 28
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-black/40 border border-white/20 font-mono text-zinc-200">
                      CVV: 123
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Payment Button */}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSandboxModal(false)}
                className="w-1/3 py-2.5 px-3 rounded-xl border border-white/20 text-xs font-semibold text-zinc-300 hover:bg-white/10 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleCompleteSandboxPayment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-xs font-bold text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying & Upgrading...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simulate Successful Payment (₹1,999)</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Main Upgrade Modal */
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#141418] shadow-2xl z-10 my-8"
          >
            {/* Success State Overlay */}
            {paymentSuccess ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                  🎉 Welcome to Pro!
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-md">
                  Your account has been upgraded successfully. Custom domains and premium features are now unlocked!
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Refreshing your dashboard...
                </div>
              </div>
            ) : (
              <>
                {/* Top Decorative Banner */}
                <div className="relative bg-gradient-to-r from-[#0066B2] via-[#0284C7] to-[#005291] p-6 sm:p-8 text-white">
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      Unlock Premium Power
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Upgrade to Unlock {featureHighlight}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-white/80 max-w-xl">
                    Connect your own custom domain, eliminate platform watermarks, and scale your lead magnets with enterprise-grade reliability.
                  </p>
                </div>

                {/* Error Notification */}
                {errorMsg && (
                  <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Pricing Grid */}
                <div className="p-5 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Free Tier (Current Status) */}
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-[#18181C] p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-bold text-zinc-900 dark:text-white">Free Tier</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">For testing & initial experiments</p>
                          </div>
                          {currentPlan.toLowerCase() === "free" && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              Current Plan
                            </span>
                          )}
                        </div>

                        <div className="mt-4 mb-5">
                          <span className="text-2xl font-black text-zinc-900 dark:text-white">₹0</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400"> / forever</span>
                        </div>

                        <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>Up to 500 Leads / month</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>500 MB Asset Storage</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span>Standard URL (<span className="font-mono text-[11px]">magnets.bdatech.in/...</span>)</span>
                          </li>
                          <li className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 line-through">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            <span>Custom Branded Domain (get.yourdomain.com)</span>
                          </li>
                          <li className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 line-through">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            <span>Automated SSL & CNAME Routing</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-400 dark:text-zinc-500 cursor-not-allowed text-center bg-zinc-100 dark:bg-zinc-900"
                        >
                          Included in Free Tier
                        </button>
                      </div>
                    </div>

                    {/* Pro Plan (Recommended) */}
                    <div className="relative rounded-2xl border-2 border-[#0066B2] dark:border-[#38BDF8] bg-gradient-to-b from-[#0066B2]/[0.04] to-transparent dark:from-[#0066B2]/15 dark:to-transparent p-5 flex flex-col justify-between shadow-lg shadow-[#0066B2]/10">
                      <div className="absolute -top-3 right-5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0066B2] dark:bg-[#0284C7] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                          <Zap className="h-3 w-3 fill-current" /> Most Popular
                        </span>
                      </div>

                      <div>
                        <div>
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Pro Plan
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/50 text-[#0066B2] dark:text-[#38BDF8]">
                              RECOMMENDED
                            </span>
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">For creators, founders & growth teams</p>
                        </div>

                        {/* Currency / Gateway Switcher */}
                        <div className="mt-3.5 mb-2 flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
                          <button
                            type="button"
                            onClick={() => setSelectedGateway("chargebee")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                              selectedGateway === "chargebee"
                                ? "bg-white dark:bg-zinc-900 text-[#0066B2] dark:text-[#38BDF8] shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                            }`}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>UPI / INR (₹)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedGateway("stripe")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                              selectedGateway === "stripe"
                                ? "bg-white dark:bg-zinc-900 text-[#0066B2] dark:text-[#38BDF8] shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                            }`}
                          >
                            <Globe2 className="h-3.5 w-3.5" />
                            <span>Global / USD ($)</span>
                          </button>
                        </div>

                        {/* Pricing Display */}
                        <div className="mt-2 mb-4">
                          {selectedGateway === "chargebee" ? (
                            <>
                              <span className="text-3xl font-black text-zinc-900 dark:text-white">₹1,999</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400"> / month</span>
                              <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                                ⚡ UPI (GPay/PhonePe), RuPay, Indian Cards via Chargebee
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-3xl font-black text-zinc-900 dark:text-white">$29</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400"> / month</span>
                              <span className="block text-[11px] font-medium text-sky-600 dark:text-sky-400 mt-0.5">
                                🌐 Visa, MasterCard, Amex, Apple Pay via Stripe
                              </span>
                            </>
                          )}
                        </div>

                        <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-200 font-medium">
                          <li className="flex items-center gap-2">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                            <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">
                              Custom Domain & Subdomain (get.yourbrand.com)
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                            <span>Automatic SSL & Edge CNAME Traffic Routing</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                            <span>Up to 2,500 Leads / month (5x capacity)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                            <span>1,024 MB High-Speed PDF Asset Storage</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                            <span>Remove all platform branding & watermarks</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-[#0066B2]/20">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={handleCheckout}
                          className="w-full py-3 px-4 rounded-xl bg-[#0066B2] hover:bg-[#005291] active:scale-[0.98] text-xs font-bold text-white shadow-md shadow-[#0066B2]/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Processing Checkout...</span>
                            </>
                          ) : selectedGateway === "chargebee" ? (
                            <>
                              <span>Pay with UPI / Indian Cards (₹1,999)</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <span>Pay with International Card ($29)</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Guarantee footer */}
                  <div className="rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#18181C]/50 p-3.5 text-center flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      14-day money-back guarantee
                    </span>
                    <span>•</span>
                    <span>Cancel or downgrade anytime</span>
                    <span>•</span>
                    <span>Instant domain activation</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}

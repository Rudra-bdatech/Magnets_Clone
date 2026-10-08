"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Globe, Lock, ShieldCheck, Zap, ArrowRight } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureHighlight?: string;
  currentPlan?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  featureHighlight = "Custom Domains & White-Labeling",
  currentPlan = "Free",
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#141418] shadow-2xl z-10 my-8"
        >
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

                  <div className="mt-4 mb-5">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white">₹1,999</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"> / month</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-zinc-700 dark:text-zinc-200 font-medium">
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

                <div className="mt-6 pt-4 border-t border-[#0066B2]/20">
                  <button
                    type="button"
                    onClick={() => {
                      alert("Payment Gateway (Razorpay / Stripe) integration ready! You can link your checkout URL here.");
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#0066B2] hover:bg-[#005291] active:scale-[0.98] text-xs font-bold text-white shadow-md shadow-[#0066B2]/30 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Upgrade to Pro (₹1,999/mo)</span>
                    <ArrowRight className="h-4 w-4" />
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

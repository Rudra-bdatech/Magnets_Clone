"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, BarChart2, ArrowRight, ListChecks } from "lucide-react";

interface AnalyticsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsHelpModal({ isOpen, onClose }: AnalyticsHelpModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
    };
  }, [isOpen]);

  if (!mounted) return null;

  const modalJSX = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 sm:bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Dialog Container */}
          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#111318] text-zinc-900 dark:text-white border-t sm:border border-zinc-200 dark:border-zinc-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[88vh] z-10 font-sans"
          >
            {/* Mobile Drag Indicator */}
            <div className="flex sm:hidden justify-center pt-2.5 pb-1 bg-zinc-50 dark:bg-[#15171D]">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#15171D] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066B2] text-white shadow-xs">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">Help centre</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-header navigation row */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-[#0D0E12] text-xs font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>All help topics</span>
              </button>
              <span className="uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">LEARN</span>
            </div>

            {/* Content Body - Explicit max-height & scroll trapping */}
            <div
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              style={{ maxHeight: "calc(88vh - 118px)", overflowY: "auto" }}
              className="p-6 sm:p-8 space-y-6 flex-1 min-h-0 overscroll-contain custom-scrollbar"
            >
              {/* Category Eyebrow & Hero Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#003865]/70 border border-[#0066B2]/30 dark:border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    MEASURE RESULTS
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight pt-1">
                  How do analytics and A/B tests work?
                </h2>
              </div>

              {/* Analytics vs A/B Testing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Card 1: Analytics */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-zinc-50/70 dark:bg-[#16181F] p-5 space-y-2.5 shadow-xs">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">Analytics</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Open a lead magnet and choose Analytics to see total signups, unique people, tracked visits and conversions, conversion rate, engagement, and results from the after-signup experience. Total signups include repeat requests. Conversion rate uses only signups matched to a tracked visit.
                  </p>
                </div>

                {/* Card 2: A/B testing */}
                <div className="rounded-2xl border border-[#0066B2]/30 bg-zinc-50/70 dark:bg-[#16181F] p-5 space-y-2.5 shadow-xs">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">A/B testing</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Test a different title or image against the current page. LeadMagnets splits new visitors between the versions and keeps each visitor on the same version.
                  </p>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-4 pt-2">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-[#102a45] border border-[#0066B2]/30 dark:border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8] font-black text-xs mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">Create a second version</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                      Open the landing-page editor and find Test title and image.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-[#102a45] border border-[#0066B2]/30 dark:border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8] font-black text-xs mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">Start the comparison</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                      Change the title, image, or both, then start the test.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-[#102a45] border border-[#0066B2]/30 dark:border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8] font-black text-xs mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">Watch the results</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                      Review each version&apos;s visits and conversion rate in Analytics.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-[#102a45] border border-[#0066B2]/30 dark:border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8] font-black text-xs mt-0.5">
                    4
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">Use the winner</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                      After 7 days, once every version has at least 25 visitors, LeadMagnets selects by conversion rate and applies the winner automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-3 pb-2">
                <Link
                  href="/dashboard/leadmagnets"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 py-2.5 text-xs font-bold text-white transition shadow-md cursor-pointer active:scale-98"
                >
                  <span>Open Lead magnets</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalJSX, document.body);
}

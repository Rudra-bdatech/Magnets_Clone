"use client";

import React, { memo } from "react";
import { Palette, X, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BrandHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrandHelpModal = memo(function BrandHelpModal({ isOpen, onClose }: BrandHelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overscroll-contain"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          {/* Modal Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.9 }}
            className="relative w-full max-w-3xl rounded-2xl bg-[#171717] text-white border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 overscroll-contain"
            data-lenis-prevent
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#151515]">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#0066B2] text-white font-bold shadow-xs">
                  <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Help centre</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer touch-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-header navigation */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/[0.06] bg-[#121212] text-xs font-semibold text-zinc-400">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 sm:gap-2 hover:text-white transition cursor-pointer touch-manipulation text-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>All help topics</span>
              </button>
              <span className="uppercase tracking-wider text-[10px] text-zinc-500 font-bold">LEARN</span>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-8 space-y-5 sm:space-y-7 overflow-y-auto">
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8]">
                    <Palette className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PAGE APPEARANCE</span>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">How do I update my brand colours?</h2>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pl-0 sm:pl-13">
                  Brand settings apply to every public lead magnet and to the editor preview.
                </p>
              </div>

              {/* Numbered Steps */}
              <div className="space-y-4 sm:space-y-5 pl-0 sm:pl-2">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Open your brand settings</h4>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Open Brand from the dashboard sidebar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Set the identity and colour</h4>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Add your business name, upload a logo, and choose the primary colour used across your pages.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Choose the page style</h4>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Choose light or dark page appearance and adjust the highlight intensity.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#38BDF8] text-xs font-bold mt-0.5">
                    4
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Preview and save</h4>
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Check the preview, then choose Save brand.</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0066B2] px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#005799] transition shadow-lg cursor-pointer touch-manipulation active:scale-[0.98]"
                >
                  <span>Open Brand settings</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default BrandHelpModal;

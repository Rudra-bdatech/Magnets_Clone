"use client";

import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2, Globe, ShieldAlert, ArrowRight } from "lucide-react";

interface DisconnectDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  domainName: string;
  fullHost?: string;
  isVerified?: boolean;
}

export const DisconnectDomainModal = memo(function DisconnectDomainModal({
  isOpen,
  onClose,
  onConfirm,
  domainName,
  fullHost,
  isVerified = false,
}: DisconnectDomainModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset confirmation input when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  // Lock background scroll & pause Lenis when Modal is open
  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (lenis && typeof lenis.stop === "function") lenis.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    };
  }, [isOpen]);

  const cleanTarget = (domainName || "").trim().toLowerCase();
  const requiresTypingMatch = isVerified && cleanTarget.length > 0;
  const isMatch = !requiresTypingMatch || confirmationInput.trim().toLowerCase() === cleanTarget;

  const handleConfirmAction = async () => {
    if (!isMatch || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const displayHost = fullHost || domainName;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overscroll-contain"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !isDeleting && onClose()}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-rose-500/30 dark:border-white/10 bg-white dark:bg-[#171717] text-zinc-900 dark:text-white shadow-2xl overflow-hidden z-10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Red Accent Banner */}
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />

            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    Disconnect Custom Domain
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Remove custom branding and DNS routing
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Target Domain Badge */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121212] px-3.5 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {displayHost}
                  </span>
                </div>
                {isVerified && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>

              {/* Warning List */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] dark:bg-rose-950/20 p-3.5 sm:p-4 space-y-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                <div className="flex items-start gap-2.5">
                  <span className="text-rose-500 shrink-0 mt-0.5 font-bold">⚠️</span>
                  <p>
                    <strong className="text-zinc-900 dark:text-white">Traffic will stop immediately:</strong> Visitors navigating to{" "}
                    <code className="rounded bg-rose-500/10 px-1 py-0.5 font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                      {displayHost}
                    </code>{" "}
                    will no longer be able to access your lead magnets.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-rose-500 shrink-0 mt-0.5 font-bold">⚠️</span>
                  <p>
                    <strong className="text-zinc-900 dark:text-white">DNS records unlinked:</strong> Your TXT and CNAME verification will be cleared. You will need to re-verify if you connect it again.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">✓</span>
                  <p>
                    <strong className="text-zinc-900 dark:text-white">Workspace URL safe:</strong> Your default workspace link will remain unaffected and accessible.
                  </p>
                </div>
              </div>

              {/* Vercel-style Type to confirm */}
              {requiresTypingMatch && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    To confirm disconnection, please type <span className="font-mono font-bold text-rose-600 dark:text-rose-400 select-all">{cleanTarget}</span> below:
                  </label>
                  <input
                    type="text"
                    disabled={isDeleting}
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder={cleanTarget}
                    autoFocus
                    className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121212] px-3.5 py-2.5 text-xs sm:text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition shadow-2xs"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-6 pt-2 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#151515] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isMatch || isDeleting}
                onClick={handleConfirmAction}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-bold transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Disconnect Custom Domain</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

"use client";

import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface DeleteModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteModal({ onConfirm, onClose }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="relative z-10 w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-5 sm:p-6 text-zinc-900 dark:text-white shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80 mx-auto -mt-1 mb-2.5 cursor-grab active:scale-95 transition-transform sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Delete this magnet?</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">This action cannot be undone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-1.5 pt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p>
            This removes the page and stops it serving. Any signups already collected stay on your list.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 sm:pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-none rounded-xl border border-rose-500/30 bg-rose-500/15 dark:bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all cursor-pointer shadow-sm text-center"
          >
            Delete magnet
          </button>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import React, { useState, useCallback } from "react";
import { Check, AlertCircle, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function IntegrationToastContainer({
  toasts,
  onRemoveToast,
}: {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 pointer-events-none sm:max-w-sm w-auto sm:w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl p-4 text-xs font-medium shadow-2xl backdrop-blur-md border transition-all ${
              toast.type === "success"
                ? "bg-[#062817]/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30"
                : toast.type === "error"
                ? "bg-[#330c0c]/95 border-rose-500/40 text-rose-100 shadow-rose-950/30"
                : "bg-[#18181C]/95 border-zinc-700/50 text-zinc-100 shadow-black/40"
            }`}
          >
            {toast.type === "success" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}

            <span className="flex-1 leading-snug break-words">{toast.message}</span>

            <button
              type="button"
              onClick={() => onRemoveToast(toast.id)}
              className="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

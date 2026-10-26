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
  const [isHovered, setIsHovered] = useState(false);
  const reversedToasts = [...toasts].reverse();

  if (toasts.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 pointer-events-none sm:w-[380px] w-auto h-16"
    >
      <div className="relative w-full h-full flex flex-col items-end justify-end">
        <AnimatePresence mode="popLayout">
          {reversedToasts.map((toast, index) => {
            if (index > 2 && !isHovered) return null;

            const offset = isHovered ? -(index * 64) : -(index * 12);
            const scale = isHovered ? 1 : 1 - index * 0.05;
            const opacity = isHovered ? 1 : index > 2 ? 0 : 1 - index * 0.18;
            const zIndex = 50 - index;

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{
                  opacity,
                  y: offset,
                  scale,
                  zIndex,
                }}
                exit={{ opacity: 0, scale: 0.85, y: 15, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 28,
                  mass: 0.8,
                }}
                className={`absolute bottom-0 right-0 w-full pointer-events-auto flex items-center gap-3 rounded-2xl p-3.5 sm:p-4 text-xs font-medium shadow-xl backdrop-blur-xl border transition-colors ${
                  toast.type === "success"
                    ? "bg-white/95 dark:bg-emerald-950/80 border-emerald-500/25 dark:border-emerald-500/35 text-zinc-900 dark:text-emerald-100 shadow-zinc-950/5 dark:shadow-emerald-950/30"
                    : toast.type === "error"
                    ? "bg-white/95 dark:bg-rose-950/80 border-rose-500/25 dark:border-rose-500/35 text-zinc-900 dark:text-rose-100 shadow-zinc-950/5 dark:shadow-rose-950/30"
                    : "bg-white/95 dark:bg-zinc-900/80 border-zinc-200/80 dark:border-white/20 text-zinc-900 dark:text-zinc-100 shadow-zinc-950/5 dark:shadow-black/40"
                }`}
                style={{
                  transformOrigin: "bottom center",
                }}
              >
                {toast.type === "success" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40 backdrop-blur-sm shadow-2xs">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
                {toast.type === "error" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/25 dark:text-rose-300 border border-rose-500/30 dark:border-rose-500/40 backdrop-blur-sm shadow-2xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                )}
                {toast.type === "info" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40 backdrop-blur-sm shadow-2xs">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}

                <span className="flex-1 leading-snug break-words text-zinc-900 dark:text-white/95">{toast.message}</span>

                {!isHovered && index === 0 && toasts.length > 1 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/15 text-zinc-600 dark:text-white/80 shrink-0">
                    +{toasts.length - 1}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveToast(toast.id);
                  }}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 cursor-pointer shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

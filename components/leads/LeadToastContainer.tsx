"use client";

import React, { memo } from "react";
import { Check, AlertCircle, Sparkles, X } from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface LeadToastContainerProps {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

export const LeadToastContainer = memo(function LeadToastContainer({
  toasts,
  onRemoveToast,
}: LeadToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:bottom-5 sm:right-5 z-50 flex flex-col gap-2 pointer-events-none sm:max-w-sm w-auto sm:w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl p-3.5 sm:p-4 text-xs font-medium shadow-xl backdrop-blur-xl border transition-all animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/35 text-emerald-100 shadow-emerald-950/20"
              : toast.type === "error"
              ? "bg-rose-950/40 border-rose-500/35 text-rose-100 shadow-rose-950/20"
              : "bg-zinc-900/40 border-white/15 text-zinc-100 shadow-black/30"
          }`}
        >
          {toast.type === "success" && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm">
              <Check className="h-3.5 w-3.5" />
            </div>
          )}
          {toast.type === "error" && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 backdrop-blur-sm">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          )}
          {toast.type === "info" && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => onRemoveToast(toast.id)}
            className="text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
});

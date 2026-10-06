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
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl p-4 text-xs font-medium shadow-xl backdrop-blur-md border transition-all animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100"
              : toast.type === "error"
              ? "bg-red-950/90 border-red-500/30 text-red-100"
              : "bg-zinc-900/90 border-zinc-700/40 text-zinc-100"
          }`}
        >
          {toast.type === "success" && (
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          {toast.type === "info" && (
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
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

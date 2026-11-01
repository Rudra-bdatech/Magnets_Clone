"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function LeadMagnetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Funnel Route Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-[#0B0B0D] p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
        Resource Temporarily Unavailable
      </h1>

      <p className="mt-2 max-w-md text-xs text-zinc-600 dark:text-zinc-400">
        We encountered a temporary issue loading this funnel. Please try refreshing or check back in a moment.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition cursor-pointer shadow-sm active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Page</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1A1A1E] px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Go Home</span>
        </Link>
      </div>
    </div>
  );
}

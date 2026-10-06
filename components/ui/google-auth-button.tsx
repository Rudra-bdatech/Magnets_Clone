"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface GoogleAuthButtonProps {
  callbackUrl: string;
  text?: string;
  disabled?: boolean;
  isLastUsed?: boolean;
}

export default function GoogleAuthButton({
  callbackUrl,
  text = "Continue with Google",
  disabled = false,
  isLastUsed = false,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("leadmagnets_last_auth_method", "google");
          document.cookie = "leadmagnets_last_auth_method=google; path=/; max-age=2592000; SameSite=Lax";
        } catch (_) {}
      }
      setLoading(true);
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      className={`relative w-full h-10 px-4 flex items-center justify-center gap-2.5 rounded-xl border bg-white dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-800/90 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-all duration-150 shadow-sm hover:shadow active:scale-[0.98] active:bg-zinc-100 dark:active:bg-zinc-800/80 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        isLastUsed
          ? "border-blue-500/60 dark:border-blue-500/50 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10 hover:border-blue-500/80"
          : "border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700/80"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
      ) : (
        <svg
          width={18}
          height={18}
          className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{text}</span>
      {isLastUsed && (
        <span className="absolute right-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 tracking-tight shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Last used
        </span>
      )}
    </button>
  );
}

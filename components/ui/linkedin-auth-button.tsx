"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface LinkedInAuthButtonProps {
  callbackUrl?: string;
  text?: string;
  disabled?: boolean;
}

export default function LinkedInAuthButton({
  callbackUrl = "/dashboard",
  text = "Continue with LinkedIn",
  disabled = false,
}: LinkedInAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLinkedInSignIn = async () => {
    try {
      setLoading(true);
      await signIn("linkedin", { callbackUrl });
    } catch (err) {
      console.error("LinkedIn sign-in error:", err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLinkedInSignIn}
      disabled={disabled || loading}
      className="relative w-full h-10 px-4 flex items-center justify-center gap-2.5 rounded-xl border border-[#0A66C2]/30 bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/50 text-xs font-semibold text-[#0A66C2] dark:text-[#38BDF8] dark:border-[#0A66C2]/30 dark:bg-[#0A66C2]/10 dark:hover:bg-[#0A66C2]/20 transition-all duration-150 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2]/50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )}
      <span>{text}</span>
    </button>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";

type Status = "verifying" | "verified" | "verified_signed_out" | "error";

function ConfirmPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState("");
  // The token is single-use, so never send it twice (React dev mode runs effects twice)
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    if (!token) {
      setError("This verification link is incomplete. Open the link from your email again.");
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verifyEmailToken", data: { token } }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          setStatus(data.signedIn ? "verified" : "verified_signed_out");
          if (data.signedIn) {
            setTimeout(() => window.location.replace("/register/onboarding"), 1200);
          }
        } else {
          setError(data?.error || "This verification link is invalid or has expired.");
          setStatus("error");
        }
      } catch {
        setError("Could not verify your email. Please check your connection and try again.");
        setStatus("error");
      }
    })();
  }, [token]);

  if (status === "verifying") {
    return (
      <AuthShell title="Verifying your email" subtitle="This only takes a moment.">
        <div className="flex h-14 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell
        title="Link not valid"
        subtitle="Verification links work once and expire after 24 hours."
      >
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-semibold text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
        <Button type="button" onClick={() => window.location.assign("/login")} className="w-full">
          Sign in to get a new link
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Email verified"
      subtitle={
        status === "verified"
          ? "Your account is active. Taking you to setup..."
          : "Your account is active. Sign in to continue."
      }
    >
      <div className="w-full flex h-14 items-center justify-center rounded-lg bg-emerald-500/5 border border-emerald-500/15">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <Button
        type="button"
        onClick={() => window.location.assign(status === "verified" ? "/register/onboarding" : "/login")}
        className="w-full"
      >
        {status === "verified" ? "Continue" : "Sign in"}
      </Button>
    </AuthShell>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading verification details...</div>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
}

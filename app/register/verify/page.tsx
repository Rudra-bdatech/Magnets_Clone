"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import { signOut } from "next-auth/react";
import { Loader2, MailCheck } from "lucide-react";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import { sanitizeRedirect } from "@/lib/redirect";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const safeNext = sanitizeRedirect(searchParams.get("next"), "/dashboard");
  // Never send a verified user back to this page, or it would reload forever
  const next = safeNext.startsWith("/register/verify") ? "/dashboard" : safeNext;

  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /**
   * Asks the server whether the email is verified. /api/auth/me reissues the session
   * cookie when it is, so the dashboard opens even if the link was clicked on another device.
   */
  const checkStatus = useCallback(async (manual = false) => {
    if (manual) {
      setChecking(true);
      setError("");
      setMessage("");
    }
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.authenticated) {
        window.location.replace("/login");
        return;
      }
      setEmail(data.email || "");
      if (data.emailVerified) {
        window.location.replace(next);
        return;
      }
      if (manual) setError("Your email is not verified yet. Click the link in the email we sent you.");
    } catch {
      if (manual) setError("Could not check your status. Please try again.");
    } finally {
      setChecking(false);
    }
  }, [next]);

  useEffect(() => {
    checkStatus();
    // Coming back to this tab after clicking the link elsewhere
    const onFocus = () => checkStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkStatus]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    setResending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendVerificationEmail", data: {} }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.alreadyVerified) {
        window.location.replace(next);
        return;
      }
      if (res.ok && data?.success) {
        setMessage("A new verification link is on its way. Check your inbox and spam folder.");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(data?.error || "Could not send the email. Please try again.");
      }
    } catch {
      setError("Could not send the email. Please check your connection.");
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    } catch (_) { }
    try {
      await signOut({ redirect: false });
    } catch (_) { }
    window.location.replace("/register");
  };

  return (
    <AuthShell
      showSidecar={false}
      title="Check your inbox"
      subtitle={
        email ? (
          <>We sent a verification link to <strong className="text-zinc-900 dark:text-zinc-100">{email}</strong>. Click it to activate your account.</>
        ) : (
          "We sent you a verification link. Click it to activate your account."
        )
      }
      footer={
        <div className="text-xs">
          Wrong email?{" "}
          <button
            type="button"
            onClick={handleSignOut}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-4"
          >
            Sign out and start over
          </button>
        </div>
      }
    >
      <div className="w-full flex h-14 items-center justify-center rounded-lg bg-blue-500/5 border border-blue-500/15">
        <MailCheck className="h-6 w-6 text-blue-500" />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-semibold text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 text-center">
          {message}
        </div>
      )}

      <Button type="button" onClick={() => checkStatus(true)} disabled={checking} className="w-full">
        {checking ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking...
          </span>
        ) : (
          "I've verified my email"
        )}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || cooldown > 0}
        className="w-full text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {resending ? "Sending..." : cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend verification email"}
      </button>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="text-sm text-ink-500">Loading…</div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}

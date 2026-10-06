"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";

import { safeSetItem, setSessionExpiry } from "@/lib/store";

import GoogleAuthButton from "@/components/ui/google-auth-button";

function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFrom = searchParams.get("from") || searchParams.get("callbackUrl") || "/dashboard";
  const redirectTarget = rawFrom.startsWith("/") && !rawFrom.startsWith("//") ? rawFrom : "/dashboard";

  const authError = searchParams.get("error");
  const getInitialError = () => {
    if (!authError) return "";
    if (authError === "OAuthCallback" || authError === "OAuthSignin") {
      return "Sign-in was interrupted. Please try again.";
    }
    if (authError === "AccessDenied") {
      return "Access was cancelled or denied. Please try again.";
    }
    return "Authentication failed. Please try again.";
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastUsedMethod, setLastUsedMethod] = useState<"google" | "email" | null>(null);
  const [status, setStatus] = useState<"idle" | "authenticating" | "opening_dashboard">("idle");
  const [error, setError] = useState(getInitialError);

  const loading = status !== "idle";

  useEffect(() => {
    try {
      const cookieMethod = getClientCookie("leadmagnets_last_auth_method") as "google" | "email" | null;
      const cookieEmail = getClientCookie("leadmagnets_last_auth_email");
      const localMethod = localStorage.getItem("leadmagnets_last_auth_method") as "google" | "email" | null;
      const localEmail = localStorage.getItem("leadmagnets_last_auth_email") || localStorage.getItem("currentUserEmail");

      const resolvedMethod = localMethod || cookieMethod;
      const resolvedEmail = localEmail || cookieEmail;

      if (resolvedMethod === "google" || resolvedMethod === "email") {
        setLastUsedMethod(resolvedMethod);
      } else if (resolvedEmail) {
        setLastUsedMethod("email");
      }

      if (resolvedEmail) {
        setEmail(resolvedEmail);
      }
    } catch (_) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("authenticating");
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", data: { email: cleanEmail, password } }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.success) {
        if (typeof window !== "undefined") {
          safeSetItem("currentUserEmail", cleanEmail);
          safeSetItem("leadmagnets_last_auth_method", "email");
          safeSetItem("leadmagnets_last_auth_email", cleanEmail);
          document.cookie = `leadmagnets_last_auth_method=email; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = `leadmagnets_last_auth_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
          setSessionExpiry(7);
          if (data.account) {
            safeSetItem("currentUserAccount", JSON.stringify(data.account));
          }
        }
        setStatus("opening_dashboard");
        window.location.href = redirectTarget;

      } else {
        setError(data?.error || (res.ok ? "Failed to login. Please check database connection." : "Incorrect password or account not found."));
        setStatus("idle");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err?.message || "Failed to sign in. Please check your connection and try again.");
      setStatus("idle");
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Use your email and password to continue."
      showSidecar={false}
      onSubmit={handleSubmit}
      footer={
        <>
          New here?{" "}
          <Link className="font-semibold text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline" href="/register">
            Create an account
          </Link>
        </>
      }
    >
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}
      {/* Continue with Google Button */}
      <GoogleAuthButton
        callbackUrl={redirectTarget}
        disabled={loading}
        isLastUsed={lastUsedMethod === "google"}
      />

      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200/70 dark:border-zinc-800/80" />
        </div>
        <span className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-0.5 rounded-full border border-zinc-200/40 dark:border-zinc-800/60 text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
          or sign in with email
        </span>
      </div>

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Email</span>
          {lastUsedMethod === "email" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 tracking-tight animate-in fade-in duration-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Last used
            </span>
          )}
        </div>
        <Input
          autoComplete="email"
          autoFocus={!email}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className={lastUsedMethod === "email" ? "border-blue-500/40 dark:border-blue-500/30 ring-1 ring-blue-500/15" : ""}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Password
          <a className="font-semibold text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline" href="/forgot-password">
            Forgot password?
          </a>
        </span>
        <Input
          autoComplete="current-password"
          autoFocus={Boolean(email)}
          type="password"
          placeholder="At least 8 characters"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      <Button
        type="submit"
        className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        disabled={loading}
      >
        {status === "authenticating" && (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-white/90" />
            <span>Signing in...</span>
          </span>
        )}
        {status === "opening_dashboard" && (
          <span className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
            <span>Opening dashboard...</span>
            <Loader2 className="h-3.5 w-3.5 animate-spin opacity-80" />
          </span>
        )}
        {status === "idle" && (
          <span className="flex items-center gap-1.5">
            <span>Sign in</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </Button>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell showSidecar={false} title="Loading..." subtitle="Please wait while we load the sign-in page.">
          <div className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
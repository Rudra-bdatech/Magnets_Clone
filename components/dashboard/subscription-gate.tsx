"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Lock, Check, Settings, LogOut, X } from "lucide-react";
import UpgradeToProButton from "@/components/dashboard/upgrade-to-pro-button";
import {
  PRO_MONTHLY_DISPLAY_PRICE,
  TRIAL_DAYS,
  type AccountAccess,
} from "@/lib/subscription";

/**
 * Dashboard side of the 14-day trial → Pro monthly model (rules in lib/subscription.ts).
 * This is presentation only: every write route enforces the same rules on the server
 * (lib/subscription-server.ts requireFullAccess), so removing the blur in DevTools unlocks nothing.
 */

/** Pages that stay usable after the trial ends, so people can manage or delete their account. */
const UNGATED_PATHS = ["/dashboard/settings"];

export function isUngatedPath(pathname: string | null): boolean {
  return Boolean(pathname && UNGATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)));
}

/** Fetches the signed-in account's access state, refreshing on navigation, focus and account updates. */
export function useAccountAccess(pathname: string | null): AccountAccess | null {
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/billing/access", { cache: "no-store" });
      if (!res.ok) return; // 401s are handled by the shell's session check
      const data = await res.json();
      if (data?.access) setAccess(data.access);
    } catch {
      // Network hiccup: keep the last known state
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("accountUpdated", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("accountUpdated", onFocus);
    };
  }, [refresh]);

  return access;
}

/** Show the countdown banner only in the last few days; the rest of the time it lives in Plan & Billing. */
const BANNER_LAST_DAYS = 3;
const BANNER_DISMISS_KEY = "trial-banner-dismissed";

/**
 * Small reminder in the last BANNER_LAST_DAYS days of the trial. Closable for the rest of the day
 * (per browser). The full status always lives in Account Settings → Plan & Billing.
 */
export function TrialBanner({ access }: { access: AccountAccess | null }) {
  const today = new Date().toDateString();
  const [dismissed, setDismissed] = useState(true); // hidden until we know it wasn't closed today

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(BANNER_DISMISS_KEY) === today);
    } catch {
      setDismissed(false);
    }
  }, [today]);

  if (!access || access.state !== "trial" || !access.trialEndsAt) return null;
  const days = access.trialDaysLeft;
  if (days > BANNER_LAST_DAYS || dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, today);
    } catch {
      // Private mode: closes for this page view only
    }
  };

  return (
    <div
      className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200/70 bg-amber-50 px-10 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
      role="status"
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {days <= 1 ? "Your free trial ends today" : `Your free trial ends in ${days} days`}
      </span>
      <UpgradeToProButton
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1 font-semibold text-white transition hover:bg-amber-700"
        errorClassName="mt-1 text-[11px] text-red-700 dark:text-red-300"
      >
        Upgrade · {PRO_MONTHLY_DISPLAY_PRICE}/month
      </UpgradeToProButton>
      <Link href="/dashboard/settings?tab=billing" className="font-medium underline-offset-2 hover:underline">
        View plan
      </Link>
      <button
        type="button"
        onClick={close}
        aria-label="Close trial reminder"
        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md hover:bg-amber-100 dark:hover:bg-amber-500/20 cursor-pointer"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Wraps the dashboard page content. Once the trial has ended (and nothing is paid) the content is
 * blurred and made inert, and an upgrade card that cannot be dismissed sits on top. The sidebar
 * stays clickable, so every page can still be opened (it just shows blurred).
 */
export function SubscriptionGate({
  access,
  pathname,
  onSignOut,
  children,
}: {
  access: AccountAccess | null;
  pathname: string | null;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const locked = access?.state === "expired" && !isUngatedPath(pathname);

  // `inert` blocks focus, clicks and keyboard input for everything under the blur
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (locked) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [locked]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={contentRef}
        aria-hidden={locked || undefined}
        className={locked ? "pointer-events-none select-none blur-[6px] opacity-60 transition-[filter,opacity] duration-300" : undefined}
      >
        {children}
      </div>
      {locked && access && <PaywallCard access={access} onSignOut={onSignOut} />}
    </div>
  );
}

function PaywallCard({ access, onSignOut }: { access: AccountAccess; onSignOut: () => void }) {
  const title = access.trialReused ? "You've already used your free trial" : "Your free trial has ended";
  const body = access.trialReused
    ? "This email has already completed its free trial. Upgrade to Pro to keep building."
    : `Your ${TRIAL_DAYS}-day free trial is over. Your pages, leads and settings are safe. Upgrade to Pro to pick up where you left off.`;

  let pagesNote = "";
  if (access.lifetimeCustomDomain) {
    pagesNote = "Your custom domain pages stay live (lifetime custom domain).";
  } else if (access.publicPagesLive && access.publicPagesOfflineAt) {
    pagesNote = `Your public pages stay live until ${new Date(access.publicPagesOfflineAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`;
  } else if (!access.publicPagesLive) {
    pagesNote = "Your public pages are offline. Upgrading brings them back instantly.";
  }

  return (
    <div className="absolute inset-0 z-20 flex justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="sticky top-[12vh] h-fit w-full max-w-md mt-[12vh] rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="paywall-title" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{body}</p>

        <div className="mt-6 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-4 text-left">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Funnels Pro</span>
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {PRO_MONTHLY_DISPLAY_PRICE}
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">/month</span>
            </span>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            {[
              "Unlimited landing pages & locked PDFs",
              "Unlimited leads & email sequences",
              "AI page generator & lead alerts",
              "GST included · cancel anytime",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {pagesNote && <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">{pagesNote}</p>}

        <div className="mt-5 [&>span]:flex [&>span]:w-full">
          <UpgradeToProButton className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] py-3 text-sm font-semibold text-white transition shadow-md">
            Upgrade to Pro · {PRO_MONTHLY_DISPLAY_PRICE}/month
          </UpgradeToProButton>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition">
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            Account settings
          </Link>
          <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer">
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

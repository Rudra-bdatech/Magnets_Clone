"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Clock, CreditCard, Globe, Loader2, Lock, ShieldCheck } from "lucide-react";
import { PRO_MONTHLY_DISPLAY_PRICE, TRIAL_DAYS, type AccountAccess } from "@/lib/subscription";

/**
 * Account Settings → Plan & Billing. The one calm place that shows the trial, the Pro monthly
 * subscription and the custom domain (a separate one-time ₹4,999 product).
 */
interface BillingStatus {
  access: AccountAccess;
  plan: string;
  customDomainUnlocked: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The trial as a calendar: one cell per day, used days dimmed, today highlighted,
 * the last day flagged. An admin-extended trial simply shows more cells.
 */
function TrialCalendar({ trialEndsAt, daysLeft }: { trialEndsAt: string; daysLeft: number }) {
  // Work in calendar days, so the last cell is the date the trial ends (matches "ends 21 Nov")
  const midnight = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const endDay = midnight(new Date(trialEndsAt).getTime());
  const today = midnight(Date.now());
  const daysUntilEnd = Math.round((endDay - today) / DAY_MS);
  const totalDays = Math.max(TRIAL_DAYS, daysUntilEnd + 1);
  const startDay = endDay - (totalDays - 1) * DAY_MS;
  const todayIndex = Math.min(totalDays - 1, Math.max(0, Math.round((today - startDay) / DAY_MS)));
  const urgent = daysLeft <= 3;

  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(startDay + i * DAY_MS);
    return {
      i,
      weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
      day: date.getDate(),
      month: date.toLocaleDateString("en-IN", { month: "short" }),
      state: i < todayIndex ? "used" : i === todayIndex ? "today" : "left",
      isLast: i === totalDays - 1,
      isFirstOfMonth: i === 0 || date.getDate() === 1,
    };
  });
  const used = todayIndex;
  const leftAfterToday = totalDays - 1 - todayIndex;

  return (
    <div className="mt-5">
      <ol className="grid w-full max-w-[460px] grid-cols-7 gap-2" aria-label={`Free trial: ${used} days used, today, ${leftAfterToday} days left, ends ${days[totalDays - 1].day} ${days[totalDays - 1].month}`}>
        {days.map((d) => {
          const base = "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition-colors";
          const tone =
            d.state === "used"
              ? "border-transparent bg-zinc-100/70 text-zinc-400 dark:bg-white/[0.03] dark:text-zinc-600"
              : d.state === "today"
                ? urgent
                  ? "border-amber-500 bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300"
                  : "border-[#0066B2] bg-[#0066B2]/10 text-[#0066B2] ring-1 ring-[#0066B2]/25 dark:border-[#38BDF8] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8] dark:ring-[#38BDF8]/20"
                : d.isLast
                  ? urgent
                    ? "border-dashed border-amber-400 text-amber-700 dark:border-amber-500/60 dark:text-amber-300"
                    : "border-dashed border-zinc-300 text-zinc-900 dark:border-white/20 dark:text-white"
                  : "border-zinc-200 bg-white text-zinc-900 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-white";
          return (
            <li key={d.i} className={`${base} ${tone}`} aria-current={d.state === "today" ? "date" : undefined}>
              <span className="text-[9px] font-semibold uppercase leading-none tracking-wide opacity-70">
                {d.isFirstOfMonth ? d.month : d.weekday}
              </span>
              <span className="mt-1 text-base font-bold leading-none">
                {d.day}
              </span>
              {d.state === "today" && (
                <span className="absolute -bottom-1.5 rounded-full bg-current px-1.5 text-[8px] font-bold uppercase leading-[13px]">
                  <span className="text-white dark:text-zinc-900">Today</span>
                </span>
              )}
              {d.isLast && d.state !== "today" && (
                <span className="absolute -bottom-1.5 rounded-full bg-zinc-900 px-1.5 text-[8px] font-bold uppercase leading-[13px] text-white dark:bg-white dark:text-zinc-900">
                  Ends
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-zinc-200 dark:bg-white/10" aria-hidden="true" />{used} used</span>
        <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${urgent ? "bg-amber-500" : "bg-[#0066B2] dark:bg-[#38BDF8]"}`} aria-hidden="true" />Today</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-zinc-300 dark:border-white/20" aria-hidden="true" />{leftAfterToday} left</span>
      </div>
    </div>
  );
}

const card = "rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] p-5 sm:p-6";
const primaryBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 text-sm font-semibold text-white transition";
const secondaryBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 px-5 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition";

export default function PlanBillingPanel() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/billing/access", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => alive && data?.access && setStatus(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return <div className={card}><p className="text-sm text-zinc-500 dark:text-zinc-400">Couldn&apos;t load your plan. Please refresh the page.</p></div>;
  }
  if (!status) {
    return (
      <div className={`${card} flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400`}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your plan…
      </div>
    );
  }

  const { access, customDomainUnlocked } = status;

  return (
    <div className="space-y-4">
      {/* ── Plan ── */}
      <div className={card}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Current plan</p>

            {access.state === "staff" && (
              <>
                <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">Super Admin</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Full access to everything. No billing needed.</p>
              </>
            )}

            {access.state === "trial" && (
              <>
                <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">Free Trial</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {access.trialEndsAt
                    ? <>
                        <strong className="text-zinc-900 dark:text-white">{access.trialDaysLeft} {access.trialDaysLeft === 1 ? "day" : "days"} left</strong>
                        {" "}· ends {formatDate(access.trialEndsAt)}. Everything is unlocked until then.
                      </>
                    : `Your ${TRIAL_DAYS}-day trial has everything unlocked.`}
                </p>
                {access.trialEndsAt && <TrialCalendar trialEndsAt={access.trialEndsAt} daysLeft={access.trialDaysLeft} />}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href="/checkout" className={primaryBtn}>Upgrade to Pro · {PRO_MONTHLY_DISPLAY_PRICE}/month</Link>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">GST included · cancel anytime</span>
                </div>
              </>
            )}

            {access.state === "pro" && (
              <>
                <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                  Pro <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">· {PRO_MONTHLY_DISPLAY_PRICE}/month</span>
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {access.cancelsAtPeriodEnd && access.currentPeriodEnd
                    ? `Cancelled. You keep Pro until ${formatDate(access.currentPeriodEnd)}.`
                    : access.currentPeriodEnd
                      ? `Active. Renews on ${formatDate(access.currentPeriodEnd)}.`
                      : "Active."}
                </p>
                {access.cancelsAtPeriodEnd && (
                  <div className="mt-5">
                    <Link href="/checkout" className={secondaryBtn}>Subscribe again</Link>
                  </div>
                )}
              </>
            )}

            {access.state === "expired" && (
              <>
                <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                  {access.trialReused ? "Free trial already used" : access.subscriptionStatus ? "Pro has ended" : "Free trial ended"}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {access.accessEndedAt ? `Ended ${formatDate(access.accessEndedAt)}. ` : ""}
                  Your pages, leads and settings are safe. Upgrade to keep building.
                  {access.publicPagesLive && access.publicPagesOfflineAt
                    ? ` Your public pages stay live until ${formatDate(access.publicPagesOfflineAt)}.`
                    : !access.publicPagesLive
                      ? " Your public pages are offline until you upgrade."
                      : ""}
                </p>
                <div className="mt-5">
                  <Link href="/checkout" className={primaryBtn}>Upgrade to Pro · {PRO_MONTHLY_DISPLAY_PRICE}/month</Link>
                </div>
              </>
            )}
          </div>
        </div>

        {access.state !== "staff" && (
          <ul className="mt-6 grid gap-2 border-t border-zinc-100 dark:border-white/[0.06] pt-5 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
            {["Unlimited landing pages & locked PDFs", "Unlimited leads & email sequences", "AI page generator", "Lead alerts & integrations"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" /> {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Custom domain (separate one-time product) ── */}
      <div className={card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Custom domain</p>
              {customDomainUnlocked ? (
                <>
                  <h3 className="mt-1 flex items-center gap-1.5 text-lg font-bold text-zinc-900 dark:text-white">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Unlocked for life
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Connect or change your domain in Workspace Setup.</p>
                </>
              ) : (
                <>
                  <h3 className="mt-1 flex items-center gap-1.5 text-lg font-bold text-zinc-900 dark:text-white">
                    <Lock className="h-4 w-4 text-amber-500" aria-hidden="true" /> Not unlocked
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    One-time ₹4,999, yours for life. Separate from the Pro plan.
                  </p>
                </>
              )}
            </div>
          </div>
          <Link href="/dashboard/integration" className={customDomainUnlocked ? secondaryBtn : primaryBtn}>
            {customDomainUnlocked ? "Manage domain" : "Unlock custom domain"}
          </Link>
        </div>
      </div>

      {access.state === "trial" && access.trialEndsAt && (
        <p className="flex items-center gap-1.5 px-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          When the trial ends, the dashboard locks until you upgrade. Your data is never deleted straight away.
        </p>
      )}
    </div>
  );
}

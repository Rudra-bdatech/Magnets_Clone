"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Check, CircleCheck, Clock, Globe, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { PRO_MONTHLY_DISPLAY_PRICE, TRIAL_DAYS, type AccountAccess } from "@/lib/subscription";
import UpgradeToProButton from "@/components/dashboard/upgrade-to-pro-button";

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
function TrialCalendar({ trialEndsAt, daysLeft, compact = false }: { trialEndsAt: string; daysLeft: number; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
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
    <div className={compact ? "shrink-0" : "mt-5"}>
      <ol className={`grid grid-cols-7 gap-1.5 ${compact ? "w-full sm:w-[308px]" : "w-full max-w-[460px]"}`} aria-label={`Free trial: ${used} days used, today, ${leftAfterToday} days left, ends ${days[totalDays - 1].day} ${days[totalDays - 1].month}`}>
        {days.map((d) => {
          const base = `relative flex flex-col items-center border text-center transition-colors ${
            compact ? "h-14 justify-start rounded-lg pt-1.5" : "aspect-square justify-center rounded-xl"
          }`;
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
            <motion.li
              key={d.i}
              custom={d.i}
              variants={dayVariants}
              initial={reduceMotion ? false : "hidden"}
              animate="show"
              className={`${base} ${tone}`}
              aria-current={d.state === "today" ? "date" : undefined}
            >
              <span className="text-[9px] font-semibold uppercase leading-none tracking-wide opacity-70">
                {d.isFirstOfMonth ? d.month : d.weekday}
              </span>
              <span className="mt-1 text-sm font-bold leading-none">
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
            </motion.li>
          );
        })}
      </ol>
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 ${compact ? "mt-3" : "mt-4"}`}>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-zinc-200 dark:bg-white/10" aria-hidden="true" />{used} used</span>
        <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${urgent ? "bg-amber-500" : "bg-[#0066B2] dark:bg-[#38BDF8]"}`} aria-hidden="true" />Today</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-zinc-300 dark:border-white/20" aria-hidden="true" />{leftAfterToday} left</span>
      </div>
    </div>
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;
/** Cards rise in one after another; their contents follow. */
const rowVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE, staggerChildren: 0.05, delayChildren: 0.18 } },
};
const featureVariants: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};
const dayVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: 0.25 + i * 0.03, duration: 0.3, ease: EASE } }),
};

const CHIP_TONES = {
  blue: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]",
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
} as const;

// Same benefit lines as the landing page pricing cards (components/landing/pricing.tsx)
const PRO_BENEFITS = [
  "Unlimited landing pages & locked PDFs",
  "Unlimited leads & email sequences",
  "Lead capture & email delivery",
  "AI page generator",
  "Lead alerts & integrations",
];
const CUSTOM_DOMAIN_BENEFITS = [
  "Connect your own domain (e.g. get.yourbrand.com)",
  "All landing pages served under your domain",
  "All locked PDF web pages served under your domain",
  "Automatic SSL certificate & DNS routing",
  "100% white-label (no Funnels branding)",
];

function Feature({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <motion.li variants={featureVariants} className="flex gap-2.5 text-sm">
      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-[#38BDF8]" : "text-[#0066B2] dark:text-[#38BDF8]"}`} aria-hidden="true" />
      <span>{children}</span>
    </motion.li>
  );
}

const statusCard = "rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] p-5 sm:p-6";
const lightCta =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] text-sm font-semibold text-white transition";
const doneCta =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-semibold text-zinc-500 dark:text-zinc-400";
const outlineCta =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-white/15 text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition";

export default function PlanBillingPanel() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const reduceMotion = useReducedMotion();

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
    return <div className={statusCard}><p className="text-sm text-zinc-500 dark:text-zinc-400">Couldn&apos;t load your plan. Please refresh the page.</p></div>;
  }
  if (!status) {
    return (
      <div className="grid gap-4 lg:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[30rem] animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  const { access, customDomainUnlocked } = status;
  const isStaff = access.state === "staff";
  const isPaidPro = access.state === "pro" && !access.cancelsAtPeriodEnd;
  const planChip: { chip: string; tone: keyof typeof CHIP_TONES } = isStaff
    ? { chip: "Admin", tone: "purple" }
    : access.state === "trial"
      ? { chip: "Active", tone: "blue" }
      : access.state === "pro"
        ? access.cancelsAtPeriodEnd
          ? { chip: "Cancelled", tone: "amber" }
          : { chip: "Active", tone: "green" }
        : { chip: "Locked", tone: "red" };

  // "Your plan" card: icon, big headline and the line under it
  const strip = isStaff
    ? {
        icon: ShieldCheck,
        iconTone: CHIP_TONES.purple,
        headline: "Super Admin",
        subline: "Full access, never locked",
      }
    : access.state === "trial"
      ? {
          icon: Sparkles,
          iconTone: access.trialDaysLeft <= 3 ? CHIP_TONES.amber : CHIP_TONES.blue,
          headline: access.trialEndsAt ? `${access.trialDaysLeft} ${access.trialDaysLeft === 1 ? "day" : "days"} left` : "Free trial",
          subline: access.trialEndsAt ? `Free trial · ends ${formatDate(access.trialEndsAt)}` : `${TRIAL_DAYS}-day free trial`,
        }
      : access.state === "pro"
        ? {
            icon: CircleCheck,
            iconTone: access.cancelsAtPeriodEnd ? CHIP_TONES.amber : CHIP_TONES.green,
            headline: "Pro",
            subline:
              access.cancelsAtPeriodEnd && access.currentPeriodEnd
                ? `Cancelled · Pro until ${formatDate(access.currentPeriodEnd)}`
                : access.currentPeriodEnd
                  ? `Renews ${formatDate(access.currentPeriodEnd)}`
                  : "Active",
          }
        : {
            icon: Lock,
            iconTone: CHIP_TONES.red,
            headline: access.trialReused ? "Trial used" : access.subscriptionStatus ? "Pro ended" : "Trial ended",
            subline: access.accessEndedAt ? `on ${formatDate(access.accessEndedAt)}` : "Upgrade to keep building",
          };
  const StripIcon = strip.icon;

  // Key facts for the "Your plan" card (shown when there is no trial calendar)
  const facts: { label: string; value: string; tone?: string }[] = [
    {
      label: "Plan",
      value: isStaff ? "Super Admin" : access.state === "pro" ? (access.cancelsAtPeriodEnd ? "Pro (cancelled)" : "Pro") : access.state === "trial" ? "Free trial" : "Locked",
      tone: access.state === "expired" ? "text-red-600 dark:text-red-400" : undefined,
    },
    {
      label: "Public pages",
      value: isStaff || access.state !== "expired" || access.lifetimeCustomDomain
        ? "Live"
        : access.publicPagesLive && access.publicPagesOfflineAt
          ? `Live until ${formatDate(access.publicPagesOfflineAt)}`
          : "Offline",
      tone:
        access.state === "expired" && !access.lifetimeCustomDomain
          ? access.publicPagesLive ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
          : "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Custom domain",
      value: customDomainUnlocked ? "Unlocked" : "Not unlocked",
      tone: customDomainUnlocked ? "text-emerald-600 dark:text-emerald-400" : undefined,
    },
    { label: "Your data", value: "Safe", tone: "text-emerald-600 dark:text-emerald-400" },
  ];
  const footNote = isStaff
    ? "Super admin accounts are never locked."
    : access.state === "pro"
      ? "Cancel anytime. You keep Pro until the end of the month you've paid for."
      : "When the trial ends the dashboard locks until you upgrade. Your data is never deleted straight away."

  // Pro is the card to act on unless it is already paid for (or staff)
  const highlightPro = !isStaff && !isPaidPro;

  return (
    <motion.div
      className="grid gap-4 lg:grid-cols-3"
      variants={rowVariants}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
    >
      {/* ── 1. Your plan: same structure as the product cards, so the three read as one row ── */}
      <motion.section
        variants={cardVariants}
        className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 sm:p-7 dark:bg-[#121215] ${
          access.state === "expired"
            ? "border-red-500/25 bg-gradient-to-b from-red-500/[0.06] to-white dark:to-[#121215]"
            : "border-zinc-200 dark:border-white/10"
        }`}
        aria-label="Your plan"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${strip.iconTone}`}>
              <StripIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Your plan</h3>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${CHIP_TONES[planChip.tone]}`}>
            {planChip.chip}
          </span>
        </div>

        <p className="mt-6 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{strip.headline}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{strip.subline}</p>

        <div className="my-6 h-px bg-zinc-100 dark:bg-white/[0.06]" />

        <div className="flex-1">
          {access.state === "trial" && access.trialEndsAt ? (
            <TrialCalendar trialEndsAt={access.trialEndsAt} daysLeft={access.trialDaysLeft} compact />
          ) : (
            <dl className="space-y-3 text-sm">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">{f.label}</dt>
                  <dd className={`text-right font-semibold ${f.tone ?? "text-zinc-900 dark:text-white"}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <p className="mt-7 border-t border-zinc-100 pt-4 text-xs leading-relaxed text-zinc-500 dark:border-white/[0.06] dark:text-zinc-400">
          {footNote}
        </p>
      </motion.section>

      {/* ── 2 & 3. The two products ── */}
        {/* Pro monthly */}
        <motion.section
          variants={cardVariants}
          className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 sm:p-7 ${
            highlightPro
              ? "border-[#0066B2]/40 bg-gradient-to-b from-[#0066B2]/[0.07] to-white shadow-[0_0_0_1px_rgba(0,102,178,0.08),0_20px_40px_-20px_rgba(0,102,178,0.35)] dark:border-[#38BDF8]/30 dark:from-[#38BDF8]/[0.08] dark:to-[#121215]"
              : "border-zinc-200 bg-white dark:border-white/10 dark:bg-[#121215]"
          }`}
          aria-label="Pro plan"
        >
          {highlightPro && (
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0066B2]/60 to-transparent dark:via-[#38BDF8]/70" />
          )}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Pro</h3>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Capture and nurture leads.</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                isStaff
                  ? CHIP_TONES.purple
                  : isPaidPro
                    ? CHIP_TONES.green
                    : access.state === "pro"
                      ? CHIP_TONES.amber
                      : CHIP_TONES.blue
              }`}
            >
              {isStaff ? "Included" : isPaidPro ? "Your plan" : access.state === "pro" ? "Cancelled" : "Recommended"}
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{PRO_MONTHLY_DISPLAY_PRICE}</span>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">/month</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">GST included · cancel anytime</p>

          <div className="my-6 h-px bg-zinc-100 dark:bg-white/[0.06]" />
          <motion.ul variants={rowVariants} className="flex-1 space-y-3 text-zinc-700 dark:text-zinc-300">
            {PRO_BENEFITS.map((f) => <Feature key={f}>{f}</Feature>)}
          </motion.ul>

          <div className="mt-7 [&>span]:flex [&>span]:w-full">
            {isStaff ? (
              <span className={doneCta}>Included with Super Admin</span>
            ) : isPaidPro ? (
              <span className={doneCta}><Check className="h-4 w-4" aria-hidden="true" /> Current plan</span>
            ) : (
              <UpgradeToProButton className={access.state === "pro" ? outlineCta : lightCta}>
                {access.state === "pro" ? "Subscribe again" : (
                  <>Upgrade to Pro <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                )}
              </UpgradeToProButton>
            )}
          </div>
        </motion.section>

        {/* Custom domain: separate one-time add-on */}
        <motion.section
          variants={cardVariants}
          className="relative flex flex-col overflow-hidden rounded-2xl bg-zinc-950 p-6 sm:p-7 text-white ring-1 ring-zinc-900 dark:bg-[#0b1a2b] dark:ring-[#38BDF8]/25"
          aria-label="Custom domain add-on"
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/70 to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#38BDF8]/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Custom domain</h3>
              <p className="mt-0.5 text-sm text-zinc-400">Your pages, your brand.</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                customDomainUnlocked ? "bg-emerald-400/15 text-emerald-300" : "bg-[#38BDF8]/15 text-[#38BDF8]"
              }`}
            >
              {customDomainUnlocked ? "Unlocked" : "Add-on"}
            </span>
          </div>

          <div className="relative mt-6 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight">₹4,999</span>
            <span className="text-sm font-medium text-zinc-400">one-time</span>
          </div>
          <p className="relative mt-1 text-xs text-zinc-400">Lifetime access · separate from Pro</p>

          <div className="relative my-6 h-px bg-white/10" />
          <motion.ul variants={rowVariants} className="relative flex-1 space-y-3 text-zinc-200">
            {CUSTOM_DOMAIN_BENEFITS.map((f) => <Feature key={f} dark>{f}</Feature>)}
          </motion.ul>

          <Link
            href="/dashboard/integration"
            className={`relative mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
              customDomainUnlocked ? "border border-white/20 text-white hover:bg-white/10" : "bg-white text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            {customDomainUnlocked ? "Manage domain" : "Unlock custom domain"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.section>
    </motion.div>
  );
}

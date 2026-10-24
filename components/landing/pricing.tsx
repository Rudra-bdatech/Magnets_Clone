"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/plan-limits";

type Currency = "INR" | "USD";

const free = PLAN_LIMITS.Free;
const pro = PLAN_LIMITS.Pro;
const fmt = (n: number) => n.toLocaleString("en-IN");
const storage = (mb: number) => (mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`);

// Mirrors PLAN_PRICING in lib/billing.ts (kept literal so this client file doesn't import the server billing module).
const PRICES: Record<Currency, { free: string; pro: string; proNote: string }> = {
  INR: { free: "₹0", pro: "₹4,999", proNote: "one-time · lifetime access" },
  USD: { free: "$0", pro: "$29", proNote: "per month" },
};

// Odometer-style price: each digit is a 0–9 column translated into place.
function RollingPrice({ value }: { value: string }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-baseline overflow-hidden leading-none" aria-label={value}>
      {chars.map((c, i) => {
        const key = `${chars.length - i}`; // keyed from the right so units stay put
        if (!/\d/.test(c)) {
          return (
            <span key={key + c} aria-hidden="true">
              {c}
            </span>
          );
        }
        const d = Number(c);
        return (
          <span key={key} aria-hidden="true" className="relative inline-block h-[1em] overflow-hidden tabular-nums">
            <span className="invisible">0</span>
            <span
              className="absolute left-0 top-0 flex flex-col transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ transform: `translateY(-${d * 10}%)`, transitionDelay: `${i * 50}ms` }}
            >
              {Array.from({ length: 10 }, (_, n) => (
                <span key={n} className="h-[1em]">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Feature({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex gap-2.5 text-sm">
      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-[#38BDF8]" : "text-[#0066B2] dark:text-[#38BDF8]"}`} aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default function Pricing() {
  const [currency, setCurrency] = useState<Currency>("INR");
  const p = PRICES[currency];

  return (
    <div className="mt-12">
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Currency" className="relative inline-grid grid-cols-2 rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] p-1 text-xs font-semibold">
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-zinc-900 dark:bg-white transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ transform: currency === "USD" ? "translateX(100%)" : "translateX(0)" }}
          />
          {(["INR", "USD"] as Currency[]).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={currency === c}
              onClick={() => setCurrency(c)}
              className={`relative z-10 rounded-full px-5 py-1.5 transition-colors ${currency === c ? "text-white dark:text-zinc-900" : "text-zinc-500"}`}
            >
              {c === "INR" ? "₹ India" : "$ Global"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">Free</p>
          <p className="mt-4 text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            <RollingPrice value={p.free} />
          </p>
          <p className="mt-2 text-sm text-zinc-500">forever, no card needed</p>
          <ul className="mt-7 flex-1 space-y-3 text-zinc-700 dark:text-zinc-300">
            <Feature>{fmt(free.leadLimit)} leads</Feature>
            <Feature>{storage(free.storageLimitMb)} file hosting</Feature>
            <Feature>{free.sequencesLimit} email sequences</Feature>
            <Feature>AI page generator</Feature>
            <Feature>Free LeadMagnets subdomain</Feature>
          </ul>
          <Link
            href="/register"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 dark:border-white/15 text-sm font-semibold text-zinc-900 dark:text-white transition hover:bg-zinc-50 dark:hover:bg-white/5"
          >
            Start free
          </Link>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-zinc-950 dark:bg-[#0b1a2b] p-7 text-white ring-1 ring-zinc-900 dark:ring-[#38BDF8]/30">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/70 to-transparent" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#38BDF8]">Pro</p>
          <p className="mt-4 text-5xl font-extrabold tracking-tight">
            <RollingPrice value={p.pro} />
          </p>
          <p className="mt-2 text-sm text-zinc-400">{p.proNote}</p>
          <ul className="mt-7 flex-1 space-y-3 text-zinc-200">
            <Feature dark>{fmt(pro.leadLimit)} leads</Feature>
            <Feature dark>{storage(pro.storageLimitMb)} file hosting</Feature>
            <Feature dark>{pro.sequencesLimit} email sequences</Feature>
            <Feature dark>Custom domain with automatic SSL</Feature>
            <Feature dark>No LeadMagnets branding</Feature>
          </ul>
          <Link
            href="/register"
            className="group mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-zinc-900 transition hover:bg-zinc-100"
          >
            Start free, upgrade anytime
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

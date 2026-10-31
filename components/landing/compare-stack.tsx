"use client";

import { Check } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "./use-in-view";

const ROWS = [
  { job: "Opt-in page", diy: "A page or form builder" },
  { job: "File delivery", diy: "A Drive or Dropbox link" },
  { job: "Welcome + follow-up emails", diy: "An email marketing tool" },
  { job: "Sending leads to your CRM", diy: "Zapier, glued in between" },
  { job: "Knowing what converts", diy: "A spreadsheet you update by hand" },
];

export default function CompareStack() {
  const [ref, inView] = useInView({ once: true });
  const reduced = usePrefersReducedMotion();
  const on = inView || reduced;

  return (
    <div ref={ref} className={`mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] ${on ? "lm-wipe-visible" : ""}`}>
      <div className="lm-wipe-row grid grid-cols-[1fr_1fr] sm:grid-cols-[1.1fr_1fr_1fr] border-b border-zinc-200 dark:border-white/10 text-xs font-semibold" style={{ transitionDelay: "0ms" }}>
        <div className="hidden sm:block p-4 font-mono uppercase tracking-wider text-[10px] text-zinc-400">The job</div>
        <div className="p-4 text-zinc-500 dark:text-zinc-400">The duct-tape stack</div>
        <div className="p-4 bg-[#0066B2] text-white">Funnels</div>
      </div>
      {ROWS.map((r, i) => (
        <div key={r.job} className="lm-wipe-row grid grid-cols-[1fr_1fr] sm:grid-cols-[1.1fr_1fr_1fr] border-b border-zinc-100 dark:border-white/5 text-sm" style={{ transitionDelay: `${100 + i * 100}ms` }}>
          <div className="hidden sm:block p-4 font-medium text-zinc-900 dark:text-white">{r.job}</div>
          <div className="p-4 text-zinc-500 dark:text-zinc-400">
            <span className="sm:hidden block text-[11px] font-semibold text-zinc-900 dark:text-white mb-0.5">{r.job}</span>
            <span
              className="lm-strike"
              data-on={on ? "true" : "false"}
              style={{ transitionDelay: `${300 + i * 180}ms` }}
            >
              {r.diy}
            </span>
          </div>
          <div className="flex items-center gap-2 p-4 bg-[#0066B2]/[0.04] dark:bg-[#38BDF8]/[0.05] text-zinc-900 dark:text-white">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0066B2] text-white transition-all duration-300 ${on ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
              style={{ transitionDelay: `${450 + i * 180}ms` }}
            >
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className="text-xs sm:text-sm">Built in</span>
          </div>
        </div>
      ))}
      <div className="lm-wipe-row grid grid-cols-[1fr_1fr] sm:grid-cols-[1.1fr_1fr_1fr] text-sm" style={{ transitionDelay: `${100 + ROWS.length * 100}ms` }}>
        <div className="hidden sm:block p-4 font-mono uppercase tracking-wider text-[10px] text-zinc-400 self-center">Total</div>
        <div className="p-4">
          <p className="font-bold text-zinc-900 dark:text-white">4–5 tools</p>
          <p className="text-xs text-zinc-500">4–5 logins, bills, and things that break</p>
        </div>
        <div className="p-4 bg-[#0066B2]/[0.04] dark:bg-[#38BDF8]/[0.05]">
          <p className="font-bold text-[#0066B2] dark:text-[#38BDF8]">1 tool</p>
          <p className="text-xs text-zinc-500">Free to start</p>
        </div>
      </div>
    </div>
  );
}

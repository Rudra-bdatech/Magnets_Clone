"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Lock, Loader2, FileText, FileArchive, FileSpreadsheet, Mail, CalendarCheck, MousePointer2, Check } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "./use-in-view";

// Advances 0..count-1 on a timer, only while the tile is on screen.
function useLoopStep(count: number, ms: number, active: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % count), ms);
    return () => window.clearInterval(id);
  }, [count, ms, active]);
  return step;
}

function Tile({
  n,
  title,
  body,
  className = "",
  children,
}: {
  n: string;
  title: string;
  body: string;
  className?: string;
  children: (active: boolean) => ReactNode;
}) {
  const [ref, inView] = useInView({ rootMargin: "0px" });
  const reduced = usePrefersReducedMotion();
  const active = inView && !reduced;
  return (
    <div
      ref={ref}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] transition-colors hover:border-zinc-300 dark:hover:border-white/20 ${active ? "" : "lm-paused"} ${className}`}
    >
      <div className="p-6 pb-0">
        <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-600">{n}</span>
        <h3 className="mt-3 text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
      </div>
      <div className="relative mt-6 flex-1 min-h-[200px]">{children(active)}</div>
    </div>
  );
}

/* ---------- AI generator ---------- */
const PROMPT = "Checklist for bakers growing on Instagram";
const OUTPUT = [
  "Grow your bakery on Instagram without posting daily",
  "The 3 post types that bring walk-ins",
  "A 15-minute weekly content routine",
  "Captions that sell without sounding salesy",
];

function AiDemo({ active }: { active: boolean }) {
  // 0..PROMPT.length = typing, then generating, then lines revealed, then hold
  const [tick, setTick] = useState(PROMPT.length + 14);
  useEffect(() => {
    if (!active) return;
    setTick(0);
    const id = window.setInterval(() => setTick((t) => (t > PROMPT.length + 40 ? 0 : t + 1)), 60);
    return () => window.clearInterval(id);
  }, [active]);

  const typed = PROMPT.slice(0, Math.min(tick, PROMPT.length));
  const after = tick - PROMPT.length;
  const generating = after > 0 && after < 6;
  const lines = after >= 6 ? Math.min(OUTPUT.length, Math.floor((after - 6) / 2) + 1) : 0;

  return (
    <div className="absolute inset-x-6 bottom-0 top-0 flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] px-3 py-2.5">
        <span className="font-mono text-[11px] text-zinc-400">topic</span>
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
          {typed}
          {tick < PROMPT.length && <span className="ml-px inline-block h-4 w-px translate-y-0.5 bg-zinc-800 dark:bg-zinc-200 animate-pulse" />}
        </span>
        <span className="flex h-7 items-center gap-1.5 rounded-lg bg-[#0066B2] px-2.5 text-[11px] font-bold text-white">
          {generating ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : null}
          Generate
        </span>
      </div>
      <div className="flex-1 rounded-t-xl border border-b-0 border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0e0e11] p-4">
        {OUTPUT.map((line, i) => (
          <div key={line} className={i === 0 ? "mb-3" : "mb-1.5"}>
            {i < lines ? (
              <p className={`lm-fade-in ${i === 0 ? "text-base font-extrabold tracking-tight text-zinc-900 dark:text-white" : "text-xs text-zinc-600 dark:text-zinc-400"}`}>
                {i === 0 ? line : `— ${line}`}
              </p>
            ) : (
              <div className={`rounded bg-zinc-100 dark:bg-white/[0.06] ${i === 0 ? "h-5 w-4/5" : "h-3 w-3/5"} ${generating ? "animate-pulse" : ""}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Custom domain ---------- */
const DOMAIN_STEPS = ["Checking DNS", "Issuing SSL", "Live"];
function DomainDemo({ active }: { active: boolean }) {
  const step = useLoopStep(DOMAIN_STEPS.length + 1, 1300, active);
  const s = Math.min(step, DOMAIN_STEPS.length - 1);
  const live = s === DOMAIN_STEPS.length - 1;
  return (
    <div className="absolute inset-x-6 top-2 space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] px-3 py-2 font-mono text-xs">
        <Lock className={`h-3.5 w-3.5 transition-colors ${live ? "text-emerald-600" : "text-zinc-300 dark:text-zinc-600"}`} aria-hidden="true" />
        <span className="text-zinc-800 dark:text-zinc-200">get.yourbrand.com</span>
      </div>
      <ol className="space-y-2">
        {DOMAIN_STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                i < s || (live && i === s)
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : i === s
                  ? "border-[#0066B2] text-[#0066B2]"
                  : "border-zinc-300 dark:border-zinc-700 text-transparent"
              }`}
            >
              {i < s || (live && i === s) ? <Check className="h-2.5 w-2.5" aria-hidden="true" /> : i === s ? <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" /> : null}
            </span>
            <span className={i <= s ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"}>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Hosting ---------- */
const FILES = [
  { name: "checklist.pdf", size: "2.4 MB", Icon: FileText },
  { name: "canva-templates.zip", size: "3.8 MB", Icon: FileArchive },
  { name: "content-calendar.xlsx", size: "0.6 MB", Icon: FileSpreadsheet },
];
function HostingDemo() {
  return (
    <div className="absolute inset-x-6 top-2 space-y-2.5">
      {FILES.map(({ name, size, Icon }, i) => (
        <div key={name} className="rounded-lg border border-zinc-200 dark:border-white/10 px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <Icon className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <span className="flex-1 truncate text-zinc-800 dark:text-zinc-200">{name}</span>
            <span className="font-mono text-[10px] text-zinc-400">{size}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
            <div className="lm-fill h-full origin-left rounded-full bg-[#0066B2] dark:bg-[#38BDF8]" style={{ animationDelay: `${i * 0.5}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Locked PDF ---------- */
function LockedPdfDemo({ active }: { active: boolean }) {
  // 0 locked, 1 email entered, 2 unlocked, 3 hold
  const step = useLoopStep(4, 1500, active);
  const unlocked = step === 2;
  const typed = step === 1 || step === 2;
  return (
    <div className="absolute inset-x-6 top-2 bottom-0 overflow-hidden rounded-t-lg border border-b-0 border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0e0e11]">
      <div className="space-y-1.5 p-4" aria-hidden="true">
        <p className="font-mono text-[9px] text-zinc-400">PAGE 2 / 12</p>
        <div className="h-2.5 w-3/4 rounded bg-zinc-800 dark:bg-zinc-300" />
        <div className="h-1.5 w-full rounded bg-zinc-200 dark:bg-white/10" />
        <div className="h-1.5 w-11/12 rounded bg-zinc-200 dark:bg-white/10" />
        <div className="h-1.5 w-4/5 rounded bg-zinc-200 dark:bg-white/10" />
      </div>
      <div className="relative border-t border-dashed border-zinc-200 dark:border-white/10 p-4">
        <div className={`space-y-1.5 transition-[filter,opacity] duration-500 ${unlocked ? "" : "blur-[3px] opacity-60"}`} aria-hidden="true">
          <p className="font-mono text-[9px] text-zinc-400">PAGE 3 / 12</p>
          <div className="h-2.5 w-2/3 rounded bg-zinc-800 dark:bg-zinc-300" />
          <div className="h-1.5 w-full rounded bg-zinc-200 dark:bg-white/10" />
          <div className="h-1.5 w-5/6 rounded bg-zinc-200 dark:bg-white/10" />
          <div className="h-1.5 w-11/12 rounded bg-zinc-200 dark:bg-white/10" />
        </div>
        <div className={`absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#18181c]/95 p-2.5 shadow-lg transition-all duration-500 ${unlocked ? "pointer-events-none opacity-0 scale-95" : "opacity-100"}`}>
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 dark:text-white">
            <Lock className="h-3 w-3" aria-hidden="true" /> Enter your email to keep reading
          </p>
          <div className="mt-2 flex gap-1.5">
            <span className="min-h-[22px] flex-1 truncate rounded-md border border-zinc-200 dark:border-white/10 px-2 py-1 text-[10px] text-zinc-500">
              {typed ? "you@bakery.com" : ""}
            </span>
            <span className="rounded-md bg-[#0066B2] px-2 py-1 text-[10px] font-bold text-white">Unlock</span>
          </div>
        </div>
        {unlocked && (
          <span className="lm-fade-in absolute right-4 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            <Check className="h-2.5 w-2.5" aria-hidden="true" /> Unlocked
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Drip ---------- */
const DRIP = [
  { day: "Day 0", label: "Your checklist is here", Icon: Mail },
  { day: "Day 2", label: "The mistake most bakers make", Icon: Mail },
  { day: "Day 5", label: "Want me to look at your feed?", Icon: Mail },
  { day: "Day 6", label: "Call booked · sequence stopped", Icon: CalendarCheck },
];
function DripDemo({ active }: { active: boolean }) {
  const step = useLoopStep(DRIP.length + 2, 1000, active);
  return (
    <ol className="absolute inset-x-6 top-2 space-y-0">
      {DRIP.map(({ day, label, Icon }, i) => {
        const done = i < step;
        const last = i === DRIP.length - 1;
        return (
          <li key={day} className="relative flex gap-3 pb-3">
            {!last && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-zinc-200 dark:bg-white/10" aria-hidden="true" />}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                done
                  ? last
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-[#0066B2] bg-[#0066B2] text-white"
                  : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] text-zinc-300 dark:text-zinc-600"
              }`}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-mono text-[10px] text-zinc-400">{day}</p>
              <p className={`truncate text-xs transition-colors ${done ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"}`}>{label}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Exit intent ---------- */
function ExitDemo() {
  return (
    <div className="absolute inset-x-6 top-2 bottom-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]">
      <div className="space-y-2 p-3" aria-hidden="true">
        <div className="h-2.5 w-2/3 rounded bg-zinc-200 dark:bg-white/10" />
        <div className="h-2 w-1/2 rounded bg-zinc-200 dark:bg-white/10" />
        <div className="h-2 w-3/5 rounded bg-zinc-200 dark:bg-white/10" />
      </div>
      <MousePointer2 className="lm-exit-cursor absolute left-1/2 top-[70%] h-4 w-4 fill-zinc-900 text-white dark:fill-white dark:text-zinc-900" aria-hidden="true" />
      <div className="lm-exit-popup absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181c] p-3 text-center shadow-xl">
        <p className="text-xs font-bold text-zinc-900 dark:text-white">Leaving already?</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">Take the checklist with you.</p>
        <span className="mt-2 inline-block rounded-md bg-[#0066B2] px-3 py-1 text-[10px] font-bold text-white">Send it</span>
      </div>
    </div>
  );
}

/* ---------- Analytics + A/B ---------- */
function CountUp({ to, active, decimals = 0, suffix = "" }: { to: number; active: boolean; decimals?: number; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, active]);
  return (
    <span className="tabular-nums">
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

const VARIANTS = [
  { id: "A", label: "Original headline", rate: 31.4 },
  { id: "B", label: "Shorter headline", rate: 38.3 },
];

function AnalyticsDemo({ active }: { active: boolean }) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (active) setSeen(true);
  }, [active]);
  return (
    <div className="relative h-full px-6 pb-6 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-end">
      <dl className="grid grid-cols-3 sm:grid-cols-1 gap-4 sm:gap-3">
        {[
          { k: "Visitors", v: 1204, d: 0, s: "" },
          { k: "Leads", v: 461, d: 0, s: "" },
          { k: "Opt-in rate", v: 38.3, d: 1, s: "%" },
        ].map((m) => (
          <div key={m.k}>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">{m.k}</dt>
            <dd className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              <CountUp to={m.v} active={seen} decimals={m.d} suffix={m.s} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">A/B test · opt-in rate</p>
        {VARIANTS.map((v, i) => {
          const winner = i === VARIANTS.length - 1;
          return (
            <div key={v.id}>
              <div className="mb-1.5 flex items-center gap-2 text-xs">
                <span className={`flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold ${winner ? "bg-[#0066B2] text-white" : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"}`}>{v.id}</span>
                <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">{v.label}</span>
                {winner && seen && (
                  <span className="lm-fade-in rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300" style={{ animationDelay: "1.2s" }}>
                    Winner
                  </span>
                )}
                <span className="font-mono tabular-nums text-zinc-500">{v.rate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 ease-out ${winner ? "bg-[#0066B2] dark:bg-[#38BDF8]" : "bg-zinc-300 dark:bg-zinc-600"}`}
                  style={{ width: seen ? `${v.rate * 2}%` : "0%", transitionDelay: `${200 + i * 150}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BentoFeatures() {
  const [cascadeRef, cascadeInView] = useInView({ once: true, rootMargin: "0px 0px -10% 0px" });

  return (
    <div ref={cascadeRef} className={`lm-cascade mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-6 ${cascadeInView ? "lm-visible" : ""}`}>
      <Tile
        n="01"
        title="Describe it. Get a page."
        body="Type your topic and AI writes the headline, bullets and opt-in page. Edit anything after."
        className="md:col-span-2 lg:col-span-4 min-h-[380px]"
      >
        {(a) => <AiDemo active={a} />}
      </Tile>
      <Tile n="02" title="Let them read, then ask" body="Readers get the first pages free (you pick how many). The rest unlocks with an email." className="lg:col-span-2 min-h-[380px]">
        {(a) => <LockedPdfDemo active={a} />}
      </Tile>
      <Tile n="03" title="Host the file here" body="PDFs, templates, spreadsheets. No Drive links, no permission requests." className="lg:col-span-2">
        {() => <HostingDemo />}
      </Tile>
      <Tile n="04" title="Follow-ups that know when to stop" body="Timed emails that pause the moment a lead books a call." className="lg:col-span-2">
        {(a) => <DripDemo active={a} />}
      </Tile>
      <Tile n="05" title="Catch people on the way out" body="An exit-intent popup on every page, no extra setup." className="lg:col-span-2">
        {() => <ExitDemo />}
      </Tile>
      <Tile n="06" title="Your domain, with SSL" body="Point a subdomain at us. We handle DNS checks and certificates." className="md:col-span-2 lg:col-span-2">
        {(a) => <DomainDemo active={a} />}
      </Tile>
      <Tile
        n="07"
        title="Test two headlines, see which wins"
        body="Split traffic 50/50 between two headlines or cover images and compare opt-in rates. Sample numbers shown."
        className="md:col-span-2 lg:col-span-4 min-h-[340px] sm:min-h-[300px]"
      >
        {(a) => <AnalyticsDemo active={a} />}
      </Tile>
    </div>
  );
}

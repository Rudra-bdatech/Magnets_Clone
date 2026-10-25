"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Lock, Sparkles, Play, ImageIcon } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "./use-in-view";

const SUGGESTIONS = ["Instagram growth for bakers", "Meal prep for busy parents", "Cold email for agencies", "Notion for students"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Sentence case: keep the visitor's wording, only capitalise the start of the headline.
const HEADLINES = [
  (t: string) => `The ${t} checklist`,
  (t: string) => `${cap(t)}: the 1-page cheat sheet`,
  (t: string) => `The beginner's guide to ${t}`,
];
const KINDS = ["Checklist", "Cheat sheet", "Guide"];

const BULLETS = [
  (t: string) => `The 5 mistakes that slow down ${t.toLowerCase()}, and the fix for each`,
  () => "A step-by-step plan you can start today",
  () => "Copy-and-paste templates that save you hours",
];

// Each topic gets a theme so the preview visibly changes with what you type.
const THEMES = [
  { accent: "#0066B2", accentDark: "#38BDF8", glow: "rgba(0,102,178,0.28)", cover: "linear-gradient(150deg,#0B2E6B 0%,#0066B2 48%,#38BDF8 100%)" },
  { accent: "#EA580C", accentDark: "#FB923C", glow: "rgba(234,88,12,0.24)", cover: "linear-gradient(150deg,#7C2D12 0%,#EA580C 50%,#FBBF24 100%)" },
  { accent: "#059669", accentDark: "#34D399", glow: "rgba(5,150,105,0.24)", cover: "linear-gradient(150deg,#064E3B 0%,#059669 50%,#A3E635 100%)" },
];

// Lowercase the first letter so the topic reads naturally mid-headline, unless the
// first word looks like a name or acronym ("Instagram", "SEO", "LinkedIn").
const PROPER = new Set(["instagram", "notion", "linkedin", "youtube", "tiktok", "etsy", "shopify", "canva", "excel", "google", "facebook", "pinterest", "substack", "amazon", "figma", "chatgpt"]);
const midSentence = (t: string) => {
  const first = t.split(/\s+/)[0];
  if (PROPER.has(first.toLowerCase()) || /[A-Z]/.test(first.slice(1))) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "your-page";
const hash = (s: string) => s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// Build steps: 0 blank · 1 headline · 2 cover · 3 benefits · 4 opt-in form · 5 ready
const STEP_AT = [0, 0, 700, 1150, 1600, 2050];
const STEPS = [
  { label: "Headline", doing: "Writing headline" },
  { label: "Cover", doing: "Designing cover" },
  { label: "Benefits", doing: "Listing benefits" },
  { label: "Opt-in form", doing: "Adding opt-in form" },
];
const TYPE_MS = 38;
const HOLD_MS = 3400;

type Build = { topic: string; step: number; run: number };

// A client-side preview built from templates (no API call). The copy says so,
// and the real AI generator lives behind sign-up.
export default function TryIt() {
  const [ref, inView] = useInView({ rootMargin: "0px 0px -20% 0px" });
  const reduced = usePrefersReducedMotion();
  const [topic, setTopic] = useState(SUGGESTIONS[0]);
  const [build, setBuild] = useState<Build>({ topic: SUGGESTIONS[0], step: 5, run: 0 });
  const [userTook, setUserTook] = useState(false);
  const [shake, setShake] = useState(0);
  const buildTimers = useRef<number[]>([]);
  const demoIdx = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearBuild = () => {
    buildTimers.current.forEach((t) => window.clearTimeout(t));
    buildTimers.current = [];
  };

  const startBuild = (t: string) => {
    clearBuild();
    if (reduced) {
      setBuild((b) => ({ topic: t, step: 5, run: b.run + 1 }));
      return;
    }
    setBuild((b) => ({ topic: t, step: 1, run: b.run + 1 }));
    for (let s = 2; s <= 5; s++) {
      buildTimers.current.push(window.setTimeout(() => setBuild((b) => ({ ...b, step: s })), STEP_AT[s]));
    }
  };

  useEffect(() => clearBuild, []);

  // Self-running demo until the visitor takes over.
  useEffect(() => {
    if (!inView || userTook || reduced) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    (async () => {
      while (!cancelled) {
        const t = SUGGESTIONS[demoIdx.current % SUGGESTIONS.length];
        clearBuild();
        setBuild((b) => ({ ...b, step: 0 }));
        setTopic("");
        await wait(450);
        for (let k = 1; k <= t.length && !cancelled; k++) {
          setTopic(t.slice(0, k));
          await wait(TYPE_MS);
        }
        if (cancelled) return;
        await wait(320);
        if (cancelled) return;
        startBuild(t);
        await wait(STEP_AT[5] + HOLD_MS);
        demoIdx.current += 1;
      }
    })();
    return () => {
      cancelled = true;
      timers.forEach((x) => window.clearTimeout(x));
    };
    // startBuild/clearBuild only touch refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, userTook, reduced]);

  const takeOver = () => {
    if (!userTook) setUserTook(true);
  };

  const run = (value = topic) => {
    takeOver();
    const t = value.trim().slice(0, 60);
    if (!t) {
      setShake((n) => n + 1);
      inputRef.current?.focus();
      return;
    }
    setTopic(t);
    startBuild(t);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run();
  };

  const h = hash(build.topic.toLowerCase());
  const v = h % HEADLINES.length;
  const theme = THEMES[(h >>> 3) % THEMES.length];
  const T = midSentence(build.topic);
  const headline = HEADLINES[v](T);
  const step = build.step;
  const building = step >= 1 && step < 5;
  const ready = step === 5;
  const demoing = !userTook && !reduced;
  // Hex-alpha variants: Tailwind 3 can't apply /opacity modifiers to var() colours.
  const themeVars = {
    "--acc": theme.accent,
    "--acc-d": theme.accentDark,
    "--acc-10": `${theme.accent}1A`,
    "--acc-15": `${theme.accent}26`,
    "--acc-40": `${theme.accent}66`,
    "--accd-10": `${theme.accentDark}1A`,
    "--accd-15": `${theme.accentDark}26`,
    "--accd-40": `${theme.accentDark}66`,
  } as CSSProperties;

  return (
    <div ref={ref} className="relative mx-auto mt-12 max-w-5xl sm:mt-14" style={themeVars}>
      {/* Ambient glow follows the topic's theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-0 transition-[background] duration-700"
        style={{ background: `radial-gradient(55% 50% at 50% 55%, ${theme.glow}, transparent 70%)` }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_40px_100px_-50px_rgba(0,40,90,0.45)] dark:border-white/10 dark:bg-[#0E0E11] dark:shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)] min-h-[1070px] md:min-h-[660px]">
        {/* Browser chrome */}
        <div className="flex h-11 items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 dark:border-white/10 dark:bg-[#141418]">
          <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:border-white/10 dark:bg-white/[0.06]">
            <Lock className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="truncate">
              magnets.bdatech.in/you/<span className="text-zinc-900 dark:text-zinc-200">{slugify(topic)}</span>
            </span>
          </div>
          <StatusPill building={building} ready={ready} demoing={demoing && step === 0} />
        </div>

        {/* Progress */}
        <div className="h-0.5 bg-transparent">
          <div
            className="h-full bg-[var(--acc)] transition-[width,opacity] duration-500 ease-out dark:bg-[var(--acc-d)]"
            style={{ width: `${(Math.min(step, 5) / 5) * 100}%`, opacity: building ? 1 : 0 }}
          />
        </div>

        {/* Prompt bar */}
        <form onSubmit={onSubmit} className="border-b border-zinc-200 px-4 py-4 dark:border-white/10 sm:px-6">
          <label htmlFor="try-topic" className="sr-only">
            What&rsquo;s your freebie about?
          </label>
          <div
            key={shake}
            className={`flex h-12 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 pl-3.5 pr-1.5 transition focus-within:border-[var(--acc)] focus-within:bg-white focus-within:ring-4 focus-within:ring-[var(--acc-10)] dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06] ${
              shake ? "lm-shake" : ""
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-[var(--acc)] dark:text-[var(--acc-d)]" aria-hidden="true" />
            <input
              ref={inputRef}
              id="try-topic"
              value={topic}
              maxLength={60}
              autoComplete="off"
              onFocus={(e) => {
                if (!userTook) e.target.select();
                takeOver();
              }}
              onChange={(e) => {
                takeOver();
                setTopic(e.target.value);
              }}
              placeholder="What's your freebie about?"
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white sm:text-base"
            />
            <button
              type="submit"
              aria-label="Preview my page"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acc)] focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-[#0E0E11] sm:px-4"
            >
              {building ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              <span className="hidden sm:inline">{building ? "Building" : "Preview my page"}</span>
              {!building && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex h-8 items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {SUGGESTIONS.map((s) => {
              const active = s === build.topic;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => run(s)}
                  className={`inline-flex h-7 shrink-0 items-center justify-center rounded-full border px-3 text-xs leading-none transition ${
                    active
                      ? "border-[var(--acc-40)] bg-[var(--acc-10)] text-zinc-900 dark:border-[var(--accd-40)] dark:bg-[var(--accd-10)] dark:text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-400 dark:hover:border-white/30 dark:hover:text-white"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </form>

        {/* Canvas: the page being built */}
        <div className="relative px-5 py-8 sm:px-10 sm:py-10 min-h-[840px] md:min-h-[480px] flex items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-40 transition-[background] duration-700"
            style={{ background: `radial-gradient(60% 100% at 50% 0%, ${theme.glow.replace(/[\d.]+\)$/, "0.10)")}, transparent)` }}
          />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr] md:gap-12 w-full">
            <div className="order-2 md:order-1 flex flex-col justify-between min-h-[505px] md:min-h-[410px]">
              {/* Headline */}
              <Block active={step === 1} label={STEPS[0].doing} className="min-h-[185px] md:min-h-[175px] flex flex-col justify-start">
                {step >= 1 ? (
                  <div key={`h-${build.run}`}>
                    <p className="lm-rise-in font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--acc)] dark:text-[var(--acc-d)]">
                      Free {KINDS[v].toLowerCase()} · Instant download
                    </p>
                    <h3 className="mt-2.5 text-[1.4rem] font-extrabold leading-[1.2] tracking-tight text-zinc-900 dark:text-white sm:text-2xl lg:text-[1.7rem] line-clamp-3">
                      {headline.split(" ").map((w, i) => (
                        <span key={i} className="lm-word" style={{ animationDelay: `${i * 55}ms` }}>
                          {w}&nbsp;
                        </span>
                      ))}
                    </h3>
                    <p className="lm-rise-in mt-2 text-sm text-zinc-500" style={{ animationDelay: "300ms" }}>
                      Get it free, straight to your inbox.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 py-1">
                    <Bar className="h-2.5 w-36" />
                    <Bar className="h-7 w-11/12" />
                    <Bar className="h-7 w-2/3" />
                    <Bar className="h-3.5 w-48 mt-1" />
                  </div>
                )}
              </Block>

              {/* Benefits */}
              <Block active={step === 3} label={STEPS[2].doing} className="mt-6 md:mt-7 min-h-[160px] md:min-h-[105px] flex flex-col justify-center">
                {step >= 3 ? (
                  <ul key={`b-${build.run}`} className="space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {BULLETS.map((b, i) => (
                      <li key={i} className="lm-rise-in flex gap-2.5 items-start" style={{ animationDelay: `${i * 110}ms` }}>
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--acc-15)] text-[var(--acc)] dark:bg-[var(--accd-15)] dark:text-[var(--acc-d)]">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                        <span className="leading-snug line-clamp-2">{b(build.topic)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3.5 py-1">
                    <div className="flex items-start gap-2.5">
                      <Bar className="mt-0.5 h-4 w-4 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Bar className="h-3.5 w-11/12" />
                        <Bar className="h-3 w-4/5 md:hidden" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Bar className="mt-0.5 h-4 w-4 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Bar className="h-3.5 w-4/5" />
                        <Bar className="h-3 w-3/5 md:hidden" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Bar className="mt-0.5 h-4 w-4 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Bar className="h-3.5 w-3/5" />
                        <Bar className="h-3 w-1/2 md:hidden" />
                      </div>
                    </div>
                  </div>
                )}
              </Block>

              {/* Opt-in form */}
              <Block active={step === 4} label={STEPS[3].doing} className="mt-6 md:mt-7 min-h-[110px] md:min-h-[68px] flex flex-col justify-center">
                {step >= 4 ? (
                  <div key={`f-${build.run}`} className="lm-rise-in">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <span className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-400 dark:border-white/10 dark:bg-white/[0.04]">
                        you@email.com
                      </span>
                      <span className="rounded-lg bg-[var(--acc)] px-4 py-2.5 text-center text-sm font-bold text-white shadow-[0_8px_20px_-8px_var(--acc)]">
                        Send it to me
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-400">No spam. Unsubscribe anytime.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Bar className="h-10 flex-1 rounded-lg" />
                      <Bar className="h-10 w-full sm:w-28 rounded-lg" />
                    </div>
                    <Bar className="mt-2 h-3 w-40" />
                  </div>
                )}
              </Block>
            </div>

            {/* Cover */}
            <div className="order-1 md:order-2">
              <Block active={step === 2} label={STEPS[1].doing} className="mx-auto w-44 sm:w-52 md:w-full md:max-w-[260px]">
                {step >= 2 ? (
                  <Cover key={`c-${build.run}`} title={cap(build.topic)} kind={KINDS[v]} gradient={theme.cover} />
                ) : (
                  <div className="relative mx-auto w-full max-w-[250px] sm:max-w-[260px]">
                    <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 dark:border-white/10 dark:bg-white/[0.02]">
                      <div className="flex flex-col items-center gap-2 text-zinc-300 dark:text-zinc-700">
                        <ImageIcon className="h-8 w-8" aria-hidden="true" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">Cover preview</span>
                      </div>
                    </div>
                  </div>
                )}
              </Block>
            </div>
          </div>
        </div>

        {/* Build checklist */}
        <div className="flex h-[52px] items-center justify-between gap-4 border-t border-zinc-200 bg-zinc-50/80 px-4 dark:border-white/10 dark:bg-white/[0.02] sm:px-6">
          <ol className="flex items-center gap-3 sm:gap-5">
            {STEPS.map((s, i) => {
              const k = i + 1;
              const state = step > k ? "done" : step === k ? "doing" : "todo";
              return (
                <li key={s.label} className="flex items-center gap-1.5">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-300 ${
                      state === "done"
                        ? "bg-emerald-500 text-white"
                        : state === "doing"
                        ? "text-[var(--acc)] dark:text-[var(--acc-d)]"
                        : "border border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {state === "done" && <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />}
                    {state === "doing" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                  </span>
                  <span
                    className={`text-xs ${state === "doing" ? "inline text-zinc-900 dark:text-white" : "hidden sm:inline"} ${
                      state === "done" ? "text-zinc-600 dark:text-zinc-400" : state === "todo" ? "text-zinc-400 dark:text-zinc-600" : ""
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
          {ready ? (
            <Link
              href="/register"
              className="lm-rise-in group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0066B2] dark:text-[#38BDF8]"
            >
              Publish it free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : (
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">No sign-up</span>
          )}
        </div>
      </div>

      <p className="relative mt-4 text-center text-xs text-zinc-500">
        {demoing ? "Running a demo. Click the box to try your own topic. " : ""}
        Instant preview from a template. After sign-up, the AI writes copy specific to your niche.
      </p>

      {userTook && (
        <p className="sr-only" aria-live="polite">
          {ready ? `Preview ready: ${headline}` : ""}
        </p>
      )}
    </div>
  );
}

function StatusPill({ building, ready, demoing }: { building: boolean; ready: boolean; demoing: boolean }) {
  const base = "hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider sm:inline-flex";
  if (building)
    return (
      <span className={`${base} bg-[var(--acc-10)] text-[var(--acc)] dark:bg-[var(--accd-10)] dark:text-[var(--acc-d)]`}>
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Building
      </span>
    );
  if (ready)
    return (
      <span className={`${base} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready
      </span>
    );
  if (demoing)
    return (
      <span className={`${base} bg-zinc-200/70 text-zinc-500 dark:bg-white/10 dark:text-zinc-400`}>
        <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" /> Demo
      </span>
    );
  return <span className={`${base} bg-zinc-200/70 text-zinc-500 dark:bg-white/10 dark:text-zinc-400`}>Draft</span>;
}

// Figma-style selection frame around the block currently being built.
function Block({ active, label, className = "", children }: { active: boolean; label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative ${className}`}>
      {active && (
        <span aria-hidden="true" className="lm-select pointer-events-none absolute -inset-2.5 z-10 rounded-lg border border-[var(--acc)] dark:border-[var(--acc-d)]">
          <span className="absolute -top-[22px] left-0 whitespace-nowrap rounded bg-[var(--acc)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white dark:bg-[var(--acc-d)] dark:text-zinc-950">
            {label}
          </span>
          {["-left-[3px] -top-[3px]", "-right-[3px] -top-[3px]", "-left-[3px] -bottom-[3px]", "-right-[3px] -bottom-[3px]"].map((pos) => (
            <span key={pos} className={`absolute h-1.5 w-1.5 border border-[var(--acc)] bg-white dark:border-[var(--acc-d)] dark:bg-[#0E0E11] ${pos}`} />
          ))}
        </span>
      )}
      {children}
    </div>
  );
}

function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-zinc-100 dark:bg-white/[0.06] ${className}`} />;
}

function Cover({ title, kind, gradient }: { title: string; kind: string; gradient: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[250px] sm:max-w-[260px]">
      <div className="lm-float">
        <div className="lm-rise-in">
          {/* Deliverable Resource Card */}
          <div
            className="relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-[0_25px_50px_-15px_rgba(0,0,0,0.6)] border border-white/20 transition-transform duration-300 hover:scale-[1.02]"
            style={{ background: gradient }}
          >
            {/* Ambient geometric decorative circles & shine */}
            <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/15" aria-hidden="true" />
            <span className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full border border-white/15" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-white/10 to-transparent" aria-hidden="true" />

            {/* Top Badge: Dynamic kind (Cheat Sheet, Checklist, Guide) */}
            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-white shadow-xs border border-white/20">
                <Sparkles className="h-2.5 w-2.5 text-amber-300" aria-hidden="true" />
                {kind}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/75 font-semibold">
                Instant Access
              </span>
            </div>

            {/* Middle: Title & Accent */}
            <div className="relative my-auto py-2">
              <p className="line-clamp-3 text-lg font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-xl">
                {title}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-0.5 w-6 rounded-full bg-white/60" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/80">
                  Interactive Asset
                </span>
              </div>
            </div>

            {/* Bottom: Deliverable status snippet */}
            <div className="relative border-t border-white/15 pt-3">
              <div className="flex items-center justify-between text-[10px] font-medium text-white/85">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-300" strokeWidth={3} aria-hidden="true" /> Ready to share
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/60">
                  Magnets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Ground ambient shadow */}
      <span className="absolute -bottom-4 left-1/2 h-4 w-4/5 -translate-x-1/2 rounded-full bg-black/30 blur-md dark:bg-black/70" aria-hidden="true" />
    </div>
  );
}

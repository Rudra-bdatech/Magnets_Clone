"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Lock } from "lucide-react";

const SUGGESTIONS = ["Instagram growth for bakers", "Meal prep for busy parents", "Cold email for agencies", "Notion for students"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Sentence case: keep the visitor's wording, only capitalise the start of the headline.
const HEADLINES = [
  (t: string) => `The ${t} checklist`,
  (t: string) => `${cap(t)}: the 1-page cheat sheet`,
  (t: string) => `The beginner's guide to ${t}`,
];

const BULLETS = [
  (t: string) => `The 5 mistakes that slow down ${t.toLowerCase()}, and the fix for each`,
  () => "A step-by-step plan you can start today",
  () => "Copy-and-paste templates that save you hours",
];

// Lowercase the first letter so the topic reads naturally mid-headline, unless the
// first word looks like a name or acronym ("Instagram", "SEO", "LinkedIn").
const PROPER = new Set(["instagram", "notion", "linkedin", "youtube", "tiktok", "etsy", "shopify", "canva", "excel", "google", "facebook", "pinterest", "substack", "amazon", "figma", "chatgpt"]);
const midSentence = (t: string) => {
  const first = t.split(/\s+/)[0];
  if (PROPER.has(first.toLowerCase()) || /[A-Z]/.test(first.slice(1))) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
};
const slugify =(s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "your-page";
const hash = (s: string) => s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

type State = "idle" | "loading" | "done";

// A client-side preview built from templates (no API call). The copy says so,
// and the real AI generator lives behind sign-up.
export default function TryIt() {
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<{ topic: string; v: number } | null>(null);
  const timer = useRef<number>();

  const run = (value = topic) => {
    const t = value.trim().slice(0, 60);
    if (!t || state === "loading") return;
    setTopic(t);
    setState("loading");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setResult({ topic: t, v: hash(t.toLowerCase()) % HEADLINES.length });
      setState("done");
    }, 1100);
  };

  const T = result ? midSentence(result.topic) : "";

  return (
    <div className="mx-auto mt-12 grid max-w-5xl items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Input side */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] p-6"
      >
        <label htmlFor="try-topic" className="text-sm font-semibold text-zinc-900 dark:text-white">
          What&rsquo;s your freebie about?
        </label>
        <input
          id="try-topic"
          value={topic}
          maxLength={60}
          onChange={(e) => {
            setTopic(e.target.value);
            if (state === "done") setState("idle");
          }}
          placeholder="e.g. Instagram growth for bakers"
          className="mt-3 w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] px-4 py-3 text-[15px] text-zinc-900 dark:text-white outline-none transition focus:border-[#0066B2] focus:bg-white dark:focus:bg-white/[0.06] focus:ring-4 focus:ring-[#0066B2]/10"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => run(s)}
              className="rounded-full border border-zinc-200 dark:border-white/10 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-900 dark:hover:border-white/30 dark:hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!topic.trim() || state === "loading"}
          className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed ${
            state === "done" ? "bg-emerald-600" : "bg-zinc-950 dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40"
          }`}
        >
          {state === "loading" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Writing your page…
            </>
          )}
          {state === "done" && (
            <>
              <Check className="lm-pop h-4 w-4" aria-hidden="true" /> Page ready
            </>
          )}
          {state === "idle" && <>Preview my page</>}
        </button>
        <p className="mt-3 text-xs text-zinc-500">Instant preview from a template. After sign-up, the AI writes copy specific to your niche.</p>
      </form>

      {/* Preview side */}
      <div aria-live="polite" className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0e0e11] shadow-[0_30px_80px_-40px_rgba(0,40,90,0.35)]">
        <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#16161a] px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] text-zinc-500">
            <Lock className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="truncate">magnets.bdatech.in/you/{result ? slugify(result.topic) : "your-page"}</span>
          </div>
        </div>

        <div className="relative min-h-[340px] px-6 py-8 sm:px-10">
          {state === "done" && result ? (
            <div key={result.topic} className="mx-auto max-w-md text-center">
              <p className="lm-fade-in font-mono text-[10px] uppercase tracking-[0.2em] text-[#0066B2] dark:text-[#38BDF8]">Free · Instant download</p>
              <h3 className="lm-fade-in mt-3 text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-white" style={{ animationDelay: "80ms" }}>
                {HEADLINES[result.v](T)}
              </h3>
              <ul className="mx-auto mt-4 max-w-sm space-y-2 text-left text-sm text-zinc-600 dark:text-zinc-400">
                {BULLETS.map((b, i) => (
                  <li key={i} className="lm-fade-in flex gap-2" style={{ animationDelay: `${180 + i * 90}ms` }}>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0066B2] dark:text-[#38BDF8]" aria-hidden="true" />
                    {b(result.topic)}
                  </li>
                ))}
              </ul>
              <div className="lm-fade-in mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row" style={{ animationDelay: "480ms" }}>
                <span className="flex-1 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] px-3 py-2.5 text-left text-sm text-zinc-400">you@email.com</span>
                <span className="rounded-lg bg-[#0066B2] px-4 py-2.5 text-sm font-bold text-white">Send it to me</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md space-y-3 pt-2" aria-hidden="true">
              <div className={`mx-auto h-2.5 w-28 rounded bg-zinc-100 dark:bg-white/[0.06] ${state === "loading" ? "animate-pulse" : ""}`} />
              <div className={`mx-auto h-7 w-4/5 rounded bg-zinc-100 dark:bg-white/[0.06] ${state === "loading" ? "animate-pulse" : ""}`} />
              <div className={`mx-auto h-7 w-3/5 rounded bg-zinc-100 dark:bg-white/[0.06] ${state === "loading" ? "animate-pulse" : ""}`} />
              <div className="space-y-2 pt-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`mx-auto h-3 w-3/4 rounded bg-zinc-100 dark:bg-white/[0.06] ${state === "loading" ? "animate-pulse" : ""}`} />
                ))}
              </div>
              <div className="mx-auto mt-6 h-10 w-3/4 rounded-lg bg-zinc-100 dark:bg-white/[0.06]" />
              {state === "idle" && <p className="pt-4 text-center text-sm text-zinc-400">Your page appears here.</p>}
            </div>
          )}
        </div>

        {state === "done" && (
          <div className="lm-fade-in flex flex-col items-center justify-between gap-3 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] px-6 py-4 sm:flex-row" style={{ animationDelay: "600ms" }}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Like it? This takes about a minute to make real.</p>
            <Link href="/register" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066B2] dark:text-[#38BDF8]">
              Publish it free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

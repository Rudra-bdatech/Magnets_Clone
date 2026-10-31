"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Lock, X, Check, MoveHorizontal } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "./use-in-view";

function BrowserBar({ url, secure }: { url: string; secure?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#16161a] px-4 py-2.5">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        {secure && <Lock className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />}
        <span className="truncate">{url}</span>
      </div>
    </div>
  );
}

function Note({ tone, children }: { tone: "bad" | "good"; children: React.ReactNode }) {
  const bad = tone === "bad";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
        bad
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300"
      }`}
    >
      {bad ? <X className="h-3 w-3" aria-hidden="true" /> : <Check className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

function BeforePane() {
  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-100 dark:bg-[#111114]">
      <BrowserBar url="drive.example.com/file/d/1xA9fQ…/view" />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-14 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-400 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <FileText className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p className="font-mono text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 break-all">Insta-Growth-Checklist-FINAL-v3.pdf</p>
          <p className="mt-1 text-[11px] text-zinc-400">2.4 MB · Shared via link</p>
        </div>
        <span className="rounded-md bg-zinc-300/70 px-4 py-2 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          Download
        </span>
        <div className="mt-2 flex max-w-sm flex-wrap justify-center gap-2">
          <Note tone="bad">No email captured</Note>
          <Note tone="bad">No follow-up</Note>
          <Note tone="bad">No idea who downloaded</Note>
        </div>
      </div>
    </div>
  );
}

function AfterPane() {
  return (
    <div className="absolute inset-0 flex flex-col bg-white dark:bg-[#0c0c0f]">
      <BrowserBar url="get.yourbrand.com/instagram-checklist" secure />
      <div className="relative flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0066B2] dark:text-[#38BDF8]">Free · 21-point checklist</p>
          <p className="mt-2 text-xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Grow your bakery on Instagram <span className="font-instrument italic font-normal">without</span> posting daily
          </p>
          <ul className="mx-auto mt-3 hidden sm:block max-w-xs space-y-1 text-left text-xs text-zinc-600 dark:text-zinc-400">
            <li>— The 3 post types that bring walk-ins</li>
            <li>— A 15-minute weekly content routine</li>
            <li>— Captions that sell without sounding salesy</li>
          </ul>
          <div className="mx-auto mt-4 flex max-w-sm flex-col sm:flex-row gap-2">
            <span className="flex-1 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] px-3 py-2.5 text-left text-xs text-zinc-400">you@bakery.com</span>
            <span className="rounded-lg bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white">Send it to me</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Note tone="good">Email captured</Note>
            <Note tone="good">Day 2 follow-up queued</Note>
            <Note tone="good">Synced to Kit</Note>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BeforeAfter() {
  // Starts fully on "before", then wipes across to "after" once in view.
  const [pos, setPos] = useState(100);
  const [touched, setTouched] = useState(false);
  const [ref, inView] = useInView({ once: true });
  const reduced = usePrefersReducedMotion();
  const touchedRef = useRef(false);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setPos(0);
      return;
    }
    const t = window.setTimeout(() => !touchedRef.current && setPos(0), 700);
    return () => clearTimeout(t);
  }, [inView, reduced]);

  const onInput = (v: number) => {
    touchedRef.current = true;
    setTouched(true);
    setPos(v);
  };

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl">
      <div className="relative aspect-[4/5] sm:aspect-[16/10] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white shadow-[0_30px_80px_-40px_rgba(0,40,90,0.35)] select-none">
        <AfterPane />
        <div
          className={`absolute inset-0 ${touched ? "" : "transition-[clip-path] duration-[1600ms] ease-[cubic-bezier(.2,.8,.2,1)]"}`}
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <BeforePane />
        </div>

        {/* Corner labels */}
        <span className="pointer-events-none absolute left-3 bottom-3 rounded-full bg-zinc-900/85 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">Before</span>
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-[#0066B2] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">After</span>

        {/* Divider + handle */}
        <div
          className={`pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ${touched ? "" : "transition-[left] duration-[1600ms] ease-[cubic-bezier(.2,.8,.2,1)]"}`}
          style={{ left: `clamp(24px, ${pos}%, calc(100% - 24px))` }}
        >
          <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-600 bg-white text-zinc-700 shadow-lg">
            <MoveHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>

        {/* Native range on top: handles mouse, touch and keyboard for free */}
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={pos}
          onChange={(e) => onInput(Number(e.target.value))}
          aria-label="Compare a shared file link with a Funnels page"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 touch-pan-y"
        />
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-500">Drag the handle to compare.</p>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";

const EVENTS = [
  { name: "alex@startup.io", action: "signed up", via: "Instagram Checklist" },
  { name: "priya@agency.co", action: "downloaded", via: "Cold Email Templates" },
  { name: "marcus@design.studio", action: "signed up", via: "Notion Planner" },
  { name: "sofia@freelance.dev", action: "signed up", via: "SEO Cheat Sheet" },
  { name: "james@saas.io", action: "downloaded", via: "Pricing Guide PDF" },
];

const INITIALS_BG = [
  "bg-[#0066B2]", "bg-emerald-600", "bg-amber-600", "bg-violet-600", "bg-rose-600",
];

export default function ActivityToast() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [eventIdx, setEventIdx] = useState(0);
  const timerRef = useRef<number>();
  const holdRef = useRef<number>();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("lm-toast-off")) {
        setDismissed(true);
        return;
      }
    } catch {}

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 4000;
      timerRef.current = window.setTimeout(() => {
        if (window.scrollY < 300) {
          scheduleNext();
          return;
        }
        const tryIt = document.getElementById("try-it");
        if (tryIt) {
          const rect = tryIt.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            scheduleNext();
            return;
          }
        }

        setVisible(true);
        holdRef.current = window.setTimeout(() => {
          setVisible(false);
          setEventIdx((i) => (i + 1) % EVENTS.length);
          scheduleNext();
        }, 4000);
      }, delay);
    };

    const initialDelay = window.setTimeout(() => scheduleNext(), 5000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timerRef.current);
      clearTimeout(holdRef.current);
    };
  }, [dismissed]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    clearTimeout(holdRef.current);
    clearTimeout(timerRef.current);
    try { sessionStorage.setItem("lm-toast-off", "1"); } catch {}
  };

  if (dismissed) return null;

  const e = EVENTS[eventIdx];
  const initial = e.name.charAt(0).toUpperCase();

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 flex max-w-xs items-start gap-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181C] px-4 py-3 shadow-xl transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${INITIALS_BG[eventIdx % INITIALS_BG.length]}`}>
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400">Example activity</p>
        <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-white truncate">{e.name} {e.action}</p>
        <p className="text-xs text-zinc-500">via {e.via} &middot; just now</p>
      </div>
      <button
        onClick={dismiss}
        className="mt-0.5 rounded-md p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
        aria-label="Dismiss notifications"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

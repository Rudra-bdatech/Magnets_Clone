"use client";

import { useEffect, useState } from "react";
import { UserPlus, Mail, MessageSquare, Send } from "lucide-react";
import { useInView, usePrefersReducedMotion } from "./use-in-view";

// What happens after one signup, replayed as a feed. Labelled as example activity.
const EVENTS = [
  { Icon: UserPlus, text: "ananya@… signed up", sub: "Bakery Instagram checklist" },
  { Icon: Mail, text: "Added to Kit", sub: "Tag: instagram-checklist" },
  { Icon: MessageSquare, text: "Posted to Slack", sub: "#new-leads" },
  { Icon: Send, text: "Checklist delivered", sub: "Day 2 follow-up scheduled" },
];

export default function LeadFeed() {
  const [ref, inView] = useInView({ rootMargin: "0px" });
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(EVENTS.length);

  useEffect(() => {
    if (!inView || reduced) return;
    setCount(1);
    const id = window.setInterval(() => setCount((c) => (c >= EVENTS.length + 2 ? 1 : c + 1)), 1100);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const shown = EVENTS.slice(0, Math.min(count, EVENTS.length));

  return (
    <div ref={ref} className="mt-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">Example activity</p>
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
        </span>
      </div>
      <ol className="min-h-[188px] space-y-2">
        {shown.map(({ Icon, text, sub }, i) => (
          <li key={text} className="lm-fade-in flex items-center gap-3 rounded-lg px-1 py-1">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                i === 0 ? "bg-[#0066B2] text-white" : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{text}</p>
              <p className="truncate text-xs text-zinc-500">{sub}</p>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">{i === 0 ? "0s" : `+${i}s`}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

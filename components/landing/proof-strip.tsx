"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/components/landing/use-in-view";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const [ref, inView] = useInView({ once: true });
  const reduced = usePrefersReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    if (reduced) {
      setValue(target);
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, target, reduced]);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className="tabular-nums">
      {value}{suffix}
    </span>
  );
}

const STATS = [
  { label: "Integrations", value: 9, suffix: "" },
  { label: "File formats", value: 5, suffix: "+" },
  { label: "Auto-SSL pages", value: 100, suffix: "%" },
];

export default function ProofStrip() {
  return (
    <div className="mx-auto mt-14 flex max-w-md items-center justify-center gap-6 sm:gap-10">
      {STATS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-6 sm:gap-10">
          {i > 0 && <div className="h-8 w-px bg-zinc-300/60 dark:bg-zinc-700/60" aria-hidden="true" />}
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              <CountUp target={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

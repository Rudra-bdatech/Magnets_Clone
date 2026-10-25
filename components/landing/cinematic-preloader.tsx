"use client";

import { useEffect, useState } from "react";
import { MagnetIcon } from "@/components/brand";

export default function CinematicPreloader() {
  const [percent, setPercent] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsRemoved(true);
      return;
    }

    // Only run once per session so refreshing doesn't get annoying
    const hasSeen = sessionStorage.getItem("lm_preloaded");
    if (hasSeen) {
      setIsRemoved(true);
      return;
    }

    const duration = 1100;
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Exponential ease-out for realistic loading speed
      const ease = 1 - Math.pow(1 - progress, 2.5);
      const val = Math.round(ease * 100);
      setPercent(val);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setTimeout(() => {
          setIsDone(true);
          sessionStorage.setItem("lm_preloaded", "true");
          // Fully remove from DOM after curtain wipe finishes
          setTimeout(() => setIsRemoved(true), 900);
        }, 150);
      }
    };

    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, []);

  if (isRemoved) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#07090e] text-white transition-transform duration-800 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isDone ? "-translate-y-full pointer-events-none" : "translate-y-0"
      }`}
    >
      {/* Subtle radial ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,178,0.25)_0%,transparent_65%)] pointer-events-none" />

      {/* Brand Icon with Pulsing Halo */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/15 p-3.5 shadow-[0_0_35px_rgba(56,189,248,0.3)]">
          <MagnetIcon className="h-full w-full text-[#38BDF8]" />
          <div className="absolute -inset-1 rounded-2xl border border-[#38BDF8]/30 animate-pulse pointer-events-none" />
        </div>

        {/* Counter */}
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
            {percent < 10 ? `0${percent}` : percent}
          </span>
          <span className="text-sm font-semibold text-[#38BDF8]">%</span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-4 h-1 w-36 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#0066B2] to-[#38BDF8] transition-all duration-75 ease-out rounded-full shadow-[0_0_12px_rgba(56,189,248,0.6)]"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          LeadMagnets
        </p>
      </div>

      {/* Bottom Curtain Fringe Sheen */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/80 to-transparent" />
    </div>
  );
}

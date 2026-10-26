"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Trash2, Undo2, X } from "lucide-react";

interface UndoDeleteToastProps {
  title: string;
  subtitle: string;
  durationMs: number;
  onUndo: () => void;
  /** Fires when the countdown runs out or the toast is dismissed: the delete should go through. */
  onCommit: () => void;
}

/**
 * "Deleted · Undo" toast. The countdown pauses while hovered or focused so the
 * user never loses the chance to undo mid-read; Ctrl/Cmd+Z undoes too.
 */
export function UndoDeleteToast({ title, subtitle, durationMs, onUndo, onCommit }: UndoDeleteToastProps) {
  const prefersReducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(durationMs);
  const remainingRef = useRef(durationMs);
  const settledRef = useRef(false);

  const settle = (fn: () => void) => {
    if (settledRef.current) return;
    settledRef.current = true;
    fn();
  };

  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      remainingRef.current = Math.max(0, remainingRef.current - (now - last));
      last = now;
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) {
        clearInterval(tick);
        settle(onCommit);
      }
    }, 100);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        settle(onUndo);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = Math.ceil(remaining / 1000);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto relative w-full sm:w-[380px] overflow-hidden rounded-2xl border border-zinc-900/10 bg-white/60 text-zinc-900 shadow-2xl shadow-black/10 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.12] dark:bg-zinc-900/40 dark:text-white dark:shadow-black/40"
    >
      <div className="flex items-center gap-3 p-3.5 pr-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
          <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-5">{title}</p>
          <p className="truncate text-[11px] font-medium leading-4 text-zinc-500 dark:text-zinc-400" title={subtitle}>
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => settle(onUndo)}
          title={`Undo (${isMac ? "⌘" : "Ctrl"}+Z)`}
          className="group flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-100 active:scale-95 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.1] cursor-pointer"
        >
          <Undo2 className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
          Undo
          <span className="ml-0.5 tabular-nums text-zinc-400 dark:text-zinc-500" aria-hidden>
            {secondsLeft}
          </span>
        </button>

        <button
          type="button"
          onClick={() => settle(onCommit)}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Countdown: how long Undo stays available */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-zinc-100 dark:bg-white/[0.04]">
        <div
          className={`h-full bg-rose-500/70 dark:bg-rose-400/70 ${prefersReducedMotion ? "" : "transition-[width] duration-100 ease-linear"}`}
          style={{ width: `${(remaining / durationMs) * 100}%` }}
        />
      </div>
    </motion.div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Loader2, X, Link2, AlertCircle, ChevronDown } from "lucide-react";
import { createTickPlayer } from "@/lib/tick-sound";

export interface UploadProgressState {
  current: number;
  total: number;
  currentFileName: string;
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  stage: "uploading" | "processing" | "done";
  bytesPerSecond: number;
}

export interface UploadQueueItem {
  name: string;
  size: number;
  status: "queued" | "active" | "done" | "failed";
}

interface UploadProgressCardProps {
  progress: UploadProgressState;
  queue: UploadQueueItem[];
  uploadWeight?: number;
  processingCeiling?: number;
  fileIcon: ReactNode;
  fileTileClass?: string;
  formatBytes: (bytes: number, decimals?: number) => string;
  onCancel: () => void;
  shareUrl?: string;
}

// Apple iOS Circular Progress Gauge dimensions
const RING_RADIUS = 13;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~81.68

// Apple's signature fluid iOS curve - critically damped, absolutely ZERO bounce or overshoot
const APPLE_FLUID_EASE = [0.16, 1, 0.3, 1] as const;

export function UploadProgressCard({
  progress,
  queue,
  fileIcon,
  formatBytes,
  onCancel,
  shareUrl,
}: UploadProgressCardProps) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasPlayedDoneTick = useRef(false);

  // Initialize Apple mechanical tick feedback
  const tickPlayer = useMemo(() => {
    try {
      return createTickPlayer();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(copyTimer.current);
      tickPlayer?.dispose();
    };
  }, [tickPlayer]);

  const { stage, current, total, currentFileName, loadedBytes, totalBytes, bytesPerSecond } = progress;
  const pct = Math.min(100, Math.max(0, Math.round(progress.percent)));
  const isDone = stage === "done";
  const isBatch = total > 1;

  // Sound feedback on completion
  useEffect(() => {
    if (isDone && !hasPlayedDoneTick.current) {
      hasPlayedDoneTick.current = true;
      tickPlayer?.play();
    } else if (!isDone) {
      hasPlayedDoneTick.current = false;
    }
  }, [isDone, tickPlayer]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!shareUrl) return;
    tickPlayer?.play();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    });
  };

  const toggleExpand = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    tickPlayer?.play();
    setIsExpanded((prev) => !prev);
  };

  // Ring offset calculation for Apple circular progress
  const strokeDashoffset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="fixed bottom-5 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:right-6 z-[100] flex justify-center sm:justify-end pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          borderRadius: isExpanded ? 24 : 9999,
        }}
        exit={{ opacity: 0, y: 18, scale: 0.94, transition: { duration: 0.16, ease: "easeIn" } }}
        transition={{
          borderRadius: { duration: 0.32, ease: APPLE_FLUID_EASE },
          y: { duration: 0.28, ease: APPLE_FLUID_EASE },
          scale: { duration: 0.28, ease: APPLE_FLUID_EASE },
          opacity: { duration: 0.2 },
        }}
        role="status"
        aria-live="polite"
        className="pointer-events-auto w-full sm:w-[380px] overflow-hidden border border-black/[0.08] dark:border-white/[0.14] bg-white/90 dark:bg-[#000000]/95 text-zinc-900 dark:text-white backdrop-blur-3xl backdrop-saturate-200 shadow-[0_16px_40px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.18)]"
      >
        {/* Main Apple Live Activity Header Bar - Always persistently mounted for zero jump */}
        <div
          onClick={() => isBatch && toggleExpand()}
          className={`flex items-center gap-3 pl-2 pr-2.5 py-2 ${
            isBatch ? "cursor-pointer select-none" : ""
          }`}
        >
          {/* Left Badge: 100% Concentric Circle matching the outer semicircle cap */}
          <div
            className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
              isDone
                ? "bg-emerald-500 text-zinc-950 shadow-[0_0_16px_rgba(16,185,129,0.35)] scale-100"
                : "bg-zinc-100 text-[#0066B2] border border-zinc-200/80 dark:bg-white/[0.08] dark:text-sky-400 dark:border-white/[0.10]"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDone ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 24 }}
                  className="flex items-center justify-center"
                >
                  <Check className="h-4 w-4 stroke-[3] text-zinc-950" />
                </motion.div>
              ) : (
                <motion.div
                  key="file"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  {fileIcon}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center Details: File name + Live Apple Subtext */}
          <div className="min-w-0 flex-1 px-1">
            <div className="flex items-center gap-1.5">
              {isBatch && (
                <span className="shrink-0 rounded-full bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-white/70">
                  {current}/{total}
                </span>
              )}
              <p
                className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white tracking-[-0.015em] leading-snug"
                title={isExpanded ? "Upload Queue" : currentFileName}
              >
                {isExpanded ? "Upload Queue" : currentFileName}
              </p>
            </div>

            <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] leading-tight tabular-nums font-medium">
              {isDone ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  {isBatch ? `${total} files uploaded` : "Ready in Assets"}
                </span>
              ) : isExpanded ? (
                <span className="text-zinc-500 dark:text-white/50">
                  Uploading {current} of {total} files
                </span>
              ) : stage === "processing" ? (
                <span className="text-amber-600 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Saving securely…</span>
                </span>
              ) : (
                <>
                  <span className="text-zinc-500 dark:text-white/60">
                    {formatBytes(loadedBytes, 1)} / {formatBytes(totalBytes, 1)}
                  </span>
                  <span className="text-zinc-300 dark:text-white/30">·</span>
                  <span className="text-[#0066B2] dark:text-[#38BDF8] font-semibold">{pct}%</span>
                  {bytesPerSecond > 0 && (
                    <>
                      <span className="text-zinc-300 dark:text-white/30 hidden xs:inline">·</span>
                      <span className="text-zinc-400 dark:text-white/40 hidden xs:inline">
                        {formatBytes(bytesPerSecond, 1)}/s
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Action: Concentric Progress Ring matching the outer semicircle cap */}
          <div className="flex shrink-0 items-center gap-1.5">
            {isDone ? (
              <div className="flex items-center gap-1.5">
                {shareUrl && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all cursor-pointer ${
                      copied
                        ? "bg-emerald-500 text-zinc-950 shadow-sm"
                        : "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-900/10 shadow-xs dark:bg-white/15 dark:hover:bg-white/25 dark:text-white dark:border-white/15"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="h-3 w-3" />
                        <span>Copy link</span>
                      </>
                    )}
                  </motion.button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                  aria-label="Dismiss"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/15 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                {/* Apple Circular Progress Ring SVG */}
                <svg className="h-9 w-9 -rotate-90 transform" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r={RING_RADIUS}
                    fill="none"
                    className="stroke-black/[0.08] dark:stroke-white/[0.12]"
                    strokeWidth="2.5"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r={RING_RADIUS}
                    fill="none"
                    className="stroke-[#0066B2] dark:stroke-[#0A84FF]"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    animate={{ strokeDashoffset }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 220, damping: 28 }
                    }
                  />
                </svg>

                {/* Center Cancel Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                  aria-label="Cancel upload"
                  title="Cancel upload"
                  className="group absolute flex h-5 w-5 items-center justify-center rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="h-2.5 w-2.5 text-zinc-500 group-hover:text-zinc-800 dark:text-white/70 dark:group-hover:text-white transition-colors" />
                </button>
              </div>
            )}

            {/* Batch expand chevron */}
            {isBatch && (
              <button
                type="button"
                onClick={toggleExpand}
                aria-label={isExpanded ? "Collapse queue" : "Expand queue"}
                className="text-zinc-400 hover:text-zinc-700 dark:text-white/40 dark:hover:text-white transition cursor-pointer p-1"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ease-out ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Queue Drawer: Smoothly unrolls downward with Apple fluid curve (ZERO overshoot) */}
        <AnimatePresence initial={false}>
          {isBatch && isExpanded && (
            <motion.div
              key="queue-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.32, ease: APPLE_FLUID_EASE },
                opacity: { duration: 0.22, ease: APPLE_FLUID_EASE },
              }}
              className="overflow-hidden border-t border-black/[0.06] dark:border-white/[0.08]"
            >
              <div
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="p-2.5 space-y-1.5 max-h-[170px] overflow-y-auto overscroll-contain touch-pan-y [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.4)_transparent]"
              >
                {queue.map((item, idx) => {
                  const isCurrent = idx === current - 1 && !isDone;
                  const isDoneItem = item.status === "done";
                  const isFailed = item.status === "failed";

                  return (
                    <div
                      key={item.name + idx}
                      className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl transition-colors ${
                        isCurrent
                          ? "bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.04] dark:border-white/[0.08]"
                          : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isDoneItem ? (
                          <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#0066B2] dark:text-[#38BDF8]" />
                        ) : isFailed ? (
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                        ) : (
                          <span className="mx-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black/20 dark:bg-white/20" />
                        )}

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[12px] leading-tight ${
                              isCurrent
                                ? "text-zinc-900 dark:text-white font-semibold"
                                : isDoneItem
                                ? "text-zinc-600 dark:text-white/80 font-medium"
                                : "text-zinc-400 dark:text-white/40"
                            } ${isFailed ? "line-through text-rose-500/80" : ""}`}
                          >
                            {item.name}
                          </p>
                          {isCurrent && (
                            <p className="text-[10.5px] leading-tight text-zinc-500 dark:text-white/50 tabular-nums mt-0.5">
                              {stage === "processing" ? (
                                <span className="text-amber-600 dark:text-amber-300 font-medium">
                                  Saving securely…
                                </span>
                              ) : (
                                <span>
                                  {formatBytes(loadedBytes, 1)} / {formatBytes(totalBytes, 1)} · {pct}%
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 tabular-nums text-[10.5px] text-zinc-400 dark:text-white/40">
                        {formatBytes(item.size, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

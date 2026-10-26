"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Loader2, X, Link2, AlertCircle } from "lucide-react";

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
  uploadWeight: number;
  processingCeiling: number;
  fileIcon: ReactNode;
  fileTileClass: string;
  formatBytes: (bytes: number, decimals?: number) => string;
  onCancel: () => void;
  shareUrl?: string;
}

function fmtEta(s: number) {
  return s < 60 ? `${s}s left` : `${Math.floor(s / 60)}m ${s % 60}s left`;
}

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
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const { stage, current, total, currentFileName, loadedBytes, totalBytes, bytesPerSecond } = progress;
  const pct = Math.round(progress.percent);
  const isDone = stage === "done";
  const isBatch = total > 1;
  const eta =
    stage === "uploading" && bytesPerSecond > 0 ? Math.ceil((totalBytes - loadedBytes) / bytesPerSecond) : null;

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    });
  };

  const status = isDone
    ? isBatch
      ? `${total} files uploaded`
      : "Uploaded and ready to share"
    : stage === "processing"
    ? "Saving securely…"
    : [
        `${formatBytes(loadedBytes, 1)} of ${formatBytes(totalBytes, 1)}`,
        bytesPerSecond > 0 ? `${formatBytes(bytesPerSecond, 1)}/s` : null,
        eta ? fmtEta(eta) : null,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      role="status"
      aria-live="polite"
      className="fixed bottom-20 inset-x-3 sm:inset-x-auto sm:bottom-24 sm:right-5 z-50 w-auto sm:w-[340px] overflow-hidden rounded-2xl border border-zinc-900/10 bg-white/60 p-3.5 text-zinc-900 shadow-xl shadow-black/10 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.12] dark:bg-zinc-900/40 dark:text-white dark:shadow-black/40"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
            isDone ? "bg-emerald-500/15" : "bg-sky-500/10"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDone ? (
              <motion.span
                key="ok"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <Check className="h-5 w-5 stroke-[2.5] text-emerald-500 dark:text-emerald-400" />
              </motion.span>
            ) : (
              <motion.span key="file" exit={{ scale: 0.4, opacity: 0 }}>
                {fileIcon}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-5" title={currentFileName}>
            {currentFileName}
          </p>
          <p
            className={`mt-0.5 flex items-center gap-1.5 truncate text-[12px] leading-4 tabular-nums ${
              isDone ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {stage === "processing" && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
            <span className="truncate">{status}</span>
          </p>
        </div>

        {isDone ? (
          shareUrl && !isBatch && (
            <button
              onClick={copy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-[12px] font-semibold text-white transition active:scale-95 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          )
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <span className="w-9 text-right text-[13px] font-semibold tabular-nums">{pct}%</span>
            <button
              onClick={onCancel}
              aria-label="Cancel upload"
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {!isDone && (
          <motion.div
            key="bar"
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3.5 overflow-hidden"
          >
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label={`Uploading ${currentFileName}`}
              className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/15"
            >
              <motion.div
                className="relative h-full overflow-hidden rounded-full bg-sky-500 dark:bg-sky-400"
                initial={false}
                animate={{ width: `${Math.max(pct, 2)}%` }}
                transition={{ ease: "easeOut", duration: 0.3 }}
              >
                {stage === "processing" && !reduced && (
                  <motion.div
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "300%" }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isBatch && !isDone && (
        <div className="mt-3 border-t border-zinc-100 pt-2.5 dark:border-white/10">
          <div className="mb-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            File {current} of {total}
          </div>
          <ul className="max-h-[72px] space-y-1 overflow-y-auto">
            {queue
              .filter((q) => q.status !== "active")
              .map((q) => (
                <li key={q.name + q.size} className="flex items-center gap-2 text-[12px]">
                  {q.status === "done" ? (
                    <Check className="h-3 w-3 shrink-0 stroke-[3] text-emerald-500" />
                  ) : q.status === "failed" ? (
                    <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />
                  ) : (
                    <span className="mx-[4px] h-1 w-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate text-zinc-500 dark:text-zinc-400 ${
                      q.status === "failed" ? "line-through" : ""
                    }`}
                  >
                    {q.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500">
                    {formatBytes(q.size, 1)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

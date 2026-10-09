"use client";

import React, { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  MoreVertical,
  Zap,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
} from "lucide-react";
import StatusBadge from "@/components/dashboard/status-badge";
import { AppleCheckbox } from "@/components/leads/AppleCheckbox";
import type { Sequence, MagnetPage } from "@/lib/data";

interface MobileSequenceCardProps {
  seq: Sequence;
  attachedPage?: MagnetPage | null;
  variant?: "card" | "list";
  isChecked?: boolean;
  isSelectMode?: boolean;
  onToggleCheck?: (id: string, e?: React.MouseEvent) => void;
  onOpenMobileActions: (seq: Sequence) => void;
  onToggleStatus: (seq: Sequence, e: React.MouseEvent) => void;
}

export const MobileSequenceCard = memo(function MobileSequenceCard({
  seq,
  attachedPage,
  variant = "card",
  isChecked = false,
  isSelectMode = false,
  onToggleCheck,
  onOpenMobileActions,
  onToggleStatus,
}: MobileSequenceCardProps) {
  const router = useRouter();
  const { signedUp, delivered, opened, replied } = seq.stats;
  const completed = seq.stats.completed || (delivered > 0 ? delivered : 0);
  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
  const linkHref = `/dashboard/sequences/${seq.id}`;
  const isStandalone = !seq.pageId || !attachedPage;
  const attachedName =
    attachedPage?.name || seq.name.replace(" Follow-up", "").replace(" (Copy)", "");
  const totalStepsCount = isStandalone ? seq.emails.length : seq.emails.length + 1;

  const handleCardClick = () => {
    if (isSelectMode && onToggleCheck) {
      onToggleCheck(seq.id);
    } else {
      router.push(linkHref);
    }
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenMobileActions(seq);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCheck) {
      onToggleCheck(seq.id, e);
    }
  };

  /* ========================================================================= */
  /* COMPACT MOBILE LIST VIEW ROW                                              */
  /* ========================================================================= */
  if (variant === "list") {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative rounded-xl border p-3 transition-all duration-200 active:scale-[0.99] select-none cursor-pointer flex items-center justify-between gap-2.5 ${
          isChecked
            ? "border-[#0066B2] dark:border-[#38BDF8] bg-blue-50/60 dark:bg-[#0066B2]/15 ring-1 ring-[#0066B2]/30 shadow-xs"
            : "border-zinc-200/80 bg-white dark:border-[#282832] dark:bg-[#18181C] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs"
        }`}
      >
        {/* Left: Checkbox (if in select mode), Icon & Sequence Info */}
        <div className="flex items-center min-w-0 flex-1 gap-2.5">
          {/* Animated Checkbox */}
          <AnimatePresence initial={false}>
            {(isSelectMode || isChecked) && (
              <motion.div
                initial={{ opacity: 0, width: 0, marginRight: 0 }}
                animate={{ opacity: 1, width: 22, marginRight: 2 }}
                exit={{ opacity: 0, width: 0, marginRight: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                onClick={handleCheckboxClick}
                className="flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
              >
                <AppleCheckbox
                  checked={isChecked}
                  onChange={() => onToggleCheck && onToggleCheck(seq.id)}
                  title={isChecked ? "Deselect sequence" : "Select sequence"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-blue-100 dark:border-blue-900/30">
            <Rocket className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                {seq.name}
              </h3>
              {isStandalone ? (
                <span className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-950/50 text-[#0066B2] dark:text-[#38BDF8] border border-blue-200/60 dark:border-blue-900/40 text-[8.5px] font-bold px-1 py-0.2 shrink-0">
                  Standalone
                </span>
              ) : (
                <span className="inline-flex items-center rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 text-[8.5px] font-bold px-1 py-0.2 shrink-0">
                  Lead Magnet
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-zinc-500 dark:text-zinc-400">
              <span className="truncate max-w-[130px]">
                {isStandalone ? "Standalone" : attachedName}
              </span>
              <span>·</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                {totalStepsCount} {totalStepsCount === 1 ? "step" : "steps"}
              </span>
              <span>·</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                {openRate}% open
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <StatusBadge status={seq.status} />

          <button
            type="button"
            onClick={handleMoreClick}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition cursor-pointer active:scale-95"
            title="Sequence options"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* FULL MOBILE CARD VIEW (Resend / Loops Bento Style)                        */
  /* ========================================================================= */
  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl border transition-all duration-200 active:scale-[0.99] select-none cursor-pointer flex flex-col justify-between overflow-hidden ${
        isChecked
          ? "border-[#0066B2] dark:border-[#38BDF8] bg-blue-50/50 dark:bg-[#0066B2]/15 ring-2 ring-[#0066B2]/30 shadow-sm"
          : "border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#141417] hover:border-zinc-300 dark:hover:border-white/20 shadow-2xs"
      }`}
    >
      {/* Top Header Row: Animated Checkbox, Icon, Title, Status & 3-Dot Actions */}
      <div className="p-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start min-w-0 flex-1">
            {/* Animated Checkbox */}
            <AnimatePresence initial={false}>
              {(isSelectMode || isChecked) && (
                <motion.div
                  initial={{ opacity: 0, width: 0, marginRight: 0 }}
                  animate={{ opacity: 1, width: 22, marginRight: 10 }}
                  exit={{ opacity: 0, width: 0, marginRight: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  onClick={handleCheckboxClick}
                  className="flex h-9 items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                >
                  <AppleCheckbox
                    checked={isChecked}
                    onChange={() => onToggleCheck && onToggleCheck(seq.id)}
                    title={isChecked ? "Deselect sequence" : "Select sequence"}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rocket Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF6FF] to-blue-50 text-[#0066B2] dark:from-[#0066B2]/20 dark:to-blue-950/40 dark:text-[#38BDF8] border border-blue-100/60 dark:border-blue-900/40">
              <Rocket className="h-4 w-4" />
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1 ml-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                  {seq.name}
                </h3>
                {isStandalone ? (
                  <span className="inline-flex items-center rounded bg-blue-50/80 dark:bg-blue-950/40 text-[#0066B2] dark:text-[#38BDF8] border border-blue-200/50 dark:border-blue-900/40 text-[9px] font-semibold px-1.5 py-0.2 shrink-0">
                    Standalone
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 text-[9px] font-semibold px-1.5 py-0.2 shrink-0">
                    Lead Magnet
                  </span>
                )}
              </div>

              <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                {isStandalone ? (
                  <span>Standalone workflow</span>
                ) : (
                  <>
                    Attached to{" "}
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                      "{attachedName}"
                    </span>
                  </>
                )}{" "}
                · {totalStepsCount} {totalStepsCount === 1 ? "step" : "steps"}
              </p>
            </div>
          </div>

          {/* Status Badge & 3-Dot Options */}
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={seq.status} />

            <button
              type="button"
              onClick={handleMoreClick}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition cursor-pointer active:scale-95"
              title="Sequence options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Visual Step Timeline Node Preview */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {seq.pageId ? (
            <>
              {/* Attached Sequence: Step 1 Instant Lead Magnet Delivery */}
              <div className="flex items-center gap-1 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <Zap className="h-3 w-3" />
                <span className="truncate">Instant</span>
              </div>

              {seq.emails &&
                seq.emails.slice(0, 2).map((email, idx) => (
                  <div key={email.id || idx} className="flex items-center gap-1 shrink-0">
                    <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-100/80 dark:bg-white/[0.05] border border-zinc-200/50 dark:border-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[125px]">
                      <Clock className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8]" />
                      <span className="truncate">{email.delayLabel || `Step ${idx + 2}`}</span>
                    </div>
                  </div>
                ))}
              {seq.emails && seq.emails.length > 2 && (
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 px-1">
                  +{seq.emails.length - 2} more
                </span>
              )}
            </>
          ) : (
            <>
              {/* Standalone Sequence */}
              {seq.emails && seq.emails.length > 0 ? (
                <>
                  {seq.emails.slice(0, 3).map((email, idx) => (
                    <div key={email.id || idx} className="flex items-center gap-1 shrink-0">
                      {idx > 0 && <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />}
                      <div
                        className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium max-w-[130px] ${
                          idx === 0
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold"
                            : "bg-zinc-100/80 dark:bg-white/[0.05] border border-zinc-200/50 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {idx === 0 ? (
                          <Zap className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8]" />
                        )}
                        <span className="truncate">
                          {email.delayLabel || (idx === 0 ? "Instant" : `Step ${idx + 1}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {seq.emails.length > 3 && (
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 px-1">
                      +{seq.emails.length - 3} more
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] text-zinc-400 font-medium italic">
                  No email steps added yet
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom Performance Metrics Grid */}
      <div className="px-3.5 py-2.5 border-t border-zinc-100 dark:border-white/[0.05] bg-zinc-50/50 dark:bg-white/[0.01] flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none">
              Signups
            </span>
            <span className="font-bold text-zinc-900 dark:text-white tabular-nums text-xs mt-0.5 inline-block">
              {signedUp.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none">
              Delivered
            </span>
            <span className="font-bold text-zinc-900 dark:text-white tabular-nums text-xs mt-0.5 inline-block">
              {delivered.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none">
              Open Rate
            </span>
            <span className={`font-bold tabular-nums text-xs mt-0.5 inline-block ${
              openRate > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"
            }`}>
              {openRate}%
            </span>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] flex items-center gap-0.5 shrink-0">
          Flow <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
});

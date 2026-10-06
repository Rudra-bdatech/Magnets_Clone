"use client";

import React, { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { Sequence, MagnetPage } from "@/lib/data";

interface MobileSequenceCardProps {
  seq: Sequence;
  attachedPage?: MagnetPage | null;
  variant?: "card" | "list";
  onOpenMobileActions: (seq: Sequence) => void;
  onToggleStatus: (seq: Sequence, e: React.MouseEvent) => void;
}

export const MobileSequenceCard = memo(function MobileSequenceCard({
  seq,
  attachedPage,
  variant = "card",
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
    router.push(linkHref);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenMobileActions(seq);
  };

  /* ========================================================================= */
  /* COMPACT MOBILE LIST VIEW ROW                                              */
  /* ========================================================================= */
  if (variant === "list") {
    return (
      <div
        onClick={handleCardClick}
        className="group relative rounded-xl border border-zinc-200/80 bg-white dark:border-[#282832] dark:bg-[#18181C] p-3 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 active:scale-[0.99] select-none cursor-pointer flex items-center justify-between gap-2.5"
      >
        {/* Left: Icon & Sequence Info */}
        <div className="flex items-center min-w-0 flex-1 gap-2.5">
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
  /* FULL MOBILE CARD VIEW                                                     */
  /* ========================================================================= */
  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-2xl border border-zinc-200/80 bg-white dark:border-[#282832] dark:bg-[#18181C] p-3.5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 active:scale-[0.99] select-none cursor-pointer flex flex-col justify-between"
    >
      {/* Top Header Row: Icon, Title, Status & 3-Dot Actions */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start min-w-0 flex-1">
          {/* Rocket Icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-blue-100 dark:border-blue-900/30">
            <Rocket className="h-4 w-4" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 ml-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                {seq.name}
              </h3>
              {isStandalone ? (
                <span className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-950/50 text-[#0066B2] dark:text-[#38BDF8] border border-blue-200/60 dark:border-blue-900/40 text-[9px] font-bold px-1.5 py-0.5 shrink-0">
                  Standalone
                </span>
              ) : (
                <span className="inline-flex items-center rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 text-[9px] font-bold px-1.5 py-0.5 shrink-0">
                  Lead Magnet
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              {isStandalone ? (
                <span>Standalone automation flow</span>
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
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-white/[0.02] p-2 scrollbar-none">
        {seq.pageId ? (
          <>
            {/* Attached Sequence: Step 1 Instant Lead Magnet Delivery */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] shadow-2xs">
                <Zap className="h-3 w-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="font-extrabold text-emerald-950 dark:text-emerald-200 truncate">
                  1. Instant Delivery
                </span>
              </div>
            </div>

            {seq.emails &&
              seq.emails.slice(0, 2).map((email, idx) => (
                <div key={email.id || idx} className="flex items-center gap-1 shrink-0">
                  <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
                  <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-white/10 px-2 py-0.5 text-[10px] shadow-2xs max-w-[125px]">
                    <Clock className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                    <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                      {idx + 2}. {email.delayLabel || `Follow-up #${idx + 1}`}
                    </span>
                  </div>
                </div>
              ))}
            {seq.emails && seq.emails.length > 2 && (
              <span className="rounded-lg bg-zinc-200/70 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
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
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] shadow-2xs max-w-[130px] ${
                        idx === 0
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60"
                          : "bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-white/10"
                      }`}
                    >
                      {idx === 0 ? (
                        <Zap className="h-3 w-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                      )}
                      <span
                        className={`truncate font-medium ${
                          idx === 0
                            ? "font-extrabold text-emerald-950 dark:text-emerald-200"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {idx + 1}. {email.delayLabel || (idx === 0 ? "Instantly" : `Follow-up #${idx}`)}
                      </span>
                    </div>
                  </div>
                ))}
                {seq.emails.length > 3 && (
                  <span className="rounded-lg bg-zinc-200/70 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
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

      {/* Bottom Performance Metrics Grid */}
      <div className="mt-3 grid grid-cols-4 divide-x divide-zinc-100 dark:divide-white/5 rounded-xl border border-zinc-100 dark:border-white/5 bg-[#F9F9FB] dark:bg-[#141417] text-center w-full">
        <Link
          href={`/dashboard/leads?search=${encodeURIComponent(attachedName)}`}
          onClick={(e) => e.stopPropagation()}
          className="px-1 py-2 hover:bg-zinc-100/60 dark:hover:bg-white/5 transition rounded-l-xl"
          title="View signed up leads"
        >
          <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight truncate">
            {signedUp.toLocaleString()}
          </p>
          <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            Signups
          </p>
        </Link>

        <div className="px-1 py-2">
          <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight truncate">
            {delivered.toLocaleString()}
          </p>
          <p className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            Delivered
          </p>
        </div>

        <div className="px-1 py-2">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 leading-tight truncate">
            {openRate}%
          </p>
          <p className="text-[9px] font-medium text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
            Open Rate
          </p>
        </div>

        <div className="px-1 py-2">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight truncate">
            {completed.toLocaleString()}
          </p>
          <p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
            Completed
          </p>
        </div>
      </div>
    </div>
  );
});

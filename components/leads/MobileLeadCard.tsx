"use client";

import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Eye,
  Trash2,
  Lock,
  Upload,
  Sparkles,
  Linkedin,
  Check,
  Calendar,
  Layers,
} from "lucide-react";
import type { Lead } from "@/lib/data";

interface MobileLeadCardProps {
  lead: Lead;
  isSelected: boolean;
  isSelectionMode: boolean;
  isLockedPdf: boolean;
  isManual: boolean;
  isLinkedIn?: boolean;
  sequenceStatusNode: React.ReactNode;
  formattedDate: string;
  onToggleSelect: (id: string) => void;
  onEnterSelectionMode: (id: string) => void;
  onViewDetails: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onCopyEmail: (email: string) => void;
}

export const MobileLeadCard = memo(function MobileLeadCard({
  lead,
  isSelected,
  isSelectionMode,
  isLockedPdf,
  isManual,
  isLinkedIn,
  sequenceStatusNode,
  formattedDate,
  onToggleSelect,
  onEnterSelectionMode,
  onViewDetails,
  onDelete,
  onCopyEmail,
}: MobileLeadCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyEmail(lead.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleSelect(lead.id);
    } else {
      onViewDetails(lead);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSelectionMode) {
      onEnterSelectionMode(lead.id);
    } else {
      onToggleSelect(lead.id);
    }
  };

  const displayName = lead.name && lead.name !== lead.email.split("@")[0] ? lead.name : "";
  const initials = (lead.name || lead.email || "U").slice(0, 2).toUpperCase();

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer active:scale-[0.99] select-none ${
        isSelected
          ? "border-[#0066B2] bg-[#EFF6FF] dark:border-[#38BDF8] dark:bg-[#0066B2]/15 shadow-sm"
          : "border-zinc-200/80 bg-white dark:border-[#282832] dark:bg-[#18181C] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs"
      }`}
    >
      {/* Top Header Row: Animated Checkbox, Avatar, Name/Email & Gate Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start min-w-0 flex-1">
          {/* Animated Checkbox in Selection Mode */}
          <AnimatePresence initial={false}>
            {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, width: 0, marginRight: 0, scale: 0.6 }}
                animate={{ opacity: 1, width: 22, marginRight: 10, scale: 1 }}
                exit={{ opacity: 0, width: 0, marginRight: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(lead.id);
                }}
                className="flex h-9 items-center justify-center shrink-0 overflow-hidden cursor-pointer"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150 ${
                    isSelected
                      ? "border-[#0066B2] bg-[#0066B2] text-white dark:border-[#38BDF8] dark:bg-[#38BDF8] dark:text-zinc-900 shadow-2xs"
                      : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#202026] hover:border-[#0066B2]"
                  }`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.2, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar with tap-to-select indicator in normal mode */}
          <div
            onClick={handleAvatarClick}
            title={isSelectionMode ? "Toggle selection" : "Tap to select"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold uppercase border active:scale-95 transition-all cursor-pointer ${
              isSelected
                ? "bg-[#0066B2] text-white border-[#0066B2] dark:bg-[#38BDF8] dark:text-zinc-900"
                : isLinkedIn
                ? "bg-[#0A66C2]/10 text-[#0A66C2] dark:bg-[#0A66C2]/25 dark:text-[#38BDF8] border-[#0A66C2]/20"
                : isLockedPdf
                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20"
                : isManual
                ? "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20"
                : "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] border-[#0066B2]/20"
            }`}
          >
            {isSelected && isSelectionMode ? <Check className="h-4 w-4 stroke-[2.5]" /> : initials}
          </div>

          {/* Lead Details */}
          <div className="min-w-0 flex-1 ml-2.5">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {displayName || lead.email}
              </p>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-[#9B9085] truncate max-w-[170px]">
                {lead.email}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy Email"
                className="inline-flex items-center justify-center h-5 w-5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition shrink-0 cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Source / Gate Pill */}
        <div className="shrink-0">
          {isLinkedIn ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0A66C2]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0A66C2] dark:text-[#38BDF8] border border-[#0A66C2]/20">
              <Linkedin className="h-3 w-3" />
              <span>LinkedIn</span>
            </span>
          ) : isLockedPdf ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Lock className="h-3 w-3" />
              <span>Locked PDF</span>
            </span>
          ) : isManual ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Upload className="h-3 w-3" />
              <span>Import</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Sparkles className="h-3 w-3" />
              <span>Form</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle Context Row: Magnet Name & Sequence Status */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 max-w-[200px]">
          <Layers className="h-3 w-3 text-zinc-400 shrink-0" />
          <span
            className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate"
            title={lead.page}
          >
            {lead.page || "Direct Lead"}
          </span>
        </div>

        <div className="shrink-0">{sequenceStatusNode}</div>
      </div>

      {/* Bottom Metadata & Quick Actions Row */}
      <div className="mt-2 flex items-center justify-between pt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-zinc-400" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onViewDetails(lead)}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-200 dark:hover:bg-[#282830] transition cursor-pointer"
          >
            <Eye className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8]" />
            <span>Details</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(lead)}
            title="Delete subscriber"
            className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

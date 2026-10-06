"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Eye, Trash2, Lock, Upload, Sparkles, Linkedin } from "lucide-react";
import type { Lead } from "@/lib/data";
import { AppleCheckbox } from "./AppleCheckbox";

interface LeadTableRowProps {
  lead: Lead;
  isSelected: boolean;
  isSelectionActive?: boolean;
  isLockedPdf: boolean;
  isManual: boolean;
  isLinkedIn?: boolean;
  sequenceStatusNode: React.ReactNode;
  formattedDate: string;
  onToggleSelect: (id: string) => void;
  onViewDetails: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onCopyEmail: (email: string) => void;
}

export const LeadTableRow = memo(function LeadTableRow({
  lead,
  isSelected,
  isSelectionActive = false,
  isLockedPdf,
  isManual,
  isLinkedIn,
  sequenceStatusNode,
  formattedDate,
  onToggleSelect,
  onViewDetails,
  onDelete,
  onCopyEmail,
}: LeadTableRowProps) {
  return (
    <tr
      className={`group transition-all duration-200 ${
        isSelected
          ? "bg-gradient-to-r from-[#0066B2]/[0.08] via-[#0066B2]/[0.04] to-transparent dark:from-[#38BDF8]/15 dark:via-[#38BDF8]/[0.06] dark:to-transparent"
          : "hover:bg-zinc-50/80 dark:hover:bg-[#1F1F24]/70"
      }`}
    >
      {/* Subscriber Column with Framer Motion Spring Shift */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center min-w-0">
          {/* Animated Spring Checkbox - 100% Matching Mobile Physics */}
          <AnimatePresence initial={false}>
            {(isSelectionActive || isSelected) && (
              <motion.div
                initial={{ opacity: 0, width: 0, marginRight: 0, scale: 0.6 }}
                animate={{ opacity: 1, width: 22, marginRight: 10, scale: 1 }}
                exit={{ opacity: 0, width: 0, marginRight: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(lead.id);
                }}
                className="flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
              >
                <AppleCheckbox
                  checked={isSelected}
                  onChange={() => onToggleSelect(lead.id)}
                  title={isSelected ? "Deselect subscriber" : "Select subscriber"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Avatar with tap-to-select indicator */}
          <div
            onClick={() => onToggleSelect(lead.id)}
            title={isSelected ? "Deselect" : "Select"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-xs font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30 cursor-pointer active:scale-95 transition-transform"
          >
            {(lead.name || lead.email || "U").slice(0, 2)}
          </div>

          <div className="min-w-0 max-w-[190px] xl:max-w-[240px] ml-2.5">
            <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
              <span className="truncate" title={lead.email}>{lead.email}</span>
              <button
                type="button"
                onClick={() => onCopyEmail(lead.email)}
                title="Copy Email"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer shrink-0"
              >
                <Copy className="h-3 w-3" />
              </button>
            </p>
            {lead.name && lead.name !== lead.email.split("@")[0] && (
              <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] truncate mt-0.5" title={lead.name}>
                {lead.name}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Source / Gate Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">
        {isLinkedIn ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2]/10 px-2 py-0.5 text-xs font-bold text-[#0A66C2] dark:text-[#38BDF8] border border-[#0A66C2]/20 shadow-2xs">
            <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] dark:text-[#38BDF8] shrink-0" />
            <span>LinkedIn</span>
          </span>
        ) : isLockedPdf ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
            <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>Locked PDF</span>
          </span>
        ) : isManual ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
            <Upload className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Import</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>Form</span>
          </span>
        )}
      </td>

      {/* Lead Magnet Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">
        <span
          className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-[#222228] px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]"
          title={lead.page}
        >
          <span className="truncate">{lead.page}</span>
        </span>
      </td>

      {/* Signup Date Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {formattedDate}
      </td>

      {/* Sequence Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap">{sequenceStatusNode}</td>

      {/* Actions Column */}
      <td className="px-3 lg:px-4 py-3.5 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onViewDetails(lead)}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-200 dark:hover:bg-[#282830] transition cursor-pointer shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />{" "}
            View Details
          </button>
          <button
            type="button"
            onClick={() => onDelete(lead)}
            title="Delete lead"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});


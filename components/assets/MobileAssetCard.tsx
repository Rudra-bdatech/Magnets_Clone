"use client";

import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Calendar,
  Layers,
  HardDrive,
} from "lucide-react";
import type { MagnetPage } from "@/lib/data";

interface Resource {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface MobileAssetCardProps {
  resource: Resource;
  badge: {
    icon: React.ReactNode;
    bg: string;
    ext: string;
  };
  linkedPages: MagnetPage[];
  isSelected: boolean;
  isSelectionMode: boolean;
  isCopied: boolean;
  formattedSize: string;
  isEditing: boolean;
  editingName: string;
  isSavingName: boolean;
  onToggleSelect: (id: string) => void;
  onEnterSelectionMode: (id: string) => void;
  onCopyLink: (url: string, id: string) => void;
  onStartRenaming: (resource: Resource) => void;
  onEditingNameChange: (val: string) => void;
  onSaveRename: (resource: Resource) => void;
  onCancelRename: () => void;
  onDelete: (resource: Resource) => void;
}

export const MobileAssetCard = memo(function MobileAssetCard({
  resource,
  badge,
  linkedPages,
  isSelected,
  isSelectionMode,
  isCopied,
  formattedSize,
  isEditing,
  editingName,
  isSavingName,
  onToggleSelect,
  onEnterSelectionMode,
  onCopyLink,
  onStartRenaming,
  onEditingNameChange,
  onSaveRename,
  onCancelRename,
  onDelete,
}: MobileAssetCardProps) {
  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleSelect(resource.id);
    }
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSelectionMode) {
      onEnterSelectionMode(resource.id);
    } else {
      onToggleSelect(resource.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? "border-[#0066B2] bg-[#EFF6FF] dark:border-[#38BDF8] dark:bg-[#0066B2]/15 shadow-sm"
          : "border-zinc-200/80 bg-white dark:border-[#282832] dark:bg-[#18181C] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs"
      }`}
    >
      {/* Top Header Row: Checkbox, Badge Icon, Name & Ext */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Animated Checkbox in Selection Mode */}
          <AnimatePresence initial={false}>
            {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, width: 0, scale: 0.8 }}
                animate={{ opacity: 1, width: "auto", scale: 1 }}
                exit={{ opacity: 0, width: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(resource.id);
                }}
                className="flex items-center justify-center p-1 -m-1 cursor-pointer shrink-0 mt-0.5 overflow-hidden"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                    isSelected
                      ? "border-[#0066B2] bg-[#0066B2] text-white dark:border-[#38BDF8] dark:bg-[#38BDF8] dark:text-zinc-900"
                      : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-[#202026]"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Icon with Tap-to-select in normal mode */}
          <div
            onClick={handleIconClick}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${badge.bg} active:scale-95 transition cursor-pointer`}
            title={isSelectionMode ? "Toggle Selection" : "Tap to select"}
          >
            {badge.icon}
          </div>

          {/* Name & In-place Rename */}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div
                className="flex items-center gap-1.5 mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => onEditingNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveRename(resource);
                    if (e.key === "Escape") onCancelRename();
                  }}
                  autoFocus
                  disabled={isSavingName}
                  className="w-full rounded-lg border border-[#0066B2] bg-white px-2 py-1 text-xs font-semibold text-zinc-900 focus:outline-none dark:border-[#38BDF8] dark:bg-[#202026] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => onSaveRename(resource)}
                  disabled={isSavingName}
                  className="rounded-lg bg-[#0066B2] p-1.5 text-white hover:bg-[#005291] transition cursor-pointer shrink-0"
                  title="Save"
                >
                  {isSavingName ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onCancelRename}
                  disabled={isSavingName}
                  className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-[#202026] dark:text-zinc-400 transition cursor-pointer shrink-0"
                  title="Cancel"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-xs font-bold text-zinc-900 dark:text-white truncate"
                    title={resource.name}
                  >
                    {resource.name}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartRenaming(resource);
                    }}
                    className="p-0.5 text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition cursor-pointer rounded shrink-0"
                    title="Rename asset"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-[#9B9085]">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {formattedSize}
                  </span>
                  <span>·</span>
                  <span className="truncate">{resource.uploadedAt}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Extension Badge */}
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
          {badge.ext}
        </span>
      </div>

      {/* Middle Attached Magnet Status */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {linkedPages.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 truncate max-w-full">
              <Link2 className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {linkedPages.length === 1
                  ? `Attached to "${linkedPages[0].name}"`
                  : `Attached to ${linkedPages.length} magnets`}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
              Unlinked (Standalone file)
            </span>
          )}
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div
        className="mt-2.5 flex items-center justify-between pt-1 text-[11px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Copy Link Primary Mobile CTA */}
        <button
          type="button"
          onClick={() => onCopyLink(resource.url, resource.id)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer ${
            isCopied
              ? "bg-emerald-500 text-white"
              : "bg-[#0066B2] text-white hover:bg-[#005291] active:scale-95"
          }`}
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        {/* Secondary Actions: Direct Test & Delete */}
        <div className="flex items-center gap-1.5">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Download / Open file"
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-200 transition shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Test</span>
          </a>

          <button
            type="button"
            onClick={() => onDelete(resource)}
            title="Delete asset"
            className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

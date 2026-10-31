"use client";

import React, { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  animate,
} from "framer-motion";
import {
  Link2,
  Eye,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import type { MagnetPage } from "@/lib/data";
import { AppleCheckbox } from "@/components/leads/AppleCheckbox";
import { createTickPlayer } from "@/lib/tick-sound";

interface Resource {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
  /** `url` with its download access token (see lib/magnet-access.ts) */
  shareUrl?: string;
}

interface MobileAssetCardProps {
  resource: Resource;
  badge: {
    icon: React.ReactNode;
    bg: string;
    tagBg?: string;
    ext?: string;
  };
  linkedPages: MagnetPage[];
  isSelected: boolean;
  isSelectionMode: boolean;
  isCopied: boolean;
  formattedSize: string;
  isEditing: boolean;
  editingName: string;
  isSavingName: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onToggleSelect: (id: string) => void;
  onEnterSelectionMode: (id: string) => void;
  onCopyLink: (url: string, id: string) => void;
  onStartRenaming: (resource: Resource) => void;
  onEditingNameChange: (val: string) => void;
  onSaveRename: (resource: Resource) => void;
  onCancelRename: () => void;
  onDelete: (resource: Resource) => void;
  onPreview: (resource: Resource) => void;
}

// -----------------------------------------------------------------------------
// 3 wider action cards @ 68px each (204px)
// + 2 inner gaps @ 8px (16px)
// + right container padding @ 8px (8px)
// + left gap from card edge @ 8px (8px)
// = Exactly 236px total drawer slide
// -----------------------------------------------------------------------------
const ACTION_DRAWER_WIDTH = 236;
const OVERSWIPE_THRESHOLD = -275;

// Critically damped Apple spring: Glides directly into position with ZERO overshoot or bounce
const FLUID_SPRING = {
  type: "spring" as const,
  stiffness: 340,
  damping: 38,
  mass: 0.7,
};

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
  isOpen: controlledIsOpen,
  onOpenChange,
  onToggleSelect,
  onEnterSelectionMode,
  onCopyLink,
  onStartRenaming,
  onEditingNameChange,
  onSaveRename,
  onCancelRename,
  onDelete,
  onPreview,
}: MobileAssetCardProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      setInternalIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  const isOverswipedRef = useRef(false);
  const [isOverswipedState, setIsOverswipedState] = useState(false);
  const tickPlayerRef = useRef<ReturnType<typeof createTickPlayer> | null>(null);

  // Real-time motion value for exact finger position tracking
  const x = useMotionValue(0);

  // Fluid spring animation helper
  const springTo = useCallback(
    (target: number) => {
      return animate(x, target, FLUID_SPRING);
    },
    [x]
  );

  // Initialize Web Audio tick player for mechanical detent click
  useEffect(() => {
    tickPlayerRef.current = createTickPlayer();
    return () => {
      tickPlayerRef.current?.dispose();
    };
  }, []);

  const triggerHaptic = useCallback((vibeMs = 12) => {
    tickPlayerRef.current?.play();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(vibeMs);
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // Monitor overswipe boundary with Apple-style detent click
  useMotionValueEvent(x, "change", (latest) => {
    const overswiped = latest <= OVERSWIPE_THRESHOLD;
    if (overswiped !== isOverswipedRef.current) {
      isOverswipedRef.current = overswiped;
      setIsOverswipedState(overswiped);
      if (overswiped) {
        triggerHaptic(28);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // PURE APPLE MAIL KINEMATICS:
  // Smooth linear fade in (0 -> 1) on reveal and fade out (1 -> 0) on dismiss.
  // Locked physical coordinates: ZERO scale expansion, ZERO position twitching!
  // ---------------------------------------------------------------------------
  const progress = useTransform(x, [0, -ACTION_DRAWER_WIDTH], [0, 1], { clamp: true });
  const buttonsOpacity = useTransform(progress, [0, 1], [0, 1], { clamp: true });

  // Arrow rotates dynamically with finger position or spring curve
  const arrowRotation = useTransform(progress, [0, 1], [0, 180]);

  // Seamless 1:1 stretch on overswipe: extends Delete the exact moment card passes -236px,
  // keeping the island buttons glued in lockstep with the card with ZERO gap ever opening up!
  const deleteWidth = useTransform(x, (latest) => {
    if (latest >= -ACTION_DRAWER_WIDTH) return 68;
    return 68 + (-latest - ACTION_DRAWER_WIDTH);
  });

  // Sync motion value when opened or closed externally
  useEffect(() => {
    if (!isOpen) {
      springTo(0);
    } else {
      springTo(-ACTION_DRAWER_WIDTH);
    }
  }, [isOpen, springTo]);

  // Close swipe immediately if selection mode or renaming begins
  useEffect(() => {
    if (isSelectionMode || isEditing) {
      setIsOpen(false);
      springTo(0);
    }
  }, [isSelectionMode, isEditing, setIsOpen, springTo]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isOpen) {
      e.stopPropagation();
      setIsOpen(false);
      springTo(0);
      triggerHaptic(10);
      return;
    }
    if (isSelectionMode) {
      onToggleSelect(resource.id);
    }
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      springTo(0);
      return;
    }
    if (!isSelectionMode) {
      onEnterSelectionMode(resource.id);
    } else {
      onToggleSelect(resource.id);
    }
  };

  return (
    <div className="relative rounded-2xl touch-pan-y select-none transform-gpu">
      {/* ------------------------------------------------------------- */}
      {/* 1. SEPARATE FLOATING ISLAND ACTION CARDS                      */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        style={{ opacity: buttonsOpacity }}
        className="absolute inset-y-0 right-0 z-0 flex items-center pr-2 gap-2 pointer-events-auto"
      >
        {/* Island 1: Copy Link */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopyLink(resource.shareUrl || resource.url, resource.id);
            triggerHaptic(14);
            setTimeout(() => {
              setIsOpen(false);
              springTo(0);
            }, 300);
          }}
          className={`w-[68px] h-[calc(100%-16px)] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 cursor-pointer shadow-2xs backdrop-blur-md active:scale-95 will-change-transform ${
            isCopied
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20"
              : "bg-[#0066B2]/12 hover:bg-[#0066B2]/18 active:bg-[#0066B2]/25 border border-[#0066B2]/25 text-[#0066B2] dark:bg-[#0066B2]/20 dark:hover:bg-[#0066B2]/30 dark:border-[#38BDF8]/30 dark:text-[#38BDF8]"
          }`}
          title="Copy Link"
        >
          <div className="h-6 w-6 flex items-center justify-center shrink-0">
            {isCopied ? (
              <Check className="h-5 w-5 stroke-[2.4]" />
            ) : (
              <Link2 className="h-5 w-5 stroke-[2.4]" />
            )}
          </div>
          <span className="text-[11.5px] font-bold tracking-tight leading-none whitespace-nowrap mt-1">
            {isCopied ? "Copied" : "Copy"}
          </span>
        </button>

        {/* Island 2: Test / Download */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic(12);
            setIsOpen(false);
            springTo(0);
            onPreview(resource);
          }}
          className="w-[68px] h-[calc(100%-16px)] flex flex-col items-center justify-center rounded-2xl bg-zinc-500/10 hover:bg-zinc-500/18 active:bg-zinc-500/25 border border-zinc-500/20 text-zinc-700 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] dark:border-white/15 dark:text-zinc-100 transition-colors duration-150 cursor-pointer shadow-2xs backdrop-blur-md active:scale-95 will-change-transform"
          title="Test / View file"
        >
          <div className="h-6 w-6 flex items-center justify-center shrink-0">
            <Eye className="h-5 w-5 stroke-[2.4]" />
          </div>
          <span className="text-[11.5px] font-bold tracking-tight leading-none whitespace-nowrap mt-1">
            Test
          </span>
        </button>

        {/* Island 3: Delete (Stretches smoothly with finger on overswipe) */}
        <motion.button
          style={{ width: deleteWidth }}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic(20);
            setIsOpen(false);
            springTo(0);
            onDelete(resource);
          }}
          className={`h-[calc(100%-16px)] min-w-[68px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 cursor-pointer shadow-2xs backdrop-blur-md active:scale-95 will-change-transform px-3 ${
            isOverswipedState
              ? "bg-rose-600 border border-rose-600 text-white shadow-md"
              : "bg-rose-500/12 hover:bg-rose-500/20 active:bg-rose-500/25 border border-rose-500/25 text-rose-600 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:border-rose-500/35 dark:text-rose-400"
          }`}
          title="Delete asset"
        >
          <div className="h-6 w-6 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 stroke-[2.4]" />
          </div>
          <span className="text-[11.5px] font-bold tracking-tight leading-none whitespace-nowrap mt-1">
            Delete
          </span>
        </motion.button>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FOREGROUND CARD (Velocity-Aware Elastic Slide)              */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        drag={isSelectionMode || isEditing ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -340, right: 0 }}
        dragElastic={{ left: 0.22, right: 0.02 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (isOverswipedRef.current || info.offset.x < OVERSWIPE_THRESHOLD) {
            setIsOpen(false);
            springTo(0);
            triggerHaptic(25);
            onDelete(resource);
            return;
          }

          const isFlickLeft = info.velocity.x < -300 && info.offset.x < -20;
          const isFlickRight = info.velocity.x > 300;
          const isDraggedPastThreshold = info.offset.x < -60;

          if ((isDraggedPastThreshold || isFlickLeft) && !isFlickRight) {
            setIsOpen(true);
            springTo(-ACTION_DRAWER_WIDTH);
            triggerHaptic(12);
          } else {
            setIsOpen(false);
            springTo(0);
            triggerHaptic(10);
          }
        }}
        onClick={handleCardClick}
        className={`group relative rounded-2xl border px-3.5 py-3 transition-colors duration-200 cursor-pointer overflow-hidden z-10 will-change-transform ${
          isSelected
            ? "border-[#0066B2] bg-[#EFF6FF] dark:border-[#38BDF8] dark:bg-[#0066B2]/15 shadow-sm"
            : "border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-2xs dark:shadow-none"
        }`}
      >
        <div className="relative z-10 flex items-center gap-3">
          {/* Animated Checkbox in Selection Mode */}
          <AnimatePresence initial={false}>
            {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, width: 0, marginRight: 0 }}
                animate={{ opacity: 1, width: 22, marginRight: 2 }}
                exit={{ opacity: 0, width: 0, marginRight: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(resource.id);
                }}
                className="flex h-11 items-center justify-center shrink-0 overflow-hidden cursor-pointer"
              >
                <AppleCheckbox
                  checked={isSelected}
                  onChange={() => onToggleSelect(resource.id)}
                  title={isSelected ? "Deselect asset" : "Select asset"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sized-up File Icon Badge (h-11 w-11) */}
          <div
            onClick={handleIconClick}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${badge.bg} active:scale-95 transition cursor-pointer shadow-2xs`}
            title={isSelectionMode ? "Toggle Selection" : "Tap to select"}
          >
            {badge.icon}
          </div>

          {/* Center Column: 3 Balanced Lines */}
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div
                className="flex items-center gap-1.5"
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
                  className="w-full rounded-lg border border-[#0066B2] bg-white px-2 py-1 text-xs font-semibold text-zinc-900 focus:outline-none dark:border-white/20 dark:bg-[#121212] dark:text-white"
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
                  className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 transition cursor-pointer shrink-0"
                  title="Cancel"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {/* Line 1: Asset Name + Rename Trigger */}
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-[13px] sm:text-sm font-semibold text-zinc-900 dark:text-white truncate"
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
                    className="p-0.5 text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition cursor-pointer rounded shrink-0 opacity-60 hover:opacity-100"
                    title="Rename asset"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>

                {/* Line 2: Size & Upload Date */}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                    {formattedSize}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="truncate">{resource.uploadedAt}</span>
                </div>

                {/* Line 3: Attached Magnet or Standalone Badge */}
                <div className="flex items-center gap-1 text-[11px] truncate mt-0.5">
                  {linkedPages.length > 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium text-[#0066B2] dark:text-[#38BDF8] truncate">
                      <Link2 className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">
                        {linkedPages.length === 1
                          ? `Attached to "${linkedPages[0].name}"`
                          : `Attached to ${linkedPages.length} magnets`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 text-[10.5px]">
                      Unlinked file
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action: Reversible Arrow Indicator (< when closed, > when open) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextOpen = !isOpen;
              setIsOpen(nextOpen);
              springTo(nextOpen ? -ACTION_DRAWER_WIDTH : 0);
              triggerHaptic(12);
            }}
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-white/[0.08] active:scale-90 transition-colors cursor-pointer"
            title={isOpen ? "Close actions (Swipe right or tap)" : "Open actions (Swipe left or tap)"}
          >
            <motion.div
              style={{ rotate: arrowRotation }}
              className="flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        </div>
      </motion.div>
    </div>
  );
});

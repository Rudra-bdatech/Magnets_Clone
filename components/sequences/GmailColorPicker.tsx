"use client";

import React, { useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Check, X } from "lucide-react";

export interface GmailColorPickerProps {
  editor: Editor | null;
  onClose: () => void;
  themeMode?: "light" | "dark" | string;
}

// Row 1: Grayscale (8 swatches)
export const GRAYSCALE_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#ffffff",
];

// Row 2: Pure Vibrant Rainbow Swatches (8 swatches)
export const PRIMARY_RAINBOW_COLORS = [
  "#ff0000", // Red
  "#ff9900", // Orange
  "#ffff00", // Yellow
  "#00ff00", // Green
  "#00ffff", // Cyan
  "#0000ff", // Blue
  "#9900ff", // Purple
  "#ff00ff", // Magenta
];

// 6x8 Matrix (6 rows of shades across the 8 color columns)
export const PALETTE_GRID: string[][] = [
  // Tint 1 (Very light pastels)
  ["#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"],
  // Tint 2 (Light)
  ["#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
  // Tint 3 (Medium)
  ["#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0"],
  // Base / Saturated
  ["#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"],
  // Dark shades
  ["#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"],
  // Deep / Very dark shades
  ["#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#073763", "#20124d", "#4c1130"],
];

function isColorDark(hex: string): boolean {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
}

export default function GmailColorPicker({
  editor,
  onClose,
  themeMode = "light",
}: GmailColorPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!editor) return null;

  const currentTextColor = (editor.getAttributes("textStyle").color || "").toLowerCase();
  const currentBgColor = (editor.getAttributes("textStyle").backgroundColor || "").toLowerCase();

  const handleSelectColor = (type: "text" | "background", color: string) => {
    if (type === "text") {
      const isAlreadyActive =
        currentTextColor === color.toLowerCase() ||
        editor.isActive("textStyle", { color });
      if (isAlreadyActive) {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
    } else {
      const isAlreadyActive =
        currentBgColor === color.toLowerCase() ||
        editor.isActive("textStyle", { backgroundColor: color });
      if (isAlreadyActive) {
        editor.chain().focus().setMark("textStyle", { backgroundColor: null }).run();
        (editor.commands as any).removeEmptyTextStyle?.();
      } else {
        editor.chain().focus().setMark("textStyle", { backgroundColor: color }).run();
      }
    }
  };

  const renderColorSwatch = (type: "text" | "background", color: string) => {
    const isSelected =
      type === "text"
        ? currentTextColor === color.toLowerCase() || editor.isActive("textStyle", { color })
        : currentBgColor === color.toLowerCase() || editor.isActive("textStyle", { backgroundColor: color });
    const darkBg = isColorDark(color);
    const isWhite = color.toLowerCase() === "#ffffff";

    return (
      <button
        key={color}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSelectColor(type, color);
        }}
        title={color}
        className={`relative w-4 h-4 rounded-[2px] transition hover:scale-110 cursor-pointer flex items-center justify-center p-0 m-0 ${
          isWhite ? "border border-zinc-300 dark:border-zinc-600" : "border border-black/10"
        } ${isSelected ? "ring-1.5 ring-black dark:ring-white z-10" : ""}`}
        style={{ backgroundColor: color }}
      >
        {isSelected && (
          <Check
            className={`w-3 h-3 stroke-[3] ${darkBg ? "text-white" : "text-black"}`}
          />
        )}
      </button>
    );
  };

  const renderSection = (title: string, type: "text" | "background") => (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
          {title}
        </span>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (type === "text") {
              editor.chain().focus().unsetColor().run();
            } else {
              editor.chain().focus().setMark("textStyle", { backgroundColor: null }).run();
              (editor.commands as any).removeEmptyTextStyle?.();
            }
          }}
          className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition underline cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* 1. Grayscale Row (8 swatches) */}
      <div className="grid grid-cols-8 gap-1">
        {GRAYSCALE_COLORS.map((c) => renderColorSwatch(type, c))}
      </div>

      {/* 2. Vibrant Rainbow Row (8 swatches) */}
      <div className="grid grid-cols-8 gap-1">
        {PRIMARY_RAINBOW_COLORS.map((c) => renderColorSwatch(type, c))}
      </div>

      {/* 3. Matrix (6 rows x 8 swatches) */}
      <div className="grid grid-cols-8 gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        {PALETTE_GRID.flatMap((row) => row).map((c, idx) => (
          <React.Fragment key={`${c}-${idx}`}>
            {renderColorSwatch(type, c)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={popoverRef}
      onMouseDown={(e) => {
        // Prevent clicking inside the popover from clearing editor selection
        e.preventDefault();
      }}
      className={`rounded-xl border shadow-2xl p-3.5 select-none transition-colors z-50 ${
        themeMode === "dark"
          ? "border-zinc-800 bg-[#1e1e24] text-white shadow-black/60"
          : "border-zinc-200 bg-white text-zinc-900 shadow-zinc-400/20"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* Left Column: Background Color */}
        {renderSection("Background colour", "background")}

        {/* Divider */}
        <div className="hidden sm:block w-px self-stretch bg-zinc-200 dark:bg-zinc-800" />

        {/* Right Column: Text Color */}
        {renderSection("Text colour", "text")}
      </div>
    </div>
  );
}


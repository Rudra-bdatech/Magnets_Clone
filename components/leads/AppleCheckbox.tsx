"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AppleCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
  size?: "sm" | "md";
  title?: string;
}

export function AppleCheckbox({
  checked,
  indeterminate = false,
  onChange,
  className = "",
  size = "md",
  title,
}: AppleCheckboxProps) {
  const isSm = size === "sm";
  const sizeClasses = isSm ? "w-4 h-4 rounded-[6px]" : "w-[18px] h-[18px] rounded-[6px]";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex items-center justify-center transition-colors duration-150 cursor-pointer select-none focus:outline-none ${sizeClasses} ${
        checked || indeterminate
          ? "bg-[#0066B2] text-white dark:bg-[#38BDF8] dark:text-zinc-950 border border-[#0066B2] dark:border-[#38BDF8] shadow-xs"
          : "border border-zinc-300/90 dark:border-[#3E3E4A] bg-white/90 dark:bg-[#1E1E24]/90 hover:border-[#0066B2] dark:hover:border-[#38BDF8] hover:bg-zinc-50 dark:hover:bg-[#25252D] shadow-2xs"
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        {checked && !indeterminate && (
          <motion.svg
            key="apple-check-icon"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 32,
            }}
            viewBox="0 0 14 14"
            fill="none"
            className={isSm ? "w-2.5 h-2.5" : "w-3 h-3"}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              d="M2.75 7.25L5.5 10L11.25 4.25"
            />
          </motion.svg>
        )}

        {indeterminate && (
          <motion.div
            key="apple-indeterminate-dash"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 24 }}
            className={`h-[2px] rounded-full bg-current ${isSm ? "w-2" : "w-2.5"}`}
          />
        )}
      </AnimatePresence>
    </button>
  );
}

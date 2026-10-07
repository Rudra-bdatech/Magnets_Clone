"use client";

import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({
  checked = false,
  onCheckedChange,
  label,
  disabled = false,
  className,
  id,
}: SwitchProps) {
  const switchId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <label
      htmlFor={switchId}
      className={cn(
        "inline-flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-foreground",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2",
          checked ? "bg-foreground" : "bg-muted-foreground/30",
          disabled && "cursor-not-allowed",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full shadow-sm ring-0 transition-colors",
            checked ? "bg-background translate-x-5" : "bg-card translate-x-0",
          )}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}

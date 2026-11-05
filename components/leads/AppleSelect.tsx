"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface AppleSelectProps {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  prefix?: string;
  label?: string;
  placement?: "top" | "bottom";
  className?: string;
}

export function AppleSelect({
  value,
  options,
  onChange,
  prefix,
  label = "Rows per page",
  placement = "top",
  className = "",
}: AppleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isTop = placement === "top";

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Apple-style Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-[#1E1E22]/90 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs hover:bg-zinc-50 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95 select-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {prefix && <span className="text-[11px] text-zinc-400 font-medium">{prefix}</span>}
        <span className="font-bold text-zinc-900 dark:text-white">{value}</span>
        <ChevronDown
          className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Apple-style Animated Popover Menu with Spring Physics */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: isTop ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: isTop ? 6 : -6 }}
            transition={{
              type: "spring",
              damping: 24,
              stiffness: 420,
              mass: 0.5,
            }}
            style={{ transformOrigin: isTop ? "bottom right" : "top right" }}
            className={`absolute right-0 ${
              isTop ? "bottom-full mb-2" : "top-full mt-2"
            } z-50 min-w-[110px] overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.7)]`}
            role="listbox"
          >
            {label && (
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none">
                {label}
              </div>
            )}
            <div className="space-y-0.5">
              {options.map((opt) => {
                const isSelected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#0066B2]/10 dark:bg-white/15 text-[#0066B2] dark:text-white font-bold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-white/5 font-medium hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] stroke-[2.5px]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";

export interface AppleSelectProps {
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
  prefix = "Rows:",
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
          className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ease-out ${isOpen ? "rotate-180" : ""
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
            className={`absolute right-0 ${isTop ? "bottom-full mb-2" : "top-full mt-2"
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
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none ${isSelected
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

export function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [];
  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, "…", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "…", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages);
  }
  return pages;
}

export interface ApplePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  itemLabelPlural?: string;
  prefixRows?: string;
  className?: string;
  hideWhenSinglePage?: boolean;
  scrollToTopOnPageChange?: boolean;
  scrollTargetId?: string;
}

export function ApplePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "item",
  itemLabelPlural,
  prefixRows = "Rows:",
  className = "",
  hideWhenSinglePage = true,
  scrollToTopOnPageChange = true,
  scrollTargetId,
}: ApplePaginationProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  if (totalItems <= 0) return null;

  // By default, if all items fit comfortably on a single page (<= 10 items) and there are no multiple pages,
  // omit the entire card to keep the UI clean, airy, and uncluttered.
  const minThreshold =
    onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0
      ? Math.min(...pageSizeOptions)
      : pageSize;

  if (hideWhenSinglePage && totalPages <= 1 && totalItems <= minThreshold) {
    return null;
  }

  const plural = itemLabelPlural || `${itemLabel}s`;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const rangeText = startItem === endItem ? `${startItem}` : `${startItem}-${endItem}`;

  const handlePageChange = (targetPage: number) => {
    if (targetPage === currentPage || targetPage < 1 || targetPage > totalPages) return;
    onPageChange(targetPage);

    // Apple-style smooth scroll to beginning of content container on page transitions
    if (scrollToTopOnPageChange && typeof window !== "undefined") {
      const doScroll = () => {
        let targetEl: HTMLElement | null = null;
        if (scrollTargetId) {
          targetEl = document.getElementById(scrollTargetId);
        }

        if (!targetEl && rootRef.current) {
          targetEl =
            (rootRef.current.closest("[data-pagination-container]") as HTMLElement) ||
            (rootRef.current.closest(".rounded-2xl") as HTMLElement) ||
            (rootRef.current.parentElement?.previousElementSibling as HTMLElement) ||
            (rootRef.current.parentElement as HTMLElement);
        }

        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const targetY = Math.max(0, window.scrollY + rect.top - 70);
          if (Math.abs(window.scrollY - targetY) > 15) {
            window.scrollTo({
              top: targetY,
              behavior: "smooth",
            });
          }
        }
      };

      requestAnimationFrame(doScroll);
      setTimeout(doScroll, 80);
    }
  };

  const renderNumberPills = () => (
    <div className="flex items-center gap-1 select-none">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
        title="Previous page"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers(currentPage, totalPages).map((p, idx) => {
        if (typeof p === "string") {
          return (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-zinc-400 dark:text-zinc-500 select-none">
              …
            </span>
          );
        }
        const isActive = p === currentPage;
        return (
          <button
            key={`page-${p}`}
            type="button"
            onClick={() => handlePageChange(p)}
            className={`min-w-[28px] h-7 px-2.5 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${isActive
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black font-bold shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 font-semibold"
              }`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
        title="Next page"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={`w-full rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-[#151515] p-3 sm:px-4 sm:py-2.5 shadow-xs ${className}`}
    >
      {/* DESKTOP (>= sm): Single Row with Left Summary and Right Controls */}
      <div className="hidden sm:flex items-center justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <div>
          {totalItems <= pageSize ? (
            <>
              Showing <strong className="font-bold text-zinc-900 dark:text-white">{totalItems}</strong>{" "}
              {totalItems === 1 ? itemLabel : plural}
            </>
          ) : (
            <>
              Showing <strong className="font-bold text-zinc-900 dark:text-white">{rangeText}</strong> of{" "}
              <strong className="font-bold text-zinc-900 dark:text-white">{totalItems}</strong> {plural}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {totalPages > 1 && renderNumberPills()}

          {onPageSizeChange && (
            <AppleSelect
              value={pageSize}
              options={pageSizeOptions}
              onChange={(newSize) => onPageSizeChange(newSize)}
              prefix={prefixRows}
            />
          )}
        </div>
      </div>

      {/* MOBILE (< sm): Clean 2-Row Layout Engineered for small screens like Moto G4 (360px) */}
      <div className="flex sm:hidden flex-col gap-2.5 w-full text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate text-[11px] font-medium">
            {totalItems <= pageSize ? (
              <>
                Showing <strong className="font-bold text-zinc-900 dark:text-white">{totalItems}</strong>{" "}
                {totalItems === 1 ? itemLabel : plural}
              </>
            ) : (
              <>
                Showing <strong className="font-bold text-zinc-900 dark:text-white">{rangeText}</strong> of{" "}
                <strong className="font-bold text-zinc-900 dark:text-white">{totalItems}</strong>
              </>
            )}
          </div>

          {onPageSizeChange && (
            <AppleSelect
              value={pageSize}
              options={pageSizeOptions}
              onChange={(newSize) => onPageSizeChange(newSize)}
              prefix={prefixRows}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
            {renderNumberPills()}
          </div>
        )}
      </div>
    </div>
  );
}


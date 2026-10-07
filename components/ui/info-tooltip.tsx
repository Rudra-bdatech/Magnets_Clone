"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: React.ReactNode;
  title?: string;
  className?: string;
  iconClassName?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "auto";
  size?: "sm" | "md";
}

export function InfoTooltip({
  content,
  title,
  className = "",
  iconClassName = "",
  align = "start",
  side = "auto",
  size = "sm",
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    actualSide: "top" | "bottom";
    arrowLeft: number;
  }>({
    top: 0,
    left: 0,
    actualSide: "bottom",
    arrowLeft: 16,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(300, window.innerWidth - 24);
    const tooltipHeight = 110; // Approximate fallback for position calculation

    // Decide whether to show above or below
    let resolvedSide: "top" | "bottom" = "bottom";
    if (side === "top") {
      resolvedSide = "top";
    } else if (side === "bottom") {
      resolvedSide = "bottom";
    } else {
      // Auto: prefer bottom if not enough space on top (need ~130px above)
      if (rect.top < 140) {
        resolvedSide = "bottom";
      } else {
        resolvedSide = "top";
      }
    }

    // Calculate vertical position
    let top = resolvedSide === "bottom" ? rect.bottom + 8 : rect.top - 8;

    // Calculate horizontal position
    let left = rect.left;
    if (align === "center") {
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (align === "end") {
      left = rect.right - tooltipWidth;
    }

    // Clamp inside viewport
    const minLeft = 12;
    const maxLeft = window.innerWidth - tooltipWidth - 12;
    const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));

    // Calculate arrow position relative to tooltip box
    const buttonCenter = rect.left + rect.width / 2;
    const arrowLeft = Math.max(12, Math.min(buttonCenter - clampedLeft, tooltipWidth - 16));

    setCoords({
      top,
      left: clampedLeft,
      actualSide: resolvedSide,
      arrowLeft,
    });
  }, [align, side]);

  const toggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleClickOutside = useCallback((e: MouseEvent | TouchEvent) => {
    const target = e.target as Node;
    if (
      buttonRef.current &&
      !buttonRef.current.contains(target) &&
      tooltipRef.current &&
      !tooltipRef.current.contains(target)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isOpen, updatePosition, handleClickOutside]);

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const buttonSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <span
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={title || "More information"}
        className={`group/info flex ${buttonSize} items-center justify-center rounded-full text-sky-500/80 hover:text-sky-600 bg-sky-50 hover:bg-sky-100 dark:text-sky-400 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 shrink-0`}
      >
        <Info className={`${iconSize} transition-transform group-hover/info:scale-110 ${iconClassName}`} />
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: coords.actualSide === "bottom" ? `${coords.top}px` : undefined,
              bottom:
                coords.actualSide === "top"
                  ? `${window.innerHeight - coords.top}px`
                  : undefined,
              left: `${coords.left}px`,
              width: `${Math.min(300, window.innerWidth - 24)}px`,
              zIndex: 99999,
            }}
            className="rounded-xl border border-zinc-700/80 bg-zinc-900/98 dark:bg-zinc-950/98 p-3 text-xs leading-relaxed text-zinc-100 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-text"
          >
            {title && (
              <div className="font-semibold text-white mb-1 flex items-center gap-1.5 border-b border-zinc-800 pb-1">
                <Info className="h-3 w-3 text-sky-400 shrink-0" />
                <span>{title}</span>
              </div>
            )}
            <div className="text-[11.5px] sm:text-xs text-zinc-300 font-normal leading-normal">
              {content}
            </div>

            {/* Pointer arrow tip accurately positioned under/above button */}
            <div
              style={{ left: `${coords.arrowLeft}px` }}
              className={`absolute h-2 w-2 -translate-x-1/2 rotate-45 border-zinc-700/80 bg-zinc-900 dark:bg-zinc-950 ${
                coords.actualSide === "bottom"
                  ? "-top-1 border-t border-l"
                  : "-bottom-1 border-b border-r"
              }`}
            />
          </div>,
          document.body
        )}
    </span>
  );
}

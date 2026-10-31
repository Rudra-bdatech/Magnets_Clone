"use client";

import { useRef, type ReactNode, type HTMLAttributes } from "react";

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  spotlightColorLight?: string;
  spotlightColorDark?: string;
  surfaceGlowLight?: string;
  surfaceGlowDark?: string;
  spotlightRadius?: number;
}

/**
 * SpotlightCard - Linear / Vercel style cursor-following spotlight glow.
 * Renders both a cursor-following border beam and a soft surface ambient glow.
 * Uses CSS variables directly to avoid React re-renders on mousemove (pure 60-120fps).
 */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColorLight = "rgba(0, 102, 178, 0.45)",
  spotlightColorDark = "rgba(56, 189, 248, 0.45)",
  surfaceGlowLight = "rgba(0, 102, 178, 0.05)",
  surfaceGlowDark = "rgba(56, 189, 248, 0.07)",
  spotlightRadius = 380,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mouse-x", `${x}px`);
    el.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215] transition-all duration-300 ${className}`}
      {...props}
    >
      {/* 1. Linear/Vercel Border Glow following cursor */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10"
        style={{
          background: `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), var(--spotlight-border, ${spotlightColorLight}), transparent 65%)`,
          padding: "1.5px",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
        }}
        aria-hidden="true"
      />

      {/* 2. Soft atmospheric surface glow following cursor */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
        style={{
          background: `radial-gradient(${spotlightRadius * 1.3}px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), var(--spotlight-surface, ${surfaceGlowLight}), transparent 60%)`,
        }}
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div className="relative z-1 h-full flex flex-col">{children}</div>
    </div>
  );
}


"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toggleThemeWithRipple } from "@/lib/theme-transition";
import { createTickPlayer, type TickPlayer } from "@/lib/tick-sound";

export default function ThemeToggle({
  className = "",
  variant = "default",
  size = "md",
}: {
  className?: string;
  variant?: "default" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tickPlayerRef = useRef<TickPlayer | null>(null);

  useEffect(() => {
    setMounted(true);
    setDark(typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

    // Prepare audio feedback
    try {
      tickPlayerRef.current = createTickPlayer();
    } catch (_) {}

    const handleThemeChange = () => {
      setDark(document.documentElement.classList.contains("dark"));
    };

    window.addEventListener("leadmagnets-theme-changed", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener("leadmagnets-theme-changed", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
      tickPlayerRef.current?.dispose();
    };
  }, []);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    // 1. Tactile Audio Feedback
    try {
      tickPlayerRef.current?.play();
    } catch (_) {}

    // 2. Mobile Haptic feedback
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch (_) {}
    }

    // 3. Circular Expanding Ripple Wave from the button position
    toggleThemeWithRipple(event, () => {
      const next = !document.documentElement.classList.contains("dark");
      setDark(next);
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.classList.toggle("light", !next);
      document.documentElement.dataset.theme = next ? "dark" : "light";
      document.documentElement.style.colorScheme = next ? "dark" : "light";
      try {
        localStorage.setItem("leadmagnets-theme", next ? "dark" : "light");
        localStorage.setItem("leadmagnets-theme-mode", next ? "dark" : "light");
      } catch (_) {}

      // Notify other instances
      window.dispatchEvent(new CustomEvent("leadmagnets-theme-changed", { detail: { isDark: next } }));
    });
  }

  const dimClass =
    size === "sm"
      ? "h-8 w-8 min-h-8"
      : size === "lg"
      ? "h-10 w-10 min-h-10"
      : "h-9 w-9 min-h-9";

  const svgDim = size === "sm" ? 18 : size === "lg" ? 22 : 19;

  const baseStyles =
    variant === "ghost"
      ? `${dimClass} inline-flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 active:scale-95 transition-all cursor-pointer shrink-0`
      : `theme-toggle ${dimClass} inline-flex items-center justify-center rounded-xl border text-sm font-medium transition-colors border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-[#161D2A]/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-[#0066B2] dark:hover:text-white shadow-xs backdrop-blur-md cursor-pointer shrink-0`;

  if (!mounted) {
    return <div className={`${dimClass} rounded-xl ${className}`} />;
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88, rotate: dark ? -15 : 15 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${baseStyles} ${className} relative select-none`}
      onClick={toggle}
    >
      <svg
        width={svgDim}
        height={svgDim}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Dynamic Mask to carve out the crescent moon */}
        <mask id="theme-toggle-moon-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.circle
            animate={{
              cx: dark ? 10 : 25,
              cy: dark ? 4 : -5,
              r: dark ? 8 : 0,
            }}
            transition={{ type: "spring", stiffness: 360, damping: 25 }}
            fill="black"
          />
        </mask>

        {/* Central Sun/Moon Body */}
        <motion.circle
          cx="12"
          cy="12"
          animate={{
            r: dark ? 8 : 4.8,
            fill: dark ? "#E2E8F0" : "#F59E0B",
            stroke: dark ? "#CBD5E1" : "#F59E0B",
          }}
          mask="url(#theme-toggle-moon-mask)"
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
        />

        {/* Sun Rays (Implode, spin and vanish on dark mode) */}
        <motion.g
          animate={{
            scale: dark ? 0 : 1,
            rotate: dark ? 90 : 0,
            opacity: dark ? 0 : 1,
          }}
          transition={{ type: "spring", stiffness: 340, damping: 22 }}
          style={{ originX: "12px", originY: "12px" }}
          stroke="#F59E0B"
        >
          <line x1="12" y1="1.5" x2="12" y2="3.5" />
          <line x1="12" y1="20.5" x2="12" y2="22.5" />
          <line x1="4.5" y1="4.5" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.5" y2="19.5" />
          <line x1="1.5" y1="12" x2="3.5" y2="12" />
          <line x1="20.5" y1="12" x2="22.5" y2="12" />
          <line x1="4.5" y1="19.5" x2="6" y2="18" />
          <line x1="18" y1="6" x2="19.5" y2="4.5" />
        </motion.g>

        {/* Constellation Stars (Appear when moon is active) */}
        {dark && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ delay: 0.1, duration: 0.22 }}
            fill="#93C5FD"
            stroke="none"
          >
            <circle cx="18" cy="5" r="1.1" />
            <circle cx="5.5" cy="18" r="0.9" />
            <circle cx="19" cy="16.5" r="0.75" />
          </motion.g>
        )}
      </svg>
    </motion.button>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { toggleThemeWithRipple } from "@/lib/theme-transition";
import { createTickPlayer, type TickPlayer } from "@/lib/tick-sound";

export default function ThemeToggle({
  className = "",
  variant = "ghost",
  size = "md",
}: {
  className?: string;
  variant?: "default" | "ghost" | "card";
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
      ? "h-11 w-11 min-h-11"
      : "h-9 w-9 min-h-9";

  const iconClass =
    size === "sm"
      ? "h-4.5 w-4.5"
      : size === "lg"
      ? "h-6.5 w-6.5"
      : "h-5.5 w-5.5"; // 22px — prominent, clear and legible

  const baseStyles =
    variant === "card"
      ? `theme-toggle ${dimClass} inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-colors border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white shadow-xs backdrop-blur-md cursor-pointer shrink-0`
      : `${dimClass} inline-flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0`;

  if (!mounted) {
    return <div className={`${dimClass} ${className}`} />;
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${baseStyles} ${className} relative select-none`}
      onClick={toggle}
    >
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 40, scale: 0.7 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center justify-center text-zinc-200"
          >
            <Moon className={iconClass} strokeWidth={2} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 40, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -40, scale: 0.7 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center justify-center text-amber-500"
          >
            <Sun className={iconClass} strokeWidth={2} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

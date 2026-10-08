"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "ghost";
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("leadmagnets-theme", next ? "dark" : "light");
    } catch (_) {}
  }

  const baseStyles =
    variant === "ghost"
      ? "inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 active:scale-95 transition-all cursor-pointer shrink-0"
      : "theme-toggle inline-flex min-h-9 h-9 w-9 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161D2A] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-[#0066B2] dark:hover:text-white px-0 shrink-0 shadow-xs cursor-pointer";

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${baseStyles} ${className}`}
      onClick={toggle}
    >
      {dark ? <Sun className="h-4.5 w-4.5" aria-hidden="true" /> : <Moon className="h-4.5 w-4.5" aria-hidden="true" />}
    </button>
  );
}
"use client";

import { useState, useEffect } from "react";
import { type Account } from "@/lib/data";

/**
 * useIsDarkMode
 * Reliable, reactive dark mode detection that synchronizes with:
 * 1. document.documentElement class ("dark")
 * 2. localStorage ("leadmagnets-theme")
 * 3. Custom event ("leadmagnets-theme-changed")
 * 4. DOM MutationObserver on document.documentElement
 * 5. Optional account.themeMode prop as initial fallback
 */
export function useIsDarkMode(account?: Account | null): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      const hasDarkClass = document.documentElement.classList.contains("dark");
      if (hasDarkClass) return true;
      try {
        const storedTheme = localStorage.getItem("leadmagnets-theme");
        if (storedTheme === "dark") return true;
        if (storedTheme === "light") return false;
      } catch (_) {}
    }
    return (account?.themeMode || "light") === "dark";
  });

  useEffect(() => {
    const checkDark = () => {
      if (typeof document !== "undefined") {
        const hasDarkClass = document.documentElement.classList.contains("dark");
        setIsDark(hasDarkClass);
      } else {
        setIsDark((account?.themeMode || "light") === "dark");
      }
    };
    checkDark();

    const handleCustom = (e: any) => {
      if (e?.detail?.isDark !== undefined) {
        setIsDark(Boolean(e.detail.isDark));
      } else {
        checkDark();
      }
    };

    window.addEventListener("leadmagnets-theme-changed", handleCustom);
    window.addEventListener("storage", checkDark);

    let observer: MutationObserver | null = null;
    if (typeof document !== "undefined") {
      observer = new MutationObserver(() => {
        checkDark();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      window.removeEventListener("leadmagnets-theme-changed", handleCustom);
      window.removeEventListener("storage", checkDark);
      observer?.disconnect();
    };
  }, [account?.themeMode]);

  return isDark;
}

/**
 * useEffectiveAccount
 * Returns the account object with themeMode guaranteed to match the currently
 * active client theme ("dark" or "light").
 */
export function useEffectiveAccount(account: Account | null | undefined): Account | null {
  const isDark = useIsDarkMode(account);
  const themeMode = isDark ? "dark" : "light";
  if (!account) {
    return { themeMode } as Account;
  }
  return { ...account, themeMode };
}


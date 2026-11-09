"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { ArrowRightIcon } from "@/components/icons";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY + 35);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenis = (window as any).__lenis;
  if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(el, { offset: 35, duration: 1.2 });
    return;
  }

  window.scrollTo({ top: targetY, behavior: "smooth" });
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const id = href.replace("#", "");
  return (
    <a
      href={href}
      className="transition hover:text-zinc-950 dark:hover:text-white"
      onClick={(e) => {
        e.preventDefault();
        smoothScrollTo(id);
        history.pushState(null, "", href);
      }}
    >
      {children}
    </a>
  );
}

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="bg-transparent">
      {/* Backdrop overlay for outside tap */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/25 dark:bg-black/60 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <header
        className="relative mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10 h-17 sm:h-22 pt-2 sm:pt-3.5 z-40"
      >
        <a aria-label="Funnels home" href="/" className="shrink-0 flex items-center">
          <BrandLogo height="h-[34px] sm:h-[38px] lg:h-[40px]" />
        </a>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#integrations">Integrations</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeToggle variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors" />

          <a
            className="hidden h-10 items-center px-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:text-zinc-950 dark:hover:text-white sm:inline-flex"
            href="/login"
          >
            Sign in
          </a>
          <a
            className="hidden sm:inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-3 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-98 shrink-0"
            href="/register"
          >
            Start free <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          </a>

          {/* Mobile menu trigger - 100% Reliable Lucide Icons */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex md:hidden p-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white active:scale-90 transition-all shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 stroke-[2]" />
            ) : (
              <Menu className="w-6 h-6 stroke-[2]" />
            )}
          </button>
        </div>

        {/* Apple-Style True Rubber-Band Spring Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="seamless-mobile-menu"
              initial={{
                opacity: 0,
                y: -24,
                scaleY: 0.88,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scaleY: 1,
              }}
              exit={{
                opacity: 0,
                y: -16,
                scaleY: 0.94,
                transition: {
                  duration: 0.16,
                  ease: "easeIn",
                },
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 15, // True rubber-band elasticity! Stretches, bounces & snaps!
                mass: 0.65,
              }}
              style={{ transformOrigin: "top center" }}
              className="absolute top-full left-0 right-0 z-40 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-x border-zinc-200/80 dark:border-zinc-800/80 rounded-b-2xl px-5 pt-1 pb-5 shadow-2xl md:hidden flex flex-col gap-3 will-change-[transform,opacity]"
            >
              {/* Rubber-band Staggered Nav Links (No CSS transition-all conflict) */}
              <nav className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {[
                  { id: "how-it-works", label: "How it works" },
                  { id: "features", label: "Features" },
                  { id: "integrations", label: "Integrations" },
                  { id: "pricing", label: "Pricing" },
                ].map((item, index) => (
                  <motion.a
                    key={item.id}
                    href={`#${item.id}`}
                    initial={{ opacity: 0, y: -14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 14, // Rubber-band elasticity!
                      delay: index * 0.025, // Immediate micro-ripple
                    }}
                    className="py-3.5 text-base font-bold text-zinc-900 dark:text-white hover:text-[#0066B2] dark:hover:text-[#38BDF8] active:scale-[0.98] transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      smoothScrollTo(item.id);
                    }}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </nav>

              {/* Rubber-band Action Row */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 14, // Rubber-band bounce!
                  delay: 4 * 0.025, // Right with the links
                }}
                className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2.5"
              >
                <a
                  href="/login"
                  className="flex-1 h-11 rounded-xl font-bold text-sm text-zinc-900 dark:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 active:scale-[0.98] transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </a>

                <a
                  href="/register"
                  className="flex-1 h-11 rounded-xl font-bold text-sm bg-[#0066B2] hover:bg-[#005799] active:scale-[0.98] text-white shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Start free</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}



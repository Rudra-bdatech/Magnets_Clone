"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { ArrowRightIcon } from "@/components/icons";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";

function getElementTop(el: HTMLElement): number {
  const rectTop = el.getBoundingClientRect().top + window.scrollY;
  let offsetTop = 0;
  let current: HTMLElement | null = el;
  while (current) {
    offsetTop += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return Math.max(rectTop, offsetTop);
}

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  // Scroll 24px inside the section so 0% of the previous section shows
  const targetY = Math.max(0, getElementTop(el) + 24);

  // Desktop Lenis smooth scroll — pass the exact calibrated pixel target
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenis = (window as any).__lenis;
  if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(targetY, { duration: 1.2 });
    return;
  }

  window.scrollTo({
    top: targetY,
    behavior: "smooth",
  });
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

      <header className="relative mx-auto max-w-7xl px-2 sm:px-8 lg:px-10 pt-2 sm:pt-3.5 z-40">
        {/* DESKTOP NAVBAR (md:flex) */}
        <div className="hidden md:flex items-center justify-between h-17 sm:h-22">
          <a aria-label="Funnels home" href="/" className="shrink-0 flex items-center">
            <BrandLogo height="h-[38px] lg:h-[40px]" />
          </a>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="flex items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <NavLink href="#how-it-works">How it works</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#integrations">Integrations</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors" />

            <a
              className="h-10 items-center px-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:text-zinc-950 dark:hover:text-white inline-flex"
              href="/login"
            >
              Sign in
            </a>
            <a
              className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-3 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-98 shrink-0"
              href="/register"
            >
              Start free <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* MOBILE UNIFIED EXPANDING CARD (md:hidden) */}
        <div className="md:hidden relative h-14 sm:h-16">
          <div
            className={`absolute top-0 inset-x-0 z-50 rounded-2xl transition-[background-color,border-color,box-shadow] duration-200 ${
              mobileMenuOpen
                ? "bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl"
                : "bg-transparent border border-transparent"
            }`}
          >
            {/* Mobile Top Row - Constant px-3 sm:px-4 so items NEVER shift inward on click */}
            <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
              <a aria-label="Funnels home" href="/" className="shrink-0 flex items-center">
                <BrandLogo height="h-7 sm:h-8" />
              </a>

              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <ThemeToggle variant="ghost" size="sm" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors" />

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-expanded={mobileMenuOpen}
                  aria-label="Toggle navigation menu"
                  className="p-2 text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white active:scale-90 transition-transform shrink-0 cursor-pointer"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6 stroke-[2]" />
                  ) : (
                    <Menu className="w-6 h-6 stroke-[2]" />
                  )}
                </button>
              </div>
            </div>

            {/* Smooth Rubber-Band Expansion from Navbar */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  key="mobile-menu-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: { duration: 0.18, ease: "easeInOut" },
                      opacity: { duration: 0.12 },
                    },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    mass: 0.7,
                  }}
                  className="overflow-hidden px-3 sm:px-4 pb-4 flex flex-col gap-3"
                >
                  {/* Hairline Divider inside the unified card */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 mb-0.5" />

                  {/* Rubber-band Staggered Nav Links (Identical elastic physics) */}
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
                          damping: 14,
                          delay: index * 0.025,
                        }}
                        className="py-3 text-base font-bold text-zinc-900 dark:text-white hover:text-[#0066B2] dark:hover:text-[#38BDF8] active:scale-[0.98] transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setMobileMenuOpen(false);
                          setTimeout(() => {
                            smoothScrollTo(item.id);
                          }, 60);
                          history.pushState(null, "", `#${item.id}`);
                        }}
                      >
                        {item.label}
                      </motion.a>
                    ))}
                  </nav>

                  {/* Rubber-band Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 14,
                      delay: 4 * 0.025,
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
          </div>
        </div>
      </header>
    </div>
  );
}

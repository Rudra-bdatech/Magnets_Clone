"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  // Positive offset (+35px) skips section py-28 padding so title and card grid frame perfectly in screen center
  const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY + 35);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenis = (window as any).__lenis;
  if (lenis && typeof lenis.scrollTo === "function") {
    lenis.scrollTo(el, { offset: 35, duration: 1.2 });
    return;
  }

  window.scrollTo({ top: targetY, behavior: "smooth" });
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const id = href.replace("#", "");
  return (
    <a
      href={href}
      className="transition hover:text-[#0066B2] dark:hover:text-white"
      onClick={(e) => {
        e.preventDefault();
        smoothScrollTo(id);
        // Update URL hash without triggering jump
        history.pushState(null, "", href);
      }}
    >
      {children}
    </a>
  );
}

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-30 mx-auto flex h-17 sm:h-22 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10 pt-2 sm:pt-3.5">
      <a aria-label="LeadMagnets home" href="/" className="shrink-0 flex items-center">
        <BrandLogo height="h-10 sm:h-11 lg:h-12" />
      </a>

      {/* Desktop Navigation */}
      <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
        <NavLink href="#how-it-works">How it works</NavLink>
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#integrations">Integrations</NavLink>
        <NavLink href="#pricing">Pricing</NavLink>
      </nav>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <ThemeToggle variant="ghost" />
        <a
          className="hidden h-10 items-center px-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:text-[#0066B2] dark:hover:text-white sm:inline-flex"
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

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 active:scale-90 transition-transform shrink-0 cursor-pointer"
        >
          <motion.div
            animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </motion.div>
        </button>
      </div>

      {/* Mobile Drawer Dropdown with Apple-like spring animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -16,
              scale: 0.98,
              transition: {
                duration: 0.2,
                ease: [0.32, 0, 0.67, 0],
              },
            }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 24,
              mass: 0.8,
            }}
            style={{ transformOrigin: "top center" }}
            className="absolute top-full left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-x border-zinc-200/80 dark:border-zinc-800/80 rounded-b-2xl p-5 pb-6 shadow-2xl md:hidden flex flex-col gap-4 overflow-hidden"
          >
            <nav className="flex flex-col gap-3 font-semibold text-zinc-700 dark:text-zinc-200">
              <a
                href="#how-it-works"
                className="py-2 border-b border-zinc-100 dark:border-zinc-800/60 transition hover:text-[#0066B2]"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo("how-it-works");
                }}
              >
                How it works
              </a>
              <a
                href="#features"
                className="py-2 border-b border-zinc-100 dark:border-zinc-800/60 transition hover:text-[#0066B2]"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo("features");
                }}
              >
                Features
              </a>
              <a
                href="#integrations"
                className="py-2 border-b border-zinc-100 dark:border-zinc-800/60 transition hover:text-[#0066B2]"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo("integrations");
                }}
              >
                Integrations
              </a>
              <a
                href="#pricing"
                className="py-2 border-b border-zinc-100 dark:border-zinc-800/60 transition hover:text-[#0066B2]"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo("pricing");
                }}
              >
                Pricing
              </a>
            </nav>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <a
                href="/login"
                className="w-full text-center py-2.5 px-3 rounded-xl font-semibold text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </a>
              <a
                href="/register"
                className="w-full text-center py-2.5 px-3 rounded-xl font-bold text-sm bg-[#0066B2] text-white hover:bg-[#005799] transition shadow-md flex items-center justify-center whitespace-nowrap"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start free
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
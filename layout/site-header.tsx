"use client";

import { useState } from "react";
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
    <header className="relative z-30 mx-auto flex h-16 sm:h-22 max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10 pt-2 sm:pt-3.5">
      <a aria-label="LeadMagnets home" href="/" className="shrink-0 flex items-center">
        <BrandLogo height="h-8 sm:h-11 lg:h-12" />
      </a>

      {/* Desktop Navigation */}
      <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-400 md:flex">
        <NavLink href="#how-it-works">How it works</NavLink>
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#integrations">Integrations</NavLink>
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <ThemeToggle />
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
          className="inline-flex md:hidden items-center justify-center p-1.5 sm:p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-5 shadow-xl md:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
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
          </nav>

          <div className="flex flex-col gap-2.5 pt-2">
            <a
              href="/login"
              className="w-full text-center py-2.5 rounded-xl font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </a>
            <a
              href="/register"
              className="w-full text-center py-2.5 rounded-xl font-bold bg-[#0066B2] text-white hover:bg-[#005799] transition shadow-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
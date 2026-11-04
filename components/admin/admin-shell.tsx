"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutDashboard,
  Shield,
  ArrowLeft,
  TrendingUp,
  Layers,
  BarChart2,
  Mail,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";
import { createTickPlayer, type TickPlayer } from "@/lib/tick-sound";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/funnels", label: "Funnels", icon: Layers },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/email-health", label: "Email Health", icon: Mail },
  { href: "/admin/system-health", label: "System Health", icon: Activity },
  { href: "/admin/audit-log", label: "Audit Log", icon: Shield },
];

export default function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const tickPlayerRef = useRef<TickPlayer | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const playTick = useCallback(() => {
    try {
      if (!tickPlayerRef.current) {
        tickPlayerRef.current = createTickPlayer();
      }
      tickPlayerRef.current?.play();
    } catch (_) {}
  }, []);

  // Close mobile drawer on route change & reset scroll
  useEffect(() => {
    setMenuOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setIsScrolled(false);
  }, [pathname]);

  // iOS-style scroll listener on the scrollable main container
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      // 36px threshold: right as the page content scrolls past the top padding
      setIsScrolled(mainEl.scrollTop > 36);
    };

    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      mainEl.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isNavActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Determine current active page title & icon for mobile topbar
  const currentNav = NAV.find((item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  let pageTitle = currentNav?.label || "Admin";
  let PageIcon = currentNav?.icon || LayoutDashboard;

  if (pathname.startsWith("/admin/users/") && pathname !== "/admin/users") {
    pageTitle = "User Details";
    PageIcon = Users;
  } else if (pathname.startsWith("/admin/funnels/") && pathname !== "/admin/funnels") {
    pageTitle = "Funnel Details";
    PageIcon = Layers;
  }

  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] dark:bg-[#0E0E10] overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <aside
        className="hidden md:flex w-56 lg:w-60 h-screen bg-[#F0F7FF] dark:bg-[#171717] border-r border-[#E0EDFB] dark:border-white/[0.08] flex-col shrink-0 overflow-y-auto select-none"
        data-lenis-prevent
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E0EDFB] dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <Link href="/admin" aria-label="Admin Overview" className="flex items-center">
              <BrandLogo height="h-7" />
            </Link>
            <ThemeToggle size="sm" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
            Super Admin Console
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" title={email}>
            {email}
          </div>
          <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
            {role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isNavActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#0066B2] text-white shadow-sm dark:bg-[#0066B2]/25 dark:text-[#38BDF8] dark:border dark:border-[#0066B2]/40"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-[#E2F0FD] dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[#E0EDFB] dark:border-white/[0.08]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-[#E2F0FD] dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Back to Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer (AnimatePresence) */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
            {/* Backdrop with fade and blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm cursor-pointer"
              onClick={() => {
                playTick();
                setMenuOpen(false);
              }}
            />

            {/* Apple-grade Spring Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.85 }}
              className="relative z-10 flex h-full h-[100dvh] w-72 max-w-[85vw] flex-col bg-[#F0F7FF] dark:bg-[#171717] border-y border-r border-[#E0EDFB] dark:border-white/[0.08] rounded-r-3xl p-4 text-zinc-900 dark:text-zinc-400 shadow-2xl overflow-hidden select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Top Bar */}
              <div className="mb-3 flex items-center justify-between pb-3 border-b border-[#E0EDFB] dark:border-white/[0.08]">
                <Link
                  href="/admin"
                  aria-label="Admin Overview"
                  onClick={() => {
                    playTick();
                    setMenuOpen(false);
                  }}
                  className="flex items-center"
                >
                  <BrandLogo height="h-8" />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200/70 hover:bg-zinc-300/80 text-zinc-600 hover:text-zinc-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-zinc-300 dark:hover:text-white transition-all active:scale-90 cursor-pointer"
                  onClick={() => {
                    playTick();
                    setMenuOpen(false);
                  }}
                >
                  <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>

              {/* Admin Profile Box */}
              <div className="mb-3 px-3 py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-[#E0EDFB] dark:border-white/[0.06] shrink-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    Super Admin Console
                  </span>
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    {role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate" title={email}>
                  {email}
                </p>
              </div>

              {/* Navigation links (touch target min-h-[44px] for accessibility on Android/Moto G4) */}
              <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 overscroll-contain" aria-label="Admin">
                {NAV.map(({ href, label, icon: Icon, exact }) => {
                  const active = isNavActive(href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => {
                        playTick();
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                        active
                          ? "bg-[#0066B2] text-white shadow-sm shadow-[#0066B2]/20 dark:bg-[#0066B2]/25 dark:text-[#38BDF8] dark:border dark:border-[#0066B2]/40"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-[#E2F0FD] dark:hover:bg-white/5 active:scale-[0.98]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="pt-3 border-t border-[#E0EDFB] dark:border-white/[0.08] space-y-2 shrink-0">
                <Link
                  href="/dashboard"
                  onClick={() => {
                    playTick();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-[#E2F0FD] dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span className="truncate">Back to Dashboard</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar (md:hidden) */}
        <header
          className={`sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between px-3 sm:px-4 md:hidden transition-all duration-200 w-full max-w-full border-b ${
            isScrolled
              ? "border-zinc-200/80 bg-white/90 dark:bg-[#141417]/90 dark:border-white/10 backdrop-blur-xl shadow-xs"
              : "border-transparent bg-white/60 dark:bg-[#0E0E10]/60 backdrop-blur-md"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 md:hidden hover:bg-zinc-100/80 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
              onClick={() => {
                playTick();
                setMenuOpen(true);
              }}
            >
              <Menu className="h-5.5 w-5.5" aria-hidden="true" strokeWidth={2} />
            </button>

            {/* Scroll-Aware Title (iOS Large Title style: only appears when user scrolls past header) */}
            <AnimatePresence>
              {isScrolled && (
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex items-center gap-2 min-w-0"
                >
                  <PageIcon className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {pageTitle}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle size="sm" />
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full"
          data-lenis-prevent
        >
          {children}
        </main>
      </div>
    </div>
  );
}

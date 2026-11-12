"use client";

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
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
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";
import { createTickPlayer, type TickPlayer } from "@/lib/tick-sound";

export interface AdminSidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

export const AdminSidebarContext = createContext<AdminSidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
  setIsCollapsed: () => {},
});

export const useAdminSidebar = () => useContext(AdminSidebarContext);
export const useSidebar = useAdminSidebar;

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/funnels", label: "Funnels", icon: Layers },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/email-health", label: "Email Health", icon: Mail },
  { href: "/admin/system-health", label: "System Health", icon: Activity },
  { href: "/admin/audit-log", label: "Audit Log", icon: Shield },
  { href: "/admin/live-visitors", label: "Live Visitors", icon: Globe },
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
  const lastScrollYRef = useRef(0);
  const [hoveredNavHref, setHoveredNavHref] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const tickPlayerRef = useRef<TickPlayer | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch (_) {}
  }, []);

  const toggleSidebar = useCallback(() => {
    try {
      if (!tickPlayerRef.current) {
        tickPlayerRef.current = createTickPlayer();
      }
      tickPlayerRef.current?.play();
    } catch (_) {}
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(8); } catch (_) {}
    }
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Global Keyboard Shortcut: Cmd+B (Toggle Sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        if (isInput) return;
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Close mobile drawer on route change & reset scroll
  useEffect(() => {
    setMenuOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0 });
    }
    setIsScrolled(false);
    lastScrollYRef.current = 0;
  }, [pathname]);

  // Scroll listener that handles both window scroll (mobile) and container scroll (desktop)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const mainEl = mainRef.current;
          const isDesktop = window.innerWidth >= 768;

          if (isDesktop) {
            const scrollY = mainEl ? mainEl.scrollTop : 0;
            setIsScrolled(scrollY > 40);
          } else {
            // Mobile: check overall scroll first to guarantee false when at or near top
            const scrollY = window.scrollY || document.documentElement.scrollTop || (mainEl ? mainEl.scrollTop : 0) || 0;
            const diff = scrollY - lastScrollYRef.current;

            if (scrollY <= 15) {
              setIsScrolled(false);
            } else {
              // Detect the exact pixel moment the page's large h1 header slides completely behind the 48px sticky navbar
              const h1El = mainEl?.querySelector("h1");
              if (h1El) {
                const rect = h1El.getBoundingClientRect();
                setIsScrolled(rect.bottom <= 48);
              } else {
                setIsScrolled(scrollY > 45);
              }
            }

            lastScrollYRef.current = scrollY;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (mainEl) mainEl.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
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
    <AdminSidebarContext.Provider value={{ isCollapsed, toggleSidebar, setIsCollapsed }}>
      <div className="flex min-h-[100dvh] md:h-screen md:overflow-hidden w-full bg-[#FAFAFA] dark:bg-[#0a0a0a]">
        {/* Desktop Sidebar Spacer (preserves layout flow width) */}
        <motion.div
          animate={{ width: isCollapsed ? 68 : 240 }}
          transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.5 }}
          className="hidden md:block shrink-0"
          aria-hidden="true"
        />

        {/* Desktop Fixed Sidebar */}
        <motion.aside
          animate={{ width: isCollapsed ? 68 : 240 }}
          transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.5 }}
          className="shadow-sm hidden h-screen shrink-0 flex-col border-r border-[#E0EDFB] bg-[#F0F7FF] text-zinc-900 fixed left-0 top-0 bottom-0 md:flex z-40 dark:border-white/[0.08] dark:bg-[#171717] dark:text-zinc-400 overflow-visible select-none"
          data-lenis-prevent
        >
          {/* Header & Logo Area */}
          <div className={`flex shrink-0 items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-3.5"} pt-3.5 pb-2 h-16 relative border-b border-[#E0EDFB] dark:border-white/[0.08]`}>
            <Link
              href="/admin"
              aria-label="Admin Overview"
              className={`flex items-center group relative h-9 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2] ${isCollapsed ? "w-10 justify-center" : ""}`}
              title={isCollapsed ? "Admin Overview" : undefined}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCollapsed ? (
                  <motion.div
                    key="admin-collapsed-logo"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center w-8 h-8"
                  >
                    <BrandLogo collapsed={true} height="h-7 w-7" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="admin-expanded-logo"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center h-9 max-w-[140px] overflow-hidden"
                  >
                    <BrandLogo collapsed={false} height="h-7" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>

            {/* Expanded Header Actions: Theme Toggle + Collapse Button */}
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <ThemeToggle size="sm" />
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Collapse sidebar (⌘B)"
                  className="group flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-[#E2F0FD] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/80 transition-colors duration-150 active:scale-95 cursor-pointer"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                </button>
              </div>
            )}

            {/* Collapsed Expand Button floating on right border */}
            {isCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                title="Expand sidebar (⌘B)"
                className="group absolute -right-3.5 top-4.5 z-[70] flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#171717] border border-zinc-200/90 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.5)] text-zinc-500 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-[#E2F0FD] dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:shadow-md transition-colors duration-150 cursor-pointer active:scale-95 transform-gpu before:absolute before:-inset-1 before:content-[''] before:rounded-full"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Account Identity Chip */}
          {!isCollapsed ? (
            <div className="p-3 border-b border-[#E0EDFB] dark:border-white/[0.08]">
              <div className="px-3 py-2 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-[#E0EDFB] dark:border-white/[0.06] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Admin Console</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5" title={email}>
                  {email}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2.5 flex justify-center border-b border-[#E0EDFB] dark:border-white/[0.08]">
              <div
                className="w-10 h-10 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-[#E0EDFB] dark:border-white/[0.06] flex items-center justify-center relative shadow-xs"
                title={`Admin Console: ${email}`}
              >
                <Shield className="w-4 h-4 text-[#0066B2] dark:text-[#38BDF8]" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav
            className={`flex-1 space-y-1 px-2 py-3 ${
              isCollapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden scrollbar-none"
            }`}
            aria-label="Admin Navigation"
            onMouseLeave={() => setHoveredNavHref(null)}
          >
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = isNavActive(href, exact);
              const isHovered = hoveredNavHref === href;
              return (
                <div
                  key={href}
                  className="relative group flex items-center justify-center"
                  onMouseEnter={() => setHoveredNavHref(href)}
                >
                  <motion.div
                    className={isCollapsed ? "w-10 h-10 flex items-center justify-center" : "w-full"}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 600, damping: 28 }}
                  >
                    <Link
                      href={href}
                      className={`relative flex items-center rounded-xl font-medium transition-colors cursor-pointer min-h-[40px] select-none ${
                        isCollapsed
                          ? "h-10 w-10 mx-auto justify-center"
                          : "w-full gap-3 px-3 py-2.5 text-sm"
                      } ${
                        active
                          ? "text-white font-bold dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      {/* Active Page Solid Pill */}
                      {active && (
                        <motion.div
                          layoutId="adminNavActivePill"
                          transition={{ type: "spring", stiffness: 600, damping: 34 }}
                          className="absolute inset-0 rounded-xl bg-[#0066B2] shadow-xs dark:bg-[#0066B2]/20 dark:border dark:border-[#0066B2]/40"
                        />
                      )}

                      {/* Hover Morphing Spring Pill */}
                      {!active && isHovered && (
                        <motion.div
                          layoutId="adminNavHoverPill"
                          transition={{ type: "spring", stiffness: 800, damping: 38, mass: 0.2 }}
                          className="absolute inset-0 rounded-xl bg-[#E2F0FD] dark:bg-white/5"
                        />
                      )}

                      <Icon
                        className={`shrink-0 relative z-10 transition-transform duration-150 ${
                          active
                            ? "text-white scale-105"
                            : "text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 group-hover:scale-105"
                        } ${isCollapsed ? "h-4.5 w-4.5" : "h-4 w-4"}`}
                      />
                      {!isCollapsed && <span className="truncate relative z-10">{label}</span>}
                    </Link>
                  </motion.div>

                  {/* Collapsed Floating Tooltip */}
                  <AnimatePresence>
                    {isCollapsed && isHovered && (
                      <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-[100] pointer-events-none flex items-center">
                        <motion.div
                          layoutId="adminCollapsedNavFloatingTooltip"
                          initial={{ opacity: 0, x: -6, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -4, scale: 0.95, transition: { duration: 0.06 } }}
                          transition={{ type: "spring", stiffness: 850, damping: 38, mass: 0.2 }}
                          className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 text-zinc-900 text-xs font-semibold border border-zinc-200/90 shadow-[0_10px_25px_-4px_rgba(0,0,0,0.15)] dark:bg-[#171717]/95 dark:text-zinc-100 dark:border-white/10 dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] whitespace-nowrap backdrop-blur-xl transform-gpu will-change-transform"
                        >
                          {/* Micro Arrow Pointer */}
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-white/90 border-l border-b border-zinc-200/90 dark:bg-[#171717]/95 dark:border-white/10" />
                          <span className="relative z-10">{label}</span>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={`p-3 border-t border-[#E0EDFB] dark:border-white/[0.08] mt-auto space-y-2 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
            {isCollapsed && (
              <div className="pb-1">
                <ThemeToggle size="sm" />
              </div>
            )}

            <div
              className="relative group flex items-center justify-center w-full"
              onMouseEnter={() => setHoveredNavHref("back-to-dashboard")}
              onMouseLeave={() => setHoveredNavHref(null)}
            >
              <motion.div
                className={isCollapsed ? "w-10 h-10 flex items-center justify-center" : "w-full"}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
              >
                <Link
                  href="/dashboard"
                  className={`group relative flex items-center rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-[#E2F0FD] dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white transition-all duration-150 ${
                    isCollapsed
                      ? "h-10 w-10 mx-auto justify-center"
                      : "gap-2.5 px-3 py-2.5 w-full"
                  }`}
                  title={isCollapsed ? "Back to Dashboard" : undefined}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform group-hover:-translate-x-0.5" />
                  {!isCollapsed && <span className="truncate">Back to Dashboard</span>}
                </Link>
              </motion.div>

              {/* Collapsed Back to Dashboard Floating Tooltip */}
              <AnimatePresence>
                {isCollapsed && hoveredNavHref === "back-to-dashboard" && (
                  <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-[100] pointer-events-none flex items-center">
                    <motion.div
                      initial={{ opacity: 0, x: -6, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -4, scale: 0.95, transition: { duration: 0.06 } }}
                      transition={{ type: "spring", stiffness: 850, damping: 38, mass: 0.2 }}
                      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 text-zinc-900 text-xs font-semibold border border-zinc-200/90 shadow-[0_10px_25px_-4px_rgba(0,0,0,0.15)] dark:bg-[#171717]/95 dark:text-zinc-100 dark:border-white/10 dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] whitespace-nowrap backdrop-blur-xl transform-gpu will-change-transform"
                    >
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-white/90 border-l border-b border-zinc-200/90 dark:bg-[#171717]/95 dark:border-white/10" />
                      <span className="relative z-10">Back to Dashboard</span>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>

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
              onClick={() => setMenuOpen(false)}
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
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center"
                >
                  <BrandLogo height="h-8" />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200/70 hover:bg-zinc-300/80 text-zinc-600 hover:text-zinc-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-zinc-300 dark:hover:text-white transition-all active:scale-90 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>

              {/* Admin Profile Box */}
              <div className="mb-3 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-[#E0EDFB] dark:border-white/[0.06] shadow-xs shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Admin Console</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5" title={email}>
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
                      onClick={() => setMenuOpen(false)}
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
                  onClick={() => setMenuOpen(false)}
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
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] md:h-screen md:overflow-hidden">
        {/* Mobile Header Bar (md:hidden) */}
        <header
          className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between px-3 sm:px-4 md:hidden w-full max-w-full border-b border-black/[0.04] dark:border-white/[0.05] bg-white/40 dark:bg-black/40 backdrop-blur-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 md:hidden hover:bg-zinc-100/80 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
              onClick={() => setMenuOpen(true)}
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
          className="flex-1 min-w-0 w-full md:overflow-y-auto md:overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y bg-gradient-to-b from-[#EFF6FF]/40 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0a0a0a]"
          data-lenis-prevent
        >
          {children}
        </main>
      </div>
    </div>
  </AdminSidebarContext.Provider>
  );
}

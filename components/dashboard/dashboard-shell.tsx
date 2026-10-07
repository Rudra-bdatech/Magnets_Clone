"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, FolderOpen, Users, Sliders, Palette, User, CircleHelp, Menu, X, Search, ChevronRight, HelpCircle, Sun, Moon, Monitor, Bug, Lightbulb, LogOut, BookOpen, Gift, Compass, Send, GitFork, Calendar, Settings, Globe, Mail, Share2, Cpu, Slack, Zap, Link as LinkIcon, BarChart3, PlayCircle, CheckCircle2, ArrowLeft, Sparkles, Rocket, ExternalLink, ListChecks, Loader2, FileLock, Lock, LayoutDashboard, Linkedin } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ThemeToggle from "@/components/theme-toggle";
import BrandLogo from "@/components/brand";
import type { Account } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { ExpandableScreen, ExpandableScreenTrigger } from "@/components/ui/expandable-screen";
import { isSessionValid, loadAccount, setSessionExpiry, loadPages, loadSequences, loadIntegrations } from "@/lib/store";
import { computeOnboardingStatus, type OnboardingStatus } from "@/lib/onboarding";
import { signOut } from "next-auth/react";

const HelpCenterContent = dynamic(() => import("./HelpCenterContent"), {
  ssr: false,
});

const baseNavItems: { href: string; label: string; icon: any; isModal?: boolean; badge?: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/landing-page", label: "Landing Page", icon: FileText },
  { href: "/dashboard/locked-pdf", label: "Locked PDF", icon: Lock },
  { href: "/dashboard/sequences", label: "Email Sequences", icon: Mail },
  { href: "/dashboard/assets", label: "Assets", icon: FolderOpen },
  { href: "/dashboard/integration", label: "Integration", icon: Sliders },
  { href: "/dashboard/linkedin", label: "LinkedIn Auto-Reply", icon: Linkedin },
  { href: "/dashboard/templates", label: "Templates", icon: Palette },
];

export default function DashboardShell({
  account,
  title = "Dashboard",
  activeNavHref,
  children,
}: {
  account?: Account | null;
  title?: string;
  activeNavHref?: string;
  children: React.ReactNode;
}) {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(account || null);
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDrawerProfileMenu, setShowDrawerProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileDrawerProfileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (showHelp) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (lenis && typeof lenis.stop === "function") lenis.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    };
  }, [showHelp]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      const clickedInsideDesktop = profileMenuRef.current?.contains(target);
      const clickedInsideMobileDrawer = mobileDrawerProfileMenuRef.current?.contains(target);

      if (!clickedInsideDesktop && !clickedInsideMobileDrawer) {
        setShowProfileMenu(false);
        setShowDrawerProfileMenu(false);
      }
    }
    if (showProfileMenu || showDrawerProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showProfileMenu, showDrawerProfileMenu]);
  const [dark, setDark] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");
  const [showCreateMagnetModal, setShowCreateMagnetModal] = useState(false);
  const [selectedMagnetType, setSelectedMagnetType] = useState<"classic" | "locked-pdf">("locked-pdf");
  const [createMagnetName, setCreateMagnetName] = useState("");

  const [feedbackModal, setFeedbackModal] = useState<"bug" | "feature" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const applyThemeMode = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    let isDark = false;
    if (mode === "system") {
      isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = mode === "dark";
    }
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    try {
      localStorage.setItem("leadmagnets-theme-mode", mode);
      localStorage.setItem("leadmagnets-theme", isDark ? "dark" : "light");
    } catch (_) { }
  };

  const openGmailCompose = (type: "bug" | "feature") => {
    const email = "info@bdatechnologies.com";
    const subject = type === "bug" ? "[Bug Report] Issue on LeadMagnets" : "[Feature Request] Suggestion for LeadMagnets";
    const body = type === "bug"
      ? `Hi Support Team,\n\nI encountered the following issue:\n\n`
      : `Hi Support Team,\n\nI would like to request the following feature:\n\n`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (typeof window !== "undefined") {
      const win = window.open(gmailUrl, "_blank", "noopener,noreferrer");
      if (!win) {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    if (typeof window !== "undefined") {
      try {
        const lastMethod = localStorage.getItem("leadmagnets_last_auth_method");
        const lastEmail = localStorage.getItem("leadmagnets_last_auth_email") || localStorage.getItem("currentUserEmail");
        const themeMode = localStorage.getItem("leadmagnets-theme-mode");
        const theme = localStorage.getItem("leadmagnets-theme");

        localStorage.clear();
        sessionStorage.clear();

        // Restore non-sensitive device preferences so "Last used" and theme stay active
        if (lastMethod) localStorage.setItem("leadmagnets_last_auth_method", lastMethod);
        if (lastEmail) localStorage.setItem("leadmagnets_last_auth_email", lastEmail);
        if (themeMode) localStorage.setItem("leadmagnets-theme-mode", themeMode);
        if (theme) localStorage.setItem("leadmagnets-theme", theme);
      } catch (_) { }
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
    } catch (_) { }

    try {
      await signOut({ callbackUrl: "/login", redirect: false });
    } catch (_) { }

    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  const [mounted, setMounted] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [navigatingTarget, setNavigatingTarget] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hoveredNavHref, setHoveredNavHref] = useState<string | null>(null);
  const [hoveredProfileMenuKey, setHoveredProfileMenuKey] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingTarget(null);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedMode = (localStorage.getItem("leadmagnets-theme-mode") as "light" | "dark" | "system") || "system";
      setThemeMode(savedMode);
    }
    setDark(typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

    const loaded = loadAccount();
    if (loaded) {
      setCurrentAccount(loaded);
    }

    const handleAccountUpdate = () => {
      const loaded = loadAccount();
      if (loaded) {
        setCurrentAccount(loaded);
        setAvatarError(false);
      }
    };

    const handleOpenHelpTopic = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.topic) {
        setSelectedTopic(customEvent.detail.topic);
      } else {
        setSelectedTopic("Account settings");
      }
      setShowHelp(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("accountUpdated", handleAccountUpdate);
      window.addEventListener("storage", handleAccountUpdate);
      window.addEventListener("openHelpTopic", handleOpenHelpTopic);
    }

    if (typeof window !== "undefined") {
      const activeEmail = localStorage.getItem("currentUserEmail");
      const activeAccount = loadAccount();
      if (!isSessionValid() || !activeEmail || !activeAccount) {
        // Verify HTTP-Only cookie as fallback
        fetch("/api/auth/me")
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated && data.email) {
              localStorage.setItem("currentUserEmail", data.email);
              localStorage.setItem("leadmagnets_last_auth_email", data.email);
              setSessionExpiry(7);
              if (data.user) {
                localStorage.setItem("currentUserAccount", JSON.stringify(data.user));
                setCurrentAccount(data.user);
                setAvatarError(false);
              }
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
              window.location.href = "/login";
            }
          })
          .catch(() => {
            setIsAuthenticated(false);
            window.location.href = "/login";
          });
        return;
      } else {
        setIsAuthenticated(true);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("accountUpdated", handleAccountUpdate);
        window.removeEventListener("storage", handleAccountUpdate);
        window.removeEventListener("openHelpTopic", handleOpenHelpTopic);
      }
    };
  }, [pathname, router]);

  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  const refreshOnboarding = useCallback(() => {
    const p = loadPages();
    const s = loadSequences();
    const a = loadAccount() || currentAccount;
    const i = loadIntegrations();
    setOnboardingStatus(computeOnboardingStatus({ pages: p, sequences: s, account: a, integrations: i }));
  }, [currentAccount]);

  useEffect(() => {
    refreshOnboarding();

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "currentUserPages" ||
        e.key === "currentUserAccount" ||
        e.key === "currentUserSequences" ||
        e.key === "currentUserIntegrations" ||
        e.key === "leadmagnets_last_sync"
      ) {
        refreshOnboarding();
      }
    };

    window.addEventListener("storage", handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel("leadmagnets_live_sync");
        bc.onmessage = () => {
          refreshOnboarding();
        };
      }
    } catch (_) {}

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, [refreshOnboarding]);

  const computedNav = useMemo(() => {
    const showGetStarted = onboardingStatus !== null && !onboardingStatus.isAllCompleted;

    if (!showGetStarted) {
      return baseNavItems;
    }

    const getStartedItem: { href: string; label: string; icon: any; isModal?: boolean; badge?: string } = {
      href: "/dashboard/get-started",
      label: "Get Started",
      icon: Rocket,
      badge: onboardingStatus ? `${onboardingStatus.completedCount}/${onboardingStatus.totalCount}` : undefined,
    };

    const list = [getStartedItem, ...baseNavItems];
    return list;
  }, [onboardingStatus]);

  const isCurrentLockedPdf = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (!pathname.startsWith("/dashboard/leadmagnets/")) return false;
    try {
      const id = pathname.split("/")[3];
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("type") === "locked-pdf") return true;
      if (id) {
        const p = loadPages().find((item) => item.id === id);
        if (p && (p.template === "locked-pdf" || (p.pdfPages && p.pdfPages.length > 0))) return true;
      }
    } catch (_) {}
    return false;
  }, [pathname]);

  const rawAccount = currentAccount || account;
  const activeEmail = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || rawAccount?.email || "";
  const displayAccount = {
    name: rawAccount?.name || "User",
    email: activeEmail,
    plan: rawAccount?.plan || "Free",
    brandColor: rawAccount?.brandColor || "#0066B2",
    avatar: rawAccount?.avatar || null,
  };

  useEffect(() => {
    setAvatarError(false);
  }, [displayAccount.avatar]);

  if (mounted && isAuthenticated === false) {
    return null;
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#18181B]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0066B2] border-t-transparent" />
      </div>
    );
  }

  return (
    <ExpandableScreen
      isOpen={showHelp}
      onOpenChange={(open) => {
        setShowHelp(open);
        if (!open) setSelectedTopic(null);
      }}
      layoutId="sidebar-help-card"
      triggerRadius="8px"
      contentRadius="20px"
    >
      <div className="dashboard-canvas flex min-h-screen relative w-full max-w-full">

        <aside className="shadow-sm hidden h-screen w-[14.5rem] shrink-0 flex-col border-r border-[#E0EDFB] bg-[#F0F7FF] text-zinc-900 sticky top-0 md:flex z-50 dark:border-white/10 dark:bg-[#18181B] dark:text-[#9B9085]">
          <div className="flex shrink-0 items-center px-3.5 pt-3 pb-1">
            <Link href="/dashboard" aria-label="Dashboard" className="flex items-center">
              <BrandLogo height="h-9" />
            </Link>
          </div>
          <nav
            className="mt-1 flex-1 space-y-1 px-1.5"
            aria-label="Dashboard"
            onMouseLeave={() => setHoveredNavHref(null)}
          >
            {computedNav.map((item, idx) => {
              const active = activeNavHref
                ? item.href === activeNavHref
                : item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : item.href === "/dashboard/locked-pdf"
                    ? (pathname === "/dashboard/locked-pdf" || isCurrentLockedPdf)
                    : item.href === "/dashboard/landing-page"
                      ? (!isCurrentLockedPdf && (pathname === "/dashboard/landing-page" || pathname === "/dashboard/leadmagnets" || pathname.startsWith("/dashboard/leadmagnets/")))
                      : (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/landing-page" && item.href !== "/dashboard/locked-pdf" && pathname.startsWith(`${item.href}/`)));
              const isHovered = hoveredNavHref === item.href;

              if (item.isModal) {
                return (
                  <div key={item.href} onMouseEnter={() => setHoveredNavHref(item.href)}>
                    <ExpandableScreenTrigger className="w-full">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        className="relative group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors text-zinc-600 dark:text-[#9B9085] dark:hover:text-white cursor-pointer"
                      >
                        {isHovered && (
                          <motion.div
                            layoutId="leftPanelHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-lg bg-[#E2F0FD] dark:bg-[#25252a]"
                          />
                        )}
                        <item.icon className="h-4 w-4 shrink-0 relative z-10 text-zinc-500 group-hover:text-zinc-900 dark:text-[#9B9085] dark:group-hover:text-white" aria-hidden="true" />
                        <span className="flex-1 text-left relative z-10 flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </motion.button>
                    </ExpandableScreenTrigger>
                  </div>
                );
              }

              return (
                <div key={item.href} onMouseEnter={() => setHoveredNavHref(item.href)}>
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 600, damping: 28 }}
                  >
                    <Link
                      href={item.href}
                      className={`relative group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors cursor-pointer ${active
                        ? "text-white font-bold dark:text-white"
                        : "text-zinc-600 dark:text-[#9B9085] dark:hover:text-white"
                        }`}
                      onClick={(e) => {
                        if (pathname !== item.href) {
                          e.preventDefault();
                          router.push(item.href);
                        }
                      }}
                    >
                      {/* Active Page Solid Pill */}
                      {active && (
                        <motion.div
                          layoutId="leftPanelActivePill"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          className="absolute inset-0 rounded-lg bg-[#0066B2] shadow-xs dark:bg-[#0066B2]/20 dark:border dark:border-[#0066B2]/40"
                        />
                      )}
                      {/* Hover Morphing Pill */}
                      {!active && isHovered && (
                        <motion.div
                          layoutId="leftPanelHoverPill"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          className="absolute inset-0 rounded-lg bg-[#E2F0FD] dark:bg-[#25252a]"
                        />
                      )}
                      <item.icon className={`h-4 w-4 shrink-0 relative z-10 ${active ? "text-white" : "text-zinc-500 group-hover:text-zinc-900 dark:text-[#9B9085] dark:group-hover:text-white"}`} aria-hidden="true" />
                      <span className="flex-1 relative z-10 flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  </motion.div>
                </div>
              );
            })}
          </nav>
          <div className="px-1.5 py-2.5">
            <div ref={profileMenuRef} className="relative">
              {/* Profile Popover Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: "bottom left" }}
                    className="absolute bottom-full mb-2 left-0 w-56 rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md z-[70] text-zinc-900 flex flex-col gap-0.5 dark:border-zinc-800/90 dark:bg-[#18181b]/95 dark:text-white dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Theme Switcher Segmented Control */}
                    <div className="relative flex items-center justify-between p-1 bg-zinc-100/90 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800/90 mb-1 select-none">
                      {(["light", "dark", "system"] as const).map((mode) => {
                        const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
                        const isActive = themeMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`}
                            onClick={() => applyThemeMode(mode)}
                            className={`relative flex-1 flex items-center justify-center py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer z-10 ${isActive
                              ? "text-zinc-900 dark:text-white"
                              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                              }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeThemePillSidebar"
                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                className="absolute inset-0.5 bg-white dark:bg-zinc-800/90 rounded-[9px] shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                              />
                            )}
                            <span className="relative z-10 flex items-center justify-center">
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div onMouseLeave={() => setHoveredProfileMenuKey(null)} className="flex flex-col gap-0.5">
                      {/* Account / User Section */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredProfileMenuKey("account")}
                        onClick={() => {
                          setShowProfileMenu(false);
                          router.push("/dashboard/settings");
                        }}
                        className="relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "account" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-[10px] bg-[#E2F0FD] dark:bg-zinc-800/80"
                          />
                        )}
                        <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                          <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                        </span>
                        <span className="relative z-10">Account</span>
                      </motion.button>

                      {/* Semantic Divider between Account and Support */}
                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/70" />

                      {/* Support & Feedback Section */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredProfileMenuKey("help")}
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowHelp(true);
                        }}
                        className="relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "help" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-[10px] bg-[#E2F0FD] dark:bg-zinc-800/80"
                          />
                        )}
                        <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                          <CircleHelp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                        </span>
                        <span className="relative z-10">Help</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredProfileMenuKey("bug")}
                        onClick={() => {
                          openGmailCompose("bug");
                          setShowProfileMenu(false);
                        }}
                        className="relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "bug" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-[10px] bg-[#E2F0FD] dark:bg-zinc-800/80"
                          />
                        )}
                        <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                          <Bug className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                        </span>
                        <span className="relative z-10">Report a bug</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredProfileMenuKey("feature")}
                        onClick={() => {
                          openGmailCompose("feature");
                          setShowProfileMenu(false);
                        }}
                        className="relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "feature" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-[10px] bg-[#E2F0FD] dark:bg-zinc-800/80"
                          />
                        )}
                        <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
                          <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                        </span>
                        <span className="relative z-10">Request a feature</span>
                      </motion.button>
                    </div>

                    {/* Divider before Destructive Action */}
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/70" />

                    <motion.button
                      type="button"
                      disabled={isLoggingOut}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 600, damping: 28 }}
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50/80 transition-colors w-full dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isLoggingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                        ) : (
                          <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" strokeWidth={1.85} />
                        )}
                      </span>
                      <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex w-full items-center justify-between gap-2.5 rounded-xl p-2 text-left hover:bg-[#E2F0FD] transition dark:hover:bg-[#25252A]"
              >
                {displayAccount.avatar && !avatarError ? (
                  <img
                    src={displayAccount.avatar}
                    alt={displayAccount.name}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="h-8 w-8 shrink-0 rounded-full object-cover border border-[#0066B2]/40"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0066B2] text-xs font-extrabold text-white dark:bg-white dark:text-[#0066B2]" suppressHydrationWarning>
                    {mounted
                      ? (displayAccount.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || displayAccount.name.charAt(0))
                      : (displayAccount.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "RK")}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-zinc-900 leading-tight dark:text-white" suppressHydrationWarning>{displayAccount.name}</p>
                  <p className="truncate text-[10px] text-zinc-500 leading-tight mt-0.5 dark:text-[#9B9085]" suppressHydrationWarning>{displayAccount.email}</p>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <AnimatePresence>
          {menuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              {/* Backdrop with fade and blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="fixed inset-0 bg-black/45 backdrop-blur-sm"
                onClick={() => setMenuOpen(false)}
              />

              {/* Apple-grade Spring Drawer Panel */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.85 }}
                className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-[#F0F7FF] dark:bg-[#18181B] border-r border-[#E0EDFB] dark:border-white/10 p-4 text-zinc-900 dark:text-[#9B9085] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="mb-4 flex items-center justify-between pb-3">
                <Link href="/dashboard" aria-label="Dashboard" onClick={() => setMenuOpen(false)}>
                  <BrandLogo height="h-9" />
                </Link>
                <button
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E0EDFB] dark:border-white/10 text-zinc-600 dark:text-[#9B9085] hover:bg-[#E2F0FD] dark:hover:bg-[#1C1613] hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1" aria-label="Dashboard">
                {computedNav.map((item) => {
                  const active = activeNavHref
                    ? item.href === activeNavHref
                    : item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : item.href === "/dashboard/locked-pdf"
                        ? (pathname === "/dashboard/locked-pdf" || isCurrentLockedPdf)
                        : item.href === "/dashboard/landing-page"
                          ? (!isCurrentLockedPdf && (pathname === "/dashboard/landing-page" || pathname === "/dashboard/leadmagnets" || pathname.startsWith("/dashboard/leadmagnets/")))
                          : (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/landing-page" && item.href !== "/dashboard/locked-pdf" && pathname.startsWith(`${item.href}/`)));
                  if (item.isModal) {
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          setMenuOpen(false);
                          setShowHelp(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#0066B2]/15 dark:hover:text-white cursor-pointer"
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-[#9B9085]" aria-hidden="true" />
                        <span className="flex-1 text-left flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          setMenuOpen(false);
                          if (pathname !== item.href) {
                            e.preventDefault();
                            router.push(item.href);
                          }
                        }}
                        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition cursor-pointer ${active
                          ? "bg-[#0066B2] text-white font-bold dark:bg-[#0066B2]/20 dark:text-[#38BDF8]"
                          : "text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#0066B2]/15 dark:hover:text-white"
                          }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white dark:text-[#38BDF8]" : "text-zinc-500 dark:text-[#9B9085]"}`} aria-hidden="true" />
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </nav>

              {/* Bottom Profile Section in Mobile Drawer */}
              <div ref={mobileDrawerProfileMenuRef} className="pt-3 relative">
                <AnimatePresence>
                  {showDrawerProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "bottom left" }}
                      className="absolute bottom-full mb-2 left-0 w-full rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md z-50 text-zinc-900 flex flex-col gap-0.5 dark:border-zinc-800/90 dark:bg-[#18181b]/95 dark:text-white dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Theme Switcher Segmented Control */}
                      <div className="relative flex items-center justify-between p-1 bg-zinc-100/90 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800/90 mb-1 select-none">
                        {(["light", "dark", "system"] as const).map((mode) => {
                          const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
                          const isActive = themeMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`}
                              onClick={() => applyThemeMode(mode)}
                              className={`relative flex-1 flex items-center justify-center py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer z-10 ${isActive
                                ? "text-zinc-900 dark:text-white"
                                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeThemePillDrawer"
                                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                  className="absolute inset-0.5 bg-white dark:bg-zinc-800/90 rounded-[9px] shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                                />
                              )}
                              <span className="relative z-10 flex items-center justify-center">
                                <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        {/* Account / User Section */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            setMenuOpen(false);
                            router.push("/dashboard/settings");
                          }}
                          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white cursor-pointer"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                          </span>
                          <span>Account</span>
                        </button>

                        {/* Semantic Divider between Account and Support */}
                        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/70" />

                        {/* Support & Feedback Section */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            setMenuOpen(false);
                            setShowHelp(true);
                          }}
                          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white cursor-pointer"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            <CircleHelp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                          </span>
                          <span>Help</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            openGmailCompose("bug");
                          }}
                          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white cursor-pointer"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            <Bug className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                          </span>
                          <span>Report a bug</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            openGmailCompose("feature");
                          }}
                          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white cursor-pointer"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.85} />
                          </span>
                          <span>Request a feature</span>
                        </button>
                      </div>

                      {/* Divider before Destructive Action */}
                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/70" />

                      <button
                        type="button"
                        disabled={isLoggingOut}
                        onClick={() => {
                          setShowDrawerProfileMenu(false);
                          setMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50/80 transition-colors w-full dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                          {isLoggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                          ) : (
                            <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" strokeWidth={1.85} />
                          )}
                        </span>
                        <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setShowDrawerProfileMenu(!showDrawerProfileMenu)}
                  className="flex w-full items-center justify-between gap-2.5 rounded-xl p-2 text-left hover:bg-[#E2F0FD] transition dark:hover:bg-[#25252A] cursor-pointer"
                >
                  {displayAccount.avatar && !avatarError ? (
                    <img
                      src={displayAccount.avatar}
                      alt={displayAccount.name}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="h-8 w-8 shrink-0 rounded-full object-cover border border-[#0066B2]/40"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0066B2] text-xs font-extrabold text-white dark:bg-white dark:text-[#0066B2]">
                      {mounted
                        ? (displayAccount.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || displayAccount.name.charAt(0))
                        : (displayAccount.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "RK")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-zinc-900 leading-tight dark:text-white">{displayAccount.name}</p>
                    <p className="truncate text-[10px] text-zinc-500 leading-tight mt-0.5 dark:text-[#9B9085]">{displayAccount.email}</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#FAFAFA] dark:bg-[#0E0E10] w-full max-w-full">
          <header className="dashboard-chrome sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/75 dark:bg-[#141417]/75 dark:border-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#141417]/60 px-4 sm:px-6 md:hidden transition-colors w-full max-w-full">
            <div className="flex items-center gap-2.5">
              <button
                aria-label="Open menu"
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 md:hidden hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link href="/dashboard" aria-label="Dashboard" className="flex items-center">
                <BrandLogo height="h-7" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="min-w-0 flex-1 bg-[#FAFAF8] dark:bg-[#0E0E10] w-full max-w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.05, ease: "easeOut" } }}
                transition={{
                  duration: 0.13,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full h-full max-w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>



        {/* Help Centre Expandable Content (Dynamically Loaded) */}
        {showHelp && (
          <HelpCenterContent
            onClose={() => {
              setShowHelp(false);
              setSelectedTopic(null);
            }}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            onCreateMagnet={() => setShowCreateMagnetModal(true)}
          />
        )}

        {/* 'Create a magnet' Popup Modal Overlay triggered from DashboardShell */}
        {showCreateMagnetModal && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all duration-200"
            onClick={() => setShowCreateMagnetModal(false)}
          >
            <div
              className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-2xl border-t sm:border border-zinc-200/80 dark:border-[#2e2e38] bg-white dark:bg-[#18181c] p-5 sm:p-6 text-zinc-900 dark:text-white shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Drag Indicator */}
              <div className="flex sm:hidden justify-center pb-1 -mt-1">
                <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              </div>

              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Create a magnet
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateMagnetModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const isLockedPdf = selectedMagnetType === "locked-pdf";
                  const defaultName = isLockedPdf ? "Locked PDF Document" : "Untitled Page";
                  const name = createMagnetName.trim() || defaultName;
                  const defaultSlug = isLockedPdf ? "locked-pdf" : "untitled-page";
                  const cleanSlug =
                    createMagnetName
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9\s-]/g, "")
                      .replace(/\s+/g, "-") || defaultSlug;
                  const newId = `page-${Date.now()}`;

                  try {
                    const { loadPages, savePages } = require("@/lib/store");
                    const currentPages = loadPages();
                    const newPage = isLockedPdf
                      ? {
                          id: newId,
                          name,
                          slug: cleanSlug,
                          status: "draft",
                          headline: name,
                          subheadline: "Enter your email to verify and unlock full PDF access instantly.",
                          cta: "Verify & Unlock PDF",
                          deliverable: "Locked PDF Document",
                          accent: "#0066B2",
                          views: 0,
                          signups: 0,
                          conversionRate: 0,
                          template: "locked-pdf",
                          pdfPages: [],
                          pdfFreePages: 2,
                          pdfTitle: name,
                          pdfPageCount: 0,
                          updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                        }
                      : {
                          id: newId,
                          name,
                          slug: cleanSlug,
                          status: "draft",
                          headline: name,
                          subheadline: "Enter your email to get instant access.",
                          buttonText: "Get instant access",
                          accent: "#0066B2",
                          views: 0,
                          signups: 0,
                          updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                          deliveryEmail: {
                            subject: "Your resource is inside",
                            previewText: "Here is your link",
                            body: "Thanks for signing up!",
                            linkText: "Access resource",
                            linkUrl: "",
                          },
                        };
                    savePages([newPage, ...currentPages]);
                  } catch (_) {}

                  setShowCreateMagnetModal(false);
                  setCreateMagnetName("");
                  if (isLockedPdf) {
                    router.push("/dashboard/locked-pdf");
                  } else {
                    router.push(`/dashboard/leadmagnets/${newId}`);
                  }
                }}
                className="space-y-4"
              >
                {/* Format Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Locked PDF Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedMagnetType("locked-pdf")}
                      className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMagnetType === "locked-pdf"
                          ? "border-[#0066B2] bg-[#0066B2]/10 dark:bg-[#0066B2]/15 ring-2 ring-[#0066B2] shadow-sm"
                          : "border-zinc-200 dark:border-[#2e2e38] bg-zinc-50/70 dark:bg-[#121214] hover:border-zinc-300 dark:hover:border-[#3e3e4a]"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 transition-colors ${
                          selectedMagnetType === "locked-pdf"
                            ? "bg-[#0066B2] text-white"
                            : "bg-zinc-200 dark:bg-[#25252b] text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Locked PDF
                        </span>
                        <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 leading-snug">
                          OTP verification gate with live interactive preview.
                        </p>
                      </div>
                    </button>

                    {/* Classic Landing Page Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedMagnetType("classic")}
                      className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMagnetType === "classic"
                          ? "border-[#059669] bg-[#059669]/10 dark:bg-[#059669]/15 ring-2 ring-[#059669] shadow-sm"
                          : "border-zinc-200 dark:border-[#2e2e38] bg-zinc-50/70 dark:bg-[#121214] hover:border-zinc-300 dark:hover:border-[#3e3e4a]"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 transition-colors ${
                          selectedMagnetType === "classic"
                            ? "bg-[#059669] text-white"
                            : "bg-zinc-200 dark:bg-[#25252b] text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Landing Page
                        </span>
                        <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 leading-snug">
                          Opt-in landing page with automated lead delivery.
                        </p>
                      </div>
                    </button>
                  </div>

                {/* Page Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">Page name</label>
                  <input
                    type="text"
                    autoFocus
                    value={createMagnetName}
                    onChange={(e) => setCreateMagnetName(e.target.value)}
                    placeholder={
                      selectedMagnetType === "locked-pdf"
                        ? "e.g. AI Pipeline Playbook"
                        : "e.g. 2026 Growth Checklist"
                    }
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:ring-2 focus:ring-[#0066B2] focus:border-[#0066B2] transition-all"
                  />
                </div>

                {/* URL Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">URL slug</label>
                  <div className="flex items-center rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-500 dark:text-[#9B9085]">
                    <span className="text-zinc-400 dark:text-[#666675] shrink-0 mr-1.5 font-mono">/</span>
                    <span className="font-mono text-zinc-800 dark:text-[#d4c8bc] truncate">
                      {createMagnetName
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-") ||
                        (selectedMagnetType === "locked-pdf"
                          ? "locked-pdf"
                          : "untitled-page")}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-[#666675]">The path of the page. Lowercase, digits, and hyphens only.</p>
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setShowCreateMagnetModal(false)}
                    className="flex-1 sm:flex-initial rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#222228] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2c2c34] transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-[1.5] sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer ${
                      selectedMagnetType === "locked-pdf"
                        ? "bg-[#0066B2] hover:bg-[#005291] shadow-[0_4px_14px_rgba(0,102,178,0.3)]"
                        : "bg-[#059669] hover:bg-[#047857] shadow-[0_4px_14px_rgba(5,150,105,0.3)]"
                    }`}
                  >
                    {selectedMagnetType === "locked-pdf" ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Create Locked PDF</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        <span>Create Landing Page</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-App Feedback / Bug Report / Feature Request Modal */}
        {feedbackModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#18181B] dark:text-white">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white">
                  {feedbackModal === "bug" ? (
                    <>
                      <Bug className="h-4.5 w-4.5 text-rose-500" />
                      <span>Report a Bug</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5 text-[#0066B2]" />
                      <span>Request a Feature</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackModal(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {feedbackSent ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-bounce" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Thank you for your feedback!</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                    {feedbackModal === "bug"
                      ? "Our engineering team has received your bug report and will investigate."
                      : "We've added your feature suggestion to our product roadmap."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFeedbackModal(null)}
                    className="mt-2 rounded-xl bg-[#0066B2] px-5 py-2 text-xs font-bold text-white hover:bg-[#005799] transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!feedbackText.trim()) return;
                    setFeedbackSent(true);
                  }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      {feedbackModal === "bug" ? "What issue did you encounter?" : "What feature would you like to see?"}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder={
                        feedbackModal === "bug"
                          ? "Please describe what happened, expected behavior, or steps to reproduce..."
                          : "Describe the feature or workflow improvement you'd love..."
                      }
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#121214] p-3 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] transition placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackModal(null)}
                      className="rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!feedbackText.trim()}
                      className="rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-sm"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ExpandableScreen>
  );
}
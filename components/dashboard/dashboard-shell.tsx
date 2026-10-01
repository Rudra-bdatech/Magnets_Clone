"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, FolderOpen, Users, Sliders, Palette, User, CircleHelp, Menu, X, Search, ChevronRight, HelpCircle, Sun, Moon, Monitor, Bug, Lightbulb, LogOut, BookOpen, Gift, Compass, Send, GitFork, Calendar, Settings, Globe, Mail, Share2, Cpu, Slack, Zap, Link as LinkIcon, BarChart3, PlayCircle, CheckCircle2, ArrowLeft, Sparkles, Rocket, ExternalLink, ListChecks, Loader2, FileLock, Lock, LayoutDashboard, Linkedin } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ThemeToggle from "@/components/theme-toggle";
import BrandLogo from "@/components/brand";
import type { Account } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { ExpandableScreen, ExpandableScreenTrigger } from "@/components/ui/expandable-screen";
import { isSessionValid, loadAccount, setSessionExpiry } from "@/lib/store";
import { signOut } from "next-auth/react";

const HelpCenterContent = dynamic(() => import("./HelpCenterContent"), {
  ssr: false,
});

const mobileNav: { href: string; label: string; icon: any; isModal?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/landing-page", label: "Landing Page", icon: FileText },
  { href: "/dashboard/locked-pdf", label: "Locked PDF", icon: Lock },
  { href: "/dashboard/sequences", label: "Email Sequences", icon: Mail },
  { href: "/dashboard/assets", label: "Assets", icon: FolderOpen },
  { href: "/dashboard/integration", label: "Integration", icon: Sliders },
  { href: "/dashboard/linkedin", label: "LinkedIn Auto-Reply", icon: Linkedin },
  { href: "/dashboard/brand", label: "Brand", icon: Palette },
];

export default function DashboardShell({
  account,
  title,
  children,
}: {
  account?: Account | null;
  title: string;
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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
      } catch (_) { }
    }

    try {
      fetch("/api/auth/logout", { method: "POST" }).catch(() => { });
    } catch (_) { }

    try {
      signOut({ callbackUrl: "/login", redirect: false }).catch(() => { });
    } catch (_) { }

    if (typeof window !== "undefined") {
      window.location.href = "/login";
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

  const rawAccount = currentAccount || account;
  const activeEmail = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || rawAccount?.email || "";
  const displayAccount = {
    name: rawAccount?.name || "User",
    email: activeEmail,
    plan: rawAccount?.plan || "Free",
    brandColor: rawAccount?.brandColor || "#0066B2",
    avatar: rawAccount?.avatar || null,
  };

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
      <div className="dashboard-canvas flex min-h-screen relative">

        <aside className="shadow-sm hidden h-screen w-[14.5rem] shrink-0 flex-col border-r border-[#E0EDFB] bg-[#F0F7FF] text-zinc-900 sticky top-0 md:flex z-50 dark:border-white/10 dark:bg-[#18181B] dark:text-[#9B9085]">
          <div className="flex shrink-0 items-center border-b border-[#E0EDFB] px-3.5 py-2.5 dark:border-white/10">
            <Link href="/dashboard" aria-label="Dashboard" className="flex items-center">
              <BrandLogo height="h-9" />
            </Link>
          </div>
          <nav
            className="mt-3 flex-1 space-y-1 px-3.5"
            aria-label="Dashboard"
            onMouseLeave={() => setHoveredNavHref(null)}
          >
            {mobileNav.map((item, idx) => {
              const active = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.href === "/dashboard/landing-page"
                  ? (pathname === "/dashboard/landing-page" || pathname === "/dashboard/leadmagnets" || pathname.startsWith("/dashboard/leadmagnets/"))
                  : (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/landing-page" && pathname.startsWith(`${item.href}/`)));
              const isHovered = hoveredNavHref === item.href;
              const isDividerAfter = item.href === "/dashboard/locked-pdf"; // Divider after Locked PDF
              const isDividerBefore = item.href === "/dashboard/linkedin"; // Divider before LinkedIn (Growth section)

              if (item.isModal) {
                return (
                  <div key={item.href} onMouseEnter={() => setHoveredNavHref(item.href)}>
                    <ExpandableScreenTrigger className="w-full">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        className="relative group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-zinc-600 dark:text-[#9B9085] dark:hover:text-white cursor-pointer"
                      >
                        {isHovered && (
                          <motion.div
                            layoutId="leftPanelHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-lg bg-[#E2F0FD] dark:bg-[#25252a]"
                          />
                        )}
                        <item.icon className="h-4 w-4 shrink-0 relative z-10 text-zinc-500 group-hover:text-zinc-900 dark:text-[#9B9085] dark:group-hover:text-white" aria-hidden="true" />
                        <span className="flex-1 text-left relative z-10">{item.label}</span>
                      </motion.button>
                    </ExpandableScreenTrigger>
                    {isDividerAfter && <div className="my-2.5 border-t border-[#E0EDFB] dark:border-white/10" />}
                  </div>
                );
              }

              return (
                <div key={item.href} onMouseEnter={() => setHoveredNavHref(item.href)}>
                  {isDividerBefore && <div className="my-2.5 border-t border-[#E0EDFB] dark:border-white/10" />}
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 600, damping: 28 }}
                  >
                    <Link
                      href={item.href}
                      className={`relative group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${active
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
                      <span className="flex-1 relative z-10">{item.label}</span>
                    </Link>
                  </motion.div>
                  {isDividerAfter && <div className="my-2.5 border-t border-[#E0EDFB] dark:border-white/10" />}
                </div>
              );
            })}
          </nav>
          <div className="border-t border-[#E0EDFB] px-3.5 py-2.5 dark:border-white/10">
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
                    className="absolute bottom-full mb-2 left-0 w-52 rounded-xl border border-[#E0EDFB] bg-white p-1.5 shadow-xl z-[70] text-zinc-900 flex flex-col gap-0.5 dark:border-zinc-800/80 dark:bg-[#18181b] dark:text-white dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative flex items-center justify-between p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 my-0.5 select-none">
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
                                className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-lg shadow-sm"
                              />
                            )}
                            <span className="relative z-10 flex items-center justify-center">
                              <Icon className="h-4 w-4" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div onMouseLeave={() => setHoveredProfileMenuKey(null)} className="flex flex-col gap-0.5">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredProfileMenuKey("account")}
                        onClick={() => {
                          setShowProfileMenu(false);
                          router.push("/dashboard/settings");
                        }}
                        className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "account" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-lg bg-[#E2F0FD] dark:bg-zinc-800"
                          />
                        )}
                        <User className="h-4 w-4 relative z-10 text-zinc-500 dark:text-zinc-400" />
                        <span className="relative z-10">Account</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredProfileMenuKey("help")}
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowHelp(true);
                        }}
                        className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "help" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-lg bg-[#E2F0FD] dark:bg-zinc-800"
                          />
                        )}
                        <CircleHelp className="h-4 w-4 relative z-10 text-zinc-500 dark:text-zinc-400" />
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
                        className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "bug" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-lg bg-[#E2F0FD] dark:bg-zinc-800"
                          />
                        )}
                        <Bug className="h-4 w-4 relative z-10 text-zinc-500 dark:text-zinc-400" />
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
                        className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 transition-colors w-full dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                      >
                        {hoveredProfileMenuKey === "feature" && (
                          <motion.div
                            layoutId="profileMenuHoverPill"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            className="absolute inset-0 rounded-lg bg-[#E2F0FD] dark:bg-zinc-800"
                          />
                        )}
                        <Sparkles className="h-4 w-4 relative z-10 text-zinc-500 dark:text-zinc-400" />
                        <span className="relative z-10">Request a feature</span>
                      </motion.button>
                    </div>

                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 600, damping: 28 }}
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors w-full dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" /> Sign out
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
                    crossOrigin="anonymous"
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

        {menuOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
            <div
              className="flex h-full w-72 flex-col bg-[#F0F7FF] dark:bg-[#18181B] border-r border-[#E0EDFB] dark:border-white/10 p-4 text-zinc-900 dark:text-[#9B9085]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-[#E0EDFB] dark:border-white/10 pb-3">
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
                {mobileNav.map((item) => {
                  const active = item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : item.href === "/dashboard/landing-page"
                      ? (pathname === "/dashboard/landing-page" || pathname === "/dashboard/leadmagnets" || pathname.startsWith("/dashboard/leadmagnets/"))
                      : (pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/landing-page" && pathname.startsWith(`${item.href}/`)));
                  const isDividerBeforeMobile = item.href === "/dashboard/linkedin";
                  if (item.isModal) {
                    return (
                      <button
                        key={item.href}
                        onClick={() => {
                          setMenuOpen(false);
                          setShowHelp(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#0066B2]/15 dark:hover:text-white cursor-pointer"
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-[#9B9085]" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  return (
                    <div key={item.href}>
                      {isDividerBeforeMobile && <div className="my-1.5 border-t border-[#E0EDFB] dark:border-white/10" />}
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          setMenuOpen(false);
                          if (pathname !== item.href) {
                            e.preventDefault();
                            router.push(item.href);
                          }
                        }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition cursor-pointer ${active
                          ? "bg-[#0066B2] text-white font-bold dark:bg-[#0066B2]/20 dark:text-[#38BDF8]"
                          : "text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#0066B2]/15 dark:hover:text-white"
                          }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white dark:text-[#38BDF8]" : "text-zinc-500 dark:text-[#9B9085]"}`} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </div>
                  );
                })}
              </nav>

              {/* Bottom Profile Section in Mobile Drawer */}
              <div ref={mobileDrawerProfileMenuRef} className="pt-3 border-t border-[#E0EDFB] dark:border-white/10 relative">
                <AnimatePresence>
                  {showDrawerProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "bottom left" }}
                      className="absolute bottom-full mb-2 left-0 w-full rounded-xl border border-[#E0EDFB] bg-white p-1.5 shadow-xl z-50 text-zinc-900 flex flex-col gap-0.5 dark:border-zinc-800 dark:bg-[#18181b] dark:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative flex items-center justify-between p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 my-0.5 select-none">
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
                                  className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-lg shadow-sm"
                                />
                              )}
                              <span className="relative z-10 flex items-center justify-center">
                                <Icon className="h-4 w-4" />
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            setMenuOpen(false);
                            router.push("/dashboard/settings");
                          }}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
                        >
                          <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          <span>Account</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            setMenuOpen(false);
                            setShowHelp(true);
                          }}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
                        >
                          <CircleHelp className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          <span>Help</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            openGmailCompose("bug");
                          }}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
                        >
                          <Bug className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          <span>Report a bug</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowDrawerProfileMenu(false);
                            openGmailCompose("feature");
                          }}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-600 hover:bg-[#E2F0FD] hover:text-zinc-900 transition-colors w-full dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
                        >
                          <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          <span>Request a feature</span>
                        </button>
                      </div>

                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowDrawerProfileMenu(false);
                          setMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors w-full dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-rose-500" /> Sign out
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
            </div>
          </div>
        )}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#FAFAFA] dark:bg-[#0E0E10]">
          <header className="dashboard-chrome sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-ink-200 bg-white dark:bg-[#18181B] dark:border-white/10 px-4 sm:px-6 md:hidden transition-colors">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 dark:border-white/10 text-ink-700 dark:text-zinc-300 md:hidden hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
              <h1 className="text-sm font-semibold text-ink-950 dark:text-white sm:text-base">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="min-w-0 flex-1 bg-[#FAFAF8] dark:bg-[#0E0E10]">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: 0.10, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
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
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-200"
            onClick={() => setShowCreateMagnetModal(false)}
          >
            <div
              className="relative w-full max-w-[460px] rounded-2xl border border-[#2e2e38] bg-[#18181c] p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Create a magnet</h3>
                  <p className="text-xs text-[#9B9085] mt-1">Name the page and choose its URL.</p>
                </div>
                <button
                  onClick={() => setShowCreateMagnetModal(false)}
                  className="rounded-lg p-1 text-[#9B9085] hover:bg-[#25252b] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleanSlug = createMagnetName
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-") || "untitled-page";
                  const newId = `page-${Date.now()}`;

                  try {
                    const { loadPages, savePages } = require("@/lib/store");
                    const currentPages = loadPages();
                    const newPage = {
                      id: newId,
                      name: createMagnetName.trim() || "Untitled Page",
                      slug: cleanSlug,
                      status: "draft",
                      headline: createMagnetName.trim() || "Untitled Page",
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
                  } catch (_) { }

                  setShowCreateMagnetModal(false);
                  setCreateMagnetName("");
                  router.push(`/dashboard/leadmagnets/${newId}`);
                }}
                className="space-y-4"
              >
                {/* Page Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-[#d4c8bc]">Page name</label>
                  <input
                    type="text"
                    autoFocus
                    value={createMagnetName}
                    onChange={(e) => setCreateMagnetName(e.target.value)}
                    placeholder="AI Pipeline Playbook"
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:ring-1 focus:ring-[#0066B2] transition-all"
                    required
                  />
                </div>

                {/* URL Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#d4c8bc]">URL slug</label>
                  <div className="flex items-center rounded-xl border border-[#2e2e38] bg-[#121214] px-3.5 py-2.5 text-xs text-[#9B9085]">
                    <span className="text-[#666675] shrink-0 mr-1.5">/</span>
                    <span className="font-mono text-[#d4c8bc] truncate">
                      {createMagnetName
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-") || "untitled-page"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#666675]">The path of the page. Lowercase, digits, and hyphens only.</p>
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateMagnetModal(false)}
                    className="rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#222228] px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2c2c34] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const name = createMagnetName.trim() || "Locked PDF Document";
                      const cleanSlug = createMagnetName
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-") || "locked-pdf";
                      const newId = `page-${Date.now()}`;
                      try {
                        const { loadPages, savePages } = require("@/lib/store");
                        const currentPages = loadPages();
                        const newPage = {
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
                        };
                        savePages([newPage, ...currentPages]);
                      } catch (_) { }

                      setShowCreateMagnetModal(false);
                      setCreateMagnetName("");
                      router.push("/dashboard/locked-pdf");
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Locked PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const name = createMagnetName.trim() || "Untitled Landing Page";
                      const cleanSlug = createMagnetName
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-") || "untitled-page";
                      const newId = `page-${Date.now()}`;
                      try {
                        const { loadPages, savePages } = require("@/lib/store");
                        const currentPages = loadPages();
                        const newPage = {
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
                      } catch (_) { }

                      setShowCreateMagnetModal(false);
                      setCreateMagnetName("");
                      router.push(`/dashboard/leadmagnets/${newId}`);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Landing Page</span>
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
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Eye,
  TrendingUp,
  Zap,
  BarChart3,
  Mail,
  FileText,
  Lock,
  Palette,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Check,
  X,
  HardDrive,
  Rocket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  loadPages,
  savePages,
  loadLeads,
  loadSequences,
  loadAccount,
  loadResources,
  syncWithDatabase,
} from "@/lib/store";
import { getPlanLimits } from "@/lib/plan-limits";
import type { Account, MagnetPage, Lead, Sequence } from "@/lib/data";
import { parseFlexibleDate, formatRelativeTime } from "@/lib/utils";

// ─────────────────────────────────────────────
// Sparkline helpers
// ─────────────────────────────────────────────

function buildSparkline(leads: Lead[], days = 7): number[] {
  const now = new Date();
  const buckets: number[] = Array(days).fill(0);
  leads.forEach((l) => {
    if (!l.signedUpAt) return;
    const d = parseFlexibleDate(l.signedUpAt);
    if (!d) return;
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < days) buckets[days - 1 - diff]++;
  });
  return buckets;
}

function Sparkline({ data, color = "#0066B2" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const W = 80;
  const H = 28;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (v / max) * (H - 2),
  }));
  const lineStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaStr = `M${pts[0].x},${H} ` + pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + ` L${W},${H} Z`;
  const gradId = `sp-${color.replace("#", "")}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaStr} fill={`url(#${gradId})`} />
      <polyline
        points={lineStr}
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest dot */}
      <circle
        cx={pts[pts.length - 1].x}
        cy={pts[pts.length - 1].y}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Count-up hook
// ─────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    startRef.current = 0;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

// ─────────────────────────────────────────────
// Greeting helper
// ─────────────────────────────────────────────

function getGreeting(name?: string) {
  const h = new Date().getHours();
  const salutation =
    h >= 4 && h < 12
      ? "Good morning"
      : h >= 12 && h < 17
      ? "Good afternoon"
      : "Good evening";
  const firstName = name ? name.split(" ")[0] : "";
  return firstName ? `${salutation}, ${firstName} 👋` : `${salutation} 👋`;
}

// ─────────────────────────────────────────────
// Relative time
// ─────────────────────────────────────────────

function relativeTime(dateStr?: string): string {
  return formatRelativeTime(dateStr);
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────

function MagnetStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; dot: string }> = {
    live: {
      label: "Live",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    draft: {
      label: "Draft",
      cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
      dot: "bg-zinc-400",
    },
    paused: {
      label: "Paused",
      cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      dot: "bg-amber-500",
    },
  };
  const { label, cls, dot } = cfg[status] || cfg.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Plan Usage Bar
// ─────────────────────────────────────────────

function UsageBar({
  used,
  limit,
  label,
  color = "#0066B2",
}: {
  used: number;
  limit: number;
  label: string;
  color?: string;
}) {
  const pct = limit >= 100000 ? 0 : Math.min((used / limit) * 100, 100);
  const isHigh = pct >= 80;
  const barColor = isHigh ? "#F59E0B" : color;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085]">{label}</span>
        <span
          className={`text-[11px] font-bold tabular-nums ${
            isHigh
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {used.toLocaleString()}
          {" / "}
          {limit >= 100000 ? "∞" : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Avatar initials generator
// ─────────────────────────────────────────────

function getAvatarHue(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function Avatar({ name, email }: { name?: string; email: string }) {
  const initials = (name || email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = getAvatarHue(email);
  return (
    <div
      className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
      style={{ background: `hsl(${hue}, 58%, 52%)` }}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const } },
};

// ─────────────────────────────────────────────
// Main DashboardHome Component
// ─────────────────────────────────────────────

export default function DashboardHome({
  account: initialAccount,
}: {
  account: Account | null;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(initialAccount);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<"classic" | "locked-pdf" | null>(null);
  const [createMagnetName, setCreateMagnetName] = useState("");

  const handleGenerateAiTitle = () => {
    const titles = [
      "AI Pipeline Playbook",
      "SaaS Growth Engine Blueprint",
      "High-Converting Copywriting Vault",
      "Full-Stack Dev Starter Kit",
      "5-Minute Lead Magnet Checklist",
      "Ultimate Cold Email Secrets",
    ];
    const picked = titles[Math.floor(Math.random() * titles.length)];
    setCreateMagnetName(picked);
  };

  const handleCreateMagnet = (templateType: "classic" | "locked-pdf") => {
    const name = createMagnetName.trim() || (templateType === "locked-pdf" ? "Locked PDF Document" : "Untitled Page");
    const cleanSlug = createMagnetName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") || (templateType === "locked-pdf" ? "locked-pdf" : "untitled-page");

    const newId = `page-${Date.now()}`;
    const newPage: MagnetPage = {
      id: newId,
      name,
      slug: cleanSlug,
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: name,
      subheadline: templateType === "locked-pdf"
        ? "Enter your email address to receive an instant OTP verification code to unlock this PDF."
        : "Enter your email address below to get instant access.",
      cta: templateType === "locked-pdf" ? "Verify & Unlock PDF" : "Get Instant Access",
      deliverable: templateType === "locked-pdf" ? "Secure Document PDF" : "Free Resource PDF",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      publishedAt: null,
      template: templateType,
      accent: templateType === "locked-pdf" ? "#D97706" : "#0066B2",
      deliveryEmail: {
        subject: `Your access to ${name}`,
        previewText: "Click below to view your requested resource.",
        body: `Thanks for requesting ${name}! Use the link below to access your download.`,
        linkText: "Access Resource",
        linkUrl: "#",
      },
    };

    try {
      const currentPages = loadPages();
      savePages([newPage, ...currentPages]);
    } catch (err) {
      console.error("Failed to save magnet page:", err);
    }

    setShowCreateModal(false);
    setCreateMagnetName("");

    if (templateType === "locked-pdf") {
      router.push(`/dashboard/locked-pdf?id=${newId}`);
    } else {
      router.push(`/dashboard/leadmagnets/${newId}`);
    }
  };

  useEffect(() => {
    // Read persisted dismissal
    try {
      if (localStorage.getItem("dashboard_checklist_dismissed") === "true") {
        setChecklistDismissed(true);
      }
    } catch (_) {}

    // Instant hydration from localStorage
    const localPages = loadPages();
    const localLeads = loadLeads();
    const localSeqs = loadSequences();
    const localAcc = loadAccount();
    const localRes = loadResources().filter(
      (r: any) => !r.isPageAsset && r.type !== "page_asset"
    );

    if (localPages.length > 0) setPages(localPages);
    if (localLeads.length > 0) setLeads(localLeads);
    if (localSeqs.length > 0) setSequences(localSeqs);
    if (localAcc) setAccount(localAcc);
    if (localRes.length > 0) setResources(localRes);
    setLoading(false);

    // Background sync from MongoDB
    syncWithDatabase().then((data) => {
      if (!data) return;
      if (data.account) setAccount(data.account);
      if (data.pages) setPages(data.pages);
      if (data.leads) setLeads(data.leads);
      if (data.sequences) setSequences(data.sequences);
      if (data.resources) {
        setResources(
          data.resources.filter((r: any) => !r.isPageAsset && r.type !== "page_asset")
        );
      }
    });
  }, []);

  const dismissChecklist = useCallback(() => {
    setChecklistDismissed(true);
    try {
      localStorage.setItem("dashboard_checklist_dismissed", "true");
    } catch (_) {}
  }, []);

  // ── Derived KPIs ──────────────────────────────
  const totalLeads = leads.length;
  const totalViews = useMemo(
    () => pages.reduce((acc, p) => acc + (p.views || 0), 0),
    [pages]
  );
  const avgConversion = useMemo(() => {
    if (!pages.length) return 0;
    return pages.reduce((acc, p) => acc + (p.conversionRate || 0), 0) / pages.length;
  }, [pages]);
  const activeMagnets = useMemo(
    () => pages.filter((p) => p.status === "live").length,
    [pages]
  );

  // ── Product Split Metrics (Landing Pages vs Locked PDFs) ──
  const landingPages = useMemo(
    () => pages.filter((p) => p.template !== "locked-pdf" && !p.name?.toLowerCase().includes("locked")),
    [pages]
  );
  const landingPageCount = landingPages.length;
  const landingPageLiveCount = useMemo(
    () => landingPages.filter((p) => p.status === "live").length,
    [landingPages]
  );
  const landingPageViews = useMemo(
    () => landingPages.reduce((acc, p) => acc + (p.views || 0), 0),
    [landingPages]
  );
  const landingPageLeads = useMemo(
    () => landingPages.reduce((acc, p) => acc + (p.signups || 0), 0),
    [landingPages]
  );
  const landingPageRate = landingPageViews > 0
    ? ((landingPageLeads / landingPageViews) * 100).toFixed(1)
    : "0.0";

  const lockedPdfPages = useMemo(
    () => pages.filter((p) => p.template === "locked-pdf" && ((p.pdfPages && p.pdfPages.length > 0) || (p.pdfTitle && p.pdfTitle !== "Untitled Locked PDF") || p.status === "live")),
    [pages]
  );
  const lockedPdfCount = lockedPdfPages.length;
  const lockedPdfLiveCount = useMemo(
    () => lockedPdfPages.filter((p) => p.status === "live").length,
    [lockedPdfPages]
  );
  const lockedPdfViews = useMemo(
    () => lockedPdfPages.reduce((acc, p) => acc + (p.views || 0), 0),
    [lockedPdfPages]
  );
  const lockedPdfLeadsCount = useMemo(
    () => lockedPdfPages.reduce((acc, p) => acc + (p.signups || 0), 0),
    [lockedPdfPages]
  );
  const lockedPdfRate = lockedPdfViews > 0
    ? ((lockedPdfLeadsCount / lockedPdfViews) * 100).toFixed(1)
    : "0.0";

  // Sparklines
  const leadsSparkline = useMemo(() => buildSparkline(leads, 7), [leads]);
  const viewsSparkline = useMemo(() => {
    return leadsSparkline.map((v) => Math.max(v * 3 + (v > 0 ? 2 : 0), 0));
  }, [leadsSparkline]);
  const conversionSparkline = useMemo(() => {
    return leadsSparkline.map((v, i) => {
      const views = viewsSparkline[i];
      return views > 0 ? Math.min(Math.round((v / views) * 100), 100) : (v > 0 ? 33 : 0);
    });
  }, [leadsSparkline, viewsSparkline]);
  const activeSparkline = useMemo(() => {
    const total = pages.filter((p) => p.status === "live").length;
    return Array(7).fill(total);
  }, [pages]);

  // Plan limits & usage
  const planLimits = useMemo(() => getPlanLimits(account?.plan), [account]);
  const storageUsedMb = useMemo(
    () => resources.reduce((acc: number, r: any) => acc + (r.size || 0), 0) / (1024 * 1024),
    [resources]
  );
  const liveSeqCount = useMemo(
    () => sequences.filter((s) => s.status === "live").length,
    [sequences]
  );

  // Top landing pages (excluding locked PDFs)
  const topLandingPages = useMemo(
    () => [...landingPages].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4),
    [landingPages]
  );

  // Recent leads
  const recentLeads = useMemo(
    () =>
      [...leads]
        .sort(
          (a, b) =>
            (parseFlexibleDate(b.signedUpAt)?.getTime() || 0) -
            (parseFlexibleDate(a.signedUpAt)?.getTime() || 0)
        )
        .slice(0, 4),
    [leads]
  );

  // Active sequences (showing top 2 for a balanced dashboard layout)
  const activeSeqs = useMemo(
    () => sequences.filter((s) => s.status === "live").slice(0, 2),
    [sequences]
  );

  // Count-up values
  const countLeads = useCountUp(totalLeads, 900);
  const countViews = useCountUp(totalViews, 900);

  // Onboarding checklist
  const checklistItems = useMemo(
    () => [
      { id: "account", label: "Created your account", done: true, href: undefined },
      {
        id: "magnet",
        label: "Create your first lead magnet",
        done: pages.length > 0,
        href: "/dashboard/landing-page",
      },
      {
        id: "live",
        label: "Publish a magnet live",
        done: pages.some((p) => p.status === "live"),
        href: "/dashboard/landing-page",
      },
      {
        id: "sequence",
        label: "Set up an email sequence",
        done: sequences.length > 0,
        href: "/dashboard/sequences/new",
      },
      {
        id: "brand",
        label: "Set your brand color & logo",
        done: !!(account?.brandColor && account?.brandColor !== "#0066B2" || account?.logo),
        href: "/dashboard/brand",
      },
    ],
    [pages, sequences, account]
  );

  const checklistAllDone = checklistItems.every((c) => c.done);
  const checklistDoneCount = checklistItems.filter((c) => c.done).length;
  const showChecklist = !checklistDismissed && !checklistAllDone && !loading;

  // ── KPI card definitions ──────────────────
  const kpiCards = [
    {
      id: "leads",
      label: "Total Leads",
      value: countLeads.toLocaleString(),
      rawValue: totalLeads,
      icon: Users,
      iconBg: "bg-[#EFF6FF] dark:bg-[#0066B2]/20",
      iconColor: "text-[#0066B2] dark:text-[#38BDF8]",
      sparkData: leadsSparkline,
      sparkColor: "#0066B2",
      href: "/dashboard/leads",
      sub: totalLeads === 0 ? "No leads yet" : `${leadsSparkline.reduce((a, b) => a + b, 0)} this week`,
    },
    {
      id: "views",
      label: "Total Views",
      value:
        countViews >= 1000
          ? `${(countViews / 1000).toFixed(1)}k`
          : countViews.toLocaleString(),
      rawValue: totalViews,
      icon: Eye,
      iconBg: "bg-violet-50 dark:bg-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      sparkData: viewsSparkline,
      sparkColor: "#7C3AED",
      href: "/dashboard/analytics",
      sub: pages.length > 0 ? `across ${pages.length} magnet${pages.length !== 1 ? "s" : ""}` : "No magnets yet",
    },
    {
      id: "conversion",
      label: "Avg. Conversion",
      value: `${avgConversion.toFixed(1)}%`,
      rawValue: avgConversion,
      icon: TrendingUp,
      iconBg: "bg-emerald-50 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      sparkData: conversionSparkline,
      sparkColor: "#10B981",
      href: "/dashboard/analytics",
      sub: avgConversion >= 5 ? "🔥 Above average" : avgConversion > 0 ? "Keep optimizing" : "Publish to track",
    },
    {
      id: "active",
      label: "Active Magnets",
      value: activeMagnets.toString(),
      rawValue: activeMagnets,
      icon: Zap,
      iconBg: "bg-amber-50 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      sparkData: activeSparkline,
      sparkColor: "#F59E0B",
      href: "/dashboard/landing-page",
      sub: pages.length > activeMagnets ? `${pages.length - activeMagnets} in draft` : "All live",
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-[#EFF6FF]/40 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0B0B0D]">
      <div className="flex-1 px-4 py-7 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5"
        >
          {/* ══════════════════════════════════════════════
              SECTION 1 — Welcome Hero
          ══════════════════════════════════════════════ */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
                {getGreeting(account?.name)}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-[#9B9085]">
                Here's what's happening with your lead magnets today.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">


              {/* Primary CTA */}
              <button
                type="button"
                onClick={() => {
                  setCreateMagnetName("");
                  setCreateModalType(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0066B2] text-white text-xs font-bold shadow-md hover:bg-[#005291] active:scale-95 transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0,102,178,0.35)] hover:-translate-y-0.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                New Lead Magnet
              </button>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              SECTION 2 — Core Products Performance (Landing Pages & Locked PDFs)
          ══════════════════════════════════════════════ */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* 🌐 LANDING PAGES ENGINE CARD */}
            <div className="relative rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 dark:border-blue-900/40 dark:from-blue-950/30 dark:via-[#18181B] dark:to-sky-950/20 p-5 shadow-sm backdrop-blur-sm flex flex-col justify-between overflow-hidden group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066B2]/10 dark:bg-[#38BDF8]/15 text-[#0066B2] dark:text-[#38BDF8] border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                          Landing Pages
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                          {landingPageLiveCount} Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                        Standard Opt-in Lead Magnets
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/landing-page"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Performance stats grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/20 border border-blue-100/60 dark:border-blue-900/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      Views
                    </span>
                    <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 tabular-nums">
                      {landingPageViews.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/20 border border-blue-100/60 dark:border-blue-900/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      Leads
                    </span>
                    <p className="text-lg font-extrabold text-[#0066B2] dark:text-[#38BDF8] mt-0.5 tabular-nums">
                      {landingPageLeads.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/20 border border-blue-100/60 dark:border-blue-900/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      Conv. Rate
                    </span>
                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                      {landingPageRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085]">
                  {landingPageCount} total landing page magnet{landingPageCount !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCreateMagnetName("");
                    setCreateModalType("classic");
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0066B2] text-white text-xs font-bold shadow-sm hover:bg-[#005291] active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Landing Page
                </button>
              </div>
            </div>

            {/* 🔒 LOCKED PDF ENGINE CARD */}
            <div className="relative rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-[#18181B] dark:to-orange-950/20 p-5 shadow-sm backdrop-blur-sm flex flex-col justify-between overflow-hidden group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                          Locked PDFs
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          {lockedPdfLiveCount} Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                        OTP Verified PDF Documents
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/locked-pdf"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-all"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Performance stats grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-100 dark:border-amber-900/30">
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-100/60 dark:border-amber-900/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      Views
                    </span>
                    <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 tabular-nums">
                      {lockedPdfViews.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-100/60 dark:border-amber-900/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      Unlocks
                    </span>
                    <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
                      {lockedPdfLeadsCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-100/60 dark:border-amber-900/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      Unlock Rate
                    </span>
                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                      {lockedPdfRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085]">
                  {lockedPdfCount} total locked PDF magnet{lockedPdfCount !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCreateMagnetName("");
                    setCreateModalType("locked-pdf");
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-sm hover:bg-amber-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Locked PDF
                </button>
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              SECTION 2.5 — Platform KPI Summary Cards
          ══════════════════════════════════════════════ */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
          >
            {kpiCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2] rounded-2xl h-full flex flex-col"
              >
                <div className="relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex items-center gap-3.5">
                  {/* Left: Icon Badge */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>

                  {/* Right: Label, Value & Subtext */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                        {card.label}
                      </p>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0" />
                    </div>

                    <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                      {card.value}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                      {card.sub}
                    </p>
                  </div>

                  {/* Hover gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
            ))}
          </motion.div>

          {/* ══════════════════════════════════════════════
              SECTION 3 — Lead Magnets Table
          ══════════════════════════════════════════════ */}
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#1e1e26]">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Your Landing Pages
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                    {landingPageCount} total · {landingPageLiveCount} live
                  </p>
                </div>
                <Link
                  href="/dashboard/landing-page"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline underline-offset-2 transition-colors"
                >
                  View all
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Rows */}
              {topLandingPages.length > 0 ? (
                <div className="divide-y divide-zinc-50 dark:divide-[#18181e]">
                  {topLandingPages.map((page, idx) => (
                    <div
                      key={page.id}
                      className="group flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/80 dark:hover:bg-white/[0.025] transition-colors"
                    >
                      {/* Rank */}
                      <span className="w-4 shrink-0 text-xs font-bold text-zinc-300 dark:text-zinc-700">
                        {idx + 1}
                      </span>

                      {/* Icon */}
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-[#0066B2]/15 dark:to-[#38BDF8]/10 flex items-center justify-center">
                        {page.template === "locked-pdf" ? (
                          <Lock className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                        )}
                      </div>

                      {/* Name + slug */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-white truncate group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors leading-snug">
                          {page.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-[#9B9085] truncate mt-0.5">
                          /{page.slug}
                        </p>
                      </div>

                      {/* Status badge */}
                      <MagnetStatusBadge status={page.status} />

                      {/* Stats grid */}
                      <div className="hidden sm:flex items-center gap-0 shrink-0">
                        <div className="w-16 text-center">
                          <p className="text-xs font-bold text-zinc-800 dark:text-white tabular-nums leading-tight">
                            {(page.views || 0).toLocaleString()}
                          </p>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mt-0.5">
                            Views
                          </p>
                        </div>
                        <div className="w-16 text-center">
                          <p className="text-xs font-bold text-zinc-800 dark:text-white tabular-nums leading-tight">
                            {(page.signups || 0).toLocaleString()}
                          </p>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mt-0.5">
                            Leads
                          </p>
                        </div>
                        <div className="w-16 text-center">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-tight">
                            {(page.conversionRate || 0).toFixed(1)}%
                          </p>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mt-0.5">
                            Conv.
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Link
                          href={`/dashboard/leadmagnets/${page.id}`}
                          title="Edit"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] hover:bg-[#EFF6FF] dark:hover:bg-[#0066B2]/10 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboard/leadmagnets/${page.id}/analytics`}
                          title="Analytics"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] dark:bg-[#0066B2]/20 border border-[#0066B2]/20 dark:border-[#38BDF8]/20 mb-4">
                    <Sparkles className="h-7 w-7 text-[#0066B2] dark:text-[#38BDF8]" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    No landing pages yet
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-[#9B9085] max-w-xs leading-relaxed">
                    Create your first landing page to start collecting subscribers.
                  </p>
                  <Link
                    href="/dashboard/landing-page"
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066B2] text-white text-xs font-bold shadow-md hover:bg-[#005291] transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Landing Page
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              SECTION 4 — Two-column: Recent Leads + Active Sequences
          ══════════════════════════════════════════════ */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 gap-3.5 lg:grid-cols-2"
          >
            {/* ── Recent Leads ── */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#1e1e26]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#0066B2]/20">
                    <Users className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                  </div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Recent Leads
                  </h2>
                </div>
                <Link
                  href="/dashboard/leads"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline underline-offset-2"
                >
                  View all
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {recentLeads.length > 0 ? (
                <div className="divide-y divide-zinc-50 dark:divide-[#18181e]">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/80 dark:hover:bg-white/[0.025] transition-colors"
                    >
                      <Avatar name={lead.name} email={lead.email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-white truncate">
                          {lead.name || lead.email}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-[#9B9085] truncate mt-0.5">
                          {lead.page}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-zinc-400 dark:text-[#9B9085]">
                        {relativeTime(lead.signedUpAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <Users className="h-8 w-8 text-zinc-200 dark:text-zinc-800 mb-2" />
                  <p className="text-xs text-zinc-400 dark:text-[#9B9085] max-w-[220px] leading-relaxed">
                    No leads yet. Share your magnet link to start growing your list.
                  </p>
                </div>
              )}
            </div>

            {/* ── Right Column (50% Width): Stacked 50% Active Sequences (Top) + 50% Integrations Status (Bottom) ── */}
            <div className="flex flex-col gap-3.5 h-full">
              {/* Top 50%: Active Sequences */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm overflow-hidden flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-[#1e1e26]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/20">
                      <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Active Sequences
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/sequences"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline underline-offset-2"
                  >
                    View all
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                {activeSeqs.length > 0 ? (
                  <div className="divide-y divide-zinc-50 dark:divide-[#18181e]">
                    {activeSeqs.map((seq) => {
                      const openRate =
                        seq.stats.delivered > 0
                          ? Math.round((seq.stats.opened / seq.stats.delivered) * 100)
                          : 0;
                      return (
                        <Link
                          key={seq.id}
                          href={`/dashboard/sequences/${seq.id}`}
                          className="group flex items-center gap-3 px-5 py-3 hover:bg-zinc-50/80 dark:hover:bg-white/[0.025] transition-colors"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#0066B2]/20">
                            <Rocket className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-800 dark:text-white truncate group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">
                              {seq.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${openRate}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                                {openRate}% open
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                              {seq.stats.signedUp.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-zinc-400 dark:text-[#9B9085]">
                              enrolled
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Mail className="h-7 w-7 text-zinc-300 dark:text-zinc-700 mb-1.5" />
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                      No active sequences yet.
                    </p>
                    <Link
                      href="/dashboard/sequences/new"
                      className="mt-2 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline underline-offset-2"
                    >
                      Create a sequence →
                    </Link>
                  </div>
                )}
              </div>

              {/* Bottom 50%: Integrations & System Health */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-[#1e1e26]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/20">
                      <Zap className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h2 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Integrations & System Health
                    </h2>
                  </div>
                  <Link
                    href="/dashboard/integration"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline underline-offset-2"
                  >
                    Manage
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  {/* ConvertKit */}
                  <div className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.05]">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      ConvertKit / Kit
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${account?.kitConnected ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {account?.kitConnected ? "Connected" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Webhooks */}
                  <div className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.05]">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      Webhooks
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${(account?.zapierWebhookUrl || account?.slackWebhookUrl) ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {(account?.zapierWebhookUrl || account?.slackWebhookUrl) ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* GA4 / Pixel */}
                  <div className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.05]">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085]">
                      GA4 / Pixel
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${(account?.ga4MeasurementId || account?.metaPixelId) ? "bg-emerald-500" : "bg-zinc-400"}`} />
                      <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {(account?.ga4MeasurementId || account?.metaPixelId) ? "Active" : "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              SECTION 4.5 — Locked PDF Analytics & Security
          ══════════════════════════════════════════════ */}
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-[#18181B] dark:to-orange-950/10 shadow-sm backdrop-blur-sm overflow-hidden p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Locked PDF Security & Lead Analytics
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        OTP Verified
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                      Performance metrics for your password/OTP gated PDF documents
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/locked-pdf"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-xs transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Manage Locked PDFs
                  </Link>
                </div>
              </div>

              {/* Locked PDF Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-[#9B9085] uppercase tracking-wider">
                    Locked PDFs
                  </span>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                    {lockedPdfCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-[#9B9085] uppercase tracking-wider">
                    Total PDF Views
                  </span>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                    {lockedPdfViews.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-[#9B9085] uppercase tracking-wider">
                    Unlocked Leads
                  </span>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {lockedPdfLeadsCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-black/20 border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-[#9B9085] uppercase tracking-wider">
                    Unlock Rate
                  </span>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {lockedPdfViews > 0
                      ? `${((lockedPdfLeadsCount / lockedPdfViews) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </p>
                </div>
              </div>

              {/* Locked PDF Magnets List */}
              {lockedPdfPages.length > 0 ? (
                <div className="space-y-2 mt-3">
                  {lockedPdfPages.slice(0, 3).map((pdf) => (
                    <div
                      key={pdf.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-black/10 border border-zinc-200/50 dark:border-zinc-800/40 hover:bg-white dark:hover:bg-black/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {pdf.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 dark:text-[#9B9085]">
                            {pdf.views || 0} views • {pdf.signups || 0} unlocks
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/locked-pdf?id=${pdf.id}`}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0 ml-2"
                      >
                        Edit PDF →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Lock className="h-7 w-7 text-amber-400/50 mb-2" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    No Locked PDF magnets set up yet
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-[#9B9085] max-w-sm mt-0.5">
                    Require users to enter an OTP email code before unlocking your high-value PDF documents.
                  </p>
                  <Link
                    href="/dashboard/locked-pdf"
                    className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    + Create a Locked PDF Magnet
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════
              SECTION 5 — Quick Actions
          ══════════════════════════════════════════════ */}
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm px-5 py-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] mb-3.5">
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "New Landing Page",
                    icon: FileText,
                    href: "/dashboard/landing-page",
                    colorText: "text-[#0066B2] dark:text-[#38BDF8]",
                    colorBg: "bg-[#EFF6FF] dark:bg-[#0066B2]/15 hover:bg-[#DBEAFE] dark:hover:bg-[#0066B2]/25",
                  },
                  {
                    label: "New Locked PDF",
                    icon: Lock,
                    href: "/dashboard/locked-pdf",
                    colorText: "text-amber-600 dark:text-amber-400",
                    colorBg: "bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25",
                  },
                  {
                    label: "New Sequence",
                    icon: Mail,
                    href: "/dashboard/sequences/new",
                    colorText: "text-emerald-600 dark:text-emerald-400",
                    colorBg: "bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25",
                  },
                  {
                    label: "Analytics",
                    icon: BarChart3,
                    href: "/dashboard/analytics",
                    colorText: "text-violet-600 dark:text-violet-400",
                    colorBg: "bg-violet-50 dark:bg-violet-500/15 hover:bg-violet-100 dark:hover:bg-violet-500/25",
                  },
                  {
                    label: "Integrations",
                    icon: Zap,
                    href: "/dashboard/integration",
                    colorText: "text-rose-600 dark:text-rose-400",
                    colorBg: "bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25",
                  },
                  {
                    label: "Brand Kit",
                    icon: Palette,
                    href: "/dashboard/brand",
                    colorText: "text-indigo-600 dark:text-indigo-400",
                    colorBg: "bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25",
                  },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold ${action.colorText} ${action.colorBg} transition-all duration-150 hover:-translate-y-0.5 active:scale-95`}
                  >
                    <action.icon className="h-3.5 w-3.5" />
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>



          {/* ══════════════════════════════════════════════
              SECTION 7 — Onboarding Checklist (dismissible)
          ══════════════════════════════════════════════ */}
          <AnimatePresence>
            {showChecklist && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              >
                <div className="relative rounded-2xl border border-[#0066B2]/20 dark:border-[#38BDF8]/15 overflow-hidden shadow-sm">
                  {/* Top accent bar */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-[#7C3AED]" />

                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white dark:from-[#0066B2]/[0.07] dark:to-[#18181B] px-5 py-5">
                    {/* Checklist header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Rocket className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                            Getting Started
                          </h2>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0066B2]/10 dark:bg-[#38BDF8]/20 text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8]">
                            {checklistDoneCount}/{checklistItems.length} done
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-[#9B9085]">
                          Complete these steps to get the most out of LeadMagnets.
                        </p>
                      </div>
                      <button
                        onClick={dismissChecklist}
                        className="shrink-0 p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        title="Dismiss checklist"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4 h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(checklistDoneCount / checklistItems.length) * 100}%`,
                        }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-[#0066B2] to-[#38BDF8]"
                      />
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {checklistItems.map((ci) => (
                        <div
                          key={ci.id}
                          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors ${
                            ci.done
                              ? "opacity-55"
                              : "bg-white/70 dark:bg-white/[0.04] border border-zinc-100/80 dark:border-white/[0.06]"
                          }`}
                        >
                          {/* Checkbox */}
                          <div
                            className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center border-2 transition-all ${
                              ci.done
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-zinc-300 dark:border-zinc-600"
                            }`}
                          >
                            {ci.done && (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            )}
                          </div>

                          {/* Label */}
                          <span
                            className={`flex-1 text-xs font-medium ${
                              ci.done
                                ? "line-through text-zinc-400 dark:text-zinc-600"
                                : "text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {ci.label}
                          </span>

                          {/* CTA link */}
                          {!ci.done && ci.href && (
                            <Link
                              href={ci.href}
                              className="shrink-0 text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline underline-offset-2"
                            >
                              Do it →
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
          'Create a magnet' POPUP MODAL OVERLAY
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-200"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-[460px] rounded-2xl border border-zinc-200/80 dark:border-[#2e2e38] bg-white dark:bg-[#18181c] p-6 text-zinc-900 dark:text-white shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {createModalType === "classic"
                      ? "Create Landing Page"
                      : createModalType === "locked-pdf"
                      ? "Create Locked PDF"
                      : "Create a magnet"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                    Name the page and choose its URL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Page Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">
                      Page name
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAiTitle}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Title Generator
                    </button>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={createMagnetName}
                    onChange={(e) => setCreateMagnetName(e.target.value)}
                    placeholder="AI Pipeline Playbook"
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:ring-2 focus:ring-[#0066B2] transition-all"
                  />
                </div>

                {/* URL Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">
                    URL slug
                  </label>
                  <div className="flex items-center rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-500 dark:text-[#9B9085]">
                    <span className="text-zinc-400 dark:text-[#666675] shrink-0 mr-1.5">/</span>
                    <span className="font-mono text-zinc-800 dark:text-[#d4c8bc] truncate">
                      {createMagnetName
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-") || "untitled-page"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-[#666675]">
                    The path of the page. Lowercase, digits, and hyphens only.
                  </p>
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#222228] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2c2c34] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  {createModalType === "classic" ? (
                    <button
                      type="button"
                      onClick={() => handleCreateMagnet("classic")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Create Landing Page
                    </button>
                  ) : createModalType === "locked-pdf" ? (
                    <button
                      type="button"
                      onClick={() => handleCreateMagnet("locked-pdf")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066B2] hover:bg-[#005291] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Create Locked PDF
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCreateMagnet("locked-pdf")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066B2] hover:bg-[#005291] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Locked PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateMagnet("classic")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Landing Page
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

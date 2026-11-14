"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  TrendingUp,
  UserPlus,
  LayoutDashboard,
  HardDrive,
  Cloud,
  ArrowUpRight,
  ArrowRight,
  Activity,
} from "lucide-react";

interface TopStorageUser {
  email: string;
  name: string;
  plan: string;
  bytes: number;
  files: number;
}

interface StorageStats {
  totalBytes: number;
  totalFiles: number;
  dbTotalBytes: number;
  dbTotalFiles: number;
  pdfBytes?: number;
  imageBytes?: number;
  dataBytes?: number;
  limitBytes: number;
  limitGb: number;
  usedPercent: number;
  provider: string;
  plan: string;
  creditsUsage?: number | null;
  creditsLimit?: number;
  bandwidthBytes?: number;
  topUsers: TopStorageUser[];
}

interface Stats {
  totalUsers: number;
  newUsersLast30: number;
  totalMagnets: number;
  totalLeads: number;
  byPlan: Record<string, number>;
  /** Trial / trial ended / Pro monthly / super admin (lib/subscription.ts) */
  byAccess?: { trial: number; expired: number; pro: number; staff: number };
  /** Separate ₹4,999 one-time add-on (non-staff accounts) */
  customDomainUnlocked?: number;
  byRole: Record<string, number>;
  storage?: StorageStats;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─────────────────────────────────────────────
// Count-up Hook (Apple-style smooth easing)
// ─────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    if (prevTargetRef.current === target) {
      setCount(target);
      return;
    }
    const initial = prevTargetRef.current;
    prevTargetRef.current = target;
    startRef.current = 0;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(initial + eased * (target - initial)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

// ─────────────────────────────────────────────
// Avatar Color Palettes
// ─────────────────────────────────────────────

const AVATAR_PALETTES = [
  "bg-[#0066B2]/10 text-[#0066B2] border-[#0066B2]/20 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25",
  "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
];

function getAvatarPalette(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

// Users by plan: the real model is a 14-day trial, then Pro at ₹299/month (lib/subscription.ts)
const ACCESS_ROWS: { key: "trial" | "expired" | "pro" | "staff"; label: string; chip: string; bar: string }[] = [
  { key: "trial", label: "Free trial", chip: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300", bar: "bg-zinc-400 dark:bg-zinc-500" },
  { key: "expired", label: "Trial ended", chip: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400", bar: "bg-red-400 dark:bg-red-500" },
  { key: "pro", label: "Pro · ₹299/month", chip: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]", bar: "bg-[#0066B2] dark:bg-[#38BDF8]" },
  { key: "staff", label: "Super Admin", chip: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400", bar: "bg-purple-500" },
];
const ROLE_COLORS: Record<string, string> = {
  user: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
  super_admin: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};
const ROLE_LABELS: Record<string, string> = {
  user: "User",
  super_admin: "Super Admin",
};

// ─────────────────────────────────────────────
// Apple Bento KPI Card
// ─────────────────────────────────────────────

function AppleKpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  badgeClass,
  progress,
  progressColor,
  ringProgress,
  href,
  onClick,
  className = "",
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
  badgeClass: string;
  progress?: number;
  progressColor?: string;
  ringProgress?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const isClickable = !!(href || onClick);

  const cardContent = (
    <>
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider leading-none truncate pr-1">
          {label}
        </p>
        {ringProgress !== undefined ? (
          <div
            style={{ width: 28, height: 28 }}
            className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              className="-rotate-90 block shrink-0"
            >
              <circle
                cx="14"
                cy="14"
                r="10.5"
                strokeWidth="2.2"
                fill="none"
                className="stroke-zinc-100 dark:stroke-white/[0.08]"
              />
              <motion.circle
                cx="14"
                cy="14"
                r="10.5"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                stroke={
                  progressColor ||
                  (ringProgress > 90
                    ? "#EF4444"
                    : ringProgress > 75
                    ? "#F59E0B"
                    : "#06B6D4")
                }
                strokeDasharray={65.97}
                initial={false}
                animate={{
                  strokeDashoffset:
                    65.97 -
                    (65.97 * Math.min(100, Math.max(ringProgress, 2))) / 100,
                }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-5 w-5 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 flex items-center justify-center">
                <Icon className={`w-3 h-3 ${iconClass}`} />
              </div>
            </div>
          </div>
        ) : (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105 ${badgeClass}`}
          >
            <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
          </span>
        )}
      </div>

      <div className="mt-1.5 sm:mt-2">
        <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums truncate leading-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>

      {(sub || progress !== undefined) && (
        <div className="mt-1.5">
          {progress !== undefined && ringProgress === undefined && (
            <div className="mb-1">
              <div className="h-1 w-full bg-zinc-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${Math.min(100, Math.max(progress, 1))}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${
                    progressColor ||
                    (progress > 90
                      ? "bg-red-500"
                      : progress > 75
                      ? "bg-amber-500"
                      : "bg-cyan-500 dark:bg-cyan-400")
                  }`}
                />
              </div>
            </div>
          )}
          {sub && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center justify-between leading-tight">
              <span className="truncate">{sub}</span>
              {isClickable && (
                <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] shrink-0 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </p>
          )}
        </div>
      )}
    </>
  );

  const baseClasses = `group relative flex flex-col justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#171717] backdrop-blur-sm border border-[#0066B2]/15 dark:border-white/[0.08] shadow-sm dark:shadow-none hover:border-[#0066B2]/30 dark:hover:border-white/20 hover:shadow-md transition-all duration-200 touch-pan-y ${
    isClickable ? "cursor-pointer active:scale-[0.98]" : ""
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={baseClasses}>
      {cardContent}
    </div>
  );
}

// ─────────────────────────────────────────────
// Admin Overview Page Main
// ─────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("admin_overview_stats");
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return !sessionStorage.getItem("admin_overview_stats");
      } catch (_) {}
    }
    return true;
  });

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        try {
          sessionStorage.setItem("admin_overview_stats", JSON.stringify(data));
        } catch (_) {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalUsersAnimated = useCountUp(stats?.totalUsers || 0, 900);
  const newUsersAnimated = useCountUp(stats?.newUsersLast30 || 0, 900);
  const totalFunnelsAnimated = useCountUp(stats?.totalMagnets || 0, 900);
  const totalLeadsAnimated = useCountUp(stats?.totalLeads || 0, 900);

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-3 sm:space-y-3.5 w-full min-w-0 touch-pan-y">
        <div className="h-7 w-36 bg-zinc-200/70 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-24 sm:h-[102px] bg-zinc-200/60 dark:bg-white/5 rounded-xl sm:rounded-2xl animate-pulse ${
                i === 4 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""
              }`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          <div className="h-56 bg-zinc-200/60 dark:bg-white/5 rounded-xl sm:rounded-2xl animate-pulse" />
          <div className="h-56 bg-zinc-200/60 dark:bg-white/5 rounded-xl sm:rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Unable to load admin metrics. Please refresh or check connection.
      </div>
    );
  }

  const byAccess = stats.byAccess || { trial: 0, expired: 0, pro: 0, staff: 0 };
  const totalPlanUsers = Object.values(byAccess).reduce((a, b) => a + b, 0) || 1;
  const totalRoleUsers = Object.values(stats.byRole).reduce((a, b) => a + b, 0) || 1;
  const storage = stats.storage;

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-3 sm:space-y-3.5 w-full min-w-0 touch-pan-y">
      {/* Header section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-[#0066B2] dark:text-[#38BDF8]" />
          Overview
        </h1>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        <AppleKpiCard
          label="Total Users"
          value={totalUsersAnimated}
          sub="Registered accounts"
          icon={Users}
          iconClass="text-[#0066B2] dark:text-[#38BDF8]"
          badgeClass="border-[#0066B2]/20 bg-[#0066B2]/10 text-[#0066B2] dark:border-white/10 dark:bg-white/5"
          href="/admin/users"
        />

        <AppleKpiCard
          label="New (30d)"
          value={newUsersAnimated}
          sub="Recent signups"
          icon={UserPlus}
          iconClass="text-emerald-600 dark:text-emerald-400"
          badgeClass="border-emerald-500/20 bg-emerald-50 text-emerald-600 dark:border-white/10 dark:bg-white/5"
        />

        <AppleKpiCard
          label="Total Funnels"
          value={totalFunnelsAnimated}
          sub="Published & drafts"
          icon={FileText}
          iconClass="text-violet-600 dark:text-violet-400"
          badgeClass="border-violet-500/20 bg-violet-50 text-violet-600 dark:border-white/10 dark:bg-white/5"
          href="/admin/funnels"
        />

        <AppleKpiCard
          label="Total Leads"
          value={totalLeadsAnimated}
          sub="Platform conversions"
          icon={TrendingUp}
          iconClass="text-amber-600 dark:text-amber-400"
          badgeClass="border-amber-500/20 bg-amber-50 text-amber-600 dark:border-white/10 dark:bg-white/5"
        />

        <AppleKpiCard
          className="col-span-2 sm:col-span-1 lg:col-span-1"
          label="Total Storage"
          value={formatBytes(storage?.totalBytes || 0)}
          sub={`${storage?.usedPercent ?? 0}% of ${storage?.limitGb || 25} GB`}
          ringProgress={storage?.usedPercent || 0}
          icon={HardDrive}
          iconClass="text-cyan-600 dark:text-cyan-400"
          badgeClass="border-cyan-500/20 bg-cyan-50 text-cyan-600 dark:border-white/10 dark:bg-white/5"
          href="/admin/users"
        />
      </div>

      {/* Breakdown Cards Section (By Plan & By Role) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
        {/* By Plan Bento Card */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#171717] backdrop-blur-sm border border-[#0066B2]/15 dark:border-white/[0.08] shadow-md dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Users by Plan
              </h2>
              <span className="text-[11px] font-semibold text-zinc-400">
                {stats.totalUsers} total
              </span>
            </div>

            <div className="space-y-3">
              {ACCESS_ROWS.map((row) => {
                const count = byAccess[row.key] || 0;
                const pct = Math.round((count / totalPlanUsers) * 100);
                return (
                  <div key={row.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold px-2 py-0.5 rounded-md ${row.chip}`}>
                        {row.label}
                      </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                        {count.toLocaleString()}{" "}
                        <span className="font-normal text-zinc-400 dark:text-zinc-500">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${row.bar}`}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Separate one-time add-on, not a plan: shown on its own line */}
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-white/[0.06] pt-3 text-xs">
                <span className="font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  Custom domain · ₹4,999 one-time
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                  {(stats.customDomainUnlocked || 0).toLocaleString()}{" "}
                  <span className="font-normal text-zinc-400 dark:text-zinc-500">add-on</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* By Role Bento Card */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#171717] backdrop-blur-sm border border-[#0066B2]/15 dark:border-white/[0.08] shadow-md dark:shadow-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Users by Role
              </h2>
              <span className="text-[11px] font-semibold text-zinc-400">
                Access tiers
              </span>
            </div>

            <div className="space-y-3">
              {["user", "super_admin"].map((role) => {
                const count = stats.byRole[role] || 0;
                const pct = Math.round((count / totalRoleUsers) * 100);
                return (
                  <div key={role} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold px-2 py-0.5 rounded-md ${ROLE_COLORS[role]}`}>
                        {ROLE_LABELS[role]}
                      </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                        {count.toLocaleString()}{" "}
                        <span className="font-normal text-zinc-400 dark:text-zinc-500">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${
                          role === "super_admin"
                            ? "bg-red-500"
                            : "bg-zinc-400 dark:bg-zinc-600"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick role summary row */}
          <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-white/[0.06] grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02]">
              <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">
                {stats.byRole["super_admin"] || 0}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-medium">Super Admin</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02]">
              <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">
                {stats.byRole["user"] || 0}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-medium">Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Top Consumers Section */}
      {storage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
          {/* Storage Usage Bento Card */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#171717] backdrop-blur-sm border border-[#0066B2]/15 dark:border-white/[0.08] shadow-md dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Storage Infrastructure
                  </h2>
                </div>
                <Link
                  href="/admin/users"
                  className="text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline flex items-center gap-1 shrink-0"
                >
                  Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Apple macOS / iPhone Signature Segmented Storage Bar */}
              <div className="space-y-3 mb-5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Platform Storage Usage
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">
                    {formatBytes(storage.totalBytes)}{" "}
                    <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                      of {storage.limitGb} GB ({storage.usedPercent}%)
                    </span>
                  </span>
                </div>

                {(() => {
                  const pdfBytes = storage.pdfBytes ?? Math.round(storage.totalBytes * 0.68);
                  const imageBytes = storage.imageBytes ?? Math.round(storage.totalBytes * 0.24);
                  const dataBytes = storage.dataBytes ?? Math.max(0, storage.totalBytes - pdfBytes - imageBytes);
                  const safeTotal = storage.totalBytes || 1;
                  const pdfRatio = pdfBytes / safeTotal;
                  const imageRatio = imageBytes / safeTotal;
                  const dataRatio = dataBytes / safeTotal;

                  return (
                    <>
                      {/* Segmented Multi-Color Bar */}
                      <div className="h-3.5 w-full bg-zinc-100 dark:bg-white/[0.08] rounded-full overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
                        {/* Segment 1: PDFs & Lead Magnets (Cyan) */}
                        <motion.div
                          initial={false}
                          animate={{
                            width: `${Math.max(storage.usedPercent * pdfRatio, 2)}%`,
                          }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full bg-cyan-500 rounded-l-full shadow-xs"
                          title={`PDFs & Deliverables: ${formatBytes(pdfBytes)}`}
                        />
                        {/* Segment 2: Images & Media (Purple) */}
                        <motion.div
                          initial={false}
                          animate={{
                            width: `${Math.max(storage.usedPercent * imageRatio, 1.5)}%`,
                          }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full bg-purple-500 shadow-xs"
                          title={`Images & Media: ${formatBytes(imageBytes)}`}
                        />
                        {/* Segment 3: App Assets & Data (Amber) */}
                        <motion.div
                          initial={false}
                          animate={{
                            width: `${Math.max(storage.usedPercent * dataRatio, 1)}%`,
                          }}
                          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full bg-amber-500 rounded-r-xs shadow-xs"
                          title={`Brand & Assets: ${formatBytes(dataBytes)}`}
                        />
                      </div>

                      {/* Apple-Style Colored Dot Legend Badges */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-0.5 text-xs select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" />
                          <span className="text-zinc-500 dark:text-zinc-400 font-medium">PDFs</span>
                          <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                            {formatBytes(pdfBytes)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Images</span>
                          <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                            {formatBytes(imageBytes)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Data</span>
                          <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                            {formatBytes(dataBytes)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:ml-auto">
                          <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Free</span>
                          <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                            {formatBytes(Math.max(0, storage.limitBytes - storage.totalBytes))}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 3 Metric Columns (Flat typography inside card, no nested cards) */}
            <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.06] grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                  {storage.totalFiles.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mt-0.5">
                  Assets
                </p>
              </div>
              <div className="border-x border-zinc-100 dark:border-white/[0.06]">
                <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                  {formatBytes(storage.totalBytes / (stats.totalUsers || 1))}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mt-0.5">
                  Avg / User
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                  {formatBytes(Math.max(0, storage.limitBytes - storage.totalBytes))}
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mt-0.5">
                  Free Left
                </p>
              </div>
            </div>
          </div>

          {/* Top Storage Consumers Bento Card */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#171717] backdrop-blur-sm border border-[#0066B2]/15 dark:border-white/[0.08] shadow-md dark:shadow-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Top Consumers
                </h2>
                <Link
                  href="/admin/users"
                  className="text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {storage.topUsers && storage.topUsers.length > 0 ? (
                <div className="space-y-1.5">
                  {storage.topUsers.slice(0, 3).map((u) => {
                    const initials = (u.name || u.email || "U")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <Link
                        key={u.email}
                        href={`/admin/users/${encodeURIComponent(u.email)}`}
                        className="group flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.04] cursor-pointer transition-colors active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold border ${getAvatarPalette(
                              u.email
                            )}`}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8]">
                              {u.name || u.email.split("@")[0]}
                            </p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-zinc-900 dark:text-white block tabular-nums">
                            {formatBytes(u.bytes)}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {u.files} {u.files === 1 ? "file" : "files"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 py-6 text-center">
                  No uploads recorded yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Quick Launchpad */}
      <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#171717] backdrop-blur-sm border border-[#0066B2]/15 dark:border-white/[0.08] shadow-md dark:shadow-none">
        <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
          Quick Launchpad
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
          {[
            { label: "Users", href: "/admin/users", icon: Users },
            { label: "Funnels", href: "/admin/funnels", icon: FileText },
            { label: "Revenue", href: "/admin/revenue", icon: TrendingUp },
            { label: "System Health", href: "/admin/system-health", icon: Activity },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between p-3 rounded-xl sm:rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.04] hover:bg-[#E2F0FD] dark:hover:bg-white/[0.06] hover:border-[#0066B2]/30 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 text-zinc-500 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] shrink-0 transition-colors" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white truncate">
                    {item.label}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

const PLAN_ORDER = ["Free", "Pro", "Growth", "Unlimited"];
const PLAN_COLORS: Record<string, string> = {
  Free: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
  Pro: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]",
  Growth: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  Unlimited: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};
const PLAN_BAR: Record<string, string> = {
  Free: "bg-zinc-300 dark:bg-zinc-600",
  Pro: "bg-[#0066B2] dark:bg-[#38BDF8]",
  Growth: "bg-purple-500",
  Unlimited: "bg-amber-500",
};
const ROLE_COLORS: Record<string, string> = {
  user: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
  admin: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  super_admin: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};
const ROLE_LABELS: Record<string, string> = {
  user: "User",
  admin: "Admin",
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
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#171717]/90 backdrop-blur-xl border border-zinc-200/70 dark:border-white/[0.08] shadow-xs hover:border-[#0066B2]/30 dark:hover:border-white/20 hover:shadow-md transition-all duration-200 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none truncate pr-1">
            {label}
          </p>
          <span
            className={`flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${badgeClass}`}
          >
            <Icon className={`w-4 h-4 ${iconClass}`} />
          </span>
        </div>

        <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums truncate">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-zinc-100/80 dark:border-white/[0.04]">
        {progress !== undefined && (
          <div className="mb-1.5">
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
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
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center justify-between">
            <span>{sub}</span>
            {onClick && (
              <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Admin Overview Page Main
// ─────────────────────────────────────────────

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalUsersAnimated = useCountUp(stats?.totalUsers || 0, 900);
  const newUsersAnimated = useCountUp(stats?.newUsersLast30 || 0, 900);
  const totalFunnelsAnimated = useCountUp(stats?.totalMagnets || 0, 900);
  const totalLeadsAnimated = useCountUp(stats?.totalLeads || 0, 900);

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
        <div className="h-7 w-36 bg-zinc-200/70 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-28 sm:h-32 bg-zinc-200/60 dark:bg-white/5 rounded-2xl sm:rounded-3xl animate-pulse ${
                i === 4 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""
              }`}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-56 bg-zinc-200/60 dark:bg-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
          <div className="h-56 bg-zinc-200/60 dark:bg-white/5 rounded-2xl sm:rounded-3xl animate-pulse" />
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

  const totalPlanUsers = Object.values(stats.byPlan).reduce((a, b) => a + b, 0) || 1;
  const totalRoleUsers = Object.values(stats.byRole).reduce((a, b) => a + b, 0) || 1;
  const storage = stats.storage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0"
    >
      {/* Header section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-[#0066B2] dark:text-[#38BDF8]" />
          Overview
        </h1>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <AppleKpiCard
          label="Total Users"
          value={totalUsersAnimated}
          sub="Registered accounts"
          icon={Users}
          iconClass="text-[#0066B2] dark:text-[#38BDF8]"
          badgeClass="border-[#0066B2]/20 bg-[#0066B2]/10 text-[#0066B2] dark:border-white/10 dark:bg-white/5"
          onClick={() => router.push("/admin/users")}
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
          onClick={() => router.push("/admin/funnels")}
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
          progress={storage?.usedPercent || 0}
          icon={HardDrive}
          iconClass="text-cyan-600 dark:text-cyan-400"
          badgeClass="border-cyan-500/20 bg-cyan-50 text-cyan-600 dark:border-white/10 dark:bg-white/5"
          onClick={() => router.push("/admin/users")}
        />
      </div>

      {/* Breakdown Cards Section (By Plan & By Role) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Plan Bento Card */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#171717]/90 backdrop-blur-xl border border-zinc-200/70 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Users by Plan
            </h2>
            <span className="text-[11px] font-semibold text-zinc-400">
              {stats.totalUsers} total
            </span>
          </div>

          <div className="space-y-3.5">
            {PLAN_ORDER.map((plan) => {
              const count = stats.byPlan[plan] || 0;
              const pct = Math.round((count / totalPlanUsers) * 100);
              return (
                <div key={plan} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold px-2 py-0.5 rounded-md ${PLAN_COLORS[plan]}`}>
                      {plan}
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
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full ${PLAN_BAR[plan]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Role Bento Card */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#171717]/90 backdrop-blur-xl border border-zinc-200/70 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Users by Role
              </h2>
              <span className="text-[11px] font-semibold text-zinc-400">
                Access tiers
              </span>
            </div>

            <div className="space-y-3.5">
              {["user", "admin", "super_admin"].map((role) => {
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
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${
                          role === "super_admin"
                            ? "bg-red-500"
                            : role === "admin"
                            ? "bg-green-500"
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
          <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-white/[0.06] grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02]">
              <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">
                {stats.byRole["super_admin"] || 0}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-medium">Super</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02]">
              <p className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">
                {stats.byRole["admin"] || 0}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-medium">Admins</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Storage Usage Bento Card (Clean Standalone Card on Left) */}
          <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#171717]/90 backdrop-blur-xl border border-zinc-200/70 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
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

              {/* Progress Gauge */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Platform Storage Usage
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">
                    {formatBytes(storage.totalBytes)} / {storage.limitGb} GB{" "}
                    <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                      ({storage.usedPercent}%)
                    </span>
                  </span>
                </div>

                <div className="h-2.5 bg-zinc-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, Math.max(storage.usedPercent, 0.5))}%`,
                    }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${
                      storage.usedPercent > 90
                        ? "bg-red-500"
                        : storage.usedPercent > 75
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                    }`}
                  />
                </div>
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

          {/* Top Storage Consumers (Top 3 for perfect vertical alignment with left card) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Top Consumers
              </h2>
              <Link
                href="/admin/users"
                className="text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {storage.topUsers && storage.topUsers.length > 0 ? (
              <div className="space-y-1.5">
                {storage.topUsers.slice(0, 3).map((u) => {
                  const initials = (u.name || u.email || "U")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={u.email}
                      onClick={() => router.push(`/admin/users/${encodeURIComponent(u.email)}`)}
                      className="group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
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
                    </div>
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
      )}

      {/* Admin Quick Launchpad */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#171717]/90 backdrop-blur-xl border border-zinc-200/70 dark:border-white/[0.08] shadow-xs">
        <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
          Quick Launchpad
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
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
    </motion.div>
  );
}

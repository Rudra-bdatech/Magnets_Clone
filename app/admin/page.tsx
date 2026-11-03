"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  FileText,
  TrendingUp,
  UserPlus,
  LayoutDashboard,
  HardDrive,
  Cloud,
  ArrowUpRight,
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

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  badgeClass,
  progress,
  progressColor,
  onClick,
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
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/90 dark:bg-[#171717] border border-[#0066B2]/10 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[#0066B2]/20 dark:hover:border-white/[0.14] transition-colors duration-200 flex flex-col justify-between ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest leading-none">
            {label}
          </p>
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${badgeClass}`}>
            <Icon className={`w-4 h-4 ${iconClass}`} />
          </span>
        </div>
        <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>

      <div className="mt-3">
        {progress !== undefined && (
          <div className="mb-2">
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  progressColor ||
                  (progress > 90
                    ? "bg-red-500"
                    : progress > 75
                    ? "bg-amber-500"
                    : "bg-cyan-500 dark:bg-cyan-400")
                }`}
                style={{ width: `${Math.min(100, Math.max(progress, 1))}%` }}
              />
            </div>
          </div>
        )}
        {sub && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-7 w-40 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-48 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
          <div className="h-48 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-sm text-zinc-400 dark:text-zinc-500">Failed to load stats.</div>
    );
  }

  const totalPlanUsers = Object.values(stats.byPlan).reduce((a, b) => a + b, 0) || 1;
  const totalRoleUsers = Object.values(stats.byRole).reduce((a, b) => a + b, 0) || 1;
  const storage = stats.storage;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-[#0066B2] dark:text-[#38BDF8]" />
          Overview
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Platform-wide metrics at a glance</p>
      </div>

      {/* KPI cards - 5 columns on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Total Users"
          value={stats.totalUsers}
          sub="all registered accounts"
          icon={Users}
          iconClass="text-[#0066B2] dark:text-[#38BDF8]"
          badgeClass="border-[#0066B2]/30 bg-[#EFF6FF] dark:border-white/10 dark:bg-white/5"
          onClick={() => router.push("/admin/users")}
        />
        <KpiCard
          label="New (30d)"
          value={stats.newUsersLast30}
          sub="joined in last 30 days"
          icon={UserPlus}
          iconClass="text-emerald-600 dark:text-emerald-400"
          badgeClass="border-emerald-500/30 bg-emerald-50 dark:border-white/10 dark:bg-white/5"
        />
        <KpiCard
          label="Total Funnels"
          value={stats.totalMagnets}
          sub="across all users"
          icon={FileText}
          iconClass="text-violet-600 dark:text-violet-400"
          badgeClass="border-violet-500/30 bg-violet-50 dark:border-white/10 dark:bg-white/5"
          onClick={() => router.push("/admin/funnels")}
        />
        <KpiCard
          label="Total Leads"
          value={stats.totalLeads}
          sub="platform-wide signups"
          icon={TrendingUp}
          iconClass="text-amber-600 dark:text-amber-400"
          badgeClass="border-amber-500/30 bg-amber-50 dark:border-white/10 dark:bg-white/5"
        />
        <KpiCard
          label="Total Storage"
          value={formatBytes(storage?.totalBytes || 0)}
          sub={`${storage?.usedPercent ?? 0}% of ${storage?.limitGb || 25} GB used`}
          progress={storage?.usedPercent || 0}
          icon={HardDrive}
          iconClass="text-cyan-600 dark:text-cyan-400"
          badgeClass="border-cyan-500/30 bg-cyan-50 dark:border-white/10 dark:bg-white/5"
          onClick={() => router.push("/admin/users")}
        />
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* By Plan */}
        <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/10 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest mb-4">Users by Plan</h2>
          <div className="space-y-4">
            {PLAN_ORDER.map((plan) => {
              const count = stats.byPlan[plan] || 0;
              const pct = Math.round((count / totalPlanUsers) * 100);
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PLAN_COLORS[plan]}`}>{plan}</span>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      {count.toLocaleString()} <span className="font-normal text-zinc-400 dark:text-zinc-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${PLAN_BAR[plan]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Role */}
        <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/10 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest mb-4">Users by Role</h2>
          <div className="space-y-4">
            {["user", "admin", "super_admin"].map((role) => {
              const count = stats.byRole[role] || 0;
              const pct = Math.round((count / totalRoleUsers) * 100);
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      {count.toLocaleString()} <span className="font-normal text-zinc-400 dark:text-zinc-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        role === "super_admin" ? "bg-red-400 dark:bg-red-500" :
                        role === "admin" ? "bg-green-400 dark:bg-green-500" :
                        "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick stat row */}
          <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-white/[0.06] flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.byRole["super_admin"] || 0}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Super Admins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.byRole["admin"] || 0}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Admins</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{stats.byRole["user"] || 0}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Regular Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Infrastructure Widget */}
      {storage && (
        <div className="mt-6 bg-white/90 dark:bg-[#171717] border border-[#0066B2]/10 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">
                  Storage & Media Infrastructure
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  {storage.provider} • {storage.plan} Plan ({storage.limitGb} GB)
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Aggregated storage footprint across all {stats.totalUsers} registered users
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              View user storage breakdown <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Storage Progress Gauge */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
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

                <div className="h-2.5 bg-zinc-200 dark:bg-white/[0.08] rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      storage.usedPercent > 90
                        ? "bg-red-500"
                        : storage.usedPercent > 75
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(storage.usedPercent, 0.5))}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-200/60 dark:border-white/[0.04] text-center">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                      {storage.totalFiles.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                      Total Assets
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                      {formatBytes(storage.totalBytes / (stats.totalUsers || 1))}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                      Avg / User
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                      {formatBytes(Math.max(0, storage.limitBytes - storage.totalBytes))}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                      Free Remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Storage Consumers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
                  Top Storage Consumers
                </p>
                <span className="text-[10px] text-zinc-400">by usage</span>
              </div>
              {storage.topUsers && storage.topUsers.length > 0 ? (
                <div className="space-y-2">
                  {storage.topUsers.slice(0, 4).map((u) => (
                    <div
                      key={u.email}
                      onClick={() => router.push(`/admin/users/${encodeURIComponent(u.email)}`)}
                      className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {u.name || u.email}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-zinc-900 dark:text-white block">
                          {formatBytes(u.bytes)}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {u.files} {u.files === 1 ? "file" : "files"}
                        </span>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}

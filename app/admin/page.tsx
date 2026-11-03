"use client";

import { useState, useEffect } from "react";
import { Users, FileText, TrendingUp, UserPlus, LayoutDashboard } from "lucide-react";

interface Stats {
  totalUsers: number;
  newUsersLast30: number;
  totalMagnets: number;
  totalLeads: number;
  byPlan: Record<string, number>;
  byRole: Record<string, number>;
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
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
  badgeClass: string;
}) {
  return (
    <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/10 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[#0066B2]/20 dark:hover:border-white/[0.14] transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest leading-none">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${badgeClass}`}>
          <Icon className={`w-4 h-4 ${iconClass}`} />
        </span>
      </div>
      <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-[#0066B2] dark:text-[#38BDF8]" />
          Overview
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Platform-wide metrics at a glance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Users"
          value={stats.totalUsers}
          sub="all registered accounts"
          icon={Users}
          iconClass="text-[#0066B2] dark:text-[#38BDF8]"
          badgeClass="border-[#0066B2]/30 bg-[#EFF6FF] dark:border-white/10 dark:bg-white/5"
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
        />
        <KpiCard
          label="Total Leads"
          value={stats.totalLeads}
          sub="platform-wide signups"
          icon={TrendingUp}
          iconClass="text-amber-600 dark:text-amber-400"
          badgeClass="border-amber-500/30 bg-amber-50 dark:border-white/10 dark:bg-white/5"
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
    </div>
  );
}

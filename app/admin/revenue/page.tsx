"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  Calendar,
  Layers,
} from "lucide-react";

interface RevenueData {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  otherPlanUsers: number;
  recentSignups: number;

  stripeProUsers: number;
  chargebeeProUsers: number;
  otherProUsers: number;

  mrrUsd: number;
  mrrInr: number;
  lifetimeDomainUsers: number;
  lifetimeDomainRevenueInr: number;

  activeProUsers: number;
  cancelledProUsers: number;
  unknownStatusProUsers: number;

  recentConversions: {
    email: string;
    name: string;
    provider: string;
    paymentStatus: string;
    lastPaymentDate: string;
    isRecurring: boolean;
  }[];
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "blue",
  note,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: "blue" | "green" | "amber" | "indigo";
  note?: string;
}) {
  const colors = {
    blue: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/25 dark:text-indigo-400",
  };
  return (
    <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3.5 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {sub}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-2.5 rounded-xl ${colors[color]} shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      {note && (
        <p className="mt-2 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium leading-tight">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="truncate">{note}</span>
        </p>
      )}
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === "stripe") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30">
        Stripe
      </span>
    );
  }
  if (provider === "chargebee") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/30">
        Chargebee
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/5">
      {provider || "—"}
    </span>
  );
}

function StatusBadge({ status, isRecurring }: { status: string; isRecurring: boolean }) {
  const label = status || "unknown";
  if (label === "active") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30">
        {isRecurring ? "Active ↻" : "Paid"}
      </span>
    );
  }
  if (label === "cancelled") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200/50 dark:border-red-800/30">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/10">
      {label}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function RevenuePage() {
  const router = useRouter();
  const [data, setData] = useState<RevenueData | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("admin_revenue_cache");
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return !sessionStorage.getItem("admin_revenue_cache");
      } catch (_) {}
    }
    return true;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/revenue", silent ? { cache: "reload" } : {});
      if (!res.ok) throw new Error("Failed to load revenue data");
      const json = await res.json();
      setData(json);
      try {
        sessionStorage.setItem("admin_revenue_cache", JSON.stringify(json));
      } catch (_) {}
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const hasCache = !!data;
    load(hasCache);
  }, []);

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 md:p-8 space-y-5 max-w-7xl mx-auto">
        <div className="h-6 w-36 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 sm:h-28 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const conversionRate = data.totalUsers > 0
    ? ((data.proUsers / data.totalUsers) * 100).toFixed(1)
    : "0.0";

  const churnRate = data.proUsers > 0
    ? ((data.cancelledProUsers / data.proUsers) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto touch-pan-y">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
            Revenue Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Aggregated from your database · No live API latency
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 sm:px-3.5 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer shrink-0"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* KPI Cards — 2x2 on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          label="Custom Domain (INR est.)"
          value={`₹${(data.lifetimeDomainRevenueInr ?? 0).toLocaleString()}`}
          sub={`${data.lifetimeDomainUsers ?? 0} × ₹4,999 one-time`}
          icon={IndianRupee}
          color="green"
        />
        <StatCard
          label="MRR (INR est.)"
          value={`₹${data.mrrInr.toLocaleString()}`}
          sub={`${data.chargebeeProUsers} Chargebee × ₹299`}
          icon={IndianRupee}
          color="indigo"
          note="Pro monthly subscribers"
        />
        <StatCard
          label="Pro Users"
          value={data.proUsers.toString()}
          sub={`${conversionRate}% conversion`}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          label="New This Month"
          value={data.recentConversions.length.toString()}
          sub={`of ${data.recentSignups} signups`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Middle Section: Apple Bento Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Payment Providers */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3.5">
            Pro — Payment Provider
          </h2>
          <div className="space-y-3.5">
            {[
              { label: "Stripe (USD recurring)", count: data.stripeProUsers, color: "bg-indigo-500" },
              { label: "Chargebee (INR monthly)", count: data.chargebeeProUsers, color: "bg-orange-500" },
              { label: "Other / Unknown", count: data.otherProUsers, color: "bg-zinc-400" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400 truncate pr-2">{label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white shrink-0">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${color}`}
                    style={{ width: data.proUsers ? `${(count / data.proUsers) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3.5">
            Pro — Payment Status
          </h2>
          <div className="space-y-3.5">
            {[
              { label: "Active", count: data.activeProUsers, color: "bg-emerald-500" },
              { label: "Cancelled", count: data.cancelledProUsers, color: "bg-red-500" },
              { label: "Unknown", count: data.unknownStatusProUsers, color: "bg-zinc-400" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400 truncate pr-2">{label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white shrink-0">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${color}`}
                    style={{ width: data.proUsers ? `${(count / data.proUsers) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          {data.proUsers > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
              <span className="text-zinc-400 dark:text-zinc-500 font-medium">Churn rate</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{churnRate}%</span>
            </div>
          )}
        </div>

        {/* User Funnel */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3.5">
            User Funnel
          </h2>
          <div className="space-y-3.5">
            {[
              { label: "Total Users", count: data.totalUsers, color: "bg-[#0066B2]" },
              { label: "Trial / Expired", count: data.freeUsers, color: "bg-zinc-300 dark:bg-zinc-600" },
              { label: "Pro Plan (Paying)", count: data.proUsers, color: "bg-emerald-500" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400 truncate pr-2">{label}</span>
                  <span className="font-bold text-zinc-900 dark:text-white shrink-0">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${color}`}
                    style={{ width: data.totalUsers ? `${(count / data.totalUsers) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Free → Pro conversion</span>
            <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">{conversionRate}%</span>
          </div>
        </div>
      </div>

      {/* Recent Conversions Bento Section */}
      <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
        <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Recent Conversions</span>
            <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">(last 30 days)</span>
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            {data.recentConversions.length}
          </span>
        </div>

        {data.recentConversions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No conversions in the last 30 days
          </div>
        ) : (
          <>
            {/* Mobile Card List (md:hidden) — Apple Bento Conversion Rows */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {data.recentConversions.map((c) => (
                <div key={c.email} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                        {c.name || <span className="text-zinc-400 dark:text-zinc-500 font-normal">No name</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(c.email)}`)}
                        className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline font-mono truncate block text-left mt-0.5 cursor-pointer max-w-[220px]"
                        title="View user details"
                      >
                        {c.email}
                      </button>
                    </div>
                    <StatusBadge status={c.paymentStatus} isRecurring={c.isRecurring} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <ProviderBadge provider={c.provider} />
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {formatDate(c.lastPaymentDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Provider</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentConversions.map((c, i) => (
                    <tr
                      key={c.email}
                      className={`border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors ${
                        i === data.recentConversions.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-zinc-900 dark:text-white">
                          {c.name || <span className="text-zinc-400 dark:text-zinc-500 font-normal">No name</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(c.email)}`)}
                          className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer"
                        >
                          {c.email}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <ProviderBadge provider={c.provider} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.paymentStatus} isRecurring={c.isRecurring} />
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">
                        {formatDate(c.lastPaymentDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

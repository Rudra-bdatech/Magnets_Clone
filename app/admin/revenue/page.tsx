"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  IndianRupee,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
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
  estimatedInrLifetime: number;

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
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  };
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
          {note && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {note}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  if (provider === "stripe") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
        Stripe
      </span>
    );
  }
  if (provider === "chargebee") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
        Chargebee
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      {provider || "—"}
    </span>
  );
}

function StatusBadge({ status, isRecurring }: { status: string; isRecurring: boolean }) {
  const label = status || "unknown";
  if (label === "active") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
        {isRecurring ? "Active ↻" : "Paid"}
      </span>
    );
  }
  if (label === "cancelled") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      {label}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/revenue", silent ? { cache: "reload" } : {});
      if (!res.ok) throw new Error("Failed to load revenue data");
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 flex items-center gap-3 text-red-500">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
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
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Revenue Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Aggregated from your database — no live API calls
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="MRR (USD)"
          value={`$${data.mrrUsd.toLocaleString()}`}
          sub={`${data.stripeProUsers} Stripe subscribers × $29`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Lifetime Revenue (INR est.)"
          value={`₹${data.estimatedInrLifetime.toLocaleString()}`}
          sub={`${data.chargebeeProUsers} Chargebee users × ₹4,999`}
          icon={IndianRupee}
          color="indigo"
          note="Estimated — Chargebee may include USD plans"
        />
        <StatCard
          label="Pro Users"
          value={data.proUsers.toString()}
          sub={`${conversionRate}% conversion rate`}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          label="New This Month"
          value={data.recentConversions.length.toString()}
          sub={`of ${data.recentSignups} new signups`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment Providers */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Pro — Payment Provider</h2>
          <div className="space-y-3">
            {[
              { label: "Stripe (USD recurring)", count: data.stripeProUsers, color: "bg-indigo-500" },
              { label: "Chargebee (INR / lifetime)", count: data.chargebeeProUsers, color: "bg-orange-500" },
              { label: "Other / Unknown", count: data.otherProUsers, color: "bg-zinc-400" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: data.proUsers ? `${(count / data.proUsers) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Pro — Payment Status</h2>
          <div className="space-y-3">
            {[
              { label: "Active", count: data.activeProUsers, color: "bg-emerald-500" },
              { label: "Cancelled", count: data.cancelledProUsers, color: "bg-red-500" },
              { label: "Unknown", count: data.unknownStatusProUsers, color: "bg-zinc-400" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: data.proUsers ? `${(count / data.proUsers) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          {data.proUsers > 0 && (
            <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
              Churn rate: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{churnRate}%</span>
            </p>
          )}
        </div>

        {/* User funnel */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">User Funnel</h2>
          <div className="space-y-3">
            {[
              { label: "Total Users", count: data.totalUsers, color: "bg-[#0066B2]" },
              { label: "Free Plan", count: data.freeUsers, color: "bg-zinc-300 dark:bg-zinc-600" },
              { label: "Pro Plan (Paying)", count: data.proUsers, color: "bg-emerald-500" },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: data.totalUsers ? `${(count / data.totalUsers) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            Free → Pro conversion: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{conversionRate}%</span>
          </p>
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            Recent Conversions
            <span className="ml-1 text-xs font-normal text-zinc-400">(last 30 days)</span>
          </h2>
        </div>

        {data.recentConversions.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No conversions in the last 30 days
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">{c.email}</div>
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
        )}
      </div>
    </div>
  );
}

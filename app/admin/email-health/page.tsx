"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Send, CheckCircle, Eye, MousePointer,
  AlertTriangle, Ban, RefreshCw, AlertCircle,
  Clock, Inbox, ChevronDown, User, ArrowRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlatformStats {
  sent: number; delivered: number; opened: number;
  clicked: number; bounced: number; complained: number;
  deliveryRate: number | null; openRate: number | null;
  clickRate: number | null; bounceRate: number | null;
  complaintRate: number | null;
}

interface UserStat {
  email: string; sent: number; delivered: number;
  opened: number; bounced: number; complained: number;
  bounceRate: number; complaintRate: number; openRate: number;
}

interface Problem {
  eventType: "bounced" | "complained";
  userEmail: string;
  // recipientEmail intentionally absent — API does not return lead personal data
  subject: string; sequenceId: string;
  pageId: string; createdAt: string;
}

interface FailedSequence {
  sequenceId: string; userEmail: string;
  pageId: string; failedLeads: number;
  maxFailCount: number; lastError: string;
  // sampleEmails intentionally absent — API does not return lead personal data
}

interface EmailHealthData {
  period: number;
  platform: PlatformStats;
  perUser: UserStat[];
  problems: Problem[];
  failedSequences: FailedSequence[];
  pendingLeads: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function pctStr(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(2)}%`;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function bounceFlag(rate: number): "ok" | "warn" | "danger" {
  if (rate >= 10) return "danger";
  if (rate >= 5)  return "warn";
  return "ok";
}

function complaintFlag(rate: number): "ok" | "warn" | "danger" {
  if (rate >= 0.5) return "danger";
  if (rate >= 0.1) return "warn";
  return "ok";
}

function userFlag(u: UserStat): "ok" | "warn" | "danger" {
  const bf = bounceFlag(u.bounceRate);
  const cf = complaintFlag(u.complaintRate);
  if (bf === "danger" || cf === "danger") return "danger";
  if (bf === "warn"   || cf === "warn")   return "warn";
  return "ok";
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, sub,
  status = "neutral",
}: {
  label: string; value: string; icon: React.ElementType;
  sub?: string; status?: "neutral" | "good" | "warn" | "danger";
}) {
  const iconBg = {
    neutral: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]",
    good:    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400",
    warn:    "bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400",
    danger:  "bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-400",
  };
  const valueCls = {
    neutral: "text-zinc-900 dark:text-white",
    good:    "text-emerald-600 dark:text-emerald-400",
    warn:    "text-amber-600 dark:text-amber-400",
    danger:  "text-red-600 dark:text-red-400",
  };
  return (
    <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3.5 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className={`mt-1 text-xl sm:text-2xl font-bold tracking-tight ${valueCls[status]} truncate`}>
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {sub}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-xl shrink-0 ${iconBg[status]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function FlagBadge({ flag }: { flag: "ok" | "warn" | "danger" }) {
  if (flag === "danger") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-400 border border-red-200/50 dark:border-red-800/30">
      <Ban className="w-3 h-3" /> High Risk
    </span>
  );
  if (flag === "warn") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
      <AlertTriangle className="w-3 h-3" /> Monitor
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/20">
      <CheckCircle className="w-3 h-3" /> Healthy
    </span>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  if (type === "bounced") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
      <AlertTriangle className="w-3 h-3" /> Bounced
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/25 dark:text-red-400 border border-red-200/50 dark:border-red-800/30">
      <Ban className="w-3 h-3" /> Complaint
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EmailHealthPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<7 | 30>(7);
  const [data, setData] = useState<EmailHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/email-health?period=${period}`, silent ? { cache: "reload" } : {});
      if (!res.ok) throw new Error("Failed to load email health data");
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
        <div className="h-6 w-44 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 sm:h-28 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
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

  const { platform: p, perUser, problems, failedSequences, pendingLeads } = data;

  const bounceStatus  = p.bounceRate    === null ? "neutral" : p.bounceRate    >= 10 ? "danger" : p.bounceRate    >= 5 ? "warn" : "good";
  const complaintStatus = p.complaintRate === null ? "neutral" : p.complaintRate >= 0.5 ? "danger" : p.complaintRate >= 0.1 ? "warn" : "good";
  const openStatus    = p.openRate      === null ? "neutral" : p.openRate      >= 30 ? "good"   : p.openRate      >= 15 ? "warn" : "danger";

  const flaggedUsers = perUser.filter((u) => userFlag(u) !== "ok");
  const displayUsers = showAllUsers ? perUser : perUser.slice(0, 10);

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
            Email Health Monitor
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Delivery problems surfaced before users report them
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Apple Segmented Period Capsule */}
          <div className="flex items-center bg-zinc-100 dark:bg-white/5 rounded-xl p-1 gap-1 border border-zinc-200/50 dark:border-white/5">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setPeriod(d); setShowAllUsers(false); }}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  period === d
                    ? "bg-white dark:bg-[#171717] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
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
      </div>

      {/* Pending leads alert */}
      {pendingLeads > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 shadow-xs">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="text-xs sm:text-sm font-medium leading-relaxed">
            <strong>{pendingLeads.toLocaleString()}</strong> leads are stuck in <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-md text-xs">pending_email</code> status — sequences may not be processing correctly.
          </span>
        </div>
      )}

      {/* KPI Cards — 2x3 on Mobile, 3x2 on Tablet, 6 columns on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <KpiCard label="Sent"       value={fmt(p.sent)}       icon={Send}          sub={`last ${period} days`}                   status="neutral" />
        <KpiCard label="Delivered"  value={fmt(p.delivered)}  icon={CheckCircle}   sub={pctStr(p.deliveryRate) + " rate"}         status={p.deliveryRate === null ? "neutral" : p.deliveryRate >= 95 ? "good" : p.deliveryRate >= 85 ? "warn" : "danger"} />
        <KpiCard label="Opened"     value={fmt(p.opened)}     icon={Eye}           sub={pctStr(p.openRate) + " open rate"}        status={openStatus} />
        <KpiCard label="Clicked"    value={fmt(p.clicked)}    icon={MousePointer}  sub={pctStr(p.clickRate) + " CTR"}             status="neutral" />
        <KpiCard label="Bounced"    value={fmt(p.bounced)}    icon={AlertTriangle} sub={pctStr(p.bounceRate) + " bounce rate"}    status={bounceStatus} />
        <KpiCard label="Complaints" value={fmt(p.complained)} icon={Ban}           sub={pctStr(p.complaintRate) + " complaint"}   status={complaintStatus} />
      </div>

      {/* Bounce/Complaint thresholds legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-white/[0.02] p-2.5 sm:p-3 rounded-xl border border-zinc-100 dark:border-white/[0.03]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Bounce &lt;5% · Complaint &lt;0.1% — Healthy</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Bounce 5–10% · Complaint 0.1–0.5% — Monitor</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Bounce &gt;10% · Complaint &gt;0.5% — High Risk</span>
      </div>

      {/* Per-User Delivery Breakdown */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              Per-User Delivery Breakdown
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {flaggedUsers.length > 0
                ? `${flaggedUsers.length} user${flaggedUsers.length !== 1 ? "s" : ""} flagged — sorted by bounce rate`
                : "No flagged users — sorted by bounce rate"}
            </p>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
          {perUser.length === 0 ? (
            <div className="py-16 text-center px-4">
              <Inbox className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No email events in the last {period} days.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (md:hidden) — Apple Bento Delivery Cards */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {displayUsers.map((u) => {
                  const flag = userFlag(u);
                  const bf   = bounceFlag(u.bounceRate);
                  const cf   = complaintFlag(u.complaintRate);
                  return (
                    <div key={u.email} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(u.email)}`)}
                          className="text-xs sm:text-sm font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline font-mono truncate block text-left max-w-[220px] cursor-pointer"
                        >
                          {u.email}
                        </button>
                        <FlagBadge flag={flag} />
                      </div>

                      {/* 4-metric snapshot grid */}
                      <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.05] text-center">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Sent
                          </div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                            {fmt(u.sent)}
                          </div>
                        </div>
                        <div className="border-l border-zinc-200/60 dark:border-white/10">
                          <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Delivered
                          </div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                            {fmt(u.delivered)}
                          </div>
                        </div>
                        <div className="border-x border-zinc-200/60 dark:border-white/10">
                          <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Open Rate
                          </div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                            {pctStr(u.openRate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Bounce Rate
                          </div>
                          <div className={`text-xs font-bold mt-0.5 ${
                            bf === "danger" ? "text-red-600 dark:text-red-400" : bf === "warn" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {pctStr(u.bounceRate)}
                          </div>
                        </div>
                      </div>

                      {/* Sub-row: Bounce count, complaints */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                        <span>Bounced: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{u.bounced}</strong></span>
                        <span>Complaints: <strong className={cf === "danger" ? "text-red-500 font-bold" : "text-zinc-700 dark:text-zinc-300 font-semibold"}>{u.complained} ({pctStr(u.complaintRate)})</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">User</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Sent</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Delivered</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Open%</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Bounced</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Bounce%</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Complaints</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Complaint%</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayUsers.map((u) => {
                      const flag = userFlag(u);
                      const bf   = bounceFlag(u.bounceRate);
                      const cf   = complaintFlag(u.complaintRate);
                      return (
                        <tr
                          key={u.email}
                          className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/users/${encodeURIComponent(u.email)}`)}
                              className="text-sm text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-52 block text-left cursor-pointer"
                            >
                              {u.email}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">{fmt(u.sent)}</td>
                          <td className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">{fmt(u.delivered)}</td>
                          <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">{pctStr(u.openRate)}</td>
                          <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{u.bounced}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${
                            bf === "danger" ? "text-red-600 dark:text-red-400" : bf === "warn" ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400"
                          }`}>{pctStr(u.bounceRate)}</td>
                          <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{u.complained}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${
                            cf === "danger" ? "text-red-600 dark:text-red-400" : cf === "warn" ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400"
                          }`}>{pctStr(u.complaintRate)}</td>
                          <td className="px-4 py-3">
                            <FlagBadge flag={flag} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {perUser.length > 10 && !showAllUsers && (
                <div className="px-4 py-3 border-t border-zinc-100 dark:border-white/[0.06] text-center bg-zinc-50/50 dark:bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setShowAllUsers(true)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer"
                  >
                    Show all {perUser.length} users <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Recent Bounce & Complaint Events */}
      <section>
        <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
          Recent Bounce & Complaint Events
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Last 50 problem events in the past {period} days
        </p>

        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
          {problems.length === 0 ? (
            <div className="py-16 text-center px-4">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No bounces or complaints in the last {period} days.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (md:hidden) — Apple Bento Event Rows */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {problems.map((prob, i) => (
                  <div key={`${prob.userEmail}-${prob.createdAt}-${i}`} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <EventTypeBadge type={prob.eventType} />
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {timeAgo(prob.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        Subject: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{prob.subject || "(no subject)"}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-400">Account:</span>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(prob.userEmail)}`)}
                        className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-[200px] cursor-pointer"
                      >
                        {prob.userEmail}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Owner</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Subject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((prob, i) => (
                      <tr
                        key={`${prob.userEmail}-${prob.createdAt}-${i}`}
                        className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <EventTypeBadge type={prob.eventType} />
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {timeAgo(prob.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/users/${encodeURIComponent(prob.userEmail)}`)}
                            className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-36 block text-left cursor-pointer"
                          >
                            {prob.userEmail}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 max-w-52 truncate">
                          {prob.subject}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Sequences with Persistent Failures */}
      <section>
        <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
          Sequences with Persistent Failures
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Leads with <code className="font-mono bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-xs">seqFailCount &gt; 3</code> — sequence engine could not deliver after multiple retries
        </p>

        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
          {failedSequences.length === 0 ? (
            <div className="py-16 text-center px-4">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No sequences with persistent failures.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (md:hidden) — Apple Bento Sequence Failure Rows */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {failedSequences.map((seq, i) => (
                  <div key={`${seq.sequenceId}-${seq.userEmail}-${i}`} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                        {seq.sequenceId || "(no id)"}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        seq.maxFailCount >= 10
                          ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                      }`}>
                        {seq.maxFailCount}× fails
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(seq.userEmail)}`)}
                        className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-[200px] cursor-pointer"
                      >
                        {seq.userEmail}
                      </button>
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {seq.failedLeads} lead{seq.failedLeads !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {seq.lastError && (
                      <div className="p-2 rounded-xl bg-red-50/60 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20 text-[11px] font-mono text-red-600 dark:text-red-400 break-words">
                        {seq.lastError}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Sequence ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Owner</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Failed Leads</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Max Fails</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Last Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedSequences.map((seq, i) => (
                      <tr
                        key={`${seq.sequenceId}-${seq.userEmail}-${i}`}
                        className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {seq.sequenceId || "(no id)"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/users/${encodeURIComponent(seq.userEmail)}`)}
                            className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-40 block text-left cursor-pointer"
                          >
                            {seq.userEmail}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-red-600 dark:text-red-400">{seq.failedLeads}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${seq.maxFailCount >= 10 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {seq.maxFailCount}×
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {seq.lastError ? (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-64 block" title={seq.lastError}>
                              {seq.lastError}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

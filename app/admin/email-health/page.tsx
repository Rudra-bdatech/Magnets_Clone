"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Send, CheckCircle, Eye, MousePointer,
  AlertTriangle, Ban, RefreshCw, AlertCircle,
  Clock, Inbox, ChevronDown,
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
  userEmail: string; recipientEmail: string;
  subject: string; sequenceId: string;
  pageId: string; createdAt: string;
}

interface FailedSequence {
  sequenceId: string; userEmail: string;
  pageId: string; failedLeads: number;
  maxFailCount: number; lastError: string;
  sampleEmails: string[];
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
    good:    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    warn:    "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    danger:  "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  };
  const valueCls = {
    neutral: "text-zinc-900 dark:text-white",
    good:    "text-emerald-600 dark:text-emerald-400",
    warn:    "text-amber-600 dark:text-amber-400",
    danger:  "text-red-600 dark:text-red-400",
  };
  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold ${valueCls[status]}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg[status]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function FlagBadge({ flag }: { flag: "ok" | "warn" | "danger" }) {
  if (flag === "danger") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
      <Ban className="w-3 h-3" /> High Risk
    </span>
  );
  if (flag === "warn") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
      <AlertTriangle className="w-3 h-3" /> Monitor
    </span>
  );
  return null;
}

function EventTypeBadge({ type }: { type: string }) {
  if (type === "bounced") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
      <AlertTriangle className="w-3 h-3" /> Bounced
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
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
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
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

  const { platform: p, perUser, problems, failedSequences, pendingLeads } = data;

  const bounceStatus  = p.bounceRate    === null ? "neutral" : p.bounceRate    >= 10 ? "danger" : p.bounceRate    >= 5 ? "warn" : "good";
  const complaintStatus = p.complaintRate === null ? "neutral" : p.complaintRate >= 0.5 ? "danger" : p.complaintRate >= 0.1 ? "warn" : "good";
  const openStatus    = p.openRate      === null ? "neutral" : p.openRate      >= 30 ? "good"   : p.openRate      >= 15 ? "warn" : "danger";

  const flaggedUsers = perUser.filter((u) => userFlag(u) !== "ok");
  const displayUsers = showAllUsers ? perUser : perUser.slice(0, 10);

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Email Health Monitor</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Delivery problems surfaced before users report them
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => { setPeriod(d); setShowAllUsers(false); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  period === d
                    ? "bg-white dark:bg-[#171717] text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
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
      </div>

      {/* Pending leads alert */}
      {pendingLeads > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">
            <strong>{pendingLeads.toLocaleString()}</strong> leads are stuck in <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">pending_email</code> status — sequences may not be processing correctly.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Sent"       value={fmt(p.sent)}       icon={Send}          sub={`last ${period} days`}                   status="neutral" />
        <KpiCard label="Delivered"  value={fmt(p.delivered)}  icon={CheckCircle}   sub={pctStr(p.deliveryRate) + " rate"}         status={p.deliveryRate === null ? "neutral" : p.deliveryRate >= 95 ? "good" : p.deliveryRate >= 85 ? "warn" : "danger"} />
        <KpiCard label="Opened"     value={fmt(p.opened)}     icon={Eye}           sub={pctStr(p.openRate) + " open rate"}        status={openStatus} />
        <KpiCard label="Clicked"    value={fmt(p.clicked)}    icon={MousePointer}  sub={pctStr(p.clickRate) + " CTR"}             status="neutral" />
        <KpiCard label="Bounced"    value={fmt(p.bounced)}    icon={AlertTriangle} sub={pctStr(p.bounceRate) + " bounce rate"}    status={bounceStatus} />
        <KpiCard label="Complaints" value={fmt(p.complained)} icon={Ban}           sub={pctStr(p.complaintRate) + " complaint"}   status={complaintStatus} />
      </div>

      {/* Bounce/Complaint thresholds legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Bounce &lt;5% · Complaint &lt;0.1% — healthy</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Bounce 5–10% · Complaint 0.1–0.5% — monitor</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Bounce &gt;10% · Complaint &gt;0.5% — high risk</span>
      </div>

      {/* Per-User Delivery Breakdown */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Per-User Delivery Breakdown</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {flaggedUsers.length > 0
                ? `${flaggedUsers.length} user${flaggedUsers.length !== 1 ? "s" : ""} flagged — sorted by bounce rate`
                : "No flagged users — sorted by bounce rate"}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
          {perUser.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No email events in the last {period} days.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">User</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Sent</th>
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
                              onClick={() => router.push(`/admin/users/${encodeURIComponent(u.email)}`)}
                              className="text-sm text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-52 block text-left"
                            >
                              {u.email}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">{fmt(u.sent)}</td>
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
                <div className="px-4 py-3 border-t border-zinc-100 dark:border-white/[0.06] text-center">
                  <button
                    onClick={() => setShowAllUsers(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0066B2] dark:text-[#38BDF8] hover:underline"
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
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Recent Bounce & Complaint Events</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">Last 50 problem events in the past {period} days</p>

        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
          {problems.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No bounces or complaints in the last {period} days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Recipient</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Owner</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((prob, i) => (
                    <tr
                      key={`${prob.recipientEmail}-${prob.createdAt}-${i}`}
                      className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <EventTypeBadge type={prob.eventType} />
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {timeAgo(prob.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-40 truncate">
                        {prob.recipientEmail || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(prob.userEmail)}`)}
                          className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-36 block text-left"
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
          )}
        </div>
      </section>

      {/* Sequences with Persistent Failures */}
      <section>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Sequences with Persistent Failures</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Leads with <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">seqFailCount &gt; 3</code> — sequence engine could not deliver after multiple retries
        </p>

        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
          {failedSequences.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No sequences with persistent failures.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(seq.userEmail)}`)}
                          className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-40 block text-left"
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
          )}
        </div>
      </section>
    </div>
  );
}

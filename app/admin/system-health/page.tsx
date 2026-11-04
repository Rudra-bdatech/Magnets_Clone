"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Clock, Lock, Inbox, Mail, Globe, ShieldCheck,
  AlertCircle, Link2, Zap, Activity, ExternalLink,
  ChevronRight, ArrowRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SequenceCron {
  status: "healthy" | "warn" | "stale" | "unknown";
  lastSentAt: string | null;
  lastSentMinutesAgo: number | null;
  cronLastRunAt: string | null;
  overdueLeads: number;
  staleLockedLeads: number;
  currentlyLockedLeads: number;
  pendingEmailLeads: number;
  activeSequenceLeads: number;
}

interface FailedGroup {
  sequenceId: string;
  userEmail: string;
  pageId: string;
  failedLeads: number;
  maxFailCount: number;
  lastError: string;
}

interface SslDomain {
  email: string;
  customDomain: string;
  customSubdomain: string;
  domainVerified: boolean;
  cnameVerified: boolean;
}

interface SystemHealthData {
  generatedAt: string;
  sequenceCron: SequenceCron;
  failedSequences: { totalAffectedLeads: number; groups: FailedGroup[] };
  linkedinCron: { connectedAccounts: number; campaignUsers: number; hasAccounts: boolean };
  sslHealth: { failedCount: number; pendingVerifiedCount: number; activeCount: number; failedDomains: SslDomain[] };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(d: string | null): string {
  if (!d) return "never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type HealthStatus = "healthy" | "warn" | "danger" | "unknown";

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === "healthy") return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (status === "warn")    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  if (status === "danger")  return <XCircle className="w-5 h-5 text-red-500" />;
  return <AlertCircle className="w-5 h-5 text-zinc-400" />;
}

function StatusBadge({ status, label }: { status: HealthStatus; label?: string }) {
  const styles: Record<HealthStatus, string> = {
    healthy: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30",
    warn:    "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30",
    danger:  "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200/60 dark:border-red-800/30",
    unknown: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/30",
  };
  const labels: Record<HealthStatus, string> = {
    healthy: "Healthy", warn: "Warning", danger: "Critical", unknown: "Unknown",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      {label ?? labels[status]}
    </span>
  );
}

function MetricCard({
  label, value, icon: Icon, status = "neutral", sub,
}: {
  label: string; value: string | number; icon: React.ElementType;
  status?: "neutral" | "good" | "warn" | "danger"; sub?: string;
}) {
  const iconCls = {
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
    <div className="bg-white dark:bg-[#171717] rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
          <div className={`p-2 rounded-xl shrink-0 ${iconCls[status]}`}>
            <Icon className="w-4 h-4" />
          </div>
          {status !== "neutral" && (
            <span className={`inline-block w-2 h-2 rounded-full ${
              status === "danger" ? "bg-red-500 animate-pulse" : status === "warn" ? "bg-amber-500" : "bg-emerald-500"
            }`} />
          )}
        </div>
        <p className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider line-clamp-1">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold tracking-tight mt-0.5 ${valueCls[status]}`}>{value}</p>
      </div>
      {sub && <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-1">{sub}</p>}
    </div>
  );
}

function CronCard({
  title, icon: Icon, status, lastRunLabel, lastRunValue, note, children,
}: {
  title: string; icon: React.ElementType; status: HealthStatus;
  lastRunLabel: string; lastRunValue: string; note?: string;
  children?: React.ReactNode;
}) {
  const borderCls: Record<HealthStatus, string> = {
    healthy: "border-emerald-200/80 dark:border-emerald-800/40",
    warn:    "border-amber-200/80 dark:border-amber-800/40",
    danger:  "border-red-200/80 dark:border-red-800/40",
    unknown: "border-zinc-200/80 dark:border-white/[0.08]",
  };
  return (
    <div className={`bg-white dark:bg-[#171717] rounded-2xl border-2 ${borderCls[status]} p-4 sm:p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="shrink-0">
            <StatusIcon status={status} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">{title}</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {lastRunLabel}: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">{lastRunValue}</strong>
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={status} />
        </div>
      </div>
      {note && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic mb-3 border-t border-zinc-100 dark:border-white/[0.05] pt-2.5 leading-relaxed">{note}</p>
      )}
      {children}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const router = useRouter();
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/system-health", silent ? { cache: "reload" } : {});
      if (!res.ok) throw new Error("Failed to load system health");
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-44 bg-zinc-100 dark:bg-zinc-850 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-850 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { sequenceCron: sc, failedSequences, linkedinCron, sslHealth } = data;

  // Map cron status to HealthStatus
  const seqStatus: HealthStatus = sc.status === "healthy" ? "healthy" : sc.status === "warn" ? "warn" : sc.status === "stale" ? "danger" : "unknown";

  // Overall system health
  const overallDanger = seqStatus === "danger" || sslHealth.failedCount > 0 || sc.pendingEmailLeads > 10 || failedSequences.totalAffectedLeads > 5;
  const overallWarn   = seqStatus === "warn" || sc.overdueLeads > 5 || sc.staleLockedLeads > 0;
  const overallStatus: HealthStatus = overallDanger ? "danger" : overallWarn ? "warn" : seqStatus === "healthy" ? "healthy" : "unknown";

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-zinc-100 dark:bg-white/[0.06] shrink-0 mt-0.5 sm:mt-0">
            <StatusIcon status={overallStatus} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                System / Cron Health
              </h1>
              <StatusBadge status={overallStatus} label={
                overallStatus === "healthy" ? "All systems normal"
                : overallStatus === "warn"  ? "Issues detected"
                : overallStatus === "danger" ? "Action required"
                : "Checking…"
              } />
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Generated {timeAgo(data.generatedAt)} ({formatDate(data.generatedAt)})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* ── Section 1: Cron Status ── */}
      <section>
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-3 sm:mb-4">Cron Job Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Sequence Drip Cron */}
          <CronCard
            title="Sequence Drip Processor"
            icon={Mail}
            status={seqStatus}
            lastRunLabel="Last run"
            lastRunValue={timeAgo(sc.cronLastRunAt)}
          >
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.04] mt-2">
              {[
                { label: "Active sequence leads",    value: sc.activeSequenceLeads,   warn: false },
                { label: "Leads currently locked",   value: sc.currentlyLockedLeads,  warn: false },
                { label: "Overdue leads (past due)", value: sc.overdueLeads,          warn: sc.overdueLeads > 5 },
                { label: "Stale locks (cron crash)", value: sc.staleLockedLeads,      warn: sc.staleLockedLeads > 0, danger: true },
                { label: "Stuck in pending_email",   value: sc.pendingEmailLeads,     warn: sc.pendingEmailLeads > 0, danger: sc.pendingEmailLeads > 10 },
              ].map(({ label, value, warn, danger }) => (
                <div key={label} className="flex items-center justify-between text-xs sm:text-sm py-2">
                  <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                  <span className={`font-semibold tabular-nums ${
                    danger && value > 0 ? "text-red-600 dark:text-red-400"
                    : warn  && value > 0 ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-900 dark:text-white"
                  }`}>
                    {value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CronCard>

          {/* LinkedIn Cron */}
          <CronCard
            title="LinkedIn Sync Cron"
            icon={Link2}
            status={linkedinCron.hasAccounts ? "unknown" : "healthy"}
            lastRunLabel="Connected accounts"
            lastRunValue={linkedinCron.connectedAccounts.toString()}
            note="LinkedIn cron run time is not stored in the database. Health is shown as the count of accounts the cron would process on next run."
          >
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.04] mt-2">
              <div className="flex items-center justify-between text-xs sm:text-sm py-2">
                <span className="text-zinc-500 dark:text-zinc-400">LinkedIn accounts connected</span>
                <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">{linkedinCron.connectedAccounts}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm py-2">
                <span className="text-zinc-500 dark:text-zinc-400">Users with active post campaigns</span>
                <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">{linkedinCron.campaignUsers}</span>
              </div>
              {linkedinCron.connectedAccounts === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-2">No LinkedIn accounts connected — cron will no-op.</p>
              )}
            </div>
          </CronCard>

        </div>
      </section>

      {/* ── Section 2: Lead Queue Health ── */}
      <section>
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-3 sm:mb-4">Lead Queue Health</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Active in sequence"
            value={sc.activeSequenceLeads.toLocaleString()}
            icon={Activity}
            status="neutral"
            sub="In-progress, not stopped"
          />
          <MetricCard
            label="Overdue (past due)"
            value={sc.overdueLeads.toLocaleString()}
            icon={Clock}
            status={sc.overdueLeads > 20 ? "danger" : sc.overdueLeads > 5 ? "warn" : "good"}
            sub="Cron should pick these up"
          />
          <MetricCard
            label="Stale locks"
            value={sc.staleLockedLeads.toLocaleString()}
            icon={Lock}
            status={sc.staleLockedLeads > 0 ? "danger" : "good"}
            sub="Past seqLockUntil"
          />
          <MetricCard
            label="Pending email"
            value={sc.pendingEmailLeads.toLocaleString()}
            icon={Inbox}
            status={sc.pendingEmailLeads > 10 ? "danger" : sc.pendingEmailLeads > 0 ? "warn" : "good"}
            sub="Stuck in queue"
          />
        </div>
      </section>

      {/* ── Section 3: Sequences with Persistent Failures ── */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Sequences with Persistent Failures</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Leads with <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">seqFailCount &gt; 3</code>
              {failedSequences.totalAffectedLeads > 0 && (
                <> — <span className="font-semibold text-red-500">{failedSequences.totalAffectedLeads} leads affected</span></>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#171717] rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] overflow-hidden shadow-sm">
          {failedSequences.groups.length === 0 ? (
            <div className="py-12 sm:py-14 text-center px-4">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">All sequences healthy</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">No sequences with persistent delivery failures detected.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Sequence</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Owner</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Failed Leads</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Max Retries</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Last Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedSequences.groups.map((g, i) => (
                      <tr
                        key={`${g.sequenceId}-${g.userEmail}-${i}`}
                        className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] last:border-b-0 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded">
                            {g.sequenceId || "(no id)"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/admin/users/${encodeURIComponent(g.userEmail)}`)}
                            className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-44 block text-left"
                          >
                            {g.userEmail}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{g.failedLeads}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${g.maxFailCount >= 8 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {g.maxFailCount}×
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {g.lastError ? (
                            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-72 block" title={g.lastError}>
                              {g.lastError}
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

              {/* Mobile Apple Bento Cards */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {failedSequences.groups.map((g, i) => (
                  <div key={`${g.sequenceId}-${g.userEmail}-${i}`} className="p-3.5 space-y-2.5">
                    {/* Top Row: Sequence ID & Failed Count Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-lg border border-zinc-200/60 dark:border-white/[0.06] truncate max-w-[190px]">
                        {g.sequenceId || "(no id)"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200/60 dark:border-red-800/30">
                          {g.failedLeads} failed
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          g.maxFailCount >= 8
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        }`}>
                          {g.maxFailCount}× retries
                        </span>
                      </div>
                    </div>

                    {/* Owner row */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-zinc-400 dark:text-zinc-500">Owner</span>
                      <button
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(g.userEmail)}`)}
                        className="inline-flex items-center gap-1 text-[#0066B2] dark:text-[#38BDF8] hover:underline font-medium text-left truncate max-w-[210px]"
                      >
                        <span className="truncate">{g.userEmail}</span>
                        <ArrowRight className="w-3 h-3 shrink-0 opacity-60" />
                      </button>
                    </div>

                    {/* Last Error Box */}
                    {g.lastError && (
                      <div className="p-2.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 mb-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Last Error</span>
                        </div>
                        <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 break-words leading-relaxed line-clamp-3">
                          {g.lastError}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 4: SSL / Domain Health ── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Custom Domain SSL Health</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Domains where certificate issuance failed</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30">
              <ShieldCheck className="w-3.5 h-3.5" /> {sslHealth.activeCount} SSL active
            </span>
            {sslHealth.pendingVerifiedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30">
                <Clock className="w-3.5 h-3.5" /> {sslHealth.pendingVerifiedCount} pending
              </span>
            )}
            {sslHealth.failedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/30">
                <XCircle className="w-3.5 h-3.5" /> {sslHealth.failedCount} SSL failed
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#171717] rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] overflow-hidden shadow-sm">
          {sslHealth.failedDomains.length === 0 ? (
            <div className="py-12 sm:py-14 text-center px-4">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">All certificates active</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">No SSL failures — all verified domains have active certificates.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Domain</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Owner</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">DNS Verified</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">SSL Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sslHealth.failedDomains.map((d, i) => (
                      <tr
                        key={`${d.customDomain}-${i}`}
                        className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] last:border-b-0 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                              {d.customSubdomain}.{d.customDomain}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/admin/users/${encodeURIComponent(d.email)}`)}
                            className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-44 block text-left"
                          >
                            {d.email}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {d.domainVerified && d.cnameVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> DNS OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> DNS pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200/60 dark:border-red-800/30">
                            <XCircle className="w-3 h-3" /> SSL Failed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Apple Bento Cards */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {sslHealth.failedDomains.map((d, i) => (
                  <div key={`${d.customDomain}-${i}`} className="p-3.5 space-y-2.5">
                    {/* Domain & SSL badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] shrink-0">
                          <Globe className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {d.customSubdomain}.{d.customDomain}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200/60 dark:border-red-800/30 shrink-0">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    </div>

                    {/* Owner & DNS Status */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-zinc-400 dark:text-zinc-500">Owner</span>
                      <button
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(d.email)}`)}
                        className="inline-flex items-center gap-1 text-[#0066B2] dark:text-[#38BDF8] hover:underline font-medium text-left truncate max-w-[210px]"
                      >
                        <span className="truncate">{d.email}</span>
                        <ArrowRight className="w-3 h-3 shrink-0 opacity-60" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 dark:text-zinc-500">DNS Verification</span>
                      {d.domainVerified && d.cnameVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> DNS OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> DNS pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {sslHealth.pendingVerifiedCount > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>{sslHealth.pendingVerifiedCount} domain{sslHealth.pendingVerifiedCount !== 1 ? "s have" : " has"}</strong> verified DNS but SSL is still pending — may need manual certificate re-issuance.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}

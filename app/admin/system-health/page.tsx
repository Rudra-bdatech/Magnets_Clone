"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Clock, Lock, Inbox, Mail, Globe, ShieldCheck,
  AlertCircle, Link2, Zap, Activity,
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
    healthy: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    warn:    "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    danger:  "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    unknown: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
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
    <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg shrink-0 ${iconCls[status]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide leading-tight">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueCls[status]}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>}
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
    healthy: "border-emerald-200 dark:border-emerald-800/40",
    warn:    "border-amber-200 dark:border-amber-800/40",
    danger:  "border-red-200 dark:border-red-800/40",
    unknown: "border-zinc-200 dark:border-white/[0.08]",
  };
  return (
    <div className={`bg-white dark:bg-[#171717] rounded-xl border-2 ${borderCls[status]} p-5`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <StatusIcon status={status} />
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{lastRunLabel}: <strong className="text-zinc-700 dark:text-zinc-300">{lastRunValue}</strong></p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      {note && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic mb-3 border-t border-zinc-100 dark:border-white/[0.05] pt-3">{note}</p>
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
      const res = await fetch("/api/admin/system-health");
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
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
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

  const { sequenceCron: sc, failedSequences, linkedinCron, sslHealth } = data;

  // Map cron status to HealthStatus
  const seqStatus: HealthStatus = sc.status === "healthy" ? "healthy" : sc.status === "warn" ? "warn" : sc.status === "stale" ? "danger" : "unknown";

  // Overall system health
  const overallDanger = seqStatus === "danger" || sslHealth.failedCount > 0 || sc.pendingEmailLeads > 10 || failedSequences.totalAffectedLeads > 5;
  const overallWarn   = seqStatus === "warn" || sc.overdueLeads > 5 || sc.staleLockedLeads > 0;
  const overallStatus: HealthStatus = overallDanger ? "danger" : overallWarn ? "warn" : seqStatus === "healthy" ? "healthy" : "unknown";

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <StatusIcon status={overallStatus} />
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">System / Cron Health</h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Generated at {formatDate(data.generatedAt)}
            </p>
          </div>
          <StatusBadge status={overallStatus} label={
            overallStatus === "healthy" ? "All systems normal"
            : overallStatus === "warn"  ? "Issues detected"
            : overallStatus === "danger" ? "Action required"
            : "Checking…"
          } />
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

      {/* ── Section 1: Cron Status ── */}
      <section>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Cron Job Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Sequence Drip Cron */}
          <CronCard
            title="Sequence Drip Processor"
            icon={Mail}
            status={seqStatus}
            lastRunLabel="Last run"
            lastRunValue={timeAgo(sc.cronLastRunAt)}
          >
            <div className="space-y-2 mt-2">
              {[
                { label: "Active sequence leads",    value: sc.activeSequenceLeads,   warn: false },
                { label: "Leads currently locked",   value: sc.currentlyLockedLeads,  warn: false },
                { label: "Overdue leads (past due)", value: sc.overdueLeads,          warn: sc.overdueLeads > 5 },
                { label: "Stale locks (cron crash)", value: sc.staleLockedLeads,      warn: sc.staleLockedLeads > 0, danger: true },
                { label: "Stuck in pending_email",   value: sc.pendingEmailLeads,     warn: sc.pendingEmailLeads > 0, danger: sc.pendingEmailLeads > 10 },
              ].map(({ label, value, warn, danger }) => (
                <div key={label} className="flex items-center justify-between text-sm">
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
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">LinkedIn accounts connected</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{linkedinCron.connectedAccounts}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Users with active post campaigns</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{linkedinCron.campaignUsers}</span>
              </div>
              {linkedinCron.connectedAccounts === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-1">No LinkedIn accounts connected — cron will no-op.</p>
              )}
            </div>
          </CronCard>

        </div>
      </section>

      {/* ── Section 2: Lead Queue Health ── */}
      <section>
        <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">Lead Queue Health</h2>
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
            sub="Past seqLockUntil — cron crash indicator"
          />
          <MetricCard
            label="Pending email"
            value={sc.pendingEmailLeads.toLocaleString()}
            icon={Inbox}
            status={sc.pendingEmailLeads > 10 ? "danger" : sc.pendingEmailLeads > 0 ? "warn" : "good"}
            sub="Stuck in delivery queue"
          />
        </div>
      </section>

      {/* ── Section 3: Sequences with Persistent Failures ── */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Sequences with Persistent Failures</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Leads with <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">seqFailCount &gt; 3</code>
              {failedSequences.totalAffectedLeads > 0 && (
                <> — <span className="font-semibold text-red-500">{failedSequences.totalAffectedLeads} leads affected total</span></>
              )}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
          {failedSequences.groups.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No sequences with persistent delivery failures.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
          )}
        </div>
      </section>

      {/* ── Section 4: SSL / Domain Health ── */}
      <section>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Custom Domain SSL Health</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Domains where certificate issuance failed</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> {sslHealth.activeCount} SSL active
            </span>
            {sslHealth.pendingVerifiedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" /> {sslHealth.pendingVerifiedCount} pending cert
              </span>
            )}
            {sslHealth.failedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs font-semibold text-red-600 dark:text-red-400">
                <XCircle className="w-3.5 h-3.5" /> {sslHealth.failedCount} SSL failed
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
          {sslHealth.failedDomains.length === 0 ? (
            <div className="py-14 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No SSL failures — all verified domains have active certificates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                          <XCircle className="w-3 h-3" /> SSL Failed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sslHealth.pendingVerifiedCount > 0 && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {sslHealth.pendingVerifiedCount} domain{sslHealth.pendingVerifiedCount !== 1 ? "s" : ""} have verified DNS but SSL is still pending — may need manual certificate re-issuance.
          </p>
        )}
      </section>

    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Shield, RefreshCw,
  ChevronDown, X, Check, ArrowRight, CreditCard,
  PauseCircle, PlayCircle, Trash2, AlertTriangle,
  CheckCircle2, UserX, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuditEntry {
  id: string;
  adminEmail: string;
  adminRole: string;
  action:
    | "plan_change"
    | "role_change"
    | "funnel_pause"
    | "funnel_restore"
    | "funnel_delete"
    | "account_suspend"
    | "account_unsuspend"
    | "account_delete";
  targetEmail: string;
  targetName: string;
  before: Record<string, string>;
  after: Record<string, string>;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  plan_change: "Plan Change",
  role_change: "Role Change",
  funnel_pause: "Funnel Paused",
  funnel_restore: "Funnel Restored",
  funnel_delete: "Funnel Deleted",
  account_suspend: "Account Suspended",
  account_unsuspend: "Account Restored",
  account_delete: "Account Deleted",
};

const ACTION_COLORS: Record<string, string> = {
  plan_change: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20 dark:border-[#38BDF8]/30",
  role_change: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30",
  funnel_pause: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30",
  funnel_restore: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30",
  funnel_delete: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-200/60 dark:border-red-800/30",
  account_suspend: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30",
  account_unsuspend: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30",
  account_delete: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-200/60 dark:border-red-800/30",
};

const ACTION_OPTIONS = [
  { value: "plan_change", label: "Plan Change" },
  { value: "role_change", label: "Role Change" },
  { value: "funnel_pause", label: "Funnel Paused" },
  { value: "funnel_restore", label: "Funnel Restored" },
  { value: "funnel_delete", label: "Funnel Deleted" },
  { value: "account_suspend", label: "Account Suspended" },
  { value: "account_unsuspend", label: "Account Restored" },
  { value: "account_delete", label: "Account Deleted" },
];

function getActionIcon(action: string) {
  switch (action) {
    case "plan_change":
      return <CreditCard className="w-3 h-3 shrink-0" />;
    case "role_change":
      return <Shield className="w-3 h-3 shrink-0" />;
    case "funnel_pause":
      return <PauseCircle className="w-3 h-3 shrink-0" />;
    case "funnel_restore":
      return <PlayCircle className="w-3 h-3 shrink-0" />;
    case "funnel_delete":
      return <Trash2 className="w-3 h-3 shrink-0" />;
    case "account_suspend":
      return <AlertTriangle className="w-3 h-3 shrink-0" />;
    case "account_unsuspend":
      return <CheckCircle2 className="w-3 h-3 shrink-0" />;
    case "account_delete":
      return <UserX className="w-3 h-3 shrink-0" />;
    default:
      return <Activity className="w-3 h-3 shrink-0" />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent | TouchEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/** Apple-style responsive Filter Select with mobile iOS Bottom Action Sheet */
function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const activeOption = options.find((o) => o.value === value);
  const label = activeOption ? activeOption.label : placeholder;

  return (
    <div ref={ref} className="relative shrink-0 w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full sm:w-auto flex h-9 sm:h-9.5 items-center justify-between gap-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] px-3 sm:px-3.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer select-none active:scale-[0.98]"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile Sheet Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setOpen(false)}
              className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Mobile Bottom Sheet (< sm) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="sm:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white dark:bg-[#1C1C1F] border-t border-zinc-200 dark:border-white/10 p-4 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-white/[0.08] px-1">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  Filter by Action
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                    !value
                      ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{placeholder}</span>
                  {!value && <Check className="w-4 h-4 shrink-0" />}
                </button>
                {options.map((opt) => {
                  const active = value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Desktop Anchored Popover (sm:) */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="hidden sm:block absolute left-0 top-full mt-1.5 w-56 z-50 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-white/10 p-1.5 shadow-xl"
            >
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  !value
                    ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                }`}
              >
                <span>{placeholder}</span>
                {!value && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
              {options.map((opt) => {
                const active = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuditLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(actionFilter && { action: actionFilter }),
      });
      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, refreshKey]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-[#0066B2]/10 dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] shrink-0 mt-0.5 sm:mt-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Audit Log
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/30">
                {total > 0 ? `${total} entries` : "0 entries"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Immutable record of all administrative events and security actions
            </p>
          </div>
        </div>

        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <FilterSelect
          value={actionFilter}
          placeholder="All Actions"
          options={ACTION_OPTIONS}
          onChange={(val) => {
            setActionFilter(val);
            setPage(1);
          }}
        />
      </div>

      {/* Audit Log Entries Container */}
      <div className="bg-white dark:bg-[#171717] border border-zinc-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 sm:p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-850 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 sm:py-20 text-center px-4">
            <Shield className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No audit entries found</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Administrative actions like plan and role changes will automatically appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop List (md:block) */}
            <div className="hidden md:block divide-y divide-zinc-100 dark:divide-white/[0.04]">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                  {/* Action badge */}
                  <div className="pt-0.5 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.action] || "bg-zinc-100 text-zinc-600"}`}>
                      {getActionIcon(entry.action)}
                      <span>{ACTION_LABELS[entry.action] || entry.action}</span>
                    </span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{entry.adminEmail}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">changed</span>
                      <button
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(entry.targetEmail)}`)}
                        className="text-sm font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-56 text-left cursor-pointer"
                      >
                        {entry.targetName || entry.targetEmail}
                      </button>
                    </div>

                    {entry.before && Object.keys(entry.before).length > 0 && (
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                        {Object.keys(entry.before).map((key) => (
                          <span key={key} className="flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.03] px-2 py-0.5 rounded-md border border-zinc-100 dark:border-white/[0.05]">
                            <span className="text-[11px] text-zinc-400 uppercase font-medium">{key}:</span>
                            <span className="px-1.5 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded font-mono text-[11px] line-through">
                              {entry.before[key]}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-600">→</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-mono text-[11px] font-semibold">
                              {entry.after[key]}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 pt-0.5 tabular-nums" title={new Date(entry.createdAt).toLocaleString()}>
                    {timeAgo(entry.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Apple Bento Cards (< md) */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {entries.map((entry) => (
                <div key={entry.id} className="p-3.5 sm:p-4 space-y-2.5">
                  {/* Top row: Action Badge + Time Ago */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[entry.action] || "bg-zinc-100 text-zinc-600"}`}>
                      {getActionIcon(entry.action)}
                      <span>{ACTION_LABELS[entry.action] || entry.action}</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0 tabular-nums" title={new Date(entry.createdAt).toLocaleString()}>
                      {timeAgo(entry.createdAt)}
                    </span>
                  </div>

                  {/* Actor & Target Row */}
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Performed by</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[210px] text-right">{entry.adminEmail}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Target user</span>
                      <button
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(entry.targetEmail)}`)}
                        className="inline-flex items-center gap-1 text-[#0066B2] dark:text-[#38BDF8] hover:underline font-semibold truncate max-w-[210px] text-right cursor-pointer"
                      >
                        <span className="truncate">{entry.targetName || entry.targetEmail}</span>
                        <ArrowRight className="w-3 h-3 shrink-0 opacity-60" />
                      </button>
                    </div>
                  </div>

                  {/* Changes Diff Box */}
                  {entry.before && Object.keys(entry.before).length > 0 && (
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06] space-y-1.5">
                      {Object.keys(entry.before).map((key) => (
                        <div key={key} className="flex items-center gap-1.5 flex-wrap text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400 font-medium capitalize text-[11px]">{key}:</span>
                          <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-mono text-[11px] border border-red-200/50 dark:border-red-900/30 line-through">
                            {entry.before[key] || "none"}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600 text-xs">→</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] border border-emerald-200/50 dark:border-emerald-900/30 font-semibold">
                            {entry.after[key] || "none"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && total > 50 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02]">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Page {page} of {pages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

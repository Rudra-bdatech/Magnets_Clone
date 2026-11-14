"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Shield, RefreshCw,
  ChevronDown, X, Check, ArrowRight, CreditCard,
  PauseCircle, PlayCircle, Trash2, AlertTriangle,
  CheckCircle2, UserX, Activity, Calendar, Search,
  ShieldAlert, AlertOctagon, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ApplePagination } from "@/components/ui/ApplePagination";

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
    | "account_delete"
    | "audit_logs_purged"
    | "trial_extend"
    | "trial_end";
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
  audit_logs_purged: "Audit Logs Purged",
  trial_extend: "Trial Extended",
  trial_end: "Trial Ended",
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
  audit_logs_purged: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/30",
  trial_extend: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20 dark:border-[#38BDF8]/30",
  trial_end: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-200/60 dark:border-red-800/30",
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
  { value: "audit_logs_purged", label: "Audit Logs Purged" },
  { value: "trial_extend", label: "Trial Extended" },
  { value: "trial_end", label: "Trial Ended" },
];

const DATE_PRESETS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
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
    case "audit_logs_purged":
      return <ShieldAlert className="w-3 h-3 shrink-0" />;
    case "trial_extend":
    case "trial_end":
      return <CreditCard className="w-3 h-3 shrink-0" />;
    default:
      return <Activity className="w-3 h-3 shrink-0" />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
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
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  const activeOption = options.find((o) => o.value === value);
  const label = activeOption ? activeOption.label : placeholder;
  const isFiltered = Boolean(value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex h-9 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer select-none active:scale-[0.98] ${
          isFiltered
            ? "border-[#0066B2]/40 bg-[#0066B2]/10 text-[#0066B2] dark:border-[#38BDF8]/40 dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
            : "border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
        }`}
      >
        <span className="truncate">{label}</span>
        {isFiltered ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 shrink-0"
            title="Clear action filter"
          >
            <X className="w-3 h-3 text-current" />
          </span>
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {/* Desktop Anchored Popover (sm:) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="hidden sm:block absolute left-0 top-full mt-1.5 w-60 z-50 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-white/10 p-1.5 shadow-xl"
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
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet (< sm) Portaled to Body */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <div className="sm:hidden fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative z-10 w-full rounded-t-3xl border-t border-zinc-200 bg-white p-4 pb-8 shadow-2xl dark:border-white/10 dark:bg-[#1C1C1F] max-h-[80vh] overflow-y-auto"
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
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

/** Apple-style responsive Date Filter with Presets and Custom Range */
function DateRangeFilter({
  dateRange,
  startDate,
  endDate,
  onChange,
}: {
  dateRange: string;
  startDate: string;
  endDate: string;
  onChange: (range: string, start?: string, end?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate, open]);

  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  // Compute button label
  let displayLabel = "All Time";
  if (dateRange === "today") displayLabel = "Today";
  else if (dateRange === "7d") displayLabel = "Last 7 Days";
  else if (dateRange === "30d") displayLabel = "Last 30 Days";
  else if (dateRange === "90d") displayLabel = "Last 90 Days";
  else if (dateRange === "custom" && (startDate || endDate)) {
    const s = startDate ? new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    const e = endDate ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    displayLabel = s && e ? `${s} – ${e}` : s ? `From ${s}` : `Until ${e}`;
  }

  const isFiltered = Boolean(dateRange);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={isFiltered ? `Date: ${displayLabel}` : "Filter by date"}
        className={`w-full flex h-9 items-center justify-between gap-1.5 rounded-xl border px-3 text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer select-none shrink-0 active:scale-[0.98] ${
          isFiltered
            ? "border-[#0066B2]/40 bg-[#0066B2]/10 text-[#0066B2] dark:border-[#38BDF8]/40 dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
            : "border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>
        {isFiltered ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("", "", "");
              setOpen(false);
            }}
            className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 shrink-0"
            title="Clear date filter"
          >
            <X className="w-3 h-3 text-current" />
          </span>
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Desktop Anchored Popover (sm:) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", damping: 28, stiffness: 400 }}
            style={{ transformOrigin: "top right" }}
            className="hidden sm:block absolute right-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95"
          >
            {/* Quick Presets */}
            <div className="space-y-0.5">
              {DATE_PRESETS.map((preset) => {
                const active = dateRange === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      onChange(preset.value, "", "");
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Section */}
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-white/[0.08]">
              <div className="px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Custom Range
              </div>

              <div className="space-y-2 px-1">
                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-0.5 font-medium">
                    From
                  </label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-0.5 font-medium">
                    To
                  </label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!tempStart && !tempEnd}
                    onClick={() => {
                      if (!tempStart && !tempEnd) return;
                      onChange("custom", tempStart, tempEnd);
                      setOpen(false);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#0066B2] text-white text-xs font-semibold hover:bg-[#005596] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Apply Range
                  </button>
                  {dateRange === "custom" && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange("", "", "");
                        setOpen(false);
                      }}
                      className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet (< sm) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <div className="sm:hidden fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative z-10 w-full rounded-t-3xl border-t border-zinc-200 bg-white p-4 pb-8 shadow-2xl dark:border-white/10 dark:bg-[#1C1C1F] max-h-[85vh] overflow-y-auto"
              >
                <div className="w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-white/[0.08]">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Filter by Date
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
                  {DATE_PRESETS.map((preset) => {
                    const active = dateRange === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          onChange(preset.value, "", "");
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                          active
                            ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                        }`}
                      >
                        <span>{preset.label}</span>
                        {active && <Check className="w-4 h-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Custom Date */}
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/[0.08] space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Custom Date Range
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">
                        From
                      </label>
                      <input
                        type="date"
                        value={tempStart}
                        onChange={(e) => setTempStart(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">
                        To
                      </label>
                      <input
                        type="date"
                        value={tempEnd}
                        onChange={(e) => setTempEnd(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!tempStart && !tempEnd}
                      onClick={() => {
                        if (!tempStart && !tempEnd) return;
                        onChange("custom", tempStart, tempEnd);
                        setOpen(false);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#0066B2] text-white text-xs font-semibold hover:bg-[#005596] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Apply Range
                    </button>
                    {dateRange === "custom" && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange("", "", "");
                          setOpen(false);
                        }}
                        className="py-2 px-3 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

/** Controlled Super Admin Purge Confirmation Modal */
function PurgeLogsModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedCount: number) => void;
}) {
  const [mode, setMode] = useState<"30d" | "7d" | "90d" | "all">("30d");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConfirmPhrase("");
      setError("");
      setMode("30d");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const isConfirmed = confirmPhrase.trim().toUpperCase() === "CLEAR AUDIT LOGS";

  const handlePurge = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError("");

    try {
      const payload: { mode: "older_than" | "all"; days?: number; confirmPhrase: string } = {
        mode: mode === "all" ? "all" : "older_than",
        confirmPhrase: "CLEAR AUDIT LOGS",
      };

      if (mode !== "all") {
        payload.days = mode === "7d" ? 7 : mode === "30d" ? 30 : 90;
      }

      const res = await fetch("/api/admin/audit-log", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to purge audit logs.");
      }

      onSuccess(data.deletedCount);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] shadow-2xl p-5 sm:p-7 overflow-hidden"
      >
        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 shrink-0">
            <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              Purge Audit Records
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Controlled Super Admin data cleanup
            </p>
          </div>
        </div>

        {/* Notice description */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-4 sm:mb-5">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Compliance Notice
          </p>
          Audit logs provide essential security tracking. Purged records cannot be restored. However, an immutable record of this purge itself will be logged.
        </div>

        {/* Mode Selector */}
        <div className="space-y-2 mb-4 sm:mb-5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
            Select Purge Timeframe
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: "30d", title: "Older than 30 days", desc: "Recommended. Keeps recent history." },
              { id: "7d", title: "Older than 7 days", desc: "Keeps only the past week." },
              { id: "90d", title: "Older than 90 days", desc: "Purges older quarterly archives." },
              { id: "all", title: "Clear All Logs", desc: "Purges all existing records." },
            ].map((opt) => {
              const active = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id as any)}
                  className={`flex flex-col text-left p-2.5 sm:p-3 rounded-xl border transition cursor-pointer ${
                    active
                      ? opt.id === "all"
                        ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
                        : "border-[#0066B2]/40 bg-[#0066B2]/10 text-[#0066B2] dark:border-[#38BDF8]/40 dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                      : "border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="text-xs font-bold">{opt.title}</span>
                  <span className="text-[11px] opacity-75 mt-0.5">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirmation phrase input */}
        <div className="space-y-2 mb-5 sm:mb-6">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
            To proceed, type <span className="font-mono font-bold text-red-600 dark:text-red-400">CLEAR AUDIT LOGS</span> below:
          </label>
          <input
            type="text"
            value={confirmPhrase}
            onChange={(e) => setConfirmPhrase(e.target.value)}
            placeholder="CLEAR AUDIT LOGS"
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white font-mono placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePurge}
            disabled={!isConfirmed || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm & Purge</span>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default function AuditLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto-dismiss notification after 5s
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(actionFilter && { action: actionFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(dateRange && { dateRange }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
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
  }, [page, actionFilter, debouncedSearch, dateRange, startDate, endDate, refreshKey]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDateChange = (range: string, start = "", end = "") => {
    setDateRange(range);
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const handleResetFilters = () => {
    setActionFilter("");
    setSearch("");
    setDebouncedSearch("");
    setDateRange("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(actionFilter || debouncedSearch || dateRange || startDate || endDate);

  return (
    <div className="p-3.5 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-3 sm:space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-[#0066B2]/10 dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] shrink-0 mt-0.5 sm:mt-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                Audit Log
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/30">
                {total > 0 ? `${total} entries` : "0 entries"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Immutable record of administrative events & security actions
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh logs"
            className="h-9 w-9 sm:w-auto sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all shadow-xs cursor-pointer select-none"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 ${loading ? "animate-spin text-[#0066B2] dark:text-[#38BDF8]" : ""}`} />
            <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Refresh</span>
          </button>

          {/* Purge Logs Button */}
          <button
            type="button"
            onClick={() => setShowPurgeModal(true)}
            title="Purge logs"
            className="h-9 w-9 sm:w-auto sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200/80 dark:hover:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-500/10 active:scale-95 transition-all shadow-xs cursor-pointer select-none"
          >
            <Trash2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 shrink-0" />
            <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Purge Logs</span>
          </button>
        </div>
      </div>

      {/* Notification Toast Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center justify-between gap-3 p-3 rounded-2xl border text-xs sm:text-sm font-medium shadow-sm ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20"
                : "bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Search Bar — 2 Compact Rows on Mobile, 1 Row on Desktop */}
      <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin or user email..."
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/40 shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns row: Side-by-side on mobile, inline on desktop */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-44 min-w-0">
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

          <div className="flex-1 sm:w-44 min-w-0">
            <DateRangeFilter
              dateRange={dateRange}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
          </div>

          {/* Reset Filters Icon Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="h-9 w-9 sm:w-auto sm:px-2.5 flex items-center justify-center gap-1 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer select-none active:scale-95 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Entries Container */}
      <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
        {loading ? (
          <div className="p-3.5 sm:p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-850 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-14 sm:py-20 text-center px-4">
            <Shield className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {hasActiveFilters ? "No matching audit entries found" : "No audit entries found"}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try adjusting or clearing your date, action, or search filters."
                : "Administrative actions like plan and role changes will automatically appear here."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/15 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
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
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {entry.action === "audit_logs_purged" ? "executed" : "changed"}
                      </span>
                      {entry.action === "audit_logs_purged" ? (
                        <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 truncate max-w-72">
                          {entry.targetName || "Purge Log Cleanup"}
                        </span>
                      ) : (
                        <button
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(entry.targetEmail)}`)}
                          className="text-sm font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-56 text-left cursor-pointer"
                        >
                          {entry.targetName || entry.targetEmail}
                        </button>
                      )}
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
                              {entry.after?.[key] || "—"}
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
                <div key={entry.id} className="p-3.5 space-y-2.5">
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
                      <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                        {entry.action === "audit_logs_purged" ? "Details" : "Target user"}
                      </span>
                      {entry.action === "audit_logs_purged" ? (
                        <span className="font-medium text-rose-600 dark:text-rose-400 truncate max-w-[210px] text-right">
                          {entry.targetName || "Purged logs"}
                        </span>
                      ) : (
                        <button
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(entry.targetEmail)}`)}
                          className="inline-flex items-center gap-1 text-[#0066B2] dark:text-[#38BDF8] hover:underline font-semibold truncate max-w-[210px] text-right cursor-pointer"
                        >
                          <span className="truncate">{entry.targetName || entry.targetEmail}</span>
                          <ArrowRight className="w-3 h-3 shrink-0 opacity-60" />
                        </button>
                      )}
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
                            {entry.after?.[key] || "none"}
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
          <ApplePagination
            currentPage={page}
            totalPages={pages}
            totalItems={total}
            pageSize={50}
            onPageChange={(p) => setPage(p)}
            itemLabel="log"
            itemLabelPlural="logs"
            className="rounded-t-none rounded-b-2xl border-t border-b-0 border-x-0 bg-zinc-50/60 dark:bg-white/[0.02]"
          />
        )}
      </div>

      {/* Super Admin Purge Confirmation Modal */}
      <PurgeLogsModal
        isOpen={showPurgeModal}
        onClose={() => setShowPurgeModal(false)}
        onSuccess={(count) => {
          setNotification({
            type: "success",
            message: `Successfully purged ${count} audit log ${count === 1 ? "entry" : "entries"}. A record of this action was logged.`,
          });
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}

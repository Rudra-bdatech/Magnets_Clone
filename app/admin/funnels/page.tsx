"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw,
  Eye, Users, Zap, FileText, HelpCircle, Layers,
  PauseCircle, PlayCircle, Trash2, ArrowRight, ExternalLink,
  ChevronDown, Check, X, Mail, Calendar, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Funnel {
  id: string;
  userEmail: string;
  name: string;
  slug: string;
  status: "draft" | "live" | "paused";
  views: number;
  signups: number;
  conversionRate: number;
  template: string;
  createdAt: string;
  publishedAt: string | null;
  isQuiz: boolean;
  isLockedPdf: boolean;
  hasVariantB: boolean;
  testStarted: boolean;
}

const STATUS_STYLES = {
  live: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/10",
};

const STATUS_LABELS = { live: "Live", paused: "Paused", draft: "Draft" };

function funnelTypeLabel(f: Funnel) {
  if (f.isQuiz) return "Quiz";
  if (f.isLockedPdf) return "Locked PDF";
  if (f.template) {
    const t = f.template.toLowerCase();
    if (t === "classic") return "Classic";
    if (t === "video") return "Video";
    return f.template.charAt(0).toUpperCase() + f.template.slice(1);
  }
  return "Classic";
}

function funnelTypeIcon(f: Funnel) {
  if (f.isQuiz) return HelpCircle;
  if (f.isLockedPdf) return FileText;
  return Layers;
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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
    <div ref={ref} className="relative shrink-0 w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex h-9 items-center justify-between gap-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer select-none active:scale-[0.98]"
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
                  {placeholder.replace("All ", "Filter by ")}
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
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ type: "spring", damping: 28, stiffness: 400 }}
              style={{ transformOrigin: "top left" }}
              className="hidden sm:block absolute left-0 top-full z-50 mt-1.5 min-w-[160px] max-h-64 overflow-y-auto rounded-xl border border-zinc-200/80 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95"
            >
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  !value
                    ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                }`}
              >
                <span>{placeholder}</span>
                {!value && <Check className="w-3 h-3 shrink-0" />}
              </button>
              {options.map((opt) => {
                const active = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="w-3 h-3 shrink-0" />}
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

const TEMPLATES = [
  { value: "quiz", label: "Quiz" },
  { value: "locked-pdf", label: "Locked PDF" },
  { value: "template1", label: "Template 1" },
  { value: "template2", label: "Template 2" },
  { value: "template3", label: "Template 3" },
  { value: "template4", label: "Template 4" },
  { value: "template5", label: "Template 5" },
  { value: "template6", label: "Template 6" },
  { value: "template7", label: "Template 7" },
  { value: "template8", label: "Template 8" },
  { value: "classic", label: "Classic" },
  { value: "video", label: "Video" },
];

const STATUS_OPTIONS = [
  { value: "live", label: "Live" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
];

export default function FunnelsPage() {
  const router = useRouter();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: "pause" | "restore" | "delete";
    funnel: Funnel;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Lock body scroll when confirm modal is open on mobile
  useEffect(() => {
    if (confirmModal && typeof window !== "undefined" && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [confirmModal]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchFunnels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(templateFilter && { template: templateFilter }),
      });
      const res = await fetch(`/api/admin/funnels?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFunnels(data.funnels);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, templateFilter, refreshKey]);

  useEffect(() => { fetchFunnels(); }, [fetchFunnels]);

  async function handleAction() {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      const { type, funnel } = confirmModal;
      if (type === "delete") {
        const res = await fetch(`/api/admin/funnels/${funnel.id}`, { method: "DELETE" });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error || "Delete failed");
          return;
        }
      } else {
        const res = await fetch(`/api/admin/funnels/${funnel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: type }),
        });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error || "Action failed");
          return;
        }
      }
      setConfirmModal(null);
      setRefreshKey((k) => k + 1);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto touch-pan-y">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
            Funnels Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            {total > 0 ? `${total.toLocaleString()} funnels on platform` : "All funnels across all users"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 sm:px-3.5 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          title="Refresh funnels"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filters Toolbar: Search on top, Status and Template dropdowns below on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search funnel or owner email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0066B2] shadow-xs transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters: Symmetric 2-column on mobile, auto-width on desktop */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-36 min-w-0">
            <FilterSelect
              value={statusFilter}
              placeholder="All Statuses"
              options={STATUS_OPTIONS}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
          </div>
          <div className="flex-1 sm:w-44 min-w-0">
            <FilterSelect
              value={templateFilter}
              placeholder="All Templates"
              options={TEMPLATES}
              onChange={(v) => { setTemplateFilter(v); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 sm:h-16 bg-zinc-50 dark:bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Layers className="w-9 h-9 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No funnels found</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Try adjusting your search query or status/template filters.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (md:hidden) - Apple Bento Cards */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {funnels.map((f) => {
                const TypeIcon = funnelTypeIcon(f);
                const typeLabel = funnelTypeLabel(f);
                return (
                  <div key={f.id} className="p-3.5 space-y-3">
                    {/* Top row: Name & Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          f.status === "live"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : f.status === "paused"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-zinc-100 dark:bg-white/5 text-zinc-500"
                        }`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                            {f.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 truncate">
                            <span>/{f.slug}</span>
                            {f.status === "live" && (
                              <a
                                href={`/l/${f.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0066B2] dark:text-[#38BDF8] hover:opacity-80 transition-opacity"
                                title="Open live funnel"
                              >
                                <ExternalLink className="w-3 h-3 inline shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${STATUS_STYLES[f.status]}`}>
                        {STATUS_LABELS[f.status]}
                      </span>
                    </div>

                    {/* Meta Strip: Owner link + Type pill */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(f.userEmail)}`)}
                        className="inline-flex items-center gap-1.5 text-[#0066B2] dark:text-[#38BDF8] hover:underline font-medium truncate max-w-[200px]"
                        title={f.userEmail}
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{f.userEmail}</span>
                      </button>

                      <div className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">
                        <span>{typeLabel}</span>
                        {f.hasVariantB && (
                          <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-bold">
                            A/B
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3-metric snapshot grid (Apple recessed bento) */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-50/90 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.05] text-center">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                          Views
                        </div>
                        <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {fmt(f.views)}
                        </div>
                      </div>
                      <div className="border-x border-zinc-200/60 dark:border-white/10">
                        <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                          Signups
                        </div>
                        <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {fmt(f.signups)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                          Conversion
                        </div>
                        <div className={`text-xs font-bold mt-0.5 ${
                          f.conversionRate >= 10
                            ? "text-emerald-600 dark:text-emerald-400"
                            : f.conversionRate >= 5
                            ? "text-[#0066B2] dark:text-[#38BDF8]"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}>
                          {f.conversionRate > 0 ? `${f.conversionRate.toFixed(1)}%` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Created Date + Action buttons */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {formatDate(f.createdAt)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Pause / Restore */}
                        {f.status === "live" && (
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ type: "pause", funnel: f })}
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 active:scale-90 transition-all cursor-pointer"
                            title="Force Pause"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}
                        {f.status === "paused" && (
                          <button
                            type="button"
                            onClick={() => setConfirmModal({ type: "restore", funnel: f })}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 active:scale-90 transition-all cursor-pointer"
                            title="Restore to Live"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ type: "delete", funnel: f })}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer"
                          title="Delete Funnel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Inspect / View Button */}
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/funnels/${f.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8] active:scale-95 transition-all cursor-pointer ml-1"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Funnel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Owner</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Views</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Signups</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Conv%</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Created</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {funnels.map((f) => {
                    const TypeIcon = funnelTypeIcon(f);
                    return (
                      <tr
                        key={f.id}
                        className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-white max-w-52 truncate">{f.name}</div>
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-52">/{f.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/users/${encodeURIComponent(f.userEmail)}`)}
                            className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-40 block cursor-pointer"
                          >
                            {f.userEmail}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[f.status]}`}>
                            {STATUS_LABELS[f.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                            <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                            {funnelTypeLabel(f)}
                            {f.hasVariantB && <span className="ml-1 px-1 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-semibold">A/B</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium">
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            {fmt(f.views)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            {fmt(f.signups)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            f.conversionRate >= 10
                              ? "text-emerald-600 dark:text-emerald-400"
                              : f.conversionRate >= 5
                              ? "text-[#0066B2] dark:text-[#38BDF8]"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}>
                            {f.conversionRate > 0 ? `${f.conversionRate.toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {formatDate(f.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Inspect */}
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/funnels/${f.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] hover:bg-[#0066B2] hover:text-white dark:hover:bg-[#0066B2] dark:hover:text-white active:scale-95 transition-all cursor-pointer"
                            >
                              View <ArrowRight className="w-3 h-3" />
                            </button>
                            {/* Pause / Restore */}
                            {f.status === "live" && (
                              <button
                                type="button"
                                onClick={() => setConfirmModal({ type: "pause", funnel: f })}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-90 transition-all cursor-pointer"
                                title="Force Pause"
                              >
                                <PauseCircle className="w-4 h-4" />
                              </button>
                            )}
                            {f.status === "paused" && (
                              <button
                                type="button"
                                onClick={() => setConfirmModal({ type: "restore", funnel: f })}
                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-90 transition-all cursor-pointer"
                                title="Restore to Live"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ type: "delete", funnel: f })}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all cursor-pointer"
                              title="Delete Funnel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02]">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Page {page} of {pages} · {total.toLocaleString()} funnels
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 sm:p-1.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] hover:bg-[#E2F0FD] dark:hover:bg-white/10 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 sm:p-1.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] hover:bg-[#E2F0FD] dark:hover:bg-white/10 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal - Adaptive Apple Bottom Sheet on Mobile, Centered Modal on Desktop */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => {
                if (!actionLoading) setConfirmModal(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-10 bg-white dark:bg-[#1C1C1F] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-md p-5 pb-8 sm:p-6 border-t sm:border border-zinc-200 dark:border-white/[0.08]"
            >
              <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  confirmModal.type === "delete"
                    ? "bg-red-100 dark:bg-red-500/15"
                    : confirmModal.type === "pause"
                    ? "bg-amber-100 dark:bg-amber-500/15"
                    : "bg-emerald-100 dark:bg-emerald-500/15"
                }`}>
                  {confirmModal.type === "delete" && <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
                  {confirmModal.type === "pause" && <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                  {confirmModal.type === "restore" && <PlayCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                    {confirmModal.type === "pause" && "Force Pause Funnel"}
                    {confirmModal.type === "restore" && "Restore Funnel"}
                    {confirmModal.type === "delete" && "Delete Funnel"}
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                    {confirmModal.funnel.name}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                {confirmModal.type === "pause" && (
                  <>This will immediately take <strong className="text-zinc-900 dark:text-white">{confirmModal.funnel.name}</strong> offline. The owner's leads will stop flowing. This action is logged in audit records.</>
                )}
                {confirmModal.type === "restore" && (
                  <>This will restore <strong className="text-zinc-900 dark:text-white">{confirmModal.funnel.name}</strong> to live status immediately.</>
                )}
                {confirmModal.type === "delete" && (
                  <>This will permanently delete <strong className="text-zinc-900 dark:text-white">{confirmModal.funnel.name}</strong> along with all its leads and sequences. <span className="text-red-500 font-semibold">This cannot be undone.</span></>
                )}
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white active:scale-95 transition-all disabled:opacity-50 cursor-pointer ${
                    confirmModal.type === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : confirmModal.type === "pause"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {actionLoading ? "Working…" : confirmModal.type === "pause" ? "Force Pause" : confirmModal.type === "restore" ? "Restore" : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

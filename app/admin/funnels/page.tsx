"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  FileText,
  HelpCircle,
  Layers,
  PauseCircle,
  PlayCircle,
  Trash2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Calendar,
  Copy,
  RotateCcw,
  CheckSquare,
  Radio,
  Eye,
  Users,
  Percent,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ApplePagination } from "@/components/ui/ApplePagination";
import { AppleCheckbox } from "@/components/leads/AppleCheckbox";

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

interface SummaryStats {
  totalViews: number;
  totalSignups: number;
  liveCount: number;
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
  { value: "live", label: "Live", dotClass: "bg-emerald-500" },
  { value: "paused", label: "Paused", dotClass: "bg-amber-500" },
  { value: "draft", label: "Draft", dotClass: "bg-zinc-400" },
];

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
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  className = "",
  align = "left",
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string; dotClass?: string }[];
  onChange: (v: string) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const activeOption = options.find((o) => o.value === value);
  const label = activeOption ? activeOption.label : placeholder;

  return (
    <div ref={ref} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex h-9 items-center justify-between gap-1 sm:gap-2 rounded-xl border px-2 sm:px-3 text-xs font-medium transition cursor-pointer select-none active:scale-[0.98] ${
          value
            ? "border-[#0066B2]/40 bg-[#0066B2]/5 text-[#0066B2] dark:border-[#38BDF8]/40 dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]"
            : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
        }`}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0">
          {activeOption?.dotClass && (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeOption.dotClass}`} />
          )}
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile Sheet Backdrop (< sm) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setOpen(false)}
              className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Mobile Bottom Action Sheet (< sm) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="sm:hidden fixed inset-x-0 bottom-0 z-[51] rounded-t-3xl bg-white dark:bg-[#1C1C1F] border-t border-zinc-200 dark:border-white/10 p-4 pb-8 shadow-2xl max-h-[75vh] overflow-y-auto"
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
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
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
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {opt.dotClass && (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotClass}`} />
                        )}
                        <span>{opt.label}</span>
                      </span>
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
              style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
              className={`hidden sm:block absolute top-full z-50 mt-1.5 w-44 max-h-64 overflow-y-auto rounded-xl border border-zinc-200/90 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1C1C1F]/95 ${
                align === "right" ? "right-0" : "left-0"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
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
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {opt.dotClass && (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotClass}`} />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </span>
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

export default function FunnelsPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "views" | "signups" | "conversionRate" | "name">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [summary, setSummary] = useState<SummaryStats>({
    totalViews: 0,
    totalSignups: 0,
    liveCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Selection mode state (off by default, like dashboard leads page)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Copied slug state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Confirm modal state (single funnel)
  const [confirmModal, setConfirmModal] = useState<{
    type: "pause" | "restore" | "delete";
    funnel: Funnel;
  } | null>(null);

  // Batch confirm modal state
  const [batchModal, setBatchModal] = useState<"pause" | "restore" | "delete" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Global hotkey: press "/" to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (confirmModal || batchModal) {
          setConfirmModal(null);
          setBatchModal(null);
        } else if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds(new Set());
        } else if (search) {
          setSearch("");
          setPage(1);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmModal, batchModal, isSelectionMode, search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch funnels
  const fetchFunnels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        sortBy,
        sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(templateFilter && { template: templateFilter }),
      });
      const res = await fetch(`/api/admin/funnels?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFunnels(data.funnels || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, templateFilter, sortBy, sortOrder, refreshKey]);

  useEffect(() => {
    fetchFunnels();
  }, [fetchFunnels]);

  // Clear selections when page changes
  useEffect(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, [page, debouncedSearch, statusFilter, templateFilter]);

  // Sorting handler
  function handleSort(col: typeof sortBy) {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
    setPage(1);
  }

  // Copy slug helper
  function handleCopySlug(e: React.MouseEvent, funnel: Funnel) {
    e.stopPropagation();
    const url = `${window.location.origin}/l/${funnel.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(funnel.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  // Single Action handler
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

  // Batch Action handler
  async function handleBatchAction() {
    if (!batchModal || selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map(async (id) => {
          if (batchModal === "delete") {
            return fetch(`/api/admin/funnels/${id}`, { method: "DELETE" });
          } else {
            return fetch(`/api/admin/funnels/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: batchModal }),
            });
          }
        })
      );
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      setBatchModal(null);
      setRefreshKey((k) => k + 1);
    } finally {
      setActionLoading(false);
    }
  }

  // Select all on current page toggle
  const allPageIds = useMemo(() => funnels.map((f) => f.id), [funnels]);
  const isAllSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const isSomeSelected = allPageIds.some((id) => selectedIds.has(id)) && !isAllSelected;
  const isSelectionActive = isSelectionMode || selectedIds.size > 0;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasActiveFilters = Boolean(search || statusFilter || templateFilter);

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setTemplateFilter("");
    setPage(1);
  }

  // Average platform conversion
  const avgConversion = summary.totalViews > 0
    ? ((summary.totalSignups / summary.totalViews) * 100).toFixed(1)
    : "0.0";

  return (
    <div
      className={`p-3 sm:p-6 md:p-8 max-w-7xl mx-auto touch-pan-y relative transition-all duration-200 ${
        selectedIds.size > 0 ? "pb-24 sm:pb-28" : "pb-6 sm:pb-8"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Funnels
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh funnels"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? "animate-spin text-[#0066B2] dark:text-[#38BDF8]" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Glance Bar (Matched 100% to site theme #171717 & blue border) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Total Funnels
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-mono tabular-nums mt-0.5">
              {total.toLocaleString()}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Live Funnels
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{summary.liveCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Total Views
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-mono tabular-nums mt-0.5">
              {summary.totalViews.toLocaleString()}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              <span className="sm:hidden">Avg Conv</span>
              <span className="hidden sm:inline">Avg. Conversion</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-mono tabular-nums mt-0.5">
              {avgConversion}%
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
            <Percent className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar: Single row on desktop, stacked on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 mb-3.5 sm:mb-5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 shrink-0 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search funnels, slugs, owners... (Press '/' to focus)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-14 h-9 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-[#0066B2] dark:focus:ring-[#38BDF8] shadow-xs transition"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Filter Dropdowns & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
          <FilterSelect
            value={statusFilter}
            placeholder="All Statuses"
            options={STATUS_OPTIONS}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            align="left"
            className="flex-1 min-w-0 sm:w-36 sm:flex-initial"
          />

          <FilterSelect
            value={templateFilter}
            placeholder="All Templates"
            options={TEMPLATES}
            onChange={(v) => {
              setTemplateFilter(v);
              setPage(1);
            }}
            align="right"
            className="flex-1 min-w-0 sm:w-40 sm:flex-initial"
          />

          {/* Select Mode Icon-Only Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode((prev) => {
                const next = !prev;
                if (!next) setSelectedIds(new Set());
                return next;
              });
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition shadow-xs cursor-pointer select-none active:scale-95 shrink-0 ${
              isSelectionActive
                ? "border-[#0066B2]/40 bg-[#0066B2]/10 text-[#0066B2] dark:border-[#38BDF8]/40 dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
            }`}
            title={isSelectionActive ? "Exit Select Mode" : "Select Funnels"}
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center w-9 sm:w-auto h-9 sm:px-2.5 text-xs font-medium rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline ml-1.5">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div id="funnels-table-container" className="bg-white dark:bg-[#171717] rounded-2xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-4 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-zinc-50 dark:bg-white/[0.02] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Layers className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No funnels match your criteria
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
              Try modifying your search keywords or resetting status and template filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 dark:bg-[#38BDF8]/10 rounded-lg hover:opacity-80 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {funnels.map((f) => {
                const TypeIcon = funnelTypeIcon(f);
                const isSelected = selectedIds.has(f.id);

                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      if (isSelectionActive) {
                        toggleSelectOne(f.id);
                      } else {
                        router.push(`/admin/funnels/${f.id}`);
                      }
                    }}
                    className={`p-4 space-y-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#0066B2]/5 dark:bg-[#38BDF8]/5"
                        : "hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Top Row: Name, Animated Checkbox, Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start min-w-0">
                        {/* Apple-style spring checkbox on mobile */}
                        <AnimatePresence initial={false}>
                          {isSelectionActive && (
                            <motion.div
                              initial={{ opacity: 0, width: 0, marginRight: 0 }}
                              animate={{ opacity: 1, width: 22, marginRight: 10 }}
                              exit={{ opacity: 0, width: 0, marginRight: 0 }}
                              transition={{ type: "spring", stiffness: 450, damping: 35 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectOne(f.id);
                              }}
                              className="flex items-center justify-center shrink-0 overflow-hidden cursor-pointer mt-0.5"
                            >
                              <AppleCheckbox
                                checked={isSelected}
                                onChange={() => toggleSelectOne(f.id)}
                                title={isSelected ? "Deselect funnel" : "Select funnel"}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {f.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 truncate">
                            <span>/{f.slug}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopySlug(e, f)}
                              className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-0.5"
                              title="Copy URL"
                            >
                              {copiedId === f.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {f.status === "live" && (
                              <a
                                href={`/l/${f.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition-colors p-0.5"
                                title="Open Live Funnel"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Dot Pill */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          f.status === "live"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : f.status === "paused"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            f.status === "live"
                              ? "bg-emerald-500"
                              : f.status === "paused"
                              ? "bg-amber-500"
                              : "bg-zinc-400"
                          }`}
                        />
                        {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                      </span>
                    </div>

                    {/* Owner & Type Strip */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/users/${encodeURIComponent(f.userEmail)}`);
                        }}
                        className="hover:text-[#0066B2] dark:hover:text-[#38BDF8] truncate max-w-[200px] cursor-pointer"
                      >
                        {f.userEmail}
                      </button>

                      <span className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0">
                        <TypeIcon className="w-3.5 h-3.5 opacity-60" />
                        {funnelTypeLabel(f)}
                      </span>
                    </div>

                    {/* 3-metric snapshot grid */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] text-center font-mono">
                      <div>
                        <div className="text-[10px] uppercase font-sans text-zinc-400 dark:text-zinc-500 font-medium">
                          Views
                        </div>
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {fmt(f.views)}
                        </div>
                      </div>
                      <div className="border-x border-zinc-200/50 dark:border-white/[0.06]">
                        <div className="text-[10px] uppercase font-sans text-zinc-400 dark:text-zinc-500 font-medium">
                          Signups
                        </div>
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {fmt(f.signups)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-sans text-zinc-400 dark:text-zinc-500 font-medium">
                          Conv %
                        </div>
                        <div
                          className={`text-xs font-semibold mt-0.5 ${
                            f.conversionRate > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`}
                        >
                          {f.conversionRate > 0 ? `${f.conversionRate.toFixed(1)}%` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Created Date + Quick Actions */}
                    <div className="flex items-center justify-between pt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {formatDate(f.createdAt)}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setConfirmModal({ type: "delete", funnel: f })}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer"
                          title="Delete Funnel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => router.push(`/admin/funnels/${f.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] active:scale-95 transition-all cursor-pointer"
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/70 dark:bg-white/[0.015] text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                    {/* Funnel Column with Animated Apple Spring Checkbox */}
                    <th className="px-4 py-3">
                      <div className="flex items-center min-w-0">
                        <AnimatePresence initial={false}>
                          {isSelectionActive && (
                            <motion.div
                              initial={{ opacity: 0, width: 0, marginRight: 0 }}
                              animate={{ opacity: 1, width: 22, marginRight: 10 }}
                              exit={{ opacity: 0, width: 0, marginRight: 0 }}
                              transition={{ type: "spring", stiffness: 450, damping: 35 }}
                              className="flex items-center overflow-hidden shrink-0"
                            >
                              <AppleCheckbox
                                checked={isAllSelected}
                                indeterminate={isSomeSelected}
                                onChange={toggleSelectAll}
                                title={isAllSelected ? "Deselect all on page" : "Select all on page"}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                        >
                          <span>Funnel</span>
                          {sortBy === "name" && (
                            sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </th>

                    {/* Owner */}
                    <th className="px-4 py-3">Owner</th>

                    {/* Status */}
                    <th className="px-4 py-3">Status</th>

                    {/* Type */}
                    <th className="px-4 py-3">Type</th>

                    {/* Views */}
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white transition"
                      onClick={() => handleSort("views")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Views</span>
                        {sortBy === "views" && (
                          sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </th>

                    {/* Signups */}
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white transition"
                      onClick={() => handleSort("signups")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Signups</span>
                        {sortBy === "signups" && (
                          sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </th>

                    {/* Conv% */}
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white transition"
                      onClick={() => handleSort("conversionRate")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Conv%</span>
                        {sortBy === "conversionRate" && (
                          sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </th>

                    {/* Created */}
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white transition"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Created</span>
                        {sortBy === "createdAt" && (
                          sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </th>

                    {/* Actions */}
                    <th className="px-4 py-3 text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04] text-xs sm:text-sm">
                  {funnels.map((f) => {
                    const TypeIcon = funnelTypeIcon(f);
                    const isSelected = selectedIds.has(f.id);

                    return (
                      <tr
                        key={f.id}
                        onClick={() => {
                          if (isSelectionActive) {
                            toggleSelectOne(f.id);
                          } else {
                            router.push(`/admin/funnels/${f.id}`);
                          }
                        }}
                        className={`group cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#0066B2]/5 dark:bg-[#38BDF8]/5"
                            : "hover:bg-zinc-500/[0.04] dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Funnel Name & Slug with Spring Animated Checkbox */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center min-w-0">
                            {/* Apple-style spring checkbox, identically matched to leads page */}
                            <AnimatePresence initial={false}>
                              {isSelectionActive && (
                                <motion.div
                                  initial={{ opacity: 0, width: 0, marginRight: 0 }}
                                  animate={{ opacity: 1, width: 22, marginRight: 10 }}
                                  exit={{ opacity: 0, width: 0, marginRight: 0 }}
                                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectOne(f.id);
                                  }}
                                  className="flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                                >
                                  <AppleCheckbox
                                    checked={isSelected}
                                    onChange={() => toggleSelectOne(f.id)}
                                    title={isSelected ? "Deselect funnel" : "Select funnel"}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="min-w-0">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors max-w-56 truncate">
                                {f.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                                <span className="truncate max-w-44">/{f.slug}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopySlug(e, f)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity p-0.5 cursor-pointer"
                                  title="Copy URL"
                                >
                                  {copiedId === f.id ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                {f.status === "live" && (
                                  <a
                                    href={`/l/${f.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition-opacity p-0.5"
                                    title="Open Live Funnel in new tab"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Owner Email with subtle monogram avatar */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center shrink-0 uppercase">
                              {f.userEmail.charAt(0) || "U"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/users/${encodeURIComponent(f.userEmail)}`);
                              }}
                              className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition-colors truncate max-w-44 cursor-pointer text-left"
                              title={f.userEmail}
                            >
                              {f.userEmail}
                            </button>
                          </div>
                        </td>

                        {/* Status Badge with Dot */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              f.status === "live"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : f.status === "paused"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                f.status === "live"
                                  ? "bg-emerald-500"
                                  : f.status === "paused"
                                  ? "bg-amber-500"
                                  : "bg-zinc-400"
                              }`}
                            />
                            {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                            <TypeIcon className="w-3.5 h-3.5 opacity-60 shrink-0" />
                            {funnelTypeLabel(f)}
                            {f.hasVariantB && (
                              <span className="ml-1 px-1 py-0.2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">
                                A/B
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Views (Right-Aligned, Tabular) */}
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200 font-medium">
                          {f.views.toLocaleString()}
                        </td>

                        {/* Signups (Right-Aligned, Tabular) */}
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200 font-medium">
                          {f.signups.toLocaleString()}
                        </td>

                        {/* Conv% (Right-Aligned, Tabular) */}
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                          {f.conversionRate > 0 ? (
                            <span
                              className={`font-semibold ${
                                f.conversionRate >= 10
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-zinc-800 dark:text-zinc-200"
                              }`}
                            >
                              {f.conversionRate.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600">—</span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-3.5 text-right text-xs text-zinc-400 dark:text-zinc-500 font-mono whitespace-nowrap">
                          {formatDate(f.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Inspect / View Button */}
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/funnels/${f.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] hover:bg-[#0066B2] hover:text-white dark:hover:bg-[#0066B2] dark:hover:text-white active:scale-95 transition-all cursor-pointer"
                            >
                              View <ArrowRight className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setConfirmModal({ type: "delete", funnel: f })}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-colors cursor-pointer"
                              title="Delete Funnel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          <div className="border-t border-zinc-100 dark:border-white/[0.04]">
            <ApplePagination
              currentPage={page}
              totalPages={pages}
              totalItems={total}
              pageSize={Math.ceil(total / pages) || 25}
              scrollTargetId="funnels-table-container"
              scrollToTopOnPageChange={true}
              onPageChange={(p) => {
                setPage(p);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  const mainEl = document.querySelector("main");
                  if (mainEl) {
                    mainEl.scrollTo({ top: 0, behavior: "smooth" });
                  }
                  const target = document.getElementById("funnels-table-container");
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }
              }}
              itemLabel="funnel"
              itemLabelPlural="funnels"
            />
          </div>
        )}
      </div>

      {/* Floating Batch Action Dock (Linear / Stripe style) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/95 dark:bg-[#1C1C1F]/95 text-white border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl px-4 py-2.5 flex items-center gap-3 sm:gap-4 max-w-[95vw]"
          >
            <div className="text-xs font-semibold flex items-center gap-1.5 pr-2 border-r border-white/15">
              <span className="w-2 h-2 rounded-full bg-[#0066B2] dark:bg-[#38BDF8]" />
              <span>{selectedIds.size} selected</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setBatchModal("pause")}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>

              <button
                type="button"
                onClick={() => setBatchModal("restore")}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>

              <button
                type="button"
                onClick={() => setBatchModal("delete")}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 text-red-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedIds(new Set());
                setIsSelectionMode(false);
              }}
              className="text-xs text-zinc-400 hover:text-white pl-2 border-l border-white/15 cursor-pointer"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal (Single Item) */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => {
                if (!actionLoading) setConfirmModal(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-10 bg-white dark:bg-[#1C1C1F] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-md p-5 pb-8 sm:p-6 border-t sm:border border-zinc-200 dark:border-white/[0.08]"
            >
              <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    confirmModal.type === "delete"
                      ? "bg-red-100 dark:bg-red-500/15"
                      : confirmModal.type === "pause"
                      ? "bg-amber-100 dark:bg-amber-500/15"
                      : "bg-emerald-100 dark:bg-emerald-500/15"
                  }`}
                >
                  {confirmModal.type === "delete" && (
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  {confirmModal.type === "pause" && (
                    <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  {confirmModal.type === "restore" && (
                    <PlayCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
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
                  <>
                    This will immediately take{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      {confirmModal.funnel.name}
                    </strong>{" "}
                    offline. Leads will stop flowing to this funnel.
                  </>
                )}
                {confirmModal.type === "restore" && (
                  <>
                    This will restore{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      {confirmModal.funnel.name}
                    </strong>{" "}
                    to live status immediately.
                  </>
                )}
                {confirmModal.type === "delete" && (
                  <>
                    This will permanently delete{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      {confirmModal.funnel.name}
                    </strong>{" "}
                    and its related resources.{" "}
                    <span className="text-red-500 font-semibold">This action cannot be undone.</span>
                  </>
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
                  {actionLoading
                    ? "Working…"
                    : confirmModal.type === "pause"
                    ? "Force Pause"
                    : confirmModal.type === "restore"
                    ? "Restore"
                    : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal (Batch Items) */}
      <AnimatePresence>
        {batchModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => {
                if (!actionLoading) setBatchModal(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-10 bg-white dark:bg-[#1C1C1F] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-md p-5 pb-8 sm:p-6 border-t sm:border border-zinc-200 dark:border-white/[0.08]"
            >
              <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    batchModal === "delete"
                      ? "bg-red-100 dark:bg-red-500/15"
                      : batchModal === "pause"
                      ? "bg-amber-100 dark:bg-amber-500/15"
                      : "bg-emerald-100 dark:bg-emerald-500/15"
                  }`}
                >
                  {batchModal === "delete" && (
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  {batchModal === "pause" && (
                    <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  {batchModal === "restore" && (
                    <PlayCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                    {batchModal === "pause" && `Pause ${selectedIds.size} Funnels`}
                    {batchModal === "restore" && `Resume ${selectedIds.size} Funnels`}
                    {batchModal === "delete" && `Delete ${selectedIds.size} Funnels`}
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Batch operation on {selectedIds.size} selected items
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                {batchModal === "delete" ? (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      {selectedIds.size} funnels
                    </strong>
                    ? <span className="text-red-500 font-semibold">This cannot be undone.</span>
                  </>
                ) : (
                  <>
                    Are you sure you want to {batchModal === "pause" ? "pause" : "resume"}{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      {selectedIds.size} funnels
                    </strong>
                    ?
                  </>
                )}
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setBatchModal(null)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchAction}
                  disabled={actionLoading}
                  className={`w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white active:scale-95 transition-all disabled:opacity-50 cursor-pointer ${
                    batchModal === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : batchModal === "pause"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {actionLoading
                    ? "Working…"
                    : batchModal === "pause"
                    ? "Pause All Selected"
                    : batchModal === "restore"
                    ? "Resume All Selected"
                    : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
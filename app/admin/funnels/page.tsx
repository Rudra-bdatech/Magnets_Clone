"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw,
  Eye, Users, Zap, FileText, HelpCircle, Layers,
  PauseCircle, PlayCircle, Trash2, ArrowRight,
} from "lucide-react";

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
  live: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  draft: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
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

const TEMPLATES = [
  { value: "", label: "All Templates" },
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
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Funnels Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {total > 0 ? `${total.toLocaleString()} funnels on the platform` : "All funnels across all users"}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by funnel name or owner email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0066B2]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#0066B2]"
        >
          <option value="">All Statuses</option>
          <option value="live">Live</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={templateFilter}
          onChange={(e) => { setTemplateFilter(e.target.value); setPage(1); }}
          className="text-sm border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#0066B2]"
        >
          {TEMPLATES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-zinc-50 dark:bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <div className="py-20 text-center">
            <Layers className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No funnels found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-52">{f.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/admin/users/${encodeURIComponent(f.userEmail)}`)}
                          className="text-xs text-[#0066B2] dark:text-[#38BDF8] hover:underline truncate max-w-40 block"
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
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
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
                      <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(f.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect */}
                          <button
                            onClick={() => router.push(`/admin/funnels/${f.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] hover:bg-[#0066B2] hover:text-white dark:hover:bg-[#0066B2] dark:hover:text-white transition-colors"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </button>
                          {/* Pause / Restore */}
                          {f.status === "live" && (
                            <button
                              onClick={() => setConfirmModal({ type: "pause", funnel: f })}
                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                              title="Force Pause"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}
                          {f.status === "paused" && (
                            <button
                              onClick={() => setConfirmModal({ type: "restore", funnel: f })}
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              title="Restore to Live"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                          {/* Delete */}
                          <button
                            onClick={() => setConfirmModal({ type: "delete", funnel: f })}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.02]">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Page {page} of {pages} · {total.toLocaleString()} funnels
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-[#E2F0FD] dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-[#E2F0FD] dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-white/[0.08]">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              {confirmModal.type === "pause" && "Force Pause Funnel"}
              {confirmModal.type === "restore" && "Restore Funnel"}
              {confirmModal.type === "delete" && "Delete Funnel"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              {confirmModal.type === "pause" && (
                <>This will immediately take <strong className="text-zinc-900 dark:text-white">{confirmModal.funnel.name}</strong> offline. The owner's leads will stop flowing. This action is logged.</>
              )}
              {confirmModal.type === "restore" && (
                <>This will restore <strong className="text-zinc-900 dark:text-white">{confirmModal.funnel.name}</strong> to live status. This action is logged.</>
              )}
              {confirmModal.type === "delete" && (
                <>This will permanently delete <strong className="text-zinc-900 dark:text-white">{confirmModal.funnel.name}</strong> along with all its leads and sequences. <span className="text-red-500 font-semibold">This cannot be undone.</span></>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-50 ${
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
          </div>
        </div>
      )}
    </div>
  );
}

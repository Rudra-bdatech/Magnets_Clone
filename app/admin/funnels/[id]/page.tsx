"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Eye, Users, Zap, FileText, HelpCircle, Layers,
  PauseCircle, PlayCircle, Trash2, Calendar,
  BarChart2, Settings, AlertTriangle, ExternalLink, Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FunnelDetail {
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
  updatedAt: string;
  quizFunnelEnabled: boolean;
  hasVariantB: boolean;
  testStarted: boolean;
  variantAViews: number;
  variantASignups: number;
  variantBViews: number;
  variantBSignups: number;
  isLockedPdf: boolean;
  pdfPageCount: number;
  pdfFreePages: number;
  pdfTitle: string;
  sequenceEnabled: boolean;
  enableAiPersonalizedDeliverable: boolean;
}

const STATUS_STYLES = {
  live: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/10",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-zinc-100 dark:border-white/[0.05] last:border-b-0">
      <span className="sm:w-36 shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="flex-1 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 break-words font-medium">
        {value || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.04] rounded-2xl p-3 sm:p-4 text-center shadow-xs">
      <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mx-auto mb-1.5" />
      <div className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{value}</div>
      <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function FunnelDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [funnel, setFunnel] = useState<FunnelDetail | null>(null);
  const [leadCount, setLeadCount] = useState(0);
  const [sequenceCount, setSequenceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmModal, setConfirmModal] = useState<"pause" | "restore" | "delete" | null>(null);
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

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/funnels/${id}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to load funnel");
        return;
      }
      const data = await res.json();
      setFunnel(data.funnel);
      setLeadCount(data.leadCount);
      setSequenceCount(data.sequenceCount);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAction(type: "pause" | "restore" | "delete") {
    setActionLoading(true);
    try {
      if (type === "delete") {
        const res = await fetch(`/api/admin/funnels/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error || "Delete failed");
          return;
        }
        router.push("/admin/funnels");
      } else {
        const res = await fetch(`/api/admin/funnels/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: type }),
        });
        if (!res.ok) {
          const d = await res.json();
          alert(d.error || "Action failed");
          return;
        }
        setConfirmModal(null);
        await load();
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 md:p-8 space-y-4 max-w-5xl mx-auto">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="h-44 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="p-3.5 sm:p-6 md:p-8 max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-200/60 dark:border-red-500/20">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error || "Funnel not found"}</span>
        </div>
      </div>
    );
  }

  const funnelType = funnel.quizFunnelEnabled ? "Quiz" : funnel.pdfPageCount > 0 ? "Locked PDF" : funnel.template;

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/admin/funnels")}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        All Funnels
      </button>

      {/* Header Bento Card */}
      <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-6 shadow-md dark:shadow-none backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                {funnel.name}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 ${STATUS_STYLES[funnel.status]}`}>
                {funnel.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-400 dark:text-zinc-500">
              <div className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-400">
                <span>/{funnel.slug}</span>
                {funnel.status === "live" && (
                  <a
                    href={`/l/${funnel.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0066B2] dark:text-[#38BDF8] hover:opacity-80 transition-opacity"
                    title="View live funnel"
                  >
                    <ExternalLink className="w-3.5 h-3.5 inline ml-0.5" />
                  </a>
                )}
              </div>
              <span>·</span>
              <button
                type="button"
                onClick={() => router.push(`/admin/users/${encodeURIComponent(funnel.userEmail)}`)}
                className="inline-flex items-center gap-1 text-[#0066B2] dark:text-[#38BDF8] hover:underline font-medium cursor-pointer"
              >
                <Mail className="w-3 h-3 opacity-70" />
                <span className="truncate max-w-[200px]">{funnel.userEmail}</span>
              </button>
              <span>·</span>
              <span className="font-medium text-zinc-600 dark:text-zinc-300">{funnelType}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/[0.06] shrink-0">
            {funnel.status === "live" && (
              <button
                type="button"
                onClick={() => setConfirmModal("pause")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                Force Pause
              </button>
            )}
            {funnel.status === "paused" && (
              <button
                type="button"
                onClick={() => setConfirmModal("restore")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Restore to Live
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmModal("delete")}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Stats 2x2 on Mobile, 4-col on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
          <StatCard label="Total Views" value={funnel.views.toLocaleString()} icon={Eye} />
          <StatCard label="Total Signups" value={funnel.signups.toLocaleString()} icon={Users} />
          <StatCard label="Conversion" value={funnel.conversionRate > 0 ? `${funnel.conversionRate.toFixed(1)}%` : "—"} icon={Zap} />
          <StatCard label="Leads in DB" value={leadCount.toLocaleString()} icon={BarChart2} />
        </div>
      </div>

      {/* Two-column info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Settings */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-400" />
            Funnel Settings
          </h2>
          <InfoRow label="Template" value={funnel.template} />
          <InfoRow label="Sequence Active" value={funnel.sequenceEnabled ? "Yes" : "No"} />
          <InfoRow label="Sequences" value={sequenceCount.toString()} />
          <InfoRow label="AI Personalized" value={funnel.enableAiPersonalizedDeliverable ? "Enabled" : "Off"} />
        </div>

        {/* Dates + Features */}
        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              Dates
            </h2>
            <InfoRow label="Created" value={formatDate(funnel.createdAt)} />
            <InfoRow label="Last Updated" value={formatDate(funnel.updatedAt)} />
            <InfoRow label="Published" value={formatDate(funnel.publishedAt)} />
          </div>

          {/* Special features */}
          <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              Features
            </h2>
            {funnel.quizFunnelEnabled && (
              <InfoRow label="Quiz Funnel" value={<span className="text-emerald-600 dark:text-emerald-400 font-semibold">Enabled</span>} />
            )}
            {funnel.pdfPageCount > 0 && (
              <>
                <InfoRow label="PDF Title" value={funnel.pdfTitle || "Untitled"} />
                <InfoRow
                  label="Pages"
                  value={
                    <span>
                      <span className="text-zinc-400 dark:text-zinc-500">{funnel.pdfPageCount} total</span>
                      {" · "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{funnel.pdfFreePages || 0} free preview</span>
                      {" · "}
                      <span className="text-red-500 dark:text-red-400 font-semibold">{funnel.pdfPageCount - (funnel.pdfFreePages || 0)} locked</span>
                    </span>
                  }
                />
              </>
            )}
            {funnel.hasVariantB && (
              <>
                <InfoRow label="A/B Testing" value={<span className="text-indigo-600 dark:text-indigo-400 font-semibold">{funnel.testStarted ? "Running" : "Set up"}</span>} />
                <InfoRow
                  label="Variant A"
                  value={`${funnel.variantAViews} views · ${funnel.variantASignups} signups`}
                />
                <InfoRow
                  label="Variant B"
                  value={`${funnel.variantBViews} views · ${funnel.variantBSignups} signups`}
                />
              </>
            )}
            {!funnel.quizFunnelEnabled && funnel.pdfPageCount === 0 && !funnel.hasVariantB && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 py-1">No special features active.</p>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal - Adaptive Apple Bottom Sheet on Mobile, Centered on Desktop */}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-10 bg-white dark:bg-[#1C1C1F] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 border-t sm:border border-zinc-200 dark:border-white/[0.08]"
            >
              <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  confirmModal === "delete"
                    ? "bg-red-100 dark:bg-red-500/15"
                    : confirmModal === "pause"
                    ? "bg-amber-100 dark:bg-amber-500/15"
                    : "bg-emerald-100 dark:bg-emerald-500/15"
                }`}>
                  {confirmModal === "delete" && <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
                  {confirmModal === "pause" && <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                  {confirmModal === "restore" && <PlayCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                    {confirmModal === "pause" && "Force Pause Funnel"}
                    {confirmModal === "restore" && "Restore Funnel"}
                    {confirmModal === "delete" && "Delete Funnel"}
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                    {funnel.name}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                {confirmModal === "pause" && (
                  <>This will immediately take <strong className="text-zinc-900 dark:text-white">{funnel.name}</strong> offline. Leads will stop flowing. This action is logged in audit records.</>
                )}
                {confirmModal === "restore" && (
                  <>This will restore <strong className="text-zinc-900 dark:text-white">{funnel.name}</strong> to live status immediately.</>
                )}
                {confirmModal === "delete" && (
                  <>Permanently delete <strong className="text-zinc-900 dark:text-white">{funnel.name}</strong> along with all <strong>{leadCount}</strong> leads and <strong>{sequenceCount}</strong> sequences. <span className="text-red-500 font-semibold">This cannot be undone.</span></>
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
                  onClick={() => handleAction(confirmModal)}
                  disabled={actionLoading}
                  className={`w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white active:scale-95 transition-all disabled:opacity-50 cursor-pointer ${
                    confirmModal === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : confirmModal === "pause"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {actionLoading ? "Working…" : confirmModal === "pause" ? "Force Pause" : confirmModal === "restore" ? "Restore" : "Delete Forever"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

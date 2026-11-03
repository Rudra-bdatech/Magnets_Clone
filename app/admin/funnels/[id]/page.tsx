"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Eye, Users, Zap, FileText, HelpCircle, Layers,
  PauseCircle, PlayCircle, Trash2, ExternalLink, Calendar,
  BarChart2, Settings, AlertTriangle,
} from "lucide-react";

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
  headline: string;
  subheadline: string;
  pitch: string;
  cta: string;
  imageUrl: string | null;
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
  pdfPageCount: number;
  pdfFreePages: number;
  pdfTitle: string;
  pdfUrl: string;
  sequenceEnabled: boolean;
  afterSignupOption: string;
  destinationUrl: string;
  enableAiPersonalizedDeliverable: boolean;
  formTitle: string;
  formButtonText: string;
  accent: string;
}

const STATUS_STYLES = {
  live: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  draft: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-zinc-100 dark:border-white/[0.05] last:border-b-0">
      <span className="w-40 shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500 pt-0.5">{label}</span>
      <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{value || <span className="text-zinc-300 dark:text-zinc-600">—</span>}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-zinc-50 dark:bg-white/[0.03] rounded-xl p-4 text-center">
      <Icon className="w-4 h-4 text-zinc-400 mx-auto mb-1.5" />
      <div className="text-xl font-bold text-zinc-900 dark:text-white">{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</div>
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
      <div className="p-6 md:p-8 space-y-4">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !funnel) {
    return (
      <div className="p-6 md:p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="w-5 h-5" />
          <span>{error || "Funnel not found"}</span>
        </div>
      </div>
    );
  }

  const funnelType = funnel.quizFunnelEnabled ? "Quiz" : funnel.pdfPageCount > 0 ? "Locked PDF" : funnel.template;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/funnels")}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Funnels
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{funnel.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[funnel.status]}`}>
                {funnel.status.charAt(0).toUpperCase() + funnel.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-xs text-zinc-400 dark:text-zinc-500">
              <span className="font-mono">{funnel.slug}</span>
              <span>·</span>
              <button
                onClick={() => router.push(`/admin/users/${encodeURIComponent(funnel.userEmail)}`)}
                className="text-[#0066B2] dark:text-[#38BDF8] hover:underline"
              >
                {funnel.userEmail}
              </button>
              <span>·</span>
              <span>{funnelType}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {funnel.status === "live" && (
              <button
                onClick={() => setConfirmModal("pause")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 transition-colors"
              >
                <PauseCircle className="w-4 h-4" />
                Force Pause
              </button>
            )}
            {funnel.status === "paused" && (
              <button
                onClick={() => setConfirmModal("restore")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Restore to Live
              </button>
            )}
            <button
              onClick={() => setConfirmModal("delete")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <StatCard label="Total Views" value={funnel.views.toLocaleString()} icon={Eye} />
          <StatCard label="Total Signups" value={funnel.signups.toLocaleString()} icon={Users} />
          <StatCard label="Conversion Rate" value={funnel.conversionRate > 0 ? `${funnel.conversionRate.toFixed(1)}%` : "—"} icon={Zap} />
          <StatCard label="Leads in DB" value={leadCount.toLocaleString()} icon={BarChart2} />
        </div>
      </div>

      {/* Two-column info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic settings */}
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-zinc-400" />
            Funnel Settings
          </h2>
          <InfoRow label="Template" value={funnel.template} />
          <InfoRow label="CTA Button" value={funnel.cta} />
          <InfoRow label="Form Title" value={funnel.formTitle} />
          <InfoRow label="Form Button" value={funnel.formButtonText} />
          <InfoRow label="After Signup" value={funnel.afterSignupOption} />
          {funnel.destinationUrl && (
            <InfoRow label="Destination URL" value={
              <a href={funnel.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-[#0066B2] dark:text-[#38BDF8] hover:underline flex items-center gap-1 truncate">
                {funnel.destinationUrl} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            } />
          )}
          <InfoRow label="Sequence Active" value={funnel.sequenceEnabled ? "Yes" : "No"} />
          <InfoRow label="Sequences" value={sequenceCount.toString()} />
          <InfoRow label="AI Personalized" value={funnel.enableAiPersonalizedDeliverable ? "Enabled" : "Off"} />
        </div>

        {/* Dates + Features */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              Dates
            </h2>
            <InfoRow label="Created" value={formatDate(funnel.createdAt)} />
            <InfoRow label="Last Updated" value={formatDate(funnel.updatedAt)} />
            <InfoRow label="Published" value={formatDate(funnel.publishedAt)} />
          </div>

          {/* Special features */}
          <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
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
                {funnel.pdfUrl && (
                  <InfoRow
                    label="PDF File"
                    value={
                      <a
                        href={funnel.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0066B2] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
                      >
                        Open PDF <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    }
                  />
                )}
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
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No special features active.</p>
            )}
          </div>
        </div>
      </div>

      {/* Content preview (read-only) */}
      {(funnel.headline || funnel.subheadline || funnel.pitch) && (
        <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-white/[0.08] p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Content (read-only)</h2>
          {funnel.headline && <InfoRow label="Headline" value={funnel.headline} />}
          {funnel.subheadline && <InfoRow label="Subheadline" value={funnel.subheadline} />}
          {funnel.pitch && <InfoRow label="Pitch / Description" value={<span className="whitespace-pre-line">{funnel.pitch}</span>} />}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1C1C1F] rounded-2xl shadow-xl w-full max-w-md p-6 border border-zinc-200 dark:border-white/[0.08]">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              {confirmModal === "pause" && "Force Pause Funnel"}
              {confirmModal === "restore" && "Restore Funnel"}
              {confirmModal === "delete" && "Delete Funnel"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              {confirmModal === "pause" && (
                <>This will immediately take <strong className="text-zinc-900 dark:text-white">{funnel.name}</strong> offline. Leads will stop flowing. This action is logged in the audit trail.</>
              )}
              {confirmModal === "restore" && (
                <>This will restore <strong className="text-zinc-900 dark:text-white">{funnel.name}</strong> to live status. This action is logged.</>
              )}
              {confirmModal === "delete" && (
                <>Permanently delete <strong className="text-zinc-900 dark:text-white">{funnel.name}</strong> along with all <strong>{leadCount}</strong> leads and <strong>{sequenceCount}</strong> sequences. <span className="text-red-500 font-semibold">This cannot be undone.</span></>
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
                onClick={() => handleAction(confirmModal)}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-50 ${
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
          </div>
        </div>
      )}
    </div>
  );
}

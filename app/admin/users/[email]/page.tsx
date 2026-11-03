"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileViewerModal } from "@/components/assets/FileViewerModal";
import {
  ArrowLeft, Mail, Calendar, Globe, CreditCard, ExternalLink, Eye,
  FileText, FolderOpen, Users, Settings, Lock,
} from "lucide-react";

interface UserDetail {
  email: string;
  name: string;
  plan: string;
  role: string;
  paymentStatus: string;
  paymentProvider: string;
  emailVerified: string | null;
  joinedAt: string;
  customDomain: string;
  customSubdomain: string;
  cnameVerified: boolean;
  sslStatus: string;
  linkedinConnected: boolean;
  linkedinAccountName: string;
  gmailOAuth: { connected: boolean; gmailAddress: string };
  customSmtp: { enabled: boolean; isVerified: boolean; host: string };
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  chargebeeCustomerId: string;
  chargebeeSubscriptionId: string;
  slackWebhookUrl: string;
  zapierWebhookUrl: string;
  brandName: string;
  username: string;
  avatar: string | null;
}

interface Magnet {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "live" | "paused";
  views: number;
  signups: number;
  template: string;
  updatedAt: string;
  pdfPages: string[];
  quizFunnelEnabled: boolean;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  page: string;
  signedUpAt: string;
  status: string;
  source: string;
}

interface Resource {
  id: string;
  name: string;
  size: number;
  fileUrl: string;
  url: string;
  uploadedAt: string;
  fileExt: string;
  type: string;
}

interface Stats {
  magnetCount: number;
  leadCount: number;
  sequenceCount: number;
  resourceCount: number;
  storageBytes: number;
}

const PLANS = ["Free", "Pro"];
const ROLES = ["user", "admin", "super_admin"];

const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  draft: "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${active ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-zinc-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4">
      <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500">{label}</div>
        <div className={`text-zinc-800 dark:text-zinc-200 mt-0.5 break-all ${mono ? "font-mono text-xs" : "text-sm"}`}>{value || "—"}</div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TABS = [
  { key: "funnels", label: "Funnels & Pages", icon: FileText },
  { key: "assets", label: "Uploaded Assets", icon: FolderOpen },
  { key: "leads", label: "Leads Captured", icon: Users },
  { key: "account", label: "Account & Plan", icon: Settings },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const email = decodeURIComponent(params.email as string);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState("");
  const [role, setRole] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [tab, setTab] = useState<TabKey>("funnels");

  useEffect(() => {
    fetch(`/api/admin/users/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setStats(data.stats);
        setMagnets(data.magnets || []);
        setLeads(data.leads || []);
        setResources(data.resources || []);
        setPlan(data.user.plan || "Free");
        setRole(data.user.role || "user");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  async function save() {
    if (!user) return;
    const patch: Record<string, string> = {};
    if (plan !== user.plan) patch.plan = plan;
    if (role !== user.role) patch.role = role;
    if (!Object.keys(patch).length) return;

    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setUser((prev) => prev ? { ...prev, plan: data.plan, role: data.role } : prev);
      setPlan(data.plan);
      setRole(data.role);
      setSaveMsg("Saved.");
    } catch (err: any) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-6 w-48 bg-zinc-100 dark:bg-white/5 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">User not found.</p>
      </div>
    );
  }

  const hasChanges = plan !== user.plan || role !== user.role;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Users
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0066B2]/10 dark:bg-[#0066B2]/20 flex items-center justify-center text-[#0066B2] dark:text-[#38BDF8] font-bold text-sm shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">{user.name}</h1>
            <div className="text-sm text-zinc-400 dark:text-zinc-500">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.role === "super_admin" ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400" : user.role === "admin" ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"}`}>
            {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "User"}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.plan === "Unlimited" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" : user.plan === "Growth" ? "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400" : user.plan === "Pro" ? "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]" : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"}`}>
            {user.plan || "Free"}
          </span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard label="Leads" value={stats.leadCount} />
          <StatCard label="Funnels" value={stats.magnetCount} />
          <StatCard label="Sequences" value={stats.sequenceCount} />
          <StatCard label="Assets" value={stats.resourceCount} />
          <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4">
            <div className={`text-2xl font-bold ${stats.storageBytes > 500 * 1024 * 1024 ? "text-red-600 dark:text-red-400" : stats.storageBytes > 100 * 1024 * 1024 ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-white"}`}>
              {formatBytes(stats.storageBytes)}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Storage Used</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-zinc-200 dark:border-white/[0.08]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-[#0066B2] text-[#0066B2] dark:text-[#38BDF8] dark:border-[#38BDF8]"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Funnels & Landing Pages */}
      {tab === "funnels" && (
        <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          {magnets.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No funnels yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Views</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Signups</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
                {magnets.map((m) => {
                  const isLockedPdf = Array.isArray(m.pdfPages) && m.pdfPages.length > 0;
                  const typeLabel = isLockedPdf ? "Locked PDF" : m.quizFunnelEnabled ? "Quiz" : "Landing Page";
                  const convRate = m.views > 0 ? ((m.signups / m.views) * 100).toFixed(1) : "—";
                  return (
                    <tr key={m.id} className="hover:bg-[#F0F7FF] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 dark:text-white max-w-56 truncate">{m.name}</div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">/{m.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {isLockedPdf && <Lock className="w-3 h-3" />}
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[m.status] || "bg-zinc-100 text-zinc-500"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{m.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-zinc-700 dark:text-zinc-300">{m.signups.toLocaleString()}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">({convRate}%)</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                        {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {m.status === "live" && (
                          <a
                            href={`/l/${m.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0066B2] dark:text-[#38BDF8] hover:opacity-70 transition-opacity"
                            title="View live page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Uploaded Assets */}
      {tab === "assets" && (
        <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          {resources.length > 0 && (
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02] flex items-center justify-between">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">{resources.length} file{resources.length !== 1 ? "s" : ""}</p>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Total storage:{" "}
                <span className="text-[#0066B2] dark:text-[#38BDF8]">
                  {formatBytes(resources.reduce((sum, r) => sum + (r.size || 0), 0))}
                </span>
              </p>
            </div>
          )}
          {resources.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpen className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No uploaded assets.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">File</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Uploaded</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
                {resources.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setPreviewResource(r)}
                    className="hover:bg-[#F0F7FF] dark:hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-white max-w-64 truncate group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">
                        {r.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500 uppercase">{r.fileExt || r.type || "—"}</td>
                    <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 text-xs">{formatBytes(r.size)}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                      {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setPreviewResource(r)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 hover:bg-[#0066B2]/20 dark:bg-[#38BDF8]/10 dark:hover:bg-[#38BDF8]/20 transition-colors cursor-pointer"
                          title="Preview inside website"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        {(r.fileUrl || r.url) && (
                          <a
                            href={r.fileUrl || r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            title="Open raw file in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Leads Captured */}
      {tab === "leads" && (
        <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          {leads.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No leads captured yet.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02]">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Showing latest {leads.length} leads</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Page</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Signed Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-[#F0F7FF] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 dark:text-white">{l.name}</div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500">{l.email}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs max-w-40 truncate">{l.page}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500">{l.source || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          l.status === "delivered" || l.status === "opened"
                            ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                            : l.status === "stopped"
                              ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                              : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">{l.signedUpAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Tab: Account & Plan */}
      {tab === "account" && (
        <div className="space-y-4">
          {/* Plan & Role editor */}
          <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Plan & Role</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="text-sm border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2]"
                >
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="text-sm border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2]"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={save}
                  disabled={!hasChanges || saving}
                  className="px-4 py-2 text-sm font-semibold bg-[#0066B2] text-white rounded-xl hover:bg-[#005291] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                {saveMsg && (
                  <span className={`text-xs font-medium ${saveMsg === "Saved." ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {saveMsg}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Account Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Joined" value={user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} />
              <Row
                icon={<Mail className="w-3.5 h-3.5" />}
                label="Email Verified"
                value={user.emailVerified ? new Date(user.emailVerified).toLocaleDateString() : "No"}
              />
              <Row
                icon={<CreditCard className="w-3.5 h-3.5" />}
                label="Payment"
                value={[user.paymentProvider, user.paymentStatus].filter(Boolean).join(" · ") || "—"}
              />
              <Row
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Custom Domain"
                value={user.customDomain ? `${user.customSubdomain}.${user.customDomain}` : "—"}
              />
              {user.stripeCustomerId && (
                <Row icon={<CreditCard className="w-3.5 h-3.5" />} label="Stripe Customer" value={user.stripeCustomerId} mono />
              )}
              {user.chargebeeCustomerId && (
                <Row icon={<CreditCard className="w-3.5 h-3.5" />} label="Chargebee Customer" value={user.chargebeeCustomerId} mono />
              )}
              {user.stripeSubscriptionId && (
                <Row icon={<CreditCard className="w-3.5 h-3.5" />} label="Stripe Sub" value={user.stripeSubscriptionId} mono />
              )}
              {user.chargebeeSubscriptionId && (
                <Row icon={<CreditCard className="w-3.5 h-3.5" />} label="Chargebee Sub" value={user.chargebeeSubscriptionId} mono />
              )}
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Integrations</h2>
            <div className="flex flex-wrap gap-2">
              <Badge label="Gmail" active={Boolean(user.gmailOAuth?.connected)} />
              <Badge label="Custom SMTP" active={Boolean(user.customSmtp?.isVerified)} />
              <Badge label="LinkedIn" active={Boolean(user.linkedinConnected)} />
              <Badge label="Slack" active={Boolean(user.slackWebhookUrl && !user.slackWebhookUrl.includes("****"))} />
              <Badge label="Zapier" active={Boolean(user.zapierWebhookUrl && !user.zapierWebhookUrl.includes("****"))} />
              <Badge label="Custom Domain" active={Boolean(user.customDomain && user.cnameVerified)} />
            </div>
            {user.gmailOAuth?.connected && user.gmailOAuth?.gmailAddress && (
              <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">Gmail: {user.gmailOAuth.gmailAddress}</p>
            )}
            {user.linkedinConnected && user.linkedinAccountName && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">LinkedIn: {user.linkedinAccountName}</p>
            )}
            {user.customSmtp?.isVerified && user.customSmtp?.host && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">SMTP: {user.customSmtp.host}</p>
            )}
          </div>
        </div>
      )}

      {/* In-app Document & PDF Preview Lightbox */}
      <FileViewerModal
        resource={previewResource ? { id: previewResource.id, name: previewResource.name, url: previewResource.url || previewResource.fileUrl, fileUrl: previewResource.fileUrl } : null}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  );
}

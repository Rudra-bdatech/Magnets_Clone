"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Mail, Calendar, Globe, CreditCard, ExternalLink,
  FileText, FolderOpen, Users, Settings, Lock, ShieldOff, ShieldCheck, Trash2, AlertTriangle,
  ChevronDown, ChevronLeft, ChevronRight, Check, X, MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCountryFlag } from "@/lib/geo";

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
  // Integration flags — booleans only; raw tokens/URLs are never sent to the admin panel
  slackConnected: boolean;
  zapierConnected: boolean;
  pipedriveConnected: boolean;
  kitConnected: boolean;
  calendarConnected: boolean;
  brandName: string;
  username: string;
  avatar: string | null;
  suspended: boolean;
  signupCountry?: string;
  signupCountryCode?: string;
  signupCity?: string;
  signupRegion?: string;
  signupIp?: string;
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
  isLockedPdf: boolean;
  quizFunnelEnabled: boolean;
}

interface Resource {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  fileExt: string;
  type: string;
}

interface Sequence {
  id: string;
  name: string;
  pageId: string;
  status: "draft" | "live";
  emails: { id: string }[];
  stats: {
    signedUp: number;
    delivered: number;
    opened: number;
    replied: number;
    stopped: number;
  };
}

interface Stats {
  magnetCount: number;
  leadCount: number;
  sequenceCount: number;
  resourceCount: number;
  storageBytes: number;
  lastLoginAt: string | null;
  lastFunnelCreatedAt: string | null;
  lastLeadReceivedAt: string | null;
}

const PLANS = ["Free", "Pro"];
const ROLES = ["user", "super_admin"];

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
    <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm">
      <div className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{value.toLocaleString()}</div>
      <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-100/60 dark:border-white/[0.03]">
      <span className="mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{label}</div>
        <div className={`text-zinc-800 dark:text-zinc-200 mt-0.5 break-all ${mono ? "font-mono text-xs" : "text-xs sm:text-sm font-medium"}`}>{value || "—"}</div>
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
  { key: "sequences", label: "Sequences", icon: Mail },
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [magnets, setMagnets] = useState<Magnet[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState("");
  const [role, setRole] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [tab, setTab] = useState<TabKey>("funnels");
  const [mobileTabSheetOpen, setMobileTabSheetOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"suspend" | "unsuspend" | "delete" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [presence, setPresence] = useState<{ isOnline: boolean; page: string; secondsAgo: number }>({
    isOnline: false,
    page: "",
    secondsAgo: 0,
  });

  useEffect(() => {
    const checkPresence = async () => {
      try {
        const res = await fetch("/api/user-presence");
        if (!res.ok) return;
        const data = await res.json();
        const cleanEmail = email.trim().toLowerCase();
        const isOnline = (data.online || []).map((e: string) => String(e).toLowerCase()).includes(cleanEmail);
        const info = data.onlineMap?.[cleanEmail];
        setPresence({
          isOnline,
          page: info?.page || "/dashboard",
          secondsAgo: info?.secondsAgo || 0,
        });
      } catch {}
    };

    checkPresence();
    const interval = setInterval(checkPresence, 15_000);
    return () => clearInterval(interval);
  }, [email]);

  useEffect(() => {
    if ((confirmModal || mobileTabSheetOpen) && typeof window !== "undefined" && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [confirmModal, mobileTabSheetOpen]);

  useEffect(() => {
    fetch(`/api/admin/users/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setStats(data.stats);
        setMagnets(data.magnets || []);
        setResources(data.resources || []);
        setSequences(data.sequences || []);
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

  async function handleSuspend(action: "suspend" | "unsuspend") {
    setActionLoading(true);
    setActionMsg("");
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setUser((prev) => prev ? { ...prev, suspended: data.suspended } : prev);
      setConfirmModal(null);
    } catch (err: any) {
      setActionMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    setActionMsg("");
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.push("/admin/users");
    } catch (err: any) {
      setActionMsg(err.message);
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 max-w-5xl mx-auto">
        <div className="h-6 w-36 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse mb-5" />
        <div className="h-28 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-20 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`} />
          ))}
        </div>
        <div className="h-72 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-3.5 sm:p-6 max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/admin/users")}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          All Users
        </button>
        <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          User not found.
        </div>
      </div>
    );
  }

  const hasChanges = plan !== user.plan || role !== user.role;

  return (
    <div className="p-3.5 sm:p-6 md:p-8 max-w-5xl mx-auto touch-pan-y">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-4 sm:mb-5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        All Users
      </button>

      {/* Header / Identity Bento */}
      <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 mb-5 shadow-md dark:shadow-none backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0066B2]/15 to-[#0066B2]/5 dark:from-[#38BDF8]/20 dark:to-[#38BDF8]/5 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center font-bold text-base border border-[#0066B2]/20 dark:border-[#38BDF8]/20 shadow-xs">
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {presence.isOnline && (
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3" title="Active in dashboard right now">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#171717]" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                  {user.name || "Unnamed"}
                </h1>
                {presence.isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Active Now {presence.page ? `· ${presence.page}` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-white/5 text-zinc-500 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> Offline
                  </span>
                )}
                {user.suspended && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 flex items-center gap-1 shrink-0">
                    <ShieldOff className="w-3 h-3" /> Suspended
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${user.role === "super_admin" ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400" : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"}`}>
                  {user.role === "super_admin" ? "Super Admin" : "User"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${user.plan === "Pro" ? "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]" : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"}`}>
                  {user.plan || "Free"}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                {user.email}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/[0.06]">
            {user.suspended ? (
              <button
                type="button"
                onClick={() => setConfirmModal("unsuspend")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Unsuspend
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmModal("suspend")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <ShieldOff className="w-3.5 h-3.5" /> Suspend
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmModal("delete")}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bento */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-6">
          <StatCard label="Leads" value={stats.leadCount} />
          <StatCard label="Funnels" value={stats.magnetCount} />
          <StatCard label="Sequences" value={stats.sequenceCount} />
          <StatCard label="Assets" value={stats.resourceCount} />
          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-xs">
            <div className={`text-xl sm:text-2xl font-bold tracking-tight ${stats.storageBytes > 500 * 1024 * 1024 ? "text-red-600 dark:text-red-400" : stats.storageBytes > 100 * 1024 * 1024 ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-white"}`}>
              {formatBytes(stats.storageBytes)}
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium uppercase tracking-wider">Storage Used</div>
          </div>
        </div>
      )}

      {/* Tab Navigation (Native Mobile Segmented Switcher on <sm, Desktop Tabs on >=sm) */}
      {/* Tab Navigation (Native Mobile Segmented Switcher on <md, Desktop Tabs on md+) */}
      {(() => {
        const tabItems = [
          { key: "funnels" as const, label: "Funnels & Pages", icon: FileText, count: magnets.length },
          { key: "sequences" as const, label: "Sequences", icon: Mail, count: sequences.length },
          { key: "assets" as const, label: "Uploaded Assets", icon: FolderOpen, count: resources.length },
          { key: "leads" as const, label: "Leads Captured", icon: Users, count: stats?.leadCount ?? 0 },
          { key: "account" as const, label: "Account & Plan", icon: Settings, count: null },
        ];
        const currentTabIndex = tabItems.findIndex((t) => t.key === tab);
        const activeTabItem = tabItems[currentTabIndex] || tabItems[0];
        const ActiveIcon = activeTabItem.icon;

        return (
          <>
            {/* Mobile Tab Switcher (< md) - Apple native segmented pill */}
            <div className="md:hidden mb-5">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] shadow-md dark:shadow-none backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = (currentTabIndex - 1 + tabItems.length) % tabItems.length;
                    setTab(tabItems[prevIdx].key);
                  }}
                  className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:bg-zinc-100 dark:active:bg-white/5 active:scale-90 transition-all cursor-pointer shrink-0"
                  title="Previous section"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTabSheetOpen(true)}
                  className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] active:bg-zinc-100 dark:active:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ActiveIcon className="w-4 h-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                      {activeTabItem.label}
                    </span>
                    {activeTabItem.count !== null && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8] shrink-0">
                        {activeTabItem.count}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 shrink-0">
                    <span className="text-[10px] font-medium">{currentTabIndex + 1}/{tabItems.length}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (currentTabIndex + 1) % tabItems.length;
                    setTab(tabItems[nextIdx].key);
                  }}
                  className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white active:bg-zinc-100 dark:active:bg-white/5 active:scale-90 transition-all cursor-pointer shrink-0"
                  title="Next section"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Tab Sheet Modal (< md) with smooth Apple Spring slide */}
            <AnimatePresence>
              {mobileTabSheetOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={() => setMobileTabSheetOpen(false)}
                    className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
                  />
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white dark:bg-[#1C1C1F] border-t border-zinc-200 dark:border-white/10 p-4 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto"
                  >
                    <div className="w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-white/[0.08] px-1">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        Switch Section
                      </span>
                      <button
                        type="button"
                        onClick={() => setMobileTabSheetOpen(false)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {tabItems.map(({ key, label, icon: Icon, count }) => {
                        const active = tab === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setTab(key);
                              setMobileTabSheetOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                              active
                                ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span>{label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {count !== null && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  active
                                    ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]"
                                    : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                                }`}>
                                  {count}
                                </span>
                              )}
                              {active && <Check className="w-4 h-4 shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Desktop Tabs (hidden md:flex) */}
            <div className="hidden md:flex gap-1 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
              {tabItems.map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px cursor-pointer ${
                    tab === key
                      ? "border-[#0066B2] text-[#0066B2] dark:text-[#38BDF8] dark:border-[#38BDF8]"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {count !== null && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      tab === key
                        ? "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                        : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        );
      })()}

      {/* Tab: Funnels & Landing Pages */}
      {tab === "funnels" && (
        <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
          {magnets.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No funnels yet.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (md:hidden) */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {magnets.map((m) => {
                  const isLockedPdf = m.isLockedPdf;
                  const typeLabel = isLockedPdf ? "Locked PDF" : m.quizFunnelEnabled ? "Quiz" : "Landing Page";
                  const convRate = m.views > 0 ? ((m.signups / m.views) * 100).toFixed(1) : "—";
                  return (
                    <div key={m.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                            {m.name}
                          </div>
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate">
                            /{m.slug}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[m.status] || "bg-zinc-100 text-zinc-500"}`}>
                            {m.status}
                          </span>
                          {m.status === "live" && (
                            <a
                              href={`/l/${m.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg text-[#0066B2] dark:text-[#38BDF8] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                              title="View live page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.05] text-center">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Views</div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{m.views.toLocaleString()}</div>
                        </div>
                        <div className="border-x border-zinc-200/60 dark:border-white/10">
                          <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Signups</div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{m.signups.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Conversion</div>
                          <div className="text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] mt-0.5">{convRate}%</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          {isLockedPdf && <Lock className="w-3 h-3" />}
                          {typeLabel}
                        </span>
                        <span>
                          Updated: {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
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
                      const isLockedPdf = m.isLockedPdf;
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
                                href={`/l/${m.id}`}
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
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Sequences */}
      {tab === "sequences" && (
        <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
          {sequences.length === 0 ? (
            <div className="py-16 text-center">
              <Mail className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No sequences built yet.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02]">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{sequences.length} sequence{sequences.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Mobile Card List (md:hidden) */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {sequences.map((s) => {
                  const linkedFunnel = magnets.find((m) => m.id === s.pageId);
                  return (
                    <div key={s.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                            {s.name}
                          </div>
                          {linkedFunnel && (
                            <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                              Linked to: {linkedFunnel.name}
                            </div>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${s.status === "live" ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"}`}>
                          {s.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 py-1.5 px-2 rounded-xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.05] text-center">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Steps</div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{s.emails?.length || 0}</div>
                        </div>
                        <div className="border-x border-zinc-200/60 dark:border-white/10">
                          <div className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Enrolled</div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{s.stats?.signedUp || 0}</div>
                        </div>
                        <div className="border-r border-zinc-200/60 dark:border-white/10">
                          <div className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Delivered</div>
                          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{s.stats?.delivered || 0}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Opened</div>
                          <div className={`text-xs font-bold mt-0.5 ${(s.stats?.opened || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                            {s.stats?.opened || 0}
                          </div>
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
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Steps</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Enrolled</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Delivered</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Opened</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Stopped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
                    {sequences.map((s) => {
                      const linkedFunnel = magnets.find((m) => m.id === s.pageId);
                      return (
                        <tr key={s.id} className="hover:bg-[#F0F7FF] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-zinc-900 dark:text-white max-w-56 truncate">{s.name}</div>
                            {linkedFunnel && (
                              <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                                Linked to: {linkedFunnel.name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === "live" ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{s.emails?.length || 0}</td>
                          <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{s.stats?.signedUp || 0}</td>
                          <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{s.stats?.delivered || 0}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={(s.stats?.opened || 0) > 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-zinc-400 dark:text-zinc-500"}>
                              {s.stats?.opened || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={(s.stats?.stopped || 0) > 0 ? "text-red-500 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"}>
                              {s.stats?.stopped || 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Uploaded Assets */}
      {tab === "assets" && (
        <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
          {resources.length > 0 && (
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02] flex items-center justify-between">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{resources.length} file{resources.length !== 1 ? "s" : ""}</p>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Total:{" "}
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
            <>
              {/* Mobile Card List (md:hidden) */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {resources.map((r) => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="uppercase font-bold">{r.fileExt || r.type || "FILE"}</span>
                          <span>•</span>
                          <span>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                      {formatBytes(r.size)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">File</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Type</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Size</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
                    {resources.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F0F7FF] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-white max-w-64 truncate">{r.name}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500 uppercase">{r.fileExt || r.type || "—"}</td>
                        <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 text-xs">{formatBytes(r.size)}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                          {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Leads Captured */}
      {tab === "leads" && (
        <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 text-center shadow-md dark:shadow-none backdrop-blur-sm">
          <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
            {(stats?.leadCount ?? 0).toLocaleString()}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
            {stats?.leadCount === 1 ? "lead captured" : "leads captured"}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 max-w-sm mx-auto leading-relaxed">
            Individual lead details are private to the account holder and are not accessible from the admin panel.
          </p>
        </div>
      )}

      {/* Tab: Account & Plan */}
      {tab === "account" && (
        <div className="space-y-4">
          {/* Plan & Role editor */}
          <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Plan & Role</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full text-sm border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 bg-zinc-50/50 dark:bg-[#1C1C1F] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2]"
                >
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 bg-zinc-50/50 dark:bg-[#1C1C1F] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2]"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={!hasChanges || saving}
                className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold bg-[#0066B2] text-white rounded-xl hover:bg-[#005291] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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

          {/* Account Info */}
          <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-md dark:shadow-none backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Account Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Joined" value={user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"} />
              <Row icon={<Calendar className="w-3.5 h-3.5 text-blue-500" />} label="Last Login" value={stats?.lastLoginAt ? new Date(stats.lastLoginAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "Never"} />
              <Row
                icon={<MapPin className="w-3.5 h-3.5 text-rose-500" />}
                label="Signup Location"
                value={
                  user.signupCity || user.signupCountry ? (
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>{getCountryFlag(user.signupCountryCode)}</span>
                      <span>{[user.signupCity, user.signupRegion, user.signupCountry].filter(Boolean).join(", ")}</span>
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              {user.signupIp ? (
                <Row icon={<Globe className="w-3.5 h-3.5 text-zinc-400" />} label="Signup IP" value={user.signupIp} mono />
              ) : null}
              <Row icon={<FileText className="w-3.5 h-3.5 text-violet-500" />} label="Last Funnel Created" value={stats?.lastFunnelCreatedAt ? new Date(stats.lastFunnelCreatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—"} />
              <Row icon={<Users className="w-3.5 h-3.5 text-emerald-500" />} label="Last Lead Received" value={stats?.lastLeadReceivedAt ? new Date(stats.lastLeadReceivedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—"} />
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
          <div className="bg-white dark:bg-[#171717] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Integrations</h2>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Badge label="Online in App" active={presence.isOnline} />
              <Badge label="Gmail" active={Boolean(user.gmailOAuth?.connected)} />
              <Badge label="Custom SMTP" active={Boolean(user.customSmtp?.isVerified)} />
              <Badge label="LinkedIn" active={Boolean(user.linkedinConnected)} />
              <Badge label="Slack" active={Boolean(user.slackConnected)} />
              <Badge label="Zapier" active={Boolean(user.zapierConnected)} />
              <Badge label="Pipedrive" active={Boolean(user.pipedriveConnected)} />
              <Badge label="Kit" active={Boolean(user.kitConnected)} />
              <Badge label="Calendar" active={Boolean(user.calendarConnected)} />
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

      {/* Confirm Modal - Adaptive Bottom Sheet on Mobile with Apple Spring Slide, Centered on Desktop */}
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
                if (!actionLoading) {
                  setConfirmModal(null);
                  setActionMsg("");
                }
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-10 bg-white dark:bg-[#1C1C1F] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 border-t sm:border border-zinc-200 dark:border-white/[0.08]"
            >
              <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${confirmModal === "delete" ? "bg-red-100 dark:bg-red-500/15" : confirmModal === "suspend" ? "bg-amber-100 dark:bg-amber-500/15" : "bg-emerald-100 dark:bg-emerald-500/15"}`}>
                  {confirmModal === "delete" && <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
                  {confirmModal === "suspend" && <ShieldOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                  {confirmModal === "unsuspend" && <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                    {confirmModal === "suspend" && "Suspend Account"}
                    {confirmModal === "unsuspend" && "Unsuspend Account"}
                    {confirmModal === "delete" && "Delete Account"}
                  </h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{user.email}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
                {confirmModal === "suspend" && (
                  <><strong className="text-zinc-900 dark:text-white">{user.name}</strong> will be immediately blocked from logging in. Their data stays intact and can be restored anytime.</>
                )}
                {confirmModal === "unsuspend" && (
                  <>This will restore full access for <strong className="text-zinc-900 dark:text-white">{user.name}</strong>. They will be able to log in immediately.</>
                )}
                {confirmModal === "delete" && (
                  <>Permanently delete <strong className="text-zinc-900 dark:text-white">{user.name}</strong> and <strong>all their data</strong> — funnels, leads, assets, sequences. <span className="text-red-500 font-semibold">This cannot be undone.</span></>
                )}
              </p>

              {actionMsg && (
                <div className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {actionMsg}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => { setConfirmModal(null); setActionMsg(""); }}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmModal === "delete" ? handleDelete() : handleSuspend(confirmModal)}
                  disabled={actionLoading}
                  className={`w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-50 cursor-pointer ${
                    confirmModal === "delete" ? "bg-red-600 hover:bg-red-700" :
                    confirmModal === "suspend" ? "bg-amber-500 hover:bg-amber-600" :
                    "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {actionLoading ? "Please wait…" :
                    confirmModal === "delete" ? "Yes, Delete Everything" :
                    confirmModal === "suspend" ? "Yes, Suspend" :
                    "Yes, Restore Access"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

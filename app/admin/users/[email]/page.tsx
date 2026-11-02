"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Calendar, Globe, CreditCard } from "lucide-react";

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

interface Stats {
  magnetCount: number;
  leadCount: number;
  sequenceCount: number;
  resourceCount: number;
}

const PLANS = ["Free", "Pro", "Growth", "Unlimited"];
const ROLES = ["user", "admin", "super_admin"];

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-gray-100 text-gray-600",
  Pro: "bg-blue-50 text-blue-700",
  Growth: "bg-purple-50 text-purple-700",
  Unlimited: "bg-amber-50 text-amber-700",
};

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-300"}`} />
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const email = decodeURIComponent(params.email as string);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState("");
  const [role, setRole] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setStats(data.stats);
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-sm text-gray-500">User not found.</p>
      </div>
    );
  }

  const planChanged = plan !== user.plan;
  const roleChanged = role !== user.role;
  const hasChanges = planChanged || roleChanged;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Users
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{user.name}</h1>
            <div className="text-sm text-gray-400">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          @{user.username}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Leads" value={stats.leadCount} />
          <StatCard label="Funnels" value={stats.magnetCount} />
          <StatCard label="Sequences" value={stats.sequenceCount} />
          <StatCard label="Assets" value={stats.resourceCount} />
        </div>
      )}

      {/* Edit Plan & Role */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Plan & Role</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={save}
              disabled={!hasChanges || saving}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saveMsg && (
              <span className={`text-xs ${saveMsg === "Saved." ? "text-green-600" : "text-red-600"}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Joined" value={user.joinedAt} />
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
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Integrations</h2>
        <div className="flex flex-wrap gap-2">
          <Badge label="Gmail" active={Boolean(user.gmailOAuth?.connected)} />
          <Badge label="Custom SMTP" active={Boolean(user.customSmtp?.isVerified)} />
          <Badge label="LinkedIn" active={Boolean(user.linkedinConnected)} />
          <Badge label="Slack" active={Boolean(user.slackWebhookUrl && !user.slackWebhookUrl.includes("****"))} />
          <Badge label="Zapier" active={Boolean(user.zapierWebhookUrl && !user.zapierWebhookUrl.includes("****"))} />
          <Badge label="Custom Domain" active={Boolean(user.customDomain && user.cnameVerified)} />
        </div>
        {user.gmailOAuth?.connected && user.gmailOAuth?.gmailAddress && (
          <p className="mt-3 text-xs text-gray-400">Gmail: {user.gmailOAuth.gmailAddress}</p>
        )}
        {user.linkedinConnected && user.linkedinAccountName && (
          <p className="mt-1 text-xs text-gray-400">LinkedIn: {user.linkedinAccountName}</p>
        )}
        {user.customSmtp?.isVerified && user.customSmtp?.host && (
          <p className="mt-1 text-xs text-gray-400">SMTP: {user.customSmtp.host}</p>
        )}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className={`text-gray-800 mt-0.5 break-all ${mono ? "font-mono text-xs" : "text-sm"}`}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

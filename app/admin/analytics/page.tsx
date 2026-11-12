"use client";

import { useState, useEffect } from "react";
import {
  Mail, Server, Slack, Zap, BarChart2, RefreshCw,
  Globe, ShieldCheck, Layers, AlertCircle,
  Users, FileText, HelpCircle, PlayCircle, Sparkles,
  TrendingUp, Link2, Radio,
} from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalFunnels: number;
  integrations: {
    gmail: number;
    smtp: number;
    slack: number;
    zapier: number;
    pipedrive: number;
    kit: number;
    linkedin: number;
  };
  tracking: {
    ga4: number;
    metaPixel: number;
  };
  customDomain: {
    configured: number;
    verified: number;
    sslActive: number;
    sslFailed: number;
    spfVerified: number;
    dkimVerified: number;
  };
  linkedin: {
    connected: number;
    campaignUsers: number;
  };
  funnelFeatures: {
    abTestingUsers: number;
    abTestsRunning: number;
    aiPersonalizedFunnels: number;
    aiPersonalizedUsers: number;
    quizFunnels: number;
    lockedPdfFunnels: number;
    sequenceEnabledFunnels: number;
    videoFunnels: number;
  };
  templateBreakdown: { template: string; count: number }[];
}

function pct(n: number, total: number): string {
  if (!total) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

function IntegrationCard({
  icon: Icon,
  label,
  count,
  total,
  color = "blue",
  sublabel,
  unit = "users",
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  total: number;
  color?: "blue" | "green" | "amber" | "indigo" | "rose" | "violet" | "orange" | "teal";
  sublabel?: string;
  unit?: "users" | "funnels";
}) {
  const width = total ? Math.min(100, (count / total) * 100) : 0;

  const iconColors = {
    blue: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/25 dark:text-indigo-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/25 dark:text-orange-400",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-900/25 dark:text-teal-400",
  };

  const barColors = {
    blue: "bg-[#0066B2] dark:bg-[#38BDF8]",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    orange: "bg-orange-500",
    teal: "bg-teal-500",
  };

  return (
    <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3.5 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2.5 mb-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconColors[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                {label}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              {count.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 mb-2.5 min-w-0">
          <span className="truncate pr-2">{sublabel || "—"}</span>
          <span className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
            {pct(count, total)} of {unit}
          </span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColors[color]} transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 sm:mb-4">
      <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-white">
        {title}
      </h2>
      {sub && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
          {sub}
        </p>
      )}
    </div>
  );
}

function templateDisplayName(t: string): string {
  if (t === "quiz") return "Quiz Funnel";
  if (t === "locked-pdf") return "Locked PDF";
  if (t === "video") return "Video Funnel";
  if (t === "classic") return "Classic";
  if (t.startsWith("template")) return `Template ${t.replace("template", "")}`;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/analytics", silent ? { cache: "reload" } : {});
      if (!res.ok) throw new Error("Failed to load analytics");
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto">
        <div className="h-6 w-44 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totalUsers, totalFunnels, integrations, tracking, customDomain, funnelFeatures, templateBreakdown } = data;

  const maxTemplate = Math.max(...templateBreakdown.map((t) => t.count), 1);

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
            Feature Usage & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            {totalUsers.toLocaleString()} users · {totalFunnels.toLocaleString()} funnels total
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 sm:px-3.5 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer shrink-0"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* 1. Email Integrations */}
      <section>
        <SectionHeader
          title="Email Integrations"
          sub="How users deliver leads and sequence emails"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <IntegrationCard icon={Mail} label="Gmail OAuth" count={integrations.gmail} total={totalUsers} color="rose" sublabel="Connected via Google OAuth" />
          <IntegrationCard icon={Server} label="Custom SMTP" count={integrations.smtp} total={totalUsers} color="indigo" sublabel="Verified own mail server" />
        </div>
      </section>

      {/* 2. CRM & Automation */}
      <section>
        <SectionHeader
          title="CRM & Automation Integrations"
          sub="Connected third-party tools that receive captured leads"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          <IntegrationCard icon={Slack} label="Slack" count={integrations.slack} total={totalUsers} color="violet" sublabel="Webhook connected" />
          <IntegrationCard icon={Zap} label="Zapier" count={integrations.zapier} total={totalUsers} color="orange" sublabel="Webhook connected" />
          <IntegrationCard icon={Link2} label="Pipedrive" count={integrations.pipedrive} total={totalUsers} color="green" sublabel="API token saved" />
          <IntegrationCard icon={Radio} label="Kit (ConvertKit)" count={integrations.kit} total={totalUsers} color="teal" sublabel="API connected" />
        </div>
      </section>

      {/* 3. Analytics & Tracking */}
      <section>
        <SectionHeader title="Pixel & Analytics Tracking" sub="Users with tracking pixels configured on their funnels" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <IntegrationCard icon={BarChart2} label="Google Analytics 4" count={tracking.ga4} total={totalUsers} color="orange" sublabel="GA4 Measurement ID set" />
          <IntegrationCard icon={BarChart2} label="Meta Pixel" count={tracking.metaPixel} total={totalUsers} color="blue" sublabel="Facebook Pixel ID set" />
        </div>
      </section>

      {/* 4. LinkedIn Automation */}
      <section>
        <SectionHeader title="LinkedIn Automation" sub="Comment-to-DM automation activity" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <IntegrationCard
            icon={Link2}
            label="LinkedIn Connected"
            count={data.linkedin.connected}
            total={totalUsers}
            color="indigo"
            sublabel="li_at session token active"
          />
          <IntegrationCard
            icon={TrendingUp}
            label="Active Post Campaigns"
            count={data.linkedin.campaignUsers}
            total={totalUsers}
            color="blue"
            sublabel="Users with ≥1 live campaign"
          />
        </div>
      </section>

      {/* 5. Custom Domain */}
      <section>
        <SectionHeader title="Custom Domain Health" sub="Domain setup and verification status across all users" />
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
            {(
              [
                { label: "Domain Configured", count: customDomain.configured, icon: Globe, description: "Has a custom domain set", kind: "neutral" },
                { label: "Domain Verified (DNS)", count: customDomain.verified, icon: ShieldCheck, description: "A record + CNAME resolved", kind: "neutral" },
                { label: "SSL Active", count: customDomain.sslActive, icon: ShieldCheck, description: "TLS certificate issued", kind: "good" },
                { label: "SSL Failed", count: customDomain.sslFailed, icon: AlertCircle, description: "Certificate issue — needs attention", kind: "danger" },
                { label: "SPF Verified", count: customDomain.spfVerified, icon: Mail, description: "SPF DNS record confirmed", kind: "neutral" },
                { label: "DKIM Verified", count: customDomain.dkimVerified, icon: Mail, description: "DKIM record confirmed", kind: "neutral" },
              ] as { label: string; count: number; icon: React.ElementType; description: string; kind: "neutral" | "good" | "danger" }[]
            ).map(({ label, count, icon: Icon, description, kind }) => (
              <div key={label} className="flex items-center gap-3 px-3.5 sm:px-5 py-3 sm:py-3.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  kind === "danger"
                    ? "bg-red-50 text-red-500 dark:bg-red-900/25 dark:text-red-400"
                    : kind === "good"
                    ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-900/25 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-500"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
                    {label}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                    {description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-base sm:text-lg font-bold ${kind === "danger" && count > 0 ? "text-red-500" : "text-zinc-900 dark:text-white"}`}>
                    {count.toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    {pct(count, customDomain.configured || 1)} of domains
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Funnel Features */}
      <section>
        <SectionHeader title="Funnel Features Adoption" sub="Which advanced funnel features are being actively used" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          <IntegrationCard
            icon={TrendingUp}
            label="A/B Testing"
            count={funnelFeatures.abTestingUsers}
            total={totalUsers}
            color="indigo"
            sublabel={`${funnelFeatures.abTestsRunning} tests running`}
            unit="users"
          />
          <IntegrationCard
            icon={Sparkles}
            label="AI Personalisation"
            count={funnelFeatures.aiPersonalizedUsers}
            total={totalUsers}
            color="violet"
            sublabel={`${funnelFeatures.aiPersonalizedFunnels} funnels with AI`}
            unit="users"
          />
          <IntegrationCard
            icon={HelpCircle}
            label="Quiz Funnels"
            count={funnelFeatures.quizFunnels}
            total={totalFunnels}
            color="amber"
            sublabel="Funnels with quiz flow"
            unit="funnels"
          />
          <IntegrationCard
            icon={FileText}
            label="Locked PDF Funnels"
            count={funnelFeatures.lockedPdfFunnels}
            total={totalFunnels}
            color="rose"
            sublabel="Email-gate on PDF"
            unit="funnels"
          />
          <IntegrationCard
            icon={PlayCircle}
            label="Video Funnels"
            count={funnelFeatures.videoFunnels}
            total={totalFunnels}
            color="teal"
            sublabel="Funnels with video embed"
            unit="funnels"
          />
          <IntegrationCard
            icon={Mail}
            label="Sequence Emails"
            count={funnelFeatures.sequenceEnabledFunnels}
            total={totalFunnels}
            color="green"
            sublabel="Funnels with email drip"
            unit="funnels"
          />
        </div>
      </section>

      {/* 7. Template Distribution */}
      <section>
        <SectionHeader
          title="Funnel Template Distribution"
          sub="Which templates users are building their funnels on"
        />
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-4 sm:p-5 space-y-3.5 shadow-md dark:shadow-none backdrop-blur-sm">
          {templateBreakdown.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">No funnel data yet.</p>
          ) : (
            templateBreakdown.map(({ template, count }) => (
              <div key={template}>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5 font-medium">
                  <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-2 truncate pr-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{templateDisplayName(template)}</span>
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                    {count.toLocaleString()} <span className="text-zinc-300 dark:text-zinc-600">· {pct(count, totalFunnels)}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0066B2] dark:bg-[#38BDF8] transition-all duration-500"
                    style={{ width: `${(count / maxTemplate) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

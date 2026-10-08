"use client";

import React, { useState, useMemo, memo } from "react";
import {
  Globe,
  Check,
  Copy,
  RefreshCw,
  Loader2,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Server,
  Info,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import { type Account } from "@/lib/data";
import { getPlanLimits } from "@/lib/plan-limits";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  getDomainVerificationToken,
  formatCustomDomainUrl,
  formatFullHost,
} from "@/lib/domain-verify";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface DomainSectionProps {
  appBaseUrl: string;
  username: string;
  setUsername: (val: string) => void;
  rootDomain: string;
  setRootDomain: (val: string) => void;
  pageSubdomain: string;
  setPageSubdomain: (val: string) => void;
  domainVerified: boolean;
  setDomainVerified: (val: boolean) => void;
  cnameVerified: boolean;
  setCnameVerified: (val: boolean) => void;
  sslStatus: "pending" | "active" | "failed";
  setSslStatus: (val: "pending" | "active" | "failed") => void;
  domainError: string;
  setDomainError: (val: string) => void;
  cnameError: string;
  setCnameError: (val: string) => void;
  checkingDomain: boolean;
  setCheckingDomain: (val: boolean) => void;
  checkingCname: boolean;
  setCheckingCname: (val: boolean) => void;
  isCustomDomainOpen: boolean;
  onToggleCustomDomain: () => void;
  markDirty: (field: string) => void;
  handleSave: (overrides?: Partial<Account>) => Promise<void>;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  userPlan?: string;
  onUpgradeClick?: () => void;
}

export const DomainSection = memo(function DomainSection({
  appBaseUrl,
  username,
  setUsername,
  rootDomain,
  setRootDomain,
  pageSubdomain,
  setPageSubdomain,
  domainVerified,
  setDomainVerified,
  cnameVerified,
  setCnameVerified,
  sslStatus,
  setSslStatus,
  domainError,
  setDomainError,
  cnameError,
  setCnameError,
  checkingDomain,
  setCheckingDomain,
  checkingCname,
  setCheckingCname,
  isCustomDomainOpen,
  onToggleCustomDomain,
  markDirty,
  handleSave,
  addToast,
  userPlan = "Free",
  onUpgradeClick,
}: DomainSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Plan limits & Custom domain lock check
  const planLimits = useMemo(() => getPlanLimits(userPlan), [userPlan]);
  const isCustomDomainLocked = !planLimits.customDomainAllowed;

  // Memoize derived computations
  const cleanDom = useMemo(() => sanitizeDomain(rootDomain), [rootDomain]);
  const cleanSub = useMemo(() => formatSubdomain(pageSubdomain), [pageSubdomain]);
  const tokenValue = useMemo(() => getDomainVerificationToken(cleanDom), [cleanDom]);
  const liveCustomUrl = useMemo(() => formatCustomDomainUrl(rootDomain, pageSubdomain), [rootDomain, pageSubdomain]);
  const fullCustomHost = useMemo(() => formatFullHost(rootDomain, pageSubdomain), [rootDomain, pageSubdomain]);
  const defaultShareUrl = useMemo(() => `${appBaseUrl}/${username}`, [appBaseUrl, username]);

  const copyToClipboard = (text: string, fieldKey: string, toastMessage?: string) => {
    if (!navigator?.clipboard) {
      addToast("Clipboard not available", "error");
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    if (toastMessage) addToast(toastMessage, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const labelClass = "block text-xs sm:text-[13px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5";

  return (
    <div className="rounded-2xl border border-[#0066B2]/25 bg-white dark:border-[#0066B2]/30 dark:bg-[#16161A] shadow-sm transition-all overflow-hidden">
      
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/20 bg-[#EFF6FF] text-[#0066B2] shadow-2xs dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                Public URL & Custom Domain
                <InfoTooltip
                  content="Share your lead magnets directly or connect a white-label custom domain."
                  title="Public URL & Custom Domain"
                  align="start"
                />
              </h4>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
            {domainVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                TXT Verified
              </span>
            )}
            {cnameVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-3 w-3" />
                CNAME Routed
              </span>
            )}
            {sslStatus === "active" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                SSL Active
              </span>
            )}
            {cnameVerified && rootDomain && (
              <a
                href={liveCustomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer shadow-2xs"
              >
                <span>Visit Live Domain</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* SECTION 1: LeadMagnets Default URL & Fast Share Card */}
        <div>
          <label className={labelClass}>LeadMagnets Default Workspace URL</label>
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-start">
            
            {/* Username input with prefix */}
            <div className="flex-1 min-w-0">
              <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-[#0E0E10] focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] transition shadow-2xs overflow-hidden">
                <span className="flex items-center select-none border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-mono text-[#0066B2] dark:border-zinc-700/80 dark:bg-[#18181C] dark:text-[#38BDF8] shrink-0">
                  {appBaseUrl}/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    markDirty("username");
                    setUsername(e.target.value);
                  }}
                  onBlur={() => handleSave()}
                  className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm font-mono text-zinc-900 outline-none dark:text-white placeholder:text-zinc-400 min-w-0"
                  placeholder="your-workspace"
                />
              </div>
              <p className="mt-1.5 text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            {/* Share link card */}
            <div className="rounded-xl border border-[#0066B2]/20 bg-[#F8FBFF] dark:border-[#0066B2]/30 dark:bg-[#121216] p-3.5 shrink-0 w-full lg:w-auto lg:min-w-[320px] flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] animate-pulse" />
                  SHARE THIS LINK
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(defaultShareUrl, "shareUrl", "Default workspace URL copied!")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066B2] hover:underline dark:text-[#38BDF8] cursor-pointer"
                >
                  {copiedField === "shareUrl" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 select-all break-all">
                {defaultShareUrl}
              </p>
            </div>

          </div>
        </div>

        {/* SECTION 2: Custom Domain Accordion Box */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-[#FAFCFF] dark:bg-[#141418] overflow-hidden transition-all shadow-2xs">
          
          {/* Accordion Toggle Header */}
          <button
            type="button"
            onClick={onToggleCustomDomain}
            className="flex w-full items-center justify-between p-3.5 sm:p-4 text-left hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#BAE6FD] dark:border-[#0066B2]/40">
                <Globe className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    Custom Domain Configuration
                    <InfoTooltip
                      content="Connect your custom brand domain (e.g. get.yourdomain.com) to your lead magnets."
                      title="Custom Domain Configuration"
                      align="start"
                    />
                  </p>
                  {isCustomDomainLocked ? (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      PRO FEATURE
                    </span>
                  ) : cnameVerified ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Live
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-2xs dark:border-zinc-700 dark:bg-[#1E1E24] dark:text-zinc-300 ml-2">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isCustomDomainOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {/* Accordion Body */}
          {isCustomDomainOpen && (
            <div className="p-3.5 sm:p-5 border-t border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-[#121215] space-y-5">
              
              {/* Paywall Banner for Free Plan */}
              {isCustomDomainLocked && (
                <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-[#0066B2]/[0.05] to-transparent dark:from-amber-500/15 dark:via-[#0066B2]/10 dark:to-transparent p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          Pro Plan Feature
                        </span>
                        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                          White-Label & Custom Domain
                        </span>
                      </div>
                      <h5 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                        Connect your custom domain (e.g. get.yourbrand.com)
                      </h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        Upgrade to the Pro plan to publish lead magnets on your branded subdomain with automated SSL certificates, high-speed CNAME routing, and zero LeadMagnets branding.
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpgradeClick) {
                            onUpgradeClick();
                          } else {
                            addToast("Please upgrade to Pro to unlock custom domains.", "info");
                          }
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066B2] to-[#0284C7] hover:from-[#005291] hover:to-[#0066B2] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span>Upgrade to Pro (₹1,999/mo)</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Inputs Grid */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isCustomDomainLocked ? "opacity-60 cursor-not-allowed" : ""}`}>
                {/* Root domain */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Root Domain</span>
                    {isCustomDomainLocked && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    disabled={isCustomDomainLocked}
                    value={rootDomain}
                    onChange={(e) => {
                      if (isCustomDomainLocked) return;
                      markDirty("customDomain");
                      setRootDomain(e.target.value);
                    }}
                    onBlur={() => !isCustomDomainLocked && handleSave()}
                    placeholder={isCustomDomainLocked ? "yourdomain.com (Requires Pro Plan)" : "example.com"}
                    className={`w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] focus:bg-white dark:border-zinc-700 dark:bg-[#18181C] dark:text-white dark:placeholder:text-zinc-500 transition-all font-mono shadow-2xs ${
                      isCustomDomainLocked ? "cursor-not-allowed bg-zinc-100 dark:bg-zinc-900/50" : ""
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                    Your base domain without http:// or paths (e.g. coachassist.co.in)
                  </p>
                </div>

                {/* Subdomain */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Subdomain / Prefix</span>
                    {isCustomDomainLocked && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    disabled={isCustomDomainLocked}
                    value={pageSubdomain}
                    onChange={(e) => {
                      if (isCustomDomainLocked) return;
                      markDirty("customSubdomain");
                      setPageSubdomain(e.target.value);
                    }}
                    onBlur={() => !isCustomDomainLocked && handleSave()}
                    placeholder="get"
                    className={`w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] focus:bg-white dark:border-zinc-700 dark:bg-[#18181C] dark:text-white dark:placeholder:text-zinc-500 transition-all font-mono shadow-2xs ${
                      isCustomDomainLocked ? "cursor-not-allowed bg-zinc-100 dark:bg-zinc-900/50" : ""
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                    Subdomain prefix for lead magnet pages (e.g. "get", "access", "guide")
                  </p>
                </div>
              </div>

              {/* 2-Step DNS Verification Flow */}
              {rootDomain.trim() ? (
                <div className="space-y-4 pt-1">
                  
                  {/* STEP 1: TXT Ownership Record Card */}
                  <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${
                    domainVerified
                      ? "border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-950/10"
                      : "border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-[#16161B]"
                  }`}>
                    
                    {/* Step 1 Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#22222A] shadow-2xs">
                          1
                        </span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            Step 1: Prove Domain Ownership (TXT Record)
                            <InfoTooltip
                              content="Add this TXT record to your DNS provider, then click Check Ownership."
                              title="Domain Ownership (TXT Record)"
                              align="start"
                            />
                          </h5>
                        </div>
                      </div>

                      {domainVerified && (
                        <span className="self-start sm:self-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Ownership Verified
                        </span>
                      )}
                    </div>

                    {/* Step 1 DNS Record Table/Box */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#1E1E24] p-3.5 sm:p-4 space-y-3 shadow-2xs">
                      
                      {/* Record Type */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          RECORD TYPE
                        </span>
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono text-xs font-bold border border-purple-200 dark:border-purple-800/60">
                          TXT
                        </span>
                      </div>

                      {/* Host & Value Grid */}
                      <div className="space-y-3">
                        {/* HOST */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              HOST / NAME
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[200px] sm:max-w-none">
                              Full Host: leadmagnets-verify.{cleanDom}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-[#141418] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 gap-2">
                            <span className="truncate">leadmagnets-verify</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard("leadmagnets-verify", "host", "TXT host copied!")}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer shrink-0"
                            >
                              {copiedField === "host" ? (
                                <span className="text-emerald-500 font-bold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Copied
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="h-3.5 w-3.5" /> Copy
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* VALUE */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
                            TXT VALUE / CONTENT
                          </span>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-[#141418] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 gap-2">
                            <span className="truncate select-all min-w-0">
                              {tokenValue}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(tokenValue, "value", "TXT token value copied!")}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer shrink-0"
                            >
                              {copiedField === "value" ? (
                                <span className="text-emerald-500 font-bold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Copied
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="h-3.5 w-3.5" /> Copy
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Step 1 Check Button & Error Display */}
                    <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        disabled={checkingDomain || isCustomDomainLocked}
                        onClick={async () => {
                          if (isCustomDomainLocked) {
                            if (onUpgradeClick) onUpgradeClick();
                            addToast("Custom domains are a Pro feature. Please upgrade your plan.", "error");
                            return;
                          }
                          setCheckingDomain(true);
                          setDomainError("");
                          try {
                            const res = await fetch("/api/domain/verify", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ domain: cleanDom, subdomain: cleanSub }),
                            });
                            const data = await res.json();
                            if (data.code === "PLAN_UPGRADE_REQUIRED") {
                              if (onUpgradeClick) onUpgradeClick();
                              setDomainError(data.error || "Custom domains require a Pro plan.");
                              addToast(data.error || "Custom domains require a Pro plan.", "error");
                              return;
                            }
                            if (data.isVerified) {
                              setDomainVerified(true);
                              if (data.cnameVerified) setCnameVerified(true);
                              if (data.sslStatus) setSslStatus(data.sslStatus);
                              setDomainError("Domain ownership verified successfully!");
                              await handleSave({
                                domainVerified: true,
                                cnameVerified: data.cnameVerified,
                                sslStatus: data.sslStatus || "active"
                              });
                              addToast("🎉 Domain ownership verified successfully!", "success");
                            } else {
                              const errMsg = data.message || `No TXT record found at leadmagnets-verify.${cleanDom}. DNS updates can take a few minutes.`;
                              setDomainError(errMsg);
                              addToast(errMsg, "error");
                            }
                          } catch (e: any) {
                            const errMsg = `No TXT record found at leadmagnets-verify.${cleanDom}. Check your DNS provider.`;
                            setDomainError(errMsg);
                            addToast(errMsg, "error");
                          } finally {
                            setCheckingDomain(false);
                          }
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202028] px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282834] transition shadow-2xs cursor-pointer disabled:opacity-60"
                      >
                        {checkingDomain ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                        )}
                        <span>{checkingDomain ? "Checking DNS..." : "Check Ownership (TXT)"}</span>
                      </button>

                      {domainError && (
                        <p className={`text-xs flex items-center gap-1.5 ${
                          domainVerified ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {domainVerified ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Info className="h-3.5 w-3.5 shrink-0" />}
                          <span className="break-all">{domainError}</span>
                        </p>
                      )}
                    </div>

                  </div>

                  {/* STEP 2: CNAME Record Card */}
                  <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${
                    cnameVerified
                      ? "border-blue-500/30 bg-blue-500/[0.03] dark:bg-blue-950/10"
                      : "border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-[#16161B]"
                  }`}>
                    
                    {/* Step 2 Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-600 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#22222A] shadow-2xs">
                          2
                        </span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            Step 2: Route Traffic (CNAME Record)
                            <InfoTooltip
                              content="Add this CNAME record to route traffic from your subdomain to your magnets."
                              title="Route Traffic (CNAME Record)"
                              align="start"
                            />
                          </h5>
                        </div>
                      </div>

                      {cnameVerified && (
                        <span className="self-start sm:self-auto inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Traffic Routed
                        </span>
                      )}
                    </div>

                    {/* Step 2 DNS Record Box */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/70 bg-white dark:bg-[#1E1E24] p-3.5 sm:p-4 space-y-3 shadow-2xs">
                      
                      {/* Record Type */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          RECORD TYPE
                        </span>
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200 dark:border-blue-800/60">
                          CNAME
                        </span>
                      </div>

                      {/* Subdomain & Target Value */}
                      <div className="space-y-3">
                        {/* SUBDOMAIN / HOST */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              SUBDOMAIN / HOST
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[200px] sm:max-w-none">
                              Full Host: {cleanSub}.{cleanDom}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-[#141418] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 gap-2">
                            <span className="truncate">{cleanSub}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(cleanSub, "cnameHost", "CNAME host copied!")}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer shrink-0"
                            >
                              {copiedField === "cnameHost" ? (
                                <span className="text-emerald-500 font-bold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Copied
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="h-3.5 w-3.5" /> Copy
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* TARGET VALUE */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
                            TARGET VALUE / POINTS TO
                          </span>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-[#141418] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 gap-2">
                            <span className="truncate select-all min-w-0">
                              {sanitizeDomain(appBaseUrl) || "magnets.bdatech.in"}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(sanitizeDomain(appBaseUrl) || "magnets.bdatech.in", "cnameValue", "CNAME target value copied!")}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer shrink-0"
                            >
                              {copiedField === "cnameValue" ? (
                                <span className="text-emerald-500 font-bold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Copied
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="h-3.5 w-3.5" /> Copy
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Step 2 Check Button & Error Display */}
                    <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="button"
                        disabled={checkingCname || isCustomDomainLocked}
                        onClick={async () => {
                          if (isCustomDomainLocked) {
                            if (onUpgradeClick) onUpgradeClick();
                            addToast("Custom domains are a Pro feature. Please upgrade your plan.", "error");
                            return;
                          }
                          setCheckingCname(true);
                          setCnameError("");
                          try {
                            const res = await fetch("/api/domain/verify", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ domain: cleanDom, subdomain: cleanSub }),
                            });
                            const data = await res.json();
                            if (data.code === "PLAN_UPGRADE_REQUIRED") {
                              if (onUpgradeClick) onUpgradeClick();
                              setCnameError(data.error || "Custom domains require a Pro plan.");
                              addToast(data.error || "Custom domains require a Pro plan.", "error");
                              return;
                            }
                            if (data.cnameVerified) {
                              setCnameVerified(true);
                              setSslStatus("active");
                              const successMsg = `Traffic routed! ${data.fullSubdomainHost} points to ${data.cnameTarget}`;
                              setCnameError(successMsg);
                              await handleSave({ cnameVerified: true, sslStatus: "active" });
                              addToast("🎉 CNAME routing verified and SSL is active!", "success");
                            } else {
                              const errMsg = data.cnameMessage || `No CNAME record detected pointing ${cleanSub}.${cleanDom} to ${sanitizeDomain(appBaseUrl)}.`;
                              setCnameError(errMsg);
                              addToast(errMsg, "error");
                            }
                          } catch (e) {
                            const errMsg = `Unable to verify CNAME routing for ${cleanSub}.${cleanDom}`;
                            setCnameError(errMsg);
                            addToast(errMsg, "error");
                          } finally {
                            setCheckingCname(false);
                          }
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202028] px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282834] transition shadow-2xs cursor-pointer disabled:opacity-60"
                      >
                        {checkingCname ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                        )}
                        <span>{checkingCname ? "Verifying CNAME..." : "Verify CNAME Routing"}</span>
                      </button>

                      {cnameError && (
                        <p className={`text-xs flex items-center gap-1.5 ${
                          cnameVerified ? "text-blue-600 dark:text-blue-400 font-medium" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {cnameVerified ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Info className="h-3.5 w-3.5 shrink-0" />}
                          <span className="break-all">{cnameError}</span>
                        </p>
                      )}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-[#18181C] flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-[#222228] dark:text-zinc-300">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Enter your root domain above to view DNS records
                    </h6>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      You will prove ownership with one TXT record, then add a CNAME record to route traffic.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </div>
  );
});


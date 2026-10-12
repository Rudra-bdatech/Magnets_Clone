"use client";

import React, { useState, useMemo, useEffect, memo } from "react";
import {
  Globe,
  Check,
  Copy,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
} from "lucide-react";
import { type Account } from "@/lib/data";
import { getPlanLimits } from "@/lib/plan-limits";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  getDomainVerificationToken,
  formatCustomDomainUrl,
  formatFullHost,
  VERCEL_CNAME_TARGET,
} from "@/lib/domain-verify";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DisconnectDomainModal } from "./DisconnectDomainModal";

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
  userEmail?: string;
  userRole?: string;
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
  userEmail,
  userRole,
  onUpgradeClick,
}: DomainSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [hostingChallenge, setHostingChallenge] = useState<{ type: string; name: string; value: string } | null>(null);
  // UI-only state: domain editor visibility and DNS panel visibility
  const [isEditing, setIsEditing] = useState(false);
  const [showDns, setShowDns] = useState(() => !(domainVerified && cnameVerified && sslStatus === "active"));
  // If user has a saved domain, default to collapsed; if no domain yet, show input form
  const showEditPanel = isEditing || !rootDomain.trim();

  const handleDisconnectConfirm = async () => {
    try {
      const res = await fetch("/api/domain/verify", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to disconnect domain");
      }

      setRootDomain("");
      setPageSubdomain("get");
      setDomainVerified(false);
      setCnameVerified(false);
      setSslStatus("pending");
      setDomainError("");
      setCnameError("");
      setHostingChallenge(null);

      await handleSave({
        customDomain: "",
        customSubdomain: "",
        domainVerified: false,
        cnameVerified: false,
        sslStatus: "pending",
      });
      addToast("Custom domain disconnected and removed from edge routing successfully.", "info");
      setShowDisconnectModal(false);
    } catch (err: any) {
      addToast(err?.message || "Failed to disconnect domain. Please try again.", "error");
    }
  };

  // Plan limits & Custom domain lock check (Staff/Admin accounts bypass automatically)
  const planLimits = useMemo(() => getPlanLimits(userPlan, userEmail, userRole), [userPlan, userEmail, userRole]);
  const isCustomDomainLocked = !planLimits.customDomainAllowed;

  // Memoize derived computations
  const cleanDom = useMemo(() => sanitizeDomain(rootDomain), [rootDomain]);
  const cleanSub = useMemo(() => formatSubdomain(pageSubdomain), [pageSubdomain]);
  // BUG FIX #1: token is now per-user (includes userEmail) to prevent domain squatting
  const tokenValue = useMemo(() => getDomainVerificationToken(cleanDom, userEmail || ""), [cleanDom, userEmail]);
  const liveCustomUrl = useMemo(() => formatCustomDomainUrl(rootDomain, pageSubdomain), [rootDomain, pageSubdomain]);
  const fullCustomHost = useMemo(() => formatFullHost(rootDomain, pageSubdomain), [rootDomain, pageSubdomain]);
  const defaultShareUrl = useMemo(() => `${appBaseUrl}/${username}`, [appBaseUrl, username]);
  const cnamePointsTo = VERCEL_CNAME_TARGET;

  const copyToClipboard = (text: string, fieldKey: string, toastMessage?: string) => {
    if (!navigator?.clipboard) {
      addToast("Clipboard not available", "error");
      return;
    }
    // Only show copied feedback and toast AFTER the write succeeds
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      if (toastMessage) addToast(toastMessage, "info");
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      addToast("Failed to copy — please select and copy manually.", "error");
    });
  };

  // Step 1: TXT ownership check
  const handleCheckOwnership = async () => {
    if (isCustomDomainLocked) {
      if (onUpgradeClick) onUpgradeClick();
      addToast("Custom domains are a Pro feature. Please upgrade your plan.", "error");
      return;
    }
    // BUG FIX #10: validate domain format before hitting DNS
    if (!cleanDom || !cleanDom.includes(".")) {
      setDomainError("Please enter a valid domain (e.g. example.com or yourbrand.co.in)");
      addToast("Please enter a valid domain before checking ownership.", "error");
      return;
    }
    setCheckingDomain(true);
    setDomainError("");
    // Fix #5: AbortController gives a 15s hard timeout — no infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch("/api/domain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDom, subdomain: cleanSub }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.code === "PLAN_UPGRADE_REQUIRED") {
        if (onUpgradeClick) onUpgradeClick();
        setDomainError(data.error || "Custom domains require a Pro plan.");
        addToast(data.error || "Custom domains require a Pro plan.", "error");
        return;
      }
      if (typeof data.isVerified === "boolean") setDomainVerified(data.isVerified);
      if (typeof data.cnameVerified === "boolean") setCnameVerified(data.cnameVerified);
      if (data.sslStatus === "pending" || data.sslStatus === "active" || data.sslStatus === "failed") {
        setSslStatus(data.sslStatus);
      }
      setHostingChallenge(data.vercelChallenge?.value ? data.vercelChallenge : null);
      if (data.isVerified) {
        // The "Ownership Verified" badge handles the success state.
        setDomainError("");
        await handleSave({
          domainVerified: true,
          cnameVerified: Boolean(data.cnameVerified),
          sslStatus: data.sslStatus || "pending",
        });
        addToast(
          String(data.message || "").includes("unavailable")
            ? data.message
            : "🎉 Domain ownership verified successfully!",
          "success"
        );
      } else {
        const errMsg = data.error || data.message || `No TXT record found at leadmagnets-verify.${cleanDom}. DNS updates can take a few minutes.`;
        setDomainError(errMsg);
        addToast(errMsg, "error");
      }
    } catch (e: unknown) {
      const isTimeout = e instanceof Error && e.name === "AbortError";
      const errMsg = isTimeout
        ? "DNS check timed out (15s). Please try again."
        : `No TXT record found at leadmagnets-verify.${cleanDom}. Check your DNS provider.`;
      setDomainError(errMsg);
      addToast(errMsg, "error");
    } finally {
      clearTimeout(timeoutId);
      setCheckingDomain(false);
    }
  };

  // Step 2: CNAME routing check
  const handleVerifyCname = async () => {
    if (isCustomDomainLocked) {
      if (onUpgradeClick) onUpgradeClick();
      addToast("Custom domains are a Pro feature. Please upgrade your plan.", "error");
      return;
    }
    // Guard: Step 1 (TXT) must pass before Step 2 (CNAME) — prevents routing bypass
    if (!domainVerified) {
      addToast("Please complete Step 1 (TXT ownership check) before verifying CNAME routing.", "error");
      return;
    }
    setCheckingCname(true);
    setCnameError("");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);
    try {
      const res = await fetch("/api/domain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDom, subdomain: cleanSub }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.code === "PLAN_UPGRADE_REQUIRED") {
        if (onUpgradeClick) onUpgradeClick();
        setCnameError(data.error || "Custom domains require a Pro plan.");
        addToast(data.error || "Custom domains require a Pro plan.", "error");
        return;
      }
      if (typeof data.isVerified === "boolean") setDomainVerified(data.isVerified);
      if (typeof data.cnameVerified === "boolean") setCnameVerified(data.cnameVerified);
      if (data.sslStatus === "pending" || data.sslStatus === "active" || data.sslStatus === "failed") {
        setSslStatus(data.sslStatus);
      }
      setHostingChallenge(data.vercelChallenge?.value ? data.vercelChallenge : null);
      if (data.cnameVerified) {
        setCnameError("");
        await handleSave({
          cnameVerified: true,
          sslStatus: data.sslStatus || "pending",
        });
        addToast(
          data.sslStatus === "active"
            ? "🎉 CNAME routing verified and SSL is active!"
            : data.cnameMessage || "CNAME routing verified. SSL is still provisioning.",
          "success"
        );
      } else {
        const errMsg = data.error || data.cnameMessage || `No CNAME record detected pointing ${cleanSub}.${cleanDom} to ${cnamePointsTo}.`;
        setCnameError(errMsg);
        addToast(errMsg, "error");
      }
    } catch (e: unknown) {
      const isTimeout = e instanceof Error && e.name === "AbortError";
      const errMsg = isTimeout
        ? "CNAME check timed out. Wait a minute and click Verify CNAME again."
        : `Unable to verify CNAME routing for ${cleanSub}.${cleanDom}`;
      setCnameError(errMsg);
      addToast(errMsg, "error");
    } finally {
      clearTimeout(timeoutId);
      setCheckingCname(false);
    }
  };

  // Refresh runs whichever step is next: TXT ownership first, then CNAME routing
  const isRefreshing = checkingDomain || checkingCname;
  const handleRefresh = () => (domainVerified ? handleVerifyCname() : handleCheckOwnership());

  const isLive = domainVerified && cnameVerified && sslStatus === "active";

  // Once fully live, collapse the DNS records (still viewable via the toggle)
  useEffect(() => {
    setShowDns(!isLive);
  }, [isLive]);
  const status = !domainVerified
    ? { label: "Verification Required", tone: "error" as const }
    : !cnameVerified
      ? { label: "Invalid Configuration", tone: "error" as const }
      : sslStatus !== "active"
        ? { label: sslStatus === "failed" ? "SSL Failed" : "Generating SSL Certificate", tone: sslStatus === "failed" ? ("error" as const) : ("warning" as const) }
        : { label: "Valid Configuration", tone: "success" as const };

  const badgeTone = {
    error: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    warning: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    success: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    brand: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]",
    purple: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  };
  const badgeBase = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap";

  const btnSecondary =
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 h-8 text-[13px] font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-[#0E0E10] dark:text-white dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2] focus-visible:ring-offset-1";
  const inputClass =
    "w-full rounded-md border border-zinc-200 bg-white px-3 h-9 text-[13px] font-mono text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] focus:ring-2 focus:ring-[#0066B2]/15 dark:border-white/10 dark:bg-[#0E0E10] dark:text-white dark:placeholder:text-zinc-600 transition";

  const copyIcon = (text: string, fieldKey: string, toastMessage: string, label: string) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, fieldKey, toastMessage)}
      aria-label={label}
      title="Copy"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/10 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2]"
    >
      {copiedField === fieldKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  const dnsRows: { key: string; type: string; name: string; value: string; nameKey: string; valueKey: string; nameToast: string; valueToast: string; done?: boolean }[] = [
    { key: "txt", type: "TXT", name: "leadmagnets-verify", value: tokenValue, nameKey: "host", valueKey: "value", nameToast: "TXT host copied!", valueToast: "TXT token value copied!", done: domainVerified },
    { key: "cname", type: "CNAME", name: cleanSub, value: cnamePointsTo, nameKey: "cnameHost", valueKey: "cnameValue", nameToast: "CNAME host copied!", valueToast: "CNAME target value copied!", done: cnameVerified },
  ];
  if (hostingChallenge) {
    dnsRows.push({
      key: "vercel",
      type: hostingChallenge.type,
      name: hostingChallenge.name,
      value: hostingChallenge.value,
      nameKey: "vercelHost",
      valueKey: "vercelValue",
      nameToast: "Host name copied",
      valueToast: "Record value copied",
    });
  }

  const activeError = !domainVerified ? domainError : cnameError;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0A0A0B] overflow-hidden">

      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-white/10">
        <h4 className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
          Domains
          <InfoTooltip
            content="Share your lead magnets directly or connect a white-label custom domain."
            title="Public URL & Custom Domain"
            align="start"
          />
        </h4>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          Your public workspace URL and custom domains for your lead magnets.
        </p>
      </div>

      {/* Default workspace URL */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-white/10">
        <label htmlFor="domain-username-input" className="block text-[13px] font-medium text-zinc-900 dark:text-white mb-2">
          Workspace URL
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-1 min-w-0 h-9 rounded-md border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0E0E10] focus-within:border-[#0066B2] focus-within:ring-2 focus-within:ring-[#0066B2]/15 transition overflow-hidden">
            <span className="flex items-center select-none border-r border-zinc-200 bg-zinc-50 px-3 text-[13px] font-mono text-zinc-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 shrink-0 max-w-[55%] truncate">
              {appBaseUrl}/
            </span>
            <input
              id="domain-username-input"
              type="text"
              value={username}
              autoComplete="off"
              onChange={(e) => {
                markDirty("username");
                setUsername(e.target.value);
              }}
              onBlur={() => handleSave()}
              className="w-full bg-transparent px-3 text-[13px] font-mono text-zinc-900 outline-none focus-visible:outline-none dark:text-white placeholder:text-zinc-400 min-w-0"
              placeholder="your-workspace"
            />
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(defaultShareUrl, "shareUrl", "Default workspace URL copied!")}
            className={`${btnSecondary} h-9 shrink-0`}
          >
            {copiedField === "shareUrl" ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {/* Custom domain header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
        <button
          type="button"
          onClick={onToggleCustomDomain}
          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
        >
          <span className="text-[13px] font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
            Custom Domain
            <InfoTooltip
              content="Connect your custom brand domain (e.g. get.yourdomain.com) to your lead magnets."
              title="Custom Domain Configuration"
              align="start"
            />
          </span>
          {planLimits.badge === "Internal Staff Access" ? (
            <span className={`${badgeBase} ${badgeTone.purple}`}>
              <ShieldCheck className="h-3 w-3" />
              Internal Staff Access
            </span>
          ) : isCustomDomainLocked ? (
            <span className={`${badgeBase} ${badgeTone.warning}`}>
              <Lock className="h-3 w-3" />
              Pro
            </span>
          ) : cnameVerified ? (
            <span className={`${badgeBase} ${badgeTone.success}`}>Live</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onToggleCustomDomain}
          aria-expanded={isCustomDomainOpen}
          aria-controls="custom-domain-body"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2]"
          title={isCustomDomainOpen ? "Collapse section" : "Expand section"}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCustomDomainOpen ? "rotate-180" : ""}`} />
          <span className="sr-only">{isCustomDomainOpen ? "Collapse" : "Expand"} Custom Domain section</span>
        </button>
      </div>

      {isCustomDomainOpen && (
        <div id="custom-domain-body" className="px-4 sm:px-6 pb-5 space-y-4">

          {/* Paywall */}
          {isCustomDomainLocked && (
            <div className="rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                    Connect your custom domain (e.g. get.yourbrand.com)
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Upgrade to the Pro plan to publish lead magnets on your branded subdomain with automated SSL certificates, high-speed CNAME routing, and zero LeadMagnets branding.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onUpgradeClick) {
                    onUpgradeClick();
                  } else {
                    addToast("Please upgrade to Pro to unlock custom domains.", "info");
                  }
                }}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0066B2] hover:bg-[#005291] px-4 h-9 text-[13px] font-medium text-white transition-colors cursor-pointer"
              >
                <span>Upgrade to Pro (₹1,999/mo)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Domain card (Vercel-style) */}
          {(rootDomain.trim() || showEditPanel) && (
            <div className="rounded-lg border border-zinc-200 dark:border-white/10 overflow-hidden">
              {rootDomain.trim() ? (
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 p-4">
                {/* Left: host + status */}
                <div className="flex items-start gap-3 min-w-0 md:flex-1">
                  <span className="mt-0.5 shrink-0">
                    {isLive ? (
                      <CheckCircle2 className="h-5 w-5 text-[#0066B2] dark:text-[#38BDF8]" />
                    ) : status.tone === "warning" ? (
                      <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {cnameVerified ? (
                        <a
                          href={liveCustomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-zinc-900 dark:text-white hover:underline truncate"
                        >
                          {fullCustomHost}
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{fullCustomHost}</span>
                      )}
                      {cnameVerified && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className={`${badgeBase} ${badgeTone[status.tone]}`}>{status.label}</span>
                      <button
                        type="button"
                        onClick={() => setShowDns((v) => !v)}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
                      >
                        {showDns ? "Hide" : "View"} DNS configuration
                        {showDns ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle: SSL state */}
                <div className="flex items-center gap-1.5 text-[13px] font-mono text-zinc-500 dark:text-zinc-400 md:w-40 shrink-0">
                  {sslStatus === "active" ? (
                    <>
                      <Lock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>HTTPS</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{sslStatus === "failed" ? "SSL failed" : "SSL pending"}</span>
                    </>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isCustomDomainLocked}
                    aria-busy={isRefreshing}
                    title={domainVerified ? "Verify CNAME routing" : "Check ownership (TXT)"}
                    className={btnSecondary}
                  >
                    {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    {isRefreshing ? "Checking" : "Refresh"}
                  </button>
                  <button type="button" onClick={() => setIsEditing((v) => !v)} className={btnSecondary}>
                    {showEditPanel && rootDomain.trim() ? "Close" : "Edit"}
                  </button>
                </div>
              </div>
              ) : null}

              {/* Edit panel */}
              {showEditPanel ? (
                <div className={`p-4 space-y-4 ${rootDomain.trim() ? "border-t border-zinc-200 dark:border-white/10" : ""} ${isCustomDomainLocked ? "opacity-60" : ""}`}>
                  <div>
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Domain
                      {isCustomDomainLocked && <Lock className="h-3 w-3 text-amber-500" />}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-44 shrink-0">
                  <input
                    type="text"
                    disabled={isCustomDomainLocked}
                    value={pageSubdomain}
                    onChange={(e) => {
                      if (isCustomDomainLocked) return;
                      const val = e.target.value;
                      markDirty("customSubdomain");
                      setPageSubdomain(val);
                      // Invalidate CNAME routing state if subdomain prefix changed
                      if (formatSubdomain(val) !== cleanSub) {
                        setCnameVerified(false);
                        setSslStatus("pending");
                        setCnameError("");
                      }
                    }}
                    onBlur={() => !isCustomDomainLocked && handleSave()}
                    placeholder="get"
                    className={`${inputClass} ${isCustomDomainLocked ? "cursor-not-allowed" : ""}`}
                  />
                      </div>
                      <span className="hidden sm:block text-sm font-mono text-zinc-400">.</span>
                      <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    disabled={isCustomDomainLocked}
                    value={rootDomain}
                    onChange={(e) => {
                      if (isCustomDomainLocked) return;
                      const val = e.target.value;
                      markDirty("customDomain");
                      setRootDomain(val);
                      // Invalidate previous verification state if domain string changed
                      if (sanitizeDomain(val) !== cleanDom) {
                        setDomainVerified(false);
                        setCnameVerified(false);
                        setSslStatus("pending");
                        setDomainError("");
                        setCnameError("");
                      }
                    }}
                    onBlur={() => !isCustomDomainLocked && handleSave()}
                    placeholder={isCustomDomainLocked ? "yourdomain.com (Requires Pro Plan)" : "example.com"}
                    className={`${inputClass} ${isCustomDomainLocked ? "cursor-not-allowed" : ""}`}
                  />
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-500">
                      Subdomain (e.g. get, access, guide) and root domain without http:// or paths (e.g. coachassist.co.in)
                    </p>
                  </div>
                  {rootDomain.trim() ? (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDisconnectModal(true)}
                        aria-label={`Disconnect custom domain ${fullCustomHost}`}
                        className="inline-flex items-center justify-center rounded-md bg-rose-600 hover:bg-rose-700 px-4 h-9 text-[13px] font-medium text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center justify-center rounded-md bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:hover:bg-zinc-200 px-4 h-9 text-[13px] font-medium text-white dark:text-zinc-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2] focus-visible:ring-offset-1"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      You&apos;ll prove ownership with one TXT record, then add a CNAME record to route traffic.
                    </p>
                  )}
                </div>
              ) : null}

              {/* DNS configuration */}
              {rootDomain.trim() && !isEditing && showDns ? (
                <div className="border-t border-zinc-200 dark:border-white/10 p-4 space-y-3">
                  <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-white/10">
                    <span className="-mb-px border-b-2 border-zinc-900 dark:border-white pb-2 text-[13px] font-medium text-zinc-900 dark:text-white">
                      DNS Records
                    </span>
                  </div>

                  <p className="text-[13px] text-zinc-600 dark:text-zinc-300">
                    {isLive
                      ? "Your DNS records are set up correctly and your domain is live. Keep these records in place — removing them will disconnect your domain."
                      : "Update the DNS records at your provider to match the records below, then click Refresh."}
                  </p>

                  {hostingChallenge && (
                    <div className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[13px] text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        One more DNS record is required by the host. Add this {hostingChallenge.type} record at{" "}
                        <code className="font-mono">{hostingChallenge.name}</code>, wait a minute, then click Refresh. Without it the host returns DEPLOYMENT_NOT_FOUND.
                      </p>
                    </div>
                  )}

                  {activeError && (
                    <div role="alert" aria-live="polite" className="flex items-start gap-2.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="break-all">{activeError}</p>
                    </div>
                  )}

                  <div className="rounded-md border border-zinc-200 dark:border-white/10 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400">
                          <th className="px-4 py-2.5 font-medium w-20">Type</th>
                          <th className="px-4 py-2.5 font-medium w-56">Name</th>
                          <th className="px-4 py-2.5 font-medium">Value</th>
                          <th className="px-4 py-2.5 font-medium w-10"><span className="sr-only">Status</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dnsRows.map((row) => (
                          <tr key={row.key} className="border-b last:border-b-0 border-zinc-200 dark:border-white/10">
                            <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{row.type}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 font-mono text-zinc-900 dark:text-zinc-100">
                                <span className="truncate select-all max-w-[180px]" title={row.name}>{row.name}</span>
                                {copyIcon(row.name, row.nameKey, row.nameToast, `Copy ${row.type} name`)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 font-mono text-zinc-900 dark:text-zinc-100">
                                <span className="break-all select-all">{row.value}</span>
                                {copyIcon(row.value, row.valueKey, row.valueToast, `Copy ${row.type} value`)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {row.done && <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Verified" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-md bg-zinc-50 dark:bg-white/[0.03] px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      Verify ownership with the TXT record first, then the CNAME routes traffic. Using Cloudflare? Set proxy to{" "}
                      <strong className="font-medium text-zinc-700 dark:text-zinc-200">DNS only (Grey Cloud)</strong>.
                    </span>
                  </div>
                  <div className="rounded-md bg-zinc-50 dark:bg-white/[0.03] px-3 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                    DNS changes can take time to propagate.
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>
      )}

      {/* Destructive Disconnect Domain Modal */}
      <DisconnectDomainModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnectConfirm}
        domainName={cleanDom}
        fullHost={fullCustomHost}
        isVerified={domainVerified || cnameVerified}
      />

    </div>
  );
});

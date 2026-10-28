"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plug, ChevronDown, User, CheckCircle2, ArrowRight, Check, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncWithDatabase, saveAccount, loadAccount } from "@/lib/store";
import { type Account, getAppUrl } from "@/lib/data";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  formatFullHost,
} from "@/lib/domain-verify";

import { DomainSection } from "@/components/integration/DomainSection";
import { AutomationsSection } from "@/components/integration/AutomationsSection";
import { AnalyticsSection } from "@/components/integration/AnalyticsSection";
import { BrandingSection } from "@/components/integration/BrandingSection";
import { HelpModal } from "@/components/integration/HelpModal";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { useToast, IntegrationToastContainer } from "@/components/integration/IntegrationToast";
import { isReservedUsername } from "@/lib/reserved-usernames";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useSidebar } from "@/components/dashboard/dashboard-shell";

export default function WorkspaceSetupPage() {
  const { isCollapsed } = useSidebar();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [username, setUsername] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [rootDomain, setRootDomain] = useState("");
  const [pageSubdomain, setPageSubdomain] = useState("get");
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [checkingCname, setCheckingCname] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);
  const [cnameVerified, setCnameVerified] = useState(false);
  const [sslStatus, setSslStatus] = useState<"pending" | "active" | "failed">("pending");
  const [domainError, setDomainError] = useState("");
  const [cnameError, setCnameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [appBaseUrl, setAppBaseUrl] = useState("https://magnets.bdatech.in");

  const [ga4MeasurementId, setGa4MeasurementId] = useState("");
  const [metaPixelId, setMetaPixelId] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [substackPublication, setSubstackPublication] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Toast System
  const { toasts, addToast, removeToast } = useToast();

  // Track modified fields & mounted state to prevent background sync from overwriting active user edits
  const dirtyFieldsRef = useRef<Set<string>>(new Set());
  const accountRef = useRef<Account | null>(null);
  const isMountedRef = useRef(true);

  accountRef.current = account;

  const markDirty = (field: string) => {
    dirtyFieldsRef.current.add(field);
  };

  useEffect(() => {
    setAppBaseUrl(getAppUrl());
  }, []);

  // Accordions
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "public-url": true,
    "custom-domain": true,
    "connections": false,
    "slack-webhook": false,
    "zapier-webhook": false,
    "pipedrive-webhook": false,
    "kit-webhook": false,
    "legal-links": false,
    "newsletter": false,
    "analytics-tracking": false,
    "branding-preview": false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Instant local hydration (frame 0)
    const localAccount = loadAccount();
    if (localAccount && isMountedRef.current) {
      setAccount(localAccount);
      accountRef.current = localAccount;
      if (!dirtyFieldsRef.current.has("username")) setUsername(localAccount.username || "");
      if (!dirtyFieldsRef.current.has("privacyPolicy")) setPrivacyPolicy(localAccount.privacyPolicy || "");
      if (!dirtyFieldsRef.current.has("termsOfService")) setTermsOfService(localAccount.termsOfService || "");
      if (!dirtyFieldsRef.current.has("customDomain") && localAccount.customDomain) setRootDomain(localAccount.customDomain);
      if (!dirtyFieldsRef.current.has("customSubdomain") && localAccount.customSubdomain) setPageSubdomain(localAccount.customSubdomain);
      if (!dirtyFieldsRef.current.has("domainVerified") && localAccount.domainVerified !== undefined) setDomainVerified(localAccount.domainVerified);
      if (!dirtyFieldsRef.current.has("cnameVerified") && localAccount.cnameVerified !== undefined) setCnameVerified(localAccount.cnameVerified);
      if (!dirtyFieldsRef.current.has("sslStatus") && localAccount.sslStatus) setSslStatus(localAccount.sslStatus);
      if (!dirtyFieldsRef.current.has("ga4MeasurementId") && localAccount.ga4MeasurementId) setGa4MeasurementId(localAccount.ga4MeasurementId);
      if (!dirtyFieldsRef.current.has("metaPixelId") && localAccount.metaPixelId) setMetaPixelId(localAccount.metaPixelId);
      if (!dirtyFieldsRef.current.has("faviconUrl") && localAccount.faviconUrl) setFaviconUrl(localAccount.faviconUrl);
      if (!dirtyFieldsRef.current.has("ogImageUrl") && localAccount.ogImageUrl) setOgImageUrl(localAccount.ogImageUrl);
      if (!dirtyFieldsRef.current.has("substackPublication") && localAccount.substackPublication) setSubstackPublication(localAccount.substackPublication);
    }
    setLoading(false);
    setIsLoaded(true);

    // 2. Background database sync (seamlessly merge server data without overwriting active edits)
    syncWithDatabase().then((data) => {
      if (!isMountedRef.current || !data?.account) return;
      const srv = data.account;

      setAccount((prev) => {
        const merged = { ...(prev || {}), ...srv };
        accountRef.current = merged;
        return merged;
      });

      if (!dirtyFieldsRef.current.has("username") && srv.username) setUsername(srv.username);
      if (!dirtyFieldsRef.current.has("privacyPolicy") && srv.privacyPolicy !== undefined) setPrivacyPolicy(srv.privacyPolicy || "");
      if (!dirtyFieldsRef.current.has("termsOfService") && srv.termsOfService !== undefined) setTermsOfService(srv.termsOfService || "");
      if (!dirtyFieldsRef.current.has("customDomain") && srv.customDomain !== undefined) setRootDomain(srv.customDomain || "");
      if (!dirtyFieldsRef.current.has("customSubdomain") && srv.customSubdomain !== undefined) setPageSubdomain(srv.customSubdomain || "get");
      if (!dirtyFieldsRef.current.has("domainVerified") && srv.domainVerified !== undefined) setDomainVerified(srv.domainVerified);
      if (!dirtyFieldsRef.current.has("cnameVerified") && srv.cnameVerified !== undefined) setCnameVerified(srv.cnameVerified);
      if (!dirtyFieldsRef.current.has("sslStatus") && srv.sslStatus) setSslStatus(srv.sslStatus);
      if (!dirtyFieldsRef.current.has("ga4MeasurementId") && srv.ga4MeasurementId !== undefined) setGa4MeasurementId(srv.ga4MeasurementId || "");
      if (!dirtyFieldsRef.current.has("metaPixelId") && srv.metaPixelId !== undefined) setMetaPixelId(srv.metaPixelId || "");
      if (!dirtyFieldsRef.current.has("faviconUrl") && srv.faviconUrl !== undefined) setFaviconUrl(srv.faviconUrl || "");
      if (!dirtyFieldsRef.current.has("ogImageUrl") && srv.ogImageUrl !== undefined) setOgImageUrl(srv.ogImageUrl || "");
      if (!dirtyFieldsRef.current.has("substackPublication") && srv.substackPublication !== undefined) setSubstackPublication(srv.substackPublication || "");
    }).catch((err) => {
      console.warn("Background integration sync error:", err);
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 3. Handle return from payment gateway (Chargebee / Stripe)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment");
      if (paymentStatus === "success") {
        setShowSuccessModal(true);
        addToast("🎉 Pro Plan Activated! Custom domains are now unlocked.", "success");
        window.history.replaceState({}, "", window.location.pathname);
        // Force database refresh to immediately unlock the custom domain section
        syncWithDatabase().then((data) => {
          if (data?.account && isMountedRef.current) {
            setAccount(data.account);
            accountRef.current = data.account;
          }
        });
      } else if (paymentStatus === "pending" || paymentStatus === "stripe_success") {
        // Paid, but the upgrade is applied by the payment webhook. Poll until the plan flips.
        window.history.replaceState({}, "", window.location.pathname);
        addToast("Payment received. Confirming your upgrade…", "info");
        let attempts = 0;
        const poll = async () => {
          if (!isMountedRef.current) return;
          attempts++;
          const data = await syncWithDatabase().catch(() => null);
          if (!isMountedRef.current) return;
          if (data?.account && ["Pro", "Growth", "Unlimited"].includes(String(data.account.plan))) {
            setAccount(data.account);
            accountRef.current = data.account;
            setShowSuccessModal(true);
            addToast("🎉 Pro Plan Activated! Custom domains are now unlocked.", "success");
          } else if (attempts < 12) {
            setTimeout(poll, 5000);
          } else {
            addToast("Your payment is still being confirmed. Refresh in a few minutes. If Pro doesn't appear, contact support.", "info");
          }
        };
        setTimeout(poll, 2000);
      } else if (paymentStatus === "stripe_cancelled") {
        addToast("Checkout was cancelled. You have not been charged.", "info");
        window.history.replaceState({}, "", window.location.pathname);
      } else if (paymentStatus === "error") {
        addToast("Payment was cancelled or could not be completed.", "error");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [addToast]);

  const normalizeHttpUrl = (url: string): string => {
    const trimmed = (url || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^[a-z0-9+.-]+:/i.test(trimmed)) return "";
    return `https://${trimmed}`;
  };

  const handleSave = async (overrides?: Partial<Account>) => {
    const currentAcc = accountRef.current;
    const email = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || currentAcc?.email || "";
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanUsername) return;
    if (isReservedUsername(cleanUsername)) {
      addToast(`The username "${cleanUsername}" is reserved. Please choose another.`, "error");
      return;
    }

    setSaving(true);
    const defaultAccountBase: Account = {
      name: "Workspace",
      email: email || "",
      username: cleanUsername,
      plan: "Free" as const,
      brandColor: "#0066B2",
      logo: null,
      joinedAt: "Just now",
    };

    const updatedAccount: Account = {
      ...defaultAccountBase,
      ...(currentAcc || {}),
      email: email || currentAcc?.email || "",
      username: cleanUsername,
      brandColor: currentAcc?.brandColor || "#0066B2",
      logo: currentAcc?.logo ?? null,
      joinedAt: currentAcc?.joinedAt || "Just now",
      privacyPolicy: normalizeHttpUrl(overrides?.privacyPolicy !== undefined ? overrides.privacyPolicy : privacyPolicy),
      termsOfService: normalizeHttpUrl(overrides?.termsOfService !== undefined ? overrides.termsOfService : termsOfService),
      customDomain: sanitizeDomain(overrides?.customDomain !== undefined ? overrides.customDomain : rootDomain),
      customSubdomain: formatSubdomain(overrides?.customSubdomain !== undefined ? overrides.customSubdomain : pageSubdomain),
      domainVerified: overrides?.domainVerified !== undefined ? overrides.domainVerified : domainVerified,
      cnameVerified: overrides?.cnameVerified !== undefined ? overrides.cnameVerified : cnameVerified,
      sslStatus: overrides?.sslStatus || sslStatus,
      ga4MeasurementId: (overrides?.ga4MeasurementId !== undefined ? overrides.ga4MeasurementId : ga4MeasurementId).trim(),
      metaPixelId: (overrides?.metaPixelId !== undefined ? overrides.metaPixelId : metaPixelId).trim(),
      faviconUrl: (overrides?.faviconUrl !== undefined ? overrides.faviconUrl : faviconUrl).trim(),
      ogImageUrl: (overrides?.ogImageUrl !== undefined ? overrides.ogImageUrl : ogImageUrl).trim(),
      substackPublication: (overrides?.substackPublication !== undefined ? overrides.substackPublication : substackPublication).trim(),
      // NOTE: do NOT spread overrides here again — each field above already applies overrides
      // Spreading overrides at the end would bypass sanitizeDomain() / formatSubdomain() and
      // write raw, unsanitized values (e.g. "https://example.com") straight to the database.
    };

    try {
      const res = await saveAccount(updatedAccount);
      if (res.success && res.account) {
        setAccount(res.account);
        accountRef.current = res.account;
        if (res.account.username) {
          setUsername(res.account.username);
        }
      } else {
        setAccount(updatedAccount);
        accountRef.current = updatedAccount;
      }
    } catch (err) {
      console.error("Save account error:", err);
      addToast("Failed to save changes. Please check your connection and try again.", "error");
      setAccount(updatedAccount);
      accountRef.current = updatedAccount;
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/40 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0a0a0a]">
        <div className={`flex-1 px-3.5 sm:px-6 py-4 sm:py-6 lg:px-8 mx-auto w-full transition-[max-width] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[max-width] ${isCollapsed ? "max-w-[1440px]" : "max-w-7xl"}`}>

          {/* Page heading & status */}
          <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              Integration
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs font-normal text-zinc-500 hover:bg-zinc-200 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
                title="Help: What belongs in Integration?"
              >
                ?
              </button>
            </h2>

            {/* Public URL ready status card */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#0066B2]/15 bg-white/90 dark:border-white/[0.08] dark:bg-[#171717]/90 px-3.5 sm:px-4 py-2 sm:py-2.5 shrink-0 shadow-md dark:shadow-none backdrop-blur-sm w-full sm:w-auto">
              <span className={`h-2 w-2 rounded-full ${cnameVerified || domainVerified ? "bg-emerald-500" : "bg-amber-500"} shrink-0`} />
              <div className="min-w-0 flex-1 sm:flex-initial">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    {cnameVerified ? "Custom Domain Active" : "Public URL ready"}
                  </p>
                  {cnameVerified && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      SSL Active ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate max-w-[260px] sm:max-w-xs">
                  {cnameVerified && rootDomain
                    ? formatFullHost(rootDomain, pageSubdomain)
                    : `${appBaseUrl}/${username}`}
                </p>
              </div>
            </div>
          </div>

          {/* Decomposed Components */}
          <div className="space-y-4">

            {/* 1. Public URL & Custom Domain Section */}
            <DomainSection
              appBaseUrl={appBaseUrl}
              username={username}
              setUsername={setUsername}
              rootDomain={rootDomain}
              setRootDomain={setRootDomain}
              pageSubdomain={pageSubdomain}
              setPageSubdomain={setPageSubdomain}
              domainVerified={domainVerified}
              setDomainVerified={setDomainVerified}
              cnameVerified={cnameVerified}
              setCnameVerified={setCnameVerified}
              sslStatus={sslStatus}
              setSslStatus={setSslStatus}
              domainError={domainError}
              setDomainError={setDomainError}
              cnameError={cnameError}
              setCnameError={setCnameError}
              checkingDomain={checkingDomain}
              setCheckingDomain={setCheckingDomain}
              checkingCname={checkingCname}
              setCheckingCname={setCheckingCname}
              isCustomDomainOpen={openSections["custom-domain"] ?? true}
              onToggleCustomDomain={() => toggle("custom-domain")}
              markDirty={markDirty}
              handleSave={handleSave}
              addToast={addToast}
              userPlan={account?.plan || "Free"}
              userEmail={account?.email}
              userRole={account?.role}
              onUpgradeClick={() => setShowUpgradeModal(true)}
            />

            {/* 2. Optional connections wrapper (Automations) */}
            <div id="connections-section" className="rounded-2xl border border-[#0066B2]/15 bg-white/90 dark:border-white/[0.08] dark:bg-[#171717] shadow-md dark:shadow-none backdrop-blur-sm transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => toggle("connections")}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-[#EFF6FF] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                    <Plug className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white leading-snug">
                      Optional automations{" "}
                      <span className="inline-block align-middle -translate-y-[1px] ml-1">
                        <InfoTooltip
                          content="Sync new signups directly to your external tools (Slack, Zapier, Kit, Pipedrive, Substack)."
                          title="Optional Automations"
                          align="start"
                        />
                      </span>
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16a34a] dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Ready
                  </span>
                  <ChevronDown className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${openSections["connections"] ? "rotate-180" : ""}`} />
                </div>
              </button>
              {openSections["connections"] && (
                <div className="border-t border-[#0066B2]/10 bg-white/50 dark:border-white/[0.06] dark:bg-[#121212]/50 px-5 py-5 space-y-6">
                  {/* Automations (Slack, Zapier, Pipedrive, Kit, Substack) */}
                  <AutomationsSection
                    account={account}
                    setAccount={setAccount}
                    openSections={openSections}
                    toggle={toggle}
                    markDirty={markDirty}
                    handleSave={handleSave}
                    substackPublication={substackPublication}
                    setSubstackPublication={setSubstackPublication}
                    addToast={addToast}
                  />
                </div>

              )}
            </div>

            {/* 3. Legal Links & Social Preview / Favicon Branding Section */}
            <BrandingSection
              rootDomain={rootDomain}
              privacyPolicy={privacyPolicy}
              setPrivacyPolicy={setPrivacyPolicy}
              termsOfService={termsOfService}
              setTermsOfService={setTermsOfService}
              faviconUrl={faviconUrl}
              setFaviconUrl={setFaviconUrl}
              ogImageUrl={ogImageUrl}
              setOgImageUrl={setOgImageUrl}
              openSections={openSections}
              toggle={toggle}
              markDirty={markDirty}
              handleSave={handleSave}
              addToast={addToast}
            />

            {/* 4. Analytics & Ad Conversion Tracking Section */}
            <AnalyticsSection
              ga4MeasurementId={ga4MeasurementId}
              setGa4MeasurementId={setGa4MeasurementId}
              metaPixelId={metaPixelId}
              setMetaPixelId={setMetaPixelId}
              isOpen={openSections["analytics-tracking"] ?? true}
              onToggle={() => toggle("analytics-tracking")}
              markDirty={markDirty}
              handleSave={handleSave}
              addToast={addToast}
            />

          </div>

        </div>
      </div>

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setShowUpgradeModal(false);
          addToast("🎉 Pro subscription activated! Custom domains unlocked.", "success");
          syncWithDatabase().then((fresh) => {
            if (fresh?.account) setAccount(fresh.account);
          });
        }}
        currentPlan={account?.plan || "Free"}
        featureHighlight="Custom Domains & Subdomains"
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Production-Ready Payment Success Celebration Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/30 bg-white dark:bg-[#171717] text-zinc-900 dark:text-white shadow-2xl z-10 p-6 sm:p-7 text-center my-8"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Glowing Success Badge */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 animate-in zoom-in-75 duration-300" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Payment Successful! 🎉
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Your payment was received and your account has been upgraded to <strong className="text-zinc-900 dark:text-white">Pro Lifetime</strong>!
              </p>

              {/* Receipt Summary Box */}
              <div className="mt-5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Plan</span>
                  <span className="font-bold text-zinc-900 dark:text-white">Magnets Pro (Lifetime)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Payment Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" /> Paid & Active
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200 dark:border-white/10 font-bold">
                  <span className="text-zinc-900 dark:text-white">Total Amount</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹4,999 One-Time</span>
                </div>
              </div>

              {/* Features Unlocked Checklist */}
              <div className="mt-4 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                  Features Unlocked:
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Custom Root & Subdomains</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Remove All Platform Watermarks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Up to 2,500 Leads / month (5x capacity)</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    const el = document.getElementById("custom-domain-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0066B2] hover:bg-[#005291] active:scale-[0.98] text-xs font-bold text-white shadow-md shadow-[#0066B2]/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Configure Custom Domain Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification Container */}
      <IntegrationToastContainer
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </>
  );
}

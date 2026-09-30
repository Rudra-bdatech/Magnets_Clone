"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Sparkles, Plug, ChevronDown } from "lucide-react";
import { syncWithDatabase, saveAccount, loadAccount } from "@/lib/store";
import { type Account, getAppUrl } from "@/lib/data";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  formatFullHost,
} from "@/lib/domain-verify";

import { DomainSection } from "@/components/integration/DomainSection";
import { EmailSchedulingSection } from "@/components/integration/EmailSchedulingSection";
import { AutomationsSection } from "@/components/integration/AutomationsSection";
import { AnalyticsSection } from "@/components/integration/AnalyticsSection";
import { BrandingSection } from "@/components/integration/BrandingSection";
import { HelpModal } from "@/components/integration/HelpModal";
import { useToast, IntegrationToastContainer } from "@/components/integration/IntegrationToast";

export default function WorkspaceSetupPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
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
  const [appBaseUrl, setAppBaseUrl] = useState("https://magnets-jade.vercel.app");

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
    "sender-domain": false,
    "calendar-booking": false,
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
        const merged = { ...srv, ...(prev || {}) };
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

  const handleSave = async (overrides?: Partial<Account>) => {
    const currentAcc = accountRef.current;
    const email = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || currentAcc?.email || "";
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanUsername) return;

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
      privacyPolicy: (overrides?.privacyPolicy !== undefined ? overrides.privacyPolicy : privacyPolicy).trim(),
      termsOfService: (overrides?.termsOfService !== undefined ? overrides.termsOfService : termsOfService).trim(),
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
      ...overrides,
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
      setAccount(updatedAccount);
      accountRef.current = updatedAccount;
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell account={account} title="Integration">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#F8FBFF] dark:bg-[#0E0E10]">
        <div className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 lg:px-8 max-w-7xl mx-auto w-full">

          {/* Page heading */}
          <div className="mb-5 sm:mb-6">
            <h2 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              Integration
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs font-normal text-zinc-500 hover:bg-zinc-200 dark:border-[#2e2e38] dark:text-[#9B9085] dark:hover:bg-[#18181B] dark:hover:text-white transition cursor-pointer"
                title="Help: What belongs in Integration?"
              >
                ?
              </button>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
              Manage your publishing address,{" "}
              <span className="text-[#0066B2] font-semibold">email delivery</span>, and{" "}
              <span className="text-[#0066B2] font-semibold">connections</span>
            </p>
          </div>

          {/* Workspace Essentials banner */}
          <div
            className="conversion-banner-bg relative mb-5 overflow-hidden rounded-2xl border border-[#0066B2]/30 bg-white p-4 sm:p-6 lg:py-7 lg:px-8 shadow-sm dark:border-[#0066B2]/35 dark:bg-[#18181C] transition-colors"
          >
            {/* Badge */}
            <div className="mb-3 sm:mb-4 flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0066B2]/30 bg-[#EFF6FF] px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#0066B2] dark:border-[#0066B2]/40 dark:bg-[#0066B2]/15 dark:text-[#38BDF8]">
                <Sparkles className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] fill-[#0066B2]/20" />
                WORKSPACE ESSENTIALS
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-lg">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5 sm:mb-2">
                  Set up once, then get back to creating
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#9B9085]/90 leading-relaxed">
                  Your LeadMagnets URL is the only required setting. Domains and integrations stay out
                  of the way until you need them.
                </p>
              </div>

              {/* Public URL ready status card */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#0066B2]/30 bg-white/80 dark:border-[#0066B2]/35 dark:bg-[#0E0E10]/70 px-3.5 sm:px-4 py-2.5 sm:py-3 shrink-0 shadow-sm dark:shadow-none w-full sm:w-auto">
                <span className={`h-2 w-2 rounded-full ${cnameVerified || domainVerified ? "bg-emerald-500" : "bg-amber-500"} shrink-0`} />
                <div className="min-w-0 flex-1 sm:flex-initial">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {cnameVerified ? "Custom Domain Active" : "Public URL ready"}
                    </p>
                    {cnameVerified && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        SSL Active ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 font-mono truncate max-w-[260px] sm:max-w-xs">
                    {cnameVerified && rootDomain
                      ? formatFullHost(rootDomain, pageSubdomain)
                      : `${appBaseUrl}/${username}`}
                  </p>
                </div>
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
            />

            {/* 2. Optional connections wrapper (Email & Scheduling + Automations) */}
            <div id="connections-section" className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
              <button
                type="button"
                onClick={() => toggle("connections")}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8]">
                    <Plug className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Optional connections</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Your page and first email work without these. Add a connection only when it helps your workflow.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16a34a] dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Email ready
                  </span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["connections"] ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </button>
              {openSections["connections"] && (
                <div className="border-t border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#0E0E10]/50 px-5 py-5 space-y-6">
                  {/* Email and Calendar scheduling sub-section */}
                  <EmailSchedulingSection
                    account={account}
                    setAccount={setAccount}
                    appBaseUrl={appBaseUrl}
                    openSections={openSections}
                    toggle={toggle}
                    markDirty={markDirty}
                    handleSave={handleSave}
                    addToast={addToast}
                  />

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

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Toast Notification Container */}
      <IntegrationToastContainer
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </DashboardShell>
  );
}

"use client";

import React, { useState, useMemo, memo } from "react";
import { Globe, Check, Copy, RefreshCw, Loader2, ChevronDown } from "lucide-react";
import { type Account } from "@/lib/data";
import {
  cleanDomain as sanitizeDomain,
  formatSubdomain,
  getDomainVerificationToken,
  formatCustomDomainUrl,
  formatFullHost,
} from "@/lib/domain-verify";

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
}: DomainSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Memoize derived computations so they don't re-run CPU hashes on every single keystroke
  const cleanDom = useMemo(() => sanitizeDomain(rootDomain), [rootDomain]);
  const cleanSub = useMemo(() => formatSubdomain(pageSubdomain), [pageSubdomain]);
  const tokenValue = useMemo(() => getDomainVerificationToken(cleanDom), [cleanDom]);
  const liveCustomUrl = useMemo(() => formatCustomDomainUrl(rootDomain, pageSubdomain), [rootDomain, pageSubdomain]);
  const fullCustomHost = useMemo(() => formatFullHost(rootDomain, pageSubdomain), [rootDomain, pageSubdomain]);
  const defaultShareUrl = useMemo(() => `${appBaseUrl}/${username}`, [appBaseUrl, username]);

  const copyToClipboard = (text: string, fieldKey: string, toastMessage?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    if (toastMessage) addToast(toastMessage, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const labelClass = "block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5";

  return (
    <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-3.5 sm:p-5">
      {/* Always-visible header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
            <Globe className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Public URL & Custom Domain</h4>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
              This is the link you can share immediately. A custom domain gives your brand a white-label URL.
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-start sm:justify-end">
          {domainVerified && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              TXT Verified ✓
            </span>
          )}
          {cnameVerified && (
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              CNAME Routed ✓
            </span>
          )}
          {sslStatus === "active" && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              SSL Active ✓
            </span>
          )}
          {cnameVerified && rootDomain && (
            <a
              href={liveCustomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer"
            >
              Visit Live Domain ↗
            </a>
          )}
        </div>
      </div>

      {/* LeadMagnets URL field + share card */}
      <div className="mb-4">
        <label className={labelClass}>LeadMagnets Default URL</label>
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          {/* Input */}
          <div className="flex-1 w-full">
            <div className="flex rounded-xl border border-[#E2E8F0] dark:border-[#0066B2]/30 bg-white dark:bg-[#0E0E10] focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] transition overflow-hidden">
              <span className="flex items-center select-none border-r border-[#E2E8F0] bg-[#F0F4F8] px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-mono text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#18181C] dark:text-[#38BDF8] shrink-0 max-w-[160px] sm:max-w-none truncate">
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
                className="w-full bg-transparent px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-mono text-zinc-900 outline-none dark:text-white placeholder:text-zinc-400 min-w-0"
                placeholder="your-workspace"
              />
            </div>
            <p className="mt-1.5 sm:mt-2 text-xs text-zinc-400 dark:text-[#9B9085]">Lowercase letters, numbers, and hyphens.</p>
          </div>
          {/* Share this link card */}
          <div className="rounded-xl border border-[#0066B2]/30 bg-[#F8FBFF] p-3.5 sm:p-4 shrink-0 w-full md:w-auto md:min-w-[320px] dark:border-[#0066B2]/35 dark:bg-[#0E0E10]">
            <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">SHARE THIS LINK</p>
              <button
                type="button"
                onClick={() => copyToClipboard(defaultShareUrl, "shareUrl", "Share link copied to clipboard!")}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[#0066B2] hover:underline dark:text-[#38BDF8] cursor-pointer"
              >
                {copiedField === "shareUrl" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiedField === "shareUrl" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs font-mono font-semibold text-zinc-900 dark:text-white select-all break-all">{defaultShareUrl}</p>
          </div>
        </div>
      </div>

      {/* Custom domain nested box */}
      <div className="rounded-xl border border-[#0066B2]/30 bg-[#F8FBFF] p-3 sm:p-3.5 dark:border-[#0066B2]/35 dark:bg-[#121214]">
        <button
          type="button"
          onClick={onToggleCustomDomain}
          className="flex w-full items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0F2F1] text-[#00897B] dark:bg-[#1A2E2B] dark:text-[#2DD4BF]">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Custom domain setup</p>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Connect your custom domain and route traffic to your lead magnets.</p>
            </div>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] dark:text-[#9B9085]">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCustomDomainOpen ? "rotate-180" : ""}`} />
          </div>
        </button>
        {isCustomDomainOpen && (
          <div className="mt-4 border-t border-[#E2E8F0] pt-4 dark:border-[#0066B2]/20 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Root domain input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">
                  Root domain
                </label>
                <input
                  type="text"
                  value={rootDomain}
                  onChange={(e) => {
                    markDirty("customDomain");
                    setRootDomain(e.target.value);
                  }}
                  onBlur={() => handleSave()}
                  placeholder="example.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] dark:border-[#2e2e38] dark:bg-[#0E0E10] dark:text-white dark:placeholder:text-[#52525b] transition-all"
                />
                <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-[#666675]">No https or page paths.</p>
              </div>

              {/* Page subdomain input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">
                  Page subdomain
                </label>
                <input
                  type="text"
                  value={pageSubdomain}
                  onChange={(e) => {
                    markDirty("customSubdomain");
                    setPageSubdomain(e.target.value);
                  }}
                  onBlur={() => handleSave()}
                  placeholder="get"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] dark:border-[#2e2e38] dark:bg-[#0E0E10] dark:text-white dark:placeholder:text-[#52525b] transition-all"
                />
                <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-[#666675]">Recommended: get</p>
              </div>
            </div>

            {/* 2-Step Verification Panel */}
            {rootDomain.trim() ? (
              <div className="space-y-4 pt-1">
                {/* Step 1: Prove you own this domain */}
                <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-zinc-50/60 dark:bg-[#151518] p-5 space-y-4 shadow-2xs">
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-white/20 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#202026]">
                      1
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h6 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Step 1: Prove domain ownership (TXT Record)
                        </h6>
                        {domainVerified && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Verified ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                        Add this TXT record to your DNS provider. Then click Check Ownership.
                      </p>

                      {/* TXT Record Box with Copy Buttons */}
                      <div className="mt-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                            TYPE
                          </span>
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                            TXT
                          </span>
                        </div>

                        <div className="flex-[2] relative">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                            HOST
                          </span>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                            <span>leadmagnets-verify</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard("leadmagnets-verify", "host", "TXT host copied!")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer"
                              title="Copy Host"
                            >
                              {copiedField === "host" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-[#666675] block mt-1">
                            Full hostname: leadmagnets-verify.{cleanDom}
                          </span>
                        </div>

                        <div className="flex-[3] relative">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                            VALUE
                          </span>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                            <span className="truncate max-w-[200px] sm:max-w-xs">
                              {tokenValue}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(tokenValue, "value", "TXT token value copied!")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer shrink-0"
                              title="Copy Value"
                            >
                              {copiedField === "value" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Interactive "Check ownership" button & status message */}
                      <div className="mt-4 space-y-2">
                        <button
                          type="button"
                          disabled={checkingDomain}
                          onClick={async () => {
                            setCheckingDomain(true);
                            setDomainError("");
                            try {
                              const res = await fetch("/api/domain/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ domain: cleanDom, subdomain: cleanSub }),
                              });
                              const data = await res.json();
                              if (data.isVerified) {
                                setDomainVerified(true);
                                if (data.cnameVerified) setCnameVerified(true);
                                if (data.sslStatus) setSslStatus(data.sslStatus);
                                setDomainError("Domain ownership verified!");
                                await handleSave({ domainVerified: true, cnameVerified: data.cnameVerified, sslStatus: data.sslStatus || "active" });
                                addToast("🎉 Domain ownership verified successfully!", "success");
                              } else {
                                const errMsg = data.message || `No TXT record found at leadmagnets-verify.${cleanDom}. Check your DNS settings.`;
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
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-4 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shadow-xs cursor-pointer disabled:opacity-60"
                        >
                          {checkingDomain ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                          )}
                          <span>Check ownership (TXT)</span>
                        </button>

                        {domainError && (
                          <p className="text-[11.5px] text-zinc-500 dark:text-[#9B9085] leading-relaxed pt-1">
                            {domainError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Point traffic at your magnets (CNAME Record Box) */}
                <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-zinc-50/60 dark:bg-[#151518] p-5 space-y-4 shadow-2xs">
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-white/20 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#202026]">
                      2
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h6 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Step 2: Route Traffic (CNAME Record)
                        </h6>
                        {cnameVerified && (
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                            Traffic Routed ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                        Add this CNAME record to route traffic from your subdomain to your magnets.
                      </p>

                      {/* CNAME Record Guidance Box with Copy Buttons */}
                      <div className="mt-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                            TYPE
                          </span>
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                            CNAME
                          </span>
                        </div>

                        <div className="flex-[2] relative">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                            SUBDOMAIN / HOST
                          </span>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                            <span>{cleanSub}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(cleanSub, "cnameHost", "CNAME host copied!")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer"
                              title="Copy Subdomain Host"
                            >
                              {copiedField === "cnameHost" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-[#666675] block mt-1">
                            Full Host: {cleanSub}.{cleanDom}
                          </span>
                        </div>

                        <div className="flex-[3] relative">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#7B7B86] block mb-1">
                            TARGET VALUE
                          </span>
                          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                            <span>{sanitizeDomain(appBaseUrl) || "magnets.bdatech.in"}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(sanitizeDomain(appBaseUrl) || "magnets.bdatech.in", "cnameValue", "CNAME target copied!")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition ml-2 cursor-pointer shrink-0"
                              title="Copy CNAME Target Value"
                            >
                              {copiedField === "cnameValue" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Interactive "Check CNAME routing" button */}
                      <div className="mt-4 space-y-2">
                        <button
                          type="button"
                          disabled={checkingCname}
                          onClick={async () => {
                            setCheckingCname(true);
                            setCnameError("");
                            try {
                              const res = await fetch("/api/domain/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ domain: cleanDom, subdomain: cleanSub }),
                              });
                              const data = await res.json();
                              if (data.cnameVerified) {
                                setCnameVerified(true);
                                setSslStatus("active");
                                const successMsg = `Traffic successfully routed! ${data.fullSubdomainHost} points to ${data.cnameTarget}`;
                                setCnameError(successMsg);
                                await handleSave({ cnameVerified: true, sslStatus: "active" });
                                addToast("🎉 CNAME routing verified and SSL is active!", "success");
                              } else {
                                const errMsg = data.cnameMessage || `No CNAME record detected pointing ${cleanSub}.${cleanDom} to cname.leadmagnets.so`;
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
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-4 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shadow-xs cursor-pointer disabled:opacity-60"
                        >
                          {checkingCname ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
                          )}
                          <span>Verify CNAME routing</span>
                        </button>

                        {cnameError && (
                          <p className="text-[11.5px] text-zinc-500 dark:text-[#9B9085] leading-relaxed pt-1">
                            {cnameError}
                          </p>
                        )}
                      </div>
                    </div>
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
                    Enter your root domain and subdomain above to start connecting.
                  </h6>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                    You will prove ownership with one DNS record, then add a second to route traffic.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

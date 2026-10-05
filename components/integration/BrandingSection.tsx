"use client";

import React, { useState, memo } from "react";
import { Globe, FileText, ChevronDown, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { type Account } from "@/lib/data";

interface BrandingSectionProps {
  rootDomain: string;
  privacyPolicy: string;
  setPrivacyPolicy: (val: string) => void;
  termsOfService: string;
  setTermsOfService: (val: string) => void;
  faviconUrl: string;
  setFaviconUrl: (val: string) => void;
  ogImageUrl: string;
  setOgImageUrl: (val: string) => void;
  openSections: Record<string, boolean>;
  toggle: (key: string) => void;
  markDirty: (field: string) => void;
  handleSave: (overrides?: Partial<Account>) => Promise<void>;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const BrandingSection = memo(function BrandingSection({
  rootDomain,
  privacyPolicy,
  setPrivacyPolicy,
  termsOfService,
  setTermsOfService,
  faviconUrl,
  setFaviconUrl,
  ogImageUrl,
  setOgImageUrl,
  openSections,
  toggle,
  markDirty,
  handleSave,
  addToast,
}: BrandingSectionProps) {
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [faviconUrlError, setFaviconUrlError] = useState("");
  const [ogUrlError, setOgUrlError] = useState("");

  const validateUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return true;
    return /^https?:\/\/.+/i.test(trimmed);
  };

  return (
    <div className="space-y-4">
      {/* Legal links card */}
      <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden hover:bg-[#EFF6FF] dark:hover:bg-[#18181c]">
        <button
          type="button"
          onClick={() => toggle("legal-links")}
          className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#0066B2]/20 dark:border-[#0066B2]/40 dark:text-[#38BDF8]">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Legal links</h4>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                Optionally add your own privacy policy and terms to every page footer.
              </p>
            </div>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["legal-links"] ? "rotate-180" : ""}`} />
          </div>
        </button>
        {openSections["legal-links"] && (
          <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">Privacy policy URL</label>
                <input
                  type="url"
                  placeholder="https://your-site.com/privacy"
                  value={privacyPolicy}
                  onChange={(e) => {
                    markDirty("privacyPolicy");
                    const val = e.target.value;
                    setPrivacyPolicy(val);
                    if (validateUrl(val)) {
                      setPrivacyError("");
                    } else {
                      setPrivacyError("Must start with http:// or https://");
                    }
                  }}
                  onBlur={() => {
                    if (privacyPolicy && !validateUrl(privacyPolicy)) {
                      addToast("Please enter a valid Privacy Policy URL (e.g. https://...)", "error");
                      return;
                    }
                    handleSave({ privacyPolicy: privacyPolicy.trim() });
                  }}
                  className={`w-full rounded-xl border bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition ${
                    privacyError ? "border-rose-500 focus:border-rose-500" : "border-[#E2E8F0] dark:border-[#2e2e38] focus:border-[#0066B2]"
                  }`}
                />
                {privacyError ? (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{privacyError}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Leave blank to hide this link.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">Terms URL</label>
                <input
                  type="url"
                  placeholder="https://your-site.com/terms"
                  value={termsOfService}
                  onChange={(e) => {
                    markDirty("termsOfService");
                    const val = e.target.value;
                    setTermsOfService(val);
                    if (validateUrl(val)) {
                      setTermsError("");
                    } else {
                      setTermsError("Must start with http:// or https://");
                    }
                  }}
                  onBlur={() => {
                    if (termsOfService && !validateUrl(termsOfService)) {
                      addToast("Please enter a valid Terms of Service URL (e.g. https://...)", "error");
                      return;
                    }
                    handleSave({ termsOfService: termsOfService.trim() });
                  }}
                  className={`w-full rounded-xl border bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition ${
                    termsError ? "border-rose-500 focus:border-rose-500" : "border-[#E5E3DD] dark:border-[#2e2e38] focus:border-[#0066B2]"
                  }`}
                />
                {termsError ? (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{termsError}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Leave blank to hide this link.</p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                Links appear in the footer of all published lead magnet pages.
              </p>
              <button
                type="button"
                onClick={() => {
                  const defaultPrivacy = `${window.location.origin}/privacy`;
                  const defaultTerms = `${window.location.origin}/terms`;
                  setPrivacyPolicy(defaultPrivacy);
                  setTermsOfService(defaultTerms);
                  markDirty("privacyPolicy");
                  markDirty("termsOfService");
                  handleSave({
                    privacyPolicy: defaultPrivacy,
                    termsOfService: defaultTerms,
                  });
                  addToast("✅ Filled with built-in Privacy & Terms pages!", "success");
                }}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0 cursor-pointer shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                Use Built-in Default Pages
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Social Preview & Favicon Branding Card */}
      <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
        <button
          type="button"
          onClick={() => toggle("branding-preview")}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] border border-[#DBEAFE] dark:bg-[#1A2E40]">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Social Sharing Thumbnail & Favicon</h4>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                Upload your brand's tab icon and Open Graph thumbnail for social media sharing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(faviconUrl || ogImageUrl) && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Branding Active ✓
              </span>
            )}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections["branding-preview"] ? "rotate-180" : ""}`} />
            </div>
          </div>
        </button>

        {openSections["branding-preview"] && (
          <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-3.5 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Favicon Section */}
              <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 sm:p-4 dark:border-white/10 dark:bg-[#121214]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-900 dark:text-white">
                    Custom Favicon <span className="text-zinc-400 font-normal">(Browser Tab Icon)</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400">32×32 px</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <input
                    type="url"
                    placeholder="https://your-site.com/favicon.ico"
                    value={faviconUrl}
                    onChange={(e) => {
                      markDirty("faviconUrl");
                      const val = e.target.value;
                      setFaviconUrl(val);
                      if (validateUrl(val)) {
                        setFaviconUrlError("");
                      } else {
                        setFaviconUrlError("Invalid favicon URL format");
                      }
                    }}
                    onBlur={() => {
                      if (faviconUrl && !validateUrl(faviconUrl)) {
                        addToast("Invalid favicon URL. Must start with http:// or https://", "error");
                        return;
                      }
                      handleSave();
                    }}
                    className={`w-full flex-1 min-w-0 rounded-xl border bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono ${
                      faviconUrlError ? "border-rose-500 focus:border-rose-500" : "border-[#E2E8F0] dark:border-[#2e2e38] focus:border-[#0066B2]"
                    }`}
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    {faviconUrl && (
                      <button
                        type="button"
                        title="Clear favicon"
                        onClick={async () => {
                          markDirty("faviconUrl");
                          setFaviconUrl("");
                          await handleSave({ faviconUrl: "" });
                          addToast("Custom favicon removed", "info");
                        }}
                        className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer shrink-0"
                      >
                        Clear ✕
                      </button>
                    )}
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-3.5 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shrink-0 flex-1 sm:flex-initial shadow-2xs">
                      {uploadingFavicon ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" /> : <Sparkles className="h-3.5 w-3.5 text-[#0066B2]" />}
                      <span>{uploadingFavicon ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingFavicon(true);
                          markDirty("faviconUrl");
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            const res = await fetch("/api/upload", { method: "POST", body: formData });
                            const data = await res.json();
                            if (!res.ok) {
                              throw new Error(data.error || "Upload request failed");
                            }
                            const uploadedUrl = data.data?.fileUrl || data.data?.url || data.url || data.fileUrl;
                            if (uploadedUrl) {
                              setFaviconUrl(uploadedUrl);
                              await handleSave({ faviconUrl: uploadedUrl });
                              addToast("🎉 Favicon uploaded successfully!", "success");
                            } else {
                              throw new Error("No URL returned from upload server");
                            }
                          } catch (err: any) {
                            console.error("Favicon upload error:", err);
                            addToast(err.message || "Failed to upload favicon image.", "error");
                          } finally {
                            setUploadingFavicon(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Favicon Browser Tab Mockup Preview */}
                <div className="mt-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] p-2.5 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 rounded-md bg-zinc-100 dark:bg-[#0E0E10] px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shrink-0">
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="Favicon preview" className="h-4 w-4 rounded object-contain shrink-0" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full bg-[#0066B2]" />
                    )}
                    <span className="font-semibold text-[11px] truncate max-w-[120px]">My Lead Magnet Page</span>
                    <span className="text-zinc-400 text-[10px]">×</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085]">
                    Live Tab Icon Preview
                  </p>
                </div>
              </div>

              {/* OG Social Share Image Section */}
              <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 sm:p-4 dark:border-white/10 dark:bg-[#121214]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-900 dark:text-white">
                    Social Share Thumbnail <span className="text-zinc-400 font-normal">(Open Graph Card)</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400">1200×630 px</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <input
                    type="url"
                    placeholder="https://your-site.com/og-banner.png"
                    value={ogImageUrl}
                    onChange={(e) => {
                      markDirty("ogImageUrl");
                      const val = e.target.value;
                      setOgImageUrl(val);
                      if (validateUrl(val)) {
                        setOgUrlError("");
                      } else {
                        setOgUrlError("Invalid thumbnail URL format");
                      }
                    }}
                    onBlur={() => {
                      if (ogImageUrl && !validateUrl(ogImageUrl)) {
                        addToast("Invalid thumbnail URL. Must start with http:// or https://", "error");
                        return;
                      }
                      handleSave();
                    }}
                    className={`w-full flex-1 min-w-0 rounded-xl border bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono ${
                      ogUrlError ? "border-rose-500 focus:border-rose-500" : "border-[#E2E8F0] dark:border-[#2e2e38] focus:border-[#0066B2]"
                    }`}
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    {ogImageUrl && (
                      <button
                        type="button"
                        title="Clear social share image"
                        onClick={async () => {
                          markDirty("ogImageUrl");
                          setOgImageUrl("");
                          await handleSave({ ogImageUrl: "" });
                          addToast("Social share thumbnail removed", "info");
                        }}
                        className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer shrink-0"
                      >
                        Clear ✕
                      </button>
                    )}
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-[#202026] px-3.5 py-2 text-xs font-bold text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#282830] transition shrink-0 flex-1 sm:flex-initial shadow-2xs">
                      {uploadingOgImage ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" /> : <Sparkles className="h-3.5 w-3.5 text-[#0066B2]" />}
                      <span>{uploadingOgImage ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingOgImage(true);
                          markDirty("ogImageUrl");
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            const res = await fetch("/api/upload", { method: "POST", body: formData });
                            const data = await res.json();
                            if (!res.ok) {
                              throw new Error(data.error || "Upload request failed");
                            }
                            const uploadedUrl = data.data?.fileUrl || data.data?.url || data.url || data.fileUrl;
                            if (uploadedUrl) {
                              setOgImageUrl(uploadedUrl);
                              await handleSave({ ogImageUrl: uploadedUrl });
                              addToast("🎉 Social share thumbnail uploaded successfully!", "success");
                            } else {
                              throw new Error("No URL returned from upload server");
                            }
                          } catch (err: any) {
                            console.error("OG image upload error:", err);
                            addToast(err.message || "Failed to upload social thumbnail image.", "error");
                          } finally {
                            setUploadingOgImage(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

              {/* Real Social Media Share Card Mockup */}
                <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] overflow-hidden shadow-xs">
                  <div className="h-32 w-full bg-zinc-100 dark:bg-[#0E0E10] relative flex items-center justify-center overflow-hidden">
                    {ogImageUrl ? (
                      <img src={ogImageUrl} alt="Social Card Thumbnail" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center p-3">
                        <Globe className="h-6 w-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-1" />
                        <p className="text-[10px] text-zinc-400">No thumbnail set (Displays default generic card)</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-zinc-50/80 dark:bg-[#18181B] border-t border-zinc-100 dark:border-white/5">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      {rootDomain || "leadmagnets.so"}
                    </p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 truncate">
                      Free Guide: The 10-Step Audience Growth Playbook
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] truncate">
                      Get instant access to strategies used by top creators.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});


"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncWithDatabase, saveAccount, loadAccount, loadPages } from "@/lib/store";
import type { Account, MagnetPage } from "@/lib/data";
import BrandSettingsForm from "@/components/brand/BrandSettingsForm";
import BrandTemplatePreview from "@/components/brand/BrandTemplatePreview";
import BrandHelpModal from "@/components/brand/BrandHelpModal";
import { PRESET_COLORS, compressLogoImage, hexWithAlpha } from "@/components/brand/brand-utils";

const TEMPLATE_TABS = [
  { id: "template1", label: "Template 1" },
  { id: "template2", label: "Template 2" },
  { id: "template3", label: "Template 3" },
  { id: "template4", label: "Template 4" },
  { id: "template5", label: "Template 5" },
  { id: "template6", label: "Template 6" },
  { id: "template7", label: "Template 7" },
];

export default function BrandPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#0066B2");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [highlightIntensity, setHighlightIntensity] = useState<number>(100);
  const [templateId, setTemplateId] = useState<string>("template1");
  const [hoveredTemplateTab, setHoveredTemplateTab] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [stateLatestPage, setLatestPage] = useState<MagnetPage | null>(null);
  const [allPages, setAllPages] = useState<MagnetPage[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Lock background scroll & pause Lenis when Help Modal is open
  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (showHelpModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (lenis && typeof lenis.stop === "function") lenis.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    };
  }, [showHelpModal]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const normalizeTemplateId = useCallback((t: any): string => {
    if (!t) return "template1";
    const s = String(t).trim();
    if (/^\d+$/.test(s)) return `template${s}`;
    return s;
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Load local Account & Pages instantly
    const localAccount = loadAccount();
    const rawLocalPages = loadPages();
    const localPages = rawLocalPages ? rawLocalPages.map(p => ({ ...p, template: normalizeTemplateId(p.template) as any })) : [];
    const activeLocal = localPages && localPages.length > 0 ? (localPages.find((p) => p.status === "live") || localPages[0]) : null;

    if (localPages && localPages.length > 0) {
      setAllPages(localPages);
      if (activeLocal) setLatestPage(activeLocal);
    }

    if (localAccount) {
      setAccount(localAccount);
      setBusinessName(localAccount.brandName || localAccount.name || "");
      setBrandColor(localAccount.brandColor || "#0066B2");
      setThemeMode(localAccount.themeMode || "light");
      setHighlightIntensity(localAccount.highlightIntensity ?? 100);
      setLogo(localAccount.logo || null);

      if (localAccount.templateId) {
        setTemplateId(localAccount.templateId);
      } else if (activeLocal?.template) {
        setTemplateId(activeLocal.template);
      }
    } else if (activeLocal?.template) {
      setTemplateId(activeLocal.template);
    }

    setLoading(false);

    // 2. Sync with database in background (with unmount guard)
    syncWithDatabase().then((data) => {
      if (!isMounted) return;
      if (data && data.account) {
        setAccount(data.account);
        setBusinessName(data.account.brandName || data.account.name || "");
        setBrandColor(data.account.brandColor || "#0066B2");
        setThemeMode(data.account.themeMode || "light");
        setHighlightIntensity(data.account.highlightIntensity ?? 100);
        setLogo(data.account.logo || null);

        if (data.account.templateId) {
          setTemplateId(data.account.templateId);
        }
      }
      if (data && data.pages && data.pages.length > 0) {
        setAllPages(data.pages);
        const active = data.pages.find((p: any) => p.status === "live") || data.pages[0];
        setLatestPage(active);

        if (!data?.account?.templateId && active?.template) {
          setTemplateId(active.template);
        }
      }
    });

    const refreshPages = () => {
      if (!isMounted) return;
      const acc = loadAccount();
      if (acc?.templateId) {
        setTemplateId(acc.templateId);
      }
      const localPages = loadPages();
      if (localPages && localPages.length > 0) {
        setAllPages(localPages);
        const active = localPages.find((p: any) => p.status === "live") || localPages[0];
        setLatestPage(active);
      }
    };

    window.addEventListener("storage", refreshPages);
    window.addEventListener("focus", refreshPages);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", refreshPages);
      window.removeEventListener("focus", refreshPages);
    };
  }, [normalizeTemplateId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const currentUserEmail = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || account?.email || "";

    const updatedAccount: Account = {
      ...(account || { email: currentUserEmail, name: "User", username: "user", plan: "Free" as const, joinedAt: "Just now" }),
      email: currentUserEmail,
      brandName: businessName.trim(),
      brandColor: brandColor.trim(),
      themeMode,
      highlightIntensity,
      templateId,
      logo,
    };

    try {
      const res = await saveAccount(updatedAccount);
      const savedAcc = res.account || updatedAccount;
      setAccount(savedAcc);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("currentUserAccount", JSON.stringify(savedAcc));
          window.dispatchEvent(new Event("accountUpdated"));
        } catch (_) { }
      }
      triggerToast("Brand settings saved successfully!");
    } catch (err) {
      console.error("Save brand settings error:", err);
      setAccount(updatedAccount);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("currentUserAccount", JSON.stringify(updatedAccount));
          window.dispatchEvent(new Event("accountUpdated"));
        } catch (_) { }
      }
      triggerToast("Brand settings saved successfully!");
    } finally {
      setSaving(false);
    }
  }, [account, businessName, brandColor, themeMode, highlightIntensity, templateId, logo, triggerToast]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadFile = await compressLogoImage(file);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("isPageAsset", "true");
      if (account?.email) {
        formData.append("userEmail", account.email);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (res.ok && result.data?.fileUrl) {
        setLogo(result.data.fileUrl);
      } else {
        alert(result.error || "Failed to upload logo.");
      }
    } catch (err: any) {
      console.error("Logo upload error:", err);
      alert("Failed to upload logo image. Please try again.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [account?.email]);

  const removeLogo = useCallback(() => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    const currentBrandName = account?.brandName ?? account?.name ?? "";
    return (
      businessName !== currentBrandName ||
      brandColor !== (account?.brandColor || "#0066B2") ||
      themeMode !== (account?.themeMode || "light") ||
      highlightIntensity !== (account?.highlightIntensity ?? 100) ||
      templateId !== (account?.templateId || "template1") ||
      logo !== (account?.logo || null)
    );
  }, [businessName, brandColor, themeMode, highlightIntensity, templateId, logo, account]);

  const latestPage = useMemo(() => {
    // Search backward without creating extra array instances
    for (let i = allPages.length - 1; i >= 0; i--) {
      const p = allPages[i];
      if ((p.template as string) === templateId && p.status === "live") return p;
    }
    for (let i = allPages.length - 1; i >= 0; i--) {
      const p = allPages[i];
      if ((p.template as string) === templateId) return p;
    }

    if (stateLatestPage && (stateLatestPage.template as string) === templateId) {
      return stateLatestPage;
    }

    return undefined;
  }, [allPages, templateId, stateLatestPage]);

  return (
    <DashboardShell account={account} title="Brand">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10] text-zinc-900 dark:text-white transition-colors duration-200 animate-fade-in">
        <div className="flex-1 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8 w-full max-w-7xl mx-auto">

          {/* Page Title */}
          <div className="mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white animate-slide-in">
              Brand
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-200 dark:hover:bg-[#18181B] hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                title="Help: How do I update my brand colours?"
              >
                ?
              </button>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Configure logo, color scheme, and appearance of your public pages.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Brand Settings Form */}
            <div className="lg:col-span-4 w-full">
              <BrandSettingsForm
                businessName={businessName}
                setBusinessName={setBusinessName}
                logo={logo}
                uploadingLogo={uploadingLogo}
                fileInputRef={fileInputRef}
                handleLogoUpload={handleLogoUpload}
                removeLogo={removeLogo}
                brandColor={brandColor}
                setBrandColor={setBrandColor}
                presetColors={PRESET_COLORS}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                highlightIntensity={highlightIntensity}
                setHighlightIntensity={setHighlightIntensity}
                hasUnsavedChanges={hasUnsavedChanges}
                saving={saving}
                handleSave={handleSave}
              />
            </div>

            {/* Live Preview Panel */}
            <div className="lg:col-span-8 flex flex-col h-full relative w-full pt-1 lg:pt-0">
              {/* 7 Template Switcher Tabs Floating DIRECTLY ABOVE the Preview Card on desktop, neatly placed above on mobile */}
              <div className="relative mb-3 lg:mb-0 lg:absolute lg:-top-12 lg:left-0 lg:right-0 z-10 flex justify-end w-full">
                <div
                  className="w-full flex items-center gap-1 bg-zinc-100/90 dark:bg-[#111113]/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-200 dark:border-[#2b2b32] shadow-xs overflow-x-auto no-scrollbar scroll-smooth touch-pan-x"
                  onMouseLeave={() => setHoveredTemplateTab(null)}
                >
                  {TEMPLATE_TABS.map((t) => {
                    const isActive = templateId === t.id;
                    const isHovered = hoveredTemplateTab === t.id;

                    return (
                      <motion.button
                        key={t.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 600, damping: 28 }}
                        onMouseEnter={() => setHoveredTemplateTab(t.id)}
                        onClick={() => setTemplateId(t.id as any)}
                        className={`relative shrink-0 min-w-fit lg:flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap select-none ${isActive
                          ? "text-white font-bold"
                          : "text-zinc-600 dark:text-[#9B9085] dark:hover:text-white"
                          }`}
                      >
                        {/* Active Solid Pill */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTemplateTab"
                            className="absolute inset-0 bg-[#0066B2] rounded-lg shadow-sm"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          />
                        )}
                        {/* Hover Morphing Pill */}
                        {!isActive && isHovered && (
                          <motion.div
                            layoutId="hoverTemplateTab"
                            className="absolute inset-0 bg-zinc-200/80 dark:bg-[#25252a] rounded-lg"
                            transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: isActive ? '#ffffff' : '#9CA3AF' }} />
                        <span className="relative z-10">{t.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Main Preview Card Box (Top aligns EXACTLY with Left Card on desktop) */}
              <div className="rounded-2xl border border-[#0066B2]/35 bg-white dark:border-[#0066B2]/30 dark:bg-[#18181B] p-3.5 sm:p-5 shadow-sm dark:shadow-2xl h-full flex flex-col transition-colors">
                <div className="flex flex-col gap-1 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-zinc-200 dark:border-[#2e2e38]/50">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">Preview</span>
                  <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-[#9B9085] block">How your brand appears on a full magnet page.</span>
                </div>

                {/* Outer frame matching client page background theme mode */}
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${themeMode === "dark"
                    ? "bg-[#0E0E10] border-[#2e2e38] text-white"
                    : "bg-[#FAFAFA] border-[#e4e4e7] text-zinc-900"
                    }`}
                  style={{
                    backgroundImage: themeMode === "light"
                      ? `radial-gradient(circle at 0% 0%, ${hexWithAlpha(brandColor, 0.05 + (highlightIntensity / 100) * 0.4)} 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${hexWithAlpha(brandColor, 0.03 + (highlightIntensity / 100) * 0.35)} 0%, transparent 50%)`
                      : `radial-gradient(circle at 0% 0%, ${hexWithAlpha(brandColor, 0.08 + (highlightIntensity / 100) * 0.45)} 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${hexWithAlpha(brandColor, 0.05 + (highlightIntensity / 100) * 0.4)} 0%, transparent 50%)`
                  }}
                >
                  {/* Mock page container */}
                  <div className="p-3.5 sm:p-5 md:p-6">
                    {/* Header brand name / logo */}
                    <div className="flex items-center gap-3 mb-5 sm:mb-8 justify-center">
                      <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center bg-transparent overflow-hidden ${logo ? "border-none" : "border border-dashed border-[#a1a1aa]/45"}`}>
                        {logo ? (
                          <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-5 w-5 rounded-sm border border-dashed border-[#a1a1aa]" />
                        )}
                      </div>
                      <span className={`text-base font-extrabold tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-black"}`}>
                        {businessName || "BDA"}
                      </span>
                    </div>

                    {/* Dynamic Animated Template View Container */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={templateId}
                        initial={{ opacity: 0, y: 6, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.5 }}
                      >
                        <BrandTemplatePreview
                          templateId={templateId}
                          latestPage={latestPage}
                          themeMode={themeMode}
                          brandColor={brandColor}
                          highlightIntensity={highlightIntensity}
                          logo={logo}
                          businessName={businessName}
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Footer inside Preview */}
                    <div className={`mt-10 text-center text-[10px] border-t pt-4 transition-all duration-300 ${themeMode === "dark" ? "border-zinc-800 text-zinc-500" : "border-zinc-200 text-zinc-400"
                      }`}>
                      All rights reserved 2026
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Help Centre Modal */}
      <BrandHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </DashboardShell>
  );
}

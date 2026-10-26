"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import GhostFibers from "@/components/ui/GhostFibers";
import { safeSetItem } from "@/lib/store";
import {
  Lock,
  LayoutTemplate,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  Check,
  ShieldCheck,
  FileText,
  User,
  Building2,
  KeyRound,
  ExternalLink,
} from "lucide-react";

const ONBOARDING_STEPS = [
  { step: 1, title: "Workspace & Handle", label: "01. Workspace" },
  { step: 2, title: "Choose Format", label: "02. Magnet Type" },
  { step: 3, title: "Name & Launch", label: "03. Launch" },
];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("there");
  const [userSlug, setUserSlug] = useState("my-workspace");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [domainHost, setDomainHost] = useState("");

  // Step 1: Workspace form state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Solo Creator / Educator");

  // Step 2: Format choice (real products in the app)
  const [magnetType, setMagnetType] = useState<"locked-pdf" | "classic">("locked-pdf");

  // Step 3: Magnet details
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [creatingPage, setCreatingPage] = useState(false);

  // Theme tracking for WebGL canvas
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomainHost(window.location.host);
    }
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (email) {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getAccountByEmail", data: { email } }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.account) {
            const firstName = data.account.name ? data.account.name.split(" ")[0] : "there";
            setUserName(firstName);
            const slug =
              data.account.username ||
              firstName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              "workspace";
            setUserSlug(slug);
            if (!businessName) {
              setBusinessName(data.account.brandName || `${firstName}'s Workspace`);
            }

            fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim(), name: data.account.name }),
            }).catch(console.error);

            if (typeof window !== "undefined") {
              safeSetItem("currentUserEmail", email.trim().toLowerCase());
              safeSetItem("currentUserAccount", JSON.stringify(data.account));
            }
          }
          setLoadingProfile(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingProfile(false);
        });
    } else {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.authenticated && data.user) {
            const acc = data.user;
            const firstName = (acc.name || "there").split(" ")[0];
            setUserName(firstName);
            const slug =
              acc.username ||
              firstName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              "workspace";
            setUserSlug(slug);
            if (!businessName) {
              setBusinessName(acc.brandName || `${firstName}'s Workspace`);
            }
            fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: data.email, name: acc.name }),
            }).catch(console.error);

            if (typeof window !== "undefined" && data.email) {
              safeSetItem("currentUserEmail", data.email.trim().toLowerCase());
              safeSetItem("currentUserAccount", JSON.stringify(acc));
            }
          }
          setLoadingProfile(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingProfile(false);
        });
    }
  }, [email]);

  const handlePageNameChange = (name: string) => {
    setPageName(name);
    const slugified = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setPageSlug(slugified);
  };

  const handleUserSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUserSlug(clean);
  };

  const handleCreatePage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const isLocked = magnetType === "locked-pdf";
    const finalPageName =
      pageName.trim() || (isLocked ? "Locked PDF Document" : "Free Growth Guide");
    const defaultSlug = isLocked ? "locked-document" : "free-guide";
    const finalSlug =
      pageSlug.trim() ||
      finalPageName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-") ||
      defaultSlug;

    setCreatingPage(true);
    const pageId = `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const userEmail =
      (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) ||
      email ||
      "";
    let normUserEmail = userEmail.trim().toLowerCase();

    if (!normUserEmail) {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData?.authenticated && meData?.email) {
          normUserEmail = meData.email.trim().toLowerCase();
          safeSetItem("currentUserEmail", normUserEmail);
          if (meData.user) {
            safeSetItem("currentUserAccount", JSON.stringify(meData.user));
          }
        }
      } catch (err) {
        console.error("Error checking auth status before creating page:", err);
      }
    }

    const newPage = {
      id: pageId,
      name: finalPageName,
      slug: finalSlug,
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: finalPageName,
      subheadline: isLocked
        ? "Enter your email address to receive an instant OTP verification code to unlock this PDF."
        : `Download the free ${finalPageName}. Enter your email below to get instant access.`,
      buttonText: isLocked ? "Verify & Unlock PDF" : "Get Instant Access Now",
      cta: isLocked ? "Verify & Unlock PDF" : "Get Instant Access Now",
      deliverable: isLocked ? "Secure Document PDF" : "Free Resource PDF",
      emailSubject: `Your access to ${finalPageName}`,
      emailBody: `Hi there,\n\nThank you for requesting ${finalPageName}. You can access your resource immediately using the link below:\n\n[Access Resource]\n\nBest regards,\n${businessName || userName}`,
      accentColor: isLocked ? "#D97706" : "#0066B2",
      accent: isLocked ? "#D97706" : "#0066B2",
      template: magnetType,
      socialSharingImage: null,
      checkEmailUnique: false,
      customDomain: null,
      userEmail: normUserEmail,
      deliveryEmail: {
        subject: `Your access to ${finalPageName}`,
        previewText: "Click below to view your requested resource.",
        body: `Thanks for requesting ${finalPageName}! Use the link below to access your download.`,
        linkText: "Access Resource",
        linkUrl: "#",
      },
    };

    try {
      // 1. Sync account profile (brandName, username) to MongoDB
      if (normUserEmail) {
        try {
          const accPayload: any = { email: normUserEmail };
          if (businessName.trim()) accPayload.brandName = businessName.trim();
          if (userSlug.trim()) accPayload.username = userSlug.trim();

          await fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "saveAccount", data: accPayload, email: normUserEmail }),
          });

          if (typeof window !== "undefined") {
            const rawAcc = localStorage.getItem("currentUserAccount");
            if (rawAcc) {
              try {
                const parsed = JSON.parse(rawAcc);
                parsed.brandName = businessName.trim() || parsed.brandName;
                parsed.username = userSlug.trim() || parsed.username;
                safeSetItem("currentUserAccount", JSON.stringify(parsed));
              } catch (_) {}
            }
          }
        } catch (e) {
          console.warn("Could not save account details:", e);
        }
      }

      // 2. Add lead magnet page to MongoDB
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addPage", data: newPage, email: normUserEmail }),
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          const existingPages = JSON.parse(localStorage.getItem("currentUserPages") || "[]");
          const updatedPages = [newPage, ...existingPages.filter((p: any) => p.id !== pageId)];
          safeSetItem("currentUserPages", JSON.stringify(updatedPages));
        }

        if (isLocked) {
          router.push(`/dashboard/locked-pdf?id=${pageId}`);
        } else {
          router.push(`/dashboard/leadmagnets/${pageId}`);
        }
      } else {
        alert("Failed to initialize your lead magnet. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create page. Please try again.");
    } finally {
      setCreatingPage(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F5F1] dark:bg-[#040406] text-zinc-600 dark:text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0066B2] border-t-transparent" />
          <p className="text-xs font-semibold tracking-wide">Initializing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#F7F5F1] dark:bg-[#040406] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden">
      {/* React Bits WebGL Animated Background Canvas */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-30 dark:opacity-35 transition-opacity duration-500">
        <GhostFibers
          lineColor={isDark ? "#111827" : "#0066B2"}
          glowColor={isDark ? "#1E1B4B" : "#38BDF8"}
          lightMode={!isDark}
          speed={0.18}
          scale={1.5}
          fps={60}
          layers={4}
          waveAmplitude={0.015}
          waveFrequency={2.5}
          glowIntensity={1.0}
          brightness={0.9}
          blueBoost={0.8}
          vignette={0.8}
          grain={0.03}
        />
      </div>

      {/* Glow highlight */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[500px] w-full max-w-7xl -translate-x-1/2 opacity-50 blur-[130px] dark:opacity-25">
        <div className="h-full w-full bg-gradient-to-tr from-[#0066B2]/20 via-[#38BDF8]/15 to-purple-600/15 animate-pulse" />
      </div>

      {/* Main Content Box */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        {/* Step Indicator Badges (3 Clean Steps) */}
        <div className="mb-6 grid grid-cols-3 gap-2.5 sm:gap-4">
          {ONBOARDING_STEPS.map((s) => {
            const active = s.step === step;
            const completed = s.step < step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => completed && setStep(s.step)}
                disabled={!completed && !active}
                className={`group flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition-all ${
                  active
                    ? "border-[#0066B2] bg-white/95 dark:bg-white/[0.08] shadow-md shadow-[#0066B2]/10 backdrop-blur-md"
                    : completed
                    ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60 cursor-pointer"
                    : "border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-white/[0.02] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      active
                        ? "text-[#0066B2] dark:text-[#38BDF8]"
                        : completed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-500 dark:text-zinc-500"
                    }`}
                  >
                    {s.label}
                  </span>
                  {completed && <Check className="h-3 w-3 text-emerald-500" />}
                </div>
                <div className="hidden sm:block text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">
                  {s.title}
                </div>
                <div
                  className={`h-1 w-full rounded-full transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#0066B2] to-[#38BDF8]"
                      : completed
                      ? "bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Card Body */}
        <div
          data-lenis-prevent
          className="relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#0c0d12]/85 backdrop-blur-2xl shadow-2xl p-6 sm:p-9 transition-all flex flex-col justify-between min-h-[460px]"
        >
          {/* STEP 1: WORKSPACE & PUBLIC HANDLE */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066B2]/10 px-3 py-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <Sparkles className="h-3.5 w-3.5" /> Workspace Setup
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Welcome, {userName}! Let's set up your workspace
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Claim your public handle and configure your brand identity. All your lead magnets will live under this profile.
                </p>
              </div>

              <div className="space-y-4">
                {/* Brand / Workspace Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                    Brand / Workspace Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Agency, Growth Digest, Rudranath"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] transition font-medium"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Displayed on your opt-in pages, confirmation emails, and browser titles.
                  </p>
                </div>

                {/* Public Username / Custom Handle */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                    Your Public Handle & Profile URL
                  </label>
                  <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] focus-within:border-[#0066B2] focus-within:ring-1 focus-within:ring-[#0066B2]">
                    <span className="flex items-center select-none pl-3.5 text-xs text-zinc-500 font-mono">
                      {domainHost ? `${domainHost}/` : "/"}
                    </span>
                    <input
                      type="text"
                      required
                      value={userSlug}
                      onChange={(e) => handleUserSlugChange(e.target.value)}
                      placeholder="rudranath"
                      className="w-full min-w-0 border-0 bg-transparent py-3 pl-1 pr-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none font-mono font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Your public lead magnet catalog will be viewable at this address.
                  </p>
                </div>

                {/* Business Type / Niche */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                    Business Category / Model
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] cursor-pointer"
                  >
                    <option value="Solo Creator / Educator" className="bg-[#121215] text-white">Solo Creator / Educator</option>
                    <option value="Agency / Service Business" className="bg-[#121215] text-white">Agency / Service Business</option>
                    <option value="SaaS / Software Product" className="bg-[#121215] text-white">SaaS / Software Product</option>
                    <option value="Consultant / Advisor" className="bg-[#121215] text-white">Consultant / Advisor</option>
                    <option value="Executive or Fitness Coach" className="bg-[#121215] text-white">Executive or Fitness Coach</option>
                    <option value="Newsletter Publisher" className="bg-[#121215] text-white">Newsletter Publisher</option>
                    <option value="E-commerce / Store Owner" className="bg-[#121215] text-white">E-commerce / Store Owner</option>
                    <option value="Other / General Business" className="bg-[#121215] text-white">Other / General</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE FORMAT (REAL APP PRODUCTS) */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066B2]/10 px-3 py-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <KeyRound className="h-3.5 w-3.5" /> Step 2: Choose Engine
                </span>
                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  How do you want to deliver your first lead magnet?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  Select the conversion model for your first magnet. You can create as many of both types as you want anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Product 1: Locked PDF Email Gate */}
                <button
                  type="button"
                  onClick={() => setMagnetType("locked-pdf")}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                    magnetType === "locked-pdf"
                      ? "border-amber-500 bg-amber-500/[0.08] dark:bg-amber-500/[0.12] shadow-lg shadow-amber-500/10 ring-2 ring-amber-500"
                      : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="absolute right-3.5 top-3.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Popular
                  </span>

                  <div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-all ${
                        magnetType === "locked-pdf"
                          ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      Locked PDF with OTP Gate
                    </h3>
                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Upload your PDF/slides. Prospects preview the first 1–2 pages, then unlock the full document via instant 6-digit email OTP.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> High conversion (prospects already engaged)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Filters out fake email addresses with OTP
                    </div>
                  </div>
                </button>

                {/* Product 2: Classic Opt-in Landing Page */}
                <button
                  type="button"
                  onClick={() => setMagnetType("classic")}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                    magnetType === "classic"
                      ? "border-[#0066B2] bg-[#0066B2]/10 dark:bg-[#0066B2]/15 shadow-lg shadow-[#0066B2]/10 ring-2 ring-[#0066B2]"
                      : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-all ${
                        magnetType === "classic"
                          ? "bg-[#0066B2] text-white shadow-md shadow-[#0066B2]/30"
                          : "bg-blue-500/10 text-[#0066B2] dark:text-[#38BDF8]"
                      }`}
                    >
                      <LayoutTemplate className="h-5 w-5" />
                    </div>

                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Classic Opt-in Landing Page
                    </h3>
                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      A standalone, high-converting landing page with headlines, bullet points, and automated email link/file delivery.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> Fast setup with instant download links
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Automated welcome email dispatched
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NAME & LAUNCH (INLINE FORM - NO EXTRA POPUP MODAL) */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066B2]/10 px-3 py-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <Sparkles className="h-3.5 w-3.5" /> Step 3: Name & Launch
                </span>
                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Name your first lead magnet
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  Give your resource a title. We will initialize your draft so you can customize and publish it immediately.
                </p>
              </div>

              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Lead Magnet Title
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={pageName}
                    onChange={(e) => handlePageNameChange(e.target.value)}
                    placeholder={
                      magnetType === "locked-pdf"
                        ? "e.g. 2026 Developer Salary & Tech Stack Report"
                        : "e.g. 10-Step High-Converting Landing Page Checklist"
                    }
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] transition font-medium"
                  />
                  {/* Quick suggestion pills */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-zinc-400 self-center mr-1">Quick ideas:</span>
                    {[
                      "Growth Checklist",
                      "Actionable Playbook",
                      "Cheat Sheet & Blueprint",
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => handlePageNameChange(`${businessName ? businessName.split(" ")[0] : "Free"} ${pill}`)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 hover:border-[#0066B2] transition cursor-pointer"
                      >
                        + {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Page Slug */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Custom Page URL Slug
                  </label>
                  <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] focus-within:border-[#0066B2] focus-within:ring-1 focus-within:ring-[#0066B2]">
                    <span className="flex items-center select-none pl-3.5 text-xs text-zinc-500 font-mono">
                      {domainHost ? `${domainHost}/${userSlug}/` : `/${userSlug}/`}
                    </span>
                    <input
                      type="text"
                      value={pageSlug}
                      onChange={(e) =>
                        setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      placeholder={magnetType === "locked-pdf" ? "locked-document" : "free-guide"}
                      className="w-full min-w-0 border-0 bg-transparent py-3 pl-1 pr-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-gradient-to-br from-zinc-50 to-blue-50/20 dark:from-zinc-900/40 dark:to-blue-950/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Live Draft Preview
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        magnetType === "locked-pdf"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/10 text-[#0066B2] dark:text-[#38BDF8]"
                      }`}
                    >
                      {magnetType === "locked-pdf" ? "Locked PDF Gate" : "Classic Opt-in"}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {pageName.trim() || (magnetType === "locked-pdf" ? "Locked PDF Document" : "My Lead Magnet")}
                  </h4>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-[#0066B2] dark:text-[#38BDF8]">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {domainHost ? `${domainHost}/${userSlug}/${pageSlug || (magnetType === "locked-pdf" ? "locked-document" : "free-guide")}` : `/${userSlug}/${pageSlug || "my-magnet"}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="mt-8 pt-5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0066B2]/20 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={creatingPage}
                onClick={() => handleCreatePage()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066B2] via-[#1C83D3] to-[#38BDF8] px-7 py-3 text-sm font-extrabold text-white shadow-xl shadow-[#0066B2]/25 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {creatingPage ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Your Lead Magnet...
                  </>
                ) : (
                  <>
                    Create & Open Editor <Sparkles className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#F7F5F1] dark:bg-[#040406] text-zinc-600 dark:text-zinc-400">
          <div className="text-xs font-semibold">Loading onboarding wizard...</div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

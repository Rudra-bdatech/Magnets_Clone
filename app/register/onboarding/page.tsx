"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { GeminiLogo } from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";
import GhostFibers from "@/components/ui/GhostFibers";
import { safeSetItem } from "@/lib/store";
import {
  Gift,
  Monitor,
  Rocket,
  BookOpen,
  CheckSquare,
  FileText,
  PlayCircle,
  GraduationCap,
  Tag,
  ShieldAlert,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles,
  Target,
  Zap,
  Globe,
  Share2,
  MailCheck,
  Check,
  TrendingUp,
  Layers,
  Wand2,
} from "lucide-react";

const ONBOARDING_STEPS = [
  { step: 1, title: "The Concept", label: "01. Concept" },
  { step: 2, title: "Select Lead Magnet Format", label: "02. Format" },
  { step: 3, title: "Customize Brand & Niche", label: "03. Brand Setup" },
  { step: 4, title: "Launch & Publish", label: "04. Launch" },
];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState("there");
  const [userSlug, setUserSlug] = useState("your-workspace");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form state
  const [selectedFormat, setSelectedFormat] = useState("checklist");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Solo creator");
  const [publishFrequency, setPublishFrequency] = useState("Weekly");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [creatingPage, setCreatingPage] = useState(false);

  // Theme tracking for WebGL canvas
  const [isDark, setIsDark] = useState(true);

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
            const firstName = data.account.name.split(" ")[0];
            setUserName(firstName);
            const slug = data.account.username || firstName.toLowerCase().replace(/[^a-z0-9]/g, "") || "your-workspace";
            setUserSlug(slug);
            if (!businessName) {
              setBusinessName(`${firstName}'s Workspace`);
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
            const slug = acc.username || firstName.toLowerCase().replace(/[^a-z0-9]/g, "") || "your-workspace";
            setUserSlug(slug);
            if (!businessName) {
              setBusinessName(`${firstName}'s Workspace`);
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

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageName.trim() || !pageSlug.trim()) return;

    setCreatingPage(true);
    const pageId = Math.random().toString(36).substring(2, 9);

    const formatLabels: Record<string, string> = {
      ebook: "Guide / Ebook",
      checklist: "Checklist & Action Plan",
      template: "Starter Template",
      webinar: "Webinar Masterclass",
      course: "Mini-Course",
      discount: "VIP Access",
      audit: "Scorecard & Audit",
      other: "Resource Pack",
    };

    const userEmail = (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null) || email || "";
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
      name: pageName.trim(),
      slug: pageSlug.trim(),
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: `Download the Free ${pageName.trim()}`,
      subheadline: `Get instant access to this high-value ${formatLabels[selectedFormat] || "resource"} built specifically for ${businessType.toLowerCase()}s.`,
      buttonText: "Get Free Access Now",
      emailSubject: `Here is your ${pageName.trim()} download link`,
      emailBody: `Hi there,\n\nThank you for requesting the ${pageName.trim()}. You can access your resource immediately using the link below:\n\n[Access Resource]\n\nBest regards,\n${businessName || userName}`,
      accentColor: "#0066B2",
      socialSharingImage: null,
      checkEmailUnique: false,
      customDomain: null,
      userEmail: normUserEmail,
    };

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addPage", data: newPage, email: normUserEmail }),
      });

      if (res.ok) {
        if (businessName.trim() && normUserEmail) {
          try {
            await fetch("/api/data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "saveAccount", data: { email: normUserEmail, brandName: businessName.trim() }, email: normUserEmail }),
            });
          } catch (_) { }
        }
        if (typeof window !== "undefined") {
          const existingPages = JSON.parse(localStorage.getItem("currentUserPages") || "[]");
          const updatedPages = [newPage, ...existingPages.filter((p: any) => p.id !== pageId)];
          safeSetItem("currentUserPages", JSON.stringify(updatedPages));
        }
        router.push(`/dashboard/leadmagnets/${pageId}`);
      } else {
        alert("Failed to create page. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create page. Please try again.");
    } finally {
      setCreatingPage(false);
    }
  };

  const handleNext = () => {
    if (step < 4) {
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
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-6 sm:px-6">

        {/* Step Indicator Badges */}
        <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-3">
          {ONBOARDING_STEPS.map((s) => {
            const active = s.step === step;
            const completed = s.step < step;
            return (
              <button
                key={s.step}
                onClick={() => completed && setStep(s.step)}
                disabled={!completed && !active}
                className={`group flex flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-all ${active
                    ? "border-[#0066B2] bg-white/90 dark:bg-white/[0.08] shadow-md shadow-[#0066B2]/10 backdrop-blur-md"
                    : completed
                      ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60 cursor-pointer"
                      : "border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-white/[0.02] opacity-60"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${active
                      ? "text-[#0066B2] dark:text-[#38BDF8]"
                      : completed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-500 dark:text-zinc-500"
                    }`}>
                    {s.label}
                  </span>
                  {completed && <Check className="h-3 w-3 text-emerald-500" />}
                </div>
                <div className="hidden sm:block text-xs font-semibold truncate text-zinc-800 dark:text-zinc-200">
                  {s.title}
                </div>
                <div className={`h-1 w-full rounded-full transition-all ${active
                    ? "bg-gradient-to-r from-[#0066B2] to-[#38BDF8]"
                    : completed
                      ? "bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`} />
              </button>
            );
          })}
        </div>

        {/* Card Body */}
        <div data-lenis-prevent className="relative rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0c0d12]/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 transition-all flex flex-col justify-between min-h-[480px]">

          {/* STEP 1: CONCEPT & PHILOSOPHY */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066B2]/10 px-3 py-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <Sparkles className="h-3.5 w-3.5" /> High-Converting Growth System
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Welcome to LeadMagnets, {userName}! 👋
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                  A lead magnet is a high-value resource offered for free in exchange for a prospect's email address. It builds trust instantly, turns anonymous site visitors into leads, and sets up automated nurture sequences.
                </p>
              </div>

              {/* 3 Core Pillars */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="group rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-white/[0.03] p-4 transition-all hover:border-[#0066B2]/40 hover:shadow-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-[#0066B2] dark:text-[#38BDF8] mb-3">
                    <Target className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">1. High-Intent Opt-ins</h3>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Attract targeted, ready-to-buy leads by offering exact solutions to their pressing problems.
                  </p>
                </div>

                <div className="group rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-white/[0.03] p-4 transition-all hover:border-[#0066B2]/40 hover:shadow-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 mb-3">
                    <MailCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">2. Instant Delivery</h3>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Automatically dispatch download links and nurture email sequences the second a user submits their email.
                  </p>
                </div>

                <div className="group rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-white/[0.03] p-4 transition-all hover:border-[#0066B2]/40 hover:shadow-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 mb-3">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">3. Zero-Tech Setup</h3>
                  <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    No custom domain or developer needed. Get a production-ready, ultra-fast landing page live in 60 seconds.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-50 dark:bg-blue-950/20 p-4 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-[#0066B2] dark:text-[#38BDF8] shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <strong className="text-[#0066B2] dark:text-[#38BDF8]">Pro Tip:</strong> Businesses using lead magnets see an average <strong>400% increase</strong> in email list growth compared to standard "Subscribe to newsletter" forms.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE FORMAT */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066B2]/10 px-3 py-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <Layers className="h-3.5 w-3.5" /> Step 2: Choose Format
                </span>
                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  What format suits your audience best?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  Select the lead magnet style you plan to create first. You can change this anytime or build multiple formats.
                </p>
              </div>

              <div
                data-lenis-prevent
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 overscroll-contain touch-pan-y"
              >
                {[
                  { id: "checklist", label: "Checklist & Action Plan", desc: "Step-by-step framework to execute tasks quickly without mistakes.", icon: CheckSquare, popular: true },
                  { id: "template", label: "Starter Template & Cheat Sheet", desc: "Copy-paste frameworks, Notion templates, or spreadsheet calculators.", icon: FileText, popular: true },
                  { id: "ebook", label: "Practical Playbook / Guide", desc: "In-depth breakdown of a specific methodology or strategic playbook.", icon: BookOpen },
                  { id: "audit", label: "Audit & Scorecard", desc: "Interactive questionnaire to help prospects evaluate their current bottlenecks.", icon: ShieldAlert },
                  { id: "webinar", label: "Masterclass / Video Replay", desc: "Exclusive video training or webinar recording for high-trust conversions.", icon: PlayCircle },
                  { id: "course", label: "Mini-Course (5-Day Email)", desc: "Drip-fed bite-sized email lessons delivered automatically.", icon: GraduationCap },
                  { id: "discount", label: "Voucher / VIP Pass", desc: "Special promo codes, free trial passes, or exclusive store discounts.", icon: Tag },
                  { id: "other", label: "Resource Pack & Toolkits", desc: "Curated bundle of tools, prompts, software scripts, or graphics.", icon: PlusCircle },
                ].map((item) => {
                  const selected = selectedFormat === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedFormat(item.id)}
                      className={`group relative flex items-start gap-3.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${selected
                          ? "border-[#0066B2] bg-[#0066B2]/10 dark:bg-[#0066B2]/20 shadow-md shadow-[#0066B2]/10 ring-1 ring-[#0066B2]"
                          : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-white/[0.02] hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
                        }`}
                    >
                      {item.popular && (
                        <span className="absolute right-3 top-3 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Popular
                        </span>
                      )}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${selected
                          ? "bg-[#0066B2] text-white shadow-md shadow-[#0066B2]/30"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"
                        }`}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="pr-12">
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CUSTOMIZE BRAND */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066B2]/10 px-3 py-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                  <Wand2 className="h-3.5 w-3.5" /> Step 3: Brand & Audience
                </span>
                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Customize your workspace settings
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  This helps us auto-generate high-converting copy, page subheadings, and email templates for your niche.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Brand / Business / Creator Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Agency, Growth Digest, Alex Rivera"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] transition"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Business Niche / Model
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748B' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.85rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                    >
                      <option value="Solo creator" className="bg-[#121215] text-white">Solo Creator / Educator</option>
                      <option value="Newsletter" className="bg-[#121215] text-white">Newsletter Publisher</option>
                      <option value="SaaS product" className="bg-[#121215] text-white">SaaS / Software Product</option>
                      <option value="Agency" className="bg-[#121215] text-white">Agency / Service Business</option>
                      <option value="Consultancy" className="bg-[#121215] text-white">Consultant / Advisor</option>
                      <option value="Coach" className="bg-[#121215] text-white">Executive or Fitness Coach</option>
                      <option value="E-commerce" className="bg-[#121215] text-white">E-commerce / Store Owner</option>
                      <option value="Other" className="bg-[#121215] text-white">Other / General Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Expected Publishing Cadence
                    </label>
                    <select
                      value={publishFrequency}
                      onChange={(e) => setPublishFrequency(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748B' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.85rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                    >
                      <option value="Weekly" className="bg-[#121215] text-white">Weekly (Recommended)</option>
                      <option value="Bi-weekly" className="bg-[#121215] text-white">Bi-weekly</option>
                      <option value="Monthly" className="bg-[#121215] text-white">Monthly</option>
                      <option value="Quarterly" className="bg-[#121215] text-white">Quarterly</option>
                      <option value="Ad-hoc" className="bg-[#121215] text-white">As needed</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-white/[0.02] p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Default Subdomain Slug:</span>
                  </div>
                  <code className="text-xs font-mono font-bold text-[#0066B2] dark:text-[#38BDF8] bg-blue-500/10 px-2 py-0.5 rounded-md">
                    {userSlug}.leadmagnets.so
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LAUNCH & READY */}
          {step === 4 && (
            <div className="space-y-6 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-3 duration-300 py-2">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0066B2] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                  Workspace Initialized
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  You're Ready to Build Your First Lead Magnet!
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                  LeadMagnets will automatically handle high-converting landing pages, instant file downloads, and email capture.
                </p>
              </div>

              {/* Ready Checklist */}
              <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-white/[0.03] p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">01. Page Builder</span>
                  <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">Custom Opt-in Form</p>
                  <span className="mt-2 flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                    <Check className="h-3 w-3" /> Ready
                  </span>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-white/[0.03] p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">02. File Delivery</span>
                  <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">Automated Email</p>
                  <span className="mt-2 flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                    <Check className="h-3 w-3" /> Configured
                  </span>
                </div>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-white/[0.03] p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">03. Analytics</span>
                  <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">Conversion Tracking</p>
                  <span className="mt-2 flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                    <Check className="h-3 w-3" /> Enabled
                  </span>
                </div>
              </div>

              <div className="w-full max-w-lg rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="font-medium">Publishing Link:</span>
                <code className="font-mono text-[#0066B2] dark:text-[#38BDF8] font-bold">
                  leadmagnets.so/{userSlug}/[magnet-slug]
                </code>
              </div>
            </div>
          )}

          {/* Footer controls */}
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

            {step < 4 ? (
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
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066B2] via-[#1C83D3] to-[#38BDF8] px-7 py-3 text-sm font-extrabold text-white shadow-xl shadow-[#0066B2]/25 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                Create My First Lead Magnet <Sparkles className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Modal Dialog for First Magnet Creation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] p-6 sm:p-8 shadow-2xl text-zinc-900 dark:text-white">

            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0066B2]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">
                  Final Step
                </span>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1">Name Your First Lead Magnet</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Give your resource a title and choose its custom URL slug.</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); router.push("/dashboard/landing-page"); }}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Lead Magnet Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 2026 AI Growth Checklist"
                  value={pageName}
                  onChange={(e) => handlePageNameChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] px-4 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Custom Page URL Slug
                </label>
                <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-white/[0.04] focus-within:border-[#0066B2] focus-within:ring-1 focus-within:ring-[#0066B2]">
                  <span className="flex items-center select-none pl-3.5 text-xs text-zinc-400 font-mono">/</span>
                  <input
                    type="text"
                    required
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="w-full min-w-0 border-0 bg-transparent py-3 pl-1 pr-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none font-mono"
                    placeholder="ai-growth-checklist"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1.5">Lowercase letters, numbers, and hyphens only.</span>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPage}
                  className="rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#0066B2]/20 transition"
                >
                  {creatingPage ? "Creating Page..." : "Launch Page Editor →"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#F7F5F1] dark:bg-[#040406] text-zinc-600 dark:text-zinc-400">
        <div className="text-xs font-semibold">Loading onboarding wizard...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}

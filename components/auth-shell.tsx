"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";
import { CheckCircle2, ShieldCheck, Sparkles, Zap, ArrowRight, Star, Wand2, Mail, RefreshCw } from "lucide-react";

import GhostFibers from "@/components/ui/GhostFibers";

const DYNAMIC_PHRASES = [
  "high-converting lead magnets",
  "automated resource delivery",
  "instant email sequences",
  "interactive lead calculators",
];

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  onSubmit,
  showSidecar = true,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  showSidecar?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"preview" | "delivery" | "analytics">("preview");
  const [simulatedLeads] = useState(142);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = DYNAMIC_PHRASES[phraseIndex];
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, 30);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % DYNAMIC_PHRASES.length);
      }
    } else {
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, 60);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

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

  return (
    <main className="relative flex min-h-screen flex-col bg-[#F7F5F1] dark:bg-[#040406] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden selection:bg-[#0066B2]/20 selection:text-[#0066B2]">
      {/* React Bits GhostFibers Animated Shader Background */}
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

      {/* Ambient Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-[500px] w-full max-w-7xl -translate-x-1/2 opacity-50 blur-[130px] dark:opacity-25">
        <div className="h-full w-full bg-gradient-to-tr from-blue-600/25 via-indigo-500/15 to-purple-600/15 animate-pulse" />
      </div>

      {/* Compact Header */}
      <header className="relative z-20 mx-auto flex h-14 sm:h-16 w-full max-w-7xl items-center justify-between px-5 pt-2 sm:px-8">
        <Link href="/" aria-label="LeadMagnets home" className="inline-flex items-center transition hover:opacity-85">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <div className="apple-page-enter flex flex-1 items-center justify-center px-4 py-3 sm:py-6">
        <div className={`w-full ${showSidecar ? "max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center" : "max-w-md"}`}>

          {/* LEFT COLUMN: Compact Sidecar Showcase */}
          {showSidecar && (
            <div className="hidden lg:flex lg:col-span-6 flex-col space-y-4 pr-2">
              <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-300 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin" style={{ animationDuration: "6s" }} />
                <span>AI Lead Engine</span>
              </div>

              <div className="space-y-2 min-h-[90px]">
                <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-zinc-950 dark:text-white leading-snug">
                  Build{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-black drop-shadow-sm">
                    {displayText}
                  </span>
                  <span className="inline-block w-0.5 h-6 ml-0.5 bg-blue-500 animate-pulse align-middle" />
                </h2>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Deliver valuable resources automatically and capture qualified leads.
                </p>
              </div>

              {/* Compact Card Preview (Glassmorphic) */}
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 opacity-50 blur-lg dark:opacity-30" />

                <div className="relative rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-zinc-950/40 p-4 shadow-2xl backdrop-blur-md space-y-3 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${activeTab === "preview"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                        }`}
                    >
                      <Wand2 className="h-3 w-3" /> Magnet Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("delivery")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${activeTab === "delivery"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                        }`}
                    >
                      <Mail className="h-3 w-3" /> Auto Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("analytics")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${activeTab === "analytics"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                        }`}
                    >
                      <Zap className="h-3 w-3" /> Analytics
                    </button>
                  </div>

                  {activeTab === "preview" && (
                    <div className="space-y-2.5 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-zinc-900/30 p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-500" /> High-Converting Lead Magnet
                        </span>
                        <span className="text-[9px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                          Live Preview
                        </span>
                      </div>
                      <div className="rounded-xl bg-white/60 dark:bg-zinc-950/60 p-3 space-y-2 border border-white/30 dark:border-white/10 shadow-sm backdrop-blur-md">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-zinc-900 dark:text-white">
                            🚀 The Ultimate SaaS Growth Playbook 2026
                          </div>
                          <div className="text-[10px] text-zinc-600 dark:text-zinc-400">
                            Get 15 actionable strategies to capture & nurture leads automatically.
                          </div>
                        </div>
                        <div className="pt-1 flex items-center gap-1.5">
                          <input
                            type="email"
                            readOnly
                            value="subscriber@example.com"
                            className="h-7 flex-1 rounded-md bg-white/50 dark:bg-zinc-900/50 text-[10px] px-2.5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 outline-none backdrop-blur-sm"
                          />
                          <button
                            type="button"
                            className="h-7 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold flex items-center gap-1 transition shadow-sm"
                          >
                            Get Free Copy <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "delivery" && (
                    <div className="space-y-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-zinc-900/30 p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-indigo-500" /> Instant Email Trigger
                        </span>
                        <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/20">0.4s</span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-zinc-950/60 border border-white/30 dark:border-white/10 backdrop-blur-sm">
                          <span>1. Instant PDF Resource Attached</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-zinc-950/60 border border-white/30 dark:border-white/10 backdrop-blur-sm">
                          <span>2. Automated 2-Day Nurture Follow Up</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "analytics" && (
                    <div className="space-y-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/30 dark:bg-zinc-900/30 p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">Total Leads Today</span>
                        <span className="flex items-center gap-1 font-mono font-bold text-emerald-500">
                          <RefreshCw className="h-2.5 w-2.5 animate-spin" /> {simulatedLeads} (+14%)
                        </span>
                      </div>
                      <div className="h-12 w-full flex items-end gap-1 pt-1">
                        {[35, 45, 60, 52, 70, 85, 98, 110, 125, simulatedLeads].map((val, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 rounded-t transition-all duration-500 ${idx === 9 ? "bg-blue-600" : "bg-blue-500/30"}`}
                            style={{ height: `${(val / 150) * 100}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      <span>No code required</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <Star className="h-3 w-3 fill-amber-500" />
                      <Star className="h-3 w-3 fill-amber-500" />
                      <Star className="h-3 w-3 fill-amber-500" />
                      <Star className="h-3 w-3 fill-amber-500" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: Form Card */}
          <div className={`${showSidecar ? "lg:col-span-6" : ""} w-full max-w-md mx-auto`}>
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 opacity-50 blur-lg dark:opacity-30" />

              <div className="relative rounded-2xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-zinc-950/40 p-5 sm:p-6 shadow-2xl backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10">
                {/* Header */}
                <div className="mb-4 flex flex-col items-center text-center">
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
                    {title}
                  </h1>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {subtitle}
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-3" onSubmit={onSubmit}>
                  {children}
                </form>

                {/* Footer Link */}
                {footer && (
                  <div className="mt-4 border-t border-zinc-100 pt-3 text-center text-xs text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-400">
                    {footer}
                  </div>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> 256-bit SSL
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-blue-500" /> Instant Access
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
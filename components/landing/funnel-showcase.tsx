"use client";

import { useState, useEffect } from "react";
import { usePrefersReducedMotion } from "@/components/landing/use-in-view";
import {
  Wand2,
  HardDrive,
  Workflow,
  Play,
  Pause,
  Lock,
  Send,
  Check,
  MousePointer2,
  Mail,
} from "lucide-react";

interface FunnelStep {
  id: string;
  stepNum: string;
  title: string;
  headline: string;
  description: string;
  windowLabel: string;
}

const STEPS: FunnelStep[] = [
  {
    id: "page-builder",
    stepNum: "01",
    title: "Describe your freebie",
    headline: "Describe your freebie. Get a page.",
    description: "Type a topic and upload the file. You get an opt-in page on its own link, with SSL already set up.",
    windowLabel: "PAGE BUILDER",
  },
  {
    id: "native-vault",
    stepNum: "02",
    title: "Share the link",
    headline: "Share the link. Visitors swap their email for the file.",
    description: "Put it in your bio, a newsletter or an ad. The moment someone signs up, the download is emailed to them automatically.",
    windowLabel: "INSTANT DELIVERY",
  },
  {
    id: "nurture-sequence",
    stepNum: "03",
    title: "Let it run",
    headline: "Let it run. Follow-ups send themselves.",
    description: "Timed emails go out on schedule and stop on their own when a lead converts or opts out.",
    windowLabel: "FOLLOW-UPS",
  },
];

const AUTO_ROTATE_INTERVAL = 5500; // 5.5s step cycle

const WAVE_PATH = (() => {
  let p = "M -48 10";
  for (let x = -48; x <= 1400; x += 24) {
    p += " q 6 -3.5 12 0 t 12 0";
  }
  return p;
})();

function CurvyDeliveryBar({
  progress,
  active,
}: {
  progress: number;
  active: boolean;
}) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className="relative w-full h-5 flex items-center select-none" aria-hidden="true">
      {/* Background track: straight rail + subtle curvy guide */}
      <div className="absolute inset-x-0 h-1 rounded-full bg-zinc-200/70 dark:bg-white/[0.08]" />
      <div className="absolute inset-x-0 h-5 overflow-hidden opacity-30 dark:opacity-20 pointer-events-none">
        <svg
          className="absolute top-0 left-0 h-5 text-zinc-400 dark:text-zinc-600"
          style={{ width: "1200px" }}
          viewBox="0 0 1200 20"
          fill="none"
        >
          <path
            d={WAVE_PATH}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Active filled progress with Google Play Store flowing curvy wave */}
      <div
        className="relative h-5 overflow-hidden rounded-full transition-[width] duration-75 ease-linear"
        style={{
          width: `${pct}%`,
        }}
      >
        <div
          className={`absolute top-0 left-0 h-5 pointer-events-none ${active ? "animate-m3-wave" : ""}`}
          style={{ width: "1200px" }}
        >
          <svg
            className="h-5 text-[#0066B2] dark:text-[#38BDF8]"
            style={{ width: "1200px" }}
            viewBox="0 0 1200 20"
            fill="none"
          >
            <path
              d={WAVE_PATH}
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function FunnelShowcase() {
  const reduced = usePrefersReducedMotion();

  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  const activeStep = STEPS[activeIdx];

  // -------------------------------------------------------------
  // Autonomous interactive demo timer:
  // Cycles through steps smoothly with animated progress line
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying || reduced) return;

    const intervalTime = 50;
    const totalTicks = AUTO_ROTATE_INTERVAL / intervalTime;
    let currentTick = 0;
    setProgress(0);

    const timer = setInterval(() => {
      currentTick += 1;
      const pct = Math.min((currentTick / totalTicks) * 100, 100);
      setProgress(pct);

      if (currentTick >= totalTicks) {
        clearInterval(timer);
        setActiveIdx((prev) => (prev + 1) % STEPS.length);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, activeIdx, reduced]);

  // Click on a step tab: jumps directly to that step
  const handleSelectStep = (idx: number) => {
    setActiveIdx(idx);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  // Character-by-character typewriter typing simulation for Stage 1 email
  const TARGET_EMAIL = "alex@company.com";
  let typedEmail = "";
  let isTyping = false;
  let isInputFocused = false;
  let isButtonClicked = false;
  let isDelivered = false;

  if (activeIdx === 0) {
    isInputFocused = progress >= 10 && progress < 65;
    if (progress < 12) {
      typedEmail = "";
    } else if (progress < 14) {
      typedEmail = "";
      isTyping = true;
    } else if (progress < 50) {
      const typeRatio = (progress - 14) / (50 - 14);
      const charsToShow = Math.max(1, Math.floor(typeRatio * TARGET_EMAIL.length));
      typedEmail = TARGET_EMAIL.slice(0, Math.min(charsToShow, TARGET_EMAIL.length));
      isTyping = true;
    } else {
      typedEmail = TARGET_EMAIL;
      isTyping = progress < 56;
    }
    isButtonClicked = progress >= 62;
  } else {
    isDelivered = progress > 45;
  }

  // Dynamic camera zoom follows mouse onto "Get PDF" button before click
  const isZooming = !reduced && activeIdx === 0 && progress >= 48 && progress <= 78;
  const zoomOrigin = "76% 76%";

  // Mouse coordinates for Stage 1
  let mouseLeft = "22%";
  let mouseTop = "65%";
  let mouseScale = 1;
  let mouseOpacity = 1;

  if (activeIdx === 0) {
    if (progress < 10) {
      mouseLeft = "20%";
      mouseTop = "65%";
      mouseScale = 1;
    } else if (progress < 14) {
      mouseLeft = "28%";
      mouseTop = "44%";
      mouseScale = progress >= 12 ? 0.85 : 1;
    } else if (progress < 48) {
      mouseLeft = "30%";
      mouseTop = "54%";
      mouseScale = 1;
    } else if (progress < 58) {
      const t = (progress - 48) / 10;
      mouseLeft = `${30 + t * 52}%`;
      mouseTop = `${54 - t * 22}%`;
      mouseScale = 1;
    } else if (progress < 68) {
      mouseLeft = "82%";
      mouseTop = "32%";
      mouseScale = progress >= 62 ? 0.85 : 1;
    } else {
      mouseLeft = "82%";
      mouseTop = "32%";
      mouseScale = 1;
      mouseOpacity = progress > 92 ? 0 : 0.9;
    }
  }

  return (
    <div className="relative w-full">
      <div className="w-full">
        {/* 2-Column Minimalist Layout */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: Clean Text List with Floating Active State */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            {STEPS.map((step, idx) => {
              const isActive = idx === activeIdx;

              if (isActive) {
                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-3.5 py-1.5 animate-fadeIn"
                  >
                    {/* Floating Circular Play/Pause Toggle */}
                    <div className="pt-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        aria-label={isPlaying ? "Pause rotation" : "Play rotation"}
                        className="h-7 w-7 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shadow-xs hover:border-[#0066B2] dark:hover:border-[#38BDF8] transition-colors cursor-pointer"
                      >
                        {isPlaying ? (
                          <Pause className="h-3 w-3 fill-current" />
                        ) : (
                          <Play className="h-3 w-3 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Dynamic Progress Line - Fills smoothly from top to bottom */}
                    <div className="w-[3.5px] self-stretch rounded-full bg-zinc-200/80 dark:bg-zinc-800 shrink-0 relative overflow-hidden">
                      <div
                        className="w-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-75"
                        style={{
                          height: `${isPlaying ? progress : 100}%`,
                        }}
                      />
                    </div>

                    {/* Active Heading & Description */}
                    <div className="space-y-1.5 pr-2">
                      <h4 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white leading-snug">
                        {step.headline}
                      </h4>
                      <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleSelectStep(idx)}
                  className="text-left py-1.5 text-sm sm:text-base font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer pl-11"
                >
                  {step.title}
                </button>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Interactive Animated SaaS App Window */}
          <div className="lg:col-span-7 min-w-0 w-full">
            <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/10 shadow-xl overflow-hidden min-w-0">
              {/* Window Top Bar (Clean macOS style) */}
              <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.03]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-mono">
                  {activeStep.windowLabel}
                </span>
              </div>

              {/* Dynamic Mockup Body - Edge-to-Edge Balanced Layout */}
              <div
                className="p-3.5 sm:p-6 min-h-[350px] flex flex-col justify-between transition-transform duration-300 ease-out min-w-0"
                style={{
                  transform: isZooming ? "scale(1.08)" : "scale(1)",
                  transformOrigin: zoomOrigin,
                }}
              >
                {/* STAGE 01: AI Page Builder */}
                {activeIdx === 0 && (
                  <div className="space-y-3.5 sm:space-y-4 animate-fadeIn min-w-0">
                    {/* Top Bar with CNAME & Auto-SSL */}
                    <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 min-w-0">
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="text-zinc-900 dark:text-white font-semibold truncate">playbook.acme.co</span>
                        <span className="text-zinc-400 truncate">/free-guide</span>
                      </div>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ml-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        SSL Active
                      </span>
                    </div>

                    {/* AI Generation Box */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Wand2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> AI Magnet Generator
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8]">
                          Ready
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#0e0e11] border border-zinc-200/60 dark:border-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium flex items-center justify-between min-w-0">
                        <span className="truncate">&quot;The 2026 SaaS Growth Playbook: 14 Cold-to-Close Templates&quot;</span>
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-2" />
                      </div>
                    </div>

                    {/* Live Visitor Opt-in Simulation */}
                    <div className="p-3 sm:p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 space-y-3 relative text-center min-w-0">
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">
                          Download Your Free SaaS Playbook
                        </h5>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          Free PDF, sent straight to your inbox
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto flex items-center gap-1.5 relative min-w-0">
                        <div
                          className={`flex-1 px-2.5 sm:px-3 py-2 rounded-lg bg-white dark:bg-[#0e0e11] border text-xs font-mono text-left flex items-center min-h-[38px] transition-all duration-200 min-w-0 ${
                            isInputFocused
                              ? "border-[#0066B2] dark:border-[#38BDF8] ring-2 ring-[#0066B2]/20 shadow-xs"
                              : "border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          <Mail
                            className={`h-3.5 w-3.5 mr-2 shrink-0 transition-colors ${
                              isInputFocused
                                ? "text-[#0066B2] dark:text-[#38BDF8]"
                                : "text-zinc-400 dark:text-zinc-500"
                            }`}
                          />
                          {progress < 12 ? (
                            <span className="text-zinc-400 dark:text-zinc-500 select-none truncate">
                              your@email.com
                            </span>
                          ) : (
                            <span className="text-zinc-900 dark:text-zinc-100 font-medium tracking-tight flex items-center font-mono truncate">
                              {typedEmail}
                              {isTyping && (
                                <span className="inline-block w-[2px] h-3.5 bg-[#0066B2] dark:bg-[#38BDF8] ml-0.5 animate-pulse align-middle" />
                              )}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`px-3 sm:px-3.5 py-2 rounded-lg text-white font-bold text-xs transition-all duration-200 flex items-center gap-1 shrink-0 ${
                            isButtonClicked
                              ? "bg-emerald-600 scale-95 shadow-sm"
                              : progress >= 56 && progress < 62
                              ? "bg-[#0066B2] ring-2 ring-[#0066B2]/40 scale-[1.02] shadow-sm"
                              : "bg-[#0066B2]"
                          }`}
                        >
                          {isButtonClicked ? (
                            <>
                              <Check className="h-3 w-3 stroke-[2.5]" /> Access Sent
                            </>
                          ) : (
                            "Get PDF"
                          )}
                        </button>

                        {/* Simulated Interactive Mouse Pointer */}
                        <div
                          className="absolute pointer-events-none z-20 will-change-[left,top]"
                          style={{
                            left: mouseLeft,
                            top: mouseTop,
                            opacity: mouseOpacity,
                            transform: `scale(${mouseScale})`,
                          }}
                        >
                          <MousePointer2 className="h-4 w-4 fill-zinc-900 text-white drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 02: Secure Asset Vault */}
                {activeIdx === 1 && (
                  <div className="space-y-3.5 animate-fadeIn min-w-0">
                    {/* File Asset Card */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">
                            Your file
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          No Drive links
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#0e0e11] border border-zinc-200/60 dark:border-white/5 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xs shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                              saas-growth-playbook-2026.pdf
                            </p>
                            <span className="text-[10px] text-zinc-400 truncate block">4.8 MB · Private download link</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-2 py-0.5 rounded shrink-0 ml-1">
                          Hosted
                        </span>
                      </div>
                    </div>

                    {/* Instant Dispatch Timeline & Animation */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-700 dark:text-zinc-200 font-semibold flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Instant delivery
                        </span>
                        <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold font-mono text-[10px] sm:text-[11px]">
                          {isDelivered ? "Sent ✓" : "Preparing download link…"}
                        </span>
                      </div>

                      {/* Animated Delivery Speed Bar with Google Play Store Curvy Loading Wave */}
                      <CurvyDeliveryBar
                        progress={Math.min(progress * 1.6, 100)}
                        active={!reduced && !isDelivered}
                      />

                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                        <span className="truncate">Recipient: alex@company.com</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0 ml-1">
                          <Check className="h-3 w-3" /> Delivered
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STAGE 03: Follow-up sequence */}
                {activeIdx === 2 && (
                  <div className="space-y-2 sm:space-y-2.5 animate-fadeIn min-w-0">
                    {/* Sequence Header Bar */}
                    <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Workflow className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                        <span className="font-bold text-zinc-900 dark:text-white truncate">Follow-up sequence</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-2 py-0.5 rounded shrink-0">
                        3 Steps Active
                      </span>
                    </div>

                    {/* 3 Step Sequence Cards with Downward Flow */}
                    <div className="space-y-1.5 min-w-0">
                      {/* Step 1 */}
                      <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs min-w-0">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 sm:gap-2 truncate">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            Email 1: Welcome & PDF
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-3.5 sm:pl-4 truncate">
                            Sent on opt-in
                          </p>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-1">
                          <Check className="h-2.5 w-2.5" /> Delivered
                        </span>
                      </div>

                      {/* Step 2 */}
                      <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#0e0e11] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs min-w-0">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 sm:gap-2 truncate">
                            <span className="h-2 w-2 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] shrink-0" />
                            Email 2: 3 Common Mistakes
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-3.5 sm:pl-4 truncate">
                            Delay: 2 days
                          </p>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded shrink-0 ml-1">
                          Scheduled
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-[#0066B2]/30 dark:border-[#38BDF8]/20 flex items-center justify-between text-xs min-w-0">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-[#0066B2] dark:text-[#38BDF8] flex items-center gap-1.5 sm:gap-2 truncate">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            Email 3: Strategy Call Offer
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-3.5 sm:pl-4 truncate">
                            Delay: 4 days · Auto-stops if converted
                          </p>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-1.5 sm:px-2 py-0.5 rounded shrink-0 ml-1">
                          Auto-Halt
                        </span>
                      </div>
                    </div>

                    {/* Smart Stop Guard Rule */}
                    <div className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5 font-medium truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] shrink-0" />
                        Auto-stop when a lead converts
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                        On
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

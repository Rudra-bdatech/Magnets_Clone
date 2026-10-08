"use client";

import { useState, useEffect } from "react";
import {
  Wand2,
  HardDrive,
  BarChart3,
  Workflow,
  Share2,
  Play,
  Pause,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Radio,
  Send,
  Check,
  MousePointer2,
  Clock,
  Zap,
  FileText,
  Mail,
  ShieldCheck,
  Activity,
  Terminal,
  Layers,
  Sparkles,
  Calendar,
  RefreshCw
} from "lucide-react";

interface FunnelStep {
  id: string;
  stepNum: string;
  title: string;
  headline: string;
  description: string;
  windowLabel: string;
  metrics: { label: string; value: string }[];
}

const STEPS: FunnelStep[] = [
  {
    id: "page-builder",
    stepNum: "01",
    title: "Generate AI opt-in pages in seconds",
    headline: "Turn ideas into high-converting landing pages",
    description:
      "Craft compelling headlines, benefit bullets, and opt-in forms tailored to your niche. Publish with your own CNAME subdomain and auto-SSL.",
    windowLabel: "AI PAGE BUILDER",
    metrics: [
      { label: "Build Time", value: "30s" },
      { label: "Opt-in Rate", value: "48.6%" },
    ],
  },
  {
    id: "native-vault",
    stepNum: "02",
    title: "Host and deliver assets without Google Drive",
    headline: "Host securely & dispatch instantly on opt-in",
    description:
      "Store PDFs, Notion templates, checklists, or videos natively. The moment visitors submit their email, tokenized fulfillment fires in 0.2s.",
    windowLabel: "SECURE ASSET VAULT",
    metrics: [
      { label: "Fulfillment", value: "0.2s" },
      { label: "Delivery", value: "99.4%" },
    ],
  },
  {
    id: "telemetry",
    stepNum: "03",
    title: "Track real-time conversion and bounce signals",
    headline: "Stream live GA4 and Meta Pixel telemetry",
    description:
      "Automatically fire server-side and client-side conversion events. Recover up to 23% of abandoning traffic with intelligent exit-intent modals.",
    windowLabel: "CONVERSION TELEMETRY",
    metrics: [
      { label: "Tracking", value: "GA4 + Meta" },
      { label: "Recovery", value: "+23%" },
    ],
  },
  {
    id: "nurture-sequence",
    stepNum: "04",
    title: "Automate follow-ups with smart booking stops",
    headline: "Nurture subscribers with automated sequences",
    description:
      "Auto-send timed multi-step follow-ups that stop automatically when leads book a call on Calendly or convert in your CRM.",
    windowLabel: "DRIP WORKFLOW",
    metrics: [
      { label: "Open Rate", value: "62.8%" },
      { label: "Auto-Stop", value: "Calendly/CRM" },
    ],
  },
  {
    id: "ecosystem-sync",
    stepNum: "05",
    title: "Sync leads to Kit, Slack, Pipedrive, and Zapier",
    headline: "Push new leads across your stack in real time",
    description:
      "Connect your existing tools in 1 click. Instant webhook routing, auto-retry queues, and bi-directional contact syncing.",
    windowLabel: "ECOSYSTEM SYNC",
    metrics: [
      { label: "Webhook Latency", value: "<150ms" },
      { label: "Integrations", value: "10+ Native" },
    ],
  },
];

const AUTO_ROTATE_INTERVAL = 5500; // 5.5s

export default function FunnelShowcase() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  const activeStep = STEPS[activeIdx];

  // Auto-rotation timer and progress bar
  useEffect(() => {
    if (!isPlaying) return;

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
  }, [isPlaying, activeIdx]);

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
  let isSyncPulse = false;

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
    isSyncPulse = progress > 40;
  }

  // Dynamic camera zoom follows the mouse onto the "Get PDF" button before click, then zooms out after click
  const isZooming = activeIdx === 0 && progress >= 48 && progress <= 78;
  const zoomOrigin = "76% 76%"; // Focuses directly on the Get PDF CTA button & mouse cursor

  // Calculate realistic mouse coordinates and click states for Stage 1
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
      // Smooth glide to the "Get PDF" button
      const t = (progress - 48) / 10;
      mouseLeft = `${30 + t * 52}%`;
      mouseTop = `${54 - t * 22}%`;
      mouseScale = 1;
    } else if (progress < 68) {
      // Over the button and clicking
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
    <div className="w-full">
      {/* 2-Column QAAssist Pure Minimalist Layout */}
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
          <div className="rounded-2xl bg-white dark:bg-[#141822] border border-zinc-200/80 dark:border-white/10 shadow-xl overflow-hidden min-w-0">
            {/* Window Top Bar (Clean macOS style) */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/60 dark:bg-white/[0.02]">
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
              className="p-3.5 sm:p-6 min-h-[350px] flex flex-col justify-between transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] min-w-0"
              style={{
                transform: isZooming ? "scale(1.08)" : "scale(1)",
                transformOrigin: zoomOrigin,
              }}
            >
              {/* STAGE 01: AI Page Builder */}
              {activeIdx === 0 && (
                <div className="space-y-3.5 sm:space-y-4 animate-fadeIn min-w-0">
                  {/* Top Bar with CNAME & Auto-SSL */}
                  <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 min-w-0">
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
                  <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Wand2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> AI Magnet Generator
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8]">
                        Ready in 1.4s
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#12151E] border border-zinc-200/60 dark:border-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium flex items-center justify-between min-w-0">
                      <span className="truncate">&quot;The 2026 SaaS Growth Playbook: 14 Cold-to-Close Templates&quot;</span>
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-2" />
                    </div>
                  </div>

                  {/* Live Visitor Opt-in Simulation */}
                  <div className="p-3 sm:p-4 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-3 relative text-center min-w-0">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">
                        Download Your Free SaaS Playbook
                      </h5>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Join 2,400+ SaaS founders scaling outbound pipeline
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto flex items-center gap-1.5 relative min-w-0">
                      <div
                        className={`flex-1 px-2.5 sm:px-3 py-2 rounded-lg bg-white dark:bg-[#12151E] border text-xs font-mono text-left flex items-center min-h-[38px] transition-all duration-200 min-w-0 ${
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
                        className="absolute pointer-events-none transition-all duration-300 ease-out z-20"
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
                  <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Encrypted Asset Vault
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Zero Google Drive Expiry
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#12151E] border border-zinc-200/60 dark:border-white/5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xs shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            saas-growth-playbook-2026.pdf
                          </p>
                          <span className="text-[10px] text-zinc-400 truncate block">4.8 MB · 256-bit Tokenized File</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-2 py-0.5 rounded shrink-0 ml-1">
                        Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Instant Dispatch Timeline & Animation */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2.5 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-700 dark:text-zinc-200 font-semibold flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Instant Dispatch Engine
                      </span>
                      <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold font-mono text-[10px] sm:text-[11px]">
                        {isDelivered ? "Fired in 0.18s ✓" : "Generating single-use link..."}
                      </span>
                    </div>

                    {/* Animated Delivery Speed Bar */}
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(progress * 1.6, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                      <span className="truncate">Recipient: alex@company.com</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0 ml-1">
                        <Check className="h-3 w-3" /> 99.4% Placement
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 03: Conversion Telemetry & Live Event Stream */}
              {activeIdx === 2 && (
                <div className="space-y-3 sm:space-y-3.5 animate-fadeIn min-w-0">
                  {/* Dynamic Counting Rate Cards */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 min-w-0">
                    <div className="p-2.5 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-1 min-w-0">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
                        Opt-in Rate
                      </span>
                      <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                        {(48.2 + (progress / 100) * 3.4).toFixed(1)}%
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0066B2] dark:text-[#38BDF8] animate-bounce" />
                      </div>
                      <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-bold block truncate">
                        +14.8% vs benchmark
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-1 min-w-0">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
                        Exit Recovery
                      </span>
                      <div className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
                        +{Math.round(150 + (progress / 100) * 34)} Leads
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block truncate">
                        23.4% traffic saved
                      </span>
                    </div>
                  </div>

                  {/* Real-Time Telemetry Terminal Stream */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2 font-mono text-[10px] sm:text-[11px] min-w-0">
                    <div className="flex items-center justify-between text-zinc-400 text-[9px] uppercase tracking-wider border-b border-zinc-200/60 dark:border-white/5 pb-1 font-sans font-bold">
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8]" />
                        Signal Stream
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Live CAPI
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        [GA4 CAPI] &quot;lead_generated&quot;
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-1">200 OK</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        [Meta Conversions] &quot;Lead (9.4)&quot;
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-1">200 OK</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 04: Drip Sequence Workflow */}
              {activeIdx === 3 && (
                <div className="space-y-2 sm:space-y-2.5 animate-fadeIn min-w-0">
                  {/* Sequence Header Bar */}
                  <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Workflow className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                      <span className="font-bold text-zinc-900 dark:text-white truncate">SaaS Nurture Sequence</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-2 py-0.5 rounded shrink-0">
                      3 Steps Active
                    </span>
                  </div>

                  {/* 3 Step Sequence Cards with Downward Flow */}
                  <div className="space-y-1.5 min-w-0">
                    {/* Step 1 */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs min-w-0">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 sm:gap-2 truncate">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          Email 1: Welcome & PDF
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-3.5 sm:pl-4 truncate">
                          Triggered on opt-in · <span className="font-semibold text-zinc-700 dark:text-zinc-300">88.4% Open</span>
                        </p>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-1">
                        <Check className="h-2.5 w-2.5" /> Delivered
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#12151E] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs min-w-0">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 sm:gap-2 truncate">
                          <span className="h-2 w-2 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] shrink-0" />
                          Email 2: 3 Common Mistakes
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-3.5 sm:pl-4 truncate">
                          Delay: 2 days · <span className="font-semibold text-zinc-700 dark:text-zinc-300">64.2% Est. Open</span>
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
                          Delay: 4 days · Auto-stops if booked
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
                      Smart Auto-Stop Guard
                    </span>
                    <span className="font-bold text-[#0066B2] dark:text-[#38BDF8] shrink-0 ml-1">
                      Calendly Synced
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 05: Ecosystem Sync */}
              {activeIdx === 4 && (
                <div className="space-y-2.5 sm:space-y-3 animate-fadeIn min-w-0">
                  <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-xs min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Share2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                      <span className="font-bold text-zinc-900 dark:text-white truncate">Real-Time Stack Connectivity</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-1">
                      <Check className="h-2.5 w-2.5" /> 4/4 Connected
                    </span>
                  </div>

                  {/* 4 Connected Platform Nodes */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs min-w-0">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-[#0066B2]/30 space-y-0.5 sm:space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-zinc-900 dark:text-white truncate text-[11px] sm:text-xs">Kit (ConvertKit)</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold truncate">
                        Tag: #saas-playbook
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-[#0066B2]/30 space-y-0.5 sm:space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-zinc-900 dark:text-white truncate text-[11px] sm:text-xs">Substack</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold truncate">
                        Publication synced
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-[#0066B2]/30 space-y-0.5 sm:space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-zinc-900 dark:text-white truncate text-[11px] sm:text-xs">Slack Alerts</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold truncate">
                        #new-leads channel
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-[#0066B2]/30 space-y-0.5 sm:space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-zinc-900 dark:text-white truncate text-[11px] sm:text-xs">Zapier / CRM</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold truncate">
                        CRM Pipeline OK
                      </p>
                    </div>
                  </div>

                  {/* Live Webhook JSON Payload Preview */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[10px] space-y-1 border border-zinc-800 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-zinc-400 text-[9px] gap-1">
                      <span className="truncate">POST /v1/webhook/lead-captured</span>
                      <span className="text-[#38BDF8] flex items-center gap-1 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        200 OK (84ms)
                      </span>
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate">
                      {`{"event":"opt_in","email":"alex@company.com","asset":"saas-playbook","status":"synced"}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

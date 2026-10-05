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
  MousePointer2
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
    title: "Sync leads to Beehiiv, Kit, Slack, and Zapier",
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

  // Dynamic animation progress helpers (0 to 100)
  const isTypingDone = progress > 30;
  const isButtonClicked = progress > 55;
  const isDelivered = progress > 45;
  const isSyncPulse = progress > 40;

  // Dynamic camera zoom effect ONLY on Stage 1 (where mouse pointer is present)
  const isZooming = activeIdx === 0 && progress >= 28 && progress <= 68;
  const zoomOrigin = "72% 70%"; // Focuses onto input & Get PDF CTA button

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
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white dark:bg-[#141822] border border-zinc-200/80 dark:border-white/10 p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-white/5 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 inline-block" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] animate-ping" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0066B2] dark:text-[#38BDF8] font-mono">
                  {activeStep.windowLabel}
                </span>
              </div>
            </div>

            {/* Dynamic Mockup Body with Live In-Card Animations & Camera Zoom */}
            <div
              className="min-h-[290px] flex flex-col justify-center relative z-10 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: isZooming ? "scale(1.08)" : "scale(1)",
                transformOrigin: zoomOrigin,
              }}
            >
              {/* STAGE 01: AI Page Builder & Live Interactive Opt-in Simulation */}
              {activeIdx === 0 && (
                <div className="space-y-3 animate-fadeIn relative">
                  {/* Top Domain & SSL Bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-emerald-500" />
                      <span className="text-zinc-800 dark:text-zinc-200 font-semibold">playbook.acme.co</span>
                      <span className="text-zinc-400">/free-guide</span>
                    </div>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      SSL Active
                    </span>
                  </div>

                  {/* AI Generator Card */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Wand2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          AI Prompt Generator
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8]">
                        Ready in 1.4s
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#12151E] border border-zinc-200/60 dark:border-white/5 text-xs text-zinc-700 dark:text-zinc-300 font-medium flex items-center justify-between">
                      <span>&quot;The 2026 SaaS Growth Playbook: 14 Cold-to-Close Templates&quot;</span>
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-2" />
                    </div>
                  </div>

                  {/* Live Visitor View with Animated Typing & Click Simulation */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-center space-y-2 relative">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">
                        Download Your Free SaaS Playbook
                      </h5>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Join 2,400+ SaaS founders scaling outbound pipeline
                      </p>
                    </div>
                    <div className="max-w-xs mx-auto flex items-center gap-1.5 relative pt-1">
                      <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12151E] border border-zinc-200 dark:border-zinc-700 text-[11px] text-left font-mono transition-all">
                        {progress < 15 ? (
                          <span className="text-zinc-400">your@email.com</span>
                        ) : progress < 30 ? (
                          <span className="text-zinc-800 dark:text-zinc-200">alex@c<span className="animate-pulse">|</span></span>
                        ) : (
                          <span className="text-zinc-800 dark:text-zinc-200">alex@company.com</span>
                        )}
                      </div>
                      <button
                        className={`px-3 py-1.5 rounded-lg text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm shrink-0 ${
                          isButtonClicked
                            ? "bg-emerald-600 scale-95"
                            : progress > 30
                            ? "bg-[#0066B2] ring-2 ring-[#0066B2]/30"
                            : "bg-[#0066B2]"
                        }`}
                      >
                        {isButtonClicked ? (
                          <>
                            <Check className="h-3 w-3" /> Access Sent
                          </>
                        ) : (
                          "Get PDF"
                        )}
                      </button>

                      {/* Simulated Interactive Mouse Pointer */}
                      <div
                        className="absolute pointer-events-none transition-all duration-700 ease-out z-20"
                        style={{
                          left: progress < 25 ? "35%" : progress < 50 ? "78%" : "82%",
                          top: progress < 25 ? "40%" : "30%",
                          opacity: progress < 80 ? 1 : 0,
                          transform: isButtonClicked ? "scale(0.85)" : "scale(1)",
                        }}
                      >
                        <div className="relative">
                          <MousePointer2 className="h-4 w-4 fill-zinc-900 text-white drop-shadow-md" />
                          {progress > 30 && progress < 55 && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#0066B2] animate-ping" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 02: Native Vault & Instant Dispatch Animation */}
              {activeIdx === 1 && (
                <div className="space-y-3 animate-fadeIn">
                  {/* Vault Asset Card */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Encrypted File Host
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Zero Google Drive Expiry
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#12151E] border border-zinc-200/60 dark:border-white/5 transition-all hover:border-[#0066B2]/40">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            saas-growth-playbook-2026.pdf
                          </p>
                          <span className="text-[9px] text-zinc-400">4.8 MB · Tokenized Storage · 256-bit AES</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-2 py-0.5 rounded">
                        Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Instant Dispatch Log & Delivery Breakdown */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-700 dark:text-zinc-200 font-semibold flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Instant Fulfillment Engine
                      </span>
                      <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold font-mono">
                        {isDelivered ? "Fired in 0.18s ✓" : "Dispatching..."}
                      </span>
                    </div>

                    {/* Animated Delivery Progress Line */}
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(progress * 1.6, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                      <span>Target: alex@company.com</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="h-2.5 w-2.5" /> 99.4% Inbox Placement
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 03: Telemetry Counter & Event Stream */}
              {activeIdx === 2 && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Dynamic Counting Rate */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5">
                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Opt-in Rate
                      </span>
                      <div className="mt-0.5 text-xl font-black text-zinc-900 dark:text-white flex items-center gap-1">
                        {(48.2 + (progress / 100) * 3.0).toFixed(1)}%
                        <TrendingUp className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] animate-bounce" />
                      </div>
                      <span className="text-[9px] text-[#0066B2] dark:text-[#38BDF8] font-bold">
                        +14.8% vs benchmark
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5">
                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Exit-Intent Saved
                      </span>
                      <div className="mt-0.5 text-xl font-black text-zinc-900 dark:text-white">
                        +{Math.round(150 + (progress / 100) * 34)} Leads
                      </div>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        23.4% traffic retained
                      </span>
                    </div>
                  </div>

                  {/* Animated Live Feed Log */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-1.5 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-zinc-400 text-[9px] uppercase tracking-wider border-b border-zinc-200/60 dark:border-white/5 pb-1 font-sans font-bold">
                      <span>Live Telemetry Stream</span>
                      <span className="flex items-center gap-1 text-[#0066B2] dark:text-[#38BDF8]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        [GA4 CAPI] &quot;lead_generated&quot;
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">200 OK</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        [Meta Conversions API] &quot;Lead (9.4)&quot;
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">200 OK</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 04: Drip Sequence Animated Pipeline */}
              {activeIdx === 3 && (
                <div className="space-y-2.5 animate-fadeIn relative">
                  {/* Sequence Header Bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Workflow className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                      <span className="font-bold text-zinc-900 dark:text-white">SaaS Nurture Sequence</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-1.5 py-0.5 rounded">
                      3 Steps Active
                    </span>
                  </div>

                  {/* 3 Step Cards with Details */}
                  <div className="space-y-2 relative">
                    {/* Step 1 */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs transition-all hover:border-[#0066B2]/30">
                      <div className="space-y-0.5">
                        <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          Email 1: Welcome & Playbook PDF
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-4">
                          Triggered immediately on opt-in · <span className="text-zinc-700 dark:text-zinc-300 font-semibold">88.4% Open</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
                        <Check className="h-2.5 w-2.5" /> Delivered
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#12151E] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] ring-2 ring-[#0066B2]/20" />
                          Email 2: 3 Common Funnel Mistakes
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-4">
                          Delay: 2 days later · <span className="text-zinc-700 dark:text-zinc-300 font-semibold">64.2% Est. Open</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md shrink-0">
                        Scheduled
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                          Email 3: Strategy Call Invitation
                        </p>
                        <p className="text-[10px] text-zinc-400 pl-4">
                          Delay: 4 days later · Stops if booked
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-2 py-1 rounded-md shrink-0">
                        Auto-Halt
                      </span>
                    </div>
                  </div>

                  {/* Smart Stop Guard Rule */}
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8]" />
                      Smart Auto-Stop Guard Active
                    </span>
                    <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">
                      Calendly / CRM Synced
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 05: Ecosystem Sync Live Pulse */}
              {activeIdx === 4 && (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                      <span className="font-bold text-zinc-900 dark:text-white">Real-Time Stack Sync</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" /> 4/4 Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
                        progress > 20
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/40 shadow-xs"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span className="text-base">🐝</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-xs">Beehiiv</p>
                        <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 20 && <Check className="h-2.5 w-2.5" />} Subscribed
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
                        progress > 40
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/40 shadow-xs"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span className="text-base">📧</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-xs">Kit</p>
                        <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 40 && <Check className="h-2.5 w-2.5" />} Tagged: lead
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
                        progress > 60
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/40 shadow-xs"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span className="text-base">💬</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-xs">Slack</p>
                        <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 60 && <Check className="h-2.5 w-2.5" />} #new-leads
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
                        progress > 80
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/40 shadow-xs"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span className="text-base">⚡</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-xs">Zapier</p>
                        <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 80 && <Check className="h-2.5 w-2.5" />} Webhook OK
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[10px] space-y-1 border border-zinc-800">
                    <div className="flex items-center justify-between text-zinc-400 text-[9px]">
                      <span>POST /v1/webhook/lead-captured</span>
                      <span className="text-[#38BDF8] flex items-center gap-1">
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

            {/* Bottom Metric Strip */}
            <div className="pt-3 border-t border-zinc-100 dark:border-white/5 grid grid-cols-2 gap-3 relative z-10">
              {activeStep.metrics.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{m.label}</span>
                  <span className="text-xs font-black text-[#0066B2] dark:text-[#38BDF8]">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

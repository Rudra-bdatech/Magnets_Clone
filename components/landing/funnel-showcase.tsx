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

  return (
    <div className="w-full">
      {/* 2-Column QAAssist Pure Minimalist Layout */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* LEFT COLUMN: Clean Text List with Floating Active State */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {STEPS.map((step, idx) => {
            const isActive = idx === activeIdx;

            if (isActive) {
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-3.5 py-1 animate-fadeIn"
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
                className="text-left py-1 text-sm sm:text-base font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer pl-11"
              >
                {step.title}
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Interactive Animated SaaS App Window */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white dark:bg-[#141822] border border-zinc-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5 relative z-10">
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

            {/* Dynamic Mockup Body with Live In-Card Animations */}
            <div className="min-h-[230px] flex flex-col justify-center relative z-10">
              {/* STAGE 01: AI Page Builder & Live Interactive Opt-in Simulation */}
              {activeIdx === 0 && (
                <div className="space-y-3 animate-fadeIn relative">
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
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 text-center space-y-2.5 relative">
                    <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">
                      Download Your Free SaaS Playbook
                    </h5>
                    <div className="max-w-xs mx-auto flex items-center gap-1.5 relative">
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
                        className={`px-3 py-1.5 rounded-lg text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm ${
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
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Encrypted File Host
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8]">
                        Zero Google Drive
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#12151E] border border-zinc-200/60 dark:border-white/5 transition-all hover:border-[#0066B2]/40">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center font-bold text-[10px]">
                          PDF
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">
                            saas-growth-playbook-2026.pdf
                          </p>
                          <span className="text-[9px] text-zinc-400">4.8 MB · Tokenized Storage</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-1.5 py-0.5 rounded">
                        Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Animated Dispatch Log */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-600 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Instant Fulfillment
                      </span>
                      <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold font-mono">
                        {isDelivered ? "Fired in 0.18s ✓" : "Firing..."}
                      </span>
                    </div>
                    {/* Animated Delivery Progress Line */}
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(progress * 1.6, 100)}%` }}
                      />
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
                        Exit Recovery
                      </span>
                      <div className="mt-0.5 text-xl font-black text-zinc-900 dark:text-white">
                        +{Math.round(150 + (progress / 100) * 34)} Leads
                      </div>
                      <span className="text-[9px] text-[#0066B2] dark:text-[#38BDF8] font-bold">
                        23.4% retained
                      </span>
                    </div>
                  </div>

                  {/* Animated Live Feed Log */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 space-y-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        [GA4] event: &quot;lead_generated&quot;
                      </span>
                      <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold">200 OK</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        [Meta Pixel] event: &quot;Lead (Complete)&quot;
                      </span>
                      <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold">200 OK</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 04: Drip Sequence Animated Pipeline */}
              {activeIdx === 3 && (
                <div className="space-y-2 animate-fadeIn relative">
                  <div className="p-2 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs transition-all hover:border-[#0066B2]/30">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0066B2]" /> Email 1: Welcome & Playbook PDF
                      </p>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Triggered immediately on opt-in</span>
                    </div>
                    <span className="text-[9px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" /> Delivered
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-[#12151E] border border-zinc-200/70 dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> Email 2: 3 Common Funnel Mistakes
                      </p>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Delay: 2 days later</span>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      Scheduled
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-50 dark:bg-[#181D2A] border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Email 3: Strategy Call Invitation
                      </p>
                      <span className="text-[9px] text-zinc-400">Stops automatically when booked</span>
                    </div>
                    <span className="text-[9px] font-bold text-[#0066B2] dark:text-[#38BDF8] bg-[#0066B2]/10 px-1.5 py-0.5 rounded">
                      Auto-Halt
                    </span>
                  </div>
                </div>
              )}

              {/* STAGE 05: Ecosystem Sync Live Pulse */}
              {activeIdx === 4 && (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div
                      className={`p-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                        progress > 20
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/30"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span>🐝</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-[11px]">Beehiiv</p>
                        <span className="text-[9px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 20 && <Check className="h-2.5 w-2.5" />} Subscribed
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                        progress > 40
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/30"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span>📧</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-[11px]">Kit</p>
                        <span className="text-[9px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 40 && <Check className="h-2.5 w-2.5" />} Tagged: lead
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                        progress > 60
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/30"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span>💬</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-[11px]">Slack</p>
                        <span className="text-[9px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 60 && <Check className="h-2.5 w-2.5" />} #new-leads
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                        progress > 80
                          ? "bg-zinc-50 dark:bg-[#181D2A] border-[#0066B2]/30"
                          : "bg-zinc-50/60 dark:bg-[#181D2A]/60 border-zinc-200/70 dark:border-white/5"
                      }`}
                    >
                      <span>⚡</span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white text-[11px]">Zapier</p>
                        <span className="text-[9px] text-[#0066B2] dark:text-[#38BDF8] font-semibold flex items-center gap-1">
                          {progress > 80 && <Check className="h-2.5 w-2.5" />} Webhook OK
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[10px] space-y-0.5 border border-zinc-800">
                    <div className="flex items-center justify-between text-zinc-500 text-[9px]">
                      <span>POST /v1/webhook/lead-captured</span>
                      <span className="text-[#38BDF8] flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        200 OK (112ms)
                      </span>
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

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Mail,
  Zap,
  Workflow,
  TrendingUp,
  Clock,
  Play,
  Pause,
  Send,
  FileText,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  HardDrive,
  Wand2,
  Lock,
  Download,
  Users,
  BarChart3,
  MousePointer,
} from "lucide-react";

export default function ShowcaseTabs() {
  const [phase, setPhase] = useState<number>(0);
  // Pixel coordinates relative to showcase container
  const [cursorPosPx, setCursorPosPx] = useState<{ x: number; y: number }>({ x: 300, y: 240 });
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [typedEmail, setTypedEmail] = useState<string>("");
  const [isOptinBtnActive, setIsOptinBtnActive] = useState<boolean>(false);
  const [isDownloadBtnActive, setIsDownloadBtnActive] = useState<boolean>(false);
  const [isSaveSeqBtnActive, setIsSaveSeqBtnActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(false);

  // Element Refs for 100% pixel-perfect dynamic cursor positioning
  const showcaseRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const optinBtnRef = useRef<HTMLButtonElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);
  const deployBtnRef = useRef<HTMLButtonElement>(null);
  const analyticsCardRef = useRef<HTMLDivElement>(null);
  const leadRowRef = useRef<HTMLDivElement>(null);

  // Helper to calculate exact pixel center of target element inside showcaseRef
  const moveCursorTo = useCallback((element: HTMLElement | null, offsetX = 0, offsetY = 0) => {
    if (!element || !showcaseRef.current) return;
    const targetRect = element.getBoundingClientRect();
    const containerRect = showcaseRef.current.getBoundingClientRect();

    const x = targetRect.left - containerRect.left + targetRect.width / 2 + offsetX;
    const y = targetRect.top - containerRect.top + targetRect.height / 2 + offsetY;

    setCursorPosPx({ x, y });
  }, []);

  // Parallax scroll link
  useEffect(() => {
    lineRef.current = document.getElementById("timeline-progress-line") as HTMLDivElement | null;
  }, []);

  useEffect(() => {
    let currentProgress = 0;
    let targetProgress = 0;
    let isRunning = false;
    let animationFrameId: number;

    const progressEl = lineRef.current;

    const updateLoop = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) > 0.02) {
        currentProgress += diff * 0.18;
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
        animationFrameId = requestAnimationFrame(updateLoop);
      } else {
        currentProgress = targetProgress;
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
        isRunning = false;
      }
    };

    const handleScroll = () => {
      const timelineEl = document.getElementById("timeline-node-tree");
      if (timelineEl) {
        const rect = timelineEl.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const totalHeight = rect.height;
        const scrollPos = windowHeight * 0.7 - rect.top;
        targetProgress = Math.min(Math.max(scrollPos / totalHeight, 0), 1) * 100;
      }

      const showcaseEl = showcaseRef.current;
      if (showcaseEl) {
        const rect = showcaseEl.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        const translateY = (clampedProgress - 0.5) * -35;
        showcaseEl.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
      }

      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(updateLoop);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Entrance observer for smooth reveal animation when entering screen
  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredViewport(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Autonomous Video-Like Playback State Machine with Exact Target Coordinates
  useEffect(() => {
    if (!isPlaying) return;

    let timers: NodeJS.Timeout[] = [];

    if (phase === 0) {
      // PHASE 0: AI Opt-In Landing Page
      setTypedEmail("");
      setIsOptinBtnActive(false);
      setIsClicking(false);

      // Move cursor to Email Input
      timers.push(
        setTimeout(() => {
          moveCursorTo(emailInputRef.current, -40, 0);
        }, 100)
      );

      // Simulate typing email
      const emailStr = "alex.founder@startup.co";
      emailStr.split("").forEach((_, idx) => {
        timers.push(
          setTimeout(() => {
            setTypedEmail(emailStr.slice(0, idx + 1));
          }, 350 + idx * 35)
        );
      });

      // Move cursor to exact center of "Get Instant Access" CTA button
      timers.push(
        setTimeout(() => {
          moveCursorTo(optinBtnRef.current);
        }, 1450)
      );

      // Click CTA button
      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsOptinBtnActive(true);
        }, 2050)
      );

      // Release click
      timers.push(
        setTimeout(() => {
          setIsClicking(false);
        }, 2350)
      );

      // Advance to Phase 1 (Instant Resource Delivery)
      timers.push(
        setTimeout(() => {
          setPhase(1);
        }, 2800)
      );
    } else if (phase === 1) {
      // PHASE 1: Locked PDF Delivery & Viewer
      setIsDownloadBtnActive(false);
      setIsClicking(false);

      // Move cursor to exact center of "Download Resource PDF" button
      timers.push(
        setTimeout(() => {
          moveCursorTo(downloadBtnRef.current);
        }, 400)
      );

      // Click Download button
      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsDownloadBtnActive(true);
        }, 1500)
      );

      // Release click
      timers.push(
        setTimeout(() => {
          setIsClicking(false);
        }, 1800)
      );

      // Advance to Phase 2 (Drip Sequence Workflow)
      timers.push(
        setTimeout(() => {
          setPhase(2);
        }, 2500)
      );
    } else if (phase === 2) {
      // PHASE 2: Drip Email Sequence Workflow
      setIsSaveSeqBtnActive(false);
      setIsClicking(false);

      // Move cursor to exact center of "Deploy Sequence" button
      timers.push(
        setTimeout(() => {
          moveCursorTo(deployBtnRef.current);
        }, 400)
      );

      // Click Deploy button
      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsSaveSeqBtnActive(true);
        }, 1400)
      );

      // Release click
      timers.push(
        setTimeout(() => {
          setIsClicking(false);
        }, 1700)
      );

      // Advance to Phase 3 (Live Analytics Dashboard)
      timers.push(
        setTimeout(() => {
          setPhase(3);
        }, 2400)
      );
    } else if (phase === 3) {
      // PHASE 3: Live Leads Stream & Telemetry
      setIsClicking(false);

      // Move cursor over the Opt-In Rate metric card
      timers.push(
        setTimeout(() => {
          moveCursorTo(analyticsCardRef.current);
        }, 400)
      );

      // Move cursor over live captured subscriber row
      timers.push(
        setTimeout(() => {
          moveCursorTo(leadRowRef.current);
        }, 1400)
      );

      // Advance to Phase 4 (Brand Slide)
      timers.push(
        setTimeout(() => {
          setPhase(4);
        }, 2600)
      );
    } else if (phase === 4) {
      // PHASE 4: Platform Summary Slide (Holds for 3.4s then loops back to Phase 0)
      setIsClicking(false);

      timers.push(
        setTimeout(() => {
          setPhase(0);
        }, 3400)
      );
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [phase, isPlaying, moveCursorTo]);

  return (
    <>
      {/* Hidden timeline progress tracker line */}
      <div
        ref={lineRef}
        id="timeline-progress-line"
        aria-hidden="true"
        style={{ height: "0%" }}
        className="hidden md:block absolute left-1/2 top-6 -translate-x-1/2 w-[2.5px] bg-gradient-to-b from-[#0066B2] via-[#38BDF8] via-purple-500 via-amber-500 to-emerald-500 rounded-full z-0 shadow-[0_0_14px_rgba(56,189,248,0.85)] max-h-[calc(100%-48px)] pointer-events-none"
      />

      {/* SINGLE UNIFIED APPLICATION FRAME (Pixel-perfect element tracking) */}
      <div
        ref={showcaseRef}
        className={`relative mt-12 sm:mt-16 w-full max-w-5xl mx-auto rounded-3xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#13141B] shadow-[0_22px_55px_-12px_rgba(9,30,66,0.18)] dark:shadow-[0_28px_60px_-12px_rgba(0,0,0,0.75)] p-4 sm:p-6 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none ring-1 ring-black/5 dark:ring-white/5 transition-all duration-1000 ease-out min-h-[440px] sm:min-h-[460px] flex flex-col justify-between ${
          hasEnteredViewport
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-[0.96]"
        }`}
        style={{ willChange: "transform, opacity" }}
      >
        {/* Ambient Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-12 left-1/2 -translate-x-1/2 -z-10 h-64 w-[85%] rounded-full bg-gradient-to-r from-[#0066B2]/20 via-[#38BDF8]/20 to-purple-500/15 blur-3xl opacity-75 pointer-events-none"
        />

        {/* ========================================================= */}
        {/* PHASE 0: AI OPT-IN LANDING PAGE GENERATOR & PREVIEW       */}
        {/* ========================================================= */}
        {phase === 0 && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
            {/* Topbar: Domain + SSL Badge */}
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-white/10 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
                <span className="ml-2 text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                  get.yourbrand.com/saas-playbook
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Auto-SSL Active
              </span>
            </div>

            {/* Split Landing Page Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-center">
              {/* Left Column: Headline, Bullets, Opt-in Form */}
              <div className="md:col-span-7 space-y-3.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] text-[11px] font-extrabold uppercase tracking-wider border border-[#0066B2]/20">
                  <Sparkles className="h-3.5 w-3.5" /> AI Opt-in Page
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug">
                  Get the 2026 SaaS Growth Playbook (Free PDF)
                </h3>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Discover 15 proven growth frameworks used by top founders to scale MRR cleanly.
                </p>

                {/* Email Form */}
                <div className="space-y-2.5 pt-1">
                  <div className="relative">
                    <input
                      ref={emailInputRef}
                      type="text"
                      readOnly
                      value={typedEmail}
                      placeholder="Enter your work email..."
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/80 dark:bg-[#1A1A22] px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white font-medium shadow-xs outline-none"
                    />
                    {typedEmail.length > 10 && (
                      <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Valid ✓
                      </span>
                    )}
                  </div>

                  <button
                    ref={optinBtnRef}
                    type="button"
                    className={`w-full rounded-xl bg-gradient-to-r from-[#0066B2] to-[#0088FF] py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0066B2]/20 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isOptinBtnActive ? "scale-98 brightness-110 ring-2 ring-[#0066B2]/50" : ""
                    }`}
                  >
                    Get Instant Access <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: PDF Cover Mockup */}
              <div className="md:col-span-5 bg-zinc-50/80 dark:bg-[#1A1B26] rounded-2xl border border-zinc-200 dark:border-white/10 p-5 shadow-sm space-y-4 text-center">
                <div className="h-32 sm:h-36 rounded-xl bg-gradient-to-br from-[#0066B2]/15 via-purple-500/10 to-emerald-500/10 border border-blue-500/20 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <FileText className="h-9 w-9 text-[#0066B2] dark:text-[#38BDF8] mb-1.5" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    SaaS Growth Playbook.pdf
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">24 Pages · Native Hosted</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-1">
                  <span>⚡ Instant Fulfillment</span>
                  <span className="text-emerald-500 font-bold">51.2% Opt-in</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 1: INSTANT FULFILLMENT & LOCKED RESOURCE DELIVERY   */}
        {/* ========================================================= */}
        {phase === 1 && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
            <div>
              {/* Delivery Header */}
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Instant Resource Fulfillment Triggered
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Delivered to: alex.founder@startup.co · 0s latency
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Delivered ✓
                </span>
              </div>

              {/* Resource Preview & Download Box */}
              <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-zinc-200/70 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="h-5 w-5 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      2026 SaaS Growth Playbook (Complete PDF)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">3.2 MB · Direct Access</span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your resource is hosted natively on LeadMagnets with zero Google Drive links, reader drop-off telemetry, and automated drip sequence enrollment.
                </p>

                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <button
                    ref={downloadBtnRef}
                    type="button"
                    className={`px-5 py-2.5 rounded-xl bg-[#0066B2] text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition cursor-pointer ${
                      isDownloadBtnActive ? "scale-95 ring-2 ring-[#0066B2]/50" : ""
                    }`}
                  >
                    <Download className="h-4 w-4" /> Download Resource PDF
                  </button>
                  <span className="text-xs text-zinc-400 font-medium">
                    Auto-enrolled in 3-Step Drip Sequence
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-400">
              <span>Next action: Day 2 Value Email scheduled</span>
              <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">Sequence #1 Active</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2: AUTOMATED DRIP SEQUENCE WORKFLOW                 */}
        {/* ========================================================= */}
        {phase === 2 && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Automated Drip Follow-Up Workflow
                  </span>
                </div>
                <button
                  ref={deployBtnRef}
                  type="button"
                  className={`px-4 py-1.5 rounded-lg bg-[#0066B2] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer ${
                    isSaveSeqBtnActive ? "scale-95 ring-2 ring-[#0066B2]/50" : ""
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" /> Deploy Sequence
                </button>
              </div>

              {/* 3 Step Pipeline Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-blue-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] uppercase">
                    Step 1 · 0s Latency
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">PDF Delivery Email</p>
                  <p className="text-xs text-zinc-400">94% Open · Instant download</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-purple-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-purple-500 uppercase">Step 2 · +2 Days</span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Value Teardown Email</p>
                  <p className="text-xs text-zinc-400">68% Open · 3 Growth case studies</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-emerald-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Step 3 · +5 Days</span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Strategy Call Offer</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Auto-stops on booking ✓
                  </p>
                </div>
              </div>

              {/* Auto-stop condition callout */}
              <div className="mt-4 p-3 rounded-xl bg-[#DCFCE7]/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-[#15803D] dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Smart Auto-Stop Rule:</strong> When subscriber books a call via Calendly link, all remaining emails cancel automatically.
                </span>
              </div>
            </div>

            <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              Turn cold subscribers into booked client calls hands-free
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 3: LIVE LEADS & CONVERSION TELEMETRY                */}
        {/* ========================================================= */}
        {phase === 3 && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Live Performance &amp; Leads Telemetry
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Real-time
                </span>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3.5 mb-4">
                <div className="bg-zinc-50/80 dark:bg-[#1A1B26] p-3.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Visitors</span>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">2,840</p>
                  <span className="text-xs font-bold text-emerald-500">↑ +18.4% this week</span>
                </div>
                <div
                  ref={analyticsCardRef}
                  className="bg-zinc-50/80 dark:bg-[#1A1B26] p-3.5 rounded-2xl border border-blue-500/40 ring-1 ring-blue-500/20"
                >
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Opt-In Rate</span>
                  <p className="text-2xl font-black text-[#0066B2] dark:text-[#38BDF8] mt-1">51.2%</p>
                  <span className="text-xs font-semibold text-zinc-400">Top 5% SaaS Benchmark</span>
                </div>
                <div className="bg-zinc-50/80 dark:bg-[#1A1B26] p-3.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Calls Booked</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">14</p>
                  <span className="text-xs font-bold text-emerald-500">$35,000 Pipeline</span>
                </div>
              </div>

              {/* Real-time Lead Stream */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Recent Captured Leads</span>
                <div
                  ref={leadRowRef}
                  className="p-3 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">alex.founder@startup.co</span>
                  </div>
                  <span className="text-xs text-zinc-400">Opted in 0s ago · Instant PDF Delivered</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              Full visitor attribution, exit-intent captures, and conversion analytics
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 4: EXACT GRAPHIC BRAND SLIDE FROM QA ASSIST         */}
        {/* ========================================================= */}
        {phase === 4 && (
          <div className="flex-1 -m-4 sm:-m-6 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 animate-in zoom-in-98 duration-400 shadow-2xl rounded-3xl">
            {/* Colorful Geometric Block Backgrounds (Lavender, Blue, Green, Yellow) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none"
            >
              {/* Top Left: Soft Lavender / Lilac */}
              <div className="bg-[#B8B0FF] dark:bg-[#8D82F0]" />
              {/* Top Right & Entire Right Side: Warm Vibrant Gold / Yellow */}
              <div className="row-span-2 bg-[#F6C343] dark:bg-[#E5B334]" />
              {/* Bottom Left: Vibrant Royal Blue & Green corner */}
              <div className="bg-[#1264FF] relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-[#10B981]" />
              </div>
            </div>

            {/* Jet-Black Rounded Semicircular Capsule Element */}
            <div className="relative z-10 w-[94%] sm:w-[90%] max-w-2xl bg-[#0F0F11] text-white rounded-l-2xl sm:rounded-l-3xl rounded-r-[140px] sm:rounded-r-[220px] p-6 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-center min-h-[220px] sm:min-h-[280px]">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-[1.2] max-w-md">
                Introducing <strong className="font-extrabold text-white">AI lead magnets &amp; automated nurture</strong> in{" "}
                <span className="font-extrabold text-white">LeadMagnets</span>
              </h2>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIRTUAL AUTONOMOUS MOUSE POINTER (Pixel-Perfect Dynamic)  */}
        {/* ========================================================= */}
        <div
          className="pointer-events-none absolute z-50 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            transform: `translate3d(${cursorPosPx.x}px, ${cursorPosPx.y}px, 0) ${
              isClicking ? "scale(0.82)" : "scale(1)"
            }`,
            opacity: phase === 4 ? 0 : 1,
            top: 0,
            left: 0,
          }}
        >
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] text-[#0F172A] dark:text-white fill-current -translate-x-1 -translate-y-1"
            viewBox="0 0 24 24"
          >
            <path
              d="M3 3l7 18 3.5-6.5L20 11 3 3z"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>

          {isClicking && (
            <span className="absolute -top-3 -left-3 h-12 w-12 rounded-full border-2 border-[#0066B2] dark:border-[#38BDF8] animate-ping pointer-events-none" />
          )}
        </div>

        {/* ========================================================= */}
        {/* FLOATING PLAY / PAUSE BUTTON                              */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause automated demo video" : "Play automated demo video"}
          className="absolute bottom-3.5 right-3.5 sm:bottom-5 sm:right-5 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white text-zinc-800 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer z-30"
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current text-zinc-800" />
          ) : (
            <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current text-[#0066B2] ml-0.5" />
          )}
        </button>
      </div>
    </>
  );
}

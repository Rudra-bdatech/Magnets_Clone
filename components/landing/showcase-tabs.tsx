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
  Lock,
  Download,
  Users,
  BarChart3,
  MousePointer,
  Filter,
  Layers,
  Database,
  Tag,
} from "lucide-react";

export default function ShowcaseTabs() {
  // 6 Non-AI, Pure Platform Feature Scenes:
  // Phase 0: Opt-in Landing Page & Custom Domain (Visitor types email & clicks "Get Instant Access")
  // Phase 1: Native Document Hosting & Locked PDF (Direct file hosting, no Drive links)
  // Phase 2: Drip Email Sequence Workflow (3-step automated flow with Calendly auto-stop)
  // Phase 3: Leads CRM & Contact Management (Searchable contact database with tags)
  // Phase 4: Live Telemetry & Conversion Analytics (2,840 visitors, 51.2% opt-in)
  // Phase 5: Colorful Geometric Brand Slide ("Introducing lead magnets & automated nurture in LeadMagnets")
  const [phase, setPhase] = useState<number>(0);
  const [cursorPosPx, setCursorPosPx] = useState<{ x: number; y: number }>({ x: 300, y: 240 });
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [typedEmail, setTypedEmail] = useState<string>("");
  const [isOptinBtnActive, setIsOptinBtnActive] = useState<boolean>(false);
  const [isDownloadBtnActive, setIsDownloadBtnActive] = useState<boolean>(false);
  const [isSaveSeqBtnActive, setIsSaveSeqBtnActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(false);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomOrigin, setZoomOrigin] = useState<string>("center center");

  // Dynamic Element Refs for accurate cursor positioning
  const showcaseRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const optinBtnRef = useRef<HTMLButtonElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);
  const deployBtnRef = useRef<HTMLButtonElement>(null);
  const leadRowRef = useRef<HTMLDivElement>(null);
  const analyticsCardRef = useRef<HTMLDivElement>(null);

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
    // Smoothed parallax value for the showcase card (lerped each RAF tick)
    let currentTranslateY = 0;
    let targetTranslateY = 0;

    const progressEl = lineRef.current;

    const updateLoop = () => {
      // Timeline progress bar lerp
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) > 0.02) {
        currentProgress += diff * 0.18;
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
      } else {
        currentProgress = targetProgress;
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
      }

      // Showcase card parallax lerp — runs continuously so mobile
      // momentum/inertia scroll is smooth (iOS scroll events don't fire mid-inertia)
      const showcaseEl = showcaseRef.current;
      if (showcaseEl) {
        const rect = showcaseEl.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const clampedProgress = Math.min(Math.max(progress, 0), 1);
        targetTranslateY = (clampedProgress - 0.5) * -35;

        // Lerp toward target each frame for buttery smoothness on all devices
        currentTranslateY += (targetTranslateY - currentTranslateY) * 0.1;
        showcaseEl.style.transform = `translate3d(0, ${currentTranslateY.toFixed(2)}px, 0)`;
      }

      // Timeline progress bar sync
      if (Math.abs(targetProgress - currentProgress) > 0.02) {
        isRunning = true;
      }

      // Keep the RAF loop alive continuously for mobile parallax
      animationFrameId = requestAnimationFrame(updateLoop);
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

      if (!isRunning) {
        isRunning = true;
      }
    };

    // Start the continuous RAF loop immediately (works on desktop + mobile)
    animationFrameId = requestAnimationFrame(updateLoop);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Entrance observer for smooth reveal animation
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

  // Autonomous Video-Like Playback State Machine (No AI references)
  useEffect(() => {
    if (!isPlaying) return;

    let timers: NodeJS.Timeout[] = [];

    if (phase === 0) {
      // PHASE 0: Opt-In Landing Page
      setTypedEmail("");
      setIsOptinBtnActive(false);
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          moveCursorTo(emailInputRef.current, -40, 0);
        }, 100)
      );

      const emailStr = "alex.founder@startup.co";
      emailStr.split("").forEach((_, idx) => {
        timers.push(
          setTimeout(() => {
            setTypedEmail(emailStr.slice(0, idx + 1));
          }, 350 + idx * 35)
        );
      });

      timers.push(
        setTimeout(() => {
          setZoomOrigin("35% 65%");
          setIsZooming(true);
          moveCursorTo(optinBtnRef.current);
        }, 1400)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsOptinBtnActive(true);
        }, 2050)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 2350)
      );

      timers.push(
        setTimeout(() => {
          setPhase(1);
        }, 2800)
      );
    } else if (phase === 1) {
      // PHASE 1: Native Document Hosting & Locked PDF
      setIsDownloadBtnActive(false);
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          setZoomOrigin("85% 60%");
          setIsZooming(true);
          moveCursorTo(downloadBtnRef.current);
        }, 350)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsDownloadBtnActive(true);
        }, 1400)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 1700)
      );

      timers.push(
        setTimeout(() => {
          setPhase(2);
        }, 2400)
      );
    } else if (phase === 2) {
      // PHASE 2: Drip Email Sequence Workflow ("Deploy Sequence" button)
      setIsSaveSeqBtnActive(false);
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          setZoomOrigin("88% 20%"); // Focuses onto top-right Deploy Sequence button
          setIsZooming(true);
          moveCursorTo(deployBtnRef.current);
        }, 350)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsSaveSeqBtnActive(true);
        }, 1400)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 1700)
      );

      timers.push(
        setTimeout(() => {
          setPhase(3);
        }, 2400)
      );
    } else if (phase === 3) {
      // PHASE 3: Leads CRM & Contact Management
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          setZoomOrigin("50% 50%");
          setIsZooming(true);
          moveCursorTo(leadRowRef.current);
        }, 450)
      );

      timers.push(
        setTimeout(() => {
          setIsZooming(false);
        }, 1800)
      );

      timers.push(
        setTimeout(() => {
          setPhase(4);
        }, 2400)
      );
    } else if (phase === 4) {
      // PHASE 4: Live Telemetry & Conversion Analytics
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          setZoomOrigin("30% 45%");
          setIsZooming(true);
          moveCursorTo(analyticsCardRef.current);
        }, 350)
      );

      timers.push(
        setTimeout(() => {
          setIsZooming(false);
        }, 1800)
      );

      timers.push(
        setTimeout(() => {
          setPhase(5);
        }, 2500)
      );
    } else if (phase === 5) {
      // PHASE 5: Platform Summary Slide
      setIsClicking(false);
      setIsZooming(false);

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

      {/* SINGLE UNIFIED APPLICATION FRAME */}
      <div
        ref={showcaseRef}
        className={`relative mt-12 sm:mt-16 w-full max-w-5xl mx-auto rounded-3xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#13141B] shadow-[0_22px_55px_-12px_rgba(9,30,66,0.18)] dark:shadow-[0_28px_60px_-12px_rgba(0,0,0,0.75)] p-4 sm:p-6 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none ring-1 ring-black/5 dark:ring-white/5 transition-all duration-1000 ease-out h-[440px] sm:h-[460px] flex flex-col ${
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

        {/* Dynamic Zoom & Pan Camera Container Following Exact Mouse Pixel Coordinates */}
        <div
          className="flex-1 flex flex-col justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10"
          style={{
            transform: isZooming ? "scale(1.16)" : "scale(1)",
            transformOrigin: `${cursorPosPx.x}px ${cursorPosPx.y}px`,
          }}
        >
          {/* ========================================================= */}
          {/* PHASE 0: OPT-IN LANDING PAGE & CUSTOM DOMAIN              */}
          {/* ========================================================= */}
        {phase === 0 && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
            {/* Topbar */}
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

            {/* Split Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-center">
              <div className="md:col-span-7 space-y-3.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] text-[11px] font-extrabold uppercase tracking-wider border border-[#0066B2]/20">
                  <FileText className="h-3.5 w-3.5" /> High-Converting Lead Magnet
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug">
                  Get the 2026 SaaS Growth Playbook (Free PDF)
                </h3>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Discover 15 proven growth frameworks used by top founders to scale MRR cleanly.
                </p>

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
        {/* PHASE 1: NATIVE DOCUMENT HOSTING & LOCKED PDF             */}
        {/* ========================================================= */}
        {phase === 1 && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
            <div>
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

              <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-zinc-200/70 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="h-5 w-5 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      2026 SaaS Growth Playbook (Complete PDF)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">3.2 MB · Native Hosted</span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Host documents and PDFs directly on LeadMagnets with zero Google Drive links, secure reader telemetry, and automatic sequence enrollment.
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
        {/* PHASE 2: AUTOMATED DRIP EMAIL SEQUENCES                   */}
        {/* ========================================================= */}
        {phase === 2 && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
            <div>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-blue-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#0066B2] dark:text-[#38BDF8] uppercase">
                    Step 1 · Immediate
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">PDF Delivery Email</p>
                  <p className="text-xs text-zinc-400">94% Open · Instant download</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-purple-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-purple-500 uppercase">Step 2 · +2 Days</span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Value Case Study</p>
                  <p className="text-xs text-zinc-400">68% Open · 3 Growth teardowns</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-emerald-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Step 3 · +5 Days</span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">Strategy Call Offer</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Auto-stops on booking ✓
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[#DCFCE7]/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs text-[#15803D] dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Smart Auto-Stop:</strong> When a subscriber books a call via Calendly or Stripe, all remaining nurture emails are automatically cancelled.
                </span>
              </div>
            </div>

            <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              Turn subscribers into booked client calls hands-free
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 3: LEADS CRM & CONTACT DATABASE                     */}
        {/* ========================================================= */}
        {phase === 3 && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3 mb-3.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Captured Leads Database
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">(2,840 Total Leads)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                    Export CSV
                  </span>
                </div>
              </div>

              {/* Leads Table */}
              <div className="space-y-2">
                <div
                  ref={leadRowRef}
                  className="p-3 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-blue-500/30 ring-1 ring-blue-500/20 flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">alex.founder@startup.co</p>
                      <p className="text-[11px] text-zinc-400">Source: get.yourbrand.com/saas-playbook</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] dark:bg-emerald-950/40 text-[#15803D] dark:text-emerald-300">
                      Step 1 Delivered
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">Just now</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-[#1A1B26] border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-xs sm:text-sm opacity-85">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">sarah.p@agency.io</p>
                      <p className="text-[11px] text-zinc-400">Source: get.yourbrand.com/outreach</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAE6FF] dark:bg-purple-950/40 text-[#6554C0] dark:text-purple-300">
                      Step 2 (Day 2 Sent)
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">2h ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              Synced with LeadMagnets automated contact manager
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 4: LIVE TELEMETRY & CONVERSION ANALYTICS            */}
        {/* ========================================================= */}
        {phase === 4 && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Live Performance &amp; Conversion Telemetry
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Real-time
                </span>
              </div>

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
                  <span className="text-xs font-semibold text-zinc-400">Top 5% Benchmark</span>
                </div>
                <div className="bg-zinc-50/80 dark:bg-[#1A1B26] p-3.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Calls Booked</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">14</p>
                  <span className="text-xs font-bold text-emerald-500">$35,000 Pipeline</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              Visitor analytics, exit-intent captures, and conversion tracking
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PHASE 5: EXACT GRAPHIC BRAND SLIDE                        */}
        {/* ========================================================= */}
        {phase === 5 && (
          <div className="flex-1 -m-4 sm:-m-6 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 animate-in zoom-in-98 duration-400 shadow-2xl rounded-3xl">
            {/* Colorful Geometric Block Backgrounds (Lavender, Blue, Green, Yellow) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none"
            >
              <div className="bg-[#B8B0FF] dark:bg-[#8D82F0]" />
              <div className="row-span-2 bg-[#F6C343] dark:bg-[#E5B334]" />
              <div className="bg-[#1264FF] relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-[#10B981]" />
              </div>
            </div>

            {/* Jet-Black Rounded Semicircular Capsule Element */}
            <div className="relative z-10 w-[94%] sm:w-[90%] max-w-2xl bg-[#0F0F11] text-white rounded-l-2xl sm:rounded-l-3xl rounded-r-[140px] sm:rounded-r-[220px] p-6 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-center min-h-[220px] sm:min-h-[280px]">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-[1.2] max-w-md">
                Introducing <strong className="font-extrabold text-white">lead magnets &amp; automated nurture</strong> in{" "}
                <span className="font-extrabold text-white">LeadMagnets</span>
              </h2>
            </div>
          </div>
        )}

        </div>

        {/* ========================================================= */}
        {/* VIRTUAL AUTONOMOUS MOUSE POINTER (Pixel-Perfect Dynamic)  */}
        {/* ========================================================= */}
        <div
          className="pointer-events-none absolute z-50 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            transform: `translate3d(${cursorPosPx.x}px, ${cursorPosPx.y}px, 0) ${
              isClicking ? "scale(0.82)" : "scale(1)"
            }`,
            opacity: phase === 5 ? 0 : 1,
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

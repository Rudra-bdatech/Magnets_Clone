"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ShieldCheck,
  Check,
  HardDrive,
  Lock,
  Unlock,
  Download,
  Users,
  BarChart3,
  MousePointer,
  Filter,
  Layers,
  Database,
  Tag,
  Radio,
  Eye,
  Palette,
  Layout,
  Sliders,
  Moon,
  Sun,
  Laptop,
  Globe,
  Server,
  Copy,
  RefreshCw,
} from "lucide-react";

export default function ShowcaseTabs() {
  // 7 Real Platform Feature Scenes:
  // 0: Opt-in Landing Page
  // 1: Real Custom Domain & CNAME DNS Configuration (PRO Feature)
  // 2: Locked PDF Reader (Page-flip preview with frosted glass blur & email gate)
  // 3: 8 Designer Templates & Live Theme Engine
  // 4: Automated Drip Sequence Follow-Up Workflow
  // 5: Live Telemetry & Captured Leads CRM
  // 6: Brand Graphic Slide ("Introducing lead magnets & automated nurture in LeadMagnets") sliding up from bottom
  const [phase, setPhase] = useState<number>(0);
  const [cursorPosPx, setCursorPosPx] = useState<{ x: number; y: number }>({ x: 300, y: 240 });
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [typedEmail, setTypedEmail] = useState<string>("");
  const [typedDomain, setTypedDomain] = useState<string>("growthlab.io");
  const [isOptinBtnActive, setIsOptinBtnActive] = useState<boolean>(false);
  const [isDnsVerified, setIsDnsVerified] = useState<boolean>(false);
  const [isPdfUnlocked, setIsPdfUnlocked] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [selectedBrandColor, setSelectedBrandColor] = useState<string>("#0066B2");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);
  const [isSeqDeployed, setIsSeqDeployed] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(false);
  const [isZooming, setIsZooming] = useState<boolean>(false);

  // Dynamic Element Refs for accurate cursor positioning
  const showcaseRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const optinBtnRef = useRef<HTMLButtonElement>(null);
  const domainInputRef = useRef<HTMLInputElement>(null);
  const verifyDnsBtnRef = useRef<HTMLButtonElement>(null);
  const unlockPdfBtnRef = useRef<HTMLButtonElement>(null);
  const templateSwatchRef = useRef<HTMLButtonElement>(null);
  const workflowStep2Ref = useRef<HTMLDivElement>(null);
  const deployBtnRef = useRef<HTMLButtonElement>(null);
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
    let currentTranslateY = 0;
    let targetTranslateY = 0;
    let currentScale = 0.88;
    let targetScale = 0.88;
    let currentRotateX = 0;
    let targetRotateX = 0;

    const progressEl = lineRef.current;

    const updateLoop = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) > 0.02) {
        currentProgress += diff * 0.18;
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
      } else {
        currentProgress = targetProgress;
        if (progressEl) progressEl.style.height = `${currentProgress.toFixed(2)}%`;
      }

      const showcaseEl = showcaseRef.current;
      if (showcaseEl) {
        const rect = showcaseEl.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isMobile = window.innerWidth < 768;

        const entryProgress = (windowHeight - rect.top) / (windowHeight * 0.7);
        const clampedEntry = Math.min(Math.max(entryProgress, 0), 1);

        if (isMobile) {
          targetScale = 0.88 + clampedEntry * 0.12;
          targetTranslateY = (1 - clampedEntry) * 28 + (clampedEntry - 0.5) * -14;
          targetRotateX = (1 - clampedEntry) * 3.5;
        } else {
          targetScale = 0.95 + clampedEntry * 0.05;
          targetTranslateY = (clampedEntry - 0.5) * -25;
          targetRotateX = 0;
        }

        currentTranslateY += (targetTranslateY - currentTranslateY) * 0.12;
        currentScale += (targetScale - currentScale) * 0.12;
        currentRotateX += (targetRotateX - currentRotateX) * 0.12;

        showcaseEl.style.transform = `perspective(1000px) translate3d(0, ${currentTranslateY.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)}) rotateX(${currentRotateX.toFixed(2)}deg)`;
      }

      if (Math.abs(targetProgress - currentProgress) > 0.02) {
        isRunning = true;
      }

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

    animationFrameId = requestAnimationFrame(updateLoop);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
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

  // Autonomous Video-Like Playback State Machine with Smooth Camera Zooms
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
          moveCursorTo(emailInputRef.current, -30, 0);
        }, 120)
      );

      const emailStr = "sarah.founder@startup.io";
      emailStr.split("").forEach((_, idx) => {
        timers.push(
          setTimeout(() => {
            setTypedEmail(emailStr.slice(0, idx + 1));
          }, 350 + idx * 28)
        );
      });

      // Smooth camera glide & zoom into button
      timers.push(
        setTimeout(() => {
          moveCursorTo(optinBtnRef.current);
          setIsZooming(true);
        }, 1250)
      );

      // Mouse click
      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsOptinBtnActive(true);
        }, 1850)
      );

      // Release & ease out camera
      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 2200)
      );

      timers.push(
        setTimeout(() => {
          setPhase(1);
        }, 2700)
      );
    } else if (phase === 1) {
      // PHASE 1: Real Custom Domain & CNAME Verification (PRO)
      setTypedDomain("");
      setIsDnsVerified(false);
      setIsClicking(false);
      setIsZooming(false);

      // Move cursor to domain input
      timers.push(
        setTimeout(() => {
          moveCursorTo(domainInputRef.current, -20, 0);
        }, 120)
      );

      // Type out custom domain letter-by-letter
      const domainStr = "growthlab.io";
      domainStr.split("").forEach((_, idx) => {
        timers.push(
          setTimeout(() => {
            setTypedDomain(domainStr.slice(0, idx + 1));
          }, 350 + idx * 32)
        );
      });

      // Glide and zoom into the Verify DNS Records button
      timers.push(
        setTimeout(() => {
          moveCursorTo(verifyDnsBtnRef.current);
          setIsZooming(true);
        }, 1180)
      );

      // Click to verify DNS & CNAME
      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsDnsVerified(true);
        }, 1750)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 2200)
      );

      timers.push(
        setTimeout(() => {
          setPhase(2);
        }, 2900)
      );
    } else if (phase === 2) {
      // PHASE 2: Locked PDF Reader with Frosted Glass Gate
      setIsPdfUnlocked(false);
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          moveCursorTo(unlockPdfBtnRef.current);
          setIsZooming(true);
        }, 300)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsPdfUnlocked(true);
        }, 1250)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 1750)
      );

      timers.push(
        setTimeout(() => {
          setPhase(3);
        }, 2600)
      );
    } else if (phase === 3) {
      // PHASE 3: 8 Brand Templates & Live Customizer
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          moveCursorTo(templateSwatchRef.current);
          setIsZooming(true);
        }, 300)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setSelectedBrandColor("#8B5CF6");
          setSelectedTemplate(1);
        }, 1150)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 1600)
      );

      timers.push(
        setTimeout(() => {
          setPhase(4);
        }, 2500)
      );
    } else if (phase === 4) {
      // PHASE 4: Automated Drip Sequence Workflow
      setActiveWorkflowStep(0);
      setIsSeqDeployed(false);
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          setActiveWorkflowStep(1);
          moveCursorTo(workflowStep2Ref.current);
        }, 700)
      );

      timers.push(
        setTimeout(() => {
          moveCursorTo(deployBtnRef.current);
          setIsZooming(true);
        }, 1600)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(true);
          setIsSeqDeployed(true);
        }, 2250)
      );

      timers.push(
        setTimeout(() => {
          setIsClicking(false);
          setIsZooming(false);
        }, 2650)
      );

      timers.push(
        setTimeout(() => {
          setPhase(5);
        }, 3300)
      );
    } else if (phase === 5) {
      // PHASE 5: Live Telemetry & Leads CRM
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          moveCursorTo(analyticsCardRef.current);
          setIsZooming(true);
        }, 300)
      );

      timers.push(
        setTimeout(() => {
          setIsZooming(false);
        }, 1800)
      );

      timers.push(
        setTimeout(() => {
          setPhase(6);
        }, 2800)
      );
    } else if (phase === 6) {
      // PHASE 6: Brand Graphic Intro Slide (Slides from bottom)
      setIsClicking(false);
      setIsZooming(false);

      timers.push(
        setTimeout(() => {
          setPhase(0);
        }, 3600)
      );
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [phase, isPlaying, moveCursorTo]);

  // Real platform tabs matching actual features
  const platformTabs = [
    { label: "Landing Page", icon: FileText, phaseIdx: 0 },
    { label: "Custom Domain", icon: Globe, phaseIdx: 1 },
    { label: "Locked PDF", icon: Lock, phaseIdx: 2 },
    { label: "Templates", icon: Layout, phaseIdx: 3 },
    { label: "Drip Sequences", icon: Workflow, phaseIdx: 4 },
    { label: "Telemetry & CRM", icon: BarChart3, phaseIdx: 5 },
    { label: "Overview", icon: Sparkles, phaseIdx: 6 },
  ];

  const templatePresets = [
    { name: "Cobalt Modern", color: "#0066B2", subtitle: "SaaS Playbook", theme: "Dark Glass" },
    { name: "Violet Minimal", color: "#8B5CF6", subtitle: "Growth Teardown", theme: "Minimal" },
    { name: "Emerald Pro", color: "#10B981", subtitle: "Swipe File", theme: "Bento" },
    { name: "Amber Creator", color: "#F59E0B", subtitle: "Resource Vault", theme: "Clean" },
  ];

  const workflowSteps = [
    {
      stepNum: "01",
      badge: "IMMEDIATE",
      title: "PDF Delivery & Welcome",
      delay: "Instant (0s latency)",
      subject: "📄 Here's your 2026 SaaS Growth Playbook (Instant Access)",
      preview: "Hey Sarah, thanks for opting in! Your 24-page playbook is attached and available in your secure reader.",
      stat: "94% Open Rate",
      cta: "📥 Read Document",
    },
    {
      stepNum: "02",
      badge: "+2 DAYS",
      title: "Key Frameworks Teardown",
      delay: "48 Hours after opt-in",
      subject: "📊 3 Retention Frameworks from Chapter 4 of the Playbook",
      preview: "Hey Sarah, quick follow-up: here are the exact 3 retention levers top founders use to scale from $10k to $100k MRR.",
      stat: "71% Open Rate",
      cta: "🔍 View Case Studies",
    },
    {
      stepNum: "03",
      badge: "+5 DAYS",
      title: "Upgrade & Full Access Offer",
      delay: "120 Hours (Auto-cancels if converted)",
      subject: "⚡ Ready to deploy your own lead engines in 60 seconds?",
      preview: "Hey Sarah, want to build automated lead magnets with locked PDFs and instant webhooks? Activate your full workspace.",
      stat: "Auto-stops on Conversion ✓",
      cta: "🚀 Launch Workspace",
    },
  ];

  return (
    <>
      {/* Background timeline progress tracker line */}
      <div
        ref={lineRef}
        id="timeline-progress-line"
        aria-hidden="true"
        style={{ height: "0%" }}
        className="hidden md:block absolute left-1/2 top-6 -translate-x-1/2 w-[2.5px] bg-gradient-to-b from-[#0066B2] via-[#38BDF8] via-purple-500 via-amber-500 to-emerald-500 rounded-full z-0 shadow-[0_0_14px_rgba(56,189,248,0.85)] max-h-[calc(100%-48px)] pointer-events-none"
      />

      {/* APPLE-GRADE UNIFIED HARDWARE FRAME */}
      <div
        ref={showcaseRef}
        className={`relative mt-12 sm:mt-16 w-full max-w-5xl mx-auto rounded-[28px] sm:rounded-[32px] border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0E0F15] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_35px_80px_-20px_rgba(0,0,0,0.85)] p-4 sm:p-7 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none ring-1 ring-black/5 dark:ring-white/5 transition-opacity duration-700 ease-out min-h-[480px] sm:min-h-[510px] flex flex-col justify-between ${
          hasEnteredViewport ? "opacity-100" : "opacity-0"
        }`}
        style={{ willChange: "transform, opacity", transformOrigin: "center 30%" }}
      >
        {/* Apple-grade Ambient Radial Backlight */}
        <div
          aria-hidden="true"
          className="absolute -top-16 left-1/2 -translate-x-1/2 -z-10 h-72 w-[90%] rounded-full bg-gradient-to-r from-[#0066B2]/20 via-[#38BDF8]/20 to-purple-600/15 blur-3xl opacity-80 pointer-events-none"
        />

        {/* Top Header & Segmented Apple-Style Nav Control */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-white/10 pb-3 mb-4 shrink-0 overflow-x-auto no-scrollbar">
          {/* Segmented Pills */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-100/90 dark:bg-[#161722] border border-zinc-200/80 dark:border-white/5 shrink-0">
            {platformTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = phase === tab.phaseIdx;
              return (
                <button
                  key={tab.phaseIdx}
                  type="button"
                  onClick={() => {
                    setPhase(tab.phaseIdx);
                    setIsPlaying(false);
                  }}
                  className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 rounded-xl bg-[#0066B2] shadow-[0_2px_10px_rgba(0,102,178,0.4)]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Live Workspace
            </span>
          </div>
        </div>

        {/* Dynamic Zoom & Pan Camera Container Following Exact Mouse Pixel Coordinates */}
        <div
          className="flex-1 flex flex-col justify-between transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] relative z-10"
          style={{
            transform: isZooming ? "scale(1.14)" : "scale(1)",
            transformOrigin: `${cursorPosPx.x}px ${cursorPosPx.y}px`,
            willChange: "transform, transform-origin",
          }}
        >
          {/* ========================================================= */}
          {/* PHASE 0: REAL OPT-IN LANDING PAGE                         */}
          {/* ========================================================= */}
          {phase === 0 && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
              {/* Browser Mockup Chrome */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 dark:border-white/10 pb-2.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/90 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90 inline-block" />
                  <span className="ml-2 px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-[#181924] text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/5 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    get.growthlab.io/saas-playbook
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Auto-SSL Active
                  </span>
                </div>
              </div>

              {/* Split Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-center">
                <div className="md:col-span-7 space-y-3.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] text-xs font-bold border border-[#0066B2]/20">
                    <FileText className="h-3.5 w-3.5" /> High-Converting Lead Magnet
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug">
                    The 2026 SaaS Growth Playbook (Free PDF)
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    15 battle-tested growth frameworks used by top founders to scale ARR cleanly.
                  </p>

                  <div className="space-y-2 pt-1 max-w-md">
                    <div className="relative">
                      <input
                        ref={emailInputRef}
                        type="text"
                        readOnly
                        value={typedEmail}
                        placeholder="Enter your work email..."
                        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/90 dark:bg-[#181924] px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white font-medium shadow-xs outline-none focus:ring-2 focus:ring-[#0066B2]"
                      />
                      {typedEmail.length > 8 && (
                        <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Valid ✓
                        </span>
                      )}
                    </div>

                    <button
                      ref={optinBtnRef}
                      type="button"
                      className={`w-full rounded-xl bg-gradient-to-r from-[#0066B2] to-[#0088FF] py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#0066B2]/25 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isOptinBtnActive ? "scale-98 brightness-110 ring-2 ring-[#0066B2]" : ""
                      }`}
                    >
                      Get Instant Access <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 bg-gradient-to-b from-zinc-50 to-zinc-100/80 dark:from-[#181924] dark:to-[#12131C] rounded-2xl border border-zinc-200/80 dark:border-white/10 p-5 shadow-md space-y-3.5 text-center">
                  <div className="h-32 sm:h-36 rounded-xl bg-gradient-to-br from-[#0066B2]/15 via-purple-500/10 to-emerald-500/10 border border-blue-500/25 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                    <FileText className="h-10 w-10 text-[#0066B2] dark:text-[#38BDF8] mb-1.5 drop-shadow-sm" />
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                      SaaS Growth Playbook.pdf
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">24 Pages · Native Hosted</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-1">
                    <span>⚡ Instant Fulfillment</span>
                    <span className="text-emerald-500 font-bold">51.2% Opt-in</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2.5 text-xs text-zinc-400">
                <span>Instant tokenized resource delivery · 0s latency</span>
                <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">51.2% Conversion Rate</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 1: REAL CUSTOM DOMAIN & CNAME CONFIGURATION (PRO)   */}
          {/* ========================================================= */}
          {phase === 1 && (
            <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
              <div className="space-y-3">
                {/* Header with PRO Badge & SSL status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        Custom Domain &amp; CNAME Routing
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                          PRO FEATURE
                        </span>
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
                      isDnsVerified
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                    }`}>
                      {isDnsVerified ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Lock className="h-3 w-3" />}
                      {isDnsVerified ? "SSL Active 🔒" : "DNS Propagation Pending"}
                    </span>
                  </div>
                </div>

                {/* Domain & Subdomain Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7 bg-zinc-50/80 dark:bg-[#161722] p-3 rounded-xl border border-zinc-200/80 dark:border-white/5 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Root Domain
                    </label>
                    <div className="relative flex items-center">
                      <Globe className="absolute left-2.5 h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                      <input
                        ref={domainInputRef}
                        type="text"
                        readOnly
                        value={typedDomain}
                        placeholder="e.g. yourdomain.com"
                        className="w-full pl-8 pr-14 py-1.5 rounded-lg border border-zinc-300/80 dark:border-zinc-700 bg-white dark:bg-[#1E1F2C] text-xs font-mono font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0066B2]"
                      />
                      {typedDomain.length > 3 && (
                        <span className="absolute right-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Valid ✓
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-5 bg-zinc-50/80 dark:bg-[#161722] p-3 rounded-xl border border-zinc-200/80 dark:border-white/5 space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Subdomain Prefix
                    </label>
                    <div className="flex items-center px-3 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#1E1F2C] font-mono text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] truncate">
                      get.{typedDomain || "yourdomain.com"}
                    </div>
                  </div>
                </div>

                {/* 2 DNS Records (TXT Ownership & CNAME Routing) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Step 1: TXT Record */}
                  <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-[#161722] border border-zinc-200/80 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        1. TXT Ownership Record
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Verified ✓
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-[#1E1F2C] p-2 rounded-lg border border-zinc-200/60 dark:border-white/5 space-y-0.5">
                      <div className="text-zinc-400 text-[10px]">Host: @</div>
                      <div className="truncate text-purple-600 dark:text-purple-300 font-bold">leadmagnets-verify=a8f9c2</div>
                    </div>
                  </div>

                  {/* Step 2: CNAME Record */}
                  <div className={`p-3 rounded-xl border transition-all space-y-2 ${
                    isDnsVerified
                      ? "bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20"
                      : "bg-zinc-50/80 dark:bg-[#161722] border-zinc-200/80 dark:border-white/5"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        2. CNAME Routing
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {isDnsVerified ? "Routed ✓" : "Ready"}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-[#1E1F2C] p-2 rounded-lg border border-zinc-200/60 dark:border-white/5 space-y-0.5">
                      <div className="text-zinc-400 text-[10px]">Host: get ➔ Target:</div>
                      <div className="truncate text-[#0066B2] dark:text-[#38BDF8] font-bold">cname.leadmagnets.io</div>
                    </div>
                  </div>
                </div>

                {/* Verification CTA Bar */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#0066B2]/10 via-purple-500/10 to-emerald-500/10 border border-[#0066B2]/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs truncate">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate">
                      Live URL: <strong className="text-[#0066B2] dark:text-[#38BDF8] font-mono">https://get.{typedDomain || "growthlab.io"}/saas-playbook</strong>
                    </span>
                  </div>

                  <button
                    ref={verifyDnsBtnRef}
                    type="button"
                    onClick={() => setIsDnsVerified(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0 ${
                      isDnsVerified
                        ? "bg-emerald-600 text-white"
                        : "bg-[#0066B2] text-white hover:brightness-110"
                    }`}
                  >
                    {isDnsVerified ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Verified &amp; Live ⚡
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" /> Check DNS Records
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2.5 text-xs text-zinc-400">
                <span>100% White-labeled on Pro Plans · Zero LeadMagnets Branding</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Auto-SSL Provisioned ✓</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 2: REAL LOCKED PDF READER & FROSTED BLUR GATE       */}
          {/* ========================================================= */}
          {phase === 2 && (
            <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
              {/* Document Reader Toolbar */}
              <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/10 pb-2.5 mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      SaaS Growth Playbook (Native Reader)
                      <span className="text-[10px] font-normal text-zinc-400 font-mono">Page 2 of 24</span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
                    isPdfUnlocked
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  }`}>
                    {isPdfUnlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {isPdfUnlocked ? "Document Unlocked" : "Page 3+ Locked"}
                  </span>
                </div>
              </div>

              {/* Reader Document Mockup with Interactive Blur Gating */}
              <div className="relative rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#161722] p-4 sm:p-5 overflow-hidden flex-1 flex flex-col justify-center">
                {/* Visible Page 1 / 2 Header Text */}
                <div className="space-y-2 mb-3">
                  <div className="h-3.5 w-3/4 rounded bg-zinc-300/80 dark:bg-zinc-700/80" />
                  <div className="h-2.5 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-2.5 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* Locked Page Overlay */}
                <div className={`relative rounded-xl p-5 sm:p-6 border transition-all flex flex-col items-center justify-center text-center overflow-hidden ${
                  isPdfUnlocked
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-zinc-900/60 backdrop-blur-md border-zinc-700/50 text-white"
                }`}>
                  {isPdfUnlocked ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-2 text-center"
                    >
                      <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <Check className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Full 24 Pages Unlocked &amp; Ready
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Lead captured &amp; auto-enrolled in nurture workflow.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2.5 max-w-sm">
                      <div className="h-9 w-9 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Lock className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Unlock Remaining 22 Pages
                      </h4>
                      <p className="text-[11px] sm:text-xs text-zinc-300">
                        Readers preview first 2 pages free. The rest is protected by our zero-friction email gate.
                      </p>
                      <button
                        ref={unlockPdfBtnRef}
                        type="button"
                        onClick={() => setIsPdfUnlocked(true)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0066B2] to-[#0088FF] text-white text-xs font-bold shadow-md hover:brightness-110 transition cursor-pointer"
                      >
                        ⚡ Unlock Document
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2.5 text-xs text-zinc-400">
                <span>Native PDF rendering · Zero Google Drive links</span>
                <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">Instant Fulfillment (0.2s)</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 3: 8 REAL DESIGNER TEMPLATES & LIVE ENGINE          */}
          {/* ========================================================= */}
          {phase === 3 && (
            <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
              {/* Header & Swatch Controls */}
              <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/10 pb-2.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    8 High-Converting Designer Templates
                  </span>
                </div>

                {/* Color Preset Swatches */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium mr-1 hidden sm:inline">Brand Color:</span>
                  {[
                    { color: "#0066B2", name: "Cobalt" },
                    { color: "#8B5CF6", name: "Violet" },
                    { color: "#10B981", name: "Emerald" },
                    { color: "#F59E0B", name: "Amber" },
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      ref={idx === 1 ? templateSwatchRef : null}
                      type="button"
                      onClick={() => {
                        setSelectedBrandColor(s.color);
                        setSelectedTemplate(idx);
                      }}
                      className={`h-5 w-5 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedBrandColor === s.color
                          ? "scale-125 border-zinc-900 dark:border-white"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: s.color }}
                      title={s.name}
                    />
                  ))}
                </div>
              </div>

              {/* Template Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {templatePresets.map((tmpl, idx) => {
                  const isSelected = selectedTemplate === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedTemplate(idx);
                        setSelectedBrandColor(tmpl.color);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden group ${
                        isSelected
                          ? "bg-white dark:bg-[#1E1F2C] shadow-lg ring-2"
                          : "bg-zinc-50/80 dark:bg-[#14151F] border-zinc-200/80 dark:border-white/5 opacity-80 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: isSelected ? tmpl.color : undefined,
                        boxShadow: isSelected ? `0 8px 24px -6px ${tmpl.color}40` : undefined,
                      }}
                    >
                      {/* Mini Template Preview Header */}
                      <div
                        className="h-14 rounded-xl mb-2 flex items-center justify-center p-2 transition-transform group-hover:scale-[1.02]"
                        style={{ backgroundColor: `${tmpl.color}15`, border: `1px solid ${tmpl.color}30` }}
                      >
                        <FileText className="h-6 w-6" style={{ color: tmpl.color }} />
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                          {tmpl.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {tmpl.theme}
                        </p>
                      </div>

                      {isSelected && (
                        <span
                          className="absolute top-2 right-2 h-2 w-2 rounded-full"
                          style={{ backgroundColor: tmpl.color }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2.5 text-xs text-zinc-400">
                <span>Fully responsive · Auto dark mode &amp; custom typography</span>
                <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">1-Click Theme Switch</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 4: REAL AUTOMATED DRIP NURTURE WORKFLOW             */}
          {/* ========================================================= */}
          {phase === 4 && (
            <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
              <div className="space-y-3">
                {/* Header with Live Status & Deploy Sequence Button */}
                <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        Automated Drip Follow-Up Workflow
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Smart Auto-Stop
                        </span>
                      </span>
                    </div>
                  </div>

                  <button
                    ref={deployBtnRef}
                    type="button"
                    onClick={() => setIsSeqDeployed(true)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSeqDeployed
                        ? "bg-emerald-600 text-white shadow-emerald-500/30 scale-95 ring-2 ring-emerald-400"
                        : "bg-gradient-to-r from-[#0066B2] to-[#0088FF] text-white hover:brightness-110 shadow-[#0066B2]/20"
                    }`}
                  >
                    {isSeqDeployed ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Sequence Live ⚡
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" /> Deploy Sequence
                      </>
                    )}
                  </button>
                </div>

                {/* 3 Step Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {workflowSteps.map((step, idx) => {
                    const isSelected = activeWorkflowStep === idx;
                    return (
                      <div
                        key={idx}
                        ref={idx === 1 ? workflowStep2Ref : null}
                        onClick={() => {
                          setActiveWorkflowStep(idx);
                          setIsPlaying(false);
                        }}
                        className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer select-none border ${
                          isSelected
                            ? "bg-white dark:bg-[#1E1F2C] border-[#0066B2] shadow-md ring-2 ring-[#0066B2]/30"
                            : "bg-zinc-50/80 dark:bg-[#14151F] border-zinc-200/80 dark:border-white/5 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold text-[#0066B2] dark:text-[#38BDF8] uppercase">
                            Step {step.stepNum} · {step.badge}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">{step.delay}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                          {step.title}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Sliding Animated Email Drawer */}
                <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-[#161722]/80 backdrop-blur-md p-3 sm:p-3.5 shadow-xs">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeWorkflowStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
                            {workflowSteps[activeWorkflowStep].subject}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {workflowSteps[activeWorkflowStep].stat}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <p className="text-xs flex-1 line-clamp-2">
                          {workflowSteps[activeWorkflowStep].preview}
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066B2] text-white text-[11px] font-bold shadow-xs shrink-0">
                          {workflowSteps[activeWorkflowStep].cta}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span>Auto-stops remaining follow-ups when lead converts</span>
                <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold">100% Native Delivery</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 5: LIVE TELEMETRY & CAPTURED LEADS CRM              */}
          {/* ========================================================= */}
          {phase === 5 && (
            <div className="flex-1 flex flex-col justify-between animate-in zoom-in-98 duration-300">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/10 pb-2.5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                      Live Telemetry &amp; Captured Leads CRM
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Real-time
                  </span>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3.5 mb-3.5">
                  <div className="bg-zinc-50/80 dark:bg-[#161722] p-2.5 sm:p-3.5 rounded-2xl border border-zinc-200/70 dark:border-white/5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Visitors</span>
                    <p className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white mt-1">2,840</p>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-500">↑ +18.4%</span>
                  </div>

                  <div
                    ref={analyticsCardRef}
                    className="bg-zinc-50/80 dark:bg-[#161722] p-2.5 sm:p-3.5 rounded-2xl border border-[#0066B2]/40 ring-1 ring-[#0066B2]/20 shadow-sm"
                  >
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Opt-In Rate</span>
                    <p className="text-lg sm:text-2xl font-black text-[#0066B2] dark:text-[#38BDF8] mt-1">51.2%</p>
                    <span className="text-[10px] sm:text-xs font-semibold text-zinc-400">Top 5% Tier</span>
                  </div>

                  <div className="bg-zinc-50/80 dark:bg-[#161722] p-2.5 sm:p-3.5 rounded-2xl border border-zinc-200/70 dark:border-white/5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Leads Captured</span>
                    <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">1,454</p>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-500">Synced to CRM ✓</span>
                  </div>
                </div>

                {/* Live Leads Row */}
                <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-[#161722] border border-blue-500/30 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">sarah.founder@startup.io</p>
                      <p className="text-[11px] text-zinc-400">Source: get.growthlab.io/saas-playbook</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Step 1 Delivered
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">Just now</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span>Visitor analytics, exit-intent captures, and conversion tracking</span>
                <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold">Live Stream</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 6: EXACT GRAPHIC BRAND INTRO SLIDE (SLIDE FROM BOTTOM) */}
          {/* ========================================================= */}
          {phase === 6 && (
            <motion.div
              initial={{ y: 90, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="flex-1 -m-4 sm:-m-7 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 shadow-2xl rounded-[28px] sm:rounded-[32px]"
            >
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
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 380, damping: 28 }}
                className="relative z-10 w-[94%] sm:w-[90%] max-w-2xl bg-[#0F0F11] text-white rounded-l-2xl sm:rounded-l-3xl rounded-r-[140px] sm:rounded-r-[220px] p-6 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-center min-h-[220px] sm:min-h-[280px]"
              >
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-[1.2] max-w-md">
                  Introducing <strong className="font-extrabold text-white">lead magnets &amp; automated nurture</strong> in{" "}
                  <span className="font-extrabold text-white">LeadMagnets</span>
                </h2>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* ========================================================= */}
        {/* VIRTUAL AUTONOMOUS MOUSE POINTER (Apple Sleek Cursor)      */}
        {/* ========================================================= */}
        <div
          className="pointer-events-none absolute z-50 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translate3d(${cursorPosPx.x}px, ${cursorPosPx.y}px, 0) ${
              isClicking ? "scale(0.78)" : "scale(1)"
            }`,
            opacity: phase === 6 ? 0 : 1,
            top: 0,
            left: 0,
          }}
        >
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-[0_4px_16px_rgba(0,0,0,0.55)] text-zinc-900 dark:text-white fill-current -translate-x-1 -translate-y-1 transition-transform duration-200"
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
            <span className="absolute -top-3.5 -left-3.5 h-14 w-14 rounded-full border-2 border-[#0066B2] dark:border-[#38BDF8] bg-[#0066B2]/20 dark:bg-[#38BDF8]/20 animate-ping pointer-events-none" />
          )}
        </div>

        {/* ========================================================= */}
        {/* FLOATING PLAY / PAUSE BUTTON                              */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause demo playback" : "Resume demo playback"}
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-xl border border-zinc-200 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer z-30"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current text-zinc-800 dark:text-zinc-100" />
          ) : (
            <Play className="h-4 w-4 fill-current text-[#0066B2] dark:text-[#38BDF8] ml-0.5" />
          )}
        </button>
      </div>
    </>
  );
}

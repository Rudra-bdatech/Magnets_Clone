"use client";

import { useEffect, useRef, useState } from "react";
import { Linkedin, Database, Video, HelpCircle, Mail, ArrowRight } from "lucide-react";
import SpotlightCard from "./spotlight-card";
import { usePrefersReducedMotion } from "./use-in-view";

const SHOWCASE_ITEMS = [
  {
    num: "01",
    tag: "VIRAL ENGINE",
    title: "LinkedIn Comment-to-Lead",
    description: "Post on LinkedIn and tell readers to comment a word. LeadMagnets automatically catches the comment and delivers the link.",
    badge: "100% Hands-free",
    icon: Linkedin,
    accent: "#0077B5",
    bullets: [
      "Custom trigger word detection",
      "Instant automated DM & email",
      "Built-in LinkedIn rate safety",
    ],
  },
  {
    num: "02",
    tag: "HIGH VALUE",
    title: "Notion & Resource Vaults",
    description: "Gate Notion templates, swipe files, or Google Drive bundles. Leads enter their email and get redirected straight to your workspace.",
    badge: "Zero File Limits",
    icon: Database,
    accent: "#38BDF8",
    bullets: [
      "Direct destination redirect",
      "Tokenized access protection",
      "Instant webhook & CRM sync",
    ],
  },
  {
    num: "03",
    tag: "ENGAGEMENT",
    title: "Private Video Masterclasses",
    description: "Gate unlisted Loom or training videos behind email opt-in. Keep high-ticket video briefings private until verified.",
    badge: "Zero-Leak Gate",
    icon: Video,
    accent: "#818CF8",
    bullets: [
      "Loom & video URL embedding",
      "Post-optin video watch player",
      "Custom booking CTA below video",
    ],
  },
  {
    num: "04",
    tag: "HIGH INTENT",
    title: "Qualifying Intake Funnels",
    description: "Ask 2–3 quick qualification questions before granting the asset. Know a lead's budget, role, or team size upfront.",
    badge: "Pre-Qualified Leads",
    icon: HelpCircle,
    accent: "#34D399",
    bullets: [
      "Multi-step question flow",
      "Budget & timeline capture",
      "Lead tags pushed to CRM",
    ],
  },
  {
    num: "05",
    tag: "DELIVERABILITY",
    title: "Send via Personal Gmail or SMTP",
    description: "Connect your personal Gmail or custom domain SMTP in seconds. Deliverables arrive directly in the primary inbox, never Promotions.",
    badge: "Primary Inbox",
    icon: Mail,
    accent: "#FB7360",
    bullets: [
      "1-click Google OAuth setup",
      "Custom SMTP & port support",
      "AES-256 encrypted at rest",
    ],
  },
];

export default function HorizontalShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined" || reduced) return;

    const targetProgressRef = { current: 0 };
    const currentProgressRef = { current: 0 };
    let rafId = 0;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || window.innerWidth < 1024) return;

      const rect = container.getBoundingClientRect();
      const stickyTop = 80;
      const scrollDistance = rect.height - window.innerHeight;

      if (scrollDistance <= 0) return;

      const current = stickyTop - rect.top;
      const progress = Math.min(Math.max(current / scrollDistance, 0), 1);
      targetProgressRef.current = progress;
    };

    let lastProgressPct = -1;
    const lerpLoop = () => {
      rafId = requestAnimationFrame(lerpLoop);

      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current += diff * 0.14;
      } else {
        currentProgressRef.current = targetProgressRef.current;
      }

      const progress = currentProgressRef.current;
      const track = trackRef.current;
      if (track) {
        const maxScrollX = track.scrollWidth - track.clientWidth;
        track.style.transform = `translateX(-${progress * maxScrollX}px)`;
      }

      const pct = Math.round(progress * 100);
      if (pct !== lastProgressPct) {
        lastProgressPct = pct;
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    rafId = requestAnimationFrame(lerpLoop);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reduced]);

  return (
    <div
      ref={containerRef}
      className="relative w-full lg:h-[260vh]"
    >
      {/* Sticky Frame */}
      <div className="lg:sticky lg:top-20 w-full overflow-hidden py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {/* Header & Horizontal Progress */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0066B2] dark:text-[#38BDF8]">
                Growth Engine <span className="text-zinc-400 dark:text-zinc-600">/</span> Beyond Static Files
              </p>
              <h3 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                More ways to capture & convert.{" "}
                <span className="font-instrument italic font-normal text-[#0066B2] dark:text-[#38BDF8]">
                  Built in.
                </span>
              </h3>
            </div>

            {/* Desktop Horizontal Scroll Progress Indicator */}
            <div className="hidden lg:flex items-center gap-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              <span>Scroll to explore</span>
              <div className="h-1.5 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-75"
                  style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                />
              </div>
              <span className="tabular-nums">{Math.round(scrollProgress * 100)}%</span>
            </div>
          </div>

          {/* Cards Track: Slides horizontally on desktop scroll, touch swipeable on mobile */}
          <div
            ref={trackRef}
            className="flex gap-5 sm:gap-6 will-change-transform overflow-x-auto lg:overflow-visible no-scrollbar pb-6 lg:pb-0"
          >
            {SHOWCASE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <SpotlightCard
                  key={item.num}
                  className="shrink-0 w-[290px] sm:w-[350px] p-6 sm:p-7 flex flex-col justify-between border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121215]"
                  spotlightRadius={380}
                >
                  <div>
                    {/* Top Tag & Number */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {item.num}
                      </span>
                      <span className="rounded-full bg-[#0066B2]/10 dark:bg-[#38BDF8]/15 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-[#0066B2] dark:text-[#38BDF8]">
                        {item.tag}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-[#0066B2] dark:text-[#38BDF8]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>
                    </div>

                    <p className="mt-3.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Feature Bullets */}
                    <ul className="mt-6 space-y-2">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.badge}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      Included <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckIcon,
  EarthIcon,
  FileTextIcon,
  MailIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/icons";
import {
  Wand2,
  Zap,
  HardDrive,
  BarChart3,
  Layers,
  CheckCircle2,
  ShieldCheck,
  MousePointerClick,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Workflow,
  Share2,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Mail,
  BookOpen,
  Webhook,
  Calendar,
  TrendingUp,
  Target,
  Link2,
} from "lucide-react";
import SiteFooter from "@/layout/site-footer";
import SiteHeader from "@/layout/site-header";
import { MagnetsMark, GeminiLogo } from "@/components/brand";

// Dynamic imports for heavy client islands — moves framer-motion and canvas off the critical path
// This directly reduces TBT (Total Blocking Time) and long main-thread tasks on initial load.
// Reveal: keep ssr:true so content is server-rendered (avoids CLS), only JS is deferred.
const Reveal = dynamic(() => import("@/components/reveal"));
const ShowcaseTabs = dynamic(() => import("@/components/landing/showcase-tabs"), { ssr: false });
const FunnelShowcase = dynamic(() => import("@/components/landing/funnel-showcase"), { ssr: false });
const FaqAccordion = dynamic(() => import("@/components/landing/faq-accordion"), { ssr: false });
const CtaSection = dynamic(() => import("@/components/landing/cta-section"), { ssr: false });

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://magnets.bdatech.in/#organization",
      name: "LeadMagnets",
      url: "https://magnets.bdatech.in",
      logo: { "@type": "ImageObject", url: "https://magnets.bdatech.in/brand/magnets-mark-dark.png" },
    },
    {
      "@type": "WebSite",
      "@id": "https://magnets.bdatech.in/#website",
      name: "LeadMagnets",
      url: "https://magnets.bdatech.in",
      publisher: { "@id": "https://magnets.bdatech.in/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": "https://magnets.bdatech.in/#webpage",
      name: "AI Lead Magnet Builder & Automated Nurturing Platform",
      description: "Generate opt-in landing pages with AI, host resources securely, send instant downloads, and auto-nurture leads with email sequences.",
      url: "https://magnets.bdatech.in",
      isPartOf: { "@id": "https://magnets.bdatech.in/#website" },
      inLanguage: "en",
    },
  ],
};

const superFeatures = [
  {
    icon: Wand2,
    badge: "AI Powered",
    title: "AI Lead Magnet Generator",
    description: "Generate persuasive headlines, benefit bullets, and opt-in landing pages in under 30 seconds using AI prompts tailored to your niche.",
    highlightColor: "from-blue-500/20 to-cyan-500/20 text-cyan-400",
    iconAnim: "group-hover:rotate-12 group-hover:scale-125 group-hover:text-cyan-300 transition-transform duration-300",
  },
  {
    icon: HardDrive,
    badge: "Native Hosting",
    title: "Instant Resource Storage",
    description: "Host PDFs, templates, Notion docs, or video courses directly on platform with zero extra cloud setup or Google Drive links.",
    highlightColor: "from-purple-500/20 to-pink-500/20 text-purple-400",
    iconAnim: "group-hover:-translate-y-1 group-hover:scale-115 group-hover:text-purple-300 transition-transform duration-300",
  },
  {
    icon: Workflow,
    badge: "Automated Nurture",
    title: "Drip Email Sequences",
    description: "Auto-send timed multi-step follow-ups that turn free subscribers into paying clients — and auto-stop when they book a call.",
    highlightColor: "from-emerald-500/20 to-teal-500/20 text-emerald-400",
    iconAnim: "group-hover:rotate-[180deg] group-hover:scale-115 group-hover:text-emerald-300 transition-transform duration-500",
  },
  {
    icon: BarChart3,
    badge: "Live Telemetry",
    title: "Analytics & Exit-Intent Captures",
    description: "Track unique visitors, conversion percentages, and bounce recovery with smart exit-intent overlays built straight into your pages.",
    highlightColor: "from-amber-500/20 to-orange-500/20 text-amber-400",
    iconAnim: "group-hover:scale-125 group-hover:-translate-y-0.5 group-hover:text-amber-300 transition-transform duration-300",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: HERO SECTION                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="relative bg-[#F0F7FF] dark:bg-[#0a0a0a] border-b border-zinc-200/80 dark:border-zinc-800/80">
        <SiteHeader />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-0 h-[36rem] vercel-dot-bg opacity-30 dark:opacity-15" />

        <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-20 sm:px-8 sm:pt-28 lg:px-10 lg:pt-32 lg:pb-28">
          {/* Hero text is NOT wrapped in Reveal — H1 is the LCP element and must paint immediately */}
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-white/80 dark:bg-[#18181C]/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] animate-pulse" aria-hidden="true" />
              <span>AI Lead Magnet & Nurture Engine</span>
            </div>

            {/* Main Headline — LCP Element, must be immediately visible */}
            <h1 className="mx-auto mt-6 sm:mt-8 max-w-5xl text-3xl min-[400px]:text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.08] text-zinc-900 dark:text-white tracking-tight break-words">
              Turn Free Resources Into <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-[#60A5FA] bg-clip-text text-transparent drop-shadow-sm">High-Converting</span> Lead Engines
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-normal">
              AI-generated opt-in pages, instant resource hosting, automated email sequences, and exit-intent analytics — built into one seamless workspace.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row items-center">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-7 text-base font-bold text-white shadow-xl shadow-[#0066B2]/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer w-full sm:w-auto ring-2 ring-[#0066B2]/40"
                href="/register"
              >
                Create Free Lead Magnet <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-[#18181C] px-6 text-base font-bold text-zinc-700 dark:text-zinc-200 shadow-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80 w-full sm:w-auto"
                href="#features"
              >
                Explore Features
              </Link>
            </div>

            {/* Value Checkmarks */}
            <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Free Forever Plan</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Instant Setup (No Domain Needed)</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> AI Magnet Copy Generator</span>
            </div>
          </div>

          {/* INTERACTIVE WORKSPACE SHOWCASE DEMO — isolated client island */}
          <ShowcaseTabs />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: INTERACTIVE PIPELINE SHOWCASE (HOW IT WORKS)        */}
      {/* ------------------------------------------------------------- */}
      <section className="cv-auto bg-white dark:bg-[#121215] py-14 sm:py-20 border-b border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden" id="how-it-works">
        {/* Subtle Dark-mode only background ambience */}
        <div aria-hidden="true" className="hidden dark:block absolute top-1/3 left-1/2 -translate-x-1/2 -z-0 h-96 w-[600px] rounded-full bg-[#0066B2]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-zinc-50/80 dark:bg-[#18181C]/80 backdrop-blur-md px-4 py-1 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-2xs mb-3">
              <Workflow className="h-3.5 w-3.5" />
              <span>Automated Funnel Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              From Visitor Attention to <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-purple-500 bg-clip-text text-transparent">High-Value Customer</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Stop juggling separate form tools, Google Drive links, and email sequence software. LeadMagnets powers your entire lead engine seamlessly.
            </p>
          </Reveal>

          {/* Interactive Stepper & Stage Mockup Island */}
          <Reveal delay={0.1}>
            <FunnelShowcase />
          </Reveal>

          {/* Full-Width Workspace Ecosystem Integration Card */}
          <Reveal delay={0.3} className="mt-14 sm:mt-16" id="integrations">
            <div className="rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-gradient-to-b from-zinc-50/90 via-white/70 to-zinc-50/90 dark:from-[#16161E]/80 dark:via-[#13131A]/80 dark:to-[#101014]/80 backdrop-blur-2xl p-4 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
              {/* Radial Ambient Glow Background - dark mode only */}
              <div aria-hidden="true" className="hidden dark:block absolute -top-24 left-1/2 -translate-x-1/2 -z-10 h-72 w-[600px] rounded-full bg-[#0066B2]/15 blur-3xl pointer-events-none" />

              <div className="grid lg:grid-cols-12 gap-8 items-center">
                {/* Left Text & Status Info */}
                <div className="lg:col-span-5 space-y-3.5 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-extrabold border border-emerald-500/20">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Instant Stack Connectivity</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
                    Seamless 1-Click Ecosystem Sync
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Connect your existing tools in seconds. Every lead is automatically pushed to your favorite newsletter platforms, CRMs, and team notification channels.
                  </p>
                  <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Real-time Webhooks</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Auto-Retry Vault</span>
                  </div>
                </div>

                {/* Right Dual-Row Marquee Ticker */}
                <div className="lg:col-span-7 space-y-3 relative overflow-hidden py-2 marquee-mask">
                  {/* Marquee Row 1 (Moving Left) */}
                  <div className="animate-marquee-left gap-3">
                    {[
                      { name: "Kit (ConvertKit)", Icon: Mail, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40", category: "CRM & Email" },
                      { name: "Substack", Icon: BookOpen, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40", category: "Publication" },
                      { name: "Slack Alerts", Icon: MessageSquare, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40", category: "Notifications" },
                      { name: "Pipedrive", Icon: BarChart3, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/40", category: "Sales Pipeline" },
                      { name: "Custom Webhooks", Icon: Webhook, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40", category: "Developer API" },
                      { name: "Kit (ConvertKit)", Icon: Mail, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40", category: "CRM & Email" },
                      { name: "Substack", Icon: BookOpen, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40", category: "Publication" },
                      { name: "Slack Alerts", Icon: MessageSquare, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40", category: "Notifications" },
                      { name: "Pipedrive", Icon: BarChart3, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/40", category: "Sales Pipeline" },
                      { name: "Custom Webhooks", Icon: Webhook, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40", category: "Developer API" },
                    ].map((item, idx) => (
                      <div
                        key={`row1-${idx}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1C1C22] border border-zinc-200/80 dark:border-zinc-800/80 shadow-md hover:border-[#0066B2]/50 transition-all cursor-default shrink-0"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${item.color}`}>
                          <item.Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-zinc-900 dark:text-white leading-none">{item.name}</p>
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Marquee Row 2 (Moving Right) */}
                  <div className="animate-marquee-right gap-3">
                    {[
                      { name: "Zapier Automations", Icon: Zap, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40", category: "Workflow" },
                      { name: "Calendly Bookings", Icon: Calendar, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40", category: "Smart Stop" },
                      { name: "GA4 Telemetry", Icon: TrendingUp, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40", category: "Analytics" },
                      { name: "Meta Ads Pixel", Icon: Target, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/40", category: "Retargeting" },
                      { name: "Custom Webhooks", Icon: Link2, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/40", category: "API Payload" },
                      { name: "Zapier Automations", Icon: Zap, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40", category: "Workflow" },
                      { name: "Calendly Bookings", Icon: Calendar, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40", category: "Smart Stop" },
                      { name: "GA4 Telemetry", Icon: TrendingUp, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40", category: "Analytics" },
                      { name: "Meta Ads Pixel", Icon: Target, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/40", category: "Retargeting" },
                      { name: "Custom Webhooks", Icon: Link2, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/40", category: "API Payload" },
                    ].map((item, idx) => (
                      <div
                        key={`row2-${idx}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1C1C22] border border-zinc-200/80 dark:border-zinc-800/80 shadow-md hover:border-purple-500/50 transition-all cursor-default shrink-0"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${item.color}`}>
                          <item.Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-zinc-900 dark:text-white leading-none">{item.name}</p>
                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: POWER FEATURES GRID                                */}
      {/* ------------------------------------------------------------- */}
      <section className="cv-auto bg-[#F0F7FF] dark:bg-[#0a0a0a] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="features">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-white/80 dark:bg-[#18181C]/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-xs mb-4">
              <Zap className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
              <span>Engineered For Results</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Everything You Need to <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-purple-500 bg-clip-text text-transparent">Capture & Convert High-Value Leads</span>
            </h2>
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
              Go beyond simple opt-in forms. LeadMagnets combines AI creation, native hosting, automated sequences, and analytics into one unified tool.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {superFeatures.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="group relative h-full rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-white/90 via-white/50 to-white/80 dark:from-[#18181C] dark:via-[#151518] dark:to-[#121215] backdrop-blur-xl p-6 hover:border-[#0066B2]/50 dark:hover:border-[#38BDF8]/50 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-[#0066B2]/10 dark:hover:shadow-[#38BDF8]/10 overflow-hidden ring-1 ring-white/10">
                  {/* Top Ambient Card Glow on Hover */}
                  <div aria-hidden="true" className={`absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br ${f.highlightColor} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.highlightColor} border border-current/20 shadow-xs group-hover:border-current/60 transition-all duration-300`}>
                        <f.icon className="h-5.5 w-5.5" aria-hidden="true" />
                      </div>
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#222228] text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs">
                        {f.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors leading-snug">
                      {f.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                      {f.description}
                    </p>
                  </div>

                  {/* Micro Visual Link */}
                  <div className="mt-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Explore capability <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 group-hover:animate-ping" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: FAQ                                                 */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="cv-auto relative bg-white dark:bg-[#121215] py-24 sm:py-28 px-5 sm:px-8 lg:px-10 border-b border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        {/* Subtle Ambient Background Gradient */}
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-0 h-96 w-[700px] rounded-full bg-gradient-to-r from-[#0066B2]/10 via-purple-500/10 to-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Header */}
          <Reveal className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-[#0066B2]/5 dark:bg-[#18181C]/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-2xs mb-4">
              <HelpCircle className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
              Got Questions? We Have <span className="bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-purple-500 bg-clip-text text-transparent">Answers.</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Everything you need to know about setting up lead magnets, hosting files, automations, and integrations.
            </p>
          </Reveal>

          {/* FAQ Accordion — isolated client island */}
          <FaqAccordion />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: FINAL CTA                                          */}
      {/* ------------------------------------------------------------- */}
      <CtaSection />

      <SiteFooter />
    </main>
  );
}
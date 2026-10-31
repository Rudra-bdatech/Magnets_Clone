import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import SiteFooter from "@/layout/site-footer";
import SiteHeader from "@/layout/site-header";
import SectionHeading from "@/components/landing/section-heading";
import WordRotator from "@/components/landing/word-rotator";

// Dynamic imports for heavy client islands — moves framer-motion and canvas off the critical path
// This directly reduces TBT (Total Blocking Time) and long main-thread tasks on initial load.
// Reveal: keep ssr:true so content is server-rendered (avoids CLS), only JS is deferred.
const Reveal = dynamic(() => import("@/components/reveal"));
const ShowcaseTabs = dynamic(() => import("@/components/landing/showcase-tabs"), { ssr: false });
const FunnelShowcase = dynamic(() => import("@/components/landing/funnel-showcase"), { ssr: false });
const FaqAccordion = dynamic(() => import("@/components/landing/faq-accordion"), { ssr: false });
const CtaSection = dynamic(() => import("@/components/landing/cta-section"), { ssr: false });
const BeforeAfter = dynamic(() => import("@/components/landing/before-after"));
const BentoFeatures = dynamic(() => import("@/components/landing/bento-features"));
const CompareStack = dynamic(() => import("@/components/landing/compare-stack"));
const Pricing = dynamic(() => import("@/components/landing/pricing"));
const TryIt = dynamic(() => import("@/components/landing/try-it"));
const IntegrationsFlow = dynamic(() => import("@/components/landing/integrations-flow"));
const ProofStrip = dynamic(() => import("@/components/landing/proof-strip"));
const HorizontalShowcase = dynamic(() => import("@/components/landing/horizontal-showcase"), { ssr: false });


const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://magnets.bdatech.in/#organization",
      name: "Funnels",
      url: "https://magnets.bdatech.in",
      logo: { "@type": "ImageObject", url: "https://magnets.bdatech.in/brand/magnets-mark-dark.png" },
    },
    {
      "@type": "WebSite",
      "@id": "https://magnets.bdatech.in/#website",
      name: "Funnels",
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

export default function Home() {
  return (
    <main className="overflow-x-clip bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      {/* HERO */}
      <section className="relative bg-[#F0F7FF] dark:bg-[#0a0a0a] border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-0 h-[36rem] vercel-dot-bg opacity-30 dark:opacity-15" />

        <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-20 sm:px-8 sm:pt-28 lg:px-10 lg:pt-32 lg:pb-28">
          {/* Hero text is NOT wrapped in Reveal — H1 is the LCP element and must paint immediately */}
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h1 className="mx-auto max-w-4xl text-[2.6rem] min-[400px]:text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.04] tracking-[-0.04em] text-zinc-900 dark:text-white">
              Turn free <WordRotator />
              <br />
              into an email list{" "}
              <span className="font-instrument italic font-normal tracking-normal">that buys.</span>
            </h1>

            <p className="lm-rise mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              Describe your freebie and get an opt-in page in seconds. We host the file, deliver it the moment someone signs up, and send the follow-ups for you.
            </p>

            <div className="lm-rise mt-9 flex flex-col justify-center gap-3 sm:flex-row items-center" style={{ animationDelay: "120ms" }}>
              <Link
                className="group inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white px-7 text-[15px] font-semibold text-white dark:text-zinc-950 transition hover:bg-zinc-800 dark:hover:bg-zinc-200"
                href="/register"
              >
                Build your first page free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl px-6 text-[15px] font-semibold text-zinc-700 dark:text-zinc-300 transition hover:text-zinc-950 dark:hover:text-white"
                href="#before-after"
              >
                See the difference ↓
              </Link>
            </div>

            <p className="lm-rise mt-6 text-xs text-zinc-500 dark:text-zinc-500" style={{ animationDelay: "220ms" }}>
              Free plan · No card needed · Live on a free subdomain
            </p>
          </div>

          {/* INTERACTIVE WORKSPACE SHOWCASE DEMO — isolated client island */}
          <div className="lm-rise" style={{ animationDelay: "320ms" }}>
            <ShowcaseTabs />
          </div>

          <div className="lm-rise" style={{ animationDelay: "420ms" }}>
            <ProofStrip />
          </div>
        </div>
      </section>

      {/* 01 BEFORE / AFTER */}
      <section id="before-after" className="cv-auto bg-white dark:bg-[#121215] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading
              index="01"
              eyebrow="Why bother"
              title="Same file."
              accent="Very different result."
              description="A shared link gets downloaded and forgotten. A Funnels page gets you the email, delivers the file, and starts the conversation."
            />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <BeforeAfter />
          </Reveal>
        </div>
      </section>

      {/* 02 HOW IT WORKS */}
      <section className="cv-auto bg-[#F0F7FF] dark:bg-[#0a0a0a] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="how-it-works">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal className="mb-10 sm:mb-14">
            <SectionHeading
              index="02"
              eyebrow="How it works"
              title="From stranger to subscriber"
              accent="on autopilot."
              description="Three steps, one workspace. Set it up once and every new visitor goes through the same path."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <FunnelShowcase />
          </Reveal>
        </div>
      </section>
      {/* PINNED HORIZONTAL SHOWCASE */}
      <section className="cv-auto bg-white dark:bg-[#121215] border-b border-zinc-200/80 dark:border-zinc-800/80" id="showcase">
        <HorizontalShowcase />
      </section>

      {/* 03 FEATURES BENTO */}
      <section className="cv-auto bg-[#F0F7FF] dark:bg-[#0a0a0a] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="features">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading
              index="03"
              eyebrow="Features"
              title="Small touches that win"
              accent="more signups."
            />
          </Reveal>
          <BentoFeatures />
        </div>
      </section>

      {/* 04 TRY IT */}
      <section className="cv-auto bg-white dark:bg-[#121215] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="try-it">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading
              index="04"
              eyebrow="Try it"
              title="Type a topic."
              accent="See your page."
              description="No sign-up needed for this part."
            />
          </Reveal>
          <TryIt />
        </div>
      </section>

      {/* 05 INTEGRATIONS */}
      <section className="cv-auto bg-[#F0F7FF] dark:bg-[#0a0a0a] py-20 sm:py-24 border-b border-zinc-200/80 dark:border-zinc-800/80" id="integrations">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading
              align="left"
              index="05"
              eyebrow="Integrations"
              title="Leads land where you"
              accent="already work."
              description="Every signup is pushed to your email tool, CRM or Slack the moment it happens. Failed syncs retry on their own."
            />
          </Reveal>
          <IntegrationsFlow />
        </div>
      </section>

      {/* 06 COMPARE */}
      <section className="cv-auto bg-white dark:bg-[#121215] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="compare">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading
              index="06"
              eyebrow="The alternative"
              title="You could glue five tools together."
              accent="Or not."
            />
          </Reveal>
          <CompareStack />
        </div>
      </section>

      {/* 07 PRICING */}
      <section className="cv-auto bg-[#F0F7FF] dark:bg-[#0a0a0a] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="pricing">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <Reveal>
            <SectionHeading
              index="07"
              eyebrow="Pricing"
              title="Start free."
              accent="Add your custom domain anytime."
            />
          </Reveal>
          <Pricing />
        </div>
      </section>

      {/* 08 FAQ */}
      <section id="faq" className="cv-auto bg-white dark:bg-[#121215] py-20 sm:py-28 px-5 sm:px-8 lg:px-10 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-12 sm:mb-14">
            <SectionHeading index="08" eyebrow="FAQ" title="Questions people" accent="usually ask." />
          </Reveal>
          {/* FAQ Accordion — isolated client island */}
          <FaqAccordion />
        </div>
      </section>

      <CtaSection />

      <SiteFooter />
    </main>
  );
}

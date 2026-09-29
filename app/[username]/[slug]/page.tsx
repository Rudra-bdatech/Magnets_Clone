import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import MagnetSignupForm from "@/components/magnet-signup-form";
import AnalyticsAndExitIntent from "@/components/analytics-and-exit-intent";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
import { type MagnetPage } from "@/lib/data";
import { verifySessionToken } from "@/lib/session-token";
import { Check } from "lucide-react";


export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string; slug: string };
}): Promise<Metadata> {
  let accountDoc: any = null;
  let pageDoc: any = null;

  try {
    await dbConnect();
    const decodedUsername = decodeURIComponent(params.username || "");
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    accountDoc = await AccountModel.findOne(
      escapedUsername ? { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } } : {}
    ).lean();

    if (accountDoc && accountDoc.email) {
      pageDoc = await MagnetPageModel.findOne({
        userEmail: accountDoc.email.trim().toLowerCase(),
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).lean();
    }

    if (!pageDoc) {
      pageDoc = await MagnetPageModel.findOne({
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).lean();
    }
  } catch (err) {
    console.warn("MongoDB metadata query fallback in generateMetadata:", err);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  const username = params.username || "user";
  const slug = params.slug || "resource";

  if (!pageDoc) {
    return {
      title: "Lead Magnet Not Found | LeadMagnets",
      description: "The requested lead magnet page could not be found.",
    };
  }

  const title = pageDoc.headline || pageDoc.name || "Free Resource";
  const rawDescription = pageDoc.subheadline || pageDoc.pitch || `Download ${title} instantly.`;
  const description = rawDescription.replace(/<[^>]*>/g, "").trim().slice(0, 200);
  const authorName = accountDoc?.name || username;
  const canonicalUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;
  const ogImageUrl = pageDoc.imageUrl || accountDoc?.ogImageUrl || "/landing-dashboard.png";

  return {
    title: `${title} | ${authorName}`,
    description: description,
    authors: [{ name: authorName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: title,
      description: description,
      siteName: `${authorName} · LeadMagnets`,
      images: [
        {
          url: ogImageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [ogImageUrl],
    },
  };
}

function Icon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </Icon>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </Icon>
  );
}

function MoveRightIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M18 8 22 12 18 16" />
      <path d="M2 12h20" />
    </Icon>
  );
}

export default async function MagnetPageRoute({
  params,
}: {
  params: { username: string; slug: string };
}) {
  let accountDoc: any = null;
  let pageDoc: any = null;

  const rawUser = params.username || "";
  if (rawUser.includes(".") || rawUser.startsWith("_") || rawUser === "favicon.ico") {
    notFound();
  }

  try {
    await dbConnect();
    const decodedUsername = decodeURIComponent(rawUser);
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    accountDoc = await AccountModel.findOne(
      escapedUsername ? { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } } : {}
    ).lean();

    if (accountDoc && accountDoc.email) {
      pageDoc = await MagnetPageModel.findOne({
        userEmail: accountDoc.email.trim().toLowerCase(),
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).sort({ _id: -1 }).lean();
    }

    if (!pageDoc) {
      pageDoc = await MagnetPageModel.findOne({
        $or: [{ id: params.slug }, { slug: params.slug }]
      }).sort({ _id: -1 }).lean();
    }
  } catch (err) {
    console.warn("MongoDB connection fallback in MagnetPageRoute:", err);
  }

  // Identify whether the current viewer is the actual owner of this page.
  // We decode the session token and compare the email against the page owner —
  // simply having any session is NOT enough (a logged-in visitor to someone
  // else's magnet is not the owner).
  const cookieStore = cookies();
  const rawToken =
    cookieStore.get("session_token")?.value ||
    cookieStore.get("next-auth.session-token")?.value ||
    cookieStore.get("__Secure-next-auth.session-token")?.value;

  let viewerEmail: string | null = null;
  if (rawToken) {
    try {
      const decoded = verifySessionToken(rawToken);
      if (decoded?.email) viewerEmail = decoded.email.trim().toLowerCase();
    } catch { /* invalid token — treat as unauthenticated */ }
  }

  const pageOwnerEmail = pageDoc?.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;
  const isOwner = Boolean(viewerEmail && pageOwnerEmail && viewerEmail === pageOwnerEmail);
  const isDraftMode = pageDoc?.status === "draft";

  // Draft Access Protection: If page is in Draft and viewer is NOT the logged-in owner, block public access
  if (isDraftMode && !isOwner) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0E0E10] px-4 text-center">
        <div className="max-w-md space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] p-8 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Page Not Published Yet</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            This lead magnet is currently in <span className="font-bold text-amber-600 dark:text-amber-400">Draft</span> mode and is not visible to the public. If you are the owner, please switch the status to Published inside your dashboard.
          </p>
          <a
            href="/dashboard/leadmagnets"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 text-xs font-bold text-white transition shadow-md"
          >
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  const cleanUserEmail = pageDoc?.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;

  if (cleanUserEmail) {
    try {
      const ownerAccount = await AccountModel.findOne({ email: cleanUserEmail }).lean();
      if (ownerAccount) {
        accountDoc = ownerAccount;
      }
    } catch (_) { }
  }

  if (!accountDoc) {
    try {
      accountDoc = await AccountModel.findOne({}).lean();
    } catch (_) { }
  }

  if (!pageDoc) {
    notFound();
  }

  const page = JSON.parse(JSON.stringify(pageDoc)) as MagnetPage;

  // A/B Split Test Variant Selection
  let activeHeadline = page.headline;
  let activeImageUrl = page.imageUrl;
  let activeVariantLabel: "Control" | "Variant B" = "Control";
  let isVariantB = false;

  if (page.testStarted && page.hasVariantB) {
    const variantBText = page.variantBTitle && page.variantBTitle.trim() !== "" ? page.variantBTitle : page.headline;
    const variantBImg = page.variantBImage && page.variantBImage.trim() !== "" ? page.variantBImage : page.imageUrl;

    isVariantB = Math.random() < 0.5;
    if (isVariantB) {
      activeHeadline = variantBText;
      activeImageUrl = variantBImg;
      activeVariantLabel = "Variant B";
    }
  }

  const themeMode = (accountDoc?.themeMode as "light" | "dark") || "light";
  const brandColor = accountDoc?.brandColor || "#0066B2";
  const logo = accountDoc?.logo || null;
  const highlightIntensity = accountDoc?.highlightIntensity ?? 100;
  const businessName = accountDoc?.brandName || accountDoc?.name || "BDA";
  const isTemplate2 = (page.template as string) === "template2" || (!page.template && (accountDoc?.templateId as string) === "template2");

  return (
    <main
      className="flex min-h-screen flex-col font-sans transition-colors duration-300 relative overflow-x-hidden"
      style={{
        colorScheme: themeMode === "dark" ? "dark" : "light",
        backgroundColor: isTemplate2
          ? (themeMode === "dark" ? "#141416" : "#f3f0e8")
          : (themeMode === "dark" ? "#0E0E10" : "#FAFAFA"),
        color: isTemplate2
          ? (themeMode === "dark" ? "#eae8e3" : "#151515")
          : (themeMode === "dark" ? "#ffffff" : "#18181b"),
        backgroundImage: isTemplate2
          ? "none"
          : (themeMode === "light"
            ? `radial-gradient(circle at 0% 0%, ${brandColor}10 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}08 0%, transparent 40%)`
            : `radial-gradient(circle at 0% 0%, ${brandColor}15 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}0c 0%, transparent 40%)`)
      }}
    >
      <AnalyticsAndExitIntent
        ga4Id={accountDoc?.ga4MeasurementId}
        pixelId={accountDoc?.metaPixelId}
        faviconUrl={accountDoc?.faviconUrl}
        ogImageUrl={accountDoc?.ogImageUrl}
        pageTitle={page.name}
        ctaText={page.cta}
        brandColor={brandColor}
        pageId={page.id}
        isVariantB={isVariantB}
        isOwner={isOwner && isDraftMode && !page.testStarted}
      />
      {/* Draft Preview Mode Top Banner for Logged-In Owner */}
      {isDraftMode && isOwner && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-black px-4 py-1 text-xs font-bold shadow-md border-b border-amber-600 shrink-0">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>⚠️ Draft Preview Mode — This magnet is not yet published. Only you can view this page.</span>
        </div>
      )}
      {/* If template is not template2, template3, template4, or template5, show the standard top header */}
      {((page.template as string) !== "template2" && (page.template as string) !== "template3" && (page.template as string) !== "template4" && (page.template as string) !== "template5" && (!(!page.template && ((accountDoc?.templateId as string) === "template2" || (accountDoc?.templateId as string) === "template3" || (accountDoc?.templateId as string) === "template4" || (accountDoc?.templateId as string) === "template5")))) && (
        <header className="w-full flex items-center justify-center pt-3 sm:pt-4 pb-1 sm:pb-2 px-6 sm:px-10 relative shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center bg-transparent overflow-hidden shadow-xs ${logo ? "border-none" : "border-2 border-dashed border-[#a1a1aa]/50"}`}>
              {logo ? (
                <img src={logo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <div className="h-4 w-4 rounded-md border-2 border-dashed border-[#a1a1aa]" />
              )}
            </div>
            <span className={`text-base sm:text-lg font-black tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
              {businessName}
            </span>
          </div>
        </header>
      )}

      {/* Main content area filling the screen properly with balanced vertical spacing */}
      <div className={`flex-1 w-full flex flex-col justify-center ${((page.template as string) === "template2" || (!page.template && (accountDoc?.templateId as string) === "template2")) ? "p-0" : "px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 pb-3 sm:pb-4"}`}>
        {/* Dynamic Multi-Template View Renderer */}
        {((page.template as string) === "template2" || (!page.template && (accountDoc?.templateId as string) === "template2")) ? (
          /* TEMPLATE 2: Signal / Noise Editorial Edition (Full-Screen) */
          <div
            className={`w-full min-h-screen flex flex-col font-sans selection:bg-[#ef3d25] selection:text-white transition-colors duration-200 ${
              themeMode === "dark"
                ? "bg-[#141416] text-[#eae8e3]"
                : "bg-[#f3f0e8] text-[#151515]"
            }`}
            style={
              {
                "--paper": themeMode === "dark" ? "#141416" : "#f3f0e8",
                "--ink": themeMode === "dark" ? "#eae8e3" : "#151515",
                "--line": themeMode === "dark" ? "rgba(255,255,255,0.18)" : "#151515",
                "--soft": themeMode === "dark" ? "#1e1e24" : "#e7e2d7",
                "--red": "#ef3d25",
                "--blue": brandColor || "#2544d8",
              } as React.CSSProperties
            }
          >
            {/* Inline styles for marquee & watermark */}
            <style>{`
              @keyframes editorialTickerMarquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .editorial-marquee {
                display: inline-flex;
                white-space: nowrap;
                animation: editorialTickerMarquee 24s linear infinite;
              }
              .editorial-marquee:hover {
                animation-play-state: paused;
              }
              .stroked-watermark {
                -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.35);
                color: transparent;
              }
            `}</style>

            {/* 1. MASTHEAD */}
            <header className="w-full border-b border-[#151515] dark:border-white/20 px-6 sm:px-10 py-5 grid grid-cols-1 md:grid-cols-3 items-end gap-4">
              <div className="text-left font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] leading-tight opacity-90">
                <div>VOL. 08 · FIELD NOTES</div>
                <div className="mt-0.5">ISSUE NO. 42</div>
              </div>

              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] uppercase font-sans leading-none">
                  SIGNAL <span className="font-serif italic font-normal text-[#ef3d25] mx-1">/</span> NOISE
                </h1>
              </div>

              <div className="text-left md:text-right font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] leading-tight opacity-90">
                <div>INDEPENDENT IDEAS</div>
                <div className="mt-0.5 font-normal text-[#5a574f] dark:text-zinc-400">
                  AUTUMN · 2026
                </div>
              </div>
            </header>

            {/* 2. TICKER BAR */}
            <div className="w-full flex items-center overflow-hidden h-8 text-[10px] font-sans font-bold uppercase tracking-[0.12em] select-none bg-[#151515] text-[#f3f0e8]">
              <div className="flex items-center px-4 sm:px-6 h-full shrink-0 font-black text-white bg-[#ef3d25] z-10">
                <span>NEW ISSUE</span>
              </div>
              <div className="overflow-hidden flex-1 relative flex items-center">
                <div className="editorial-marquee text-[10px] font-medium opacity-90">
                  <span className="px-4">ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE. • ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE.</span>
                  <span className="px-4">ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE. • ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE.</span>
                </div>
              </div>
            </div>

            {/* 3. HERO SECTION (FEATURE STORY WITH WATERMARK & HEADLINE) */}
            <div
              className="relative min-h-[480px] sm:min-h-[540px] md:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 md:p-14 border-b border-[#151515] dark:border-white/20 overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(12,12,12,0.92) 0%, rgba(12,12,12,0.6) 55%, rgba(12,12,12,0.15) 100%), url(${activeImageUrl && activeImageUrl.trim() !== "" ? activeImageUrl : "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Giant Watermark Number in Top-Right */}
              <div className="absolute top-4 right-6 sm:right-12 pointer-events-none select-none z-0">
                <span className="stroked-watermark font-serif text-[120px] sm:text-[180px] md:text-[220px] font-bold leading-none block opacity-80">
                  42
                </span>
              </div>

              {/* Top Tag */}
              <div className="relative z-10">
                <span className="px-3 py-1 bg-[#ef3d25] text-white text-[10px] font-black uppercase tracking-[0.15em] font-sans inline-block">
                  {page.accent || "THE ATTENTION ISSUE"}
                </span>
              </div>

              {/* Hero Headline & Subheadline */}
              <div className="relative z-10 max-w-3xl space-y-4 text-white mt-auto pt-10">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-[0.98] drop-shadow-md tracking-tight">
                  {activeHeadline || "101 ideas that refuse to vanish."}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed font-sans max-w-2xl">
                  {page.subheadline || "A practical field guide to hooks, visual systems, and narrative devices that turn a passing glance into lasting interest."}
                </p>

                {/* Bottom Metadata Byline */}
                <div className="flex flex-wrap items-center gap-6 pt-4 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-white/90">
                  <span>12 MIN READ</span>
                  <span>BY {businessName || "MARA VALE"}</span>
                  <span>VISUAL ESSAY</span>
                </div>
              </div>
            </div>

            {/* 4. MAIN 2-COLUMN LOWER GRID */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* LEFT COLUMN: Table of Contents + Pull Quote (~65% width) */}
              <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between space-y-8">
                {(() => {
                  const hasCustomBullets = Array.isArray(page.bullets);
                  const displayBullets: string[] = hasCustomBullets
                    ? page.bullets!
                    : [
                        "The first seven seconds ::: Seven opening structures that create curiosity without manufacturing noise.",
                        "Build a visual memory ::: How contrast, rhythm, and restraint turn information into recognition.",
                        "Anatomy of the share ::: Twelve remarkable posts, dismantled to reveal the ideas underneath.",
                      ];

                  if (displayBullets.length === 0) return null;

                  return (
                    <div className="space-y-6">
                      {/* Header: INSIDE THIS ISSUE | CONTENTS 01-03 */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#151515] dark:border-white/20 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em]">
                        <span>{page.bulletsTitle || "INSIDE THIS ISSUE"}</span>
                        <span>CONTENTS 01—0{displayBullets.length}</span>
                      </div>

                      {/* Content Rows */}
                      <div className="divide-y divide-[#151515]/20 dark:divide-white/10">
                        {displayBullets.map((item: string, idx: number) => {
                          const parts = item.includes(":::") ? item.split(":::") : [item, ""];
                          const itemTitle = parts[0]?.trim() || `Key Strategy 0${idx + 1}`;
                          const itemDesc = parts[1]?.trim() || "";
                          const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;

                          return (
                            <div key={idx} className="py-5 sm:py-6 flex items-start justify-between gap-4 group">
                              <div className="flex items-start gap-4 sm:gap-6 flex-1">
                                <span className="font-serif italic text-2xl sm:text-3xl font-normal text-[#151515] dark:text-[#eae8e3] shrink-0 w-8">
                                  {numStr}
                                </span>
                                <div className="space-y-1 flex-1">
                                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#151515] dark:text-[#eae8e3] leading-snug">
                                    {itemTitle}
                                  </h3>
                                  {itemDesc && (
                                    <p className="text-xs sm:text-sm font-sans text-[#151515]/80 dark:text-[#eae8e3]/80 leading-relaxed">
                                      {itemDesc}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="pt-1">
                                <svg className="w-5 h-5 text-[#151515] dark:text-[#eae8e3] opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                                </svg>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Pull Quote Box with Blue Top Bar */}
                <div className="w-full overflow-hidden border-t-4 border-[#2544d8] bg-[#e7e2d7] dark:bg-[#1e1e24] p-6 sm:p-8 space-y-3">
                  {(() => {
                    const defaultQuotePlaceholder = "“Good work earns attention once. A distinct point of view earns it again.”";
                    const defaultAuthorPlaceholder = `— ${businessName || "EDITORIAL BOARD"}, EDITOR AT LARGE`;
                    const pitchParts = (page.pitch || "").includes(":::") ? (page.pitch || "").split(":::") : [page.pitch || "", ""];
                    const quoteText = pitchParts[0]?.trim() || "";
                    const quoteAuthor = pitchParts[1]?.trim() || "";
                    return (
                      <>
                        <blockquote className="font-serif italic text-lg sm:text-xl text-[#151515] dark:text-[#eae8e3] leading-snug">
                          {quoteText || defaultQuotePlaceholder}
                        </blockquote>
                        <div className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] opacity-75">
                          {quoteAuthor || defaultAuthorPlaceholder}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* RIGHT COLUMN: Digital Edition Form Panel (~35% width) */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#151515] dark:border-white/20 p-6 sm:p-10 flex flex-col justify-start space-y-6">
                <div className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#2544d8] dark:text-blue-400">
                  DIGITAL EDITION
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#151515] dark:text-[#eae8e3] leading-tight">
                    {page.formTitle || "Keep the issue."}
                  </h3>
                  {page.formSubtitle && (
                    <p className="text-xs sm:text-sm font-sans opacity-80 leading-relaxed">
                      {page.formSubtitle}
                    </p>
                  )}
                </div>

                <MagnetSignupForm
                  cta={page.cta}
                  formTitle={page.formTitle}
                  formSubtitle={page.formSubtitle}
                  formButtonText={page.formButtonText || "SEND THE DIGITAL ISSUE →"}
                  deliverable={page.deliverable}
                  accent={page.accent}
                  pageId={page.id}
                  pageName={page.name}
                  pageSlug={page.slug}
                  pageOwnerEmail={(page as any).userEmail}
                  brandColor={brandColor || "#2544d8"}
                  highlightIntensity={highlightIntensity}
                  themeMode={themeMode}
                  customPromptQuestion={page.customPromptQuestion}
                  customPromptPlaceholder={page.customPromptPlaceholder}
                  enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                  customFormFields={page.customFormFields}
                  username={params.username}
                  isVariantB={isVariantB}
                  layout="editorial"
                  afterSignupOption={page.afterSignupOption}
                  destinationUrl={page.destinationUrl}
                />

                <div className="text-[10px] text-center font-sans opacity-70 mt-1 block">
                  One thoughtful issue. No noise.
                </div>
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template3" || (!page.template && (accountDoc?.templateId as string) === "template3")) ? (
          /* TEMPLATE 3: Aurora Reveal */
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center lg:items-stretch">
              {/* LEFT: Aurora Image Tile */}
              <div className="col-span-12 lg:col-span-5 relative flex flex-col items-center justify-center min-h-[440px] lg:min-h-full">
                {/* Brand Logo & Brand Name Centered above picture, aligned with right-side top text */}
                {(logo || businessName) && (
                  <div className="lg:absolute lg:top-0 lg:left-0 lg:right-0 flex items-center justify-center gap-2.5 mb-4 lg:mb-0">
                    <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center bg-transparent overflow-hidden shadow-xs ${logo ? "border-none" : "border-2 border-dashed border-[#a1a1aa]/50"}`}>
                      {logo ? (
                        <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-4 w-4 rounded-md border-2 border-dashed border-[#a1a1aa]" />
                      )}
                    </div>
                    <span className={`text-base sm:text-lg font-black tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                      {businessName}
                    </span>
                  </div>
                )}

                <div className="rounded-3xl overflow-hidden relative shadow-2xl aspect-[4/5] max-h-[380px] w-full border border-black/5 dark:border-white/5">
                  {activeImageUrl && activeImageUrl.trim() !== "" ? (
                    <img
                      src={activeImageUrl}
                      alt={page.name || "Cover"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center bg-zinc-900/60 border border-zinc-800">
                      <div className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/80 text-white">
                        <svg className="h-7 w-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" strokeWidth="2" />
                        </svg>
                        <span className="text-xs font-bold text-white">Cover Image</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
                </div>
              </div>

              {/* RIGHT: Editorial Form Panel */}
              <div className="col-span-12 lg:col-span-7 flex flex-col justify-center space-y-4">
                {/* Eyebrow */}
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {page.bulletsTitle || "Free Resource · Instant Access"}
                  </span>
                </div>

                {/* Headline */}
                <div className="space-y-1.5">
                  <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black leading-[1.1] tracking-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                    {activeHeadline}
                  </h1>
                  {page.subheadline && (
                    <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                      {page.subheadline}
                    </p>
                  )}
                  {page.pitch && (
                    <p className={`text-xs leading-relaxed line-clamp-2 ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                      {page.pitch}
                    </p>
                  )}
                </div>

                {/* Bullets */}
                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {page.bullets.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div
                          className="h-3.5 w-3.5 shrink-0 rounded-full flex items-center justify-center"
                          style={{ background: `${brandColor}22`, border: `1px solid ${brandColor}44` }}
                        >
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                            <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className={`text-xs sm:text-sm font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form */}
                <div className="pt-1">
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle={page.formTitle}
                    formSubtitle={page.formSubtitle}
                    formButtonText={page.formButtonText}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor}
                    highlightIntensity={highlightIntensity}
                    themeMode={themeMode}
                    customPromptQuestion={page.customPromptQuestion}
                    customPromptPlaceholder={page.customPromptPlaceholder}
                    enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                    customFormFields={page.customFormFields}
                    username={params.username}
                    isVariantB={isVariantB}
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template4" || (!page.template && (accountDoc?.templateId as string) === "template4")) ? (
          /* TEMPLATE 4: Neon Orbit (Full Viewport Split Layout) */
          <div className="w-full flex-1 flex flex-col justify-center pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center lg:items-stretch w-full">
              {/* LEFT: Copy + Form */}
              <div className="col-span-12 lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-4 lg:space-y-5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}` }} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {page.bulletsTitle || "Free Resource · Limited Time"}
                  </span>
                </div>

                <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[2.4rem] xl:text-[3rem] font-black leading-[1.08] tracking-tight break-words [overflow-wrap:anywhere] ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                  {activeHeadline}
                </h1>

                {page.subheadline && (
                  <p className={`text-sm sm:text-base md:text-lg font-medium leading-relaxed break-words [overflow-wrap:anywhere] ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                    {page.subheadline}
                  </p>
                )}

                {page.pitch && (
                  <p className={`text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere] ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {page.pitch}
                  </p>
                )}

                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-2.5">
                    {page.bullets.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span className={`text-xs sm:text-sm md:text-base font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle={page.formTitle}
                    formSubtitle={page.formSubtitle}
                    formButtonText={page.formButtonText}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor}
                    highlightIntensity={highlightIntensity}
                    themeMode={themeMode}
                    customPromptQuestion={page.customPromptQuestion}
                    customPromptPlaceholder={page.customPromptPlaceholder}
                    enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                    customFormFields={page.customFormFields}
                    username={params.username}
                    isVariantB={isVariantB}
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
                  />
                </div>
              </div>

              {/* RIGHT: Orbital image portal */}
              <div className="col-span-12 lg:col-span-6 xl:col-span-5 relative flex flex-col items-center justify-center py-6 min-h-[440px] sm:min-h-[500px] lg:min-h-[580px] xl:min-h-[640px]">
                {/* Brand Logo & Brand Name aligned with top of left side content */}
                {(logo || businessName) && (
                  <div className="lg:absolute lg:top-0 lg:left-0 lg:right-0 flex items-center justify-center gap-2.5 mb-6 lg:mb-0">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center bg-transparent overflow-hidden shadow-xs border-none">
                      {logo ? (
                        <img src={logo} alt="Brand Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-4 w-4 rounded-md border-2 border-dashed border-[#a1a1aa]" />
                      )}
                    </div>
                    <span className={`text-base sm:text-lg font-black tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                      {businessName}
                    </span>
                  </div>
                )}

                <div className="relative flex items-center justify-center w-full">
                  {/* Ambient glow */}
                  <div className="absolute rounded-full pointer-events-none" style={{ width: "min(92vw, 560px)", height: "min(92vw, 560px)", background: `radial-gradient(circle, ${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`, filter: "blur(32px)" }} />
                  {/* Outer dashed ring */}
                  <div className="absolute rounded-full border border-dashed pointer-events-none" style={{ width: "min(84vw, 500px)", height: "min(84vw, 500px)", borderColor: `${brandColor}25` }} />
                  {/* Mid ring */}
                  <div className="absolute rounded-full pointer-events-none" style={{ width: "min(74vw, 440px)", height: "min(74vw, 440px)", border: `1px solid ${brandColor}${Math.round((0.18 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 24px ${brandColor}22` }} />
                  {/* Inner neon halo */}
                  <div className="absolute rounded-full pointer-events-none" style={{ width: "min(64vw, 380px)", height: "min(64vw, 380px)", border: `2px solid ${brandColor}${Math.round((0.35 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 36px ${brandColor}${Math.round((0.2 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')}` }} />
                  {/* Circular image */}
                  <div className="relative rounded-full overflow-hidden z-10" style={{ width: "min(56vw, 330px)", height: "min(56vw, 330px)", border: `3.5px solid ${brandColor}${Math.round((0.5 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 45px -6px ${brandColor}${Math.round((0.45 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}` }}>
                    {activeImageUrl && activeImageUrl.trim() !== "" ? (
                      <img
                        src={activeImageUrl}
                        alt={page.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brandColor}88 0%, #0d0012 100%)` }}>
                        <div className="h-8 w-8 rounded-full bg-white/20" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template5" || (!page.template && (accountDoc?.templateId as string) === "template5")) ? (
          /* TEMPLATE 5: Editorial Resource Showcase & Framework Edition */
          <div className="w-full flex-1 flex flex-col justify-center py-4 sm:py-8 max-w-3xl mx-auto px-2 sm:px-4">
            {/* Editorial Card Canvas */}
            <article
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-2xl"
              style={{
                backgroundColor: themeMode === "dark" ? "#0f0f12" : "#ffffff",
                borderColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                boxShadow: themeMode === "dark"
                  ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)"
                  : "0 25px 60px -15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              {/* Subtle Brand Accent Stripe on right edge */}
              <div
                aria-hidden="true"
                className="absolute right-0 top-8 h-20 w-1.5 rounded-l-full pointer-events-none transition-all duration-300"
                style={{ backgroundColor: brandColor }}
              />

              {/* Top Ambient Glow */}
              <div
                aria-hidden="true"
                className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: brandColor }}
              />

              {/* 1. EDITORIAL HEADER SECTION */}
              <header className={`px-6 py-6 sm:px-10 sm:py-8 relative z-10 border-b ${themeMode === "dark" ? "border-zinc-800/80" : "border-zinc-100"}`}>
                {/* Creator / Publisher Bar */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt={businessName}
                        className={`w-11 h-11 rounded-full border object-cover shrink-0 shadow-xs ${
                          themeMode === "dark" ? "border-zinc-700" : "border-zinc-200"
                        }`}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ring-2 ring-white/10"
                        style={{ backgroundColor: brandColor }}
                      >
                        {(businessName || "B").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                        style={{ color: brandColor }}
                      >
                        Published by
                      </p>
                      <p className={`truncate text-sm font-semibold ${themeMode === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
                        {businessName || "Creator"}
                      </p>
                    </div>
                  </div>

                  {/* Category / Format Pill */}
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${brandColor}14`,
                      color: brandColor,
                      border: `1px solid ${brandColor}30`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                    <span>Proven Frameworks</span>
                  </div>
                </div>

                {/* Editorial Headline & Subheadline */}
                <div className="space-y-3">
                  <h1 className={`text-2xl sm:text-4xl md:text-[2.6rem] font-extrabold tracking-tight leading-[1.12] ${themeMode === "dark" ? "text-zinc-50" : "text-zinc-950"}`}>
                    {activeHeadline || "101 Winning Viral Templates That Get Results"}
                  </h1>
                  {page.subheadline && (
                    <p className={`text-sm sm:text-base md:text-lg leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                      {page.subheadline}
                    </p>
                  )}
                </div>
              </header>

              {/* 2. RESOURCE PREVIEW / SHOWCASE SECTION */}
              <section
                aria-label="Resource Preview"
                className={`relative px-6 py-7 sm:px-10 sm:py-9 border-b ${themeMode === "dark" ? "bg-[#141418]/60 border-zinc-800/80" : "bg-zinc-50/70 border-zinc-100"}`}
              >
                <div className={`relative group rounded-xl sm:rounded-2xl overflow-hidden border shadow-md ${themeMode === "dark" ? "border-zinc-800 bg-zinc-950" : "border-zinc-200/90 bg-zinc-950"}`}>
                  {activeImageUrl && activeImageUrl.trim() !== "" ? (
                    <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
                      <img
                        src={activeImageUrl}
                        alt={page.name || "Resource Preview"}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                    </div>
                  ) : (
                    /* Tech Blueprint Cover Mockup */
                    <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full flex flex-col items-center justify-center p-8 bg-[#0b0c10] text-zinc-300 select-none overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{
                          backgroundImage: `radial-gradient(circle at 1px 1px, ${brandColor} 1px, transparent 0)`,
                          backgroundSize: "24px 24px",
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none opacity-25"
                        style={{
                          background: `radial-gradient(ellipse at center, ${brandColor}33 0%, transparent 70%)`,
                        }}
                      />
                      <div className="relative z-10 flex flex-col items-center text-center space-y-3 max-w-md">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
                          style={{ backgroundColor: `${brandColor}22` }}
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                            <path d="M6 6h10"/>
                            <path d="M6 10h10"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-wide">{page.name || "Winning Viral Templates"}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Comprehensive playbook &amp; ready-to-use frameworks</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating Pill Caption */}
                <div className="flex justify-center -mt-3 relative z-20">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-lg border backdrop-blur-md"
                    style={{
                      backgroundColor: themeMode === "dark" ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)",
                      color: themeMode === "dark" ? "#ffffff" : "#09090b",
                      borderColor: themeMode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
                    <span>Previewing: Strategy, Templates &amp; Examples</span>
                  </div>
                </div>
              </section>

              {/* 3. VALUE PROPOSITION & FORM SECTION */}
              <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-7">
                {/* Pitch */}
                {page.pitch && (
                  <p className={`text-sm sm:text-base leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                    {page.pitch}
                  </p>
                )}

                {/* Bullets Section Header & List */}
                {((page.bullets && page.bullets.length > 0) || page.bulletsTitle) && (
                  <div className="space-y-4">
                    <h2 className={`text-xs font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                      {page.bulletsTitle || "Inside the guide"}
                    </h2>
                    {page.bullets && page.bullets.length > 0 && (
                      <ul className="grid gap-3.5">
                        {page.bullets.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm leading-6">
                            <span
                              aria-hidden="true"
                              className="mt-1 grid size-4 shrink-0 place-items-center rounded-full"
                              style={{ backgroundColor: `${brandColor}18` }}
                            >
                              <span className="size-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                            </span>
                            <span className={themeMode === "dark" ? "text-zinc-200" : "text-zinc-800"}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* 4. EMBEDDED FORM CONTAINER */}
                <div
                  className="rounded-2xl border p-6 sm:p-8 space-y-4 shadow-sm relative overflow-hidden"
                  style={{
                    backgroundColor: themeMode === "dark" ? "rgba(20,20,24,0.85)" : "rgba(248,249,251,0.95)",
                    borderColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  }}
                >
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle={page.formTitle || "Get instant access to the templates"}
                    formSubtitle={page.formSubtitle || "Enter your details below to receive the resource."}
                    formButtonText={page.formButtonText || "Access the templates"}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor}
                    highlightIntensity={highlightIntensity}
                    themeMode={themeMode}
                    customPromptQuestion={page.customPromptQuestion}
                    customPromptPlaceholder={page.customPromptPlaceholder}
                    enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                    customFormFields={page.customFormFields}
                    username={params.username}
                    isVariantB={isVariantB}
                    layout="split-panel"
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
                  />

                  <p className="text-center text-[11px] leading-5 text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 pt-1">
                    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Zero spam. You’ll receive the PDF immediately and high-value insights.</span>
                  </p>
                </div>
              </div>
            </article>

            {/* 5. TRUST & SOCIAL PROOF FOOTER */}
            <footer className="mt-8 text-center space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span>⚡ Instant Delivery</span>
                <span>•</span>
                <span>🔒 100% Free Forever</span>
                <span>•</span>
                <span>✨ Verified Content</span>
              </div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                © {new Date().getFullYear()} {businessName || "Author"} · All rights reserved
              </p>
            </footer>
          </div>
        ) : ((page.template as string) === "template6" || (page.template as string) === "template7" || (!page.template && ((accountDoc?.templateId as string) === "template6" || (accountDoc?.templateId as string) === "template7"))) ? (
          /* TEMPLATE 6: Spotlight Hero (Full Desktop Viewport Split Layout) */
          <div className="w-full flex-1 flex flex-col justify-center py-1 lg:py-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center w-full">
              {/* LEFT: Full-bleed image panel */}
              <div className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-3xl shadow-2xl min-h-[400px] sm:min-h-[460px] lg:min-h-[520px] xl:min-h-[580px] flex flex-col justify-end border border-black/10 dark:border-white/10 group">
                {activeImageUrl && activeImageUrl.trim() !== "" ? (
                  <img src={activeImageUrl} alt={page.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `linear-gradient(155deg, ${brandColor}99 0%, #060610 55%, #12001a 100%)` }}
                  >
                    <div className="flex flex-col items-center gap-2 text-white/50">
                      <SparklesIcon className="w-10 h-10" />
                      <span className="text-xs uppercase font-bold tracking-wider">Spotlight Cover</span>
                    </div>
                  </div>
                )}
                {/* Cinematic scrim overlays */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 50%, transparent 80%)" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to right, ${brandColor}33 0%, transparent 60%)` }} />

                {/* Headline & subheadline overlay at bottom */}
                <div className="relative z-10 p-6 sm:p-8 md:p-10 space-y-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.4rem] xl:text-[3rem] font-black text-white leading-tight drop-shadow-2xl">
                    {activeHeadline}
                  </h1>
                  {page.subheadline && (
                    <p className="text-sm sm:text-base md:text-lg text-white/90 font-medium max-w-2xl leading-relaxed drop-shadow">
                      {page.subheadline}
                    </p>
                  )}
                  {page.pitch && (
                    <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-xl line-clamp-2">
                      {page.pitch}
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT: Form and details */}
              <div className="col-span-12 lg:col-span-5 flex flex-col justify-center space-y-4 w-full">
                {/* Eyebrow */}
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}` }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: brandColor }}>
                    {page.bulletsTitle || "Exclusive · Free Access"}
                  </span>
                </div>

                {/* Bullet list */}
                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-zinc-200/20 dark:border-zinc-800/40">
                    {page.bullets.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div
                          className="flex h-4 w-4 shrink-0 mt-0.5 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${brandColor}22`, border: `1px solid ${brandColor}55` }}
                        >
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                            <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className={`text-xs sm:text-sm md:text-base leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form Card */}
                <div className="pt-1 w-full">
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle={page.formTitle}
                    formSubtitle={page.formSubtitle}
                    formButtonText={page.formButtonText}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor}
                    highlightIntensity={highlightIntensity}
                    themeMode={themeMode}
                    customPromptQuestion={page.customPromptQuestion}
                    customPromptPlaceholder={page.customPromptPlaceholder}
                    enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                    customFormFields={page.customFormFields}
                    username={params.username}
                    isVariantB={isVariantB}
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
                  />
                  {page.deliverable && (
                    <p className={`mt-1.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"
                      }`}>
                      <GiftIcon className="h-3.5 w-3.5" />
                      {page.deliverable}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TEMPLATE 1 / Default: Modern Full-Width Split Layout */
          <div className="w-full flex-1 flex flex-col justify-center py-1 lg:py-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center w-full">
              {/* Left Content Column */}
              <div className="lg:col-span-7 space-y-3 lg:space-y-4 xl:space-y-5 lg:pr-2 xl:pr-6 min-w-0">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs ${themeMode === "dark"
                  ? "border-[#252529] bg-[#161619] text-zinc-300"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700"
                  }`}>
                  <SparklesIcon className="h-3.5 w-3.5 text-brand-orange" />
                  Free resource
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.6rem] xl:text-[3.2rem] 2xl:text-[3.6rem] font-black leading-[1.08] tracking-tight break-words [overflow-wrap:anywhere]">
                  {activeHeadline}
                </h1>
                {page.subheadline && (
                  <p className={`text-sm sm:text-base md:text-lg xl:text-xl font-medium leading-relaxed break-words [overflow-wrap:anywhere] ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"
                    }`}>
                    {page.subheadline}
                  </p>
                )}

                {page.pitch && (
                  <p className={`text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere] ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"
                    }`}>
                    {page.pitch}
                  </p>
                )}

                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-3 pt-2 min-w-0">
                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#9B9085]">
                      {page.bulletsTitle || "What you will learn"}
                    </p>
                    <ul className="space-y-2.5">
                      {page.bullets.map((line: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm group min-w-0">
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: brandColor,
                              opacity: 0.5 + (highlightIntensity / 100) * 0.5,
                              boxShadow:
                                highlightIntensity > 30
                                  ? `0 0 ${Math.round(14 * (highlightIntensity / 100))}px ${brandColor}${Math.round(
                                      (highlightIntensity / 100) * 0.8 * 255
                                    ).toString(16).padStart(2, "0")}`
                                  : "none",
                            }}
                          >
                            <Check className="h-3 w-3 text-white stroke-[3px]" />
                          </span>
                          <span className={`break-words [overflow-wrap:anywhere] ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                            {line}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Media Preview & Form Column */}
              <div className="lg:col-span-5 space-y-3 xl:space-y-4 w-full lg:pt-1 xl:pt-2">
                {/* Media Preview (Crisp proportion) */}
                {activeImageUrl ? (
                  <div
                    className="rounded-2xl border aspect-[16/8.5] max-h-[190px] sm:max-h-[220px] lg:max-h-[240px] xl:max-h-[260px] w-full flex items-center justify-center transition-all duration-300 relative overflow-hidden shadow-xl"
                    style={{
                      borderColor: `${brandColor}${Math.round((0.18 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`,
                    }}
                  >
                    <img src={activeImageUrl} alt="Resource" className="h-full w-full object-cover" />
                  </div>
                ) : null}

                {/* Form Card */}
                <div className="w-full">
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle={page.formTitle}
                    formSubtitle={page.formSubtitle}
                    formButtonText={page.formButtonText}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor}
                    highlightIntensity={highlightIntensity}
                    themeMode={themeMode}
                    customPromptQuestion={page.customPromptQuestion}
                    customPromptPlaceholder={page.customPromptPlaceholder}
                    enableAiPersonalizedDeliverable={page.enableAiPersonalizedDeliverable}
                    customFormFields={page.customFormFields}
                    username={params.username}
                    isVariantB={isVariantB}
                    afterSignupOption={page.afterSignupOption}
                    destinationUrl={page.destinationUrl}
                  />
                  {page.deliverable && (
                    <p className={`mt-1.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"
                      }`}>
                      <GiftIcon className="h-3.5 w-3.5" />
                      {page.deliverable}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="w-full py-1.5 sm:py-2 text-center text-[10px] sm:text-[11px] text-[#5c5650] shrink-0">
        <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-[#FE6F34] transition">
          Powered by LeadMagnets <MoveRightIcon className="h-2 w-2" />
        </a>
      </footer>
    </main>
  );
}

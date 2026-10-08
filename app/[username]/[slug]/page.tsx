import React from "react";
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
  const dynamicOgUrl = `${appUrl}/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description)}&author=${encodeURIComponent(authorName)}&username=${encodeURIComponent(username)}`;
  const ogImageUrl = pageDoc.imageUrl || accountDoc?.ogImageUrl || dynamicOgUrl;

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
  const authorName = accountDoc?.name || rawUser || "Marcus Vane";
  const pageTemplate = (page.template as string);
  const accountTemplate = (accountDoc?.templateId as string);
  const activeTemplate = (pageTemplate && pageTemplate !== "classic")
    ? pageTemplate
    : (accountTemplate || "template1");

  const isDark = themeMode === "dark";
  const isTemplate2 = activeTemplate === "template2";
  const isTemplate3 = activeTemplate === "template3";
  const isTemplate4 = activeTemplate === "template4";
  const isTemplate5 = activeTemplate === "template5";
  const isTemplate6 = activeTemplate === "template6";
  const isTemplate7 = activeTemplate === "template7";
  const isTemplate8 = activeTemplate === "template8";
  const isTemplate1 = !isTemplate2 && !isTemplate3 && !isTemplate4 && !isTemplate5 && !isTemplate6 && !isTemplate7 && !isTemplate8;

  const isVeryDark = (hexColor: string) => {
    if (!hexColor || typeof hexColor !== "string" || !hexColor.startsWith("#")) return false;
    const hex = hexColor.replace("#", "").trim();
    if (hex.length !== 6 && hex.length !== 3) return false;
    const fullHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(fullHex.substring(0, 2), 16) || 0;
    const g = parseInt(fullHex.substring(2, 4), 16) || 0;
    const b = parseInt(fullHex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 60;
  };

  const rawAccent = brandColor || "#fb4d6a";
  const accentColor = isDark && isVeryDark(rawAccent) ? "#fb4d6a" : rawAccent;

  return (
    <main
      className="apple-page-enter flex min-h-screen flex-col font-sans transition-colors duration-300 relative overflow-x-clip"
      style={{
        colorScheme: themeMode === "dark" ? "dark" : "light",
        backgroundColor: isTemplate8
          ? (themeMode === "dark" ? "#0d0e12" : "#eee9df")
          : isTemplate7
          ? (themeMode === "dark" ? "#0d0d0f" : "#f4ff3c")
          : isTemplate3
          ? (themeMode === "dark" ? "#0c120a" : "#f4f6f0")
          : isTemplate2
          ? (themeMode === "dark" ? "#141416" : "#f3f0e8")
          : isTemplate4
          ? (themeMode === "dark" ? "#0b0d12" : "#f5f1e8")
          : isTemplate1
          ? (themeMode === "dark" ? "#0c0d11" : "#f8f9fa")
          : (themeMode === "dark" ? "#0E0E10" : "#FAFAFA"),
        color: isTemplate8
          ? (themeMode === "dark" ? "#f4f4f5" : "#141414")
          : isTemplate7
          ? (themeMode === "dark" ? (brandColor || "#f4ff3c") : "#101010")
          : isTemplate3
          ? (themeMode === "dark" ? "#edf0e8" : "#141c10")
          : isTemplate2
          ? (themeMode === "dark" ? "#eae8e3" : "#151515")
          : isTemplate4
          ? (themeMode === "dark" ? "#f5f1e8" : "#0b0d12")
          : isTemplate1
          ? (themeMode === "dark" ? "#f2f3f7" : "#111217")
          : (themeMode === "dark" ? "#ffffff" : "#18181b"),
        backgroundImage: (isTemplate2 || isTemplate3 || isTemplate7 || isTemplate4 || isTemplate8 || isTemplate1)
          ? (isTemplate8
            ? (themeMode === "dark"
              ? "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)"
              : "radial-gradient(rgba(20, 20, 20, 0.18) 1px, transparent 1px)")
            : isTemplate1
            ? `radial-gradient(620px 380px at 18% 0%, ${accentColor}1c, transparent 70%), radial-gradient(520px 320px at 88% 96%, ${accentColor}10, transparent 70%)`
            : "none")
          : (themeMode === "light"
            ? `radial-gradient(circle at 0% 0%, ${brandColor}10 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}08 0%, transparent 40%)`
            : `radial-gradient(circle at 0% 0%, ${brandColor}15 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}0c 0%, transparent 40%)`),
        backgroundSize: isTemplate8 ? "18px 18px" : undefined
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
      {/* If template is not template1, template2, template3, template4, template5, template6, template7, or template8, show the standard top header */}
      {!isTemplate1 && !isTemplate2 && !isTemplate3 && !isTemplate4 && !isTemplate5 && !isTemplate6 && !isTemplate7 && !isTemplate8 && (
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
      <div className={`flex-1 w-full flex flex-col justify-center ${(isTemplate1 || isTemplate2 || isTemplate3 || isTemplate7 || isTemplate8) ? "p-0" : "px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 pb-3 sm:pb-4"}`}>
        {/* Dynamic Multi-Template View Renderer */}
        {isTemplate2 ? (
          /* TEMPLATE 2: Signal / Noise Editorial Edition (Full-Screen) */
          <div
            className={`w-full min-h-screen flex flex-col font-sans selection:bg-[#ef3d25] selection:text-white transition-colors duration-200 ${
              isDark
                ? "bg-[#141416] text-[#eae8e3]"
                : "bg-[#f3f0e8] text-[#151515]"
            }`}
            style={
              {
                "--paper": isDark ? "#141416" : "#f3f0e8",
                "--ink": isDark ? "#eae8e3" : "#151515",
                "--line": isDark ? "rgba(255,255,255,0.18)" : "#151515",
                "--soft": isDark ? "#1e1e24" : "#e7e2d7",
                "--red": "#ef3d25",
                "--blue": brandColor || "#2544d8",
              } as React.CSSProperties
            }
          >
            {/* Inline styles for marquee & watermark */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
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
                `,
              }}
            />

            {/* 1. MASTHEAD */}
            {(() => {
              const defaultLeft1 = "VOL. 08 · FIELD NOTES";
              const defaultLeft2 = "ISSUE NO. 42";
              const curLeft = page.mastheadLeft ?? "";
              const isLeftHidden = curLeft === "__hidden__";
              const leftParts = curLeft.includes(":::") ? curLeft.split(":::") : [curLeft, ""];
              const leftLine1 = leftParts[0] || defaultLeft1;
              const leftLine2 = leftParts[1] || defaultLeft2;

              const defaultRight1 = "INDEPENDENT IDEAS";
              const defaultRight2 = "AUTUMN · 2026";
              const curRight = page.mastheadRight ?? "";
              const isRightHidden = curRight === "__hidden__";
              const rightParts = curRight.includes(":::") ? curRight.split(":::") : [curRight, ""];
              const rightLine1 = rightParts[0] || defaultRight1;
              const rightLine2 = rightParts[1] || defaultRight2;

              return (
                <header className={`w-full border-b px-6 sm:px-10 py-5 grid grid-cols-1 md:grid-cols-3 items-end gap-4 ${
                  isDark ? "border-white/20" : "border-[#151515]"
                }`}>
                  {/* Left: Vol & Issue */}
                  <div className="text-left font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] leading-tight opacity-90 min-h-[34px] flex items-end">
                    {!isLeftHidden ? (
                      <div>
                        <div>{leftLine1}</div>
                        <div className="mt-0.5">{leftLine2}</div>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* Center: Brand Logo + Brand Title */}
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 text-center">
                    {logo && (
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden shadow-sm border shrink-0 bg-transparent ${
                        isDark ? "border-white/20" : "border-[#151515]/20"
                      }`}>
                        <img src={logo} alt={businessName} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.02em] uppercase font-sans leading-none ${
                      isDark ? "text-[#eae8e3]" : "text-[#151515]"
                    }`}>
                      {businessName || "EDITORIAL BOARD"}
                    </h1>
                  </div>

                  {/* Right: Category & Season */}
                  <div className="text-left md:text-right font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] leading-tight opacity-90 min-h-[34px] flex items-end justify-start md:justify-end">
                    {!isRightHidden ? (
                      <div>
                        <div>{rightLine1}</div>
                        <div className={`mt-0.5 font-normal ${isDark ? "text-zinc-400" : "text-[#5a574f]"}`}>
                          {rightLine2}
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </header>
              );
            })()}

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
              className={`relative min-h-[480px] sm:min-h-[540px] md:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 md:p-14 border-b overflow-hidden ${
                isDark ? "border-white/20" : "border-[#151515]"
              }`}
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
                      <div className={`flex items-center justify-between pb-2.5 border-b text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] ${
                        isDark ? "border-white/20" : "border-[#151515]"
                      }`}>
                        <span>{page.bulletsTitle || "INSIDE THIS ISSUE"}</span>
                        <span>CONTENTS 01—0{displayBullets.length}</span>
                      </div>

                      {/* Content Rows */}
                      <div className={`divide-y ${isDark ? "divide-white/10" : "divide-[#151515]/20"}`}>
                        {displayBullets.map((item: string, idx: number) => {
                          const parts = item.includes(":::") ? item.split(":::") : [item, ""];
                          const itemTitle = parts[0]?.trim() || `Key Strategy 0${idx + 1}`;
                          const itemDesc = parts[1]?.trim() || "";
                          const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;

                          return (
                            <div key={idx} className="py-5 sm:py-6 flex items-start justify-between gap-4 group">
                              <div className="flex items-start gap-4 sm:gap-6 flex-1">
                                <span className={`font-serif italic text-2xl sm:text-3xl font-normal shrink-0 w-8 ${
                                  isDark ? "text-[#eae8e3]" : "text-[#151515]"
                                }`}>
                                  {numStr}
                                </span>
                                <div className="space-y-1 flex-1">
                                  <h3 className={`font-serif font-bold text-xl sm:text-2xl leading-snug ${
                                    isDark ? "text-[#eae8e3]" : "text-[#151515]"
                                  }`}>
                                    {itemTitle}
                                  </h3>
                                  {itemDesc && (
                                    <p className={`text-xs sm:text-sm font-sans leading-relaxed ${
                                      isDark ? "text-[#eae8e3]/80" : "text-[#151515]/80"
                                    }`}>
                                      {itemDesc}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="pt-1">
                                <svg className={`w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity ${
                                  isDark ? "text-[#eae8e3]" : "text-[#151515]"
                                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                {page.pitch !== "__hidden__" && page.pitch !== "__none__" && (
                  <div className={`w-full overflow-hidden border-t-4 border-[#2544d8] p-6 sm:p-8 space-y-3 ${
                    isDark ? "bg-[#1e1e24]" : "bg-[#e7e2d7]"
                  }`}>
                    {(() => {
                      const defaultQuotePlaceholder = "“Good work earns attention once. A distinct point of view earns it again.”";
                      const defaultAuthorPlaceholder = `— ${businessName || "EDITORIAL BOARD"}, EDITOR AT LARGE`;
                      const pitchParts = (page.pitch || "").includes(":::") ? (page.pitch || "").split(":::") : [page.pitch || "", ""];
                      const quoteText = pitchParts[0]?.trim() || "";
                      const quoteAuthor = pitchParts[1]?.trim() || "";
                      return (
                        <>
                          <blockquote className={`font-serif italic text-lg sm:text-xl leading-snug ${
                            isDark ? "text-[#eae8e3]" : "text-[#151515]"
                          }`}>
                            {quoteText || defaultQuotePlaceholder}
                          </blockquote>
                          <div className={`text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] ${
                            isDark ? "text-[#eae8e3]/80" : "text-[#151515]/80"
                          }`}>
                            {quoteAuthor || defaultAuthorPlaceholder}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Digital Edition Form Panel (~35% width) */}
              <div className={`lg:col-span-4 border-t lg:border-t-0 lg:border-l p-6 sm:p-10 flex flex-col justify-start space-y-6 ${
                isDark ? "border-white/20" : "border-[#151515]"
              }`}>
                <div className={`text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] ${
                  isDark ? "text-blue-400" : "text-[#2544d8]"
                }`}>
                  DIGITAL EDITION
                </div>

                <div className="space-y-2">
                  <h3 className={`font-serif text-3xl sm:text-4xl font-normal leading-tight ${
                    isDark ? "text-[#eae8e3]" : "text-[#151515]"
                  }`}>
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
        ) : isTemplate3 ? (
          /* TEMPLATE 3: AI with Ambesh Editorial Note (Full-Width Responsive Desktop) */
          (() => {
            const bg = isDark ? "#0c120a" : "#f4f6f0";
            const surface = isDark ? "#171e12" : "#ffffff";
            const surfaceBottom = isDark ? "#141b10" : "#eef2e7";
            const foreground = isDark ? "#edf0e8" : "#141c10";
            const muted = isDark ? "#a7ada0" : "#525c4c";
            const faint = isDark ? "#8d9584" : "#788272";
            const borderCol = isDark ? "#242d1e" : "#d8dfd2";
            const inputBorder = isDark ? "#35402a" : "#c4cec0";
            const accent = isDark ? (brandColor === "#0066B2" ? "#d0e797" : brandColor) : (brandColor === "#0066B2" ? "#4d6b1a" : brandColor);
            const accentInk = isDark ? "#1d2a12" : "#ffffff";
            const panelFill = isDark
              ? "linear-gradient(135deg, #171e12, #141b10)"
              : "linear-gradient(135deg, #ffffff, #f0f4ea)";

            const displayBusinessName = businessName || "AI with Ambesh";
            const displayAuthorName = authorName || "Ambesh Tiwari";
            const brandInitial = (displayBusinessName ? displayBusinessName.charAt(0) : "a").toLowerCase();

            const defaultBenefitCards = [
              {
                title: "AI Updates",
                desc: "Important developments from OpenAI, Google, Anthropic, Microsoft and Meta, explained for business owners.",
              },
              {
                title: "Real Business Examples",
                desc: "See how companies are actually using AI. Understand the problem, the approach, and what you can learn from it.",
              },
              {
                title: "Steal This",
                desc: "Templates, prompts, workflows and checklists. One practical resource you can save and put to use right away.",
              },
              {
                title: "What I'm Testing",
                desc: "Things I'm personally trying inside BDA, the lessons along the way, and what I think is worth your time.",
              },
            ];

            const isBulletsHidden = Array.isArray(page.bullets) && page.bullets.length === 1 && page.bullets[0] === "__hidden__";
            const displayBullets = Array.isArray(page.bullets) && page.bullets.length > 0 && !isBulletsHidden
              ? page.bullets
              : defaultBenefitCards.map(c => `${c.title} ::: ${c.desc}`);

            const parseCard = (item: string, idx: number) => {
              if (!item) {
                const def = defaultBenefitCards[idx % defaultBenefitCards.length];
                return { title: def.title, desc: def.desc };
              }
              if (item.includes(":::")) {
                const parts = item.split(":::");
                return { title: parts[0]?.trim() || "", desc: parts.slice(1).join(":::").trim() };
              }
              if (item.includes(" — ")) {
                const [title, ...rest] = item.split(" — ");
                return { title: title.trim(), desc: rest.join(" — ").trim() };
              }
              return { title: item, desc: "" };
            };

            const renderHighlightedHeadline = (text: string) => {
              if (!text) {
                return (
                  <>
                    Use AI to run a <em style={{ color: accent, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", display: "inline" }}>smarter business.</em>
                  </>
                );
              }
              const parts = text.split(/(\*[^*]+\*|_[^_]+_|<em>.*?<\/em>)/g);
              return (
                <>
                  {parts.map((part, i) => {
                    if ((part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
                        (part.startsWith("_") && part.endsWith("_") && part.length > 2)) {
                      return (
                        <em key={i} style={{ color: accent, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", display: "inline" }}>
                          {part.slice(1, -1)}
                        </em>
                      );
                    }
                    if (part.startsWith("<em>") && part.endsWith("</em>")) {
                      return (
                        <em key={i} style={{ color: accent, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", display: "inline" }}>
                          {part.replace(/<\/?em>/g, "")}
                        </em>
                      );
                    }
                    return <React.Fragment key={i}>{part}</React.Fragment>;
                  })}
                </>
              );
            };

            const isPitchHidden = page.pitch === "__hidden__" || page.pitch === "__none__";
            const isEyebrowHidden = page.bulletsTitle === "__hidden__" || page.bulletsTitle === "__none__";
            const isProofHidden = page.mastheadRight === "__hidden__" || page.mastheadRight === "__none__";
            const isAuthorBioHidden = page.mastheadLeft === "__hidden__";
            const isSubheadlineHidden = page.subheadline === "__hidden__";

            const defaultAside1 = "Built for people running a business.";
            const defaultAside2 = "Every idea comes back to the work.";
            const parsePitch = (raw?: string) => {
              if (!raw || !raw.trim() || isPitchHidden) {
                return { line1: defaultAside1, line2: defaultAside2 };
              }
              if (raw.includes(":::")) {
                const [l1, ...l2] = raw.split(":::");
                return { line1: l1.trim(), line2: l2.join(":::").trim() };
              }
              if (raw.includes("\n")) {
                const [l1, ...l2] = raw.split("\n");
                return { line1: l1.trim(), line2: l2.join(" ").trim() };
              }
              return { line1: raw.trim(), line2: "" };
            };

            const { line1: aside1, line2: aside2 } = parsePitch(page.pitch);

            const defaultProofPoints = ["3-minute read", "No technical jargon", "No AI noise"];
            const proofPoints = !isProofHidden
              ? (page.mastheadRight && page.mastheadRight.trim()
                  ? page.mastheadRight.split(":::").map((p: string) => p.trim()).filter(Boolean)
                  : defaultProofPoints)
              : [];

            return (
              <div
                className="w-full min-h-screen transition-colors duration-200"
                style={{
                  backgroundColor: bg,
                  color: foreground,
                  fontFamily: "Arial, Helvetica, sans-serif",
                }}
              >
                <div className="w-full max-w-[1480px] mx-auto px-3.5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
                  {/* HEADER */}
                  <header
                    className="h-16 sm:h-20 md:h-24 flex items-center justify-between gap-2"
                    style={{ borderBottom: `1px solid ${borderCol}` }}
                  >
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 sm:gap-3 font-semibold text-sm sm:text-base min-w-0"
                      style={{ color: foreground }}
                    >
                      <span
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-base sm:text-xl leading-none shrink-0 overflow-hidden shadow-xs"
                        style={{
                          backgroundColor: accent,
                          color: accentInk,
                          fontFamily: "Georgia, 'Times New Roman', serif",
                        }}
                      >
                        {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : brandInitial}
                      </span>
                      <span className="font-semibold tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">{displayBusinessName}</span>
                      <span style={{ color: accent }} className="text-lg sm:text-xl -ml-1 sm:-ml-2">.</span>
                    </a>

                    <nav className="flex items-center gap-2 sm:gap-7 text-xs shrink-0" style={{ color: muted }}>
                      {!isBulletsHidden && (
                        <a href="#what-you-get" className="hidden md:inline-block transition-colors hover:opacity-100">
                          Read a preview
                        </a>
                      )}
                      <a
                        href="#newsletter"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all hover:brightness-110 flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap"
                        style={{
                          borderColor: borderCol,
                          color: foreground,
                          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        }}
                      >
                        <span>Join the newsletter</span>
                        <span style={{ color: accent }}>↗</span>
                      </a>
                    </nav>
                  </header>

                  {/* HERO SECTION (2-Column Grid) */}
                  <section
                    className="grid grid-cols-1 lg:grid-cols-[1.18fr_0.82fr] xl:grid-cols-[1.25fr_0.75fr] gap-8 sm:gap-14 lg:gap-20 py-8 sm:py-16 lg:py-24 items-start"
                    style={{ borderBottom: `1px solid ${borderCol}` }}
                  >
                    {/* Left Copy */}
                    <div className="space-y-6 sm:space-y-8">
                      {!isEyebrowHidden && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                          <p className="text-[11px] font-bold tracking-[2px] uppercase m-0" style={{ color: accent }}>
                            {page.bulletsTitle || "A weekly note for business minds"}
                          </p>
                        </div>
                      )}

                      <h1
                        className="text-4xl sm:text-5xl lg:text-[58px] xl:text-[66px] font-normal leading-[1.06] m-0 tracking-tight"
                        style={{
                          color: foreground,
                          fontFamily: "Georgia, 'Times New Roman', serif",
                        }}
                      >
                        {renderHighlightedHeadline(activeHeadline || page.headline || "Use AI to run a *smarter business.*")}
                      </h1>

                      {!isSubheadlineHidden && (
                        <p className="text-base sm:text-lg leading-[1.8] max-w-[620px] m-0" style={{ color: muted }}>
                          {page.subheadline || "Every week I filter the AI noise and send you what actually matters: important updates, real business use cases, and one resource you can steal and use."}
                        </p>
                      )}

                      {proofPoints.length > 0 && (
                        <div className="flex flex-wrap gap-4 text-xs sm:text-sm" style={{ color: muted }}>
                          {proofPoints.map((pt: string, idx: number) => (
                            <span key={idx} className="flex items-center gap-1.5">
                              <span style={{ color: accent }}>✓</span> {pt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Author Card */}
                      <div className="pt-2 flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg shrink-0 overflow-hidden shadow-xs"
                          style={{
                            borderColor: inputBorder,
                            color: accent,
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            backgroundColor: isDark ? "#141b10" : "#eef2e7",
                          }}
                        >
                          {activeImageUrl && activeImageUrl.trim() !== "" ? (
                            <img src={activeImageUrl} alt={displayAuthorName} className="w-full h-full object-cover" />
                          ) : (
                            displayAuthorName ? displayAuthorName.charAt(0).toUpperCase() : "A"
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm sm:text-base font-semibold m-0" style={{ color: foreground }}>
                            {displayAuthorName}
                          </p>
                          {!isAuthorBioHidden && (
                            <p className="text-xs sm:text-sm leading-tight m-0" style={{ color: faint }}>
                              {page.mastheadLeft || (businessName ? `Founder of ${businessName}` : "Founder of BDA Technologies")} · Author of <em>Accelerate with AI</em>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Signup Panel */}
                    <div
                      id="newsletter"
                      className="rounded-2xl border p-6 sm:p-8 md:p-10 shadow-2xl transition-all relative overflow-hidden"
                      style={{
                        background: panelFill,
                        borderColor: borderCol,
                      }}
                    >
                      <div className="space-y-1 mb-6">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider m-0" style={{ color: accent }}>
                          Less noise. More useful.
                        </p>
                        <h2
                          className="text-2xl sm:text-3xl font-normal m-0"
                          style={{
                            color: foreground,
                            fontFamily: "Georgia, 'Times New Roman', serif",
                          }}
                        >
                          {page.formTitle || "Your next business advantage."}
                        </h2>
                        <p className="text-xs sm:text-sm leading-relaxed mt-1.5 mb-0" style={{ color: muted }}>
                          {page.formSubtitle || "A little clarity on AI. One useful idea to put to work. In your inbox, every week."}
                        </p>
                      </div>

                      <MagnetSignupForm
                        cta={page.cta}
                        formTitle={page.formTitle}
                        formSubtitle={page.formSubtitle}
                        formButtonText={page.formButtonText || "Get AI with Ambesh"}
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
                        layout="forest-newsletter"
                        afterSignupOption={page.afterSignupOption}
                        destinationUrl={page.destinationUrl}
                      />
                    </div>
                  </section>

                  {/* BENEFITS / "WHAT YOU'LL GET" SECTION */}
                  {!isBulletsHidden && (
                    <section id="what-you-get" className="py-16 sm:py-20">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                        <div>
                          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>
                            A useful inbox habit
                          </p>
                          <h2
                            className="text-2xl sm:text-4xl font-normal m-0"
                            style={{
                              color: foreground,
                              fontFamily: "Georgia, 'Times New Roman', serif",
                            }}
                          >
                            What you&apos;ll get.
                          </h2>
                        </div>
                        {!isPitchHidden && (
                          <p className="text-xs sm:text-sm leading-relaxed m-0 md:text-right" style={{ color: muted }}>
                            {aside1}
                            {aside2 && <><br />{aside2}</>}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayBullets.map((item, idx) => {
                          const parsed = parseCard(item, idx);
                          const def = defaultBenefitCards[idx % defaultBenefitCards.length];
                          return (
                            <div
                              key={idx}
                              className="rounded-xl border p-6 sm:p-7 flex flex-col justify-between min-h-[230px] shadow-sm"
                              style={{
                                background: panelFill,
                                borderColor: borderCol,
                              }}
                            >
                              <div>
                                <div className="mb-6" style={{ color: accent }}>
                                  {idx % 4 === 0 && (
                                    <svg className="w-6 h-6 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                  {idx % 4 === 1 && (
                                    <svg className="w-6 h-6 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <rect x="4" y="7" width="16" height="13" rx="2" />
                                      <path d="M9 7V4h6v3M4 12c5 3 11 3 16 0M10 12h4v4h-4z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                  {idx % 4 === 2 && (
                                    <svg className="w-6 h-6 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path d="M12 3v12m-5-5 5 5-5 5M4 16v5h16v-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                  {idx % 4 === 3 && (
                                    <svg className="w-6 h-6 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path d="M9 3h6M10 3v7L4.5 19a1.3 1.3 0 0 0 1.1 2h12.8a1.3 1.3 0 0 0 1.1-2L14 10V3M8 15h8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                                <h3
                                  className="text-base sm:text-lg font-normal mb-2.5"
                                  style={{
                                    color: foreground,
                                    fontFamily: "Georgia, 'Times New Roman', serif",
                                  }}
                                >
                                  {parsed.title || def.title}
                                </h3>
                                <p className="text-xs sm:text-sm leading-relaxed m-0" style={{ color: muted }}>
                                  {parsed.desc || def.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* FOOTER */}
                  <footer
                    className="py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
                    style={{
                      borderTop: `1px solid ${borderCol}`,
                      color: faint,
                    }}
                  >
                    <span>© {new Date().getFullYear()} {displayBusinessName} · All rights reserved.</span>
                    <span>By {displayAuthorName}</span>
                  </footer>
                </div>
              </div>
            );
          })()
        ) : isTemplate4 ? (
          /* TEMPLATE 4: Night Poster / Day Poster Brutalist Edition */
          (() => {
            const isDark = themeMode === "dark";
            const canvasBg = isDark ? "#0b0d12" : "#f5f1e8";
            const textColor = isDark ? "#f5f1e8" : "#0b0d12";
            const mutedText = isDark ? "#b9bbc3" : "#4b5563";
            const dimText = isDark ? "#8d9099" : "#6b7280";
            const borderColor = isDark ? "rgba(255, 255, 255, 0.17)" : "rgba(11, 13, 18, 0.16)";
            const rawAccent4 = brandColor || "#ff5038";
            const accentColor = isDark && isVeryDark(rawAccent4) ? "#ff5038" : rawAccent4;
            const numberTeal = isDark ? "#2dd4bf" : "#0d9488";
            const currentYear = new Date().getFullYear();

            const defaultTracks = [
              {
                title: "Pattern Recognition",
                desc: "Read the cultural signals before they become obvious.",
              },
              {
                title: "Narrative Pressure",
                desc: "Build stories that create momentum without manipulation.",
              },
              {
                title: "Durable Demand",
                desc: "Turn attention into a repeatable commercial system.",
              },
            ];

            const parseTrack = (item: string, idx: number) => {
              if (!item) return defaultTracks[idx % defaultTracks.length];
              if (item.includes(":::")) {
                const parts = item.split(":::");
                return { title: parts[0]?.trim() || "", desc: parts[1]?.trim() || "" };
              }
              if (item.includes(" — ")) {
                const parts = item.split(" — ");
                return { title: parts[0]?.trim() || "", desc: parts[1]?.trim() || "" };
              }
              if (item.includes(" - ")) {
                const parts = item.split(" - ");
                return { title: parts[0]?.trim() || "", desc: parts[1]?.trim() || "" };
              }
              return { title: item, desc: "" };
            };

            const parsePitch = (rawPitch: string | undefined | null) => {
              if (!rawPitch) {
                return {
                  statNumber: "48",
                  pitchText: "Pages of battle-tested systems for creating authority, holding attention, and turning an original point of view into durable demand.",
                  hasStat: true,
                };
              }
              if (rawPitch === "__hidden__" || rawPitch === "__none__") {
                return {
                  statNumber: "",
                  pitchText: "",
                  hasStat: false,
                  isHidden: true,
                };
              }
              if (rawPitch.includes(":::")) {
                const parts = rawPitch.split(":::");
                const num = parts[0]?.trim() || "";
                const text = parts.slice(1).join(":::").trim();
                const hasStat = num !== "__none__" && num !== "__hidden__";
                return {
                  statNumber: hasStat ? num : "",
                  pitchText: text,
                  hasStat,
                  isHidden: false,
                };
              }
              return {
                statNumber: "48",
                pitchText: rawPitch,
                hasStat: true,
                isHidden: false,
              };
            };

            const parsedPitch = parsePitch(page.pitch);

            const trackItems = (page.bullets && page.bullets.length > 0)
              ? page.bullets
              : defaultTracks.map((t) => `${t.title} ::: ${t.desc}`);

            return (
              <div
                className="w-full flex-1 flex flex-col justify-between selection:bg-rose-500 selection:text-white transition-colors duration-200"
                style={{
                  backgroundColor: canvasBg,
                  color: textColor,
                  fontFamily: "'Space Mono', monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                }}
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
                      .font-bebas {
                        font-family: 'Bebas Neue', sans-serif, -apple-system;
                      }
                      .font-space {
                        font-family: 'Space Mono', monospace, ui-monospace;
                      }
                    `,
                  }}
                />

                <div className="w-full flex-1 flex flex-col">
                  {/* 1. TOP NAV BAR */}
                  <header
                    className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-5 border-b text-[10px] tracking-[0.18em] uppercase transition-colors"
                    style={{ borderColor }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {logo && (
                        <img
                          src={logo}
                          alt="Logo"
                          className="h-6 w-6 object-cover rounded-xs border shrink-0"
                          style={{ borderColor }}
                        />
                      )}
                      <b className="font-space tracking-[0.18em] truncate">
                        {(page as any).mastheadLeft || `${businessName.toUpperCase()} / RESEARCH`}
                      </b>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-space text-right" style={{ color: mutedText }}>
                        {(page as any).mastheadRight || `ISSUE 11 — ${currentYear}`}
                      </span>
                    </div>
                  </header>

                  {/* 2. MAIN HERO STAGE */}
                  <main className="w-full flex-1 flex flex-col">
                    <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-[580px] lg:min-h-[640px] relative">
                      {/* Left Column: Overline, Massive Headline, Stat & Pitch */}
                      <div className="p-6 sm:p-10 lg:py-14 lg:px-12 flex flex-col justify-between relative z-10">
                        <div className="space-y-5 sm:space-y-6">
                          <div>
                            <small
                              className="font-space text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] block"
                              style={{ color: accentColor }}
                            >
                              {page.bulletsTitle || "A MANUAL FOR INDEPENDENT MINDS"}
                            </small>
                          </div>

                          <div>
                            <h1
                              className="font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[110px] leading-[0.82] tracking-normal uppercase m-0 break-words"
                              style={{ color: textColor }}
                            >
                              {activeHeadline || (
                                <>
                                  THE<br />
                                  <span style={{ color: accentColor }}>SIGNAL</span>
                                  <br />
                                  CODE
                                </>
                              )}
                            </h1>
                          </div>

                          {page.subheadline && (
                            <p
                              className="font-space text-xs sm:text-sm leading-relaxed max-w-[480px] m-0"
                              style={{ color: mutedText }}
                            >
                              {page.subheadline}
                            </p>
                          )}
                        </div>

                        {/* Intro Stat & Pitch Row */}
                        {!parsedPitch.isHidden && (
                          <div className="flex items-start gap-4 sm:gap-6 pt-8 sm:pt-10">
                            {parsedPitch.hasStat && parsedPitch.statNumber && (
                              <div
                                className="font-bebas text-5xl sm:text-6xl md:text-7xl leading-none select-none shrink-0"
                                style={{ color: numberTeal }}
                              >
                                {parsedPitch.statNumber}
                              </div>
                            )}

                            <div className="flex-1 max-w-[460px]">
                              <p
                                className="font-space text-xs sm:text-[13px] leading-relaxed m-0"
                                style={{ color: mutedText }}
                              >
                                {parsedPitch.pitchText}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Cover Image & Floating Form Box */}
                      <div className="relative min-h-[480px] lg:min-h-full flex flex-col justify-end overflow-hidden group">
                        {activeImageUrl && activeImageUrl.trim() !== "" ? (
                          <img
                            src={activeImageUrl}
                            alt={page.name || "Poster Visual"}
                            className="absolute inset-0 w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center select-none"
                            style={{
                              background: isDark
                                ? "radial-gradient(circle at 60% 40%, #1c202a 0%, #0d0f15 100%)"
                                : "radial-gradient(circle at 60% 40%, #e8e2d5 0%, #d8d0c0 100%)",
                            }}
                          >
                            <div
                              className="absolute inset-0 opacity-15 pointer-events-none"
                              style={{
                                backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
                                backgroundSize: "48px 48px",
                              }}
                            />
                            <div className="relative z-10 text-center space-y-3 px-6 pointer-events-none">
                              <div
                                className="font-bebas text-6xl sm:text-7xl opacity-20 tracking-widest uppercase"
                                style={{ color: textColor }}
                              >
                                {businessName}
                              </div>
                              <div
                                className="font-space text-[10px] tracking-[0.25em] uppercase opacity-40"
                                style={{ color: textColor }}
                              >
                                ARCHIVAL SPECIFICATION // VOL 04
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Subtle Fade Gradient */}
                        <div
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            background: isDark
                              ? `linear-gradient(90deg, #0b0d12 0%, rgba(11, 13, 18, 0.7) 20%, transparent 55%), linear-gradient(0deg, #0b0d12 0%, transparent 40%)`
                              : `linear-gradient(90deg, #f5f1e8 0%, rgba(245, 241, 232, 0.7) 20%, transparent 55%), linear-gradient(0deg, #f5f1e8 0%, transparent 40%)`,
                          }}
                        />

                        {/* Rotated Sideword */}
                        <div
                          className="hidden lg:block absolute right-[-45px] top-[240px] transform rotate-90 font-bebas text-lg tracking-[0.3em] select-none pointer-events-none z-20"
                          style={{
                            color: isDark ? "rgba(255, 255, 255, 0.28)" : "rgba(11, 13, 18, 0.28)",
                          }}
                        >
                          LIMITED DIGITAL RELEASE
                        </div>

                        {/* Floating Signup Form Box */}
                        <aside className="relative lg:absolute z-30 lg:right-[4vw] lg:bottom-10 m-5 lg:m-0 w-auto lg:w-[min(390px,90%)]">
                          <MagnetSignupForm
                            cta={page.cta}
                            layout="poster"
                            formTitle={page.formTitle || "ENTER THE ARCHIVE"}
                            formSubtitle={
                              page.formSubtitle ||
                              "Receive the complete report and three working templates."
                            }
                            formButtonText={page.formButtonText || "UNLOCK THE REPORT →"}
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
                        </aside>
                      </div>
                    </section>

                    {/* 3. TRACKS SECTION (BULLETS) */}
                    <section
                      className="border-t grid grid-cols-1 md:grid-cols-3 transition-colors"
                      style={{ borderColor }}
                    >
                      {trackItems.map((item, idx) => {
                        const trackNum = (idx + 1).toString().padStart(2, "0");
                        const parsed = parseTrack(item, idx);

                        return (
                          <article
                            key={idx}
                            className={`p-6 sm:py-7 sm:px-8 flex flex-col justify-between ${
                              idx < trackItems.length - 1 ? "md:border-r border-b md:border-b-0" : ""
                            }`}
                            style={{ borderColor }}
                          >
                            <div className="space-y-2">
                              <small
                                className="font-space text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
                                style={{ color: numberTeal }}
                              >
                                TRACK / {trackNum}
                              </small>
                              <h3
                                className="font-bebas text-2xl sm:text-3xl tracking-normal uppercase m-0 leading-tight"
                                style={{ color: textColor }}
                              >
                                {parsed.title}
                              </h3>
                              <p
                                className="font-space text-[10px] sm:text-[11px] leading-relaxed m-0"
                                style={{ color: dimText }}
                              >
                                {parsed.desc}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </section>
                  </main>
                </div>
              </div>
            );
          })()
        ) : isTemplate5 ? (
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
        ) : isTemplate6 ? (
          /* TEMPLATE 6: Monograph Editorial Publication */
          <div
            className={`w-full flex-1 flex flex-col justify-center py-4 sm:py-8 max-w-[1160px] mx-auto transition-colors ${
              themeMode === "dark" ? "text-[#fcfaf8]" : "text-[#1c1917]"
            }`}
            style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            {/* Masthead Header */}
            <header
              className={`flex justify-between items-end pb-5 border-b transition-colors ${
                themeMode === "dark" ? "border-[#33302c]" : "border-[#d9d4cf]"
              }`}
            >
              <div>
                <div
                  className="text-[10px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                >
                  {(page as any).mastheadLeft || "Intelligence report · Issue 08"}
                </div>
                <div
                  className="font-instrument italic text-[28px] sm:text-[34px] leading-tight mt-1"
                  style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
                >
                  {(page as any).mastheadRight || businessName || "The Executive Dispatch"}
                </div>
              </div>

              <div
                className="text-right text-xs hidden sm:block font-manrope shrink-0"
                style={{ color: themeMode === "dark" ? "#a89f97" : "#5c554f" }}
              >
                <b className={themeMode === "dark" ? "text-zinc-200" : "text-zinc-900"}>
                  Published {new Date().getFullYear()}
                </b>
                <br />
                By {businessName || "Marcus Vane"}
              </div>
            </header>

            {/* Main Grid */}
            <main className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.8fr] gap-10 lg:gap-[70px] pt-8 lg:pt-[52px]">
              {/* Left Column: Visual & Chapters */}
              <section className="space-y-7 min-w-0">
                {/* Visual Cover */}
                <div
                  className={`relative w-full aspect-[3/2] rounded-xs overflow-hidden border transition-all ${
                    themeMode === "dark" ? "border-[#33302c] bg-[#1a1918]" : "border-[#ded9d4] bg-[#f5efe9]"
                  }`}
                >
                  {activeImageUrl && activeImageUrl.trim() !== "" ? (
                    <img
                      src={activeImageUrl}
                      alt={page.name || "Monograph Visual"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full relative flex items-center justify-center overflow-hidden"
                      style={{
                        background:
                          themeMode === "dark"
                            ? "linear-gradient(135deg, #24201d 0%, #161514 100%)"
                            : "linear-gradient(135deg, #f0e8e0 0%, #ded2c6 100%)",
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          backgroundImage: `radial-gradient(${brandColor} 1px, transparent 1px)`,
                          backgroundSize: "20px 20px",
                        }}
                      />
                      <div className="relative z-10 text-center px-4 space-y-2">
                        <div
                          className="w-16 h-16 mx-auto rounded-full border flex items-center justify-center font-instrument italic text-2xl shadow-sm"
                          style={{
                            borderColor: brandColor,
                            color: brandColor,
                            backgroundColor: themeMode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {(businessName || "M").charAt(0)}
                        </div>
                        <p
                          className="font-instrument italic text-lg sm:text-xl"
                          style={{ color: themeMode === "dark" ? "#ded9d4" : "#5c554f" }}
                        >
                          {(page as any).mastheadRight || businessName || "The Executive Dispatch"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Tag */}
                <div>
                  <span
                    className="inline-block px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase rounded-xs"
                    style={{
                      backgroundColor: themeMode === "dark" ? "rgba(194, 65, 12, 0.2)" : "#f5e5dc",
                      color: themeMode === "dark" ? "#fb923c" : "#b53b12",
                    }}
                  >
                    {page.bulletsTitle || "Strategic framework"}
                  </span>
                </div>

                {/* Title */}
                <h1
                  className="font-instrument font-medium text-[36px] sm:text-[48px] lg:text-[62px] xl:text-[70px] leading-[0.94] tracking-tight m-0"
                  style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
                >
                  {activeHeadline || "The Architecture of High-Output Engineering"}
                </h1>

                {/* Subheadline / Lead */}
                {page.subheadline && (
                  <p
                    className="text-[17px] sm:text-[19px] leading-[1.6] max-w-[620px] m-0"
                    style={{ color: themeMode === "dark" ? "#c4bcb3" : "#5c554f" }}
                  >
                    {page.subheadline}
                  </p>
                )}

                {/* Chapters */}
                {page.bullets && page.bullets.length > 0 && page.bullets.some((b: string) => b && b.trim().length > 0) && (
                  <div
                    className={`pt-7 border-t transition-colors ${
                      themeMode === "dark" ? "border-[#33302c]" : "border-[#ded9d4]"
                    }`}
                  >
                    <div
                      className="text-[10px] font-bold tracking-[0.16em] uppercase mb-3"
                      style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                    >
                      Inside this guide
                    </div>

                    <div className="divide-y divide-[#ded9d4] dark:divide-[#33302c]">
                      {page.bullets.filter((b: string) => b && b.trim().length > 0).map((item: string, idx: number) => {
                        const numStr = (idx + 1).toString().padStart(2, "0") + " /";
                        let title = item;
                        let desc = "";
                        if (item.includes(" — ")) {
                          const parts = item.split(" — ");
                          title = parts[0];
                          desc = parts.slice(1).join(" — ");
                        } else if (item.includes(" - ")) {
                          const parts = item.split(" - ");
                          title = parts[0];
                          desc = parts.slice(1).join(" - ");
                        } else if (item.includes(": ")) {
                          const parts = item.split(": ");
                          title = parts[0];
                          desc = parts.slice(1).join(": ");
                        }

                        return (
                          <article
                            key={idx}
                            className="grid grid-cols-[44px_1fr] sm:grid-cols-[48px_1fr] py-5 items-start gap-2"
                          >
                            <span
                              className="font-instrument italic text-[19px] sm:text-[21px]"
                              style={{ color: brandColor || "#c2410c" }}
                            >
                              {numStr}
                            </span>
                            <div className="space-y-1 min-w-0 pr-2">
                              <h3
                                className="text-[16px] sm:text-[17px] font-bold leading-snug m-0"
                                style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
                              >
                                {title}
                              </h3>
                              {desc && (
                                <p
                                  className="text-[13px] leading-[1.5] m-0"
                                  style={{ color: themeMode === "dark" ? "#a89f97" : "#756d66" }}
                                >
                                  {desc}
                                </p>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pullquote */}
                {page.pitch && page.pitch !== "__HIDDEN__" && page.pitch.trim().length > 0 && (
                  <blockquote
                    className="p-7 sm:p-9 rounded-xs transition-colors"
                    style={{
                      backgroundColor: themeMode === "dark" ? "#0d0c0b" : "#1c1917",
                      color: "#fcfaf8",
                      border: themeMode === "dark" ? "1px solid #292524" : "none",
                    }}
                  >
                    <div className="font-instrument italic text-[22px] sm:text-[25px] leading-[1.3]">
                      {page.pitch}
                    </div>
                    <small className="block mt-5 font-manrope font-bold text-[9px] tracking-[0.13em] uppercase text-[#a49d96]">
                      {businessName || "Marcus Vane"} · Author
                    </small>
                  </blockquote>
                )}
              </section>

              {/* Right Column: Sticky Opt-in Card */}
              <aside className="w-full relative lg:self-stretch">
                <div
                  className="lg:sticky lg:top-8 rounded-xs border p-7 sm:p-9 transition-all space-y-5"
                  style={{
                    backgroundColor: themeMode === "dark" ? "#1c1917" : "#ffffff",
                    borderColor: themeMode === "dark" ? "#33302c" : "#ddd7d2",
                    boxShadow:
                      themeMode === "dark"
                        ? "0 18px 50px rgba(0,0,0,0.6)"
                        : "0 18px 50px rgba(35,25,18,0.08)",
                  }}
                >
                  <div>
                    <div
                      className="text-[10px] font-bold tracking-[0.16em] uppercase mb-2"
                      style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                    >
                      Complimentary digital edition
                    </div>
                    <h2
                      className="font-instrument text-[28px] sm:text-[32px] font-medium leading-tight m-0"
                      style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
                    >
                      {page.formTitle || "Get the full report"}
                    </h2>
                    <p
                      className="text-[13px] leading-[1.5] mt-1.5 mb-0"
                      style={{ color: themeMode === "dark" ? "#a89f97" : "#746c65" }}
                    >
                      {page.formSubtitle ||
                        "The PDF and supplemental worksheets will arrive directly in your inbox."}
                    </p>
                  </div>

                  {/* MagnetSignupForm */}
                  <MagnetSignupForm
                    cta={page.cta}
                    layout="monograph"
                    formTitle={page.formTitle || "Get the full report"}
                    formSubtitle={page.formSubtitle}
                    formButtonText={page.formButtonText || "Receive the dispatch →"}
                    deliverable={page.deliverable}
                    accent={page.accent}
                    pageId={page.id}
                    pageName={page.name}
                    pageSlug={page.slug}
                    pageOwnerEmail={(page as any).userEmail}
                    brandColor={brandColor || "#c2410c"}
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

                  <p
                    className="text-center text-[9px] font-manrope pt-2 m-0"
                    style={{ color: themeMode === "dark" ? "#8a817a" : "#746c65" }}
                  >
                    No noise. Only occasional, high-signal notes.
                  </p>
                </div>
              </aside>
            </main>

            {/* Footer */}
            <footer
              className={`border-t mt-14 pt-6 pb-4 text-[9px] font-bold tracking-[0.14em] uppercase transition-colors text-center sm:text-left ${
                themeMode === "dark" ? "border-[#33302c] text-[#8a817a]" : "border-[#ded9d4] text-[#8a817a]"
              }`}
            >
              © {new Date().getFullYear()} {businessName || "Vane Strategic Partners"} · Private circulation
            </footer>
          </div>
        ) : isTemplate8 ? (
          /* TEMPLATE 8: Collage Zine Edition */
          (() => {
            const accentColor = brandColor || "#1554db";
            const getContrastColor = (hexColor: string) => {
              if (!hexColor || !hexColor.startsWith("#")) return "#ffffff";
              const hex = hexColor.replace("#", "");
              if (hex.length !== 6) return "#ffffff";
              const r = parseInt(hex.substring(0, 2), 16) || 0;
              const g = parseInt(hex.substring(2, 4), 16) || 0;
              const b = parseInt(hex.substring(4, 6), 16) || 0;
              const yiq = (r * 299 + g * 587 + b * 114) / 1000;
              return yiq >= 135 ? "#141414" : "#ffffff";
            };
            const contrastOnAccent = getContrastColor(accentColor);

            const defaultBullets = [
              "Find the strange bit — Your most specific instinct is usually the most valuable one.",
              "Build a repeatable world — Make every idea feel like it came from the same vivid universe.",
              "Ship before permission — A practical weekly ritual for creating momentum.",
            ];

            const currentBullets: string[] =
              Array.isArray(page.bullets) && page.bullets.length > 0 ? page.bullets : defaultBullets;

            const parseBullet = (item: string, defaultIdx: number) => {
              if (!item) return { num: (defaultIdx + 1).toString().padStart(2, "0"), title: "", desc: "" };
              if (item.includes(":::")) {
                const parts = item.split(":::");
                if (parts.length >= 3) {
                  return {
                    num: parts[0],
                    title: parts[1].trim(),
                    desc: parts.slice(2).join(":::").trim(),
                  };
                }
                return {
                  num: (defaultIdx + 1).toString().padStart(2, "0"),
                  title: parts[0].trim(),
                  desc: parts.slice(1).join(":::").trim(),
                };
              }
              if (item.includes(" — ")) {
                const [title, ...rest] = item.split(" — ");
                return {
                  num: (defaultIdx + 1).toString().padStart(2, "0"),
                  title: title.trim(),
                  desc: rest.join(" — ").trim(),
                };
              }
              if (item.includes(" - ")) {
                const [title, ...rest] = item.split(" - ");
                return {
                  num: (defaultIdx + 1).toString().padStart(2, "0"),
                  title: title.trim(),
                  desc: rest.join(" - ").trim(),
                };
              }
              if (item.includes("\n")) {
                const [title, ...rest] = item.split("\n");
                return {
                  num: (defaultIdx + 1).toString().padStart(2, "0"),
                  title: title.trim(),
                  desc: rest.join("\n").trim(),
                };
              }
              return {
                num: (defaultIdx + 1).toString().padStart(2, "0"),
                title: item,
                desc: "",
              };
            };

            return (
              <div
                className="w-full flex-1 flex flex-col justify-center py-4 sm:py-8 px-2 sm:px-4 md:px-8 lg:px-10 xl:px-12"
                style={{
                  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Shrikhand&display=swap');
                      .font-shrikhand {
                        font-family: 'Shrikhand', cursive, serif;
                      }
                      .font-dm-sans {
                        font-family: 'DM Sans', sans-serif;
                      }
                    `,
                  }}
                />

                {/* Sheet Container - Expanded to 92-96% Desktop Width */}
                <div
                  className={`w-full max-w-[96%] sm:max-w-[94%] xl:max-w-[92%] 2xl:max-w-[1700px] mx-auto transition-all duration-200 border-2 overflow-hidden ${
                    themeMode === "dark"
                      ? "bg-[#15161d] border-[#2e303d] shadow-[10px_10px_0px_#000000] text-[#f4f4f5]"
                      : "bg-[#f8f4e9] border-[#141414] shadow-[10px_10px_0px_#141414] text-[#141414]"
                  }`}
                >
                  {/* Masthead Header */}
                  <header
                    className={`flex flex-wrap justify-between items-center px-5 py-4 sm:px-8 sm:py-5 border-b-2 transition-colors ${
                      themeMode === "dark" ? "border-[#2e303d] bg-[#121319]" : "border-[#141414] bg-[#f8f4e9]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {logo && (
                        <img
                          src={logo}
                          alt="Logo"
                          className={`h-9 w-9 object-cover border-2 shrink-0 ${
                            themeMode === "dark" ? "border-[#2e303d]" : "border-[#141414]"
                          }`}
                        />
                      )}
                      <div
                        className={`font-shrikhand text-2xl sm:text-3xl tracking-wide ${
                          themeMode === "dark" ? "text-white" : "text-[#141414]"
                        }`}
                      >
                        {(page as any).mastheadLeft || businessName || "Odd Hours"}
                      </div>
                    </div>

                    <div
                      className={`font-dm-sans text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase ${
                        themeMode === "dark" ? "text-zinc-400" : "text-[#141414]"
                      }`}
                    >
                      {(page as any).mastheadRight || "CREATIVE FIELD NOTES · #07"}
                    </div>
                  </header>

                  {/* Hero Section */}
                  <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] min-h-[520px] xl:min-h-[580px]">
                    {/* Left Poster Column */}
                    <div
                      className={`relative min-h-[380px] sm:min-h-[460px] lg:min-h-[540px] xl:min-h-[580px] border-b-2 lg:border-b-0 lg:border-r-2 overflow-hidden flex items-center justify-center ${
                        themeMode === "dark" ? "border-[#2e303d] bg-[#1a1b24]" : "border-[#141414] bg-[#f5ed21]"
                      }`}
                    >
                      {activeImageUrl && activeImageUrl.trim() !== "" ? (
                        <img
                          src={activeImageUrl}
                          alt={activeHeadline || "Collage Cover"}
                          className="w-full h-full object-cover min-h-[380px]"
                        />
                      ) : (
                        /* Halftone Fallback Art */
                        <div className="w-full h-full relative flex flex-col justify-between p-8 min-h-[380px] select-none">
                          <div
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                              backgroundImage: themeMode === "dark"
                                ? "radial-gradient(#ffffff 2px, transparent 2px)"
                                : "radial-gradient(#141414 2px, transparent 2px)",
                              backgroundSize: "20px 20px",
                            }}
                          />

                          <div className="relative z-10 flex justify-between items-start">
                            <span
                              className={`font-dm-sans text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 border-2 tracking-wider ${
                                themeMode === "dark"
                                  ? "bg-black text-[#f5ed21] border-[#f5ed21]"
                                  : "bg-[#141414] text-white border-[#141414]"
                              }`}
                            >
                              VOL. {new Date().getFullYear()}
                            </span>
                            <span
                              className={`font-shrikhand text-sm uppercase px-2 py-0.5 ${
                                themeMode === "dark" ? "text-zinc-400" : "text-[#141414]"
                              }`}
                            >
                              #07
                            </span>
                          </div>

                          <div className="relative z-10 my-auto text-center py-6">
                            <div
                              className={`inline-block font-shrikhand text-4xl sm:text-6xl lg:text-7xl leading-[0.9] tracking-tight uppercase p-5 sm:p-7 border-2 ${
                                themeMode === "dark"
                                  ? "bg-[#121319]/90 text-white border-[#2e303d] shadow-[4px_4px_0px_#000000]"
                                  : "bg-white text-[#1554db] border-[#141414] shadow-[4px_4px_0px_#141414]"
                              }`}
                            >
                              <span style={{ color: accentColor }}>
                                CREATIVE
                              </span>
                              <br />
                              <span className="text-[#ff315b]">NOTES</span>
                            </div>
                          </div>

                          <div className="relative z-10 text-center">
                            <span
                              className={`inline-block font-dm-sans text-[11px] font-bold uppercase tracking-widest px-3 py-1 border-2 ${
                                themeMode === "dark"
                                  ? "bg-[#252836] text-white border-[#2e303d]"
                                  : "bg-[#f8f4e9] text-[#141414] border-[#141414]"
                              }`}
                            >
                              ★ ARCHIVE EDITION ★
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Circular Sticker Badge */}
                      <div
                        className={`absolute top-6 left-6 rounded-full w-[100px] h-[100px] sm:w-[115px] sm:h-[115px] flex flex-col items-center justify-center text-center font-dm-sans font-black text-[11px] sm:text-[12px] leading-tight select-none border-2 transition-transform duration-300 hover:scale-105 ${
                          themeMode === "dark"
                            ? "bg-[#ff3366] text-white border-[#2e303d] shadow-[4px_4px_0px_#000000]"
                            : "bg-[#ff4d73] text-white border-[#141414] shadow-[4px_4px_0px_#141414]"
                        }`}
                        style={{
                          transform: "rotate(-10deg)",
                        }}
                      >
                        <span>FREE</span>
                        <span>48-PAGE</span>
                        <span>EDITION!</span>
                      </div>
                    </div>

                    {/* Right Copy Column */}
                    <div
                      className={`p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between transition-colors ${
                        themeMode === "dark" ? "bg-[#15161d]" : "bg-[#f8f4e9]"
                      }`}
                    >
                      <div>
                        {/* Taped Category Badge */}
                        <div className="mb-6 inline-block">
                          <span
                            className="font-dm-sans inline-block px-3 py-1.5 text-[11px] font-extrabold tracking-wide uppercase border-2 border-[#141414] shadow-[2px_2px_0px_#141414] text-[#141414] bg-[#f5ed21]"
                            style={{
                              transform: "rotate(2deg)",
                            }}
                          >
                            {(page as any).bulletsTitle || "A PLAYBOOK FOR PEOPLE WITH IDEAS"}
                          </span>
                        </div>

                        {/* Headline */}
                        <h1
                          className={`font-shrikhand text-4xl sm:text-5xl md:text-6xl lg:text-[62px] xl:text-[72px] leading-[0.92] tracking-tight mb-6`}
                          style={{
                            overflowWrap: "anywhere",
                            color: accentColor,
                          }}
                        >
                          {activeHeadline ? (
                            activeHeadline.includes("Impossible") ? (
                              <>
                                {activeHeadline.split("Impossible")[0]}
                                <span className="text-[#ff315b]">Impossible</span>
                                {activeHeadline.split("Impossible")[1]}
                              </>
                            ) : (
                              activeHeadline
                            )
                          ) : (
                            <>
                              Make Your Work <span className="text-[#ff315b]">Impossible</span> to Ignore.
                            </>
                          )}
                        </h1>

                        {/* Subheadline & Pitch Paragraph */}
                        <p
                          className={`font-dm-sans text-base sm:text-lg leading-relaxed max-w-[560px] font-medium ${
                            themeMode === "dark" ? "text-zinc-300" : "text-[#141414]"
                          }`}
                        >
                          {page.subheadline ||
                            page.pitch ||
                            "Twenty-one unconventional prompts, narrative tricks, and visual systems for turning 'pretty good' into unmistakably yours."}
                        </p>
                      </div>

                      {/* Micro Badge */}
                      <div
                        className={`pt-6 mt-6 border-t-2 text-[10px] font-dm-sans font-bold uppercase tracking-widest flex items-center justify-between ${
                          themeMode === "dark" ? "border-[#2e303d] text-zinc-500" : "border-[#141414]/15 text-[#141414]/60"
                        }`}
                      >
                        <span>ZINE DISPATCH · UNRESTRICTED ACCESS</span>
                        <span>EST. {new Date().getFullYear()}</span>
                      </div>
                    </div>
                  </section>

                  {/* Bottom Section: 3 Bits + Signup Box */}
                  <section
                    className={`grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] border-t-2 transition-colors ${
                      themeMode === "dark" ? "border-[#2e303d]" : "border-[#141414]"
                    }`}
                  >
                    {/* Left Column: 3 Bits */}
                    <div
                      className={`border-b-2 lg:border-b-0 lg:border-r-2 grid grid-cols-1 ${
                        currentBullets.length === 1
                          ? "md:grid-cols-1"
                          : currentBullets.length === 2
                          ? "md:grid-cols-2"
                          : "md:grid-cols-3"
                      } transition-colors ${
                        themeMode === "dark" ? "border-[#2e303d] bg-[#121319]" : "border-[#141414] bg-[#f8f4e9]"
                      }`}
                    >
                      {currentBullets.map((bullet, idx) => {
                        const parsed = parseBullet(bullet, idx);
                        const isNumHidden = parsed.num === "__none__";
                        const displayNum = isNumHidden ? "" : (parsed.num || (idx + 1).toString().padStart(2, "0"));

                        return (
                          <article
                            key={idx}
                            className={`p-6 sm:p-7 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 last:border-r-0 transition-colors ${
                              themeMode === "dark" ? "border-[#2e303d]" : "border-[#141414]"
                            }`}
                          >
                            <div>
                              {!isNumHidden && displayNum && (
                                <b className="font-shrikhand text-2xl sm:text-3xl text-[#ff315b] block mb-2">
                                  {displayNum}
                                </b>
                              )}

                              <h3
                                className={`font-dm-sans text-sm sm:text-base font-bold mb-1.5 ${
                                  themeMode === "dark" ? "text-white" : "text-[#141414]"
                                }`}
                              >
                                {parsed.title || `Framework ${(idx + 1).toString().padStart(2, "0")}`}
                              </h3>

                              <p
                                className={`font-dm-sans text-xs leading-relaxed ${
                                  themeMode === "dark" ? "text-zinc-400" : "text-[#141414]/80"
                                }`}
                              >
                                {parsed.desc || "A tactical framework designed to deliver instant clarity and execution momentum."}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {/* Right Column: High-Impact Signup Box */}
                    <aside
                      className={`p-6 sm:p-8 xl:p-10 flex flex-col justify-between transition-colors text-white`}
                      style={{
                        backgroundColor: accentColor,
                        color: "#ffffff",
                      }}
                    >
                      <div>
                        <h2 className="font-shrikhand text-2xl sm:text-3xl xl:text-4xl text-white mb-1.5" style={{ color: "#ffffff" }}>
                          {page.formTitle || "Want the zine?"}
                        </h2>

                        <p className="font-dm-sans text-xs sm:text-sm text-white/90 mb-5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                          {page.formSubtitle || "We'll send it now. Occasional notes later."}
                        </p>

                        <MagnetSignupForm
                          cta={page.cta}
                          layout="collage-zine"
                          formTitle={page.formTitle || "Want the zine?"}
                          formSubtitle={page.formSubtitle}
                          formButtonText={page.formButtonText || "YES, SEND IT! ↗"}
                          deliverable={page.deliverable}
                          accent={page.accent}
                          pageId={page.id}
                          pageName={page.name}
                          pageSlug={page.slug}
                          pageOwnerEmail={(page as any).userEmail}
                          brandColor={accentColor}
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

                      {/* Anti-spam footer */}
                      <div className="pt-4 mt-4 border-t border-white/20 text-[9px] font-dm-sans font-bold uppercase tracking-wider text-white/80 flex justify-between items-center" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                        <span>🔒 NO SPAM PROMISE</span>
                        <span>INSTANT DELIVERY</span>
                      </div>
                    </aside>
                  </section>
                </div>
              </div>
            );
          })()
        ) : isTemplate7 ? (
          /* TEMPLATE 7: Brutalist Ledger Edition */
          (() => {
            const accentColor = brandColor || "#f4ff3c";
            const getContrastColor = (hexColor: string) => {
              if (!hexColor || !hexColor.startsWith("#")) return "#000000";
              const hex = hexColor.replace("#", "");
              if (hex.length !== 6) return "#000000";
              const r = parseInt(hex.substring(0, 2), 16) || 0;
              const g = parseInt(hex.substring(2, 4), 16) || 0;
              const b = parseInt(hex.substring(4, 6), 16) || 0;
              const yiq = (r * 299 + g * 587 + b * 114) / 1000;
              return yiq >= 135 ? "#000000" : "#ffffff";
            };
            const isVeryDark = (hexColor: string) => {
              if (!hexColor || !hexColor.startsWith("#")) return false;
              const hex = hexColor.replace("#", "");
              if (hex.length !== 6) return false;
              const r = parseInt(hex.substring(0, 2), 16) || 0;
              const g = parseInt(hex.substring(2, 4), 16) || 0;
              const b = parseInt(hex.substring(4, 6), 16) || 0;
              const yiq = (r * 299 + g * 587 + b * 114) / 1000;
              return yiq < 35;
            };

            const contrastOnAccent = getContrastColor(accentColor);
            const darkAccent = isVeryDark(accentColor) ? "#ffffff" : accentColor;
            const contrastOnDarkAccent = getContrastColor(darkAccent);

            return (
              <div
                className={`w-full flex-1 flex flex-col justify-between transition-colors duration-200 border-4 ${
                  themeMode === "dark"
                    ? "bg-[#0d0d0f] border-[#2a2a2e]"
                    : "bg-[#f4ff3c] text-[#101010] border-[#101010]"
                }`}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                  color: themeMode === "dark" ? "#ffffff" : "#101010",
                }}
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      .font-archivo {
                        font-family: 'Archivo Black', -apple-system, BlinkMacSystemFont, sans-serif;
                      }
                      .font-ibm {
                        font-family: 'IBM Plex Mono', monospace;
                      }
                      @keyframes brutalistMarquee {
                        0% { transform: translateX(0%); }
                        100% { transform: translateX(-50%); }
                      }
                      .animate-brutalist-ticker {
                        display: inline-flex;
                        white-space: nowrap;
                        animation: brutalistMarquee 25s linear infinite;
                      }
                      .animate-brutalist-ticker:hover {
                        animation-play-state: paused;
                      }
                    `,
                  }}
                />

                <div className="w-full flex-1 flex flex-col">
                  {/* Masthead Header */}
                  <header
                    className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 px-5 py-4 sm:px-7 sm:py-5 border-b-4 items-center transition-colors ${
                      themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-[#f4ff3c]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {logo && (
                        <img
                          src={logo}
                          alt="Logo"
                          className="h-8 w-8 object-cover border-2 border-current shrink-0"
                        />
                      )}
                      <div
                        className={`font-archivo text-xl sm:text-2xl tracking-tight uppercase ${
                          themeMode === "dark" ? "text-white" : "text-[#101010]"
                        }`}
                      >
                        {(page as any).mastheadLeft || businessName || "OUTPUT/INDEX"}
                      </div>
                    </div>

                    <div
                      className={`font-ibm text-xs sm:text-[11px] font-semibold tracking-wider uppercase sm:text-right ${
                        themeMode === "dark" ? "text-[#a1a1aa]" : "text-[#101010]"
                      }`}
                    >
                      {(page as any).mastheadRight || "FIELD MANUAL 009 · FREE PDF · 48 PAGES"}
                    </div>
                  </header>

                  {/* Hero Section: Copy & Image */}
                  <section
                    className={`grid grid-cols-1 lg:grid-cols-[52%_48%] border-b-4 transition-colors ${
                      themeMode === "dark" ? "border-[#2a2a2e]" : "border-[#101010]"
                    }`}
                  >
                    {/* Left Column: Copy */}
                    <div
                      className={`p-6 sm:p-10 lg:p-11 border-b-4 lg:border-b-0 lg:border-r-4 flex flex-col justify-between transition-colors ${
                        themeMode === "dark" ? "border-[#2a2a2e] bg-[#0d0d0f]" : "border-[#101010] bg-[#f4ff3c]"
                      }`}
                    >
                      <div>
                        {/* Eyebrow badge */}
                        <div className="mb-6">
                          <span
                            className="font-ibm inline-block px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-2"
                            style={
                              themeMode === "dark"
                                ? { backgroundColor: darkAccent, color: contrastOnDarkAccent, borderColor: darkAccent }
                                : { backgroundColor: "#101010", color: "#ffffff", borderColor: "#101010" }
                            }
                          >
                            {page.bulletsTitle || "SYSTEMS FOR CREATIVE OPERATORS"}
                          </span>
                        </div>

                        {/* Headline */}
                        <h1
                          className={`font-archivo text-4xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[88px] leading-[0.88] tracking-tight uppercase mb-6 ${
                            themeMode === "dark" ? "text-white" : "text-[#101010]"
                          }`}
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {activeHeadline || "Make Better Work. Faster."}
                        </h1>

                        {/* Paragraph / Pitch */}
                        <p
                          className={`font-ibm text-sm sm:text-base leading-relaxed max-w-[570px] ${
                            themeMode === "dark" ? "text-zinc-300" : "text-[#101010]"
                          }`}
                        >
                          {page.subheadline ||
                            page.pitch ||
                            "Thirty-seven operating principles for teams that refuse to choose between quality and momentum."}
                        </p>
                      </div>

                      <div
                        className={`pt-8 mt-8 border-t-2 text-[10px] font-ibm font-semibold uppercase tracking-widest ${
                          themeMode === "dark" ? "border-zinc-800 text-zinc-400" : "border-black/20 text-black/60"
                        }`}
                      >
                        LEDGER REF: LM-{new Date().getFullYear()}-007 · VERIFIED OUTPUT
                      </div>
                    </div>

                    {/* Right Column: Hero Cover Image & Stamp */}
                    <div
                      className={`relative min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] flex items-center justify-center overflow-hidden ${
                        themeMode === "dark" ? "bg-[#151518]" : "bg-[#e5ef35]"
                      }`}
                    >
                      {activeImageUrl && activeImageUrl.trim() !== "" ? (
                        <img
                          src={activeImageUrl}
                          alt={page.name || "Cover Image"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full relative flex flex-col justify-between p-8 min-h-[380px] sm:min-h-[480px]">
                          <div
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                              backgroundImage:
                                themeMode === "dark"
                                  ? `linear-gradient(${darkAccent} 1.5px, transparent 1.5px), linear-gradient(90deg, ${darkAccent} 1.5px, transparent 1.5px)`
                                  : "linear-gradient(#101010 1.5px, transparent 1.5px), linear-gradient(90deg, #101010 1.5px, transparent 1.5px)",
                              backgroundSize: "32px 32px",
                            }}
                          />
                          <div className="relative z-10 flex justify-between items-start">
                            <span
                              className="font-ibm text-xs font-bold border-2 px-2.5 py-1 uppercase"
                              style={
                                themeMode === "dark"
                                  ? { backgroundColor: "black", color: darkAccent, borderColor: darkAccent }
                                  : { backgroundColor: "black", color: "white", borderColor: "black" }
                              }
                            >
                              FIG. 07 / SCHEMATIC
                            </span>
                            <span
                              className={`font-archivo text-xs px-2 py-1 uppercase ${
                                themeMode === "dark" ? "text-zinc-400" : "text-black"
                              }`}
                            >
                              INDEX // {new Date().getFullYear()}
                            </span>
                          </div>

                          <div className="relative z-10 my-auto text-center py-8">
                            <div
                              className="inline-block font-archivo text-5xl sm:text-7xl lg:text-8xl tracking-tighter uppercase p-4 border-4"
                              style={
                                themeMode === "dark"
                                  ? {
                                      borderColor: darkAccent,
                                      color: darkAccent,
                                      backgroundColor: "rgba(0,0,0,0.7)",
                                      boxShadow: `6px 6px 0px ${darkAccent}`,
                                    }
                                  : {
                                      borderColor: "#101010",
                                      color: "#101010",
                                      backgroundColor: "rgba(255,255,255,0.7)",
                                      boxShadow: "6px 6px 0px #101010",
                                    }
                              }
                            >
                              MANUAL
                            </div>
                            <p
                              className={`font-ibm text-xs sm:text-sm font-bold uppercase tracking-widest mt-4 ${
                                themeMode === "dark" ? "text-zinc-300" : "text-black"
                              }`}
                            >
                              {(page as any).mastheadLeft || businessName || "CORE SYSTEMS INDEX"}
                            </p>
                          </div>

                          <div className="relative z-10 flex justify-between items-end text-[10px] font-ibm font-bold uppercase">
                            <span>SPEC: DIRECT ARCHIVE</span>
                            <span>STATUS: READY</span>
                          </div>
                        </div>
                      )}

                      {/* Stamp Badge */}
                      <div
                        className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-20 font-ibm font-bold text-xs sm:text-sm tracking-wider uppercase border-3 px-3.5 py-2 sm:px-4 sm:py-2.5"
                        style={
                          themeMode === "dark"
                            ? {
                                backgroundColor: "#18181b",
                                color: darkAccent,
                                borderColor: darkAccent,
                                boxShadow: `4px 4px 0px ${darkAccent}`,
                                transform: "rotate(-3deg)",
                              }
                            : {
                                backgroundColor: accentColor,
                                color: contrastOnAccent,
                                borderColor: "#101010",
                                boxShadow: "4px 4px 0px rgba(0,0,0,1)",
                                transform: "rotate(-3deg)",
                              }
                        }
                      >
                        12,000+ READERS
                      </div>
                    </div>
                  </section>

                  {/* Lower Section: Index & Form */}
                  <section
                    className={`grid grid-cols-1 lg:grid-cols-2 transition-colors ${
                      themeMode === "dark" ? "bg-[#0d0d0f]" : "bg-[#f4ff3c]"
                    }`}
                  >
                    {/* Left Column: Chapters / Index */}
                    <div
                      className={`border-b-4 lg:border-b-0 lg:border-r-4 transition-colors flex flex-col justify-between ${
                        themeMode === "dark" ? "border-[#2a2a2e]" : "border-[#101010]"
                      }`}
                    >
                      <div>
                        <div
                          className="p-5 sm:p-6 border-b-2 flex items-center justify-between font-ibm text-xs font-bold tracking-wider uppercase"
                          style={
                            themeMode === "dark"
                              ? { borderColor: "#2a2a2e", backgroundColor: "#121215", color: darkAccent }
                              : { borderColor: "#101010", backgroundColor: "#eef731", color: "#101010" }
                          }
                        >
                          <span>FIELD MANUAL TABLE OF CONTENTS</span>
                          <span>
                            {(Array.isArray(page.bullets) ? page.bullets.length : 3)} MODULES
                          </span>
                        </div>

                        {(() => {
                          const displayBullets = Array.isArray(page.bullets)
                            ? page.bullets
                            : [
                                "THE FRICTION AUDIT — Find where good ideas go to die.",
                                "DECISION VELOCITY — Stop waiting for perfect information.",
                                "THE WEEKLY RESET — A 20-minute operating ritual.",
                              ];

                          if (displayBullets.length === 0) {
                            return null;
                          }

                          return (
                            <div className="divide-y-2" style={{ borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010" }}>
                              {displayBullets.map((item: string, idx: number) => {
                                const numStr = (idx + 1).toString().padStart(2, "0");
                                let title = item;
                                let desc = "";
                                if (item.includes(" — ")) {
                                  const parts = item.split(" — ");
                                  title = parts[0];
                                  desc = parts.slice(1).join(" — ");
                                } else if (item.includes(" - ")) {
                                  const parts = item.split(" - ");
                                  title = parts[0];
                                  desc = parts.slice(1).join(" - ");
                                } else if (item.includes(":::")) {
                                  const parts = item.split(":::");
                                  title = parts[0];
                                  desc = parts.slice(1).join(":::");
                                }

                                return (
                                  <div
                                    key={idx}
                                    className={`grid grid-cols-[70px_1fr] sm:grid-cols-[90px_1fr] p-5 sm:p-6 items-start gap-4 border-b-2 transition-colors ${
                                      themeMode === "dark"
                                        ? "border-[#2a2a2e] hover:bg-[#15151a]"
                                        : "border-[#101010] hover:bg-[#ebf533]"
                                    }`}
                                  >
                                    <strong
                                      className="font-archivo text-2xl sm:text-3xl leading-none"
                                      style={{ color: themeMode === "dark" ? darkAccent : "#101010" }}
                                    >
                                      {numStr}
                                    </strong>
                                    <div className="min-w-0 space-y-1">
                                      <div
                                        className={`font-archivo text-base sm:text-lg uppercase tracking-tight ${
                                          themeMode === "dark" ? "text-white" : "text-[#101010]"
                                        }`}
                                      >
                                        {title || `CHAPTER ${numStr}`}
                                      </div>
                                      {desc && (
                                        <div
                                          className={`font-ibm text-xs sm:text-[13px] leading-relaxed ${
                                            themeMode === "dark" ? "text-zinc-400" : "text-black/80"
                                          }`}
                                        >
                                          {desc}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right Column: Brutalist Form */}
                    <div
                      className={`p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-colors ${
                        themeMode === "dark"
                          ? "bg-[#18181b] border-t-4 lg:border-t-0 border-[#2a2a2e]"
                          : "text-[#101010]"
                      }`}
                      style={
                        themeMode !== "dark"
                          ? { backgroundColor: accentColor !== "#f4ff3c" ? accentColor : "#ff5a36", color: contrastOnAccent }
                          : undefined
                      }
                    >
                      <div>
                        <h2
                          className="font-archivo text-3xl sm:text-4xl lg:text-[44px] leading-[0.95] uppercase tracking-tight mb-3"
                          style={{ color: themeMode === "dark" ? darkAccent : contrastOnAccent }}
                        >
                          {page.formTitle || "Take the manual."}
                        </h2>

                        {page.formSubtitle && (
                          <p
                            className={`font-ibm text-xs sm:text-sm leading-relaxed mb-6 ${
                              themeMode === "dark" ? "text-zinc-300" : (contrastOnAccent === "#ffffff" ? "text-white/90" : "text-[#101010]/90")
                            }`}
                          >
                            {page.formSubtitle}
                          </p>
                        )}

                        <MagnetSignupForm
                          cta={page.cta}
                          layout="brutalist"
                          formTitle={page.formTitle || "Take the manual."}
                          formSubtitle={page.formSubtitle}
                          formButtonText={page.formButtonText || "Send me the PDF ↗"}
                          deliverable={page.deliverable}
                          accent={page.accent}
                          pageId={page.id}
                          pageName={page.name}
                          pageSlug={page.slug}
                          pageOwnerEmail={(page as any).userEmail}
                          brandColor={accentColor}
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

                      <div
                        className={`pt-6 mt-6 border-t-2 text-[9px] sm:text-[10px] font-ibm font-bold uppercase tracking-wider flex justify-between items-center ${
                          themeMode === "dark" ? "border-zinc-800 text-zinc-400" : (contrastOnAccent === "#ffffff" ? "border-white/20 text-white/80" : "border-black/20 text-black/70")
                        }`}
                      >
                        <span>🔒 ZERO SPAM PROMISE</span>
                        <span>INSTANT DISPATCH</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Bottom Ticker Marquee */}
                <footer
                  className={`w-full py-3 px-4 border-t-4 overflow-hidden font-ibm text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${
                    themeMode === "dark" ? "border-[#2a2a2e] bg-[#000000]" : "border-[#101010] bg-[#101010]"
                  }`}
                  style={{ color: themeMode === "dark" ? darkAccent : "#ffffff" }}
                >
                  <div className="overflow-hidden whitespace-nowrap">
                    <div className="animate-brutalist-ticker">
                      <span className="mr-4">
                        NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
                        NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
                      </span>
                      <span className="mr-4">
                        NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
                        NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
                      </span>
                    </div>
                  </div>
                </footer>
              </div>
            );
          })()
        ) : (
          /* TEMPLATE 1: Template 10 — Premium Night (Editorial Dispatch) */
          (() => {
            const currentYear = new Date().getFullYear();
            const getInitials = (name: string) => {
              if (!name) return "ED";
              const parts = name.trim().split(/\s+/);
              return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
            };
            const initials = getInitials(businessName);

            const defaultBullets = [
              "The Signal-to-Noise Protocol — Audit attention and eliminate low-leverage activities through the Four Filters.",
              "Recursive Hiring Loops — Build a talent engine that identifies multipliers before they reach the market.",
              "Velocity Without Chaos — Replace recurring meetings with lightweight synchronization rituals.",
            ];

            const isBulletsHidden = Array.isArray(page.bullets) && page.bullets.length === 1 && page.bullets[0] === "__hidden__";
            const displayBullets = isBulletsHidden
              ? []
              : Array.isArray(page.bullets) && page.bullets.length > 0
              ? page.bullets
              : defaultBullets;

            const parseBullet = (item: string) => {
              if (!item) return { title: "", desc: "" };
              if (item.includes(":::")) {
                const parts = item.split(":::");
                if (parts.length >= 3) {
                  return { title: parts[1]?.trim() || "", desc: parts.slice(2).join(":::").trim() };
                }
                return { title: parts[0]?.trim() || "", desc: parts.slice(1).join(":::").trim() };
              }
              if (item.includes(" — ")) {
                const [title, ...rest] = item.split(" — ");
                return { title: title.trim(), desc: rest.join(" — ").trim() };
              }
              if (item.includes(" - ")) {
                const [title, ...rest] = item.split(" - ");
                return { title: title.trim(), desc: rest.join(" - ").trim() };
              }
              if (item.includes(": ")) {
                const [title, ...rest] = item.split(": ");
                return { title: title.trim(), desc: rest.join(": ").trim() };
              }
              return { title: item, desc: "" };
            };

            const defaultQuote = "“Speed is often a byproduct of clarity. Build the infrastructure that makes high performance inevitable.”";
            const defaultAuthor = `${accountDoc?.name || authorName || "Marcus Vane"} · Founder, Arca`;

            const parsePitch = (raw: string | undefined) => {
              if (!raw || !raw.trim()) {
                return { quote: defaultQuote, author: defaultAuthor };
              }
              if (raw.includes(":::")) {
                const [q, ...a] = raw.split(":::");
                return { quote: q.trim(), author: a.join(":::").trim() || defaultAuthor };
              }
              if (raw.includes("\n—") || raw.includes("\n-") || raw.includes("\n–")) {
                const parts = raw.split(/\n[—–-]\s*/);
                return { quote: parts[0].trim(), author: parts.slice(1).join(" ").trim() || defaultAuthor };
              }
              if (raw.includes(" — ")) {
                const parts = raw.split(" — ");
                return { quote: parts[0].trim(), author: parts.slice(1).join(" — ").trim() || defaultAuthor };
              }
              return { quote: raw.trim(), author: defaultAuthor };
            };

            const { quote: parsedQuote, author: parsedAuthor } = parsePitch(page.pitch);

            const renderHighlightedHeadline = (text: string) => {
              if (!text) {
                return (
                  <>
                    The Architecture of <em style={{ fontStyle: "normal", color: accentColor }}>High-Output</em> Engineering
                  </>
                );
              }
              const parts = text.split(/(\*[^*]+\*|_[^_]+_|<em>.*?<\/em>)/g);
              return (
                <>
                  {parts.map((part, i) => {
                    if ((part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
                        (part.startsWith("_") && part.endsWith("_") && part.length > 2)) {
                      return (
                        <em key={i} style={{ fontStyle: "normal", color: accentColor }}>
                          {part.slice(1, -1)}
                        </em>
                      );
                    }
                    if (part.startsWith("<em>") && part.endsWith("</em>")) {
                      return (
                        <em key={i} style={{ fontStyle: "normal", color: accentColor }}>
                          {part.replace(/<\/?em>/g, "")}
                        </em>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </>
              );
            };

            const defaultCoverImage = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80";
            const coverImage = activeImageUrl && activeImageUrl.trim() !== "" ? activeImageUrl : defaultCoverImage;

            return (
              <div
                className="w-full flex-1 flex flex-col justify-between py-10 sm:py-14 px-6 sm:px-10 lg:px-12 relative font-['Plus_Jakarta_Sans',sans-serif]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <div className="relative max-w-[1260px] w-full mx-auto">
                  {/* BRAND HEADER */}
                  <header className="flex items-center justify-center gap-3.5 mb-9 sm:mb-12">
                    <div
                      className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center font-extrabold text-[15px] tracking-[0.02em] text-white shrink-0 overflow-hidden shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, #7a1830)`,
                        boxShadow: `0 8px 26px ${accentColor}33`,
                      }}
                    >
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <b className="text-[15px] font-extrabold tracking-[0.22em] uppercase leading-none">
                      {businessName}
                    </b>
                  </header>

                  {/* TWO-COLUMN GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-10 sm:gap-14 lg:gap-20 items-start">
                    {/* LEFT COLUMN: Editorial Content */}
                    <section className="space-y-0 min-w-0">
                      {/* Headline */}
                      <h1
                        className={`text-3xl sm:text-4xl lg:text-[46px] leading-[1.08] font-extrabold tracking-[-0.02em] mb-6 sm:mb-7 break-words [overflow-wrap:anywhere] ${
                          isDark ? "text-white" : "text-[#111217]"
                        }`}
                      >
                        {renderHighlightedHeadline(activeHeadline)}
                      </h1>

                      {/* Subheadline */}
                      {(page.subheadline || !activeHeadline) && (
                        <p
                          className={`text-[16.5px] leading-[1.85] max-w-[620px] ${
                            isDark ? "text-[#a9acb8]" : "text-[#4b5563]"
                          }`}
                        >
                          {page.subheadline ||
                            "A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."}
                        </p>
                      )}

                      {/* Divider & Checklist items (only if bullets exist) */}
                      {displayBullets.length > 0 && (
                        <>
                          <div className="py-8 sm:py-10">
                            <div
                              className="h-[1px] w-full"
                              style={{ backgroundColor: isDark ? "#23242c" : "#e5e7eb" }}
                            />
                          </div>

                          {/* Kicker / Bullets Title */}
                          <div className="mb-6">
                            <p
                              className="text-[11px] font-bold tracking-[0.2em] uppercase"
                              style={{ color: accentColor }}
                            >
                              {page.bulletsTitle || "What you will create"}
                            </p>
                          </div>

                          {/* Checklist items */}
                          <div className="space-y-2">
                            {displayBullets.map((item, idx) => {
                              const parsed = parseBullet(item);
                              return (
                                <div
                                  key={idx}
                                  className="grid grid-cols-[26px_1fr] gap-4 sm:gap-5 py-3.5 sm:py-4 items-start"
                                >
                                  <span
                                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold text-white shrink-0 mt-0.5 shadow-xs"
                                    style={{ backgroundColor: accentColor }}
                                  >
                                    ✓
                                  </span>
                                  <div className="min-w-0">
                                    <h3
                                      className={`text-[15px] font-bold mb-1 leading-snug ${
                                        isDark ? "text-white" : "text-[#111217]"
                                      }`}
                                    >
                                      {parsed.title}
                                    </h3>
                                    {parsed.desc && (
                                      <p
                                        className={`text-[13px] leading-[1.65] ${
                                          isDark ? "text-[#9a9da9]" : "text-[#6b7280]"
                                        }`}
                                      >
                                        {parsed.desc}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {/* Quote / Pitch Block */}
                      {page.pitch !== "__hidden__" && page.pitch !== "__none__" && page.pitch !== "__HIDDEN__" && parsedQuote && (
                        <div
                          className="mt-8 sm:mt-10 pl-5 sm:pl-6 space-y-2"
                          style={{ borderLeft: `3px solid ${accentColor}` }}
                        >
                          <p
                            className={`italic text-[14px] leading-[1.7] ${
                              isDark ? "text-[#c9ccd6]" : "text-[#374151]"
                            }`}
                          >
                            {parsedQuote}
                          </p>
                          <small
                            className={`block text-[10px] font-bold tracking-[0.16em] uppercase mt-2 ${
                              isDark ? "text-[#8b8e99]" : "text-[#9ca3af]"
                            }`}
                          >
                            {parsedAuthor}
                          </small>
                        </div>
                      )}
                    </section>

                    {/* RIGHT COLUMN: Media Cover & Lead Capture Card */}
                    <aside className="space-y-7 sm:space-y-8">
                      {/* Cover Media */}
                      <div className="relative w-full aspect-[3/2] rounded-[22px] overflow-hidden shadow-[0_24px_60px_#00000066] border border-white/10 bg-zinc-900">
                        <img
                          src={coverImage}
                          alt="Report cover preview"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Sign-up Card */}
                      <div
                        className={`rounded-[22px] p-7 sm:p-8 lg:p-9 border transition-all ${
                          isDark
                            ? "bg-[#14151b] border-[#26272f] shadow-2xl"
                            : "bg-white border-[#e5e7eb] shadow-xl"
                        }`}
                      >
                        <h2
                          className={`text-[21px] font-extrabold mb-2 ${
                            isDark ? "text-white" : "text-[#111217]"
                          }`}
                        >
                          {page.formTitle || "Get the full report"}
                        </h2>

                        <p
                          className={`text-[12.5px] leading-[1.6] mb-5 ${
                            isDark ? "text-[#9a9da9]" : "text-[#6b7280]"
                          }`}
                        >
                          {page.formSubtitle ||
                            "The PDF and supplemental worksheets will arrive directly in your inbox."}
                        </p>

                        <MagnetSignupForm
                          cta={page.cta || "Get instant access"}
                          layout="premium-night"
                          formTitle={page.formTitle || "Get the full report"}
                          formSubtitle={page.formSubtitle}
                          formButtonText={page.formButtonText || page.cta || "Get instant access"}
                          deliverable={page.deliverable}
                          accent={page.accent}
                          pageId={page.id}
                          pageName={page.name}
                          pageSlug={page.slug}
                          pageOwnerEmail={(page as any).userEmail}
                          brandColor={accentColor}
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

                        {/* Fine Print Note */}
                        <p
                          className={`text-center text-[10.5px] mt-4 ${
                            isDark ? "text-[#7d8090]" : "text-[#9ca3af]"
                          }`}
                        >
                          No noise. Only occasional, high-signal notes.
                        </p>
                      </div>
                    </aside>
                  </div>

                  {/* FOOTER */}
                  <footer
                    className="mt-12 pt-5 flex justify-between gap-3 flex-wrap text-[10px] font-semibold tracking-[0.14em] uppercase"
                    style={{
                      borderTop: `1px solid ${isDark ? "#23242c" : "#e5e7eb"}`,
                      color: isDark ? "#7d8090" : "#9ca3af",
                    }}
                  >
                    <span>
                      © {currentYear} {businessName} · Private circulation
                    </span>
                    <span>By {accountDoc?.name || authorName || "Marcus Vane"}</span>
                  </footer>
                </div>
              </div>
            );
          })()
        )}

      </div>

      <footer className="w-full py-2.5 sm:py-3 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[10.5px] sm:text-[11px] text-[#5c5650] dark:text-[#a1a1aa] shrink-0 border-t border-zinc-200/40 dark:border-white/5">
        {(accountDoc?.privacyPolicy || accountDoc?.termsOfService) && (
          <div className="flex items-center gap-3 font-medium">
            {accountDoc?.privacyPolicy && (
              <a
                href={accountDoc.privacyPolicy}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-zinc-900 dark:hover:text-white transition"
              >
                Privacy Policy
              </a>
            )}
            {accountDoc?.privacyPolicy && accountDoc?.termsOfService && (
              <span className="opacity-40">·</span>
            )}
            {accountDoc?.termsOfService && (
              <a
                href={accountDoc.termsOfService}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-zinc-900 dark:hover:text-white transition"
              >
                Terms of Service
              </a>
            )}
          </div>
        )}
        {(accountDoc?.privacyPolicy || accountDoc?.termsOfService) && (
          <span className="hidden sm:inline opacity-30">|</span>
        )}
        <div className="flex items-center gap-1">
          <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-[#FE6F34] transition">
            Powered by LeadMagnets <MoveRightIcon className="h-2 w-2" />
          </a>
        </div>
      </footer>
    </main>
  );
}

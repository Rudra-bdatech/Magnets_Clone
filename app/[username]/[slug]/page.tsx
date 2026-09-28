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

  return (
    <main
      className="flex min-h-screen flex-col font-sans transition-colors duration-300 relative overflow-x-hidden"
      style={{
        colorScheme: themeMode === "dark" ? "dark" : "light",
        backgroundColor: themeMode === "dark" ? "#0E0E10" : "#FAFAFA",
        color: themeMode === "dark" ? "#ffffff" : "#18181b",
        backgroundImage: themeMode === "light"
          ? `radial-gradient(circle at 0% 0%, ${brandColor}10 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}08 0%, transparent 40%)`
          : `radial-gradient(circle at 0% 0%, ${brandColor}15 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${brandColor}0c 0%, transparent 40%)`
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
      {/* If template is not template3, show the standard top header */}
      {((page.template as string) !== "template3" && (!(!page.template && (accountDoc?.templateId as string) === "template3"))) && (
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
      <div className="flex-1 w-full flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 pb-3 sm:pb-4">
        {/* Dynamic Multi-Template View Renderer */}
        {((page.template as string) === "template2" || (!page.template && (accountDoc?.templateId as string) === "template2")) ? (
          /* TEMPLATE 2: Lead Capture Split Panel Layout (Full Screen / Full Width & Height) */
          <div className="w-full flex-1 flex flex-col justify-center py-1 lg:py-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center w-full">
              {/* Left Panel: Cover Image Backdrop + Gradient Scrim + Content Overlay */}
              <div className="lg:col-span-7 relative flex flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 rounded-3xl overflow-hidden min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] xl:min-h-[620px] bg-zinc-900 text-white shadow-2xl border border-black/10 dark:border-white/10 group min-w-0">
                {activeImageUrl && activeImageUrl.trim() !== "" && (
                  <img
                    src={activeImageUrl}
                    alt={page.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-[#0a0c16]/70 to-transparent pointer-events-none" />

                {/* Left Panel Content */}
                <div className="relative z-10 space-y-3 lg:space-y-4 xl:space-y-5 min-w-0">
                  <h1 className={`text-white leading-[1.08] drop-shadow-md break-words [overflow-wrap:anywhere] ${(activeHeadline?.length || 0) > 60 ? "text-2xl sm:text-3xl md:text-4xl lg:text-[2.2rem] xl:text-[2.6rem] font-bold" : (activeHeadline?.length || 0) > 35 ? "text-3xl sm:text-4xl md:text-5xl lg:text-[2.6rem] xl:text-[3.2rem] font-extrabold" : "text-3xl sm:text-4xl md:text-5xl lg:text-[2.8rem] xl:text-[3.4rem] 2xl:text-[3.8rem] font-black"}`}>
                    {activeHeadline || "Free Resource"}
                  </h1>
                  {page.subheadline && (
                    <p className="text-sm sm:text-base md:text-lg xl:text-xl text-white/90 font-medium leading-relaxed drop-shadow break-words [overflow-wrap:anywhere]">
                      {page.subheadline}
                    </p>
                  )}
                  {page.pitch && (
                    <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                      {page.pitch}
                    </p>
                  )}

                  {/* Bullets */}
                  {page.bullets && page.bullets.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-white/15 min-w-0">
                      {page.bulletsTitle && (
                        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/70">
                          {page.bulletsTitle}
                        </p>
                      )}
                      <ul className="space-y-2 sm:space-y-2.5">
                        {page.bullets.map((b: string, i: number) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm md:text-base text-zinc-100 min-w-0">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 mt-0.5">
                              ✓
                            </span>
                            <span className="break-words [overflow-wrap:anywhere]">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Form */}
              <div className="lg:col-span-5 w-full flex flex-col justify-center space-y-3 xl:space-y-4 lg:pt-1 xl:pt-2">
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
                  {page.imageUrl && page.imageUrl.trim() !== "" ? (
                    <img
                      src={page.imageUrl}
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
          /* TEMPLATE 4: Neon Orbit */
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* LEFT: Copy + Form */}
              <div className="col-span-12 lg:col-span-7 flex flex-col justify-center space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}` }} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {page.bulletsTitle || "Free Resource · Limited Time"}
                  </span>
                </div>

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

                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-2">
                    {page.bullets.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span className={`text-xs sm:text-sm font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
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
              <div className="col-span-12 lg:col-span-5 flex items-center justify-center relative py-4" style={{ minHeight: "300px" }}>
                {/* Ambient glow */}
                <div className="absolute rounded-full pointer-events-none" style={{ width: "300px", height: "300px", background: `radial-gradient(circle, ${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`, filter: "blur(25px)" }} />
                {/* Outer dashed ring */}
                <div className="absolute rounded-full border border-dashed pointer-events-none" style={{ width: "270px", height: "270px", borderColor: `${brandColor}25` }} />
                {/* Mid ring */}
                <div className="absolute rounded-full pointer-events-none" style={{ width: "230px", height: "230px", border: `1px solid ${brandColor}${Math.round((0.18 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 20px ${brandColor}22` }} />
                {/* Inner neon halo */}
                <div className="absolute rounded-full pointer-events-none" style={{ width: "190px", height: "190px", border: `2px solid ${brandColor}${Math.round((0.35 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 32px ${brandColor}${Math.round((0.2 + (highlightIntensity / 100) * 0.35) * 255).toString(16).padStart(2, '0')}` }} />
                {/* Circular image */}
                <div className="relative rounded-full overflow-hidden z-10" style={{ width: "165px", height: "165px", border: `3px solid ${brandColor}${Math.round((0.5 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, '0')}`, boxShadow: `0 0 45px -6px ${brandColor}${Math.round((0.45 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}` }}>
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
        ) : ((page.template as string) === "template5" || (!page.template && (accountDoc?.templateId as string) === "template5")) ? (
          /* TEMPLATE 5: Magazine Cover Hero (Full Viewport / Stacked Tray matching Template5.tsx) */
          <div className="w-full max-w-5xl mx-auto space-y-0">
            {/* Full-bleed cover image header banner */}
            <div className="relative w-full h-44 sm:h-56 md:h-64 rounded-3xl overflow-hidden flex items-end shadow-2xl border border-black/10 dark:border-white/10">
              {activeImageUrl && activeImageUrl.trim() !== "" ? (
                <img
                  src={activeImageUrl}
                  alt={page.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[#121215]" />
              )}
              {/* Cinematic scrim */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 100%)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to right, ${brandColor}33 0%, transparent 60%)` }} />

              {/* Overlaid headline & subheadline */}
              <div className="relative z-10 w-full p-5 sm:p-7 md:p-8 space-y-1.5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-xl">{activeHeadline}</h1>
                {page.subheadline && <p className="text-white/85 text-xs sm:text-sm md:text-base max-w-3xl leading-relaxed drop-shadow">{page.subheadline}</p>}
              </div>
            </div>

            {/* Floating glass form tray stacked underneath */}
            <div
              className="relative z-20 mx-3 sm:mx-6 md:mx-8 -mt-6 rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-2xl"
              style={{
                background: themeMode === "dark" ? "rgba(12,12,18,0.94)" : "rgba(255,255,255,0.96)",
                border: `1px solid ${themeMode === "dark" ? `${brandColor}35` : `${brandColor}25`}`,
                backdropFilter: "blur(20px)",
                boxShadow: `0 12px 48px -12px rgba(0,0,0,0.35)`
              }}
            >
              {/* Pitch Area */}
              {page.pitch && (
                <p className={`text-xs sm:text-sm leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                  {page.pitch}
                </p>
              )}

              {/* Bullets Section Header & List */}
              {((page.bullets && page.bullets.length > 0) || page.bulletsTitle) && (
                <div className="space-y-2">
                  <h3 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                    {page.bulletsTitle || "What they will learn"}
                  </h3>
                  {page.bullets && page.bullets.length > 0 && (
                    <div className="space-y-1.5">
                      {page.bullets.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                            <svg width="6" height="6" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </div>
                          <span className={`text-xs sm:text-sm ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stacked Form */}
              <div className="pt-2 border-t border-zinc-200/20 dark:border-zinc-800/40">
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
                  layout="split-panel"
                  afterSignupOption={page.afterSignupOption}
                  destinationUrl={page.destinationUrl}
                />
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template6" || (!page.template && (accountDoc?.templateId as string) === "template6")) ? (
          /* TEMPLATE 6: Full Bleed Showcase Layout */
          <div className="relative w-full min-h-[calc(100vh-120px)] flex flex-col justify-center py-4">
            {/* FULL BACKGROUND IMAGE / GRADIENT */}
            {activeImageUrl && activeImageUrl.trim() !== "" ? (
              <img src={activeImageUrl} alt={page.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 w-full h-full" style={{ background: `linear-gradient(145deg, ${brandColor}99 0%, #080912 100%)` }} />
            )}

            {/* DARK SCRIM OVERLAY */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/95 via-black/80 to-black/50" />

            {/* CONTENT */}
            <div className="relative z-10 w-full max-w-5xl mx-auto space-y-4 flex-1 flex flex-col justify-center py-4">
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-lg">{activeHeadline}</h1>
                {page.subheadline && (
                  <p className="text-sm sm:text-base font-medium text-zinc-200 drop-shadow-sm leading-relaxed line-clamp-2">{page.subheadline}</p>
                )}
                {page.pitch && (
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 max-w-2xl line-clamp-2">{page.pitch}</p>
                )}

                {/* Bullets Section */}
                {((page.bullets && page.bullets.length > 0) || page.bulletsTitle) && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor, boxShadow: `0 0 6px ${brandColor}` }} />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                        {page.bulletsTitle || "What they will learn"}
                      </span>
                    </div>
                    {page.bullets && page.bullets.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {page.bullets.map((item: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-md bg-white/10 border border-white/20">
                              <svg width="6" height="6" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-zinc-100">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SIGNUP FORM */}
              <div className="pt-1 w-full max-w-2xl">
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
                  layout="horizontal-glass"
                  afterSignupOption={page.afterSignupOption}
                  destinationUrl={page.destinationUrl}
                />
              </div>
            </div>
          </div>
        ) : ((page.template as string) === "template7" || (!page.template && (accountDoc?.templateId as string) === "template7")) ? (
          /* TEMPLATE 7: Spotlight Hero */
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* LEFT: Full-bleed image panel */}
              <div className="col-span-12 lg:col-span-6 relative overflow-hidden rounded-3xl shadow-2xl aspect-[4/3] max-h-[360px]">
                {activeImageUrl && activeImageUrl.trim() !== "" ? (
                  <img src={activeImageUrl} alt={page.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `linear-gradient(155deg, ${brandColor}99 0%, #060610 55%, #12001a 100%)` }}
                  >
                    <div className="flex flex-col items-center gap-2 text-white/50">
                      <SparklesIcon className="w-8 h-8" />
                      <span className="text-xs uppercase font-bold tracking-wider">Spotlight Cover</span>
                    </div>
                  </div>
                )}
                {/* Bottom scrim */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)" }} />
                {/* Headline overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-1">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-xl">{activeHeadline}</h2>
                  {page.subheadline && <p className="text-xs sm:text-sm text-white/80 line-clamp-1 drop-shadow">{page.subheadline}</p>}
                </div>
              </div>

              {/* RIGHT: Form and details */}
              <div className="col-span-12 lg:col-span-6 flex flex-col justify-center space-y-3.5">
                {/* Header */}
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: brandColor }}>
                    {page.bulletsTitle || "Exclusive · Free Access"}
                  </p>
                  {page.formTitle && (
                    <h3 className={`text-lg sm:text-xl font-black leading-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>{page.formTitle}</h3>
                  )}
                  {page.formSubtitle && (
                    <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{page.formSubtitle}</p>
                  )}
                </div>

                {/* Bullet list */}
                {page.bullets && page.bullets.length > 0 && (
                  <div className="space-y-1.5">
                    {page.bullets.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div
                          className="flex h-3.5 w-3.5 shrink-0 mt-0.5 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${brandColor}22`, border: `1px solid ${brandColor}55` }}
                        >
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                            <path d="M1 3l1.5 1.5L5 1.5" stroke={brandColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className={`text-xs sm:text-sm leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form */}
                <div className="pt-1">
                  <MagnetSignupForm
                    cta={page.cta}
                    formTitle=""
                    formSubtitle=""
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

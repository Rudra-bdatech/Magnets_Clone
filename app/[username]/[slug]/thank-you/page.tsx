import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel, ResourceModel } from "@/lib/models";
import ThankYouAnimatedContent from "@/components/thank-you-animated-content";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { signedDownloadPath, verifyMagnetAccess } from "@/lib/magnet-access";

export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: { username: string; slug: string };
  searchParams: { email?: string; name?: string; answer?: string; aiOutput?: string; res?: string; t?: string };
}) {
  const decodedUsername = decodeURIComponent(params.username || "");
  let accountDoc: any = null;
  let pageDoc: any = null;
  let downloadUrl: string | null = null;
  let resolvedDeliverableName = "Resource Access";
  let resolvedResources: Array<{ id: string; name: string; url: string; size?: string; type?: string }> = [];
  let landingRedirect: string | null = null;
  let accessGranted = false;

  try {
    await dbConnect();
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    accountDoc = escapedUsername
      ? await AccountModel.findOne({ username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } }).lean()
      : null;

    // Only this user's own landing pages — locked PDFs live at /pdf-viewer/<id>
    if (accountDoc && accountDoc.email) {
      pageDoc = await MagnetPageModel.findOne({
        userEmail: accountDoc.email.trim().toLowerCase(),
        template: { $ne: "locked-pdf" },
        $or: [{ id: params.slug }, { slug: params.slug }],
      }).sort({ _id: -1 }).lean();
    }

    const cleanUserEmail = pageDoc?.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;

    if (!pageDoc) throw new Error("ACCESS_DENIED"); // rendered as 404 below

    // Only visitors who submitted the signup form (they get an access token) or the owner
    // may open this page. Unpublished pages stay closed to everyone but the owner.
    const viewerEmail = await getAuthenticatedUserEmail();
    const isOwner = Boolean(viewerEmail && viewerEmail === cleanUserEmail);
    const isPublished = pageDoc.status !== "draft" && pageDoc.status !== "paused";
    if (!isOwner && !(isPublished && verifyMagnetAccess(pageDoc.id, searchParams.t))) {
      landingRedirect = `/${encodeURIComponent(decodedUsername)}/${encodeURIComponent(pageDoc.slug || pageDoc.id)}`;
      throw new Error("ACCESS_DENIED");
    }
    accessGranted = true;

    resolvedDeliverableName = pageDoc?.deliverable || pageDoc?.name || "Resource Access";

    // 1. Extract ALL resource IDs from emailBody, query param, or pageDoc in order
    const extractedResIds: string[] = [];
    if (pageDoc?.emailBody) {
      const matches = Array.from(pageDoc.emailBody.matchAll(/\/r\/([a-zA-Z0-9_-]+)/gi));
      for (const m of matches as any[]) {
        if (m[1] && !extractedResIds.includes(m[1])) {
          extractedResIds.push(m[1]);
        }
      }
    }
    if (searchParams.res && !extractedResIds.includes(searchParams.res)) {
      extractedResIds.push(searchParams.res);
    }
    if (pageDoc?.resourceId && !extractedResIds.includes(pageDoc.resourceId)) {
      extractedResIds.push(pageDoc.resourceId);
    }

    if (extractedResIds.length > 0) {
      // Only the page owner's own deliverables: `?res=` is visitor-controlled, so an id
      // belonging to someone else must not be turned into a signed download link here.
      const resDocs = await ResourceModel.find({
        id: { $in: extractedResIds },
        userEmail: cleanUserEmail,
        isPageAsset: { $ne: true },
      }).lean();
      const docMap = new Map(resDocs.map((d: any) => [d.id, d]));

      for (const rId of extractedResIds) {
        const found = docMap.get(rId) as any;
        // A /r/<this page> link in the email body resolves to the page's deliverable
        const isThisPage = rId === pageDoc.id || rId === pageDoc.slug;
        if (!found && !isThisPage) continue;
        resolvedResources.push({
          id: rId,
          name: found?.name || `Download Resource`,
          url: signedDownloadPath(rId),
          size: found?.size || "",
          type: found?.type || "pdf",
        });
      }
    }

    if (resolvedResources.length > 0) {
      downloadUrl = resolvedResources[0].url;
      resolvedDeliverableName = resolvedResources[0].name;
    } else if (pageDoc?.assetUrl && pageDoc.assetUrl.trim()) {
      // Direct assetUrl on page doc
      downloadUrl = pageDoc.assetUrl.trim();
      resolvedResources.push({
        id: "direct_asset",
        name: resolvedDeliverableName,
        url: downloadUrl || pageDoc.assetUrl.trim(),
        type: "pdf",
      });
    } else if (cleanUserEmail) {
      // Fallback to latest account resource if no specific asset was bound
      // Page assets (e.g. a locked PDF's file) are never handed out as a deliverable
      const resourceDoc = await ResourceModel.findOne({ userEmail: cleanUserEmail, isPageAsset: { $ne: true } }).sort({ uploadedAt: -1 }).lean() as any;
      if (resourceDoc && resourceDoc.id) {
        downloadUrl = signedDownloadPath(resourceDoc.id);
        if (resourceDoc.name) resolvedDeliverableName = resourceDoc.name;
        resolvedResources.push({
          id: resourceDoc.id,
          name: resourceDoc.name || resolvedDeliverableName,
          url: signedDownloadPath(resourceDoc.id),
          size: resourceDoc.size || "",
          type: resourceDoc.type || "pdf",
        });
      } else if (resourceDoc && resourceDoc.url) {
        downloadUrl = resourceDoc.url;
        resolvedResources.push({
          id: "res_url",
          name: resourceDoc.name || resolvedDeliverableName,
          url: resourceDoc.url,
          type: "pdf",
        });
      }
    }
  } catch (err: any) {
    if (err?.message !== "ACCESS_DENIED") console.warn("MongoDB connection fallback in ThankYouPage:", err);
  }

  if (landingRedirect) redirect(landingRedirect);
  // Fail closed: never render a page we could not load and check
  if (!pageDoc || !accessGranted) notFound();

  // Nothing resolved above: /r/<page id> serves the page's deliverable
  if (!downloadUrl) downloadUrl = signedDownloadPath(pageDoc.id);

  // If page is configured to "Send them elsewhere", redirect directly to destination URL
  if (pageDoc?.afterSignupOption === "elsewhere" && pageDoc?.destinationUrl && pageDoc.destinationUrl.trim()) {
    const raw = pageDoc.destinationUrl.trim();
    const dest = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    redirect(dest);
  }

  const themeMode = (accountDoc?.themeMode as "light" | "dark") || "light";
  const brandColor = accountDoc?.brandColor || "#0066B2";
  const logo = accountDoc?.logo || null;
  const businessName = accountDoc?.brandName || accountDoc?.name || "Funnels";

  const subscriberEmail = searchParams.email ? decodeURIComponent(searchParams.email) : "";
  const subscriberName = searchParams.name ? decodeURIComponent(searchParams.name) : "";
  const customAnswer = searchParams.answer ? decodeURIComponent(searchParams.answer) : "";
  const aiPersonalizedOutput = searchParams.aiOutput ? decodeURIComponent(searchParams.aiOutput) : "";

  return (
    <main
      className={`min-h-screen font-sans transition-colors duration-300 relative flex flex-col justify-between overflow-y-auto ${themeMode === "dark" ? "bg-[#0E0E10] text-white" : "bg-[#FAFAFA] text-[#18181b]"
        }`}
      style={{
        colorScheme: themeMode === "dark" ? "dark" : "light",
        backgroundImage:
          themeMode === "light"
            ? `radial-gradient(circle at 50% 0%, ${brandColor}12 0%, transparent 55%)`
            : `radial-gradient(circle at 50% 0%, ${brandColor}18 0%, transparent 55%)`,
      }}
    >
      {/* Header */}
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-center px-4 shrink-0 relative z-20 pt-2">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center bg-transparent overflow-hidden ${logo ? "border-none" : "border border-dashed border-[#a1a1aa]/45"}`}>
            {logo ? (
              <img src={logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-sm border border-dashed border-[#a1a1aa]" />
            )}
          </div>
          <span className={`text-xs sm:text-sm font-extrabold tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>{businessName}</span>
        </div>
      </header>

      {/* Main Animated Content */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center py-4 sm:py-8">
        <ThankYouAnimatedContent
          subscriberName={subscriberName}
          subscriberEmail={subscriberEmail}
          deliverableName={resolvedDeliverableName}
          downloadUrl={downloadUrl}
          resources={resolvedResources}
          customAnswer={customAnswer}
          aiPersonalizedOutput={aiPersonalizedOutput}
          brandColor={brandColor}
          themeMode={themeMode}
          logoUrl={logo}
          businessName={businessName}
          pageName={pageDoc.name}
          magnetSlug={pageDoc.slug || pageDoc.id}
          username={decodedUsername || "u"}
          afterSignupOption={pageDoc.afterSignupOption || "standard"}
          customHeading={pageDoc.customHeading || null}
          customMessage={pageDoc.customMessage || null}
          videoUrl={pageDoc.videoUrl || null}
          buttonLabel={pageDoc.buttonLabel || null}
          buttonUrl={pageDoc.buttonUrl || null}
          quizFunnelEnabled={pageDoc.quizFunnelEnabled || false}
          quizQuestions={Array.isArray(pageDoc.quizQuestions) ? pageDoc.quizQuestions : []}
        />
      </div>

      {/* Footer */}
      <footer className="mx-auto pb-3 text-center text-[10px] text-[#5c5650] shrink-0">
        <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-[#FE6F34]">
          Powered by Funnels
        </a>
      </footer>
    </main>
  );
}

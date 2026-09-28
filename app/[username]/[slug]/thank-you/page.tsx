import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel, ResourceModel } from "@/lib/models";
import ThankYouAnimatedContent from "@/components/thank-you-animated-content";

export const dynamic = "force-dynamic";

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: { username: string; slug: string };
  searchParams: { email?: string; name?: string; answer?: string; aiOutput?: string; res?: string };
}) {
  const decodedUsername = decodeURIComponent(params.username || "");
  let accountDoc: any = null;
  let pageDoc: any = null;
  let downloadUrl: string | null = null;

  try {
    await dbConnect();
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    // Execute Account and MagnetPage lookup in parallel to eliminate sequential database roundtrips
    const [foundAccount, foundPage] = await Promise.all([
      escapedUsername
        ? AccountModel.findOne({ username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } }).lean()
        : null,
      MagnetPageModel.findOne({
        $or: [{ id: params.slug }, { slug: params.slug }],
      }).lean(),
    ]);

    accountDoc = foundAccount;
    pageDoc = foundPage;

    const cleanUserEmail = pageDoc?.userEmail ? pageDoc.userEmail.trim().toLowerCase() : null;

    if (!accountDoc && cleanUserEmail) {
      accountDoc = await AccountModel.findOne({ email: cleanUserEmail }).lean();
    }
    if (!accountDoc) {
      accountDoc = await AccountModel.findOne({}).lean();
    }

    // 1. Check direct assetUrl on page doc
    if (pageDoc?.assetUrl && pageDoc.assetUrl.trim()) {
      downloadUrl = pageDoc.assetUrl.trim();
    }

    // 2. Check candidate resource ID from query param, pageDoc, or emailBody
    let candidateResId = (searchParams.res || pageDoc?.resourceId || "").trim();
    if (!candidateResId && pageDoc?.emailBody) {
      const match = pageDoc.emailBody.match(/\/r\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        candidateResId = match[1];
      }
    }

    if (candidateResId) {
      const specificRes = await ResourceModel.findOne({ id: candidateResId }).lean();
      if (specificRes) {
        downloadUrl = specificRes.url || (specificRes.fileUrl ? specificRes.fileUrl : `/r/${specificRes.id}`);
      }
    }

    // 3. Fallback to latest account resource if no specific asset was bound
    if (!downloadUrl && cleanUserEmail) {
      const resourceDoc = await ResourceModel.findOne({ userEmail: cleanUserEmail }).sort({ uploadedAt: -1 }).lean();
      if (resourceDoc && resourceDoc.url) {
        downloadUrl = resourceDoc.url;
      }
    }
  } catch (err) {
    console.warn("MongoDB connection fallback in ThankYouPage:", err);
  }

  if (!pageDoc) {
    pageDoc = {
      id: params.slug,
      name: "Resource Guide",
      slug: params.slug,
      deliverable: "Instant Access File",
    };
  }

  // If page is configured to "Send them elsewhere", redirect directly to destination URL
  if (pageDoc?.afterSignupOption === "elsewhere" && pageDoc?.destinationUrl && pageDoc.destinationUrl.trim()) {
    const raw = pageDoc.destinationUrl.trim();
    const dest = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    redirect(dest);
  }

  const themeMode = (accountDoc?.themeMode as "light" | "dark") || "light";
  const brandColor = accountDoc?.brandColor || "#0066B2";
  const logo = accountDoc?.logo || null;
  const businessName = accountDoc?.brandName || accountDoc?.name || "LeadMagnets";

  const subscriberEmail = searchParams.email ? decodeURIComponent(searchParams.email) : "";
  const subscriberName = searchParams.name ? decodeURIComponent(searchParams.name) : "";
  const customAnswer = searchParams.answer ? decodeURIComponent(searchParams.answer) : "";
  const aiPersonalizedOutput = searchParams.aiOutput ? decodeURIComponent(searchParams.aiOutput) : "";

  return (
    <main
      className={`min-h-screen lg:h-screen lg:max-h-screen font-sans transition-colors duration-300 relative flex flex-col justify-between overflow-y-auto lg:overflow-hidden ${themeMode === "dark" ? "bg-[#0E0E10] text-white" : "bg-[#FAFAFA] text-[#18181b]"
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
      <div className="flex-1 flex flex-col items-center justify-center py-2">
        <ThankYouAnimatedContent
          subscriberName={subscriberName}
          subscriberEmail={subscriberEmail}
          deliverableName={pageDoc.deliverable || pageDoc.name || "Resource Access"}
          downloadUrl={downloadUrl}
          customAnswer={customAnswer}
          aiPersonalizedOutput={aiPersonalizedOutput}
          brandColor={brandColor}
          themeMode={themeMode}
          logoUrl={logo}
          businessName={businessName}
          pageName={pageDoc.name}
          magnetSlug={pageDoc.slug || pageDoc.id}
          username={decodedUsername || "u"}
          calendarUrl={accountDoc?.calendarToken || null}
          afterSignupOption={pageDoc.afterSignupOption || "standard"}
          customHeading={pageDoc.customHeading || null}
          customMessage={pageDoc.customMessage || null}
          videoUrl={pageDoc.videoUrl || null}
          buttonLabel={pageDoc.buttonLabel || null}
          buttonUrl={pageDoc.buttonUrl || null}
        />
      </div>

      {/* Footer */}
      <footer className="mx-auto pb-3 text-center text-[10px] text-[#5c5650] shrink-0">
        <a href="/" className="inline-flex items-center gap-1 font-medium hover:text-[#FE6F34]">
          Powered by LeadMagnets
        </a>
      </footer>
    </main>
  );
}

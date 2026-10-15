import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
import PublicProfileView from "@/components/profile/public-profile-view";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";


export default async function UserProfileRoute({
  params,
}: {
  params: { username: string };
}) {
  let accountDoc: any = null;
  let pages: any[] = [];

  try {
    const rawUser = params.username || "";
    if (rawUser.includes(".") || rawUser.startsWith("_") || rawUser === "favicon.ico" || rawUser === "custom-domain" || rawUser === "domain-resolver") {
      notFound();
    }

    await dbConnect();
    const decodedUsername = decodeURIComponent(rawUser);
    const escapedUsername = decodedUsername.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    accountDoc = await AccountModel.findOne(
      escapedUsername ? { username: { $regex: new RegExp(`^${escapedUsername}$`, "i") } } : {}
    ).lean();

    if (!accountDoc) {
      // Fallback 1: Check if rawUser is actually a Lead Magnet slug
      const matchedPage = await MagnetPageModel.findOne({
        $or: [{ id: rawUser }, { slug: rawUser }]
      }).lean();

      if (matchedPage && matchedPage.userEmail) {
        const ownerAccount = await AccountModel.findOne({
          email: matchedPage.userEmail.trim().toLowerCase()
        }).lean();

        if (ownerAccount && ownerAccount.username) {
          const { redirect } = await import("next/navigation");
          redirect(`/${ownerAccount.username}/${matchedPage.slug || matchedPage.id}`);
        }
      }
    }

    if (accountDoc && accountDoc.email) {
      pages = await MagnetPageModel.find({
        userEmail: accountDoc.email.trim().toLowerCase(),
        status: "live",
      }).lean();
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.warn("MongoDB query error in UserProfileRoute:", err);
  }

  if (!accountDoc) {
    notFound();
  }

  let isCustomDomain = false;
  try {
    isCustomDomain = Boolean(headers().get("x-custom-domain"));
  } catch {
    // Ignore if headers() unavailable
  }

  const serializedAccount = {
    name: accountDoc.name || "Workspace",
    brandName: accountDoc.brandName || "",
    username: accountDoc.username,
    email: accountDoc.email,
    logo: accountDoc.logo || null,
    avatar: accountDoc.avatar || null,
    brandColor: accountDoc.brandColor || "#0066B2",
    privacyPolicy: accountDoc.privacyPolicy || "",
    termsOfService: accountDoc.termsOfService || "",
  };

  const serializedPages = pages.map((page: any) => ({
    id: page._id?.toString() || page.id,
    slug: page.slug || page.id,
    name: page.name || "Untitled Lead Magnet",
    headline: page.headline || "",
    subheadline: page.subheadline || "",
    cta: page.cta || "Get instant access",
    imageUrl: page.imageUrl || null,
    // Only a flag — never ship PDF/page URLs to the public profile
    isPdf: Boolean(
      page.pdfUrl ||
        (Array.isArray(page.pdfPages) && page.pdfPages.length > 0) ||
        (typeof page.pdfPageCount === "number" && page.pdfPageCount > 0)
    ),
    pdfPageCount: typeof page.pdfPageCount === "number" ? page.pdfPageCount : 0,
    deliverable: page.deliverable || "Instant Access",
    views: page.views || 0,
  }));

  return (
    <PublicProfileView
      account={serializedAccount}
      pages={serializedPages}
      isCustomDomain={isCustomDomain}
    />
  );
}


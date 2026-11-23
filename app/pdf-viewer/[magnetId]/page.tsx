import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
import { isPrimaryAppHost } from "@/lib/domain-verify";
import { lockedPdfSegment } from "@/lib/locked-pdf-url";
import LockedPdfView from "./locked-pdf-view";

export const dynamic = "force-dynamic";

interface Props {
  params: { magnetId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function PdfViewerPage({ params, searchParams }: Props) {
  const magnetId = params.magnetId;

  let pageDoc: any = null;
  let accountDoc: any = null;
  let brandedPath: string | null = null;

  try {
    await dbConnect();

    // Try lookup by custom `id` field first, then by MongoDB _id
    pageDoc = await MagnetPageModel.findOne({ id: magnetId }).lean();

    if (!pageDoc && mongoose.Types.ObjectId.isValid(magnetId)) {
      // Fallback: try by MongoDB _id in case the id field differs
      pageDoc = await MagnetPageModel.findOne({ _id: magnetId }).lean();
    }

    if (pageDoc?.userEmail) {
      accountDoc = await AccountModel.findOne({
        email: pageDoc.userEmail.trim().toLowerCase(),
      }).lean();
    }

    // Old /pdf-viewer/<id> links (emails, QR codes, shares) move to the branded
    // /<username>/<slug> URL — but only when that URL resolves to this exact PDF.
    // Custom domains keep serving here: their branded route depends on domain access.
    const host = (headers().get("host") || "").split(":")[0].toLowerCase();
    const slug = typeof pageDoc?.slug === "string" ? pageDoc.slug.trim() : "";
    if (
      pageDoc?.template === "locked-pdf" &&
      pageDoc.id &&
      slug &&
      accountDoc?.username &&
      isPrimaryAppHost(host)
    ) {
      const siblings = await MagnetPageModel.find(
        {
          userEmail: pageDoc.userEmail.trim().toLowerCase(),
          id: { $ne: pageDoc.id },
          $or: [{ slug }, { id: slug }],
        },
        { id: 1, slug: 1 }
      ).lean();
      const segment = lockedPdfSegment(pageDoc, siblings as any[]);
      if (segment === slug) {
        brandedPath = `/${encodeURIComponent(accountDoc.username)}/${encodeURIComponent(slug)}`;
      }
    }
  } catch (err) {
    console.warn("[pdf-viewer] DB error:", err);
  }

  // If the magnet doesn't exist at all → 404
  if (!pageDoc) {
    return notFound();
  }

  if (brandedPath) {
    // Keep ?token= (email unlock links) and ?reset=1 (owner preview) intact
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams || {})) {
      if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
      else if (typeof value === "string") query.append(key, value);
    }
    const qs = query.toString();
    redirect(qs ? `${brandedPath}?${qs}` : brandedPath);
  }

  return (
    <LockedPdfView
      magnetId={magnetId}
      pageDoc={pageDoc}
      accountDoc={accountDoc}
      searchParams={pickViewerParams(searchParams)}
    />
  );
}

function pickViewerParams(searchParams?: Record<string, string | string[] | undefined>) {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return { token: first(searchParams?.token), reset: first(searchParams?.reset) };
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, ResourceModel } from "@/lib/models";
import { getUserAssetFolder } from "@/lib/cloudinary";
import { fetchStoredPdf, parseCloudinaryUrl, PdfSourceError } from "@/lib/pdf-source";

export const dynamic = "force-dynamic";
// Large PDFs can take longer than the 10s default to stream (Hobby max is 60s)
export const maxDuration = 60;

/**
 * Is `url` a file the signed-in user owns? Either it sits in their own Cloudinary
 * tenant folder, or it is recorded on one of their resources / magnet pages.
 */
async function userOwnsFile(email: string, url: string): Promise<boolean> {
  const parsed = parseCloudinaryUrl(url);
  if (parsed) {
    const appCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const folder = getUserAssetFolder(email);
    if ((!appCloudName || parsed.cloudName === appCloudName) && parsed.publicId.startsWith(`${folder}/`)) {
      return true;
    }
  }

  await dbConnect();
  const [resource, page] = await Promise.all([
    ResourceModel.exists({ userEmail: email, $or: [{ fileUrl: url }, { url }] }),
    MagnetPageModel.exists({ userEmail: email, $or: [{ pdfUrl: url }, { assetUrl: url }] }),
  ]);
  return Boolean(resource || page);
}

/**
 * GET /api/pdf-proxy?url=<encoded-pdf-url>
 *
 * Owner-only proxy used by the dashboard (locked PDF setup) to read the user's own
 * PDFs server-side. Public visitors never use this — the viewer loads PDFs through
 * /api/pdf-gate/file, which enforces the unlock gate.
 */
export async function GET(req: NextRequest) {
  try {
    const rawParam = req.nextUrl.searchParams.get("url");
    if (!rawParam) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    let resolvedUrl: string;
    try {
      resolvedUrl = decodeURIComponent(rawParam);
    } catch {
      resolvedUrl = rawParam;
    }

    const sessionEmail = await getAuthenticatedUserEmail();
    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await userOwnsFile(sessionEmail, resolvedUrl))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const upstream = await fetchStoredPdf(resolvedUrl, req.nextUrl.origin);
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=300",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err: any) {
    if (err instanceof PdfSourceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[pdf-proxy] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

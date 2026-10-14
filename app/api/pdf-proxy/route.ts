import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel } from "@/lib/models";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const dynamic = "force-dynamic";

import { isPrivateOrReservedUrl } from "@/lib/ssrf";

/**
 * Parse a Cloudinary secure_url into its components.
 * Returns null if the URL doesn't match the expected Cloudinary pattern.
 */
function parseCloudinaryUrl(url: string): {
  cloudName: string;
  publicId: string;   // full path including folder
  format: string;     // file extension, e.g. "pdf"
  resourceType: "image" | "raw" | "video";
} | null {
  const match = url.match(
    /res\.cloudinary\.com\/([^/]+)\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/
  );
  if (!match) return null;

  const cloudName = match[1];
  const resourceType = match[2] as "image" | "raw" | "video";
  const pathWithExt = match[3];

  const lastDot = pathWithExt.lastIndexOf(".");
  const publicId = resourceType === "raw" ? pathWithExt : (lastDot !== -1 ? pathWithExt.substring(0, lastDot) : pathWithExt);
  const format = resourceType === "raw" ? "" : (lastDot !== -1 ? pathWithExt.substring(lastDot + 1) : "pdf");

  return { cloudName, publicId, format, resourceType };
}

/**
 * GET /api/pdf-proxy?url=<encoded-pdf-url>&magnetId=<magnetId>
 *
 * Server-side proxy that fetches a PDF from Cloudinary (or Vercel Blob / own
 * origin) and streams the raw bytes back to the browser.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const rawParam = searchParams.get("url");
    const magnetId = (searchParams.get("magnetId") || "").trim();

    if (!rawParam) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    let resolvedUrl: string;
    try {
      resolvedUrl = decodeURIComponent(rawParam);
    } catch {
      resolvedUrl = rawParam;
    }

    // ── Auth guard: session user OR valid public magnetId ──────────────────
    const sessionEmail = await getAuthenticatedUserEmail();
    let isAuthorized = Boolean(sessionEmail);

    if (!isAuthorized && magnetId) {
      try {
        await dbConnect();
        const query: any = {
          $or: [
            { id: magnetId },
            ...(mongoose.Types.ObjectId.isValid(magnetId) ? [{ _id: magnetId }] : []),
          ],
        };
        const pageDoc: any = await MagnetPageModel.findOne(query).lean();
        if (pageDoc) {
          const reqParsed = parseCloudinaryUrl(resolvedUrl);
          const pageParsed = pageDoc.pdfUrl ? parseCloudinaryUrl(pageDoc.pdfUrl) : null;
          const assetParsed = pageDoc.assetUrl ? parseCloudinaryUrl(pageDoc.assetUrl) : null;

          const isDirectMatch =
            pageDoc.pdfUrl === resolvedUrl ||
            pageDoc.assetUrl === resolvedUrl ||
            (Array.isArray(pageDoc.pdfPages) && pageDoc.pdfPages.includes(resolvedUrl));

          const isCloudinaryMatch =
            Boolean(reqParsed) &&
            ((pageParsed && reqParsed?.publicId === pageParsed.publicId) ||
              (assetParsed && reqParsed?.publicId === assetParsed.publicId) ||
              (Array.isArray(pageDoc.pdfPages) &&
                pageDoc.pdfPages.some((p: string) => parseCloudinaryUrl(p)?.publicId === reqParsed?.publicId)));

          if (isDirectMatch || isCloudinaryMatch) {
            isAuthorized = true;
          }
        }
      } catch (err) {
        console.warn("[pdf-proxy] Magnet verification error:", err);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Cloudinary path ──────────────────────────────────────────────────────
    if (resolvedUrl.includes("res.cloudinary.com")) {
      const parsed = parseCloudinaryUrl(resolvedUrl);
      const appCloudName = process.env.CLOUDINARY_CLOUD_NAME;

      // Only sign if configured and belongs to the app's own cloud name
      if (parsed && process.env.CLOUDINARY_API_SECRET && (!appCloudName || parsed.cloudName === appCloudName)) {
        // Generate a server-signed private download URL using the Cloudinary SDK.
        const signedUrl: string = cloudinary.utils.private_download_url(
          parsed.publicId,
          parsed.format,
          {
            resource_type: parsed.resourceType,
            type: "upload",
            expires_at: Math.floor(Date.now() / 1000) + 300, // 5 min TTL
            attachment: false,
          }
        );

        const upstream = await fetch(signedUrl, {
          headers: { Accept: "application/pdf,application/octet-stream,*/*" },
        });

        if (upstream.ok) {
          const body = upstream.body;
          if (!body) {
            return NextResponse.json({ error: "Empty Cloudinary response" }, { status: 502 });
          }
          return new NextResponse(body, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Cache-Control": "private, max-age=300",
            },
          });
        }

        // Signed URL failed — try the raw resource type variant as a last resort
        console.warn(`[pdf-proxy] Signed URL returned ${upstream.status}, trying raw fallback`);
      }

      // Fallback: swap image/upload → raw/upload and try plain fetch
      const rawFallbackUrl = resolvedUrl
        .replace("/image/upload/", "/raw/upload/")
        .replace("/video/upload/", "/raw/upload/");

      const fallback = await fetch(rawFallbackUrl, {
        headers: { Accept: "application/pdf,application/octet-stream,*/*" },
      });

      if (fallback.ok) {
        const fb = fallback.body;
        if (!fb) {
          return NextResponse.json({ error: "Empty Cloudinary fallback response" }, { status: 502 });
        }
        return new NextResponse(fb, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Cache-Control": "private, max-age=300",
          },
        });
      }

      // Also try the original URL as-is (sometimes image/upload works for PDFs)
      const originalFetch = await fetch(resolvedUrl, {
        headers: { Accept: "application/pdf,application/octet-stream,*/*" },
      });

      if (originalFetch.ok) {
        const ob = originalFetch.body;
        if (!ob) {
          return NextResponse.json({ error: "Empty response" }, { status: 502 });
        }
        return new NextResponse(ob, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Cache-Control": "private, max-age=300",
          },
        });
      }

      return NextResponse.json(
        { error: `Could not fetch PDF from Cloudinary (${originalFetch.status})` },
        { status: originalFetch.status }
      );
    }

    // ── Generic fetch (Vercel Blob, own-origin /uploads/, Cloudflare R2, etc.) ─────────────
    let isAllowed = false;
    if (resolvedUrl.startsWith("/")) {
      resolvedUrl = `${req.nextUrl.origin}${resolvedUrl}`;
      isAllowed = true;
    } else {
      try {
        const parsedUrl = new URL(resolvedUrl);
        const hostname = parsedUrl.hostname.toLowerCase();
        const originHostname = req.nextUrl.hostname.toLowerCase();

        if (parsedUrl.protocol === "https:" || (parsedUrl.protocol === "http:" && hostname === "localhost")) {
          if (
            hostname === originHostname ||
            hostname === "blob.vercel-storage.com" ||
            hostname.endsWith(".blob.vercel-storage.com") ||
            (hostname.startsWith("pub-") && hostname.endsWith(".r2.dev")) ||
            (process.env.VERCEL_URL && hostname === new URL(`https://${process.env.VERCEL_URL}`).hostname.toLowerCase())
          ) {
            isAllowed = true;
          }
        }
      } catch {
        isAllowed = false;
      }
    }

    if (!isAllowed) {
      return NextResponse.json(
        { error: "URL origin not allowed for proxying" },
        { status: 403 }
      );
    }

    if (new URL(resolvedUrl).hostname !== req.nextUrl.hostname && (await isPrivateOrReservedUrl(resolvedUrl))) {
      return NextResponse.json(
        { error: "Target host is not allowed" },
        { status: 403 }
      );
    }

    const upstream = await fetch(resolvedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MagnetsApp/1.0; PDF Proxy)",
        Accept: "application/pdf,*/*",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${upstream.status} ${upstream.statusText}` },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "Upstream returned HTML instead of a PDF document" },
        { status: 422 }
      );
    }

    const body = upstream.body;
    if (!body) {
      return NextResponse.json({ error: "Empty upstream response" }, { status: 502 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=300",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err: any) {
    console.error("[pdf-proxy] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

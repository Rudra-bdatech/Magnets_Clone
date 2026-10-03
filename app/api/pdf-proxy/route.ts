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

/**
 * Parse a Cloudinary secure_url into its components.
 * Returns null if the URL doesn't match the expected Cloudinary pattern.
 */
function parseCloudinaryUrl(url: string): {
  publicId: string;   // full path including folder
  format: string;     // file extension, e.g. "pdf"
  resourceType: "image" | "raw" | "video";
} | null {
  const match = url.match(
    /res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/
  );
  if (!match) return null;

  const resourceType = match[1] as "image" | "raw" | "video";
  const pathWithExt = match[2];

  const lastDot = pathWithExt.lastIndexOf(".");
  const publicId = resourceType === "raw" ? pathWithExt : (lastDot !== -1 ? pathWithExt.substring(0, lastDot) : pathWithExt);
  const format = resourceType === "raw" ? "" : (lastDot !== -1 ? pathWithExt.substring(lastDot + 1) : "pdf");

  return { publicId, format, resourceType };
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
        if (
          pageDoc &&
          (pageDoc.pdfUrl === resolvedUrl ||
            pageDoc.assetUrl === resolvedUrl ||
            (pageDoc.pdfPages && pageDoc.pdfPages.includes(resolvedUrl)) ||
            resolvedUrl.includes("cloudinary.com"))
        ) {
          isAuthorized = true;
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

      if (parsed && process.env.CLOUDINARY_API_SECRET) {
        // Generate a server-signed private download URL using the Cloudinary SDK.
        // private_download_url signs the request with the API secret so Cloudinary
        // serves the asset regardless of delivery restrictions.
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

    // ── Generic fetch (Vercel Blob, own-origin /uploads/, etc.) ─────────────
    const allowedPrefixes = [
      "https://pub-",
      "https://blob.vercel-storage.com",
      req.nextUrl.origin,
    ];
    const isAllowed = allowedPrefixes.some((p) => resolvedUrl.startsWith(p));

    if (!isAllowed && resolvedUrl.startsWith("/")) {
      resolvedUrl = `${req.nextUrl.origin}${resolvedUrl}`;
    } else if (!isAllowed) {
      return NextResponse.json(
        { error: "URL origin not allowed for proxying" },
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

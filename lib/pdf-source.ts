import { v2 as cloudinary } from "cloudinary";
import { isPrivateOrReservedUrl } from "@/lib/ssrf";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Parse a Cloudinary secure_url into its components.
 * Returns null if the URL doesn't match the expected Cloudinary pattern.
 */
export function parseCloudinaryUrl(url: string): {
  cloudName: string;
  publicId: string;   // full path including folder
  format: string;     // file extension, e.g. "pdf"
  resourceType: "image" | "raw" | "video";
} | null {
  // Parse rather than substring-match: "http://169.254.169.254/?res.cloudinary.com/..." must not count
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname.toLowerCase() !== "res.cloudinary.com") return null;

  const match = parsedUrl.pathname.match(
    /^\/([^/]+)\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/
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

export class PdfSourceError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const PDF_ACCEPT = "application/pdf,application/octet-stream,*/*";

/**
 * Fetch a stored PDF server-side (Cloudinary, Vercel Blob, R2 or own origin).
 * Returns the upstream Response (status ok, body present) or throws PdfSourceError.
 * Callers are responsible for authorizing access to `rawUrl` first.
 */
export async function fetchStoredPdf(rawUrl: string, requestOrigin: string): Promise<Response> {
  let resolvedUrl = rawUrl;

  // ── Cloudinary path ──────────────────────────────────────────────────────
  // Only a real https://res.cloudinary.com/... URL takes this path, so every fetch below stays on Cloudinary
  const parsed = parseCloudinaryUrl(resolvedUrl);
  if (parsed) {
    const appCloudName = process.env.CLOUDINARY_CLOUD_NAME;

    // Only sign if configured and belongs to the app's own cloud name
    if (process.env.CLOUDINARY_API_SECRET && (!appCloudName || parsed.cloudName === appCloudName)) {
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

      const upstream = await fetch(signedUrl, { headers: { Accept: PDF_ACCEPT }, cache: "no-store" });
      if (upstream.ok && upstream.body) return upstream;

      // Signed URL failed — try the raw resource type variant as a last resort
      console.warn(`[pdf-source] Signed URL returned ${upstream.status}, trying raw fallback`);
    }

    // Fallback: swap image/upload → raw/upload and try plain fetch
    const rawFallbackUrl = resolvedUrl
      .replace("/image/upload/", "/raw/upload/")
      .replace("/video/upload/", "/raw/upload/");

    const fallback = await fetch(rawFallbackUrl, { headers: { Accept: PDF_ACCEPT }, cache: "no-store" });
    if (fallback.ok && fallback.body) return fallback;

    // Also try the original URL as-is (sometimes image/upload works for PDFs)
    const originalFetch = await fetch(resolvedUrl, { headers: { Accept: PDF_ACCEPT }, cache: "no-store" });
    if (originalFetch.ok && originalFetch.body) return originalFetch;

    throw new PdfSourceError(
      `Could not fetch PDF from Cloudinary (${originalFetch.status})`,
      originalFetch.ok ? 502 : originalFetch.status
    );
  }

  // ── Generic fetch (Vercel Blob, own-origin /uploads/, Cloudflare R2, etc.) ─────────────
  const originHostname = new URL(requestOrigin).hostname.toLowerCase();
  let isAllowed = false;
  if (resolvedUrl.startsWith("/")) {
    resolvedUrl = `${requestOrigin}${resolvedUrl}`;
    isAllowed = true;
  } else {
    try {
      const parsedUrl = new URL(resolvedUrl);
      const hostname = parsedUrl.hostname.toLowerCase();

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
    throw new PdfSourceError("URL origin not allowed for proxying", 403);
  }

  if (new URL(resolvedUrl).hostname.toLowerCase() !== originHostname && (await isPrivateOrReservedUrl(resolvedUrl))) {
    throw new PdfSourceError("Target host is not allowed", 403);
  }

  const upstream = await fetch(resolvedUrl, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MagnetsApp/1.0; PDF Proxy)",
      Accept: "application/pdf,*/*",
    },
  });

  if (!upstream.ok) {
    throw new PdfSourceError(`Upstream fetch failed: ${upstream.status} ${upstream.statusText}`, upstream.status);
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new PdfSourceError("Upstream returned HTML instead of a PDF document", 422);
  }

  if (!upstream.body) {
    throw new PdfSourceError("Empty upstream response", 502);
  }

  return upstream;
}

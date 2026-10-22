import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { dbConnect } from "@/lib/mongodb";
import { ResourceModel, MagnetPageModel, AccountModel } from "@/lib/models";
import { v2 as cloudinary } from "cloudinary";
import { isPrivateOrReservedUrl } from "@/lib/ssrf";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { verifyMagnetAccess, withMagnetAccess } from "@/lib/magnet-access";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function parseCloudinaryUrl(url: string): {
  publicId: string;
  format: string;
  resourceType: "image" | "raw" | "video";
} | null {
  const match = url.match(
    /res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/
  );
  if (!match) return null;

  const resourceType = match[1] as "image" | "raw" | "video";
  const pathWithExt = match[2];

  const lastDot = pathWithExt.lastIndexOf(".");
  // For 'raw' resource_type, Cloudinary requires the full filename (with extension) as publicId and empty format
  const publicId = resourceType === "raw" ? pathWithExt : (lastDot !== -1 ? pathWithExt.substring(0, lastDot) : pathWithExt);
  const format = resourceType === "raw" ? "" : (lastDot !== -1 ? pathWithExt.substring(lastDot + 1) : "pdf");

  return { publicId, format, resourceType };
}

const NOT_PAGE_ASSET = { isPageAsset: { $ne: true }, type: { $ne: "page_asset" } };

/** HTTPS URLs on the storage hosts uploads go to (Cloudinary, Vercel Blob). */
function isTrustedStorageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === "https:" &&
      (hostname === "res.cloudinary.com" ||
        hostname === "blob.vercel-storage.com" ||
        hostname.endsWith(".blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resourceId = params.id;
  // Links handed to leads carry ?t=<access token>; without it only the owner may download
  const hasToken = verifyMagnetAccess(resourceId, req.nextUrl.searchParams.get("t"));
  const isOwnerOf = async (ownerEmail?: string | null) => {
    const owner = (ownerEmail || "").toLowerCase().trim();
    if (!owner) return false;
    return (await getAuthenticatedUserEmail()) === owner;
  };
  const denied = () => NextResponse.redirect(new URL("/", req.url), 302);

  try {
    await dbConnect();
    // Page assets (a locked PDF's file, cover images) are never served here:
    // a locked PDF is only released through the OTP gate at /api/pdf-gate/file.
    let resource = await ResourceModel.findOne({ id: resourceId, ...NOT_PAGE_ASSET }).lean();
    let linkedPage: any = null;

    // If not found by direct resource id, check if resourceId is a MagnetPage slug/id
    if (!resource) {
      // Locked PDFs are only served through /api/pdf-gate/file (never resolved here)
      const page = await MagnetPageModel.findOne({
        template: { $ne: "locked-pdf" },
        $or: [{ id: resourceId }, { slug: resourceId }],
      }).sort({ _id: -1 }).lean();

      if (page) {
        const unpublished = page.status === "draft" || page.status === "paused";
        if ((!hasToken || unpublished) && !(await isOwnerOf(page.userEmail))) {
          // Send visitors to the signup form instead of handing out the deliverable
          const owner: any = page.userEmail
            ? await AccountModel.findOne({ email: page.userEmail.toLowerCase().trim() }, { username: 1 }).lean()
            : null;
          if (owner?.username && !unpublished) {
            return NextResponse.redirect(
              new URL(`/${encodeURIComponent(owner.username)}/${encodeURIComponent(page.slug || page.id)}`, req.url),
              302
            );
          }
          return denied();
        }
        linkedPage = page;
        let boundResId = (page.resourceId || "").trim();
        if (!boundResId && page.emailBody) {
          const m = page.emailBody.match(/\/r\/([a-zA-Z0-9_-]+)/);
          if (m && m[1]) boundResId = m[1];
        }

        if (boundResId) {
          // Only the page owner's own file, never another account's resource id
          resource = await ResourceModel.findOne({
            id: boundResId,
            userEmail: (page.userEmail || "").toLowerCase().trim(),
            ...NOT_PAGE_ASSET,
          }).lean();
        }

        // Only redirect to our own storage, never to an arbitrary stored URL (open redirect)
        if (!resource && page.assetUrl && isTrustedStorageUrl(page.assetUrl)) {
          return NextResponse.redirect(page.assetUrl, 307);
        }

        if (!resource && page.userEmail) {
          // Page assets (e.g. a locked PDF's file) are never handed out as a deliverable
          resource = await ResourceModel.findOne({ userEmail: page.userEmail.toLowerCase().trim(), ...NOT_PAGE_ASSET })
            .sort({ uploadedAt: -1 })
            .lean();
        }
      }
    } else if (!hasToken && !(await isOwnerOf(resource.userEmail))) {
      return denied();
    } else if (resource.userEmail) {
      linkedPage = await MagnetPageModel.findOne({
        $or: [{ resourceId: resource.id }, { userEmail: resource.userEmail }],
      }).sort({ createdAt: -1 }).lean();
    }

    // 1. If stored in Cloudinary / Vercel Blob / S3 CDN, stream directly with attachment headers
    if (resource && resource.fileUrl && resource.fileUrl.startsWith("http") && !resource.fileUrl.includes("/uploads/")) {
      const downloadFilename = resource.name || resource.fileUrl.split("/").pop() || "download.pdf";
      const isPdf = downloadFilename.toLowerCase().endsWith(".pdf") || resource.fileUrl.toLowerCase().endsWith(".pdf");

      if (isTrustedStorageUrl(resource.fileUrl) && new URL(resource.fileUrl).hostname.toLowerCase() === "res.cloudinary.com") {
        const parsed = parseCloudinaryUrl(resource.fileUrl);
        if (parsed && process.env.CLOUDINARY_API_SECRET) {
          try {
            // Generate a signed Cloudinary download URL and redirect the browser
            // directly to it — no bytes pass through Vercel, eliminating bandwidth costs.
            const signedUrl = cloudinary.utils.private_download_url(
              parsed.publicId,
              parsed.format,
              {
                resource_type: parsed.resourceType,
                type: "upload",
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                attachment: true,
              }
            );
            // 302 redirect: browser downloads the file straight from Cloudinary.
            // User experience is identical — file still downloads immediately.
            return NextResponse.redirect(signedUrl, 302);
          } catch (signErr) {
            console.warn("Cloudinary signed URL error, falling back:", signErr);
          }
        }

        // Fallback: if API secret is missing or signing failed, redirect to the
        // raw/upload variant of the Cloudinary URL (still zero Vercel bandwidth).
        const rawFallbackUrl = resource.fileUrl.replace("/image/upload/", "/raw/upload/");
        return NextResponse.redirect(rawFallbackUrl, 302);
      }

      // Only our own storage is fetched or redirected to. Anything else is either an
      // SSRF attempt (internal hosts, cloud metadata) or an open redirect.
      if (!isTrustedStorageUrl(resource.fileUrl) || (await isPrivateOrReservedUrl(resource.fileUrl))) {
        return NextResponse.json({ error: "Invalid resource URL" }, { status: 400 });
      }

      try {
        // redirect: "error" so a 3xx can't send this server fetch to an unchecked host
        const blobResponse = await fetch(resource.fileUrl, { redirect: "error" });
        if (blobResponse.ok && blobResponse.body) {
          return new NextResponse(blobResponse.body, {
            headers: {
              "Content-Type": isPdf ? "application/pdf" : (blobResponse.headers.get("content-type") || "application/octet-stream"),
              "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
              "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
          });
        }
      } catch (fetchErr) {
        console.warn("Direct blob stream error, redirecting:", fetchErr);
      }
      return NextResponse.redirect(resource.fileUrl, 307);
    }

    const isVercel = Boolean(process.env.VERCEL);
    const uploadsDir = isVercel ? "/tmp" : path.join(process.cwd(), "public", "uploads");
    const filesOnDisk = await fs.readdir(uploadsDir).catch(() => []);
    // Uploads are saved as "<resource id>-<name>". Only serve a file that belongs to a
    // resource found above: matching on the raw URL id would serve any file (including
    // page assets) whose name starts with whatever the visitor typed.
    const localPrefix = resource?.id ? `${resource.id}-` : null;
    const isResourceFile = (f: string) => Boolean(localPrefix) && f.startsWith(localPrefix as string);
    let matchingFile = filesOnDisk.find(isResourceFile);
    let targetDir = uploadsDir;

    if (!matchingFile && isVercel) {
      // Check fallback public/uploads directory
      const localPublic = path.join(process.cwd(), "public", "uploads");
      const altFiles = await fs.readdir(localPublic).catch(() => []);
      matchingFile = altFiles.find(isResourceFile);
      if (matchingFile) targetDir = localPublic;
    }

    if (matchingFile) {
      const filePath = path.join(targetDir, matchingFile);
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(matchingFile).toLowerCase();

      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".gif") contentType = "image/gif";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".svg") contentType = "image/svg+xml";
      else if (ext === ".txt" || ext === ".csv") contentType = "text/plain";
      else if (ext === ".zip" || ext === ".rar" || ext === ".7z" || ext === ".tar" || ext === ".gz") contentType = "application/zip";
      else if (ext === ".doc" || ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === ".xls" || ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      else if (ext === ".ppt" || ext === ".pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      else if (ext === ".mp3" || ext === ".wav" || ext === ".m4a") contentType = "audio/mpeg";
      else if (ext === ".mp4" || ext === ".mov" || ext === ".avi" || ext === ".webm") contentType = "video/mp4";

      const downloadFilename = resource ? resource.name : matchingFile;

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
        },
      });
    }

    // If a linked page is found, redirect directly to the page's Thank-You page
    if (linkedPage) {
      const owner: any = linkedPage.userEmail
        ? await AccountModel.findOne({ email: linkedPage.userEmail.toLowerCase().trim() }, { username: 1 }).lean()
        : null;
      const username = owner?.username || "u";
      const targetSlug = linkedPage.slug || linkedPage.id;
      const thankYou = withMagnetAccess(`/${encodeURIComponent(username)}/${encodeURIComponent(targetSlug)}/thank-you`, linkedPage.id);
      return NextResponse.redirect(new URL(thankYou, req.url), 302);
    }
  } catch (err) {
    console.error("Error in /r/[id] direct handler:", err);
  }

  // If no file or page found, redirect cleanly to the homepage
  return NextResponse.redirect(new URL("/", req.url), 302);
}

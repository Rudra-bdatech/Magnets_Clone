import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { dbConnect } from "@/lib/mongodb";
import { ResourceModel, MagnetPageModel } from "@/lib/models";
import { v2 as cloudinary } from "cloudinary";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resourceId = params.id;

  try {
    await dbConnect();
    let resource = await ResourceModel.findOne({ id: resourceId }).lean();
    let linkedPage: any = null;

    // If not found by direct resource id, check if resourceId is a MagnetPage slug/id
    if (!resource) {
      const page = await MagnetPageModel.findOne({
        $or: [{ id: resourceId }, { slug: resourceId }],
      }).sort({ _id: -1 }).lean();

      if (page) {
        linkedPage = page;
        let boundResId = (page.resourceId || "").trim();
        if (!boundResId && page.emailBody) {
          const m = page.emailBody.match(/\/r\/([a-zA-Z0-9_-]+)/);
          if (m && m[1]) boundResId = m[1];
        }

        if (boundResId) {
          resource = await ResourceModel.findOne({ id: boundResId }).lean();
        }

        if (!resource && page.assetUrl && page.assetUrl.startsWith("http")) {
          return NextResponse.redirect(page.assetUrl, 307);
        }

        if (!resource && page.userEmail) {
          resource = await ResourceModel.findOne({ userEmail: page.userEmail.toLowerCase().trim() })
            .sort({ uploadedAt: -1 })
            .lean();
        }
      }
    } else if (resource.userEmail) {
      linkedPage = await MagnetPageModel.findOne({
        $or: [{ resourceId: resource.id }, { userEmail: resource.userEmail }],
      }).sort({ createdAt: -1 }).lean();
    }

    // 1. If stored in Cloudinary / Vercel Blob / S3 CDN, stream directly with attachment headers
    if (resource && resource.fileUrl && resource.fileUrl.startsWith("http") && !resource.fileUrl.includes("/uploads/")) {
      const downloadFilename = resource.name || resource.fileUrl.split("/").pop() || "download.pdf";
      const isPdf = downloadFilename.toLowerCase().endsWith(".pdf") || resource.fileUrl.toLowerCase().endsWith(".pdf");

      if (resource.fileUrl.includes("res.cloudinary.com")) {
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

      try {
        const blobResponse = await fetch(resource.fileUrl);
        if (blobResponse.ok && blobResponse.body) {
          return new NextResponse(blobResponse.body, {
            headers: {
              "Content-Type": isPdf ? "application/pdf" : (blobResponse.headers.get("content-type") || "application/octet-stream"),
              "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
              "Cache-Control": "public, max-age=31536000, immutable",
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
    let matchingFile = filesOnDisk.find((f) => f.startsWith(resourceId) || (resource && f.startsWith(resource.id)));
    let targetDir = uploadsDir;

    if (!matchingFile && isVercel) {
      // Check fallback public/uploads directory
      const localPublic = path.join(process.cwd(), "public", "uploads");
      const altFiles = await fs.readdir(localPublic).catch(() => []);
      matchingFile = altFiles.find((f) => f.startsWith(resourceId) || (resource && f.startsWith(resource.id)));
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
      const username = linkedPage.userEmail ? linkedPage.userEmail.split("@")[0] : "u";
      const targetSlug = linkedPage.slug || linkedPage.id;
      return NextResponse.redirect(new URL(`/${encodeURIComponent(username)}/${encodeURIComponent(targetSlug)}/thank-you`, req.url), 302);
    }
  } catch (err) {
    console.error("Error in /r/[id] direct handler:", err);
  }

  // If no file or page found, redirect cleanly to the homepage
  return NextResponse.redirect(new URL("/", req.url), 302);
}

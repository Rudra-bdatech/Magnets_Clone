import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { dbConnect } from "@/lib/mongodb";
import { ResourceModel } from "@/lib/models";
import { put } from "@vercel/blob";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

import { getAuthenticatedUserEmail } from "@/lib/auth";
import { getUserAssetFolder } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionEmail = await getAuthenticatedUserEmail();
    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    const normSessionEmail = sessionEmail.trim().toLowerCase();

    await dbConnect();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 15MB file size limit
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds maximum allowed limit of 15MB" }, { status: 400 });
    }

    // Prevent executable / hazardous script uploads
    const disallowedExtensions = [".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".jsx", ".ts", ".tsx", ".html", ".htm", ".vbs", ".ps1"];
    const ext = path.extname(file.name).toLowerCase();
    if (disallowedExtensions.includes(ext)) {
      return NextResponse.json({ error: "File type not permitted for upload" }, { status: 400 });
    }

    const id = Math.random().toString(36).substring(2, 9);
    const originalExt = path.extname(file.name);
    const safeFilename = `${id}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    let publicFileUrl = "";

    // 1. Upload to Cloudinary inside the tenant's isolated folder
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const tenantFolder = getUserAssetFolder(normSessionEmail);

        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: isImage ? "image" : "raw",
              public_id: isImage ? safeFilename.replace(/\.[^/.]+$/, "") : safeFilename,
              folder: tenantFolder,
              transformation: isImage ? [{ quality: "auto", fetch_format: "auto" }] : undefined,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        if (uploadResult && uploadResult.secure_url) {
          publicFileUrl = uploadResult.secure_url;
          if (isImage && publicFileUrl.includes("/image/upload/") && !publicFileUrl.includes("/f_auto,q_auto/")) {
            publicFileUrl = publicFileUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
          }
        }
      } catch (cloudinaryErr) {
        console.warn("Cloudinary upload warning, falling back:", cloudinaryErr);
      }
    }

    // 2. Fallback to Vercel Blob if Cloudinary failed or is missing
    if (!publicFileUrl && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(safeFilename, file, {
          access: "public",
        });
        publicFileUrl = blob.url;
      } catch (blobErr) {
        console.warn("Vercel Blob upload warning, using local/tmp fallback:", blobErr);
      }
    }

    // 3. Local disk / Vercel /tmp fallback
    if (!publicFileUrl) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const isVercel = Boolean(process.env.VERCEL);
      const uploadsDir = isVercel ? "/tmp" : path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

      const filePath = path.join(uploadsDir, safeFilename);
      await fs.writeFile(filePath, buffer);

      publicFileUrl = `${req.nextUrl.origin}/uploads/${safeFilename}`;
    }

    const downloadRouteUrl = `${req.nextUrl.origin}/r/${id}`;
    const isPageAsset = formData.get("isPageAsset") === "true";

    const newResource = {
      id,
      userEmail: normSessionEmail,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }),
      url: downloadRouteUrl,
      fileUrl: publicFileUrl,
      fileExt: originalExt,
      isPageAsset: isPageAsset,
      type: isPageAsset ? "page_asset" : "deliverable",
    };

    // Save metadata in DB for all uploads so ownership is verified and audited
    await ResourceModel.create(newResource);

    return NextResponse.json({ success: true, data: newResource });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

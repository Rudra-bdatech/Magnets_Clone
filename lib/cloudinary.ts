import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, ResourceModel, AccountModel } from "@/lib/models";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Returns the isolated tenant folder for a specific user.
 * e.g. "leadmagnets/u_a1b2c3d4e5f67890"
 */
export function getUserAssetFolder(userEmail: string | null | undefined): string {
  if (!userEmail || typeof userEmail !== "string") {
    throw new Error("Cannot determine tenant asset folder without a valid user email");
  }
  const cleanEmail = userEmail.trim().toLowerCase();
  const hash = crypto.createHash("sha256").update(cleanEmail).digest("hex").slice(0, 16);
  return `leadmagnets/u_${hash}`;
}

/**
 * Extracts public_id from Cloudinary URL.
 * Returns both stripped publicId (for images) and raw publicId with extension if applicable.
 */
export function extractCloudinaryPublicIdInfo(url: string | null | undefined): { publicId: string; rawPublicId: string } | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const folderIndex = url.indexOf("/leadmagnets/");
    if (folderIndex !== -1) {
      const pathWithExt = url.substring(folderIndex + 1);
      const cleanPath = pathWithExt.split("?")[0];
      const publicId = cleanPath.replace(/\.[^/.]+$/, "");
      return { publicId, rawPublicId: cleanPath };
    }

    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex !== -1) {
      let afterUpload = url.substring(uploadIndex + 8);
      afterUpload = afterUpload.split("?")[0];
      const parts = afterUpload.split("/");
      const validParts = parts.filter(
        (part) => !part.includes(",") && !/^v\d+$/.test(part)
      );
      const cleanPath = validParts.join("/");
      const publicId = cleanPath.replace(/\.[^/.]+$/, "");
      return { publicId, rawPublicId: cleanPath };
    }
  } catch (err) {
    console.warn("Failed to parse Cloudinary public_id from URL:", url, err);
  }

  return null;
}

export function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  const info = extractCloudinaryPublicIdInfo(url);
  return info ? info.publicId : null;
}

export interface AssetDeleteOptions {
  excludePageIds?: string[];
  excludeResourceIds?: string[];
}

/**
 * Validates that an authenticated user is strictly authorized to delete an asset.
 * Guarantees:
 * 1. Tenant folder boundary is strictly enforced. Assets uploaded to a different tenant's folder cannot be deleted.
 * 2. If it's a legacy asset (uploaded before tenant folders), ownership is checked via ResourceModel.
 * 3. Cross-account reference check: If ANY other account or page references this URL, deletion is completely blocked.
 * 4. Same-account active reference check: If the same user still references the asset in another active page or resource, deletion is skipped.
 */
export async function canUserDeleteAsset(
  url: string,
  userEmail: string,
  options?: AssetDeleteOptions
): Promise<{ allowed: boolean; reason?: string }> {
  if (!url || typeof url !== "string") {
    return { allowed: false, reason: "Invalid or empty asset URL" };
  }
  if (!userEmail || typeof userEmail !== "string") {
    return { allowed: false, reason: "Unauthorized: Missing authenticated user email" };
  }

  const normEmail = userEmail.trim().toLowerCase();
  const idInfo = extractCloudinaryPublicIdInfo(url);
  if (!idInfo) {
    return { allowed: false, reason: "Not a recognized Cloudinary URL" };
  }

  const { publicId } = idInfo;
  const userFolder = getUserAssetFolder(normEmail);

  // ── Layer 1: Strict Tenant Folder Boundary ──────────────────────────
  if (publicId.startsWith("leadmagnets/u_")) {
    if (!publicId.startsWith(`${userFolder}/`)) {
      return {
        allowed: false,
        reason: `Access Denied: Asset belongs to another tenant folder (Expected: ${userFolder}, Got: ${publicId})`,
      };
    }
  }

  await dbConnect();

  // ── Layer 2: Resource Ownership Audit ──────────────────────────────
  const resourceDoc = await ResourceModel.findOne({
    $or: [{ fileUrl: url }, { url: url }],
  }).select("userEmail id").lean();

  if (resourceDoc && (resourceDoc as any).userEmail) {
    const resourceOwner = String((resourceDoc as any).userEmail).trim().toLowerCase();
    if (resourceOwner !== normEmail) {
      return {
        allowed: false,
        reason: `Access Denied: Asset is registered to user ${resourceOwner}`,
      };
    }
  }

  // ── Layer 3: Cross-Account Reference Check ─────────────────────────
  // Ensure NO other user's page references this URL
  const otherUserPage = await MagnetPageModel.findOne({
    userEmail: { $ne: normEmail },
    $or: [
      { imageUrl: url },
      { variantBImage: url },
      { pdfPages: url },
      { assetUrl: url },
      { pdfUrl: url },
    ],
  }).select("id userEmail").lean();

  if (otherUserPage) {
    return {
      allowed: false,
      reason: `Safety block: Asset is referenced by another user's page (${(otherUserPage as any).id})`,
    };
  }

  // Ensure NO other user's account references this URL (e.g. brand logo, avatar)
  const otherUserAccount = await AccountModel.findOne({
    email: { $ne: normEmail },
    $or: [
      { avatar: url },
      { logo: url },
      { customFavicon: url },
    ],
  }).select("email").lean();

  if (otherUserAccount) {
    return {
      allowed: false,
      reason: "Safety block: Asset is referenced by another user's account settings",
    };
  }

  // ── Layer 4: Same-User Active Reference Check ──────────────────────
  // If the same user still uses this asset on another page, do NOT delete it from Cloudinary!
  const excludePageIds = options?.excludePageIds?.filter(Boolean) || [];
  const sameUserPage = await MagnetPageModel.findOne({
    userEmail: normEmail,
    ...(excludePageIds.length > 0 ? { id: { $nin: excludePageIds } } : {}),
    $or: [
      { imageUrl: url },
      { variantBImage: url },
      { pdfPages: url },
      { assetUrl: url },
      { pdfUrl: url },
    ],
  }).select("id").lean();

  if (sameUserPage) {
    return {
      allowed: false,
      reason: `Safe retention: Asset is still actively used on your page "${(sameUserPage as any).id}"`,
    };
  }

  // If the asset is still in the user's media library as a resource
  const excludeResIds = options?.excludeResourceIds?.filter(Boolean) || [];
  const activeResource = await ResourceModel.findOne({
    userEmail: normEmail,
    ...(excludeResIds.length > 0 ? { id: { $nin: excludeResIds } } : {}),
    $or: [{ fileUrl: url }, { url: url }],
  }).select("id").lean();

  if (activeResource) {
    return {
      allowed: false,
      reason: `Safe retention: Asset is still present in your media library`,
    };
  }

  return { allowed: true };
}

/**
 * Permanently deletes a single asset from Cloudinary using its URL.
 * REQUIRES userEmail for multi-tenant safety validation.
 */
export async function deleteCloudinaryAsset(
  url: string | null | undefined,
  userEmail: string | null | undefined,
  options?: AssetDeleteOptions
): Promise<boolean> {
  if (!url || !userEmail) {
    console.warn("[Cloudinary cleanup] Missing URL or userEmail. Deletion skipped.");
    return false;
  }

  if (!url.includes("cloudinary.com")) {
    return false;
  }

  const check = await canUserDeleteAsset(url, userEmail, options);
  if (!check.allowed) {
    console.warn(`[Cloudinary delete blocked] ${check.reason} (URL: ${url})`);
    return false;
  }

  const idInfo = extractCloudinaryPublicIdInfo(url);
  if (!idInfo) return false;
  const { publicId, rawPublicId } = idInfo;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("Cloudinary credentials not set, skipping remote deletion for:", publicId);
    return false;
  }

  try {
    const resImage = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    if (resImage?.result === "ok") {
      console.log(`Successfully deleted Cloudinary image asset: ${publicId}`);
      return true;
    }

    if (resImage?.result === "not_found") {
      let resRaw = await cloudinary.uploader.destroy(publicId, { resource_type: "raw", invalidate: true });
      if (resRaw?.result !== "ok" && rawPublicId && rawPublicId !== publicId) {
        resRaw = await cloudinary.uploader.destroy(rawPublicId, { resource_type: "raw", invalidate: true });
      }
      if (resRaw?.result === "ok") {
        console.log(`Successfully deleted Cloudinary raw asset: ${publicId}`);
        return true;
      }
    }
  } catch (err) {
    console.error(`Error deleting Cloudinary asset (${publicId}):`, err);
  }

  return false;
}

/**
 * Permanently deletes multiple assets from Cloudinary in parallel.
 * REQUIRES userEmail for multi-tenant safety validation.
 */
export async function deleteCloudinaryAssets(
  urls: (string | null | undefined)[],
  userEmail: string | null | undefined,
  options?: AssetDeleteOptions
): Promise<void> {
  if (!userEmail) {
    console.warn("[Cloudinary batch cleanup] Missing userEmail, skipping deletion.");
    return;
  }
  const validUrls = Array.from(new Set(urls.filter((u): u is string => Boolean(u && typeof u === "string"))));
  if (validUrls.length === 0) return;

  await Promise.allSettled(validUrls.map((url) => deleteCloudinaryAsset(url, userEmail, options)));
}

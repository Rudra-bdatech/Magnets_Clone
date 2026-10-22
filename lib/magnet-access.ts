import crypto from "crypto";

/**
 * Access tokens for lead magnet deliverables.
 *
 * The thank-you page (/<user>/<slug>/thank-you) and download links (/r/<id>) are only
 * served with `?t=<token>`, where the token is an HMAC of the page or resource id.
 * Tokens are handed out after a visitor submits the signup form (and in the delivery
 * and sequence emails), so the page slug or resource id alone no longer skips the form.
 */

const JWT_SECRET = process.env.JWT_SECRET;

// Domain-separated from session and PDF unlock tokens, so one can never stand in for another
function accessKey(): string {
  if (!JWT_SECRET) throw new Error("[magnet-access] JWT_SECRET is not set");
  return crypto.createHmac("sha256", JWT_SECRET).update("leadmagnets_magnet_access_v1").digest("hex");
}

export function signMagnetAccess(id: string): string {
  return crypto.createHmac("sha256", accessKey()).update(String(id)).digest("base64url").slice(0, 32);
}

export function verifyMagnetAccess(id: string | null | undefined, token: string | null | undefined): boolean {
  if (!id || !token || typeof token !== "string") return false;
  const expected = Buffer.from(signMagnetAccess(id));
  const actual = Buffer.from(token);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/** `/r/<id>` with its access token, e.g. for links rendered on the thank-you page. */
export function signedDownloadPath(id: string): string {
  return `/r/${id}?t=${signMagnetAccess(id)}`;
}

/** Appends `t=<token for id>` to `url` (relative or absolute). */
export function withMagnetAccess(url: string, id: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${signMagnetAccess(id)}`;
}

/**
 * Base URL for signed links (downloads, thank-you pages, unsubscribe) put into emails.
 * Tokens are signed with this server's JWT_SECRET, so in local development the links must
 * come back to this server: pointing them at NEXT_PUBLIC_APP_URL (production) would hand
 * production a token signed with the local secret, which it rejects.
 */
export function emailLinkBaseUrl(requestOrigin?: string | null): string {
  const origin = (requestOrigin || "").replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") {
    return origin || `http://localhost:${process.env.PORT || 3000}`;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || origin || "https://magnets.bdatech.in").replace(/\/$/, "");
}

function isOwnHost(host: string): boolean {
  const h = host.toLowerCase();
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
  return (
    h === "localhost:3000" ||
    (process.env.NODE_ENV === "development" && h.startsWith("localhost:")) ||
    h === "localhost" ||
    h === "magnets.bdatech.in" ||
    h.endsWith(".vercel.app") || // preview deployments (uploads store the origin they were made on)
    (configured !== "" && h === configured)
  );
}

const DOWNLOAD_LINK_RE = /(https?:\/\/([^\s"'<>/]+))\/r\/([A-Za-z0-9_-]+)(\?[^\s"'<>#]*)?/g;

/**
 * Adds access tokens to absolute links to our own `/r/<id>` route inside an email body
 * (owners paste these links into delivery and sequence emails). Only ids of `ownerEmail`'s
 * own resources and pages are signed: the body is owner-written, and signing any id in it
 * would let one owner mint download links for another account's page. Links that already
 * carry a `t=` parameter and links to other sites are left untouched.
 */
export async function signDownloadLinks(html: string, ownerEmail: string | null | undefined): Promise<string> {
  const owner = (ownerEmail || "").toLowerCase().trim();
  if (!html || !owner) return html;

  const ids = Array.from(new Set(Array.from(html.matchAll(DOWNLOAD_LINK_RE), (m) => m[3])));
  if (ids.length === 0) return html;

  const { ResourceModel, MagnetPageModel } = await import("@/lib/models");
  const [resources, pages] = await Promise.all([
    ResourceModel.find({ id: { $in: ids }, userEmail: owner }, { id: 1 }).lean(),
    MagnetPageModel.find({ userEmail: owner, $or: [{ id: { $in: ids } }, { slug: { $in: ids } }] }, { id: 1, slug: 1 }).lean(),
  ]);
  const owned = new Set<string>();
  for (const r of resources as any[]) owned.add(r.id);
  for (const p of pages as any[]) {
    if (p.id) owned.add(p.id);
    if (p.slug) owned.add(p.slug);
  }

  return html.replace(
    DOWNLOAD_LINK_RE,
    (match, origin: string, host: string, id: string, query: string | undefined) => {
      if (!owned.has(id) || !isOwnHost(host)) return match;
      if (query && /[?&](amp;)?t=/.test(query)) return match;
      const base = `${origin}/r/${id}`;
      const token = signMagnetAccess(id);
      return query ? `${base}${query}&t=${token}` : `${base}?t=${token}`;
    }
  );
}

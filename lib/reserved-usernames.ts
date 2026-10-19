/**
 * Reserved Usernames Specification & Validation
 *
 * Prevents account handles from colliding with Next.js top-level routes (e.g. /api, /dashboard, /r),
 * system static assets, and administrative handles.
 */

export const RESERVED_USERNAMES = new Set([
  // Next.js top-level routes
  "api",
  "dashboard",
  "r",
  "login",
  "register",
  "checkout",
  "privacy",
  "terms",
  "stop",
  "forgot-password",
  "reset-password",
  "pdf-viewer",
  "pdf-proxy",
  "custom-domain",
  "domain-resolver",
  "not-found",

  // Static routes, assets, and metadata
  "brand",
  "assets",
  "public",
  "static",
  "favicon",
  "favicon.ico",
  "robots",
  "robots.txt",
  "sitemap",
  "sitemap.xml",
  "sitemap.ts",

  // Admin & impersonation protection
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "official",
  "leadmagnets",
  "magnets",
  "bdatech",
  "staff",
  "team",
  "system",
  "moderator",
  "security",
  "abuse",
  "postmaster",
  "webmaster",

  // System keywords & placeholders
  "auth",
  "oauth",
  "webhook",
  "webhooks",
  "app",
  "settings",
  "account",
  "user",
  "profile",
  "null",
  "undefined",
  "anonymous",
  "guest",
  "test",
  "demo",
]);

/**
 * Checks whether a given username is reserved.
 */
export function isReservedUsername(username: string): boolean {
  if (!username) return true;
  const clean = String(username).trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return RESERVED_USERNAMES.has(clean);
}

/**
 * Generates a safe, non-reserved candidate username from a raw string.
 * If candidate is reserved or empty, appends random digits.
 */
export function makeSafeUsernameCandidate(raw: string): string {
  const clean = (raw || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15) || "user";
  if (isReservedUsername(clean)) {
    return `${clean.slice(0, 10)}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return clean;
}

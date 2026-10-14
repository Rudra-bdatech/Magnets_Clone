/**
 * Utility functions for custom domain verification, subdomain sanitization,
 * and deterministic token generation for TXT & CNAME DNS records.
 */

/**
 * Strips protocol, port, trailing slashes, and paths from domain strings.
 * e.g. "https://MyBrand.com/path" -> "mybrand.com"
 */
export function cleanDomain(domain?: string): string {
  if (!domain) return "";
  return domain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

/**
 * Sanitizes page subdomain.
 * Only allows lowercase alphanumeric chars and hyphens.
 * Defaults to "get" if empty or invalid.
 * e.g. "  RESOURCES! " -> "resources"
 * e.g. "" -> "get"
 */
export function formatSubdomain(subdomain?: string): string {
  if (!subdomain) return "get";
  const sanitized = subdomain
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, ""); // strip leading/trailing hyphens
  return sanitized || "get";
}

/**
 * Generates a deterministic, per-user verification token for TXT DNS verification.
 * Includes the user's email in the hash salt to prevent domain squatting:
 * two different users claiming the same domain get different tokens.
 * Works consistently across both Client (browser) and Server (Node/Edge).
 * Format: lm_verify_<clean_prefix>_<deterministic_hex_hash>
 */
export function getDomainVerificationToken(domain: string, userEmail?: string): string {
  const clean = cleanDomain(domain);
  if (!clean) return "";

  // Include userEmail in the salt to make tokens per-user (prevents domain squatting)
  const normalizedEmail = (userEmail || "").trim().toLowerCase();

  // 32-bit FNV-1a hash algorithm (deterministic across all JS runtimes)
  let hash = 0x811c9dc5;
  const str = `leadmagnets_verification_salt_${clean}_${normalizedEmail}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  const hexHash = (hash >>> 0).toString(16).padStart(8, "0");
  const alphanumericPrefix = clean.replace(/[^a-z0-9]/g, "").slice(0, 12);

  return `lm_verify_${alphanumericPrefix}_${hexHash}`;
}

/**
 * Formats full custom domain URL with protocol and sanitized subdomain.
 * e.g. ("example.com", "get") -> "https://get.example.com"
 * e.g. ("example.com", "") -> "https://get.example.com"
 */
export function formatCustomDomainUrl(domain: string, subdomain?: string): string {
  const clean = cleanDomain(domain);
  if (!clean) return "";
  const sub = formatSubdomain(subdomain);
  return `https://${sub}.${clean}`;
}

/**
 * Formats full host string without protocol.
 * e.g. ("example.com", "get") -> "get.example.com"
 */
export function formatFullHost(domain: string, subdomain?: string): string {
  const clean = cleanDomain(domain);
  if (!clean) return "";
  const sub = formatSubdomain(subdomain);
  return `${sub}.${clean}`;
}

/**
 * Best-effort removal of a customer's custom domain from our Vercel project.
 * No-op when Vercel credentials aren't configured. Never throws.
 */
export async function removeDomainFromVercel(domain: string, subdomain?: string): Promise<void> {
  const vercelToken = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID || process.env.PROJECT_ID_VERCEL;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;
  const fullHost = formatFullHost(domain, subdomain);
  if (!vercelToken || !vercelProjectId || !fullHost) return;

  try {
    const teamParam = vercelTeamId ? `?teamId=${vercelTeamId}` : "";
    await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${fullHost}${teamParam}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (vercelErr) {
    console.warn("Failed to delete domain from Vercel:", vercelErr);
  }
}

/** Vercel's documented CNAME target for project domains. */
export const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";

/**
 * Host customers should point their subdomain CNAME at.
 * Shared by the dashboard and the verifier so the two cannot drift.
 */
export function getCnameTarget(appUrl?: string): string {
  const raw =
    process.env.NEXT_PUBLIC_CNAME_TARGET ||
    appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.CNAME_TARGET ||
    "magnets.bdatech.in";
  const cleaned = cleanDomain(raw);
  if (!cleaned || cleaned === "localhost" || cleaned === "127.0.0.1") {
    return "magnets.bdatech.in";
  }
  return cleaned;
}

/**
 * True only when the CNAME target is this app, or Vercel's exact edge hostname.
 * A record that merely contains "vercel" or "leadmagnets" does not match.
 */
export function cnameRecordMatchesTarget(record: string, target: string): boolean {
  const rec = record.toLowerCase().trim().replace(/\.$/, "").replace(/^"+|"+$/g, "");
  const expected = cleanDomain(target);
  if (!rec || !expected) return false;
  return rec === expected || rec === VERCEL_CNAME_TARGET;
}

/** True when host is the apex or a real subdomain of apex, not a lookalike suffix. */
export function isPlatformHost(host: string, apex: string): boolean {
  const normalizedHost = cleanDomain(host);
  const normalizedApex = cleanDomain(apex);
  if (!normalizedHost || !normalizedApex) return false;
  return normalizedHost === normalizedApex || normalizedHost.endsWith(`.${normalizedApex}`);
}

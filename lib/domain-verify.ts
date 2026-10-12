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

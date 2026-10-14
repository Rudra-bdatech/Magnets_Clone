/**
 * Strict internal redirect sanitizer.
 * Protects against open redirect attacks including:
 * - Protocol-relative URLs (e.g. "//evil.com")
 * - Backslash normalization tricks (e.g. "/\\evil.com", "/\\\\evil.com")
 * - External absolute URLs (e.g. "https://evil.com")
 * - Script execution schemas (e.g. "javascript:...")
 */
export function sanitizeRedirect(target: string | null | undefined, fallback: string = "/dashboard"): string {
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();

  // Must start with exactly one forward slash, never another slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("\\")) {
    return fallback;
  }

  // Validate using WHATWG URL parser against a dummy localhost origin
  try {
    const parsed = new URL(trimmed, "http://localhost");
    // Ensure the origin cannot be manipulated and remains on the local origin
    if (parsed.origin !== "http://localhost" || parsed.hostname !== "localhost") {
      return fallback;
    }
    // Double check pathname does not begin with multiple slashes or backslashes
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//") || parsed.pathname.includes("\\")) {
      return fallback;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

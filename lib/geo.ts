import { getClientIp } from "@/lib/rate-limit";

export interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  ip: string;
}

/**
 * Converts a 2-letter ISO country code into its corresponding flag emoji.
 * e.g., "IN" -> "🇮🇳", "US" -> "🇺🇸", "CH" -> "🇨🇭"
 */
export function getCountryFlag(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  const char1 = 127397 + code.charCodeAt(0);
  const char2 = 127397 + code.charCodeAt(1);
  return String.fromCodePoint(char1, char2);
}

function sanitizeGeoString(val: any): string {
  if (typeof val !== "string") return "";
  const trimmed = val.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") return "";
  return trimmed.slice(0, 100);
}

/**
 * Extracts geolocation data (city, country, region, IP) using server-side headers
 * (Vercel edge headers, Cloudflare, or fallback GeoIP lookup) without asking user permission.
 */
export async function getGeoFromHeaders(
  headersObj?: Headers | { get(name: string): string | null } | null,
  overrideIp?: string
): Promise<GeoLocation> {
  const result: GeoLocation = {
    country: "",
    countryCode: "",
    city: "",
    region: "",
    ip: "",
  };

  try {
    let headers = headersObj;
    if (!headers) {
      try {
        const { headers: nextHeaders } = await import("next/headers");
        headers = nextHeaders();
      } catch {
        // Not in request scope
      }
    }

    const ip =
      overrideIp ||
      (headers && typeof headers.get === "function" ? getClientIp(headers as Headers) : "") ||
      "";
    result.ip = ip === "unknown" ? "" : ip;

    if (headers && typeof headers.get === "function") {
      const vercelCountry = headers.get("x-vercel-ip-country");
      const vercelCity = headers.get("x-vercel-ip-city");
      const vercelRegion = headers.get("x-vercel-ip-country-region");

      if (vercelCountry) {
        result.countryCode = sanitizeGeoString(vercelCountry).toUpperCase();
        result.country = sanitizeGeoString(decodeURIComponent(vercelCountry));
        if (vercelCity) {
          result.city = sanitizeGeoString(decodeURIComponent(vercelCity));
        }
        if (vercelRegion) {
          result.region = sanitizeGeoString(decodeURIComponent(vercelRegion));
        }
        return result;
      }

      // Cloudflare fallback headers
      const cfCountry = headers.get("cf-ipcountry");
      const cfCity = headers.get("cf-ipcity");
      const cfRegion = headers.get("cf-region");
      if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
        result.countryCode = sanitizeGeoString(cfCountry).toUpperCase();
        result.country = result.countryCode;
        if (cfCity) result.city = sanitizeGeoString(decodeURIComponent(cfCity));
        if (cfRegion) result.region = sanitizeGeoString(decodeURIComponent(cfRegion));
        return result;
      }
    }

    // Localhost / Development fallback
    if (!result.ip || result.ip === "unknown" || result.ip.startsWith("127.") || result.ip === "::1" || result.ip === "localhost") {
      result.country = "Local Dev";
      result.city = "localhost";
      return result;
    }

    // Optional remote GeoIP fallback when edge headers are absent (e.g. self-hosted docker/node)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://ipapi.co/${result.ip}/json/`, {
        signal: controller.signal,
        headers: { "User-Agent": "magnets-signup-geo/1.0" },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          result.country = sanitizeGeoString(data.country_name || data.country);
          result.countryCode = sanitizeGeoString(data.country_code).toUpperCase();
          result.city = sanitizeGeoString(data.city);
          result.region = sanitizeGeoString(data.region);
        }
      }
    } catch {
      // Non-blocking: fail gracefully with whatever is known
    }
  } catch (err) {
    console.error("[geo] Failed to resolve geo data:", err);
  }

  return result;
}

import dns from "dns/promises";
import net from "net";

/**
 * Checks whether an IP address is private, loopback, link-local, multicast, or reserved.
 */
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    // 0.0.0.0/8 (unspecified)
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (link-local, cloud instance metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 224.0.0.0/4 (multicast) & 240.0.0.0/4 (reserved)
    if (parts[0] >= 224) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    // ::1 (loopback) or :: (unspecified)
    if (lower === "::1" || lower === "::") return true;
    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (lower.startsWith("::ffff:")) {
      const ipv4Part = lower.substring(7);
      return isPrivateIp(ipv4Part);
    }
    // fe80::/10 (link-local)
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    // fc00::/7 (unique local address)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    return false;
  }

  return true;
}

/**
 * Checks if a host name or IP resolves to private/internal networks or cloud metadata.
 */
export async function isPrivateOrReservedHost(host: string): Promise<boolean> {
  const cleanHost = (host || "").trim().toLowerCase();
  if (!cleanHost) return true;

  // Block localhost, .internal, .local, .lan
  if (
    cleanHost === "localhost" ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.endsWith(".internal") ||
    cleanHost.endsWith(".local") ||
    cleanHost.endsWith(".lan")
  ) {
    return true;
  }

  // If already an IP address
  if (net.isIP(cleanHost)) {
    return isPrivateIp(cleanHost);
  }

  try {
    const results = await dns.lookup(cleanHost, { all: true });
    if (!results || results.length === 0) return true;
    return results.some((r) => isPrivateIp(r.address));
  } catch {
    // If DNS resolution fails, reject to be safe
    return true;
  }
}

/**
 * Validates a full URL string to ensure it's http/https and targets a safe public host.
 */
export async function isPrivateOrReservedUrl(urlString: string): Promise<boolean> {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return true;
    }
    return await isPrivateOrReservedHost(parsed.hostname);
  } catch {
    return true;
  }
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getToken } from "next-auth/jwt";
import { isPlatformHost } from "@/lib/domain-verify";

/**
 * Edge-compatible HMAC-SHA256 JWT Verification using Web Crypto API (crypto.subtle)
 * Runs in microseconds in Edge Runtime without importing Node.js `crypto`
 */
async function verifySessionTokenEdge(token: string, secret: string): Promise<boolean> {
  try {
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Base64URL decode signature
    const base64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const paddedSig = base64 + "=".repeat(padLen);
    const binarySig = Uint8Array.from(atob(paddedSig), (c) => c.charCodeAt(0));

    // Verify signature
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      binarySig,
      encoder.encode(dataToSign)
    );

    if (!isValid) return false;

    // Verify expiration timestamp
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false; // Token expired
    }

    // Security check: strictly reject PDF unlock tokens or any non-session tokens
    if (payload.type && payload.type !== "session") {
      return false;
    }
    if (payload.magnetId || payload.pdfPages || payload.unlockedAt || payload.type === "pdf_unlock") {
      return false;
    }
    if (!payload.email || typeof payload.email !== "string") {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawHost = request.headers.get("host") || "";
  const host = rawHost.split(":")[0].toLowerCase();
  const ip = request.ip || request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const secret = process.env.JWT_SECRET || "";

  const sessionToken = request.cookies.get("session_token")?.value;
  const rawNextAuthToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Real cryptographic HMAC verification for Edge Runtime
  const isValidCustomSession = sessionToken && secret
    ? await verifySessionTokenEdge(sessionToken, secret)
    : false;

  let isValidNextAuthSession = false;
  if (rawNextAuthToken && process.env.NEXTAUTH_SECRET) {
    try {
      const nextAuthPayload = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (nextAuthPayload && nextAuthPayload.email) {
        isValidNextAuthSession = true;
      }
    } catch {
      isValidNextAuthSession = false;
    }
  }

  const isValidSession = Boolean(isValidCustomSession || isValidNextAuthSession);

  // Rate Limiting Protection for Auth & Domain Verification API Endpoints
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/domain") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/forgot-password")
  ) {
    const { success, reset } = await checkRateLimit(ip, "auth_limit", 30, 60 * 1000);
    if (!success) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: `Too many requests. Please wait ${reset} seconds before trying again.` },
          { status: 429 }
        );
      }
    }
  }

  // Configured app domain from environment
  const configuredHost = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0].toLowerCase()
    : "";

  // Custom domain detection (non-primary domains).
  // Match the apex or a real subdomain. A lookalike such as "evilleadmagnets.so"
  // must stay on the custom-domain path.
  const isPrimaryDomain =
    isPlatformHost(host, "localhost") ||
    host === "127.0.0.1" ||
    isPlatformHost(host, "vercel.app") ||
    isPlatformHost(host, "leadmagnets.so") ||
    isPlatformHost(host, "magnets.bdatech.in") ||
    (configuredHost ? isPlatformHost(host, configuredHost) : false);

  // Block direct access to internal /custom-domain route on primary domain
  if (isPrimaryDomain && (pathname === "/custom-domain" || pathname.startsWith("/custom-domain/"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Custom domain routing: when traffic arrives on a non-primary domain (e.g. get.yourbrand.com)
  if (!isPrimaryDomain) {
    // If internal platform routes (dashboard, login, register, password reset) are accessed on a custom domain, redirect to main platform
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/forgot-password")
    ) {
      const mainAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
      return NextResponse.redirect(new URL(pathname, mainAppUrl));
    }

    // Exclude API routes, Next.js static internals, and static assets with file extensions (.png, .svg, .mjs, .ico, etc.)
    const isStaticAsset =
      pathname.includes(".") ||
      pathname.startsWith("/brand/") ||
      pathname.startsWith("/public/") ||
      pathname.startsWith("/icons/") ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml";

    // Exclude standalone platform utility routes that must render on their own
    const isExcludedPath =
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/pdf-viewer") ||
      pathname.startsWith("/stop") ||
      pathname.startsWith("/r") ||
      pathname.startsWith("/privacy") ||
      pathname.startsWith("/terms") ||
      pathname.startsWith("/custom-domain") ||
      isStaticAsset;

    // Rewrite public pages to our dedicated server-side domain resolver route.
    if (!isExcludedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/custom-domain";
      url.searchParams.set("host", host);
      url.searchParams.set("path", pathname || "/");

      // Pass x-custom-domain as incoming REQUEST headers so Server Components can read them via headers()
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-custom-domain", host);
      requestHeaders.set("x-original-path", pathname || "/");

      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // Protect /dashboard routes on primary domain — require cryptographically signed session
  if (pathname.startsWith("/dashboard")) {
    if (!isValidSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (sessionToken && !isValidCustomSession) {
        res.cookies.delete("session_token");
      }
      if (rawNextAuthToken && !isValidNextAuthSession) {
        res.cookies.delete("next-auth.session-token");
        res.cookies.delete("__Secure-next-auth.session-token");
      }
      return res;
    }
  }

  // Redirect authenticated users away from /login and /register if they already have a valid session
  if (pathname === "/login" || pathname === "/register") {
    if (isValidSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Clean up stale or invalid cookies when visiting login/register so the client starts in a clean state
    if ((sessionToken && !isValidCustomSession) || (rawNextAuthToken && !isValidNextAuthSession)) {
      const response = NextResponse.next();
      if (sessionToken && !isValidCustomSession) {
        response.cookies.delete("session_token");
      }
      if (rawNextAuthToken && !isValidNextAuthSession) {
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


import crypto from "crypto";

const _JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!_JWT_SECRET_RAW) {
  throw new Error(
    "[auth] JWT_SECRET environment variable is required but not set. " +
    "Generate one with: openssl rand -hex 64 — then add it to your .env.local and Vercel environment settings."
  );
}
const JWT_SECRET = _JWT_SECRET_RAW;
export const AUTH_COOKIE_NAME = "session_token";

export interface SessionUser {
  email: string;
  name?: string;
  type?: "session";
  iat?: number;
  exp?: number;
  tokenVersion?: number;
  /** True when the account's email was verified at the time this token was issued. */
  ev?: boolean;
}

// Cryptographically domain-separated secret for PDF unlock tokens.
// This prevents PDF unlock tokens from ever being verified or accepted as dashboard login sessions.
const PDF_UNLOCK_SECRET = crypto
  .createHmac("sha256", JWT_SECRET)
  .update("leadmagnets_pdf_unlock_subsystem_secret_v1")
  .digest("hex");

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function createSessionToken(payload: { email: string; name?: string; tokenVersion?: number; ev?: boolean }, expiresInDays = 30): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInDays * 24 * 60 * 60;

  const fullPayload: SessionUser = {
    ...payload,
    type: "session",
    iat: now,
    exp,
    tokenVersion: typeof payload.tokenVersion === "number" ? payload.tokenVersion : 0,
    ev: payload.ev === true,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(dataToSign)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function safeCompareSignatures(sigA: string, sigB: string): boolean {
  if (!sigA || !sigB) return false;
  const bufA = Buffer.from(sigA);
  const bufB = Buffer.from(sigB);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(dataToSign)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (!safeCompareSignatures(signature, expectedSignature)) return null;

    const payload: any = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Security check: reject PDF unlock tokens or any non-session token
    if (payload.type && payload.type !== "session") {
      return null;
    }
    if (payload.magnetId || payload.pdfPages || payload.unlockedAt || payload.type === "pdf_unlock") {
      return null;
    }

    if (!payload.email || typeof payload.email !== "string") {
      return null;
    }

    return payload as SessionUser;
  } catch (e) {
    return null;
  }
}

export interface PdfUnlockPayload {
  magnetId: string;
  email: string;
  pdfPages?: string[];
  unlockedAt?: number;
  type?: "pdf_unlock";
  iat?: number;
  exp?: number;
}

export function createPdfUnlockToken(
  payload: { magnetId: string; email: string; pdfPages?: string[] },
  expiresInDays = 30
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInDays * 24 * 60 * 60;

  const fullPayload: PdfUnlockPayload = {
    ...payload,
    type: "pdf_unlock",
    unlockedAt: Date.now(),
    iat: now,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", PDF_UNLOCK_SECRET)
    .update(dataToSign)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyPdfUnlockToken(token: string): PdfUnlockPayload | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    // Verify signature with dedicated PDF_UNLOCK_SECRET
    const expectedSignature = crypto
      .createHmac("sha256", PDF_UNLOCK_SECRET)
      .update(dataToSign)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    let isSigValid = safeCompareSignatures(signature, expectedSignature);

    // Fallback: support legacy tokens signed with JWT_SECRET so existing visitors don't get locked out
    if (!isSigValid) {
      const legacySignature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(dataToSign)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      isSigValid = safeCompareSignatures(signature, legacySignature);
    }

    if (!isSigValid) return null;

    const payload: PdfUnlockPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Must have magnetId to be a valid PDF unlock token
    if (!payload.magnetId) {
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

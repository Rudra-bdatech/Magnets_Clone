import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Upstash Redis Rate Limiter (Production) ───────────────────────────────
// Shared across ALL Vercel serverless instances — the only correct approach
// for serverless deployments. Falls back to in-memory if env vars are missing.

const REDIS_PREFIX = "leadmagnets_rl";
// Give up on Redis well before Upstash's 5s default so a slow Redis cannot stall requests.
const REDIS_TIMEOUT_MS = 2000;

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    console.error("[rate-limit] Failed to initialise Upstash Redis. Falling back to in-memory limiter.", e);
  }
} else if (process.env.NODE_ENV === "production") {
  console.error(
    "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. " +
    "Using the in-memory limiter, which is NOT shared between serverless instances."
  );
}

// One Upstash limiter per (limit, window) pair, so every route gets the limit it asks for.
// The route key is part of the identifier, so routes sharing a pair still count separately.
const redisLimiters = new Map<string, Ratelimit>();

function getRedisLimiter(client: Redis, limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = redisLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      // Sliding window: counts requests in a rolling time window
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: REDIS_PREFIX,
      timeout: REDIS_TIMEOUT_MS,
      // Remembers blocked identifiers in this instance so repeat abuse skips the Redis call
      ephemeralCache: new Map(),
    });
    redisLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ─── In-Memory Fallback (Development / Upstash not configured) ─────────────
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

function checkInMemoryRateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const mapKey = `${key}:${ip}`;
  const record = rateLimitMap.get(mapKey);

  // Periodically purge expired entries to prevent memory leaks
  if (rateLimitMap.size > 5000) {
    rateLimitMap.forEach((v, k) => {
      if (v.resetTime < now) rateLimitMap.delete(k);
    });
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(mapKey, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: Math.ceil(windowMs / 1000), unavailable: false };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: Math.ceil((record.resetTime - now) / 1000), unavailable: false };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, reset: Math.ceil((record.resetTime - now) / 1000), unavailable: false };
}

// ─── Public API ─────────────────────────────────────────────────────────────
export interface RateLimitOptions {
  /**
   * When Redis errors or times out: true blocks the request, false lets it through.
   * Use true for routes attackers target (login, OTP, password reset, sending email),
   * false for routes where an outage should not take the feature down (lead capture, AI).
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Seconds until the caller may retry. */
  reset: number;
  /** True when the request was blocked because the limiter itself was unavailable. */
  unavailable: boolean;
}

// Retry hint returned when a fail-closed route is blocked because Redis is unavailable.
const UNAVAILABLE_RETRY_SECONDS = 30;

/**
 * Checks the rate limit for the given identifier (usually an IP or email) and key.
 * Uses Upstash Redis in production (shared across all serverless instances) and
 * enforces exactly `limit` requests per `windowMs` for this key.
 * Falls back to in-memory if Upstash is not configured (local dev).
 */
export async function checkRateLimit(
  ip: string,
  key: string = "global",
  limit: number = 30,
  windowMs: number = 60 * 1000,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  if (redis) {
    const failure = (reason: unknown): RateLimitResult => {
      if (options.failClosed) {
        console.error(`[rate-limit] Redis unavailable for "${key}", blocking request (fail closed):`, reason);
        return { success: false, remaining: 0, reset: UNAVAILABLE_RETRY_SECONDS, unavailable: true };
      }
      console.warn(`[rate-limit] Redis unavailable for "${key}", allowing request (fail open):`, reason);
      return { success: true, remaining: limit, reset: Math.ceil(windowMs / 1000), unavailable: false };
    };

    try {
      const result = await getRedisLimiter(redis, limit, windowMs).limit(`${key}:${ip}`);
      // On timeout Upstash reports success: true without counting the request.
      if (result.reason === "timeout") return failure("timeout");
      if (!result.success) {
        console.warn(`[rate-limit] Blocked "${key}" for ${ip}`);
      }
      return {
        success: result.success,
        remaining: result.remaining,
        reset: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        unavailable: false,
      };
    } catch (e) {
      return failure(e);
    }
  }

  // Fallback: in-memory (works only on single-instance / local dev)
  return checkInMemoryRateLimit(ip, key, limit, windowMs);
}

/**
 * Builds the 429/503 response body for a blocked request.
 * A limiter outage gets an honest "temporarily unavailable" message instead of blaming the user.
 */
export function rateLimitMessage(rl: RateLimitResult, limitedMessage: string): { error: string; status: number } {
  if (rl.unavailable) {
    return {
      error: "This action is temporarily unavailable. Please try again in a moment.",
      status: 503,
    };
  }
  return { error: limitedMessage, status: 429 };
}

/**
 * Client IP for rate limiting. On Vercel, x-real-ip and x-forwarded-for are set by
 * the platform and cannot be spoofed by the client.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

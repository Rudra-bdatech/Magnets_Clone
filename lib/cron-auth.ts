import crypto from "crypto";
import type { NextRequest } from "next/server";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * True when the request carries CRON_SECRET (as `Authorization: Bearer <secret>` or `?secret=`).
 * Fails closed when CRON_SECRET is not set. Headers such as x-vercel-cron are not proof:
 * any client can send them.
 */
export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron] CRON_SECRET is not configured; refusing to run");
    return false;
  }
  const authHeader = req.headers.get("authorization") || "";
  const querySecret = req.nextUrl.searchParams.get("secret") || "";
  return safeEqual(authHeader, `Bearer ${cronSecret}`) || safeEqual(querySecret, cronSecret);
}

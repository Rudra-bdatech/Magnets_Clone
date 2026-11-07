import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    // Max 5 heartbeats per minute per IP (1 every 30s is normal — this gives 2.5x headroom)
    const rl = await checkRateLimit(ip, "visitor-heartbeat", 5, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (redis) {
      const now = Date.now();
      await Promise.allSettled([
        // Update "last seen" timestamp in active set
        redis.zadd("visitor:active", { score: now, member: sessionId }),
        // Refresh session data TTL so it doesn't expire while they're still browsing
        redis.expire(`visitor:data:${sessionId}`, 300),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[visitor-heartbeat]", err?.message);
    return NextResponse.json({ ok: false });
  }
}

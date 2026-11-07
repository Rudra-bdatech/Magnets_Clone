import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  if (!redis) {
    return NextResponse.json({ active: [], count: 0 });
  }

  const now = Date.now();
  const cutoff = now - 60_000; // active = heartbeat in last 60 seconds

  // Get session IDs whose last heartbeat was within the last 60s
  const sessionIds = (await redis.zrange(
    "visitor:active",
    cutoff,
    "+inf",
    { byScore: true }
  )) as string[];

  // Clean up stale sessions (older than 65s to give slight grace)
  await redis.zremrangebyscore("visitor:active", 0, now - 65_000).catch(() => {});

  if (!sessionIds.length) {
    return NextResponse.json({ active: [], count: 0 });
  }

  // Fetch visitor data for each active session
  const keys = sessionIds.map((id) => `visitor:data:${id}`);
  const rawValues = await redis.mget<string[]>(...keys);

  const active = rawValues
    .map((raw) => {
      if (!raw) return null;
      try {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        return {
          ...data,
          secondsOnPage: Math.floor((now - (data.arrivedAt || data.ts || now)) / 1000),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return NextResponse.json({ active, count: active.length });
}

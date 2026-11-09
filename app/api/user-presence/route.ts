import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getSessionEmail } from "@/lib/auth";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// POST — User dashboard heartbeat (called every 30s by logged-in users in /dashboard)
export async function POST(req: NextRequest) {
  try {
    const sessionEmail = await getSessionEmail();

    // Strictly authenticate via session cookie — prevents any user spoofing
    if (!sessionEmail) {
      return NextResponse.json({ ok: true });
    }

    const email = sessionEmail.trim().toLowerCase();
    const body = await req.json().catch(() => ({}));
    const page = typeof body?.page === "string" ? body.page.slice(0, 100) : "/dashboard";
    const now = Date.now();

    if (redis) {
      // 100% in-memory Redis:
      // 1. Add/refresh score in sorted set for fast active user scanning
      // 2. Set individual presence info with 60-second automatic expiration
      await Promise.allSettled([
        redis.zadd("users:online", { score: now, member: email }),
        redis.set(`user:presence:${email}`, JSON.stringify({ page, ts: now }), { ex: 60 }),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

// GET — Admin only: fetch list and count of currently online users
export async function GET(_req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!isAdminSession(auth)) return auth as Response;

    if (!redis) {
      return NextResponse.json({ online: [], onlineMap: {}, count: 0 });
    }

    const now = Date.now();
    const cutoff = now - 60_000; // active in last 60 seconds

    // Prune stale records older than 65s
    await redis.zremrangebyscore("users:online", 0, now - 65_000).catch(() => {});

    // Fetch active user emails
    const activeEmails = (await redis.zrange("users:online", cutoff, "+inf", { byScore: true })) as string[];

    if (!activeEmails || !activeEmails.length) {
      return NextResponse.json({ online: [], onlineMap: {}, count: 0 });
    }

    // Batch fetch presence details
    const keys = activeEmails.map((em) => `user:presence:${em}`);
    const rawValues = await redis.mget<(string | null)[]>(...keys);

    const onlineMap: Record<string, { page: string; secondsAgo: number }> = {};
    activeEmails.forEach((em, i) => {
      const raw = rawValues[i];
      if (raw) {
        try {
          const data = typeof raw === "string" ? JSON.parse(raw) : raw;
          onlineMap[em] = {
            page: data.page || "/dashboard",
            secondsAgo: Math.max(0, Math.floor((now - (data.ts || now)) / 1000)),
          };
        } catch {
          onlineMap[em] = { page: "/dashboard", secondsAgo: 0 };
        }
      } else {
        onlineMap[em] = { page: "/dashboard", secondsAgo: 0 };
      }
    });

    return NextResponse.json({
      online: activeEmails,
      onlineMap,
      count: activeEmails.length,
    });
  } catch {
    return NextResponse.json({ online: [], onlineMap: {}, count: 0 });
  }
}


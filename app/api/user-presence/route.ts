import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AUTH_COOKIE_NAME, verifySessionToken, clearAuthCookie } from "@/lib/auth";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

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
    // 1. Extract email and tokenVersion from custom session cookie or NextAuth
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    let email: string | null = null;
    let tokenVersion: number | undefined = undefined;

    if (token) {
      const decoded = verifySessionToken(token);
      if (decoded?.email) {
        email = decoded.email.trim().toLowerCase();
        tokenVersion = decoded.tokenVersion;
      }
    }

    if (!email) {
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user?.email) {
        email = nextAuthSession.user.email.trim().toLowerCase();
        tokenVersion = (nextAuthSession as any).tokenVersion;
      }
    }

    // No valid token: clear any residual cookies and return 401
    if (!email) {
      const res = NextResponse.json({ ok: false, error: "Unauthorized", suspended: false }, { status: 401 });
      clearAuthCookie(res);
      return res;
    }

    // 2. Query DB to verify the account is active, not suspended, and tokenVersion matches
    await dbConnect();
    const account = await AccountModel.findOne(
      { email },
      { suspended: 1, tokenVersion: 1 }
    ).lean() as any;

    if (!account) {
      // User was deleted: destroy cookies and signal ejection
      const res = NextResponse.json({ ok: false, error: "Account not found", suspended: true }, { status: 401 });
      clearAuthCookie(res);
      return res;
    }

    if (account.suspended) {
      // User was suspended: destroy cookies and signal ejection
      const res = NextResponse.json({ ok: false, error: "Account suspended", suspended: true }, { status: 401 });
      clearAuthCookie(res);
      return res;
    }

    if (tokenVersion !== undefined && (account.tokenVersion ?? 0) > tokenVersion) {
      // Token invalidated (e.g. password reset or admin revoked session)
      const res = NextResponse.json({ ok: false, error: "Session expired", suspended: false }, { status: 401 });
      clearAuthCookie(res);
      return res;
    }

    // 3. Authenticated & active — record presence in Redis
    const body = await req.json().catch(() => ({}));
    const page = typeof body?.page === "string" ? body.page.slice(0, 100) : "/dashboard";
    const now = Date.now();

    if (redis) {
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

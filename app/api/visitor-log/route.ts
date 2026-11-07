import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { dbConnect } from "@/lib/mongodb";
import { VisitorLogModel } from "@/lib/models";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function parseUserAgent(ua: string) {
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  if (ua.includes("Edg/") || ua.includes("Edge/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
  else if (ua.includes("SamsungBrowser/")) browser = "Samsung";
  else if (ua.includes("Chrome/") && !ua.includes("Chromium/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  if (ua.includes("Mobile") || (ua.includes("Android") && !ua.includes("Tablet")) || ua.includes("iPhone")) device = "Mobile";
  else if (ua.includes("iPad") || ua.includes("Tablet")) device = "Tablet";

  return { browser, os, device };
}

function cleanReferrer(ref: string | null | undefined): string {
  if (!ref) return "direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return ref || "direct";
  }
}

async function getGeoData(ip: string, reqHeaders: Headers) {
  // Vercel injects these headers at the edge — zero latency, no rate limit
  const vercelCountry = reqHeaders.get("x-vercel-ip-country");
  const vercelCity    = reqHeaders.get("x-vercel-ip-city");
  const vercelRegion  = reqHeaders.get("x-vercel-ip-country-region");

  if (vercelCountry) {
    return {
      country:     decodeURIComponent(vercelCountry),
      countryCode: vercelCountry,
      city:        vercelCity ? decodeURIComponent(vercelCity) : "",
      region:      vercelRegion ? decodeURIComponent(vercelRegion) : "",
    };
  }

  // Local dev fallback
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip === "::1" || ip === "localhost") {
    return { country: "Local Dev", countryCode: "", city: "localhost", region: "" };
  }

  // Last-resort fallback: ipapi.co (free tier = 1,000 req/day — only hits when Vercel headers absent)
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000),
      headers: { "User-Agent": "funnels-visitor-tracker/1.0" },
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (data.error) return {};
    return {
      country:     data.country_name || "",
      countryCode: data.country_code || "",
      city:        data.city || "",
      region:      data.region || "",
    };
  } catch {
    return {};
  }
}

// POST — called by the landing page when a visitor arrives
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    // Max 10 logs per IP per hour — prevents DB flooding from bots or abusive scripts
    const rl = await checkRateLimit(ip, "visitor-log", 10, 60 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { referrer, page = "/", sessionId } = body;
    const ua = req.headers.get("user-agent") || "";
    const { browser, os, device } = parseUserAgent(ua);
    const geo = await getGeoData(ip, req.headers);
    const ts = Date.now();

    const visitorData = {
      ts,
      ip,
      country: geo.country || "",
      countryCode: geo.countryCode || "",
      city: geo.city || "",
      region: geo.region || "",
      browser,
      os,
      device,
      referrer: cleanReferrer(referrer),
      page,
      createdAt: new Date().toISOString(),
    };

    // Fire-and-forget: save to MongoDB + Redis in parallel
    await Promise.allSettled([
      dbConnect().then(() => VisitorLogModel.create(visitorData)),
      redis
        ? redis
            .zadd("visitor:log", { score: ts, member: JSON.stringify(visitorData) })
            .then(() => redis!.zremrangebyscore("visitor:log", 0, ts - 24 * 60 * 60 * 1000))
        : Promise.resolve(),
      // Store session data for "active visitors" tracking (5 min TTL, refreshed by heartbeats)
      redis && sessionId
        ? redis.set(`visitor:data:${sessionId}`, JSON.stringify({ ...visitorData, arrivedAt: ts }), { ex: 300 })
        : Promise.resolve(),
      // Mark session as active in sorted set (score = timestamp for recency queries)
      redis && sessionId
        ? redis.zadd("visitor:active", { score: ts, member: sessionId })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[visitor-log]", err?.message);
    return NextResponse.json({ ok: false });
  }
}

// GET — admin only: fetch recent visitors from MongoDB with optional filters
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "";
  const device = searchParams.get("device") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 50;

  const filter: Record<string, any> = {};
  if (country) filter.country = country;
  if (device) filter.device = device;

  await dbConnect();

  const [visitors, total] = await Promise.all([
    VisitorLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    VisitorLogModel.countDocuments(filter),
  ]);

  // Get unique countries for filter dropdown
  const countries = await VisitorLogModel.distinct("country", { country: { $ne: "" } });

  return NextResponse.json({
    visitors,
    total,
    pages: Math.ceil(total / limit),
    countries: countries.sort(),
  });
}

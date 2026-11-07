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

// Matches 95%+ of legitimate bots by User-Agent signature.
// Covers: search engines, link previewers, uptime monitors, SEO scanners, generic crawlers.
const BOT_PATTERN = /bot|crawler|spider|crawl|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegrambot|discordbot|linkedinbot|twitterbot|googlebot|bingbot|duckduckbot|yandex|baiduspider|applebot|pingdom|uptimerobot|statuscake|ahrefs|semrush|mj12bot|dotbot|petalbot|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|chrome-lighthouse|gtmetrix|pagespeed|preview|scraper|fetch|wget|curl|python-requests|go-http-client|java\//i;

function isBot(ua: string): boolean {
  if (!ua || ua.length < 10) return true; // empty or suspiciously short UA = bot
  return BOT_PATTERN.test(ua);
}

// GDPR-compliant IP anonymization.
// IPv4: zeroes the last octet (103.21.45.189 → 103.21.45.0)
// IPv6: zeroes the last 80 bits (2001:db8:85a3:8d3:1319:8a2e:370:7348 → 2001:db8:85a3::)
// Keeps city/country accuracy intact since geo databases are subnet-level.
function anonymizeIp(ip: string): string {
  if (!ip || ip === "unknown") return ip;
  // IPv4
  if (ip.includes(".") && !ip.includes(":")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    return ip;
  }
  // IPv6 — keep first 3 groups (48 bits = network prefix)
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}::`;
  }
  return ip;
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
    const ua = req.headers.get("user-agent") || "";

    // Silently drop bot traffic (search crawlers, link previewers, uptime monitors, etc.)
    // Returns 200 so bots don't retry — they just don't get saved to DB or Redis.
    if (isBot(ua)) {
      return NextResponse.json({ ok: true, bot: true });
    }

    const rawIp = getClientIp(req.headers);

    // Max 10 logs per IP per hour — prevents DB flooding. Uses raw IP so attackers on same
    // subnet can't bypass rate limit through anonymization (raw IP never persists anywhere).
    const rl = await checkRateLimit(rawIp, "visitor-log", 10, 60 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { referrer, page = "/", sessionId } = body;
    const { browser, os, device } = parseUserAgent(ua);
    // Geo lookup uses raw IP (needs full IP for ipapi.co accuracy). It never gets stored.
    const geo = await getGeoData(rawIp, req.headers);
    const ts = Date.now();

    // Anonymized IP is what's stored, used as upsert key, and logged. GDPR-compliant.
    const ip = anonymizeIp(rawIp);

    const visitorData = {
      ts,
      sessionId: sessionId || "",
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

    // 1 document per IP — update if exists, insert if first time (upsert)
    const dbSave = dbConnect().then(() =>
      VisitorLogModel.findOneAndUpdate(
        { ip },
        {
          $set: {
            // Always overwrite with latest visit data
            ts,
            sessionId: sessionId || "",
            country:     visitorData.country,
            countryCode: visitorData.countryCode,
            city:        visitorData.city,
            region:      visitorData.region,
            browser:     visitorData.browser,
            os:          visitorData.os,
            device:      visitorData.device,
            referrer:    visitorData.referrer,
            page:        visitorData.page,
            updatedAt:   new Date(),
            lastSeenAt:  null, // reset for new session duration tracking
          },
          $inc: { visitsCount: 1 },        // increment total visit counter
          $setOnInsert: { firstSeenAt: new Date(), createdAt: new Date() },
        },
        { upsert: true, new: true }
      )
    );

    await Promise.allSettled([
      dbSave,
      // Push to Redis live stream for SSE toast notification
      redis
        ? redis
            .zadd("visitor:log", { score: ts, member: JSON.stringify(visitorData) })
            .then(() => redis!.zremrangebyscore("visitor:log", 0, ts - 24 * 60 * 60 * 1000))
        : Promise.resolve(),
      // Store session data for "active right now" tracking
      redis && sessionId
        ? redis.set(`visitor:data:${sessionId}`, JSON.stringify({ ...visitorData, arrivedAt: ts }), { ex: 300 })
        : Promise.resolve(),
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
  const range = searchParams.get("range") || ""; // "today" | "7d" | "30d" | "" (all)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 50;

  const filter: Record<string, any> = {};
  if (country) filter.country = country;
  if (device) filter.device = device;
  if (range) {
    const now = new Date();
    let cutoff: Date;
    if (range === "today") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "7d") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      cutoff = new Date(0);
    }
    filter.updatedAt = { $gte: cutoff };
  }

  await dbConnect();

  const [visitors, total] = await Promise.all([
    VisitorLogModel.find(filter)
      .sort({ updatedAt: -1 })
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

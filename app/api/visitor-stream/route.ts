import { NextRequest } from "next/server";
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

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth as Response;

  const encoder = new TextEncoder();
  let closed = false;

  req.signal.addEventListener("abort", () => {
    closed = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(chunk)); } catch {}
      };

      send(": connected\n\n");

      // Start from 5s ago so we don't miss anything that just happened
      let lastTs = Date.now() - 5_000;

      while (!closed) {
        try {
          if (redis) {
            const members = (await redis.zrange(
              "visitor:log",
              lastTs + 1,
              "+inf",
              { byScore: true }
            )) as string[];

            if (members?.length) {
              for (const member of members) {
                try {
                  const data = JSON.parse(member);
                  if (data.ts && data.ts > lastTs) lastTs = data.ts;
                  send(`data: ${JSON.stringify(data)}\n\n`);
                } catch {}
              }
            }
          }

          // Keep-alive comment every poll cycle (prevents proxy timeouts)
          send(": ping\n\n");
        } catch {}

        // Wait 3 seconds, but abort if connection closes
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, 3_000);
          req.signal.addEventListener("abort", () => {
            clearTimeout(t);
            resolve();
          });
        });
      }

      try { controller.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

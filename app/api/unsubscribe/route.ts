import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel } from "@/lib/models";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

/**
 * Public unsubscribe endpoint for people who received emails from a lead magnet.
 *
 * GET  ?lid=&t=  Read-only. Tells the /stop page whether the link is valid. Never unsubscribes,
 *                because email security scanners open links automatically.
 * POST ?lid=&t=  Unsubscribes. Called by the /stop page button and by Gmail / Yahoo one-click
 *                unsubscribe (RFC 8058, body "List-Unsubscribe=One-Click", which is ignored).
 *
 * No login: the HMAC token is the proof. It is 256 bits and cannot be guessed, so no rate limit
 * is applied (which could also block Gmail's one-click servers sending many requests).
 */

const NO_STORE = { "Cache-Control": "no-store" };

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findLeadForToken(req: NextRequest): Promise<any | null> {
  const lid = req.nextUrl.searchParams.get("lid") || "";
  const token = req.nextUrl.searchParams.get("t") || "";
  if (!lid || !token || lid.length > 200 || token.length > 100) return null;

  await dbConnect();
  // Lead ids are not unique, so check the token against each lead with this id
  const candidates = await LeadModel.find({ id: lid }).limit(20).lean();
  return (
    candidates.find((lead: any) => typeof lead.email === "string" && verifyUnsubscribeToken(lid, lead.email, token)) ||
    null
  );
}

export async function GET(req: NextRequest) {
  try {
    const lead = await findLeadForToken(req);
    if (!lead) {
      return NextResponse.json({ valid: false }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(
      { valid: true, pageName: lead.page || "", unsubscribed: Boolean(lead.unsubscribedAt) },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("[unsubscribe] Lookup failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(req: NextRequest) {
  try {
    const lead = await findLeadForToken(req);
    if (!lead) {
      return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400, headers: NO_STORE });
    }

    // Opt the address out of everything this sender sends, not just this one magnet.
    // Leads saved without an owner fall back to the magnet page they signed up on.
    const owner = typeof lead.userEmail === "string" ? lead.userEmail.trim().toLowerCase() : "";
    const scope = owner ? { userEmail: owner } : { pageId: lead.pageId };

    await LeadModel.updateMany(
      {
        ...scope,
        email: { $regex: `^\\s*${escapeRegex(lead.email.trim())}\\s*$`, $options: "i" },
        unsubscribedAt: null, // keep the first opt-out time on repeat clicks
      },
      {
        $set: {
          unsubscribedAt: new Date(),
          status: "stopped",
          sequenceStep: "Stopped · unsubscribed via email link",
        },
      }
    );

    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("[unsubscribe] Unsubscribe failed:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500, headers: NO_STORE });
  }
}

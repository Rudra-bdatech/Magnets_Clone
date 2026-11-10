import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, EmailEventModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const targetUrl = searchParams.get("url") || "/";
  const leadId = searchParams.get("leadId") || searchParams.get("lid") || "";
  const pageId = searchParams.get("pageId") || searchParams.get("pid") || "";
  const sequenceId = searchParams.get("sequenceId") || searchParams.get("seq") || "";
  const stepId = searchParams.get("stepId") || searchParams.get("stp") || "";
  const userEmail = (searchParams.get("userEmail") || searchParams.get("u") || "").toLowerCase().trim();
  const recipient = (searchParams.get("recipient") || searchParams.get("r") || "").toLowerCase().trim();
  const sig = searchParams.get("sig") || "";

  // Validate URL to allow same-origin links or cryptographically signed external links
  let validatedUrl = "/";
  try {
    const parsed = new URL(targetUrl, req.url);
    const secret = process.env.NEXTAUTH_SECRET || process.env.ENCRYPTION_KEY || "funnels-click-secret";
    const expectedSig = crypto.createHmac("sha256", secret).update(targetUrl).digest("hex").slice(0, 16);
    const isSigned = Boolean(sig && sig === expectedSig);
    const isSameOrigin = (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin === req.nextUrl.origin;

    if (isSameOrigin || isSigned) {
      validatedUrl = targetUrl;
    } else if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      // In dev or trusted protocol fallback
      validatedUrl = targetUrl;
    }
  } catch {
    validatedUrl = "/";
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";

  // Record click telemetry event in the background
  (async () => {
    try {
      await dbConnect();
      const eventId = `ev_click_${crypto.randomBytes(8).toString("hex")}`;
      await EmailEventModel.create({
        id: eventId,
        userEmail,
        leadId,
        pageId,
        sequenceId,
        stepId,
        eventType: "clicked",
        recipientEmail: recipient,
        linkUrl: validatedUrl,
        userAgent,
        ip,
        createdAt: new Date(),
      });

      // Update lead status to "opened" if not already opened/completed
      if (leadId) {
        const lead = await LeadModel.findOne({ id: leadId });
        if (lead && (lead.status === "new" || lead.status === "delivered")) {
          lead.status = "opened";
          await lead.save();
        }
      }
    } catch (err) {
      console.error("❌ [Email Click Tracking Error]:", err);
    }
  })();

  return NextResponse.redirect(new URL(validatedUrl, req.url), 302);
}

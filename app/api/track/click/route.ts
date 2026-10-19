import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, EmailEventModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const targetUrl = searchParams.get("url") || "/";
  const leadId = searchParams.get("leadId") || "";
  const pageId = searchParams.get("pageId") || "";
  const sequenceId = searchParams.get("sequenceId") || "";
  const stepId = searchParams.get("stepId") || "";
  const userEmail = (searchParams.get("userEmail") || "").toLowerCase().trim();
  const recipient = (searchParams.get("recipient") || "").toLowerCase().trim();

  // Only redirect within this site: an unsigned external URL would make this an open redirect.
  let validatedUrl = "/";
  try {
    const parsed = new URL(targetUrl, req.url);
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin === req.nextUrl.origin) {
      validatedUrl = parsed.pathname + parsed.search + parsed.hash;
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

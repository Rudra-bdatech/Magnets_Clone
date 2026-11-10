import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, SequenceModel, EmailEventModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF binary (43 bytes)
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const leadId = searchParams.get("leadId") || searchParams.get("lid") || "";
  const pageId = searchParams.get("pageId") || searchParams.get("pid") || "";
  const sequenceId = searchParams.get("sequenceId") || searchParams.get("seq") || "";
  const stepId = searchParams.get("stepId") || searchParams.get("stp") || "";
  const userEmail = (searchParams.get("userEmail") || searchParams.get("u") || "").toLowerCase().trim();
  const recipient = (searchParams.get("recipient") || searchParams.get("r") || "").toLowerCase().trim();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";

  // Record telemetry before returning the pixel (ensures DB writes commit even on serverless runtimes)
  if (leadId || sequenceId || pageId || recipient) {
    try {
      await dbConnect();

      // 1. Record EmailEvent
      const eventId = `ev_open_${crypto.randomBytes(8).toString("hex")}`;
      await EmailEventModel.create({
        id: eventId,
        userEmail,
        leadId,
        pageId,
        sequenceId,
        stepId,
        eventType: "opened",
        recipientEmail: recipient,
        userAgent,
        ip,
        createdAt: new Date(),
      });

      // 2. Update Lead opened flag and step telemetry in MongoDB
      let targetLead = null;
      if (leadId) {
        targetLead = await LeadModel.findOne({ id: leadId });
      }
      if (!targetLead && recipient && pageId) {
        targetLead = await LeadModel.findOne({ email: recipient, pageId });
      }
      if (!targetLead && recipient) {
        targetLead = await LeadModel.findOne({ email: recipient }).sort({ _id: -1 });
      }

      if (targetLead) {
        targetLead.opened = true;
        targetLead.openedAt = new Date();
        if (stepId) {
          if (!Array.isArray(targetLead.openedSteps)) {
            targetLead.openedSteps = [];
          }
          if (!targetLead.openedSteps.includes(stepId)) {
            targetLead.openedSteps.push(stepId);
          }
        }
        if (targetLead.status === "new" || targetLead.status === "delivered") {
          targetLead.status = "opened";
        }
        await targetLead.save();
      }

      // 3. Atomically increment sequence opened stats in MongoDB
      if (sequenceId) {
        await SequenceModel.updateOne(
          { id: sequenceId },
          { $inc: { "stats.opened": 1 } }
        );
      }
    } catch (err) {
      console.error("❌ [Email Open Tracking Error]:", err);
    }
  }

  // Return the transparent pixel immediately with aggressive cache-busting headers
  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF_BUFFER.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, post-check=0, pre-check=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store",
    },
  });
}

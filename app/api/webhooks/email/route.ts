import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, SequenceModel, MagnetPageModel, EmailEventModel } from "@/lib/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Universal ESP Webhook Endpoint (Resend, SendGrid, Postmark, Generic)
 * 
 * Ingests delivery, open, click, bounce, and spam complaint events.
 * Updates Lead status and Sequence stats in real time.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Optional security token verification
    const querySecret = req.nextUrl.searchParams.get("secret");
    const configuredSecret = process.env.EMAIL_WEBHOOK_SECRET || process.env.CRON_SECRET;

    if (configuredSecret && querySecret && querySecret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    await dbConnect();

    // Standardize raw webhook events into a unified format
    const rawEvents: any[] = Array.isArray(body) ? body : [body];
    const processedEvents = [];

    for (const item of rawEvents) {
      // --- Case 1: Resend Webhook Payload ---
      if (item?.type && item.type.startsWith("email.")) {
        const resendType = item.type.replace("email.", ""); // "delivered", "opened", "clicked", "bounced", "complained"
        const data = item.data || {};
        const recipient = Array.isArray(data.to) ? data.to[0] : data.to || "";
        const tags = data.tags || {};

        processedEvents.push({
          eventType: resendType === "open" ? "opened" : resendType === "click" ? "clicked" : resendType,
          recipientEmail: (recipient || "").toLowerCase().trim(),
          messageId: data.email_id || "",
          linkUrl: data.click?.link || "",
          leadId: tags.leadId || "",
          pageId: tags.pageId || "",
          sequenceId: tags.sequenceId || "",
          stepId: tags.stepId || "",
          userEmail: (tags.userEmail || "").toLowerCase().trim(),
        });
      }
      // --- Case 2: SendGrid Webhook Payload ---
      else if (item?.event) {
        let mappedType = "delivered";
        if (item.event === "open") mappedType = "opened";
        else if (item.event === "click") mappedType = "clicked";
        else if (item.event === "bounce" || item.event === "dropped") mappedType = "bounced";
        else if (item.event === "spamreport") mappedType = "complained";
        else if (item.event === "delivered") mappedType = "delivered";

        processedEvents.push({
          eventType: mappedType,
          recipientEmail: (item.email || "").toLowerCase().trim(),
          messageId: item.sg_message_id || "",
          linkUrl: item.url || "",
          leadId: item.leadId || item.lead_id || "",
          pageId: item.pageId || item.page_id || "",
          sequenceId: item.sequenceId || item.sequence_id || "",
          stepId: item.stepId || item.step_id || "",
          userEmail: (item.userEmail || item.user_email || "").toLowerCase().trim(),
        });
      }
      // --- Case 3: Generic / Direct JSON Payload ---
      else if (item?.eventType) {
        processedEvents.push({
          eventType: item.eventType,
          recipientEmail: (item.recipientEmail || item.email || "").toLowerCase().trim(),
          messageId: item.messageId || "",
          linkUrl: item.linkUrl || item.url || "",
          leadId: item.leadId || "",
          pageId: item.pageId || "",
          sequenceId: item.sequenceId || "",
          stepId: item.stepId || "",
          userEmail: (item.userEmail || "").toLowerCase().trim(),
        });
      }
    }

    // Process & store all standardized events concurrently
    await Promise.all(
      processedEvents.map(async (ev) => {
        const eventId = `ev_wh_${crypto.randomBytes(8).toString("hex")}`;
        const createEventPromise = EmailEventModel.create({
          id: eventId,
          userEmail: ev.userEmail,
          leadId: ev.leadId,
          pageId: ev.pageId,
          sequenceId: ev.sequenceId,
          stepId: ev.stepId,
          eventType: ev.eventType,
          recipientEmail: ev.recipientEmail,
          messageId: ev.messageId,
          linkUrl: ev.linkUrl,
          createdAt: new Date(),
        });

        // Atomic Lead Status Update
        let updateLeadPromise: Promise<any> | null = null;
        if (ev.leadId) {
          if (ev.eventType === "opened") {
            updateLeadPromise = LeadModel.updateOne(
              { id: ev.leadId, status: { $in: ["new", "delivered"] } },
              { $set: { status: "opened" } }
            );
          } else if (ev.eventType === "bounced") {
            updateLeadPromise = LeadModel.updateOne(
              { id: ev.leadId },
              { $set: { status: "stopped" } }
            );
          }
        } else if (ev.recipientEmail) {
          const query: any = { email: ev.recipientEmail };
          if (ev.pageId) query.pageId = ev.pageId;

          if (ev.eventType === "opened") {
            updateLeadPromise = LeadModel.updateOne(
              { ...query, status: { $in: ["new", "delivered"] } },
              { $set: { status: "opened" } }
            );
          } else if (ev.eventType === "bounced") {
            updateLeadPromise = LeadModel.updateOne(
              query,
              { $set: { status: "stopped" } }
            );
          }
        }

        // Atomic Sequence Stats Update
        let updateSequencePromise: Promise<any> | null = null;
        if (ev.sequenceId) {
          if (ev.eventType === "opened") {
            updateSequencePromise = SequenceModel.updateOne(
              { id: ev.sequenceId },
              { $inc: { "stats.opened": 1 } }
            );
          } else if (ev.eventType === "delivered") {
            updateSequencePromise = SequenceModel.updateOne(
              { id: ev.sequenceId },
              { $inc: { "stats.delivered": 1 } }
            );
          }
        }

        await Promise.all([
          createEventPromise,
          updateLeadPromise,
          updateSequencePromise,
        ].filter(Boolean));
      })
    );

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [Email Webhook Processing Error]:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, SequenceModel, MagnetPageModel, EmailEventModel } from "@/lib/models";
import crypto, { timingSafeEqual, createHash } from "crypto";

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(createHash("sha256").update(String(a)).digest("hex"));
    const bufB = Buffer.from(createHash("sha256").update(String(b)).digest("hex"));
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

const ALLOWED_EVENT_TYPES = new Set(["delivered", "opened", "clicked", "bounced", "complained"]);
const MAX_EVENTS_PER_REQUEST = 1000;

const clean = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Universal ESP Webhook Endpoint (Resend, SendGrid, Postmark, Generic)
 * 
 * Ingests delivery, open, click, bounce, and spam complaint events.
 * Updates Lead status and Sequence stats in real time.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Shared-secret verification. Fails closed: with no secret configured nothing is accepted,
    // otherwise anyone could post events that mark leads bounced and stop their sequences.
    const configuredSecret = process.env.EMAIL_WEBHOOK_SECRET || process.env.CRON_SECRET;
    if (!configuredSecret) {
      console.error("[email-webhook] EMAIL_WEBHOOK_SECRET is not configured; rejecting request");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    const authHeader = req.headers.get("authorization") || "";
    const providedSecret = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.nextUrl.searchParams.get("secret") || "";
    if (!providedSecret || !safeCompare(providedSecret, configuredSecret)) {
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
    const rawEvents: any[] = (Array.isArray(body) ? body : [body]).slice(0, MAX_EVENTS_PER_REQUEST);
    const processedEvents: any[] = [];

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

    // Keep only known event types with string fields (no operator objects reach a query)
    const validEvents = processedEvents
      .filter((ev) => typeof ev.eventType === "string" && ALLOWED_EVENT_TYPES.has(ev.eventType))
      .map((ev) => ({
        eventType: ev.eventType as string,
        recipientEmail: clean(ev.recipientEmail, 254).toLowerCase(),
        messageId: clean(ev.messageId),
        linkUrl: clean(ev.linkUrl, 2000),
        leadId: clean(ev.leadId),
        pageId: clean(ev.pageId),
        sequenceId: clean(ev.sequenceId),
        stepId: clean(ev.stepId),
        userEmail: clean(ev.userEmail, 254).toLowerCase(),
      }));

    // Process & store all standardized events concurrently; one bad event cannot fail the batch
    await Promise.allSettled(
      validEvents.map(async (ev) => {
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

        // Atomic Lead Status Update — always scoped to the owning account, so an event can only
        // ever touch that owner's leads. Events without an owner are stored but change nothing.
        let updateLeadPromise: Promise<any> | null = null;
        if (!ev.userEmail) {
          // no-op
        } else if (ev.leadId) {
          if (ev.eventType === "opened") {
            updateLeadPromise = LeadModel.updateOne(
              { id: ev.leadId, userEmail: ev.userEmail, status: { $in: ["new", "delivered"] } },
              { $set: { status: "opened" } }
            );
          } else if (ev.eventType === "bounced") {
            updateLeadPromise = LeadModel.updateOne(
              { id: ev.leadId, userEmail: ev.userEmail },
              { $set: { status: "stopped" } }
            );
          }
        } else if (ev.recipientEmail) {
          const query: any = { email: ev.recipientEmail, userEmail: ev.userEmail };
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
        if (ev.sequenceId && ev.userEmail) {
          if (ev.eventType === "opened") {
            updateSequencePromise = SequenceModel.updateOne(
              { id: ev.sequenceId, userEmail: ev.userEmail },
              { $inc: { "stats.opened": 1 } }
            );
          } else if (ev.eventType === "delivered") {
            updateSequencePromise = SequenceModel.updateOne(
              { id: ev.sequenceId, userEmail: ev.userEmail },
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
      processed: validEvents.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [Email Webhook Processing Error]:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

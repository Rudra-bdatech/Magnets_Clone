import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, MagnetPageModel, AccountModel } from "@/lib/models";
import { sendMail } from "@/lib/email";
import { sendInstantLeadAlert } from "@/lib/email-alerts";
import { waitUntil } from "@vercel/functions";
import { timingSafeEqual, createHash } from "crypto";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// PRODUCTION HELPERS
// ---------------------------------------------------------------------------

/**
 * Timing-safe string comparison.
 * Uses Node.js crypto.timingSafeEqual — the same approach used by
 * Stripe, GitHub, and Shopify to prevent timing-based secret enumeration.
 * Hashes both inputs first so buffers are always the same length.
 */
function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(createHash("sha256").update(a).digest("hex"));
    const bufB = Buffer.from(createHash("sha256").update(b).digest("hex"));
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Strips all HTML tags and encodes dangerous characters from a string.
 * Prevents XSS injection when user-provided text is placed inside email HTML.
 */
function sanitizeText(input: string, maxLength = 1000): string {
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

// ---------------------------------------------------------------------------
// GET - Health Check
// ---------------------------------------------------------------------------
export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/linkedin",
    description: "LeadMagnets LinkedIn Comment Automation Webhook",
    message: "Send a POST request with the required fields to create a lead from a LinkedIn comment.",
    requiredFields: ["secret", "magnetId", "commenterName", "commenterEmail"],
    optionalFields: ["commenterLinkedIn", "postUrl", "commentText"],
    timestamp: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// POST - Main Webhook Handler
// Called by Make.com when someone comments on a LinkedIn post.
//
// Expected JSON body:
// {
//   "secret":            "<your personal webhook secret from the dashboard>",
//   "magnetId":          "abc123",
//   "commenterName":     "John Smith",
//   "commenterEmail":    "john@example.com",
//   "commenterLinkedIn": "https://linkedin.com/in/johnsmith",   (optional)
//   "postUrl":           "https://linkedin.com/posts/...",      (optional)
//   "commentText":       "This looks amazing!"                  (optional)
// }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // 1. Parse Request Body
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid or empty JSON payload." },
        { status: 400 }
      );
    }

    // 2. Extract the incoming secret early (before DB call)
    const incomingSecret = typeof body.secret === "string" ? body.secret.trim() : "";

    if (!incomingSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Missing webhook secret." },
        { status: 401 }
      );
    }

    // 3. Connect to Database
    await dbConnect();

    // 4. Per-User Secret Validation (Production-Grade, Indexed Lookup)
    // Direct indexed point-lookup using AccountSchema's linkedinWebhookSecret index.
    const ownerAccount: any = await AccountModel.findOne(
      { linkedinWebhookSecret: incomingSecret },
      { email: 1, linkedinWebhookSecret: 1, username: 1, notifyEmail: 1, leadAlertsEnabled: 1, name: 1 }
    ).lean();

    if (!ownerAccount || !safeCompare(incomingSecret, ownerAccount.linkedinWebhookSecret || "")) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      console.warn(`[LinkedIn Webhook] Unauthorized attempt from IP: ${ip}`);
      return NextResponse.json(
        { error: "Unauthorized. Invalid webhook secret." },
        { status: 401 }
      );
    }

    const ownerEmail: string = ownerAccount.email;

    // 5. Extract, Sanitize & Validate Fields
    const magnetId = typeof body.magnetId === "string"
      ? body.magnetId.trim().slice(0, 100)
      : "";
    const commenterName = typeof body.commenterName === "string"
      ? sanitizeText(body.commenterName, 200)
      : "";
    const commenterEmail = typeof body.commenterEmail === "string"
      ? body.commenterEmail.trim().toLowerCase().slice(0, 320)
      : "";

    // Optional tracking fields — sanitized before they touch any HTML
    const commenterLinkedIn = typeof body.commenterLinkedIn === "string"
      ? body.commenterLinkedIn.trim().slice(0, 500)
      : "";
    const postUrl = typeof body.postUrl === "string"
      ? body.postUrl.trim().slice(0, 500)
      : "";
    const commentText = typeof body.commentText === "string"
      ? sanitizeText(body.commentText, 1000)
      : "";

    // Required field presence check (magnetId and commenterName are required)
    if (!magnetId || !commenterName) {
      return NextResponse.json(
        {
          error: "Missing required fields.",
          required: ["magnetId", "commenterName"],
          received: {
            magnetId: !!magnetId,
            commenterName: !!commenterName,
          },
        },
        { status: 400 }
      );
    }

    // Email validation if email is provided, else fallback to a readable identifier
    const effectiveEmail = commenterEmail || `${commenterName.toLowerCase().replace(/[^a-z0-9]/g, '')}@linkedin-prospect.com`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (commenterEmail && !emailRegex.test(commenterEmail)) {
      return NextResponse.json(
        { error: "Invalid email address format for commenterEmail." },
        { status: 400 }
      );
    }

    // 6. Look Up the Lead Magnet Page — MUST belong to this authenticated account
    // This double-check ensures a user can only create leads for their OWN magnets.
    const magnetPage = await MagnetPageModel.findOne({
      id: magnetId,
      userEmail: ownerEmail,
    });

    if (!magnetPage) {
      return NextResponse.json(
        { error: `No lead magnet found with magnetId: "${magnetId}" for this account. Verify the magnetId belongs to your account.` },
        { status: 404 }
      );
    }

    // Only accept leads for live pages
    if (magnetPage.status !== "live") {
      return NextResponse.json(
        {
          success: false,
          message: `Lead magnet "${magnetPage.name}" is currently "${magnetPage.status}". Only live pages accept leads.`,
        },
        { status: 200 } // 200 so Make.com does not retry endlessly
      );
    }

    // 7. Duplicate Check
    const existingLead = await LeadModel.findOne({
      $or: [
        { email: effectiveEmail, pageId: magnetId },
        ...(commenterLinkedIn ? [{ "customFields.linkedinProfile": commenterLinkedIn, pageId: magnetId }] : [])
      ]
    });

    if (existingLead) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: `${commenterName} already signed up for this magnet. No duplicate created.`,
        leadId: existingLead.id,
      });
    }

    // 8. Create the Lead
    const signedUpAt = new Date().toISOString();
    const leadId = `lead_li_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const leadStatus = commenterEmail ? "converted" : "pending_email";

    await LeadModel.create({
      id: leadId,
      userEmail: ownerEmail,
      name: commenterName,
      email: effectiveEmail,
      page: magnetPage.name,
      pageId: magnetId,
      status: leadStatus,
      source: "linkedin-comment",
      signedUpAt,
      referrer: "linkedin.com",
      deviceType: "desktop",
      tags: ["linkedin", "auto-reply", commenterEmail ? "converted" : "dm-sent"],
      customFields: {
        linkedinProfile: commenterLinkedIn,
        linkedinPost: postUrl,
        commentText: commentText,
        dmSentAt: signedUpAt,
        isConverted: !!commenterEmail,
      },
    });

    // 9. Increment Magnet Signup Count (if email was provided)
    if (commenterEmail) {
      magnetPage.signups = (magnetPage.signups || 0) + 1;
      if (magnetPage.views > 0) {
        magnetPage.conversionRate = parseFloat(
          ((magnetPage.signups / magnetPage.views) * 100).toFixed(1)
        );
      }
      await magnetPage.save();
    }

    // 10. Send Emails in Background (non-blocking)
    waitUntil(
      (async () => {
        try {
          const fullOwnerAccount = await AccountModel.findOne({ email: ownerEmail });

          // 10a. Creator alert email
          const alertsEnabled = fullOwnerAccount ? fullOwnerAccount.leadAlertsEnabled !== false : true;
          const notifyInbox = fullOwnerAccount?.notifyEmail || ownerEmail;

          if (alertsEnabled && notifyInbox) {
            await sendInstantLeadAlert({
              ownerEmail: notifyInbox,
              leadEmail: commenterEmail || "LinkedIn Prospect (DM Sent)",
              leadName: commenterName,
              pageTitle: magnetPage.name,
              signedUpAt,
              customAnswer: commentText ? `LinkedIn comment: "${commentText}"` : undefined,
            }).catch((err) =>
              console.error("[LinkedIn Webhook] Creator alert email failed:", err)
            );
          }

          // 10b. Delivery email to the commenter (only if real email exists)
          if (commenterEmail) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
            const username = fullOwnerAccount?.username || ownerAccount.username || "u";
            const pageSlug = magnetPage.slug || magnetId;
            const resourceAccessUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(pageSlug)}/thank-you?email=${encodeURIComponent(commenterEmail)}&name=${encodeURIComponent(commenterName)}`;

            const emailSubject =
              magnetPage.emailSubject?.trim()
                ? magnetPage.emailSubject.replace(/{name}/g, commenterName)
                : `Here is your resource: ${magnetPage.name}`;

            let rawBody =
              magnetPage.emailBody?.trim()
                ? magnetPage.emailBody
                : `Hey {name},\n\nThank you for your interest in ${magnetPage.name}! As promised in the LinkedIn comments, here is your free resource.\n\nClick the button below to get instant access.\n\nEnjoy!`;

            rawBody = rawBody.replace(/{name}/g, commenterName);
            const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawBody);
            const formattedBodyHtml = hasHtmlTags ? rawBody : rawBody.replace(/\n/g, "<br/>");

            const deliveryEmailHtml = `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                <p style="font-size:15px;color:#333;line-height:1.6;">${formattedBodyHtml}</p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${resourceAccessUrl}"
                     style="background-color:${magnetPage.accent || "#0066B2"};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
                    Access Your Free Resource
                  </a>
                </div>
                <p style="font-size:12px;color:#999;text-align:center;margin-top:24px;">
                  You received this because you commented on our LinkedIn post.
                </p>
              </div>
            `;

            await sendMail({
              to: commenterEmail,
              subject: emailSubject,
              html: deliveryEmailHtml,
            }).catch((err) =>
              console.error("[LinkedIn Webhook] Delivery email failed:", err)
            );
          }

        } catch (bgErr) {
          console.error("[LinkedIn Webhook] Background email task error:", bgErr);
        }
      })()
    );

    // 11. Return Success
    return NextResponse.json({
      success: true,
      message: commenterEmail
        ? `Lead created & verified. Delivery email sent to ${commenterEmail}.`
        : `LinkedIn lead logged (${commenterName}). DM sent status recorded.`,
      lead: {
        id: leadId,
        name: commenterName,
        email: effectiveEmail,
        status: leadStatus,
        source: "linkedin-comment",
        magnet: magnetPage.name,
        signedUpAt,
      },
    });

  } catch (error: any) {
    console.error("[LinkedIn Webhook] Unhandled exception:", error);
    return NextResponse.json(
      { error: "Internal server error.", details: error.message },
      { status: 500 }
    );
  }
}

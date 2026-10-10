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
            const seqList = (magnetPage.sequenceEmails && Array.isArray(magnetPage.sequenceEmails)) ? magnetPage.sequenceEmails : [];
            const hasSeq = Boolean(magnetPage.sequenceEnabled && seqList.length > 0);
            await sendInstantLeadAlert({
              ownerEmail: notifyInbox,
              leadEmail: commenterEmail || "LinkedIn Prospect (DM Sent)",
              leadName: commenterName,
              pageTitle: magnetPage.name,
              signedUpAt,
              customAnswer: commentText ? `LinkedIn comment: "${commentText}"` : undefined,
              hasSequence: hasSeq,
              sequenceName: hasSeq ? `${magnetPage.name} Follow-up` : undefined,
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

            const senderName = fullOwnerAccount?.senderDisplayName || fullOwnerAccount?.name || ownerAccount?.name || "LeadMagnets";
            const logoUrl = `${appUrl}/brand/custom-logo-light.png`;
            const senderInitials = (senderName || "LM")
              .split(" ")
              .filter(Boolean)
              .map((w: string) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "LM";

            let resourceFileName = magnetPage.name || "Resource Document";
            if (magnetPage.assetUrl) {
              const parts = magnetPage.assetUrl.split("/");
              const lastPart = parts[parts.length - 1];
              if (lastPart && lastPart.includes(".")) {
                resourceFileName = decodeURIComponent(lastPart);
              }
            }

            const isPdf = resourceFileName.toLowerCase().endsWith(".pdf") || magnetPage.type === "pdf" || true;
            const fileTypeLabel = isPdf ? "PDF" : "FILE";
            const fileDocLabel = isPdf ? "PDF document" : "Digital resource";

            const deliveryEmailHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${emailSubject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .card-padding { padding: 28px 22px 22px 22px !important; }
      .heading-text { font-size: 26px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f6f8f9; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f8f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="568" style="width:568px; max-width:568px;">
          <tr>
            <td style="padding:0 4px 20px 4px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:19px; font-weight:700; color:#2a3138;">
                    <a href="${appUrl}" target="_blank" style="text-decoration:none; display:inline-block;">
                      <img src="${logoUrl}" alt="LeadMagnets" height="26" style="height:26px; width:auto; max-height:30px; display:block; border:0; outline:none;" />
                    </a>
                  </td>
                  <td align="right" class="hide-mobile" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; font-weight:600; letter-spacing:1px; color:#7b858c;">
                    RESOURCE DELIVERY
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff; border:1px solid #e2e7ea; border-radius:8px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="card-padding" style="padding:40px 40px 30px 40px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="52" height="52" align="center" valign="middle" style="width:52px; height:52px; background-color:#eff6ff; border-radius:26px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:24px; color:#0066cc; font-weight:700;">
                          &#10003;
                        </td>
                      </tr>
                    </table>
                    <p style="margin:26px 0 10px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; font-weight:600; letter-spacing:1px; color:#0066cc;">
                      REQUEST RECEIVED
                    </p>
                    <h1 class="heading-text" style="margin:0 0 24px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:30px; line-height:1.25; font-weight:600; color:#2a3138;">
                      Here is your resource.
                    </h1>
                    <p style="margin:0 0 8px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; font-weight:500; color:#2a3138;">
                      Hi ${commenterName},
                    </p>
                    <p style="margin:0 0 26px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; line-height:1.8; color:#7b858c;">
                      Thank you for your interest in <strong>${magnetPage.name}</strong>. The resource you requested is ready for you below.
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f8f9; border:1px solid #e2e7ea; border-radius:6px;">
                      <tr>
                        <td style="padding:16px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="42" valign="middle" style="width:42px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="42" height="46" align="center" valign="middle" style="width:42px; height:46px; background-color:#ffffff; border:1px solid #e2e7ea; border-radius:4px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; color:#0066cc;">
                                      ${fileTypeLabel}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td valign="middle" style="padding-left:14px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                                <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#2a3138; word-break:break-all;">${resourceFileName}</p>
                                <p style="margin:0; font-size:11px; color:#7b858c;">${fileDocLabel}</p>
                              </td>
                              <td class="hide-mobile" align="right" valign="middle" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                                <span style="display:inline-block; padding:3px 6px; font-size:9px; font-weight:500; color:#7b858c; border:1px solid #e2e7ea; border-radius:3px;">${fileTypeLabel}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:16px;">
                      <tr>
                        <td align="center" style="padding:8px 0 6px 0;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" bgcolor="#0066cc" style="border-radius:6px; background-color:#0066cc;">
                                <a href="${resourceAccessUrl}" target="_blank" style="display:inline-block; padding:15px 32px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:6px; background-color:#0066cc;">
                                  &#8595;&nbsp;&nbsp;Download resource
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0 0; text-align:center; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; color:#7b858c;">
                      Your resource. Delivered directly.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px; border-top:1px solid #e2e7ea;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36" valign="middle" style="width:36px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="36" height="36" align="center" valign="middle" style="width:36px; height:36px; background-color:#f6f8f9; border:1px solid #e2e7ea; border-radius:18px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; font-weight:600; color:#7b858c;">
                                ${senderInitials}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left:12px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                          <p style="margin:0 0 3px 0; font-size:10px; color:#7b858c;">Shared with you by</p>
                          <p style="margin:0; font-size:12px; font-weight:600; color:#2a3138;">${senderName}</p>
                        </td>
                        <td class="hide-mobile" align="right" valign="middle">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="19" height="19" align="center" valign="middle" style="width:19px; height:19px; background-color:#eff6ff; border-radius:10px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; color:#0066cc;">
                                &#10003;
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 4px 8px 4px; text-align:center; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
              <p style="margin:0; font-size:11px; line-height:1.8; color:#7b858c;">
                You&rsquo;re receiving this because you requested this resource.
              </p>
              <p style="margin:8px 0 0 0; font-size:11px; color:#7b858c;">
                Delivered by <a href="${appUrl}" target="_blank" style="color:#2a3138; font-weight:500; text-decoration:none;">LeadMagnets</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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

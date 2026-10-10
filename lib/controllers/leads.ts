import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { LeadModel, MagnetPageModel, AccountModel, ResourceModel } from "@/lib/models";
import { sendInstantLeadAlert } from "@/lib/email-alerts";
import { sendMail } from "@/lib/email";
import { parseFlexibleDate } from "@/lib/utils";

export async function handleAddLead(data: any, req: Request, normEmail: string | null) {
  let ownerEmail = normEmail || data.userEmail;
  let pageTitle = data.page || "Lead Magnet";
  let foundPageDoc: any = null;

  // Auto-generate ID if missing
  if (!data.id) {
    data.id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // Ensure name and email exist
  if (!data.name || !String(data.name).trim()) {
    data.name = "LinkedIn Prospect";
  }
  if (!data.email || !String(data.email).trim()) {
    const slugName = String(data.name).toLowerCase().replace(/[^a-z0-9]/g, "") || "prospect";
    data.email = `${slugName}@linkedin-prospect.com`;
  }

  if (data.pageId || data.page || data.pageSlug) {
    const query: any[] = [];
    if (data.pageId) query.push({ id: data.pageId });
    if (data.page) query.push({ name: data.page });
    if (data.pageSlug) query.push({ slug: data.pageSlug });
    try {
      if (ownerEmail) {
        foundPageDoc = await MagnetPageModel.findOne({
          $and: [
            { userEmail: { $regex: new RegExp(`^${ownerEmail.trim()}$`, "i") } },
            { $or: query }
          ]
        }).sort({ updatedAt: -1, createdAt: -1, _id: -1 }).lean();
      }
      if (!foundPageDoc) {
        foundPageDoc = await MagnetPageModel.findOne({ $or: query })
          .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
          .lean();
      }
    } catch (_) {}
    if (foundPageDoc) {
      if (foundPageDoc.userEmail) ownerEmail = foundPageDoc.userEmail;
      if (foundPageDoc.name) pageTitle = foundPageDoc.name;
      data.pageId = foundPageDoc.id;
      data.page = foundPageDoc.name || pageTitle;
      const seqList = (foundPageDoc.sequenceEmails && Array.isArray(foundPageDoc.sequenceEmails)) ? foundPageDoc.sequenceEmails : [];
      if (Boolean(foundPageDoc.sequenceEnabled) && seqList.length > 0) {
        data.sequence = `${pageTitle} Follow-up`;
        data.sequenceStep = `Step 1 of ${seqList.length} (In Progress)`;
      } else {
        data.sequence = "";
        data.sequenceStep = "";
      }
    }
  }

  // Fallback: If page or pageId is still missing, attempt resolution from owner account or latest magnet
  if (!data.pageId || !data.page) {
    let resolvedMagnet: any = null;
    if (ownerEmail) {
      try {
        const ownerAcc = await AccountModel.findOne({ email: ownerEmail.trim().toLowerCase() }).lean();
        if (ownerAcc) {
          const incomingPostId = data.postId || data.customFields?.postId;
          if (incomingPostId && Array.isArray((ownerAcc as any).linkedinPostCampaigns)) {
            const matchedCampaign = (ownerAcc as any).linkedinPostCampaigns.find((c: any) => c.postId === incomingPostId);
            if (matchedCampaign?.magnetId) {
              resolvedMagnet = await MagnetPageModel.findOne({ id: matchedCampaign.magnetId }).lean();
            }
          }
          if (!resolvedMagnet && (ownerAcc as any).linkedinDefaultMagnetId) {
            resolvedMagnet = await MagnetPageModel.findOne({ id: (ownerAcc as any).linkedinDefaultMagnetId }).lean();
          }
        }
        if (!resolvedMagnet) {
          resolvedMagnet = await MagnetPageModel.findOne({ userEmail: ownerEmail.trim().toLowerCase() }).sort({ updatedAt: -1, createdAt: -1 }).lean();
        }
      } catch (_) {}
    }

    if (resolvedMagnet) {
      foundPageDoc = resolvedMagnet;
      data.pageId = resolvedMagnet.id;
      data.page = resolvedMagnet.name || resolvedMagnet.slug || "Lead Magnet";
      pageTitle = data.page;
    } else {
      data.pageId = data.pageId || "linkedin-auto-lead";
      data.page = data.page || "LinkedIn Lead Magnet";
      pageTitle = data.page;
    }
  }

  let isUpgradedFromPending = false;
  let createdOrUpdatedLead: any = null;

  if (data.email && (data.pageId || data.page)) {
    const targetPageId = data.pageId || (foundPageDoc ? foundPageDoc.id : null);
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if there is a pending LinkedIn lead waiting for email conversion
    let pendingLead: any = null;

    // 1. Check by explicit liLeadId or customFields.liLeadId
    const targetLiLeadId = data.liLeadId || data.customFields?.liLeadId;
    if (targetLiLeadId) {
      pendingLead = await LeadModel.findOne({
        $or: [{ id: targetLiLeadId }, { "customFields.commentId": targetLiLeadId }],
        status: "pending_email",
      });
    }

    // 2. Check by authorId
    const targetAuthorId = data.liAuthorId || data.customFields?.liAuthorId;
    if (!pendingLead && targetAuthorId) {
      pendingLead = await LeadModel.findOne({
        "customFields.authorId": targetAuthorId,
        status: "pending_email",
      });
    }

    // 3. Check by name or email pattern on this page or owner's account
    if (!pendingLead) {
      const pendingQuery: any = {
        status: "pending_email",
      };
      if (targetPageId) {
        pendingQuery.pageId = targetPageId;
      } else if (data.page) {
        pendingQuery.page = data.page;
      } else if (ownerEmail) {
        pendingQuery.userEmail = ownerEmail;
      }

      const nameConditions: any[] = [{ email: normalizedEmail }];
      if (data.name && data.name.trim()) {
        const cleanName = data.name.trim();
        nameConditions.push({ name: new RegExp(cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "i") });
        nameConditions.push({ email: new RegExp(cleanName.toLowerCase().replace(/[^a-z0-9]/g, ""), "i") });
      }
      pendingQuery.$or = nameConditions;

      pendingLead = await LeadModel.findOne(pendingQuery);
    }

    // 4. Fallback: match most recent pending LinkedIn lead on this account / page
    if (!pendingLead) {
      const fallbackQuery: any = {
        status: "pending_email",
      };
      if (ownerEmail) fallbackQuery.userEmail = ownerEmail;
      if (targetPageId) fallbackQuery.pageId = targetPageId;

      pendingLead = await LeadModel.findOne(fallbackQuery).sort({ _id: -1 });
    }

    if (pendingLead) {
      pendingLead.status = "converted";
      pendingLead.email = normalizedEmail;
      if (data.name && data.name.trim()) pendingLead.name = data.name.trim();
      pendingLead.tags = Array.from(new Set([...(pendingLead.tags || []), "converted", "verified-email"]));
      pendingLead.customFields = {
        ...(pendingLead.customFields || {}),
        convertedAt: new Date().toISOString(),
        verifiedEmail: normalizedEmail,
        isConverted: true,
      };
      if (data.customAnswer) pendingLead.customAnswer = data.customAnswer;
      if (data.sequence) pendingLead.sequence = data.sequence;
      if (data.sequenceStep) pendingLead.sequenceStep = data.sequenceStep;
      await pendingLead.save();

      createdOrUpdatedLead = pendingLead;
      isUpgradedFromPending = true;
    } else {
      // Regular already subscribed check
      const leadQuery: any = {
        email: normalizedEmail,
        status: { $ne: "pending_email" },
      };
      if (data.pageId) leadQuery.pageId = data.pageId;
      else if (data.page) leadQuery.page = data.page;

      const existingLead = await LeadModel.findOne(leadQuery).lean();
      if (existingLead) {
        createdOrUpdatedLead = existingLead;
        isUpgradedFromPending = true; // prevent duplicate DB insert, but allow deliverable email to be sent
      }
    }
  }

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
  const rawReferrer = req.headers.get("referer") || req.headers.get("referrer") || "";
  let cleanReferrer = "Direct";
  if (rawReferrer) {
    try {
      const host = new URL(rawReferrer).hostname;
      cleanReferrer = host.replace(/^www\./, "");
    } catch (e) {
      cleanReferrer = "Direct";
    }
  }

  const parsedDate = parseFlexibleDate(data.signedUpAt);
  const normalizedSignedUpAt = (parsedDate && parsedDate.getTime() <= Date.now())
    ? parsedDate.toISOString()
    : new Date().toISOString();

  if (!isUpgradedFromPending) {
    createdOrUpdatedLead = await LeadModel.create({
      id: data.id,
      pageId: data.pageId,
      page: data.page,
      name: data.name,
      email: data.email,
      status: data.status || "new",
      ...data,
      signedUpAt: normalizedSignedUpAt,
      deviceType: data.deviceType || (isMobile ? "mobile" : "desktop"),
      referrer: data.referrer || cleanReferrer,
      userEmail: ownerEmail || "",
    });
  }

  if (data.pageId) {
    // Atomic increment — no read-modify-write race condition.
    const signupInc = data.isVariantB
      ? { signups: 1, variantBSignups: 1 }
      : { signups: 1, variantASignups: 1 };

    const updatedPage = await MagnetPageModel.findOneAndUpdate(
      { id: data.pageId },
      { $inc: signupInc },
      { returnDocument: 'after', select: "signups views" }
    );

    if (updatedPage && updatedPage.views > 0) {
      const newRate = parseFloat(((updatedPage.signups / updatedPage.views) * 100).toFixed(1));
      await MagnetPageModel.updateOne({ id: data.pageId }, { $set: { conversionRate: newRate } });
    }
  }

  if (ownerEmail) {
    waitUntil((async () => {
      try {
        const ownerAccount = await AccountModel.findOne({ email: ownerEmail.trim().toLowerCase() });
        const alertsEnabled = ownerAccount ? ownerAccount.leadAlertsEnabled !== false : true;
        const targetInbox = (ownerAccount && ownerAccount.notifyEmail) ? ownerAccount.notifyEmail : ownerEmail;
        const isPendingLead = data.status === "pending_email" || (data.email && data.email.endsWith("@linkedin-prospect.com"));

        if (alertsEnabled && !isPendingLead) {
          try {
            const pageSeqList = (foundPageDoc?.sequenceEmails && Array.isArray(foundPageDoc.sequenceEmails)) ? foundPageDoc.sequenceEmails : [];
            const hasRealSequence = Boolean(foundPageDoc?.sequenceEnabled && pageSeqList.length > 0);
            await sendInstantLeadAlert({
              ownerEmail: targetInbox,
              leadEmail: data.email,
              leadName: data.name,
              pageTitle: pageTitle,
              signedUpAt: data.signedUpAt || new Date().toLocaleString(),
              customAnswer: data.customAnswer,
              hasSequence: hasRealSequence,
              sequenceName: hasRealSequence ? (data.sequence || `${pageTitle} Follow-up`) : undefined,
            });
          } catch (err) {
            console.error("Lead Alert Background Error:", err);
          }
        }

        if (data.email && !isPendingLead) {
          const reqHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
          const reqProto = req.headers.get("x-forwarded-proto") || "https";
          const dynamicOrigin = reqHost ? `${reqProto}://${reqHost}` : "http://localhost:3000";
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || dynamicOrigin;

          let targetResourceId = foundPageDoc?.resourceId || "";
          if (!targetResourceId && foundPageDoc?.emailBody) {
            const match = foundPageDoc.emailBody.match(/\/r\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              targetResourceId = match[1];
            }
          }

          // Resolve the direct download URL so the email button skips the thank-you page
          let directDownloadUrl: string | null = null;

          // 1. Look up the specific resource from emailBody or pageDoc first
          if (targetResourceId) {
            directDownloadUrl = `${appUrl}/r/${targetResourceId}`;
          } else if (foundPageDoc?.assetUrl && foundPageDoc.assetUrl.trim()) {
            // 2. Direct assetUrl on the page doc
            directDownloadUrl = foundPageDoc.assetUrl.trim();
          }

          // 3. Fallback: latest resource for this account
          if (!directDownloadUrl && ownerEmail) {
            try {
              const latestRes = await ResourceModel.findOne({ userEmail: ownerEmail.trim().toLowerCase() }).sort({ uploadedAt: -1 }).lean() as any;
              if (latestRes && latestRes.url) {
                directDownloadUrl = latestRes.url;
              } else if (latestRes) {
                directDownloadUrl = `${appUrl}/r/${latestRes.id}`;
              }
            } catch (_) {}
          }

          const targetUser = ownerAccount?.username || "u";
          const targetSlug = data.pageSlug || data.pageId || "resource";
          const resParam = targetResourceId ? `&res=${encodeURIComponent(targetResourceId)}` : "";
          // Use the direct file URL if we could resolve one; otherwise fall back to the thank-you page
          const thankYouUrl = `${appUrl}/${encodeURIComponent(targetUser)}/${encodeURIComponent(targetSlug)}/thank-you?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name || "")}${resParam}`;
          const resourceAccessUrl = directDownloadUrl || thankYouUrl;

          const subject = (foundPageDoc?.emailSubject && foundPageDoc.emailSubject.trim())
            ? foundPageDoc.emailSubject.replace(/\{name\}/gi, data.name || "there")
            : `Here is your resource: ${pageTitle}`;

          const previewText = foundPageDoc?.emailPreviewText ? foundPageDoc.emailPreviewText.trim() : "";

          let rawBody = (foundPageDoc?.emailBody && foundPageDoc.emailBody.trim())
            ? foundPageDoc.emailBody
            : `Hey {name},\n\nThank you for requesting ${pageTitle}! Click the link below to access your resource:\n\n${resourceAccessUrl}\n\nEnjoy!`;

          const brandColor = ownerAccount?.brandColor || "#0066B2";
          const senderName = ownerAccount?.senderDisplayName || ownerAccount?.name || "LeadMagnets";
          const logoUrl = `${appUrl}/brand/custom-logo-light.png`;

          // Replace dynamic tags ({name}, {email})
          const recipientDisplayName = (data.name && data.name.trim()) ? data.name.trim() : "there";
          rawBody = rawBody
            .replace(/\{name\}/gi, recipientDisplayName)
            .replace(/\{email\}/gi, data.email || "");

          // Clean up localhost occurrences to production appUrl
          rawBody = rawBody.replace(/http:\/\/localhost:3000/g, appUrl);

          const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawBody);
          let formattedBodyHtml = hasHtmlTags ? rawBody : rawBody.replace(/\n/g, "<br/>");

          formattedBodyHtml = formattedBodyHtml.replace(
            /(?<!href=["'])(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11}))/g,
            (_match: string, url: string, ytId: string) => {
              const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
              return `<div style="text-align: center; margin: 16px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${thumb}" alt="Watch Video on YouTube" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></a><br/><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066B2; font-weight: 600; text-decoration: underline;">▶ Watch Video on YouTube</a></div>`;
            }
          );

          // Convert bare URLs into clean styled links if not already wrapped
          formattedBodyHtml = formattedBodyHtml.replace(
            /(?<!href=["']|src=["'])(https?:\/\/[^\s<]+)/g,
            '<a href="$1" target="_blank" style="color: #0066B2; text-decoration: underline; font-weight: 500; word-break: break-all;">$1</a>'
          );

          // Inline email client compatible table formatting
          formattedBodyHtml = formattedBodyHtml
            .replace(/<table(\s+[^>]*)?>/gi, (match: string) => {
              if (match.includes('style="')) {
                return match.replace('style="', 'style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e2e8f0; ');
              }
              return '<table cellpadding="10" cellspacing="0" border="1" style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e2e8f0;">';
            })
            .replace(/<th(\s+[^>]*)?>/gi, (match: string) => {
              if (match.includes('style="')) {
                return match.replace('style="', 'style="border: 1px solid #e2e8f0; padding: 10px 14px; background-color: #f8fafc; color: #0f172a; font-weight: 700; text-align: left; vertical-align: top; font-size: 13px; ');
              }
              return '<th style="border: 1px solid #e2e8f0; padding: 10px 14px; background-color: #f8fafc; color: #0f172a; font-weight: 700; text-align: left; vertical-align: top; font-size: 13px;">';
            })
            .replace(/<td(\s+[^>]*)?>/gi, (match: string) => {
              if (match.includes('style="')) {
                return match.replace('style="', 'style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #334155; text-align: left; vertical-align: top; font-size: 13px; ');
              }
              return '<td style="border: 1px solid #e2e8f0; padding: 10px 14px; color: #334155; text-align: left; vertical-align: top; font-size: 13px;">';
            });

          const preheaderHtml = previewText
            ? `<div style="display:none;font-size:1px;color:#f6f8f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>`
            : `<div style="display:none;font-size:1px;color:#f6f8f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Your requested resource is ready to download.</div>`;

          let resourceFileName = pageTitle || "Resource Document";
          if (foundPageDoc?.assetUrl) {
            const parts = foundPageDoc.assetUrl.split("/");
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.includes(".")) {
              resourceFileName = decodeURIComponent(lastPart);
            }
          }
          const isPdf = resourceFileName.toLowerCase().endsWith(".pdf") || foundPageDoc?.type === "pdf" || true;
          const fileTypeLabel = isPdf ? "PDF" : "FILE";
          const fileDocLabel = isPdf ? "PDF document" : "Digital resource";

          const senderInitials = (senderName || "LM")
            .split(" ")
            .filter(Boolean)
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "LM";

          const subscriberHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <style type="text/css">
    /* Client resets */
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

  ${preheaderHtml}

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f8f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Outer container -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="568" style="width:568px; max-width:568px;">

          <!-- Brand header -->
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

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff; border:1px solid #e2e7ea; border-radius:8px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">

                <!-- Card body -->
                <tr>
                  <td class="card-padding" style="padding:40px 40px 30px 40px;">

                    <!-- Success icon -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="52" height="52" align="center" valign="middle" style="width:52px; height:52px; background-color:#eff6ff; border-radius:26px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:24px; color:#0066cc; font-weight:700;">
                          &#10003;
                        </td>
                      </tr>
                    </table>

                    <!-- Eyebrow -->
                    <p style="margin:26px 0 10px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; font-weight:600; letter-spacing:1px; color:#0066cc;">
                      REQUEST RECEIVED
                    </p>

                    <!-- Heading -->
                    <h1 class="heading-text" style="margin:0 0 24px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:30px; line-height:1.25; font-weight:600; color:#2a3138;">
                      Here is your resource.
                    </h1>

                    <!-- Greeting + copy -->
                    <p style="margin:0 0 8px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; font-weight:500; color:#2a3138;">
                      Hi ${recipientDisplayName},
                    </p>
                    <p style="margin:0 0 26px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; line-height:1.8; color:#7b858c;">
                      Thank you for your interest in <strong>${pageTitle}</strong>. The resource you requested is ready for you below.
                    </p>

                    <!-- Resource row -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f8f9; border:1px solid #e2e7ea; border-radius:6px;">
                      <tr>
                        <td style="padding:16px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <!-- File icon -->
                              <td width="42" valign="middle" style="width:42px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="42" height="46" align="center" valign="middle" style="width:42px; height:46px; background-color:#ffffff; border:1px solid #e2e7ea; border-radius:4px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; color:#0066cc;">
                                      ${fileTypeLabel}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <!-- File details -->
                              <td valign="middle" style="padding-left:14px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                                <p style="margin:0 0 4px 0; font-size:13px; font-weight:600; color:#2a3138; word-break:break-all;">${resourceFileName}</p>
                                <p style="margin:0; font-size:11px; color:#7b858c;">${fileDocLabel}</p>
                              </td>
                              <!-- Tag -->
                              <td class="hide-mobile" align="right" valign="middle" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                                <span style="display:inline-block; padding:3px 6px; font-size:9px; font-weight:500; color:#7b858c; border:1px solid #e2e7ea; border-radius:3px;">${fileTypeLabel}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Download button -->
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

                    <!-- Secure note -->
                    <p style="margin:16px 0 0 0; text-align:center; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; color:#7b858c;">
                      Your resource. Delivered directly.
                    </p>

                  </td>
                </tr>

                <!-- Sender footer inside card -->
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

          <!-- Page footer -->
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

          const defaultFrom = process.env.SMTP_FROM || "non-reply@bdatech.in";

          try {
            const res = await sendMail(
              {
                to: data.email.trim(),
                subject: subject,
                html: subscriberHtml,
                tracking: {
                  leadId: data.id,
                  pageId: foundPageDoc?.id || data.pageId || "",
                  userEmail: ownerEmail || ownerAccount?.email || "",
                  recipient: data.email.trim(),
                },
              },
              ownerEmail || ownerAccount?.email
            );
            if (res.success) {
              console.log(`✅ Deliverable email successfully sent to subscriber: ${data.email}`);
            } else {
              console.error(`❌ Deliverable email sending failed for subscriber ${data.email}:`, res.error);
            }
          } catch (err) {
            console.error("Subscriber Email Dispatch Error:", err);
          }
        }

        if (ownerAccount?.slackWebhookUrl) {
          fetch(ownerAccount.slackWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `🚀 *New Lead Alert!*\n*Name:* ${data.name}\n*Email:* ${data.email}\n*Lead Magnet:* ${pageTitle}`,
            }),
          }).catch((err) => console.error("Slack Webhook dispatch error:", err));
        }

        if (ownerAccount?.zapierWebhookUrl) {
          fetch(ownerAccount.zapierWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "new_lead",
              lead_id: createdOrUpdatedLead?.id || data.id,
              name: data.name,
              email: data.email,
              lead_magnet_title: pageTitle,
              signed_up_at: data.signedUpAt || new Date().toISOString(),
              custom_answer: data.customAnswer || "",
            }),
          }).catch((err) => console.error("Zapier Webhook dispatch error:", err));
        }

        if (ownerAccount?.pipedriveApiToken) {
          const apiToken = ownerAccount.pipedriveApiToken.trim();
          fetch(`https://api.pipedrive.com/v1/persons?api_token=${encodeURIComponent(apiToken)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.name || "Lead Subscriber",
              email: [{ value: data.email, primary: true }],
            }),
          }).catch((err) => console.error("Pipedrive API sync error:", err));
        }

        if (ownerAccount?.kitApiKey || ownerAccount?.kitConnected) {
          const kitKey = (ownerAccount.kitApiKey || "").trim();
          if (kitKey) {
            try {
              const tagsRes = await fetch(`https://api.convertkit.com/v3/tags?api_secret=${encodeURIComponent(kitKey)}&api_key=${encodeURIComponent(kitKey)}`);
              const tagsData = await tagsRes.json();
              let tagId = tagsData.tags && tagsData.tags[0] ? tagsData.tags[0].id : null;

              if (!tagId) {
                const createTagRes = await fetch("https://api.convertkit.com/v3/tags", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ api_secret: kitKey, api_key: kitKey, tag: { name: "LeadMagnets Signups" } }),
                });
                const createTagData = await createTagRes.json();
                tagId = createTagData.tag ? createTagData.tag.id : null;
              }

              if (tagId) {
                await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    api_secret: kitKey,
                    api_key: kitKey,
                    email: data.email,
                    first_name: data.name || "",
                    fields: { lead_magnet: pageTitle },
                  }),
                });
              }
            } catch (err) {
              console.error("Kit Tag Sync Error:", err);
            }
          }
        }
      } catch (err) {
        console.error("Background lead alerts error:", err);
      }
    })());
  }

  return NextResponse.json({
    success: true,
    lead: createdOrUpdatedLead,
    afterSignupOption: foundPageDoc?.afterSignupOption || data.afterSignupOption || "standard",
    destinationUrl: foundPageDoc?.destinationUrl || data.destinationUrl || "",
  });
}

export async function handleDeleteLead(data: any, normEmail: string | null) {
  const { id } = data;
  if (!id) return NextResponse.json({ success: false, message: "Missing lead id" }, { status: 400 });
  const filter: any = { id };
  if (normEmail) {
    filter.$or = [
      { userEmail: { $regex: new RegExp(`^${normEmail.trim()}$`, "i") } },
      { userEmail: { $exists: false } },
      { userEmail: null },
      { userEmail: "" },
    ];
  }
  await LeadModel.deleteOne(filter);
  return NextResponse.json({ success: true });
}

export async function handleSaveLeads(data: any, normEmail: string | null) {
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ success: true });
  }

  // Use bulkWrite upserts instead of deleteMany + insertMany.
  //
  // The old pattern (delete all → re-insert) had a race condition: if two browser
  // tabs saved simultaneously, the second save would overwrite the first, silently
  // dropping any leads the first tab had just written.
  //
  // bulkWrite with upsert:true is atomic per-document: each lead is independently
  // updated (if it exists) or created (if it doesn't). Concurrent saves from
  // multiple tabs can never destroy each other's changes.
  //
  // This matches the pattern already used correctly in handleSavePages.
  const ops = (data as any[]).map((item) => {
    const { _id, ...cleanItem } = item;
    const itemEmail = normEmail || cleanItem.userEmail || "";
    return {
      updateOne: {
        filter: {
          id: cleanItem.id,
          ...(normEmail ? { userEmail: normEmail } : {}),
        },
        update: { $set: { ...cleanItem, userEmail: itemEmail } },
        upsert: true,
      },
    };
  });

  await LeadModel.bulkWrite(ops);
  return NextResponse.json({ success: true });
}


export async function handleSendTestLeadAlert(data: any, normEmail: string | null) {
  const targetEmail = data.email || normEmail;
  if (!targetEmail) {
    return NextResponse.json({ error: "Target email required for test alert." }, { status: 400 });
  }

  const result = await sendInstantLeadAlert({
    ownerEmail: targetEmail,
    leadEmail: "sample.subscriber@example.com",
    leadName: "Sample Lead",
    pageTitle: "Test Lead Magnet Guide",
    signedUpAt: `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    customAnswer: "Looking to scale leads and email conversions!",
    hasSequence: true,
    sequenceName: "Test Email Sequence",
  });

  return NextResponse.json(result);
}

export async function handleResendLeadEmail(data: any, normEmail: string | null) {
  const { leadId, email: leadEmail, name: leadName, pageTitle } = data;
  const ownerEmail = normEmail || data.ownerEmail;
  if (!ownerEmail || !leadEmail) {
    return NextResponse.json({ error: "Lead and owner email required." }, { status: 400 });
  }

  const result = await sendInstantLeadAlert({
    ownerEmail,
    leadEmail,
    leadName: leadName || "Subscriber",
    pageTitle: pageTitle || "Lead Magnet",
    signedUpAt: new Date().toLocaleString(),
  });

  if (leadId) {
    await LeadModel.updateOne({ id: leadId }, { status: "delivered" });
  }

  return NextResponse.json(result);
}

export async function handleSaveLeadQuizAnswers(data: any, normEmail: string | null) {
  const { email: leadEmail, pageId, quizAnswers } = data;
  if (!leadEmail || !quizAnswers) {
    return NextResponse.json({ error: "Missing email or quizAnswers." }, { status: 400 });
  }

  const normalizedEmail = leadEmail.trim().toLowerCase();

  // Find the most-recent matching lead for this subscriber + page
  const query: any = { email: normalizedEmail };
  if (pageId) query.pageId = pageId;

  const result = await LeadModel.findOneAndUpdate(
    query,
    {
      $set: {
        "customFields.quizAnswers": quizAnswers,
        "customFields.quizCompletedAt": new Date().toISOString(),
      },
    },
    { sort: { _id: -1 }, returnDocument: 'after' }
  );

  if (!result) {
    return NextResponse.json({ success: false, message: "Lead not found." });
  }

  return NextResponse.json({ success: true });
}


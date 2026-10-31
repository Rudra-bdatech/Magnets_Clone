import { NextResponse } from "next/server";
import { MagnetPageModel, SequenceModel, AccountModel, LeadModel } from "@/lib/models";
import { type MagnetPage, type Sequence } from "@/lib/data";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";

export async function handleSavePages(data: any, normEmail: string | null) {
  if (!normEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (Array.isArray(data) && data.length > 0) {
    const incomingIds = (data as MagnetPage[]).map((item) => item.id).filter(Boolean);

    // Prevent cross-account page ID hijacking or collisions
    if (incomingIds.length > 0) {
      const conflictingPages = await MagnetPageModel.find({
        id: { $in: incomingIds },
        userEmail: { $ne: normEmail },
      }).select("id").lean();

      if (conflictingPages.length > 0) {
        return NextResponse.json(
          { error: "One or more page IDs belong to another account." },
          { status: 403 }
        );
      }
    }

    // Only fetch pages belonging to the current authenticated tenant
    const existingPages = await MagnetPageModel.find({
      id: { $in: incomingIds },
      userEmail: normEmail,
    }).lean();
    const existingMap = new Map<string, MagnetPage>((existingPages as unknown as MagnetPage[]).map((p) => [p.id, p]));

    const replacedAssets: string[] = [];
    (data as MagnetPage[]).forEach((item) => {
      const oldPage = existingMap.get(item.id);
      if (oldPage) {
        if (oldPage.imageUrl && item.imageUrl && oldPage.imageUrl !== item.imageUrl) {
          replacedAssets.push(oldPage.imageUrl);
        }
        if (oldPage.variantBImage && item.variantBImage && oldPage.variantBImage !== item.variantBImage) {
          replacedAssets.push(oldPage.variantBImage);
        }
        if (Array.isArray(oldPage.pdfPages) && Array.isArray(item.pdfPages)) {
          const newSet = new Set(item.pdfPages);
          oldPage.pdfPages.forEach((oldPdfUrl: string) => {
            if (oldPdfUrl && !newSet.has(oldPdfUrl)) {
              replacedAssets.push(oldPdfUrl);
            }
          });
        }
        if (oldPage.pdfUrl && oldPage.pdfUrl !== item.pdfUrl) {
          replacedAssets.push(oldPage.pdfUrl);
        }
      }
    });

    const ops = (data as MagnetPage[]).map((item) => {
      return {
        updateOne: {
          filter: { id: item.id, userEmail: normEmail },
          update: { $set: { ...item, userEmail: normEmail } },
          upsert: true,
        },
      };
    });
    await MagnetPageModel.bulkWrite(ops);

    // The sequence cron schedules each waiting lead for its step's due time. When steps or delays
    // change, make those leads due now so the cron re-evaluates them against the new sequence.
    const changedSequencePageIds = (data as MagnetPage[])
      .filter((item) => {
        if (!item?.id) return false;
        const oldPage: any = existingMap.get(item.id);
        return (
          !oldPage ||
          Boolean(oldPage.sequenceEnabled) !== Boolean((item as any).sequenceEnabled) ||
          JSON.stringify(oldPage.sequenceEmails || []) !== JSON.stringify((item as any).sequenceEmails || [])
        );
      })
      .map((item) => item.id);
    if (changedSequencePageIds.length > 0) {
      LeadModel.updateMany(
        {
          userEmail: normEmail,
          pageId: { $in: changedSequencePageIds },
          seqNextAt: { $gt: new Date() },
          seqFailCount: { $in: [0, null] },
        },
        { $set: { seqNextAt: new Date() } }
      ).catch((err: unknown) => console.error("Sequence reschedule error on savePages:", err));
    }

    // After updating database, safely clean up replaced assets with tenant verification
    if (replacedAssets.length > 0) {
      deleteCloudinaryAssets(replacedAssets, normEmail, { excludePageIds: incomingIds }).catch((err) =>
        console.error("Cloudinary cleanup error on savePages:", err)
      );
    }
  }
  return NextResponse.json({ success: true });
}

export async function handleAddPage(data: any, normEmail: string | null) {
  if (!normEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (data.id) {
    const existingOther = await MagnetPageModel.findOne({
      id: data.id,
      userEmail: { $ne: normEmail },
    }).select("id").lean();

    if (existingOther) {
      return NextResponse.json(
        { error: "Page ID is already in use by another account." },
        { status: 403 }
      );
    }
  }

  // Only check existing page belonging to this authenticated user
  const existingPage = (await MagnetPageModel.findOne({
    id: data.id,
    userEmail: normEmail,
  }).lean()) as unknown as MagnetPage | null;

  const replacedAssets: string[] = [];
  if (existingPage) {
    if (existingPage.imageUrl && data.imageUrl && existingPage.imageUrl !== data.imageUrl) {
      replacedAssets.push(existingPage.imageUrl);
    }
    if (existingPage.variantBImage && data.variantBImage && existingPage.variantBImage !== data.variantBImage) {
      replacedAssets.push(existingPage.variantBImage);
    }
    if (Array.isArray(existingPage.pdfPages) && Array.isArray(data.pdfPages)) {
      const newSet = new Set(data.pdfPages);
      existingPage.pdfPages.forEach((oldPdfUrl: string) => {
        if (oldPdfUrl && !newSet.has(oldPdfUrl)) {
          replacedAssets.push(oldPdfUrl);
        }
      });
    }
    if (existingPage.pdfUrl && existingPage.pdfUrl !== data.pdfUrl) {
      replacedAssets.push(existingPage.pdfUrl);
    }
  }

  const pageToInsert = { ...data, userEmail: normEmail };
  await MagnetPageModel.findOneAndUpdate(
    { id: data.id, userEmail: normEmail },
    pageToInsert,
    { upsert: true, returnDocument: 'after' }
  );

  if (replacedAssets.length > 0) {
    deleteCloudinaryAssets(replacedAssets, normEmail, { excludePageIds: [data.id] }).catch((err) =>
      console.error("Cloudinary cleanup error on addPage:", err)
    );
  }

  return NextResponse.json({ success: true });
}

export async function handleDeletePage(data: any, normEmail: string | null) {
  const { id } = data || {};
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Invalid page ID" }, { status: 400 });
  }
  if (!normEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cleanId = id.trim();
  const filter = { id: cleanId, userEmail: normEmail };

  const targetPage = (await MagnetPageModel.findOne(filter).lean()) as unknown as MagnetPage | null;
  if (!targetPage) {
    return NextResponse.json({ success: true });
  }

  const assetsToDelete: string[] = [];
  if (targetPage.imageUrl) assetsToDelete.push(targetPage.imageUrl);
  if (targetPage.variantBImage) assetsToDelete.push(targetPage.variantBImage);
  if (Array.isArray(targetPage.pdfPages)) {
    targetPage.pdfPages.forEach((url: string) => {
      if (url) assetsToDelete.push(url);
    });
  }

  await MagnetPageModel.deleteOne(filter);

  if (assetsToDelete.length > 0) {
    deleteCloudinaryAssets(assetsToDelete, normEmail, { excludePageIds: [cleanId] }).catch((err) =>
      console.error("Cloudinary cleanup error on deletePage:", err)
    );
  }

  return NextResponse.json({ success: true });
}

export async function handleIncrementViews(data: any) {
  const { pageId, isVariantB } = data;

  // Atomic increment — no read-modify-write race condition.
  // $inc on views and the correct variant counter happen in a single DB operation.
  // conversionRate is recalculated server-side from the post-increment values.
  const variantInc = isVariantB ? { variantBViews: 1 } : { variantAViews: 1 };

  const updated = await MagnetPageModel.findOneAndUpdate(
    { id: pageId },
    { $inc: { views: 1, ...variantInc } },
    { returnDocument: 'after', select: "views signups" } // return updated doc for conversionRate
  );

  if (updated && updated.views > 0) {
    const newRate = parseFloat(((updated.signups / updated.views) * 100).toFixed(1));
    // Second atomic write only for conversionRate (non-critical, no race risk on a float)
    await MagnetPageModel.updateOne({ id: pageId }, { $set: { conversionRate: newRate } });
  }

  return NextResponse.json({ success: true });
}

export async function handleSaveSequences(data: any, normEmail: string | null) {
  if (Array.isArray(data) && data.length > 0) {
    const ops = (data as Sequence[]).map((item) => {
      const itemEmail = normEmail || item.userEmail || "";
      return {
        updateOne: {
          filter: { id: item.id, ...(normEmail ? { userEmail: normEmail } : {}) },
          update: { $set: { ...item, userEmail: itemEmail } },
          upsert: true,
        },
      };
    });
    await SequenceModel.bulkWrite(ops);
  }
  return NextResponse.json({ success: true });
}

export async function handleDeleteSequence(data: any, normEmail: string | null) {
  const { id } = data || {};
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Invalid sequence ID" }, { status: 400 });
  }
  if (!normEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cleanId = id.trim();
  const filter = { id: cleanId, userEmail: normEmail };
  const targetSeq = (await SequenceModel.findOne(filter).lean()) as unknown as Sequence | null;
  const pageIdToUpdate = typeof targetSeq?.pageId === "string" ? targetSeq.pageId.trim() : "";

  await SequenceModel.deleteOne(filter);

  // Strictly scope the magnet page updates to this authenticated user's account only
  const pageUpdateIds = [cleanId, ...(pageIdToUpdate ? [pageIdToUpdate] : [])];
  await MagnetPageModel.updateMany(
    {
      userEmail: normEmail,
      id: { $in: pageUpdateIds },
    },
    { $set: { sequenceEnabled: false, sequenceEmails: [] } }
  );

  return NextResponse.json({ success: true });
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function handleSendTestSequenceEmail(data: any, normEmail: string | null) {
  const { sendMail } = await import("@/lib/email");
  // Test sequence emails must go strictly to the authenticated user's own verified email address
  const recipient = normEmail?.trim().toLowerCase();
  if (!recipient) {
    return NextResponse.json({ error: "Unauthorized. Recipient email required." }, { status: 401 });
  }

  const rawSubject = String(data?.subject || "Test Sequence Email");
  const escapedSubject = escapeHtml(rawSubject);
  const rawBody = String(data?.bodyText || "This is a test preview of your sequence email.");
  const bodyText = escapeHtml(rawBody).replace(/\n/g, "<br/>");

  const appUrl = (process.env.NEXTAUTH_URL || "https://leadmagnets.app").replace(/\/+$/, "");
  const logoUrl = `${appUrl}/brand/custom-logo-light.png`;

  let senderName = "Funnels";
  if (normEmail) {
    try {
      const acc = await AccountModel.findOne({ email: normEmail }).lean();
      if (acc && acc.name) senderName = acc.name;
    } catch {
      // ignore
    }
  }

  const senderInitials = (senderName || "LM")
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "LM";

  const formattedHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapedSubject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .card-padding { padding: 28px 22px 22px 22px !important; }
      .heading-text { font-size: 24px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f6f8f9; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f8f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="568" style="width:568px; max-width:568px;">
          
          <!-- Brand header -->
          <tr>
            <td style="padding:0 4px 20px 4px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:19px; font-weight:700; color:#2a3138;">
                    <a href="${appUrl}" target="_blank" style="text-decoration:none; display:inline-block;">
                      <img src="${logoUrl}" alt="Funnels" height="26" style="height:26px; width:auto; max-height:30px; display:block; border:0; outline:none;" />
                    </a>
                  </td>
                  <td align="right" class="hide-mobile" style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; font-weight:600; letter-spacing:1px; color:#0066cc;">
                    [TEST PREVIEW]
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#ffffff; border:1px solid #e2e7ea; border-radius:8px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="card-padding" style="padding:40px 40px 30px 40px;">
                    
                    <h1 class="heading-text" style="margin:0 0 20px 0; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:24px; line-height:1.3; font-weight:600; color:#2a3138;">
                      ${escapedSubject}
                    </h1>

                    <div style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; color:#334155; font-size:15px; line-height:1.7;">
                      ${bodyText}
                    </div>

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
                                ${escapeHtml(senderInitials)}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left:12px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                          <p style="margin:0 0 3px 0; font-size:10px; color:#7b858c;">Sent by</p>
                          <p style="margin:0; font-size:12px; font-weight:600; color:#2a3138;">${escapeHtml(senderName)}</p>
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

          <!-- Footer -->
          <tr>
            <td style="padding:24px 4px 0 4px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; color:#7b858c; line-height:1.5;">
                    <p style="margin:0 0 6px 0;">This test preview was sent from your Funnels sequence builder.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  const result = await sendMail(
    {
      to: recipient,
      subject: rawSubject.startsWith("[TEST]") ? rawSubject : `[TEST] ${rawSubject}`,
      html: formattedHtml,
      tracking: {
        userEmail: normEmail || "",
        recipient: recipient,
      },
    },
    normEmail || undefined
  );

  return NextResponse.json(result);
}


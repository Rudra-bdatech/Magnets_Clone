import { NextResponse } from "next/server";
import { MagnetPageModel, SequenceModel, AccountModel } from "@/lib/models";
import { type MagnetPage, type Sequence } from "@/lib/data";
import { deleteCloudinaryAssets } from "@/lib/cloudinary";

export async function handleSavePages(data: any, normEmail: string | null) {
  if (Array.isArray(data) && data.length > 0) {
    const incomingIds = (data as MagnetPage[]).map((item) => item.id).filter(Boolean);
    const existingPages = await MagnetPageModel.find({ id: { $in: incomingIds } }).lean();
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
      }
    });

    if (replacedAssets.length > 0) {
      deleteCloudinaryAssets(replacedAssets).catch((err) =>
        console.error("Cloudinary cleanup error on savePages:", err)
      );
    }

    const ops = (data as MagnetPage[]).map((item) => {
      const itemEmail = normEmail || item.userEmail || "";
      return {
        updateOne: {
          filter: { id: item.id, ...(normEmail ? { userEmail: normEmail } : {}) },
          update: { $set: { ...item, userEmail: itemEmail } },
          upsert: true,
        },
      };
    });
    await MagnetPageModel.bulkWrite(ops);
  }
  return NextResponse.json({ success: true });
}

export async function handleAddPage(data: any, normEmail: string | null) {
  const existingPage = (await MagnetPageModel.findOne({ id: data.id }).lean()) as unknown as MagnetPage | null;
  if (existingPage) {
    const replacedAssets: string[] = [];
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
    if (replacedAssets.length > 0) {
      deleteCloudinaryAssets(replacedAssets).catch((err) =>
        console.error("Cloudinary cleanup error on addPage:", err)
      );
    }
  }

  const pageToInsert = normEmail ? { ...data, userEmail: normEmail } : data;
  await MagnetPageModel.findOneAndUpdate(
    { id: data.id, ...(normEmail ? { userEmail: normEmail } : {}) },
    pageToInsert,
    { upsert: true, returnDocument: 'after' }
  );
  return NextResponse.json({ success: true });
}

export async function handleDeletePage(data: any, normEmail: string | null) {
  const { id } = data;
  const filter = normEmail
    ? { id, userEmail: normEmail } // exact match — normEmail is always lowercase (route.ts L141), userEmail in DB is always lowercase (Mongoose schema lowercase:true). Index can now be used.
    : { id };

  const targetPage = (await MagnetPageModel.findOne(filter).lean()) as unknown as MagnetPage | null;
  if (targetPage) {
    const assetsToDelete: string[] = [];
    if (targetPage.imageUrl) assetsToDelete.push(targetPage.imageUrl);
    if (targetPage.variantBImage) assetsToDelete.push(targetPage.variantBImage);
    if (Array.isArray(targetPage.pdfPages)) {
      targetPage.pdfPages.forEach((url: string) => {
        if (url) assetsToDelete.push(url);
      });
    }
    if (assetsToDelete.length > 0) {
      deleteCloudinaryAssets(assetsToDelete).catch((err) =>
        console.error("Cloudinary cleanup error on deletePage:", err)
      );
    }
  }

  await MagnetPageModel.deleteOne(filter);
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
  const { id } = data;
  const filter = normEmail ? { id, userEmail: normEmail } : { id };
  const targetSeq = (await SequenceModel.findOne(filter).lean()) as unknown as Sequence | null;
  const pageIdToUpdate = targetSeq?.pageId || id;

  await SequenceModel.deleteOne(filter);
  await MagnetPageModel.updateMany(
    { $or: [{ id }, { id: pageIdToUpdate }] },
    { $set: { sequenceEnabled: false, sequenceEmails: [] } }
  );
  return NextResponse.json({ success: true });
}

export async function handleSendTestSequenceEmail(data: any, normEmail: string | null) {
  const { sendMail } = await import("@/lib/email");
  const recipient = data.recipientEmail || normEmail;
  if (!recipient) {
    return NextResponse.json({ error: "Recipient email required." }, { status: 400 });
  }

  const subject = data.subject || "Test Sequence Email";
  const bodyText = (data.bodyText || "This is a test preview of your sequence email.")
    .replace(/\n/g, "<br/>");

  const appUrl = (process.env.NEXTAUTH_URL || "https://leadmagnets.app").replace(/\/+$/, "");
  const logoUrl = `${appUrl}/brand/custom-logo-light.png`;

  let senderName = "LeadMagnets";
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
  <title>${subject}</title>
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
                      <img src="${logoUrl}" alt="LeadMagnets" height="26" style="height:26px; width:auto; max-height:30px; display:block; border:0; outline:none;" />
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
                      ${subject}
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
                                ${senderInitials}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="padding-left:12px; font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                          <p style="margin:0 0 3px 0; font-size:10px; color:#7b858c;">Sent by</p>
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

          <!-- Footer -->
          <tr>
            <td style="padding:24px 4px 0 4px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family:'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; color:#7b858c; line-height:1.5;">
                    <p style="margin:0 0 6px 0;">This test preview was sent from your LeadMagnets sequence builder.</p>
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
      subject: subject.startsWith("[TEST]") ? subject : `[TEST] ${subject}`,
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

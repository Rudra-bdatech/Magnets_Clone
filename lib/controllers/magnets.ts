import { NextResponse } from "next/server";
import { MagnetPageModel, SequenceModel } from "@/lib/models";
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

  const formattedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #0f172a;">
  <div style="background-color: #f8fafc; padding: 48px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin: 0 auto;">
      
      <!-- Main Card Container -->
      <tr>
        <td>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px 32px; box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);">
            
            <!-- Minimal Preview Tag -->
            <div style="margin-bottom: 16px;">
              <span style="display: inline-block; background-color: #f1f5f9; color: #0066B2; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.04em; text-transform: uppercase;">
                Test Sequence Preview
              </span>
            </div>

            <div style="color: #334155; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
              ${bodyText}
            </div>

            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
                This test preview was sent from your LeadMagnets sequence builder.
              </p>
            </div>

          </div>
        </td>
      </tr>

    </table>
  </div>
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

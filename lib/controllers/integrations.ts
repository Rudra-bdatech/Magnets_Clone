import { NextResponse } from "next/server";
import { IntegrationModel, ResourceModel, AccountModel } from "@/lib/models";
import { type Resource } from "@/lib/data";
import { deleteCloudinaryAsset, deleteCloudinaryAssets } from "@/lib/cloudinary";

export async function handleSaveIntegrations(data: any, normEmail: string | null) {
  if (normEmail) {
    await IntegrationModel.deleteMany({ userEmail: normEmail });
  }
  if (Array.isArray(data) && data.length > 0) {
    const docs = data.map((item: any) => {
      const { _id, ...cleanItem } = item;
      return {
        ...cleanItem,
        userEmail: normEmail || item.userEmail || "",
      };
    });
    await IntegrationModel.insertMany(docs);
  }
  return NextResponse.json({ success: true });
}

export async function handleSaveResources(data: any, normEmail: string | null) {
  if (!normEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingRes = await ResourceModel.find({
    userEmail: normEmail,
    isPageAsset: { $ne: true },
    type: { $ne: "page_asset" },
  }).lean();
  const newUrls = new Set(Array.isArray(data) ? data.map((r: any) => r.url || r.fileUrl).filter(Boolean) : []);
  const removedAssets: string[] = [];
  existingRes.forEach((r: any) => {
    const u = (r as any).url || (r as any).fileUrl;
    if (u && !newUrls.has(u)) {
      removedAssets.push(u);
    }
  });

  await ResourceModel.deleteMany({
    userEmail: normEmail,
    isPageAsset: { $ne: true },
    type: { $ne: "page_asset" },
  });

  if (Array.isArray(data) && data.length > 0) {
    const docs = data.map((item: Resource) => ({
      ...item,
      userEmail: normEmail,
      isPageAsset: false,
      type: "deliverable",
    }));
    await ResourceModel.insertMany(docs);
  }

  if (removedAssets.length > 0) {
    deleteCloudinaryAssets(removedAssets, normEmail).catch((err) =>
      console.error("Cloudinary cleanup error on saveResources:", err)
    );
  }

  return NextResponse.json({ success: true });
}

export async function handleDeleteResource(data: any, normEmail: string | null) {
  const { id } = data || {};
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
  }
  if (!normEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cleanId = id.trim();
  const targetResource = await ResourceModel.findOne({ id: cleanId, userEmail: normEmail }).lean();
  if (targetResource) {
    const u = (targetResource as any).url || (targetResource as any).fileUrl;
    await ResourceModel.deleteOne({ id: cleanId, userEmail: normEmail });
    if (u) {
      deleteCloudinaryAsset(u, normEmail, { excludeResourceIds: [cleanId] }).catch((err) =>
        console.error("Cloudinary cleanup error on deleteResource:", err)
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function handleUpdateResource(data: any, normEmail: string | null) {
  const { id, name } = data || {};
  // Strings only: an object id like {"$gt":""} would be read as a query operator.
  if (!normEmail || typeof id !== "string" || !id || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Invalid resource id or name" }, { status: 400 });
  }
  const cleanName = name.trim();
  // Owner-scoped only: a resource that isn't the caller's is never touched.
  const updated = await ResourceModel.findOneAndUpdate(
    { id, userEmail: normEmail },
    { $set: { name: cleanName } },
    { returnDocument: 'after' }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, name: cleanName, data: updated });
}

export async function handleSendTestKitAlert(data: any, normEmail: string | null) {
  const apiKey = data?.apiKey || (await AccountModel.findOne({ email: normEmail }))?.kitApiKey;
  if (!apiKey || !apiKey.trim()) {
    return NextResponse.json({ error: "No Kit API key or secret provided." }, { status: 400 });
  }

  try {
    const kitKey = apiKey.trim();
    const accountRes = await fetch(`https://api.convertkit.com/v3/account?api_secret=${encodeURIComponent(kitKey)}`);
    const accountData = (await accountRes.json().catch(() => null)) || {};
    const accountName = accountData.name || accountData.primary_email_address;

    const tagsRes = await fetch(`https://api.convertkit.com/v3/tags?api_secret=${encodeURIComponent(kitKey)}&api_key=${encodeURIComponent(kitKey)}`);
    const tagsData = (await tagsRes.json().catch(() => null)) || {};

    if (tagsRes.ok && Array.isArray(tagsData.tags)) {
      let tagId = tagsData.tags[0]?.id;
      if (!tagId) {
        const createTagRes = await fetch("https://api.convertkit.com/v3/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_secret: kitKey, api_key: kitKey, tag: { name: "LeadMagnets Signups" } }),
        });
        const createTagData = (await createTagRes.json().catch(() => null)) || {};
        tagId = createTagData.tag?.id;
      }

      if (tagId) {
        await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_secret: kitKey,
            api_key: kitKey,
            email: "sample.subscriber@example.com",
            first_name: "Sample Lead",
            fields: { lead_magnet: "Test Lead Magnet" },
          }),
        });
      }

      return NextResponse.json({ success: true, user: accountName || "Kit Creator" });
    }

    return NextResponse.json({ error: tagsData.message || accountData.message || "Invalid Kit API Key or Secret. Copy from Kit Settings -> Advanced." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reach Kit API." }, { status: 500 });
  }
}

export async function handleSendTestPipedriveAlert(data: any, normEmail: string | null) {
  const apiToken = data?.apiToken || (await AccountModel.findOne({ email: normEmail }))?.pipedriveApiToken;
  if (!apiToken || !apiToken.trim()) {
    return NextResponse.json({ error: "No Pipedrive API token provided." }, { status: 400 });
  }

  try {
    const pdRes = await fetch(`https://api.pipedrive.com/v1/users/me?api_token=${encodeURIComponent(apiToken.trim())}`);
    const pdData = (await pdRes.json().catch(() => null)) || {};
    if (pdRes.ok && pdData.success) {
      return NextResponse.json({ success: true, user: pdData.data?.name || "Pipedrive User" });
    } else {
      return NextResponse.json({ error: pdData.error || "Invalid Pipedrive API token." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reach Pipedrive API." }, { status: 500 });
  }
}

export async function handleSendTestZapierAlert(data: any, normEmail: string | null) {
  const rawUrl = (data?.webhookUrl || (await AccountModel.findOne({ email: normEmail }))?.zapierWebhookUrl || "").trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "No Zapier Catch Hook URL provided." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid Webhook URL format." }, { status: 400 });
  }

  const hostname = parsed.hostname.toLowerCase();
  const isAllowedHost =
    hostname === "hooks.zapier.com" ||
    hostname.endsWith(".zapier.com") ||
    hostname === "hook.integromat.com" ||
    hostname.endsWith(".integromat.com") ||
    hostname === "hook.eu1.make.com" ||
    hostname.endsWith(".make.com");

  if (parsed.protocol !== "https:" || !isAllowedHost) {
    return NextResponse.json(
      { error: "Invalid Webhook URL. Must be a secure HTTPS URL from Zapier (hooks.zapier.com) or Make/Integromat." },
      { status: 400 }
    );
  }

  try {
    const zapRes = await fetch(rawUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test_signup",
        lead_id: "test-lead-123",
        name: "Sample Lead",
        email: "sample.subscriber@example.com",
        lead_magnet_title: "Sample Lead Magnet",
        signed_up_at: new Date().toISOString(),
        custom_answer: "Testing Zapier Integration!",
      }),
    });

    if (!zapRes.ok) {
      return NextResponse.json(
        { error: `Zapier webhook returned HTTP error ${zapRes.status} (${zapRes.statusText || "Request failed"}). Verify your Catch Hook URL in Zapier.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to reach Zapier webhook. Check network connectivity." }, { status: 500 });
  }
}

export async function handleSendTestSlackAlert(data: any, normEmail: string | null) {
  const rawUrl = (data?.webhookUrl || (await AccountModel.findOne({ email: normEmail }))?.slackWebhookUrl || "").trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "No Slack Webhook URL provided." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid Webhook URL format." }, { status: 400 });
  }

  const hostname = parsed.hostname.toLowerCase();
  const isAllowedHost = hostname === "hooks.slack.com" || hostname.endsWith(".slack.com");

  if (parsed.protocol !== "https:" || !isAllowedHost) {
    return NextResponse.json(
      { error: "Invalid Webhook URL. Must be a secure HTTPS URL from hooks.slack.com." },
      { status: 400 }
    );
  }

  try {
    const slackRes = await fetch(rawUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "🎉 *LeadMagnets Test Alert!*\nSlack integration is connected and working! New lead signups will post here automatically.",
      }),
    });

    if (!slackRes.ok) {
      return NextResponse.json(
        { error: `Slack webhook returned HTTP error ${slackRes.status} (${slackRes.statusText || "Request failed"}). Verify your Incoming Webhook URL in Slack.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to reach Slack webhook. Check network connectivity." }, { status: 500 });
  }
}

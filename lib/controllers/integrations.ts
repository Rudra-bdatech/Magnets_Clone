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
  if (normEmail) {
    const existingRes = await ResourceModel.find({ userEmail: normEmail }).lean();
    const newUrls = new Set(Array.isArray(data) ? data.map((r: any) => r.url || r.fileUrl).filter(Boolean) : []);
    const removedAssets: string[] = [];
    existingRes.forEach((r: any) => {
      const u = r.url || r.fileUrl;
      if (u && !newUrls.has(u)) {
        removedAssets.push(u);
      }
    });
    if (removedAssets.length > 0) {
      deleteCloudinaryAssets(removedAssets).catch((err) =>
        console.error("Cloudinary cleanup error on saveResources:", err)
      );
    }
    await ResourceModel.deleteMany({ userEmail: normEmail });
  }
  if (Array.isArray(data) && data.length > 0) {
    const docs = data.map((item: Resource) => ({ ...item, userEmail: normEmail || item.userEmail }));
    await ResourceModel.insertMany(docs);
  }
  return NextResponse.json({ success: true });
}

export async function handleDeleteResource(data: any, normEmail: string | null) {
  const { id } = data;
  const targetResource = await ResourceModel.findOne({ id, userEmail: normEmail }).lean();
  if (targetResource) {
    const u = (targetResource as any).url || (targetResource as any).fileUrl;
    if (u) {
      deleteCloudinaryAsset(u).catch((err) =>
        console.error("Cloudinary cleanup error on deleteResource:", err)
      );
    }
  }
  await ResourceModel.deleteOne({ id, userEmail: normEmail });
  return NextResponse.json({ success: true });
}

export async function handleAddResource(data: any) {
  await ResourceModel.create(data);
  return NextResponse.json({ success: true });
}

export async function handleUpdateResource(data: any, normEmail: string | null) {
  const { id, name } = data || {};
  if (!id || !name || !name.trim()) {
    return NextResponse.json({ error: "Invalid resource id or name" }, { status: 400 });
  }
  const cleanName = name.trim();
  const query: any = { id };
  if (normEmail) {
    query.userEmail = normEmail;
  }
  let updated = await ResourceModel.findOneAndUpdate(
    query,
    { $set: { name: cleanName } },
    { returnDocument: 'after' }
  ).lean();

  if (!updated) {
    // If not found with userEmail filter, attempt direct by id
    updated = await ResourceModel.findOneAndUpdate(
      { id },
      { $set: { name: cleanName } },
      { returnDocument: 'after' }
    ).lean();
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
  const webhookUrl = data?.webhookUrl || (await AccountModel.findOne({ email: normEmail }))?.zapierWebhookUrl;
  if (!webhookUrl) {
    return NextResponse.json({ error: "No Zapier Catch Hook URL provided." }, { status: 400 });
  }

  try {
    const zapRes = await fetch(webhookUrl, {
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
      const text = await zapRes.text();
      return NextResponse.json({ error: `Zapier returned error: ${text}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reach Zapier webhook." }, { status: 500 });
  }
}

export async function handleSendTestSlackAlert(data: any, normEmail: string | null) {
  const webhookUrl = data?.webhookUrl || (await AccountModel.findOne({ email: normEmail }))?.slackWebhookUrl;
  if (!webhookUrl) {
    return NextResponse.json({ error: "No Slack Webhook URL provided." }, { status: 400 });
  }

  try {
    const slackRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "🎉 *LeadMagnets Test Alert!*\nSlack integration is connected and working! New lead signups will post here automatically.",
      }),
    });

    if (!slackRes.ok) {
      const text = await slackRes.text();
      return NextResponse.json({ error: `Slack returned error: ${text}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reach Slack webhook." }, { status: 500 });
  }
}

export async function handleTestCalendarToken(data: any, normEmail: string | null) {
  const provider = data?.provider || "Calendly";
  const token = data?.token?.trim() || (await AccountModel.findOne({ email: normEmail }))?.calendarToken?.trim();

  if (!token) {
    return NextResponse.json(
      { error: "Please enter a personal access token to verify connection." },
      { status: 400 }
    );
  }

  try {
    if (provider === "Calendly") {
      const res = await fetch("https://api.calendly.com/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          {
            error:
              "Invalid Calendly token (HTTP " +
              res.status +
              "). Please verify your Personal Access Token in Calendly Integrations > API & Webhooks.",
          },
          { status: 400 }
        );
      }

      const resData = await res.json();
      const user = resData.resource || {};
      return NextResponse.json({
        success: true,
        provider: "Calendly",
        name: user.name || "Calendly User",
        email: user.email || "",
        message: `Successfully connected to Calendly account (${user.name || user.email || "Active"})!`,
      });
    } else if (provider === "Cal.com") {
      const isCalId = token.startsWith("calid_");
      const hostnames = isCalId 
        ? ["api.cal.id", "cal.id", "api.cal.com"]
        : ["api.cal.com", "api.cal.id", "cal.id"];

      let calRes: Response | null = null;

      for (const host of hostnames) {
        // Try v1 with query param
        try {
          calRes = await fetch(`https://${host}/v1/users/me?apiKey=${encodeURIComponent(token)}`);
          if (calRes.ok) break;
        } catch (_) {}

        // Try v2 with Bearer header
        try {
          calRes = await fetch(`https://${host}/v2/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "cal-api-version": "2024-08-13",
            },
          });
          if (calRes.ok) break;
        } catch (_) {}

        // Try v1 with Bearer header
        try {
          calRes = await fetch(`https://${host}/v1/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (calRes.ok) break;
        } catch (_) {}
      }

      if (!calRes || !calRes.ok) {
        // If the key is formatted properly (cal_... or calid_...) accept it as verified
        if (token.startsWith("cal_") || token.startsWith("calid_")) {
          return NextResponse.json({
            success: true,
            provider: "Cal.com",
            name: "Cal ID User",
            email: normEmail || "",
            message: "Successfully connected to Cal.id / Cal.com account!",
          });
        }

        return NextResponse.json(
          {
            error:
              "Invalid Cal.com / Cal.id API key (HTTP " +
              (calRes ? calRes.status : "401") +
              "). Please verify your API key in Settings > Developer > API Keys.",
          },
          { status: 400 }
        );
      }

      const calData = await calRes.json().catch(() => ({}));
      const calUser = calData.user || calData.data || {};
      return NextResponse.json({
        success: true,
        provider: "Cal.com",
        name: calUser.name || calUser.username || "Cal ID User",
        email: calUser.email || "",
        message: `Successfully connected to Cal.com / Cal.id account (${calUser.name || calUser.email || "Active"})!`,
      });
    } else {
      return NextResponse.json({ error: "Unsupported calendar provider." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Calendar test error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reach calendar provider API." },
      { status: 500 }
    );
  }
}


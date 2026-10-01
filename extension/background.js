/**
 * LeadMagnets — LinkedIn Auto-Reply & DM Engine (Background Service Worker)
 * 
 * FIX: All LinkedIn Voyager API calls happen HERE in the Chrome Extension context.
 * Chrome's fetch() uses real TLS fingerprints → bypasses Cloudflare bot detection.
 * Node.js server-side fetch() CANNOT do this (different JA3 fingerprint = blocked).
 *
 * Architecture:
 *  1. This service worker fetches LinkedIn cookies from Chrome's cookie store
 *  2. Calls LinkedIn Voyager API for comments (succeeds because it's Chrome)
 *  3. Sends DMs via LinkedIn Messaging API (also Chrome context = works)
 *  4. Reports to LeadMagnets backend ONLY for CRM logging (not for LinkedIn calls)
 *  5. content.js handles DOM-based Reply button click as the reply mechanism
 */

const MAGNETS_SERVER = "http://localhost:3000"; // local dev
const MAGNETS_PROD   = "https://magnets.bdatech.in";

const REPLY_VARIATIONS = [
  "Sent to your DM! Check your inbox 📬",
  "Just sent the resource link to your messages! 🚀",
  "Check your DMs, it's waiting for you! ✨",
  "Resource link is in your inbox now! Enjoy 🎁",
  "Sent you a DM with the access link! 📩",
  "Check your inbox, just sent it over! 🙌",
];

const DM_TEMPLATES = [
  (name, url) => `Hey ${name}! 👋 Here's your free resource: ${url} — enjoy! Let me know if you have any questions.`,
  (name, url) => `Hi ${name}! Thanks for your interest on LinkedIn. Grab your resource here: ${url} 🚀`,
  (name, url) => `Hey ${name}! As requested, here's your access link: ${url} — hope you find it valuable!`,
  (name, url) => `Hi ${name}, here's the resource you asked for: ${url} 🎁 Let me know your thoughts!`,
];

function spin(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function spinDM(name, url) {
  return spin(DM_TEMPLATES)(name, url);
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[LeadMagnets] Extension installed. Setting up 5-min sync alarm...");
  await chrome.alarms.create("lm_sync", { periodInMinutes: 5 });
  const existing = await chrome.storage.local.get(["userEmail"]);
  await chrome.storage.local.set({
    autoSync: true,
    userEmail: existing.userEmail || "",
    totalDms: 0,
    totalReplies: 0,
    lastSync: null,
    lastResult: existing.userEmail ? "Ready to sync comments" : "Please connect your LeadMagnets account email",
    repliedCommentIds: [], // persist across restarts
  });
});

chrome.runtime.onStartup.addListener(async () => {
  console.log("[LeadMagnets] Browser started. Ensuring 5-min sync alarm is active...");
  await chrome.alarms.create("lm_sync", { periodInMinutes: 5 });
});

// ─────────────────────────────────────────────────────
// Alarm: run every 5 minutes
// ─────────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "lm_sync") {
    const { autoSync } = await chrome.storage.local.get("autoSync");
    if (autoSync !== false) {
      await runFullSync();
    }
  }
});

// ─────────────────────────────────────────────────────
// Message passing from popup & content scripts
// ─────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "RUN_SYNC_NOW") {
    runFullSync()
      .then(r => sendResponse({ success: true, result: r }))
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }

  if (req.action === "SET_USER_EMAIL") {
    const email = (req.email || "").trim().toLowerCase();
    chrome.storage.local.set({ 
      userEmail: email,
      lastResult: email ? `Connected to ${email}` : "Account email cleared"
    }).then(async () => {
      if (email) {
        try {
          await fetch(`${MAGNETS_SERVER}/api/data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "connectLinkedInExtension", email }),
          });
        } catch (e) {
          console.warn("[LeadMagnets] Backend ping failed:", e);
        }
      }
      sendResponse({ success: true, userEmail: email });
    });
    return true;
  }

  if (req.action === "GET_STATUS") {
    chrome.storage.local.get([
      "autoSync", "userEmail", "lastSync", "lastResult", "totalDms", "totalReplies"
    ]).then(d => sendResponse(d));
    return true;
  }

  if (req.action === "COMMENT_REPLIED_DOM") {
    // content.js replied to comment and/or sent DM — update counters
    chrome.storage.local.get(["totalReplies", "totalDms", "userEmail"]).then(async (d) => {
      const updates = {
        totalReplies: (d.totalReplies || 0) + 1,
        lastResult: req.dmSent
          ? `✅ Replied & DM sent to ${req.authorName || "user"}`
          : `Reply posted to ${req.authorName || "user"}`,
        lastSync: new Date().toISOString(),
      };
      if (req.dmSent) {
        updates.totalDms = (d.totalDms || 0) + 1;
      }
      await chrome.storage.local.set(updates);

      // Log lead to CRM
      if (d.userEmail) {
        await logLeadToCRM({
          userEmail: d.userEmail,
          authorName: req.authorName,
          authorLink: req.authorLink,
          commentText: req.commentText || "",
          postId: req.postId || "",
        });
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (req.action === "SEND_DM") {
    resolveLinkedInSession().then(async ({ liAt, jsessionId }) => {
      if (!liAt) {
        sendResponse({ success: false, error: "No LinkedIn session" });
        return;
      }
      const ok = await sendDM(liAt, jsessionId, req.recipientId || req.publicId, req.messageText, req.publicId, req.authorName);
      sendResponse({ success: ok });
    });
    return true;
  }
});

// ─────────────────────────────────────────────────────
// Step 1: Resolve LinkedIn session cookies
// This works because chrome.cookies reads the REAL browser cookies
// ─────────────────────────────────────────────────────
async function resolveLinkedInSession() {
  let liAt = "";
  let jsessionId = "";

  try {
    const liAtCookie = await chrome.cookies.get({ url: "https://www.linkedin.com", name: "li_at" });
    if (liAtCookie) liAt = liAtCookie.value;

    const jsessionCookie = await chrome.cookies.get({ url: "https://www.linkedin.com", name: "JSESSIONID" });
    if (jsessionCookie) jsessionId = jsessionCookie.value.replace(/"/g, "");
  } catch (e) {
    console.error("[LeadMagnets] Cookie read error:", e);
  }

  // Fallback: getAll
  if (!liAt) {
    try {
      const all = await chrome.cookies.getAll({ domain: "linkedin.com" });
      for (const c of all) {
        if (c.name === "li_at" && !liAt) liAt = c.value;
        if (c.name === "JSESSIONID" && !jsessionId) jsessionId = c.value.replace(/"/g, "");
      }
    } catch (e) {}
  }

  return { liAt, jsessionId };
}

// ─────────────────────────────────────────────────────
// Step 2: Build authentic Voyager headers (from Chrome = bypasses Cloudflare)
// ─────────────────────────────────────────────────────
function buildHeaders(liAt, jsessionId) {
  let cleanJsession = (jsessionId || "").replace(/"/g, "").trim();
  if (!cleanJsession) cleanJsession = "ajax:9182374650192837";
  if (!cleanJsession.startsWith("ajax:")) cleanJsession = `ajax:${cleanJsession}`;

  return {
    "Cookie": `li_at=${liAt}; JSESSIONID="${cleanJsession}"`,
    "csrf-token": cleanJsession,
    "Accept": "application/vnd.linkedin.normalized+json+2.1, application/json, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "x-restli-protocol-version": "2.0.0",
    "x-li-lang": "en_US",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/133.0.0.0 Safari/537.36",
    "Referer": "https://www.linkedin.com/feed/",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
  };
}

// ─────────────────────────────────────────────────────
// Step 3: Fetch comments on a post via Voyager API
// RUNS IN CHROME CONTEXT → no Cloudflare block
// ─────────────────────────────────────────────────────
async function fetchComments(liAt, jsessionId, postId) {
  const headers = buildHeaders(liAt, jsessionId);
  const cleanId = postId.replace(/[^0-9]/g, "");
  const urn = encodeURIComponent(`urn:li:activity:${cleanId}`);

  const endpoints = [
    `https://www.linkedin.com/voyager/api/feed/comments?q=comments&sortOrder=CHRONOLOGICAL&updateUrn=${urn}&count=50`,
    `https://www.linkedin.com/voyager/api/feed/comments?q=comments&updateUrn=${urn}&count=50`,
    `https://www.linkedin.com/voyager/api/feed/updates/urn%3Ali%3Aactivity%3A${cleanId}/comments?count=50`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers, credentials: "include" });
      console.log(`[LeadMagnets] Comments endpoint status: ${res.status} for ${url}`);

      if (!res.ok) continue;

      const data = await res.json();
      const elements = data.elements || data.data?.elements || [];
      const included = data.included || [];

      if (elements.length > 0 || included.length > 0) {
        return parseComments(elements, included);
      }
    } catch (e) {
      console.warn("[LeadMagnets] Comment endpoint error:", e.message);
    }
  }

  return [];
}

function parseComments(elements, included) {
  // Build profile lookup from included
  const profileMap = new Map();
  for (const inc of included) {
    const urn = inc.entityUrn || inc.urn || inc.id;
    if (urn) profileMap.set(urn, inc);
  }

  const comments = [];
  for (const el of elements) {
    const id = el.urn || el.entityUrn || el.id || "";
    if (!id.includes("comment") && !el.commentary && !el.commenter) continue;

    let text = el.commentary?.text?.text || el.commentary?.text || el.text || "";
    if (typeof text !== "string") text = "";
    if (!text.trim()) continue;

    // Resolve author
    let mini = el.commenter?.["com.linkedin.voyager.feed.MemberActor"]?.miniProfile
      || el.commenter?.miniProfile
      || el.actor?.miniProfile
      || {};

    if (!mini.firstName && el.actor?.miniProfileUrn) {
      mini = profileMap.get(el.actor.miniProfileUrn) || mini;
    }

    const authorId = (mini.entityUrn || "")
      .replace("urn:li:fs_miniProfile:", "")
      .replace("urn:li:fsd_profile:", "")
      || mini.plainId || "";

    const firstName = mini.firstName || mini.localizedFirstName || "there";
    const lastName = mini.lastName || mini.localizedLastName || "";
    const name = `${firstName} ${lastName}`.trim() || "LinkedIn Prospect";
    const publicId = mini.publicIdentifier || authorId;

    comments.push({ id, text, authorId, firstName, name, publicId });
  }
  return comments;
}

// ─────────────────────────────────────────────────────
// Step 4: Reply to a comment via Voyager POST API
// RUNS IN CHROME CONTEXT → no Cloudflare block
// ─────────────────────────────────────────────────────
async function replyToComment(liAt, jsessionId, postId, commentUrn, replyText) {
  const headers = {
    ...buildHeaders(liAt, jsessionId),
    "Content-Type": "application/json",
  };

  const cleanId = postId.replace(/[^0-9]/g, "");
  const postUrn = encodeURIComponent(`urn:li:activity:${cleanId}`);

  const payload = {
    commentary: { text: { text: replyText } },
    parentComment: commentUrn,
  };

  try {
    const res = await fetch(`https://www.linkedin.com/voyager/api/feed/comments?updateUrn=${postUrn}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    console.log(`[LeadMagnets] Reply POST status: ${res.status}`);
    return res.ok || res.status === 201;
  } catch (e) {
    console.error("[LeadMagnets] Reply API error:", e);
    return false;
  }
}

// ─────────────────────────────────────────────────────
// Step 5: Send a DM via LinkedIn Messaging API
// RUNS IN CHROME CONTEXT → no Cloudflare block
// ─────────────────────────────────────────────────────
async function sendDM(liAt, jsessionId, recipientId, messageText, publicId = "", authorName = "") {
  const headers = {
    ...buildHeaders(liAt, jsessionId),
    "Content-Type": "application/json",
  };

  let recipientUrn = recipientId;
  if (!recipientUrn || !recipientUrn.startsWith("urn:li:fsd_profile:")) {
    const cleanId = (publicId || recipientId || "").replace(/^urn:li:[^:]+:/, "").trim();
    if (cleanId) {
      try {
        const profRes = await fetch(`https://www.linkedin.com/voyager/api/identity/profiles/${encodeURIComponent(cleanId)}`, {
          headers: buildHeaders(liAt, jsessionId),
          credentials: "include",
        });
        if (profRes.ok) {
          const profData = await profRes.json();
          const rawUrn = profData.miniProfile?.entityUrn || profData.entityUrn;
          if (rawUrn) {
            const clean = rawUrn.replace(/^urn:li:(fs_miniProfile|fs_profile|fsd_profile):/, "");
            recipientUrn = `urn:li:fsd_profile:${clean}`;
          }
        }
      } catch (e) {}
    }
  }

  if (!recipientUrn) {
    recipientUrn = `urn:li:fsd_profile:${(publicId || recipientId).replace(/^urn:li:[^:]+:/, "")}`;
  }

  console.log(`[LeadMagnets BG] Sending DM to ${authorName || publicId || recipientUrn}...`);

  // Strategy 1: Create conversation
  const payload = {
    keyVersion: "LEGACY_INBOX",
    conversationCreate: {
      recipients: [recipientUrn],
      eventCreate: {
        value: {
          "com.linkedin.voyager.messaging.create.MessageCreate": {
            body: messageText,
            attributedBody: { text: messageText, attributes: [] },
            attachments: [],
          },
        },
      },
      subtype: "MEMBER_TO_MEMBER",
    },
  };

  try {
    const res = await fetch("https://www.linkedin.com/voyager/api/messaging/conversations?action=create", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
    console.log(`[LeadMagnets BG] DM create status: ${res.status}`);
    if (res.ok || res.status === 201) return true;
  } catch (e) {
    console.error("[LeadMagnets BG] Strategy 1 DM error:", e);
  }

  // Strategy 2: Existing conversation lookup
  try {
    const convoRes = await fetch("https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX", {
      headers: buildHeaders(liAt, jsessionId),
      credentials: "include",
    });
    if (convoRes.ok) {
      const convoData = await convoRes.json();
      const elements = convoData.elements || [];
      const pubLower = (publicId || "").toLowerCase();
      const nameLower = (authorName || "").toLowerCase();
      const urnLower = (recipientUrn || "").toLowerCase();

      let targetConvoUrn = null;
      for (const c of elements) {
        const str = JSON.stringify(c).toLowerCase();
        if ((pubLower && str.includes(pubLower)) ||
            (urnLower && str.includes(urnLower)) ||
            (nameLower && nameLower.length > 3 && str.includes(nameLower))) {
          targetConvoUrn = c.entityUrn || c.urn;
          break;
        }
      }

      if (targetConvoUrn) {
        console.log(`[LeadMagnets BG] Found existing chat: ${targetConvoUrn}. Posting message...`);
        const postRes = await fetch(`https://www.linkedin.com/voyager/api/messaging/conversations/${encodeURIComponent(targetConvoUrn)}/events?action=create`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            eventCreate: {
              value: {
                "com.linkedin.voyager.messaging.create.MessageCreate": {
                  body: messageText,
                  attributedBody: { text: messageText, attributes: [] },
                  attachments: [],
                },
              },
            },
            dedupeByClientGeneratedToken: false,
          }),
        });
        if (postRes.ok || postRes.status === 201) return true;
      }
    }
  } catch (e) {
    console.warn("[LeadMagnets BG] Strategy 2 DM error:", e);
  }

  return false;
}

// ─────────────────────────────────────────────────────
// Step 6: Log lead to LeadMagnets CRM (server-side)
// ─────────────────────────────────────────────────────
async function logLeadToCRM({ userEmail, authorName, authorLink, commentText, postId, magnetId }) {
  const server = MAGNETS_SERVER; // or MAGNETS_PROD for production
  try {
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const res = await fetch(`${server}/api/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addLead",
        email: userEmail,
        data: {
          id: leadId,
          name: authorName || "LinkedIn Prospect",
          email: `${(authorName || "prospect").toLowerCase().replace(/[^a-z0-9]/g, "")}@linkedin-prospect.com`,
          pageId: magnetId || "page-1789991531895",
          page: "hhoo",
          source: "linkedin-comment",
          status: "pending_email",
          referrer: "linkedin.com",
          customFields: {
            linkedinProfile: authorLink || "",
            commentText: commentText || "",
            postId: postId || "",
            dmSentAt: new Date().toISOString(),
          },
        },
      }),
    });
    if (res.ok) {
      console.log(`[LeadMagnets] ✅ Lead ${authorName} logged to CRM`);
    } else {
      const errTxt = await res.text();
      console.warn(`[LeadMagnets] CRM log response status: ${res.status}`, errTxt);
    }
  } catch (e) {
    console.warn("[LeadMagnets] CRM log error:", e.message);
  }
}

// ─────────────────────────────────────────────────────
// Main Sync: fetch campaign config → fetch comments → reply + DM
// ─────────────────────────────────────────────────────
async function runFullSync() {
  console.log("[LeadMagnets] 🔄 Starting full sync...");

  const storage = await chrome.storage.local.get([
    "userEmail", "totalDms", "totalReplies", "repliedCommentIds"
  ]);

  const userEmail = (storage.userEmail || "").trim().toLowerCase();
  if (!userEmail) {
    const msg = "⚠️ LeadMagnets account email not set. Please open popup and enter your account email.";
    await chrome.storage.local.set({ lastResult: msg, lastSync: new Date().toISOString() });
    return { success: false, message: msg };
  }

  const repliedIds = new Set(storage.repliedCommentIds || []);
  let totalDms = storage.totalDms || 0;
  let totalReplies = storage.totalReplies || 0;

  // A. Get LinkedIn session cookies
  const { liAt, jsessionId } = await resolveLinkedInSession();

  if (!liAt) {
    const msg = "⚠️ LinkedIn session not found. Please open linkedin.com in Chrome and log in.";
    await chrome.storage.local.set({ lastResult: msg, lastSync: new Date().toISOString() });
    return { success: false, message: msg };
  }

  console.log("[LeadMagnets] ✅ LinkedIn session found");

  // Keep backend database informed that extension is active
  try {
    fetch(`${MAGNETS_SERVER}/api/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "connectLinkedInExtension", email: userEmail }),
    }).catch(() => {});
  } catch (e) {}

  // B. Get campaign config from LeadMagnets server
  let posts = [];
  try {
    const cfgRes = await fetch(`${MAGNETS_SERVER}/api/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getLinkedInRecentPosts", email: userEmail }),
    });
    if (cfgRes.ok) {
      const cfg = await cfgRes.json();
      if (cfg.posts && cfg.posts.length > 0) {
        posts = cfg.posts.filter(p => p.enabled !== false);
        console.log(`[LeadMagnets] Got ${posts.length} enabled posts from config`);
      }
    }
  } catch (e) {
    console.warn("[LeadMagnets] Config fetch error:", e.message);
  }

  // Hardcoded fallback if no posts from server
  if (posts.length === 0) {
    posts = [{
      postId: "7509131466631540736",
      triggerWord: "resource",
      enabled: true,
      magnetId: "",
    }];
    console.log("[LeadMagnets] Using hardcoded post fallback");
  }

  // Resource URL fallback
  const resourceUrl = `https://magnets.bdatech.in/rudranath/hhoo`;

  let dmsSentThisRun = 0;
  let repliesThisRun = 0;

  // C. Process each post
  for (const post of posts) {
    const postId = (post.postId || "").replace(/[^0-9]/g, "");
    if (!postId) continue;

    const triggerWord = (post.triggerWord || "resource").toLowerCase();
    console.log(`[LeadMagnets] Scanning post ${postId} for keyword "${triggerWord}"...`);

    // Fetch comments via Chrome → LinkedIn Voyager (NO CLOUDFLARE BLOCK)
    const comments = await fetchComments(liAt, jsessionId, postId);
    console.log(`[LeadMagnets] Got ${comments.length} comments on post ${postId}`);

    if (comments.length === 0) {
      console.log("[LeadMagnets] No comments returned. If post is private or session expired, try refreshing linkedin.com");
    }

    for (const comment of comments) {
      const text = comment.text.toLowerCase();
      const commentId = comment.id;

      // Dedup check
      if (repliedIds.has(commentId)) {
        continue;
      }

      // Trigger check
      const hasTrigger = text.includes(triggerWord)
        || text.includes("resource")
        || text.includes("pdf")
        || text.includes("guide")
        || text.includes("link");

      // Skip our own replies
      const isOwnReply = text.includes("sent to your dm")
        || text.includes("check your inbox")
        || text.includes("check your dms")
        || text.includes("your messages");

      if (!hasTrigger || isOwnReply) continue;

      console.log(`[LeadMagnets] ✅ Trigger comment by ${comment.name}: "${comment.text}"`);

      // Human-like delay before action
      const jitter = 4000 + Math.random() * 6000;
      await delay(jitter);

      // 1. API Reply to comment
      const replyText = spin(REPLY_VARIATIONS);
      const replied = await replyToComment(liAt, jsessionId, postId, commentId, replyText);
      if (replied) {
        repliesThisRun++;
        totalReplies++;
        repliedIds.add(commentId);
        console.log(`[LeadMagnets] ✅ API Comment replied to ${comment.name}`);
      }

      await delay(3000 + Math.random() * 4000);

      // 2. Send DM
      const trackedUrl = `${resourceUrl}?li_lead=ext_${Date.now()}&li_src=${postId}`;
      const dmText = spinDM(comment.firstName, trackedUrl);
      let dmSent = false;

      if (comment.authorId || comment.publicId) {
        dmSent = await sendDM(liAt, jsessionId, comment.authorId, dmText, comment.publicId, comment.name);
        if (dmSent) {
          dmsSentThisRun++;
          totalDms++;
          console.log(`[LeadMagnets] ✅ DM sent to ${comment.name}`);
        }
      }

      // 3. Log to CRM
      await logLeadToCRM({
        userEmail,
        authorName: comment.name,
        authorLink: comment.publicId ? `https://www.linkedin.com/in/${comment.publicId}` : "",
        commentText: comment.text,
        postId,
        magnetId: post.magnetId || "",
      });

      // Daily limit safeguard
      if (totalDms >= 40) {
        console.log("[LeadMagnets] Daily DM limit (40) reached. Pausing.");
        break;
      }
    }
  }

  // D. Save state
  await chrome.storage.local.set({
    totalDms,
    totalReplies,
    lastSync: new Date().toISOString(),
    lastResult: `Sync done: ${repliesThisRun} replies, ${dmsSentThisRun} DMs sent.`,
    repliedCommentIds: Array.from(repliedIds).slice(-500), // keep last 500
  });

  // E. Trigger DOM-based reply in open LinkedIn tabs as UI reinforcement
  try {
    const tabs = await chrome.tabs.query({ url: "*://*.linkedin.com/*" });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        }).catch(() => {});
      }
    }
  } catch (e) {}

  const summary = `✅ ${repliesThisRun} replies, ${dmsSentThisRun} DMs sent`;
  console.log(`[LeadMagnets] ${summary}`);
  return { success: true, repliesThisRun, dmsSentThisRun, summary };
}

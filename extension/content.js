/**
 * LeadMagnets LinkedIn Auto-Reply & Lead Extraction Engine
 * 
 * KEY INSIGHT: This content script runs INSIDE linkedin.com.
 * fetch() calls here are SAME-ORIGIN -> cookies sent automatically ->
 * Cloudflare sees a real Chrome browser -> API calls succeed seamlessly.
 */

(function () {
  'use strict';
  if (window.__LM_INTERVAL__) {
    clearInterval(window.__LM_INTERVAL__);
  }
  window.__LM_CONTENT_INITIALIZED__ = true;

  console.log("[LeadMagnets] ✅ Content script active on:", window.location.href);

  const REPLIED_IDS = new Set();
  const DMS_SENT_PROFILES = new Set();

  const REPLY_TEXTS = [
    "Sent to your DM! Check your inbox 📬",
    "Just sent the resource link to your messages! 🚀",
    "Check your DMs, it's waiting for you! ✨",
    "Resource link is in your inbox now! Enjoy 🎁",
  ];

  const DM_TEXTS = [
    (n, u) => `Hey ${n}! 👋 Here's your free resource: ${u} — enjoy!`,
    (n, u) => `Hi ${n}! Here's your access link: ${u} 🚀`,
    (n, u) => `Hey ${n}! As requested: ${u} — hope you find it valuable!`,
  ];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── Get LinkedIn CSRF token from document.cookie ──
  function getCSRF() {
    const match = document.cookie.match(/JSESSIONID="?([^";]+)"?/i);
    if (match) {
      let tok = match[1].replace(/"/g, '');
      return tok.startsWith('ajax:') ? tok : `ajax:${tok}`;
    }
    return 'ajax:0000000000000000';
  }

  // ── Standard Voyager headers (same-origin, cookies auto-sent) ──
  function voyagerHeaders(extra = {}) {
    return {
      'accept': 'application/vnd.linkedin.normalized+json+2.1, application/json, */*',
      'accept-language': 'en-US,en;q=0.9',
      'csrf-token': getCSRF(),
      'x-restli-protocol-version': '2.0.0',
      'x-li-lang': 'en_US',
      ...extra,
    };
  }

  // ── Dynamic Campaign Config ──
  async function getCampaignConfig() {
    try {
      const storage = await chrome.storage.local.get(["userEmail", "leadMagnetUrl", "triggerKeyword"]);
      return {
        resourceUrl: storage.leadMagnetUrl || 'https://magnets.bdatech.in/rudranath/hhoo',
        triggerKeyword: (storage.triggerKeyword || 'resource').toLowerCase(),
        userEmail: storage.userEmail || ''
      };
    } catch (e) {
      return {
        resourceUrl: 'https://magnets.bdatech.in/rudranath/hhoo',
        triggerKeyword: 'resource',
        userEmail: ''
      };
    }
  }

  // ── Detect Logged-In User Profile to prevent self-triggering ──
  function getSelfIdentifiers() {
    const ids = new Set();
    try {
      const meImg = document.querySelector('img.global-nav__me-photo, .global-nav__me img');
      if (meImg && meImg.alt) ids.add(meImg.alt.trim().toLowerCase());

      const meLink = document.querySelector('a.global-nav__primary-link-me-menu-trigger, a[href*="/in/me/"]');
      if (meLink && meLink.innerText) ids.add(meLink.innerText.trim().toLowerCase());
    } catch (e) {}
    return ids;
  }

  // ── Extract post ID from current URL ──
  function getPostIdFromUrl() {
    const url = window.location.href;
    const m = url.match(/(?:activity|ugcPost|share)[:\-](\d+)/i) ||
              url.match(/urn:li:[^:]+:(\d+)/i) ||
              url.match(/\/posts\/[^\/]+-activity-(\d+)/i);
    return m ? m[1] : null;
  }

  // ── Fetch comments for a post via LinkedIn Voyager API ──
  async function fetchCommentsForPost(postId) {
    const encodedUrn = encodeURIComponent(`urn:li:activity:${postId}`);

    const endpoints = [
      `/voyager/api/feed/comments?q=comments&updateUrn=${encodedUrn}&count=50`,
      `/voyager/api/feed/comments?q=comments&sortOrder=RELEVANCE&updateUrn=${encodedUrn}&count=50`,
      `/voyager/api/feed/updates/${encodedUrn}/comments?count=50&start=0`,
      `/voyager/api/feed/comments?q=comments&updateUrn=${encodedUrn}&count=100&start=0`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(`https://www.linkedin.com${url}`, {
          headers: voyagerHeaders(),
          credentials: 'include',
        });

        console.log(`[LeadMagnets] Comments API ${res.status}: ${url}`);
        if (!res.ok) continue;

        const data = await res.json();
        const elements = data.elements || data.data?.elements || [];
        const included = data.included || [];

        console.log(`[LeadMagnets] Raw elements: ${elements.length}, included: ${included.length}`);
        if (elements.length > 0) {
          return parseComments(elements, included);
        }
      } catch (e) {
        console.log('[LeadMagnets] Comments API fetch notice:', e.message);
      }
    }
    return [];
  }

  function parseComments(elements, included) {
    const profileMap = new Map();
    for (const inc of included) {
      const k = inc.entityUrn || inc.urn || inc.id;
      if (k) profileMap.set(k, inc);
    }

    return elements.map(el => {
      const id = el.urn || el.entityUrn || el.id || '';
      let text = el.commentary?.text?.text || el.commentary?.text || el.text || '';
      if (typeof text !== 'string') text = '';

      let mini = el.commenter?.['com.linkedin.voyager.feed.MemberActor']?.miniProfile
        || el.commenter?.miniProfile
        || el.actor?.miniProfile
        || {};

      if (!mini.firstName && el.actor?.miniProfileUrn) {
        mini = profileMap.get(el.actor.miniProfileUrn) || mini;
      }

      const authorId = (mini.entityUrn || '')
        .replace('urn:li:fs_miniProfile:', '')
        .replace('urn:li:fsd_profile:', '')
        || mini.plainId || '';

      const firstName = mini.firstName || mini.localizedFirstName || 'there';
      const lastName = mini.lastName || mini.localizedLastName || '';
      const name = `${firstName} ${lastName}`.trim() || 'Prospect';
      const publicId = mini.publicIdentifier || authorId;

      return { id, text, authorId, firstName, name, publicId };
    }).filter(c => c.text.trim());
  }

  // ── Post a reply via Voyager API ──
  async function postAPIReply(postId, commentUrn, replyText) {
    const encodedUrn = encodeURIComponent(`urn:li:activity:${postId}`);
    try {
      const res = await fetch(`https://www.linkedin.com/voyager/api/feed/comments?updateUrn=${encodedUrn}`, {
        method: 'POST',
        headers: voyagerHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          commentary: { text: { text: replyText } },
          parentComment: commentUrn,
        }),
      });
      console.log(`[LeadMagnets] Reply API status: ${res.status}`);
      return res.ok || res.status === 201;
    } catch (e) {
      console.log('[LeadMagnets] Reply API notice:', e.message);
      return false;
    }
  }

  // ── Resolve profile URN from public identifier or author ID ──
  async function resolveProfileUrn(publicId) {
    if (!publicId) return null;
    if (publicId.startsWith('urn:li:fsd_profile:') || publicId.startsWith('urn:li:member:')) {
      return publicId;
    }
    const cleanId = publicId.replace(/^urn:li:[^:]+:/, '').replace(/\//g, '').trim();
    if (!cleanId || cleanId.toLowerCase() === 'friend') return null;

    // Try 1: Voyager profile endpoint
    try {
      const res = await fetch(`https://www.linkedin.com/voyager/api/identity/profiles/${encodeURIComponent(cleanId)}`, {
        headers: voyagerHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const rawUrn = data.miniProfile?.entityUrn || data.entityUrn || data['*miniProfile'];
        if (rawUrn) {
          const id = rawUrn.replace(/^urn:li:(fs_miniProfile|fs_profile|fsd_profile):/, '');
          return `urn:li:fsd_profile:${id}`;
        }
      }
    } catch (e) {}

    // Try 2: Dash profiles endpoint
    try {
      const res = await fetch(`https://www.linkedin.com/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(cleanId)}`, {
        headers: voyagerHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const elements = data.elements || data.data?.elements || [];
        if (elements.length > 0 && elements[0].entityUrn) {
          return elements[0].entityUrn;
        }
      }
    } catch (e) {}

    return `urn:li:fsd_profile:${cleanId}`;
  }

  // ── Send a DM via Voyager Messaging API with multiple fallback strategies ──
  async function sendDM(recipientId, messageText, publicId = '', authorName = '') {
    if (!recipientId && !publicId) {
      console.log('[LeadMagnets] sendDM skipped: No recipient identifier provided');
      return false;
    }

    if (authorName && authorName.toLowerCase() === 'friend' && !publicId && !recipientId) {
      return false;
    }

    let recipientUrn = recipientId;
    if (!recipientUrn || !recipientUrn.startsWith('urn:li:fsd_profile:')) {
      recipientUrn = await resolveProfileUrn(publicId || recipientId);
    }

    if (!recipientUrn) {
      console.log(`[LeadMagnets] Could not resolve URN for ${authorName || publicId}`);
      return false;
    }

    console.log(`[LeadMagnets] Attempting to send DM to ${authorName || publicId || recipientUrn}...`);

    // Strategy 1: Create conversation via action=create
    try {
      const res = await fetch('https://www.linkedin.com/voyager/api/messaging/conversations?action=create', {
        method: 'POST',
        headers: voyagerHeaders({ 'content-type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          keyVersion: 'LEGACY_INBOX',
          conversationCreate: {
            recipients: [recipientUrn],
            eventCreate: {
              value: {
                'com.linkedin.voyager.messaging.create.MessageCreate': {
                  body: messageText,
                  attributedBody: { text: messageText, attributes: [] },
                  attachments: [],
                },
              },
            },
            subtype: 'MEMBER_TO_MEMBER',
          },
        }),
      });

      console.log(`[LeadMagnets] DM create API status: ${res.status}`);
      if (res.ok || res.status === 201) {
        console.log(`[LeadMagnets] ✅ Strategy 1: DM conversation created and sent!`);
        return true;
      }
    } catch (e) {}

    // Strategy 2: If conversation already exists, find it and append message
    try {
      const convoRes = await fetch('https://www.linkedin.com/voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX', {
        headers: voyagerHeaders(),
        credentials: 'include',
      });

      if (convoRes.ok) {
        const convoData = await convoRes.json();
        const elements = convoData.elements || [];
        const included = convoData.included || [];

        let targetConvoUrn = null;
        const pubLower = (publicId || '').toLowerCase();
        const nameLower = (authorName || '').toLowerCase();
        const urnLower = (recipientUrn || '').toLowerCase();

        for (const c of elements) {
          const str = JSON.stringify(c).toLowerCase();
          if ((pubLower && str.includes(pubLower)) ||
              (urnLower && str.includes(urnLower)) ||
              (nameLower && nameLower.length > 3 && str.includes(nameLower))) {
            targetConvoUrn = c.entityUrn || c.urn;
            break;
          }
        }

        if (!targetConvoUrn) {
          for (const inc of included) {
            const str = JSON.stringify(inc).toLowerCase();
            if ((pubLower && str.includes(pubLower)) ||
                (nameLower && nameLower.length > 3 && str.includes(nameLower))) {
              const incUrn = inc.entityUrn || inc.urn;
              const matchConvo = elements.find(el => JSON.stringify(el).includes(incUrn));
              if (matchConvo) {
                targetConvoUrn = matchConvo.entityUrn || matchConvo.urn;
                break;
              }
            }
          }
        }

        if (targetConvoUrn) {
          console.log(`[LeadMagnets] Found existing conversation: ${targetConvoUrn}. Sending event...`);
          const postEventRes = await fetch(`https://www.linkedin.com/voyager/api/messaging/conversations/${encodeURIComponent(targetConvoUrn)}/events?action=create`, {
            method: 'POST',
            headers: voyagerHeaders({ 'content-type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify({
              eventCreate: {
                value: {
                  'com.linkedin.voyager.messaging.create.MessageCreate': {
                    body: messageText,
                    attributedBody: { text: messageText, attributes: [] },
                    attachments: [],
                  },
                },
              },
              dedupeByClientGeneratedToken: false,
            }),
          });

          if (postEventRes.ok || postEventRes.status === 201) {
            console.log(`[LeadMagnets] ✅ Strategy 2: DM sent to existing conversation!`);
            return true;
          }
        }
      }
    } catch (e) {}

    // Strategy 3: Delegate to background service worker
    try {
      const bgRes = await new Promise(resolve => {
        chrome.runtime.sendMessage({
          action: 'SEND_DM',
          recipientId: recipientUrn,
          publicId,
          authorName,
          messageText,
        }, resolve);
      });
      if (bgRes?.success) {
        console.log(`[LeadMagnets] ✅ Strategy 3: DM sent via background worker!`);
        return true;
      }
    } catch (e) {}

    // Strategy 4: Direct DOM send via open LinkedIn messaging chat drawer
    try {
      const drawerSent = await sendViaOpenChatDrawer(authorName, messageText);
      if (drawerSent) {
        console.log(`[LeadMagnets] ✅ Strategy 4: DM sent directly through open LinkedIn chat drawer!`);
        return true;
      }
    } catch (e) {}

    return false;
  }

  function isCommentEditor(el) {
    if (!el) return true;
    return !!(
      el.closest('.comments-comment-box') ||
      el.closest('.comments-comment-item') ||
      el.closest('[class*="comments"]') ||
      el.closest('.feed-shared-update-v2') ||
      el.closest('[data-comments-id]') ||
      el.closest('article') ||
      el.closest('.feed-shared-comment-box')
    );
  }

  function cleanAccidentalCommentLinks() {
    try {
      const editables = document.querySelectorAll('div[contenteditable="true"]');
      for (const ed of editables) {
        if (isCommentEditor(ed) && ed.innerText && (ed.innerText.includes('magnets.bdatech.in') || ed.innerText.includes('li_lead='))) {
          ed.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          console.log('[LeadMagnets] 🧹 Cleaned accidental DM link out of public comment box.');
        }
      }
    } catch (e) {}
  }

  // ── Strategy 4 Helper: Send via open LinkedIn Chat Window or Full-Page Messenger ──
  async function sendViaOpenChatDrawer(authorName, messageText) {
    if (window.location.href.includes('/messaging')) {
      try {
        const fullPageEditor = document.querySelector('.msg-form__contenteditable, .msg-form__message-texteditor div[contenteditable="true"]');
        if (fullPageEditor && !isCommentEditor(fullPageEditor)) {
          fullPageEditor.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, messageText);
          fullPageEditor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: messageText }));
          await delay(500);

          const sendBtn = document.querySelector('button.msg-form__send-button, form.msg-form button[type="submit"]');
          if (sendBtn && !sendBtn.disabled) {
            sendBtn.click();
            return true;
          }
        }
      } catch (e) {}
    }

    try {
      const overlays = Array.from(document.querySelectorAll('.msg-overlay-conversation-bubble, .msg-convo-wrapper'));
      for (const ov of overlays) {
        const text = (ov.innerText || '').toLowerCase();
        const nameMatch = !authorName || text.includes(authorName.toLowerCase()) || (authorName.split(' ')[0] && text.includes(authorName.split(' ')[0].toLowerCase()));
        if (nameMatch) {
          const editor = ov.querySelector('.msg-form__contenteditable, form.msg-form div[contenteditable="true"]');
          if (editor && !isCommentEditor(editor)) {
            editor.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, messageText);
            editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: messageText }));
            await delay(500);

            const sendBtn = ov.querySelector('button.msg-form__send-button, form.msg-form button[type="submit"]');
            if (sendBtn && !sendBtn.disabled) {
              sendBtn.click();
              return true;
            }
          }
        }
      }
    } catch (e) {}

    return false;
  }

  // ── DOM Reply & DM on specific trigger comments ──
  async function domFallbackReply() {
    const config = await getCampaignConfig();
    const TRIGGERS = [config.triggerKeyword, 'resource', 'pdf', 'guide', 'link', 'access', 'send me', 'send it', 'interested', 'yes'];
    const SKIP = ['sent to your dm', 'check your inbox', 'check your dms', 'sent it over', 'your messages', 'sent the resource'];
    const selfIds = getSelfIdentifiers();

    // Find ONLY actual comment items (never match top-level post text)
    const commentSelectors = [
      'article.comments-comment-item',
      'article.comments-comment-entity',
      '.comments-comment-item',
      '.comments-comments-list__comment-item',
      'div.comments-comment-item',
      '[data-comments-id]'
    ];

    let commentContainers = [];
    for (const sel of commentSelectors) {
      const found = Array.from(document.querySelectorAll(sel));
      if (found.length > 0) {
        commentContainers = found;
        break;
      }
    }

    if (commentContainers.length === 0) {
      // No comment containers found on page. Do nothing (avoid false positives on main post body).
      return;
    }

    for (const container of commentContainers) {
      // Extract comment body text specifically
      const bodyEl = container.querySelector(
        '.comments-comment-item__main-content, .comments-comment-item__comment-text, .comments-comment-item-content-body, .feed-shared-inline-show-more-text, .comments-comment-item__text'
      );
      const commentText = (bodyEl ? bodyEl.innerText : container.innerText || '').toLowerCase();

      // Must contain a trigger word
      if (!TRIGGERS.some(w => commentText.includes(w))) continue;

      // Extract commenter profile info from container
      const authorLinkEl = container.querySelector(
        'a.comments-post-meta__name-link, a[data-test-app-aware-link][href*="/in/"], a[href*="/in/"], a.update-components-actor__image'
      );
      const authorUrl = authorLinkEl ? (authorLinkEl.getAttribute('href') || '') : '';
      let publicId = '';
      if (authorUrl) {
        const match = authorUrl.match(/\/in\/([^/?#]+)/);
        if (match) publicId = match[1];
      }

      const nameEl = container.querySelector(
        '.comments-post-meta__name-text, .update-components-actor__name, .comments-post-meta__profile-link, .hoverable-link-text, a[href*="/in/"] span'
      );
      const imgEl = container.querySelector('img.comments-post-meta__actor-image, img[alt]');
      let authorName = (nameEl?.innerText || imgEl?.getAttribute('alt') || '').trim();
      authorName = authorName.split('\n')[0].replace(/·.*$/, '').trim();

      // If author could not be identified, skip
      if (!publicId && (!authorName || authorName.toLowerCase() === 'friend' || authorName.length < 2)) {
        continue;
      }

      // If comment is from user themselves, skip
      if (selfIds.has(authorName.toLowerCase()) || (publicId && selfIds.has(publicId.toLowerCase()))) {
        continue;
      }

      const firstName = authorName.split(' ')[0] || 'there';
      const profileKey = (publicId || authorName).toLowerCase();

      const alreadyReplied = SKIP.some(w => commentText.includes(w)) || SKIP.some(w => (container.innerText || '').toLowerCase().includes(w));
      const alreadyDMed = DMS_SENT_PROFILES.has(profileKey);

      if (alreadyReplied && alreadyDMed) continue;

      console.log(`[LeadMagnets] DOM: Found valid comment by "${authorName}"`);

      // ── STEP 1: Reply on comment if not already replied ──
      if (!alreadyReplied) {
        const btns = Array.from(container.querySelectorAll('button'));
        const replyBtn = btns.find(b =>
          (b.getAttribute('aria-label') || '').toLowerCase().includes('reply') ||
          (b.innerText || '').trim().toLowerCase() === 'reply'
        ) || (btns.length >= 2 ? btns[1] : null);

        if (replyBtn) {
          setStatus(`Clicking Reply on ${authorName}'s comment...`);
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await delay(500);
          replyBtn.click();
          await delay(1500);

          let editor = null;
          for (let attempt = 0; attempt < 6; attempt++) {
            const allEditors = Array.from(document.querySelectorAll(
              'div[contenteditable="true"][role="textbox"], div[contenteditable="true"].ql-editor, div[contenteditable="true"]'
            ));
            if (allEditors.length > 0) {
              editor = allEditors[allEditors.length - 1];
              break;
            }
            await delay(400);
          }

          if (editor) {
            const replyText = rand(REPLY_TEXTS);
            editor.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, replyText);
            editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: replyText }));
            editor.dispatchEvent(new Event('change', { bubbles: true }));

            await delay(1000);

            let submit = null;
            let searchEl = editor;
            for (let i = 0; i < 10 && searchEl && !submit; i++) {
              searchEl = searchEl.parentElement;
              if (!searchEl) break;
              const buttons = Array.from(searchEl.querySelectorAll('button'));
              for (const btn of buttons) {
                const label = (btn.getAttribute('aria-label') || '').toLowerCase();
                const text = (btn.innerText || '').trim().toLowerCase();
                if (
                  label.includes('post') || label.includes('reply') || label.includes('submit') || label.includes('comment') ||
                  text === 'post' || text === 'done' || text === 'submit'
                ) {
                  submit = btn;
                  break;
                }
              }
            }

            if (!submit) {
              submit =
                document.querySelector('button.comments-comment-box__submit-button') ||
                document.querySelector('button[class*="submit-button"]') ||
                document.querySelector('button[class*="comments-comment-texteditor__submitButton"]');
            }

            if (submit) {
              submit.disabled = false;
              submit.removeAttribute('disabled');
              await delay(300);
              submit.click();
              console.log(`[LeadMagnets] DOM: Reply submitted to ${authorName} ✅`);
              setStatus(`✅ Reply posted to ${authorName}!`);
            }
          }
        }
      }

      // ── STEP 2: SEND THE DM WITH THE LEAD MAGNET RESOURCE URL ──
      if (!alreadyDMed) {
        const trackedUrl = `${config.resourceUrl}?li_lead=ext_${Date.now()}`;
        const dmText = rand(DM_TEXTS)(firstName, trackedUrl);

        setStatus(`Sending DM to ${authorName}...`);

        let dmOk = false;
        try {
          dmOk = await sendDM(null, dmText, publicId, authorName);
          if (dmOk) {
            DMS_SENT_PROFILES.add(profileKey);
            console.log(`[LeadMagnets] ✅ DOM: DM with Lead Magnet URL delivered to ${authorName}! 📬`);
            setStatus(`✅ Replied & DM sent to ${authorName}!`);
          } else {
            console.log(`[LeadMagnets] Notice: Direct DM could not be sent to ${authorName} (privacy settings / 1st-degree connection needed).`);
          }
        } catch (dmErr) {
          console.log('[LeadMagnets] DOM sendDM notice:', dmErr.message);
        }

        // Notify background service worker for stats and CRM
        try {
          chrome.runtime.sendMessage({
            action: 'COMMENT_REPLIED_DOM',
            authorName,
            authorLink: publicId ? `https://www.linkedin.com/in/${publicId}` : authorUrl,
            commentText,
            postId: getPostIdFromUrl() || '',
            dmSent: dmOk,
          });
        } catch (e) {}
      }

      setTimeout(() => setStatus('Monitoring comments...'), 4000);
      break; // one comment per cycle
    }
  }

  // ── Main automation: scan via API, fall back to DOM ──
  async function runAutomation(manual = false) {
    setStatus('Scanning...');

    const postId = getPostIdFromUrl();
    if (!postId) {
      setStatus('Open a LinkedIn post to activate');
      return;
    }

    const config = await getCampaignConfig();
    const TRIGGERS = [config.triggerKeyword, 'resource', 'pdf', 'guide', 'link', 'access', 'send me', 'send it', 'interested', 'yes'];
    const SKIP = ['sent to your dm', 'check your inbox', 'check your dms', 'sent it over', 'your messages', 'sent the resource'];
    const selfIds = getSelfIdentifiers();

    // Try Voyager API first
    const comments = await fetchCommentsForPost(postId);
    console.log(`[LeadMagnets] Fetched ${comments.length} comments via API`);

    let acted = 0;

    if (comments.length > 0) {
      for (const c of comments) {
        const low = c.text.toLowerCase();
        if (REPLIED_IDS.has(c.id)) continue;
        if (SKIP.some(s => low.includes(s))) continue;
        if (!TRIGGERS.some(t => low.includes(t))) continue;

        // Skip comments made by self
        if (selfIds.has(c.name.toLowerCase()) || (c.publicId && selfIds.has(c.publicId.toLowerCase()))) {
          continue;
        }

        console.log(`[LeadMagnets] 🎯 Trigger comment by ${c.name}: "${c.text}"`);
        setStatus(`Replying to ${c.name}...`);

        if (acted > 0) await delay(4000 + Math.random() * 3000);

        // 1. API Reply
        const replyText = rand(REPLY_TEXTS);
        const replied = await postAPIReply(postId, c.id, replyText);
        if (replied) {
          REPLIED_IDS.add(c.id);
          console.log(`[LeadMagnets] ✅ API reply posted to ${c.name}`);
        }

        await delay(2000 + Math.random() * 2000);

        // 2. DM
        const trackedUrl = `${config.resourceUrl}?li_lead=ext_${Date.now()}&li_src=${postId}`;
        const dmText = rand(DM_TEXTS)(c.firstName, trackedUrl);
        const dmOk = await sendDM(c.authorId, dmText, c.publicId, c.name);
        if (dmOk) console.log(`[LeadMagnets] ✅ DM sent to ${c.name}`);

        // 3. Notify background
        try {
          chrome.runtime.sendMessage({
            action: 'COMMENT_REPLIED_DOM',
            authorName: c.name,
            authorLink: c.publicId ? `https://www.linkedin.com/in/${c.publicId}` : '',
            commentText: c.text,
            postId,
            dmSent: dmOk,
          });
        } catch (e) {}

        acted++;
        setStatus(`✅ Replied to ${c.name}!`);
        setTimeout(() => setStatus('Monitoring comments...'), 4000);
      }
    }

    // Run DOM fallback only when API produced 0 actions
    if (acted === 0) {
      await domFallbackReply();
    }
  }

  // ── Status logger ──
  function setStatus(msg) {
    console.log(`[LeadMagnets] Status: ${msg}`);
  }

  // ── Auto-Send Lead Magnet if user is viewing a messaging thread ──
  async function autoSendIfInMessagingThread() {
    if (!window.location.href.includes('/messaging')) return false;

    const titleEl = document.querySelector('.msg-entity-lockup__entity-title, .msg-title-bar__title, .msg-overlay-bubble-header__title, h2');
    const recipientName = (titleEl?.innerText || '').trim().split('\n')[0];
    if (!recipientName) return false;

    // Check if lead magnet link was already sent in the visible conversation
    const messageListEl = document.querySelector('.msg-s-message-list, .msg-s-message-list-container, [class*="message-list"]');
    const convoText = (messageListEl ? messageListEl.innerText : document.body.innerText).toLowerCase();
    if (convoText.includes('magnets.bdatech.in') || convoText.includes('li_lead=')) {
      return false;
    }

    // Find message editor
    const editor = document.querySelector('.msg-form__contenteditable, div[contenteditable="true"][role="textbox"], .msg-form__message-texteditor div[contenteditable="true"]');
    if (!editor) return false;

    const config = await getCampaignConfig();
    const firstName = recipientName.split(' ')[0] || 'there';
    const trackedUrl = `${config.resourceUrl}?li_lead=ext_${Date.now()}`;
    const dmText = `Hey ${firstName}! 👋 Here's your free resource link: ${trackedUrl} — enjoy!`;

    console.log(`[LeadMagnets] Auto-delivering Lead Magnet to ${recipientName} in chat...`);
    setStatus(`Delivering Lead Magnet to ${recipientName}...`);

    editor.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, dmText);
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: dmText }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));

    await delay(800);

    const sendBtn = document.querySelector('button.msg-form__send-button, form.msg-form button[type="submit"]');
    if (sendBtn && !sendBtn.disabled) {
      sendBtn.click();
      console.log(`[LeadMagnets] ✅ Lead magnet automatically sent to ${recipientName}!`);
      setStatus(`✅ Lead magnet sent to ${recipientName}!`);

      try {
        chrome.runtime.sendMessage({
          action: 'COMMENT_REPLIED_DOM',
          authorName: recipientName,
          authorLink: `https://www.linkedin.com/in/${recipientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          commentText: 'Delivered via LinkedIn Chat',
          postId: '',
          dmSent: true,
        });
      } catch (e) {}
      return true;
    }
    return false;
  }

  // ── Boot: runs in background ──
  function boot() {
    cleanAccidentalCommentLinks();

    const postId = getPostIdFromUrl();
    if (postId) {
      console.log(`[LeadMagnets] Post detected: ${postId}. Starting auto-scan...`);
      try { chrome.storage.local.set({ lastActivePostId: postId }); } catch (e) {}
      setTimeout(() => runAutomation(), 3000);
    } else if (window.location.href.includes('/messaging')) {
      console.log('[LeadMagnets] Messaging page detected. Auto-checking active chat...');
      setTimeout(() => autoSendIfInMessagingThread(), 2000);
    } else {
      console.log('[LeadMagnets] Monitoring page for navigation...');
    }

    // Periodic check every 20 seconds
    window.__LM_INTERVAL__ = setInterval(() => {
      if (getPostIdFromUrl()) {
        runAutomation();
      } else if (window.location.href.includes('/messaging')) {
        autoSendIfInMessagingThread();
      }
    }, 20000);
  }

  // ── Listen for manual trigger from extension popup ──
  try {
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
      if (req.action === "SEND_CURRENT_CHAT_DM") {
        let recipientName = "Friend";
        const titleEl = document.querySelector(".msg-entity-lockup__entity-title, .msg-title-bar__title, .msg-overlay-bubble-header__title, h2");
        if (titleEl) {
          recipientName = (titleEl.innerText || "").trim().split("\n")[0];
        }
        const firstName = recipientName.split(" ")[0] || "there";
        getCampaignConfig().then(config => {
          const trackedUrl = `${config.resourceUrl}?li_lead=ext_${Date.now()}`;
          const dmText = rand(DM_TEXTS)(firstName, trackedUrl);

          sendViaOpenChatDrawer(recipientName, dmText).then(ok => {
            if (ok) {
              sendResponse({ success: true, message: `✅ DM sent to ${recipientName}!` });
            } else {
              sendDM(null, dmText, "", recipientName).then(apiOk => {
                sendResponse({
                  success: apiOk,
                  message: apiOk ? `✅ DM sent via API to ${recipientName}!` : `⚠️ Message could not be sent to ${recipientName}.`
                });
              });
            }
          });
        });
        return true;
      }
    });
  } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1500));
  } else {
    setTimeout(boot, 1500);
  }
})();

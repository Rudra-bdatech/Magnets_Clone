import { LeadModel, MagnetPageModel, AccountModel } from "@/lib/models";
import { dbConnect } from "@/lib/mongodb";
import {
  validateLinkedInSession,
  fetchUserLinkedInPosts,
  fetchPostCommentsNative,
  replyToCommentNative,
  sendDirectMessageNative,
} from "@/lib/linkedin-native";
import {
  humanDelay,
  getSpinCommentReply,
  getSpinDMText,
  checkDailySafetyQuota,
} from "@/lib/linkedin-safety";
import { formatFullHost } from "@/lib/domain-verify";

/**
 * Production-Ready In-House LinkedIn Post & Comment Automation Engine.
 * 
 * Includes Enterprise Anti-Ban & Rate-Limit Safeguards:
 * - Hard daily limits on DMs & comments per 24 hours.
 * - Human-like randomized jitter delays between operations.
 * - Dynamic text spinning to prevent duplicate content flags.
 * - 100% in-house with zero third-party API dependencies.
 */
export async function syncUserLinkedInComments(account: any) {
  if (!account || !account.linkedinConnected) {
    return { success: false, message: "LinkedIn account not connected." };
  }

  const liAt = account.linkedinLiAt || account.linkedinAccountId;
  const jsessionId = account.linkedinJSessionId || "";

  if (!liAt) {
    return { success: false, message: "No active LinkedIn session found. Please connect your LinkedIn account." };
  }

  await dbConnect();
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in";
  const appUrl = rawAppUrl.replace(/\/+$/, "");
  const userEmail = account.email.trim().toLowerCase();

  // Safety Check: Verify daily quota before initiating actions
  const quotaCheck = await checkDailySafetyQuota(userEmail);
  if (!quotaCheck.allowed) {
    return {
      success: true,
      processedCount: 0,
      dmsSent: 0,
      message: quotaCheck.reason || "Daily safety limit reached. System paused to protect your account.",
    };
  }

  // 1. Fetch user's live lead magnets
  const livePages = await MagnetPageModel.find({
    userEmail: userEmail,
    status: "live",
  }).lean();

  if (livePages.length === 0) {
    return { success: false, message: "No live lead magnets found. Please publish a magnet first." };
  }

  // Determine default active magnet
  let defaultMagnet = livePages.find((p: any) => p.id === account.linkedinDefaultMagnetId) || livePages[0];

  // 2. Validate session and resolve profile info
  let profileId = account.linkedinProfileId;
  let profileImage = account.linkedinProfileImage;
  let accountName = account.linkedinAccountName;

  if (!profileId || !profileImage || !accountName) {
    const valResult = await validateLinkedInSession(liAt, jsessionId);
    if (valResult.success && valResult.profile) {
      profileId = valResult.profile.id || profileId;
      profileImage = valResult.profile.avatarUrl || profileImage;
      accountName = valResult.profile.fullName || accountName;

      const updateFields: Record<string, any> = {};
      if (profileId) updateFields.linkedinProfileId = profileId;
      if (profileImage) updateFields.linkedinProfileImage = profileImage;
      if (accountName) updateFields.linkedinAccountName = accountName;

      if (Object.keys(updateFields).length > 0) {
        await AccountModel.updateOne({ email: userEmail }, updateFields);
      }
    } else {
      console.warn("[LinkedIn Safety Engine] Session warning:", valResult.error);
    }
  }

  // 3. Fetch user's latest LinkedIn posts from feed
  const postsResult = await fetchUserLinkedInPosts(liAt, profileId || "me", jsessionId, 20);
  const feedPosts = postsResult.posts || [];

  const savedCampaigns = account.linkedinPostCampaigns || [];
  const posts = [...feedPosts];

  // Merge any saved post campaigns so manually added posts are always processed
  for (const c of savedCampaigns) {
    if (c.postId && !posts.some((p) => p.social_id === c.postId || p.id === c.postId)) {
      posts.push({
        id: c.postId,
        social_id: c.postId,
        text: c.postText || "Monitored Post",
        postUrl: c.postUrl || (c.postId.startsWith("http") ? c.postId : `https://www.linkedin.com/feed/update/urn:li:activity:${c.postId}`),
        commentsCount: c.commentsCount || 0,
        createdAt: c.createdAt || new Date().toISOString(),
      });
    }
  }

  if (posts.length === 0) {
    return {
      success: true,
      processedCount: 0,
      dmsSent: 0,
      message: "No posts found. Paste your LinkedIn post URL into the '+ Add Post' box below to start monitoring.",
    };
  }

  let processedCount = 0;
  let dmsSent = 0;
  const globalTriggerWord = (account.linkedinTriggerWord || "resource").toLowerCase().trim();

  // 4. Iterate over posts and process comments
  for (const post of posts) {
    const postUrn = post.social_id || post.id;
    if (!postUrn) continue;

    // Check if post automation is enabled
    const postCampaign = savedCampaigns.find((c: any) => c.postId === postUrn || c.postId === post.id);
    if (postCampaign && postCampaign.enabled === false) {
      continue;
    }

    const postTriggerWord = (postCampaign?.triggerWord || globalTriggerWord).toLowerCase().trim();
    let postMagnet = defaultMagnet;
    if (postCampaign?.magnetId) {
      const matchedPage = livePages.find((p: any) => p.id === postCampaign.magnetId);
      if (matchedPage) postMagnet = matchedPage;
    }

    try {
      const commentRes = await fetchPostCommentsNative(liAt, postUrn, jsessionId, 100);
      if (!commentRes.success || !commentRes.comments) continue;

      const comments = commentRes.comments;
      console.log(`[LinkedIn Automation] Post ${postUrn} has ${comments.length} comments fetched.`);

      for (const comment of comments) {
        // Enforce daily safety limits dynamically
        const liveQuota = await checkDailySafetyQuota(userEmail);
        if (!liveQuota.allowed) {
          console.log(`[LinkedIn Safety] Daily limit reached for ${userEmail}. Pausing execution.`);
          break;
        }

        const text = (comment.text || "").toLowerCase().trim();
        const authorDetails = comment.author_details || {};
        const authorId = authorDetails.id || comment.author_id;
        const commentId = comment.id || comment.social_id;

        // Skip self-authored comments
        if (authorId && profileId && profileId !== "me" && (authorId === profileId || (profileId.length > 5 && authorId.includes(profileId)))) {
          continue;
        }

        // Trigger keyword matching
        const hasTrigger =
          (postTriggerWord && text.includes(postTriggerWord)) ||
          text.includes("resource") ||
          text.includes("pdf") ||
          text.includes("guide") ||
          text.includes("send") ||
          text.includes("link");

        if (!hasTrigger) continue;

        // Route to the matching magnet
        let targetMagnet = postMagnet;
        for (const page of livePages) {
          const nameLower = page.name.toLowerCase();
          const slugLower = page.slug.toLowerCase();
          if (text.includes(nameLower) || text.includes(slugLower)) {
            targetMagnet = page;
            break;
          }
        }

        // Deduplication check
        const deduplicationFilters: any[] = [];
        if (commentId) {
          deduplicationFilters.push({ "customFields.commentId": commentId });
        }
        if (authorId && postUrn) {
          deduplicationFilters.push({
            pageId: targetMagnet.id,
            "customFields.authorId": authorId,
            "customFields.postUrn": postUrn,
          });
        }

        let existingLead = null;
        if (deduplicationFilters.length > 0) {
          existingLead = await LeadModel.findOne({
            userEmail: userEmail,
            $or: deduplicationFilters,
          });
        }

        if (existingLead) {
          continue; // Already processed
        }

        const resolvedName = authorDetails.name || `${authorDetails.first_name || ""} ${authorDetails.last_name || ""}`.trim() || "LinkedIn Prospect";
        const firstName = authorDetails.first_name || resolvedName.split(" ")[0] || "there";

        // Generate tracked lead magnet link
        const username = account.username || "u";
        const pageSlug = targetMagnet.slug || targetMagnet.id;
        let baseResourceUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(pageSlug)}`;
        if (account.customDomain && account.cnameVerified) {
          const fullHost = formatFullHost(account.customDomain, account.customSubdomain || "get");
          baseResourceUrl = `https://${fullHost}/${encodeURIComponent(pageSlug)}`;
        }

        const signedUpAt = new Date().toISOString();
        const leadId = `lead_li_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const resourceUrl = `${baseResourceUrl}?li_lead=${leadId}&li_author=${encodeURIComponent(authorId || "")}`;

        // Get spin variation of DM text to prevent duplicate content detection
        const dmText = getSpinDMText(firstName, resourceUrl);

        // Anti-ban human delay before sending DM
        await humanDelay(4000, 10000);

        // A. Send Direct Message via native engine
        let dmSuccess = false;
        if (authorId) {
          const dmRes = await sendDirectMessageNative(liAt, authorId, dmText, jsessionId);
          if (dmRes.success) {
            dmsSent++;
            dmSuccess = true;
          }
        }

        // Anti-ban human delay before replying to comment
        await humanDelay(3000, 8000);

        // B. Reply to public comment with spin variations
        try {
          const replyText = getSpinCommentReply();
          await replyToCommentNative(liAt, postUrn, commentId, replyText, jsessionId);
        } catch (replyErr) {
          console.error("[LinkedIn Safety Engine] Comment reply error:", replyErr);
        }

        // C. Save Lead in Magnets CRM
        const cleanNameSlug = resolvedName.toLowerCase().replace(/[^a-z0-9]/g, "") || "prospect";
        const effectiveEmail = `${cleanNameSlug}@linkedin-prospect.com`;

        await LeadModel.create({
          id: leadId,
          userEmail: userEmail,
          name: resolvedName,
          email: effectiveEmail,
          page: targetMagnet.name,
          pageId: targetMagnet.id,
          status: "pending_email",
          source: "linkedin-comment",
          signedUpAt,
          referrer: "linkedin.com",
          deviceType: "desktop",
          tags: ["linkedin", "auto-reply", dmSuccess ? "dm-sent" : "comment-replied"],
          customFields: {
            linkedinProfile: authorDetails.public_profile_url || (authorId ? `https://linkedin.com/in/${authorId}` : ""),
            linkedinPost: post.postUrl || `https://www.linkedin.com/feed/update/${postUrn}`,
            postUrn: postUrn,
            commentId: commentId,
            authorId: authorId,
            avatarUrl: authorDetails.avatar_url || "",
            headline: authorDetails.headline || "",
            commentText: comment.text,
            dmSentAt: signedUpAt,
            dmStatus: dmSuccess ? "sent" : "comment-only",
            isConverted: false,
          },
        });

        processedCount++;
      }
    } catch (commentFetchErr) {
      console.error("[LinkedIn Safety Engine] Error reading comments:", commentFetchErr);
    }
  }

  return {
    success: true,
    processedCount,
    dmsSent,
    message: `Sync completed safely. Processed ${processedCount} comments and sent ${dmsSent} DMs.`,
  };
}

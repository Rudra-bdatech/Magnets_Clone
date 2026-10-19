import crypto from "crypto";

/**
 * Signed unsubscribe links for emails sent to leads.
 *
 * The token is an HMAC over the lead id AND the recipient address. Lead ids are client-supplied
 * and not unique, so signing the id alone would let someone who reuses another lead's id unsubscribe
 * that person. Tokens never expire: unsubscribe links must keep working for old emails.
 */

// Domain-separated from JWT_SECRET, so an unsubscribe token can never pass as any other token.
function getUnsubscribeSecret(): string {
  const base = process.env.JWT_SECRET;
  if (!base) {
    throw new Error("[unsubscribe] JWT_SECRET environment variable is required but not set.");
  }
  return crypto.createHmac("sha256", base).update("leadmagnets_unsubscribe_subsystem_secret_v1").digest("hex");
}

export function createUnsubscribeToken(leadId: string, recipientEmail: string): string {
  // JSON keeps the fields unambiguous, whatever characters the lead id contains
  const data = JSON.stringify(["unsub_v1", leadId, recipientEmail.trim().toLowerCase()]);
  return crypto.createHmac("sha256", getUnsubscribeSecret()).update(data).digest("base64url");
}

export function verifyUnsubscribeToken(leadId: string, recipientEmail: string, token: string): boolean {
  if (!leadId || !recipientEmail || !token) return false;
  const expected = Buffer.from(createUnsubscribeToken(leadId, recipientEmail));
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

/**
 * pageUrl: the page a person opens from the link in the email footer (asks them to confirm).
 * oneClickUrl: the RFC 8058 List-Unsubscribe target that Gmail / Yahoo POST to directly.
 */
export function buildUnsubscribeUrls(baseUrl: string, leadId: string, recipientEmail: string) {
  const base = baseUrl.replace(/\/$/, "");
  const token = createUnsubscribeToken(leadId, recipientEmail);
  const lid = encodeURIComponent(leadId);
  return {
    pageUrl: `${base}/stop/${lid}?t=${token}`,
    oneClickUrl: `${base}/api/unsubscribe?lid=${lid}&t=${token}`,
  };
}

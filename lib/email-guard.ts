import { EmailEventModel } from "@/lib/models";

/**
 * Shared guards for email that goes out to leads through an owner's own Gmail / SMTP.
 * Every lead-facing send burns the owner's sender quota and reputation, so input is
 * validated strictly and volume is capped per owner.
 */

// One plain address: no display name, no list separators, no whitespace or angle brackets.
// Deliberately stricter than RFC 5322 - quoted local parts and IP literals are never real signups.
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}$/i;

export function isValidEmailAddress(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length > 254) return false;
  const at = value.lastIndexOf("@");
  if (at < 1 || at > 64) return false;
  const local = value.slice(0, at);
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  return EMAIL_RE.test(value);
}

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/**
 * Canonical inbox for rate-limit keys, so `a+1@x.com`, `a+2@x.com` (and `a.b@gmail.com` / `ab@gmail.com`)
 * share one bucket. Only for counting - never use it as the address to send to.
 */
export function canonicalInboxKey(value: unknown): string {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase().slice(0, 254);
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  let local = email.slice(0, at).split("+")[0];
  let domain = email.slice(at + 1);
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replace(/\./g, "");
    domain = "gmail.com";
  }
  return `${local}@${domain}`;
}

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * True when a lead "name" carries a link or address. Names are merged into emails sent from the
 * owner's inbox, so a name like "Claim your prize at evil.example/x" turns the owner into a spammer.
 */
export function nameContainsLink(name: string): boolean {
  return /:\/\/|www\.|@|[a-z0-9-]\.[a-z]{2,63}\//i.test(name);
}

function positiveIntFromEnv(name: string, fallback: number): number {
  const n = parseInt(process.env[name] || "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Max lead-facing emails (deliverables + sequence steps) one owner may send in a rolling 24h.
 * Stays under Gmail's consumer limit (500/day) with room for the owner's own mail.
 */
export const LEAD_EMAIL_DAILY_CAP = positiveIntFromEnv("LEAD_EMAIL_DAILY_CAP", 400);

/** Max new signups one page accepts from the public form in a rolling 24h. */
export const LEAD_PAGE_DAILY_CAP = positiveIntFromEnv("LEAD_PAGE_DAILY_CAP", 500);

/** Lead-facing emails this owner sent in the last 24 hours. */
export async function countOwnerLeadEmailsLast24h(ownerEmail: string): Promise<number> {
  if (!ownerEmail) return 0;
  return EmailEventModel.countDocuments({
    userEmail: ownerEmail.trim().toLowerCase(),
    eventType: "sent",
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
}

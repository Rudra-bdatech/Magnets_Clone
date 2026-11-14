import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, TrialRegistryModel } from "@/lib/models";
import { canonicalInboxKey } from "@/lib/email-guard";
import { isCompanyAccount } from "@/lib/roles";
import {
  getAccountAccess,
  lockedMessage,
  ACCESS_LOCKED_CODE,
  PAID_PLANS,
  TRIAL_DAYS,
  type AccountAccess,
} from "@/lib/subscription";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fields needed to evaluate access (kept small for hot paths such as public pages). */
export const ACCESS_PROJECTION = {
  _id: 1,
  email: 1,
  role: 1,
  plan: 1,
  emailVerified: 1,
  paymentProvider: 1,
  lastPaymentDate: 1,
  trialStartedAt: 1,
  trialEndsAt: 1,
  trialReused: 1,
  subscriptionStatus: 1,
  currentPeriodEnd: 1,
  lifetimeCustomDomain: 1,
} as const;

/** SHA-256 of the canonical inbox, so a+1@gmail.com / a.b@gmail.com count as one email. */
export function trialEmailHash(email: string): string {
  return createHash("sha256").update(`funnels-trial:${canonicalInboxKey(email)}`).digest("hex");
}

/**
 * True for an account that paid for the old one-time ₹4,999 lifetime plan and has not been
 * moved to the trial model yet: a paid plan with a payment on record but no subscription.
 * Pro set by an admin (no payment) is a complimentary grant and is left alone.
 */
function isUnconvertedLifetimeBuyer(acc: any): boolean {
  return (
    PAID_PLANS.includes(String(acc?.plan || "")) &&
    !acc?.subscriptionStatus &&
    Boolean(acc?.paymentProvider || acc?.lastPaymentDate)
  );
}

/**
 * Starts the 14-day trial the first time a verified account is seen, exactly once per email
 * (ever). Idempotent and race-safe. Also moves old lifetime buyers to the new model: they keep
 * their custom domain forever and get the same trial, then need Pro monthly for the dashboard.
 * Returns the (possibly updated) lean account.
 */
export async function ensureTrialStarted(acc: any): Promise<any> {
  if (!acc || acc.trialEndsAt) return acc;
  // Unverified emails never claim a trial: otherwise anyone could burn someone else's trial
  // by registering their address without being able to verify it.
  if (!acc.emailVerified) return acc;
  if (isCompanyAccount(acc.email, acc.role)) return acc;

  const now = new Date();
  const proposedEnd = new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
  const accountId = String(acc._id || "");

  // $setOnInsert keeps the first claim; a later account with the same email gets the original dates
  const emailHash = trialEmailHash(acc.email);
  let registry: any;
  try {
    registry = await TrialRegistryModel.findOneAndUpdate(
      { emailHash },
      { $setOnInsert: { accountId, trialStartedAt: now, trialEndsAt: proposedEnd, createdAt: now } },
      { upsert: true, returnDocument: "after" }
    ).lean();
  } catch (err: any) {
    // Two first requests raced on the unique index: the other one inserted, read its row
    if (err?.code !== 11000) throw err;
    registry = await TrialRegistryModel.findOne({ emailHash }).lean();
  }

  // Another account already claimed this email's trial. It is a re-registration (trial reused)
  // only if this account is newer than that claim. An account that already existed when the
  // claim was made is a separate pre-launch account sharing an inbox alias (a@gmail.com vs
  // a.b+x@gmail.com): it keeps its own fresh trial instead of being locked on day one.
  let trialStartedAt = registry?.trialStartedAt ? new Date(registry.trialStartedAt) : now;
  let trialEndsAt = registry?.trialEndsAt ? new Date(registry.trialEndsAt) : proposedEnd;
  let trialReused = false;
  if (registry?.accountId && registry.accountId !== accountId) {
    const createdMs = acc._id?.getTimestamp ? acc._id.getTimestamp().getTime() : Date.now();
    const claimedMs = registry.createdAt ? new Date(registry.createdAt).getTime() : 0;
    if (createdMs < claimedMs) {
      trialStartedAt = now;
      trialEndsAt = proposedEnd;
    } else {
      trialReused = true;
    }
  }

  const set: Record<string, unknown> = { trialStartedAt, trialEndsAt, trialReused };
  if (isUnconvertedLifetimeBuyer(acc)) {
    set.lifetimeCustomDomain = true;
    set.plan = "Free";
  }

  // Only the first writer wins; a concurrent request leaves the stored trial untouched
  await AccountModel.updateOne(
    { _id: acc._id, $or: [{ trialEndsAt: null }, { trialEndsAt: { $exists: false } }] },
    { $set: set }
  );
  if (set.lifetimeCustomDomain) {
    console.log(`[subscription] Moved lifetime buyer ${acc.email} to trial + lifetime custom domain`);
  }

  return (await AccountModel.findOne({ _id: acc._id }).lean()) || acc;
}

/** Loads the account for a verified email, starts its trial if needed, and evaluates access. */
export async function getAccessForEmail(
  email: string | null | undefined
): Promise<{ account: any; access: AccountAccess } | null> {
  if (!email) return null;
  await dbConnect();
  const raw = await AccountModel.findOne({ email: email.trim().toLowerCase() }, ACCESS_PROJECTION).lean();
  if (!raw) return null;
  const account = await ensureTrialStarted(raw);
  return { account, access: getAccountAccess(account) };
}

/** Response sent when a locked account calls a route that creates or changes content. */
export function subscriptionRequiredResponse(access: AccountAccess) {
  return NextResponse.json(
    { error: lockedMessage(access), code: ACCESS_LOCKED_CODE, access },
    { status: 402 }
  );
}

/**
 * Guard for owner-side write routes. Returns null when the account may proceed, otherwise the
 * 402 response to return. Unknown accounts pass through so the route's own auth/404 handling runs.
 */
export async function requireFullAccess(email: string | null | undefined): Promise<NextResponse | null> {
  if (!email) return null;
  const result = await getAccessForEmail(email);
  if (!result || result.access.hasFullAccess) return null;
  return subscriptionRequiredResponse(result.access);
}

/**
 * Whether an owner's public pages (landing pages, lead capture, sequences) are still served.
 * Fails open: a lookup error must never take a paying customer's pages down.
 */
export async function isOwnerPublicLive(ownerEmail: string | null | undefined): Promise<boolean> {
  if (!ownerEmail) return true;
  try {
    await dbConnect();
    const acc = await AccountModel.findOne({ email: ownerEmail.trim().toLowerCase() }, ACCESS_PROJECTION).lean();
    if (!acc) return true;
    return getAccountAccess(acc as any).publicPagesLive;
  } catch (err) {
    console.error("[subscription] isOwnerPublicLive lookup failed:", err);
    return true;
  }
}

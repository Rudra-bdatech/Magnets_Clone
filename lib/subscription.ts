/**
 * 14-day free trial → Pro monthly (₹299). The single source of truth for "what may this
 * account do right now". Pure and dependency-free so the server (API guards, public pages,
 * cron) and the dashboard UI evaluate exactly the same rules.
 *
 * States:
 *  - staff   : super admin / company account (isCompanyAccount). Never locked.
 *  - pro     : paying (Chargebee subscription inside its period, or Pro granted by an admin).
 *  - trial   : inside the 14-day trial (or the trial has not been started yet).
 *  - expired : trial over and nothing paid. Dashboard is locked; public pages stay up for
 *              PUBLIC_PAGE_GRACE_DAYS more, except for lifetime custom-domain buyers.
 */
import { isCompanyAccount } from "./roles";

export const TRIAL_DAYS = 14;
/** A failed renewal keeps Pro this long past the paid period while Chargebee retries. */
export const PAYMENT_GRACE_DAYS = 7;
/** Public landing pages keep working this long after the dashboard locks. */
export const PUBLIC_PAGE_GRACE_DAYS = 7;
export const PRO_MONTHLY_PRICE_INR = 299;
export const PRO_MONTHLY_DISPLAY_PRICE = "₹299";

/** Plans that mean "has Pro right now". Written by the payment webhooks and the admin panel. */
export const PAID_PLANS = ["Pro", "Growth", "Unlimited"];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Chargebee subscription statuses during which the customer has paid for the current period.
 * "in_trial" and "future" are deliberately excluded: neither has been paid for.
 */
export const LIVE_SUBSCRIPTION_STATUSES = new Set(["active", "non_renewing"]);
/** Statuses of a subscription that was paid for and then stopped; access runs to currentPeriodEnd. */
const ENDED_SUBSCRIPTION_STATUSES = new Set(["cancelled", "paused"]);

export type AccessState = "staff" | "pro" | "trial" | "expired";

export interface AccountAccess {
  state: AccessState;
  /** May create, edit and publish (staff, pro or trial). */
  hasFullAccess: boolean;
  /** Trial end as ISO string; null when not in a trial or the trial has not been started. */
  trialEndsAt: string | null;
  /** Whole days left in the trial (rounded up), 0 otherwise. */
  trialDaysLeft: number;
  /** This email already used its trial on an earlier, deleted account. */
  trialReused: boolean;
  /** When full access ended (expired only). */
  accessEndedAt: string | null;
  /** Public landing pages, lead capture and email sequences keep running. */
  publicPagesLive: boolean;
  /** When public pages go offline (expired only, null when never). */
  publicPagesOfflineAt: string | null;
  /** Bought the old lifetime plan: the custom domain keeps serving forever. */
  lifetimeCustomDomain: boolean;
  /** Paid subscription details, for the billing UI. */
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  /** Subscription is cancelled but still paid through currentPeriodEnd. */
  cancelsAtPeriodEnd: boolean;
}

/** Fields read from an account (a mongoose lean doc or the sanitized client copy). */
export interface AccessAccountFields {
  email?: string | null;
  role?: string | null;
  plan?: string | null;
  trialEndsAt?: Date | string | null;
  trialReused?: boolean | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: Date | string | null;
  lifetimeCustomDomain?: boolean | null;
}

function toMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function iso(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}

export function getAccountAccess(
  account: AccessAccountFields | null | undefined,
  now: number = Date.now()
): AccountAccess {
  const trialEndMs = toMs(account?.trialEndsAt);
  const periodEndMs = toMs(account?.currentPeriodEnd);
  const subStatus = String(account?.subscriptionStatus || "");
  const lifetimeCustomDomain = Boolean(account?.lifetimeCustomDomain);

  const base = {
    trialReused: Boolean(account?.trialReused),
    lifetimeCustomDomain,
    subscriptionStatus: subStatus,
    currentPeriodEnd: iso(periodEndMs),
    cancelsAtPeriodEnd: subStatus === "non_renewing" || (ENDED_SUBSCRIPTION_STATUSES.has(subStatus) && periodEndMs !== null && periodEndMs > now),
  };

  const full = (state: AccessState, trialEnds: number | null = null): AccountAccess => ({
    ...base,
    state,
    hasFullAccess: true,
    trialEndsAt: iso(trialEnds),
    trialDaysLeft: trialEnds !== null ? Math.max(0, Math.ceil((trialEnds - now) / DAY_MS)) : 0,
    accessEndedAt: null,
    publicPagesLive: true,
    publicPagesOfflineAt: null,
  });

  const expired = (endedMs: number | null): AccountAccess => {
    const offlineMs = lifetimeCustomDomain || endedMs === null ? null : endedMs + PUBLIC_PAGE_GRACE_DAYS * DAY_MS;
    return {
      ...base,
      state: "expired",
      hasFullAccess: false,
      trialEndsAt: null,
      trialDaysLeft: 0,
      accessEndedAt: iso(endedMs),
      publicPagesLive: offlineMs === null || now < offlineMs,
      publicPagesOfflineAt: iso(offlineMs),
    };
  };

  if (!account) return expired(null);

  // 1. Staff are never locked
  if (isCompanyAccount(account.email, account.role)) return full("staff");

  // 2. Pro right now
  if (PAID_PLANS.includes(String(account.plan || ""))) {
    // The webhook sets plan "Free" whenever a subscription stops being live, so a paid plan with
    // no live subscription was granted by an admin (or is a lifetime buyer not yet converted).
    if (!LIVE_SUBSCRIPTION_STATUSES.has(subStatus) || periodEndMs === null) return full("pro");
    const graceEndMs = periodEndMs + PAYMENT_GRACE_DAYS * DAY_MS;
    if (now < graceEndMs) return full("pro");
    // Safety net when a cancellation/dunning webhook never arrived
    return expired(Math.max(graceEndMs, trialEndMs ?? 0));
  }

  // 3. Cancelled (or paused) but still inside the period already paid for
  if (ENDED_SUBSCRIPTION_STATUSES.has(subStatus) && periodEndMs !== null && now < periodEndMs) return full("pro");

  // 4. Trial. Not started yet (pre-launch account the server has not initialised) counts as trial,
  //    so nothing public breaks before its owner next signs in.
  if (trialEndMs === null && periodEndMs === null) return full("trial");
  if (trialEndMs !== null && now < trialEndMs) return full("trial", trialEndMs);

  // 5. Expired
  return expired(Math.max(trialEndMs ?? 0, periodEndMs ?? 0) || null);
}

/** Fields read to decide the custom-domain unlock. */
export interface CustomDomainAccountFields {
  email?: string | null;
  role?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
  lifetimeCustomDomain?: boolean | null;
}

/**
 * The custom domain is a separate product from Pro monthly: a one-time ₹4,999 lifetime unlock.
 * Pro monthly (₹299) or the trial alone does NOT include it. Unlocked for:
 *  - staff;
 *  - anyone who paid the one-time fee (lifetimeCustomDomain);
 *  - a paid plan with no live subscription behind it: Pro granted by an admin, or an old
 *    lifetime buyer whose account has not been moved to lifetimeCustomDomain yet.
 */
export function hasCustomDomainAccess(account: CustomDomainAccountFields | null | undefined): boolean {
  if (!account) return false;
  if (isCompanyAccount(account.email, account.role)) return true;
  if (account.lifetimeCustomDomain) return true;
  return PAID_PLANS.includes(String(account.plan || "")) && !LIVE_SUBSCRIPTION_STATUSES.has(String(account.subscriptionStatus || ""));
}

/** Error code returned by API routes when a locked account tries to write. */
export const ACCESS_LOCKED_CODE = "SUBSCRIPTION_REQUIRED";

export function lockedMessage(access: AccountAccess): string {
  return access.trialReused
    ? `You have already completed your free trial. Please upgrade to Pro (${PRO_MONTHLY_DISPLAY_PRICE}/month) to continue.`
    : `Your free trial has ended. Please upgrade to Pro (${PRO_MONTHLY_DISPLAY_PRICE}/month) to continue.`;
}

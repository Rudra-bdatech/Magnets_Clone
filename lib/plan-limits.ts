import { isCompanyAccount } from "./roles";

export interface PlanTierConfig {
  name: string;
  badge: string;
  leadLimit: number;
  storageLimitMb: number;
  sequencesLimit: number;
  customDomainAllowed: boolean;
}

export const STAFF_ENTERPRISE_PLAN: PlanTierConfig = {
  name: "Super Admin",
  badge: "Super Admin Access",
  leadLimit: 1000000,
  storageLimitMb: 102400, // 100 GB
  sequencesLimit: 1000,
  customDomainAllowed: true,
};

// Trial and Pro have no lead or sequence limits (decided Nov 2026). What an account may do is
// decided by its trial/subscription state in lib/subscription.ts, not by these numbers.
// "Free" is the plan value of trial and expired accounts: during the trial they get everything,
// and once expired the dashboard is locked server-side (lib/subscription-server.ts).
const UNLIMITED_LEADS = 1000000;
const UNLIMITED_SEQUENCES = 1000;

export const PLAN_LIMITS: Record<string, PlanTierConfig> = {
  Free: {
    name: "Free Trial",
    badge: "Free Trial",
    leadLimit: UNLIMITED_LEADS,
    storageLimitMb: 999999,
    sequencesLimit: UNLIMITED_SEQUENCES,
    // The custom domain is a separate one-time purchase (lib/subscription.ts hasCustomDomainAccess)
    customDomainAllowed: false,
  },
  Pro: {
    name: "Pro Plan",
    badge: "Pro Plan Active",
    leadLimit: UNLIMITED_LEADS,
    storageLimitMb: 999999,
    sequencesLimit: UNLIMITED_SEQUENCES,
    customDomainAllowed: true,
  },
  // Growth and Unlimited kept for future use but not exposed in UI
  Growth: {
    name: "Growth Plan",
    badge: "Growth Plan Active",
    leadLimit: UNLIMITED_LEADS,
    storageLimitMb: 999999,
    sequencesLimit: UNLIMITED_SEQUENCES,
    customDomainAllowed: true,
  },
  Unlimited: {
    name: "Unlimited Enterprise",
    badge: "Enterprise Active",
    leadLimit: UNLIMITED_LEADS,
    storageLimitMb: 999999,
    sequencesLimit: UNLIMITED_SEQUENCES,
    customDomainAllowed: true,
  },
};

export function getPlanLimits(
  planName?: string,
  accountEmail?: string | null,
  accountRole?: string | null
): PlanTierConfig {
  if (isCompanyAccount(accountEmail, accountRole)) {
    return STAFF_ENTERPRISE_PLAN;
  }
  if (!planName) return PLAN_LIMITS.Free;
  return PLAN_LIMITS[planName] || PLAN_LIMITS.Free;
}

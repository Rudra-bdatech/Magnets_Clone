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
  name: "Enterprise Admin",
  badge: "Internal Staff Access",
  leadLimit: 1000000,
  storageLimitMb: 102400, // 100 GB
  sequencesLimit: 1000,
  customDomainAllowed: true,
};

export const PLAN_LIMITS: Record<string, PlanTierConfig> = {
  Free: {
    name: "Free Tier",
    badge: "Free Plan",
    leadLimit: 500,
    storageLimitMb: 500,
    sequencesLimit: 2,
    customDomainAllowed: false,
  },
  Pro: {
    name: "Pro Plan",
    badge: "Pro Plan Active",
    leadLimit: 2500,
    storageLimitMb: 1024, // 1 GB
    sequencesLimit: 5,
    customDomainAllowed: true,
  },
  Growth: {
    name: "Growth Plan",
    badge: "Growth Plan Active",
    leadLimit: 10000,
    storageLimitMb: 5120, // 5 GB
    sequencesLimit: 20,
    customDomainAllowed: true,
  },
  Unlimited: {
    name: "Unlimited Enterprise",
    badge: "Enterprise Active",
    leadLimit: 100000,
    storageLimitMb: 51200, // 50 GB
    sequencesLimit: 100,
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

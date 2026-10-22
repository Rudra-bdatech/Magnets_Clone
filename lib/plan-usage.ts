import { AccountModel, ResourceModel } from "@/lib/models";
import { getPlanLimits, type PlanTierConfig } from "@/lib/plan-limits";

/** Server-side plan limits for an account (the UI copies of these are only for display). */
export async function getAccountPlanLimits(email: string): Promise<PlanTierConfig> {
  const acc: any = await AccountModel.findOne({ email }, { plan: 1, email: 1, role: 1 }).lean();
  return getPlanLimits(acc?.plan, acc?.email || email, acc?.role);
}

/** Total bytes of every file the account has uploaded (deliverables and page assets). */
export async function getStorageUsedBytes(email: string): Promise<number> {
  const [row] = await ResourceModel.aggregate([
    { $match: { userEmail: email } },
    { $group: { _id: null, total: { $sum: "$size" } } },
  ]);
  return row?.total || 0;
}

/**
 * Null when `incomingBytes` more fits in the account's storage quota, otherwise the
 * error message to show.
 */
export async function checkStorageQuota(email: string, incomingBytes = 0): Promise<string | null> {
  const [limits, usedBytes] = await Promise.all([getAccountPlanLimits(email), getStorageUsedBytes(email)]);
  const limitBytes = limits.storageLimitMb * 1024 * 1024;
  if (usedBytes + incomingBytes <= limitBytes) return null;
  return `Storage limit reached (${limits.storageLimitMb} MB on the ${limits.name}). Delete some files or upgrade your plan.`;
}

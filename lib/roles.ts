/**
 * Role-Based Access Control (RBAC) & Super Admin Helpers
 * 
 * Supports two roles:
 * - "user": Regular account holder. Custom domain is locked by default unless on Pro plan.
 * - "super_admin": Platform super admin with full platform bypass privileges.
 */

export type UserRole = "user" | "super_admin";

/**
 * Returns the list of designated super admin emails with full platform bypass privileges.
 * Configured via process.env.SUPER_ADMIN_EMAILS (comma-separated, e.g. "hello@ambesh.com").
 */
export function getSuperAdminEmails(): string[] {
  const envSuperAdmins = process.env.SUPER_ADMIN_EMAILS || "hello@ambesh.com,1ambeshtiwari@gmail.com,rudranath@bda.co.in";
  return envSuperAdmins
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Determines the appropriate user role based on email address.
 * Only explicit super admin emails receive "super_admin"; all others are "user".
 */
export function determineRoleForEmail(email: string | null | undefined): UserRole {
  if (!email) return "user";
  const cleanEmail = email.trim().toLowerCase();

  const superAdmins = getSuperAdminEmails();
  if (superAdmins.includes(cleanEmail)) {
    return "super_admin";
  }

  return "user";
}

/**
 * Checks whether an account has super admin privileges (for staff bypass, enterprise limits, etc.).
 */
export function isCompanyAccount(email: string | null | undefined, explicitRole?: string | null): boolean {
  if (explicitRole === "super_admin") {
    return true;
  }
  const computedRole = determineRoleForEmail(email);
  return computedRole === "super_admin";
}

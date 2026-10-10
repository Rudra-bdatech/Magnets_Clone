/**
 * Role-Based Access Control (RBAC) & Company Domain Helpers
 * 
 * Protects platform SMTP resources by ensuring only verified company staff
 * (e.g. @bda.co.in / super admins) can utilize platform mail fallback, while
 * external public users are required to connect their own Gmail OAuth or Custom SMTP.
 */

export type UserRole = "user" | "admin" | "super_admin";

/**
 * Returns the list of internal company domain names allowed to use platform email.
 * Configured via process.env.COMPANY_DOMAINS (comma-separated, e.g. "bda.co.in,bdatech.in").
 */
export function getCompanyDomains(): string[] {
  const envDomains = process.env.COMPANY_DOMAINS || "bda.co.in,bdatech.in";
  return envDomains
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

/**
 * Returns the list of designated super admin emails with full platform bypass privileges.
 * Configured via process.env.SUPER_ADMIN_EMAILS (comma-separated, e.g. "rudranath@bda.co.in").
 */
export function getSuperAdminEmails(): string[] {
  const envSuperAdmins = process.env.SUPER_ADMIN_EMAILS || "rudranath@bda.co.in,kabirajrudanath@gmail.com,kabirajrnkrudra@gmail.com,hello@ambesh.com";
  return envSuperAdmins
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Determines the appropriate user role based on email address.
 */
export function determineRoleForEmail(email: string | null | undefined): UserRole {
  if (!email) return "user";
  const cleanEmail = email.trim().toLowerCase();

  const superAdmins = getSuperAdminEmails();
  if (superAdmins.includes(cleanEmail)) {
    return "super_admin";
  }

  const companyDomains = getCompanyDomains();
  const domain = cleanEmail.split("@")[1];
  if (domain && companyDomains.includes(domain)) {
    return "admin";
  }

  return "user";
}

/**
 * Checks whether an account belongs to internal company staff or has admin privileges.
 */
export function isCompanyAccount(email: string | null | undefined, explicitRole?: string | null): boolean {
  if (explicitRole === "super_admin" || explicitRole === "admin") {
    return true;
  }
  const computedRole = determineRoleForEmail(email);
  return computedRole === "super_admin" || computedRole === "admin";
}

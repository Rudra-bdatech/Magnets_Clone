import { NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";
import { determineRoleForEmail } from "@/lib/roles";

export type AdminRole = "super_admin";

interface AdminSession {
  email: string;
  role: AdminRole;
}

/**
 * Verifies the caller is super_admin.
 * Role is always checked against the DB — the session token only carries email.
 * Returns the session on success, or a ready-to-return NextResponse on failure.
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const email = await getAuthenticatedUserEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await dbConnect();
  const account = await AccountModel.findOne({ email }, { role: 1 }).lean() as any;
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 401 });
  }

  // Always compute from email too, so super_admin env vars take effect even if
  // the DB role field hasn't been written yet (e.g. on first login).
  const computedRole = determineRoleForEmail(email);
  const effectiveRole = computedRole === "super_admin"
    ? "super_admin"
    : (account.role === "super_admin" ? "super_admin" : "user");

  if (effectiveRole !== "super_admin") {
    return NextResponse.json({ error: "Forbidden. Super admin access required." }, { status: 403 });
  }

  return { email, role: "super_admin" };
}

export function isAdminSession(result: AdminSession | NextResponse): result is AdminSession {
  return "email" in result;
}

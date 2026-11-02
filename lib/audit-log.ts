import { dbConnect } from "@/lib/mongodb";
import { AuditLogModel } from "@/lib/models";
import type { AdminRole } from "@/lib/admin-auth";

export type AuditAction = "plan_change" | "role_change";

interface LogEntry {
  adminEmail: string;
  adminRole: AdminRole;
  action: AuditAction;
  targetEmail: string;
  targetName: string;
  before: Record<string, string>;
  after: Record<string, string>;
}

export async function logAdminAction(entry: LogEntry): Promise<void> {
  try {
    await dbConnect();
    await AuditLogModel.create(entry);
  } catch (err) {
    // Audit log failures must never block the actual action — log and continue
    console.error("[audit-log] Failed to write audit entry:", err);
  }
}

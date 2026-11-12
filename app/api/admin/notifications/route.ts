import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, AuditLogModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

// Return notifications from the last 7 days, newest first, capped at 40.
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const CAP = 40;

function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const cp = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e0 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...cp) + " ";
}

export async function GET() {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  await dbConnect();

  const since = new Date(Date.now() - WINDOW_MS);

  // ObjectId encodes creation time — use it to find accounts created in window.
  const sinceOid = new mongoose.Types.ObjectId(
    Math.floor(since.getTime() / 1000)
      .toString(16)
      .padStart(8, "0") + "0000000000000000"
  );

  const [newAccounts, verifiedAccounts, suspendAudit] = await Promise.all([
    // New signups
    AccountModel.find(
      { _id: { $gte: sinceOid } },
      { email: 1, name: 1, signupCountry: 1, signupCountryCode: 1, signupCity: 1 }
    )
      .sort({ _id: -1 })
      .limit(CAP)
      .lean(),

    // Email verifications in window
    AccountModel.find(
      { emailVerified: { $gte: since } },
      { email: 1, name: 1, emailVerified: 1 }
    )
      .sort({ emailVerified: -1 })
      .limit(CAP)
      .lean(),

    // Suspend / unsuspend audit entries in window
    AuditLogModel.find(
      {
        action: { $in: ["account_suspend", "account_unsuspend"] },
        createdAt: { $gte: since },
      },
      { action: 1, targetEmail: 1, targetName: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(CAP)
      .lean(),
  ]);

  type Notif = {
    id: string;
    type: "signup" | "verified" | "suspended" | "unsuspended";
    title: string;
    desc: string;
    ts: string; // ISO
  };

  const notifs: Notif[] = [];

  for (const acc of newAccounts as any[]) {
    const flag = flagEmoji(acc.signupCountryCode || "");
    const loc = [acc.signupCity, acc.signupCountry].filter(Boolean).join(", ");
    notifs.push({
      id: `signup:${acc._id}`,
      type: "signup",
      title: "New signup",
      desc: `${acc.name || acc.email}${loc ? ` joined from ${flag}${loc}` : " joined"}`,
      ts: new Date(
        parseInt(acc._id.toString().substring(0, 8), 16) * 1000
      ).toISOString(),
    });
  }

  for (const acc of verifiedAccounts as any[]) {
    notifs.push({
      id: `verified:${acc._id}`,
      type: "verified",
      title: "Email verified",
      desc: `${acc.name || acc.email} confirmed their address`,
      ts: new Date(acc.emailVerified).toISOString(),
    });
  }

  for (const entry of suspendAudit as any[]) {
    const isSuspend = entry.action === "account_suspend";
    notifs.push({
      id: `${entry.action}:${entry._id}`,
      type: isSuspend ? "suspended" : "unsuspended",
      title: isSuspend ? "Account suspended" : "Account unsuspended",
      desc: `${entry.targetName || entry.targetEmail} was ${isSuspend ? "suspended" : "restored"}`,
      ts: new Date(entry.createdAt).toISOString(),
    });
  }

  // Sort all by ts desc, cap at 40
  notifs.sort((a, b) => b.ts.localeCompare(a.ts));
  const result = notifs.slice(0, CAP);

  return NextResponse.json({ notifications: result }, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, AuditLogModel, AdminNotifStateModel } from "@/lib/models";
import { requireAdmin, isAdminSession } from "@/lib/admin-auth";

// Signups / verifications / suspensions: last 7 days.
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// Revenue events: last 30 days (payments are less frequent).
const REVENUE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const CAP = 60;

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

  const revenueSince = new Date(Date.now() - REVENUE_WINDOW_MS);

  const [newAccounts, verifiedAccounts, suspendAudit, upgradedAccounts, cancelledAccounts, failedAccounts] = await Promise.all([
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

    // All sensitive admin audit actions in window
    AuditLogModel.find(
      {
        action: {
          $in: [
            "account_suspend",
            "account_unsuspend",
            "account_delete",
            "plan_change",
            "role_change",
            "funnel_delete",
          ],
        },
        createdAt: { $gte: since },
      },
      { action: 1, adminEmail: 1, targetEmail: 1, targetName: 1, before: 1, after: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(CAP)
      .lean(),

    // Upgraded to Pro in revenue window
    AccountModel.find(
      {
        plan: "Pro",
        paymentStatus: "active",
        lastPaymentDate: { $gte: revenueSince },
      },
      { email: 1, name: 1, paymentProvider: 1, stripeSubscriptionId: 1, chargebeeSubscriptionId: 1, lastPaymentDate: 1 }
    )
      .sort({ lastPaymentDate: -1 })
      .limit(CAP)
      .lean(),

    // Cancelled in revenue window
    AccountModel.find(
      {
        paymentStatus: "cancelled",
        lastPaymentDate: { $gte: revenueSince },
      },
      { email: 1, name: 1, paymentProvider: 1, lastPaymentDate: 1 }
    )
      .sort({ lastPaymentDate: -1 })
      .limit(CAP)
      .lean(),

    // Payment failed in revenue window
    AccountModel.find(
      {
        paymentStatus: { $in: ["failed", "past_due"] },
        lastPaymentDate: { $gte: revenueSince },
      },
      { email: 1, name: 1, paymentProvider: 1, paymentStatus: 1, lastPaymentDate: 1 }
    )
      .sort({ lastPaymentDate: -1 })
      .limit(CAP)
      .lean(),
  ]);

  type Notif = {
    id: string;
    type: "signup" | "verified" | "suspended" | "unsuspended" | "upgrade" | "cancelled" | "payment_failed" | "account_delete" | "plan_change" | "role_change" | "funnel_delete";
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
    const target = entry.targetName || entry.targetEmail || "Unknown";
    const admin  = entry.adminEmail || "Admin";
    let type: Notif["type"];
    let title: string;
    let desc: string;

    switch (entry.action) {
      case "account_suspend":
        type  = "suspended";
        title = "Account suspended";
        desc  = `${admin} suspended ${target}`;
        break;
      case "account_unsuspend":
        type  = "unsuspended";
        title = "Account restored";
        desc  = `${admin} restored ${target}'s access`;
        break;
      case "account_delete":
        type  = "account_delete";
        title = "Account deleted";
        desc  = `${admin} permanently deleted ${target}`;
        break;
      case "plan_change": {
        const from = entry.before?.plan || "Free";
        const to   = entry.after?.plan  || "Pro";
        type  = "plan_change";
        title = "Plan changed";
        desc  = `${admin} changed ${target}'s plan from ${from} → ${to}`;
        break;
      }
      case "role_change": {
        const fromRole = entry.before?.role || "user";
        const toRole   = entry.after?.role  || "admin";
        type  = "role_change";
        title = "Role changed";
        desc  = `${admin} changed ${target}'s role from ${fromRole} → ${toRole}`;
        break;
      }
      case "funnel_delete":
        type  = "funnel_delete";
        title = "Funnel deleted";
        desc  = `${admin} deleted a funnel belonging to ${target}`;
        break;
      default:
        continue;
    }

    notifs.push({
      id: `${entry.action}:${entry._id}`,
      type,
      title,
      desc,
      ts: new Date(entry.createdAt).toISOString(),
    });
  }

  for (const acc of upgradedAccounts as any[]) {
    const provider = (acc.paymentProvider || "").toLowerCase();
    const isStripe = provider === "stripe" || Boolean(acc.stripeSubscriptionId);
    const amount = isStripe ? "$67/mo" : "₹4,999";
    const via = isStripe ? "Stripe" : "Chargebee";
    notifs.push({
      id: `upgrade:${acc._id}`,
      type: "upgrade",
      title: "New Pro subscriber",
      desc: `${acc.name || acc.email} upgraded via ${via} — ${amount}`,
      ts: new Date(acc.lastPaymentDate).toISOString(),
    });
  }

  for (const acc of cancelledAccounts as any[]) {
    notifs.push({
      id: `cancelled:${acc._id}`,
      type: "cancelled",
      title: "Subscription cancelled",
      desc: `${acc.name || acc.email} cancelled their Pro plan`,
      ts: new Date(acc.lastPaymentDate).toISOString(),
    });
  }

  for (const acc of failedAccounts as any[]) {
    const status = (acc.paymentStatus || "failed") === "past_due" ? "past due" : "failed";
    notifs.push({
      id: `failed:${acc._id}`,
      type: "payment_failed",
      title: "Payment failed",
      desc: `${acc.name || acc.email}'s payment is ${status}`,
      ts: new Date(acc.lastPaymentDate).toISOString(),
    });
  }

  // Sort all by ts desc, cap at 60
  notifs.sort((a, b) => b.ts.localeCompare(a.ts));
  const result = notifs.slice(0, CAP);

  // Fetch this admin's read/dismissed state from DB
  const notifState = await AdminNotifStateModel.findOne(
    { adminEmail: auth.email },
    { readIds: 1, dismissedIds: 1 }
  ).lean() as any;

  return NextResponse.json({
    notifications: result,
    readIds:      notifState?.readIds      ?? [],
    dismissedIds: notifState?.dismissedIds ?? [],
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

// Persist read/dismissed state to DB (fire-and-forget from client)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAdminSession(auth)) return auth;

  let body: { readIds?: string[]; dismissedIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { readIds = [], dismissedIds = [] } = body;
  if (!Array.isArray(readIds) || !Array.isArray(dismissedIds)) {
    return NextResponse.json({ error: "readIds and dismissedIds must be arrays." }, { status: 400 });
  }

  // Validate every element: must be a plain string ≤ 100 chars (notification IDs are ~40 chars)
  const cleanReadIds = readIds
    .filter((id): id is string => typeof id === "string" && id.length <= 100)
    .slice(0, 300);
  const cleanDismissedIds = dismissedIds
    .filter((id): id is string => typeof id === "string" && id.length <= 100)
    .slice(0, 300);

  if (!cleanReadIds.length && !cleanDismissedIds.length) {
    return NextResponse.json({ ok: true });
  }

  await dbConnect();

  // Aggregation pipeline update: $setUnion deduplicates, $slice keeps the latest 300.
  // Atomic, no separate trim step needed, works in MongoDB 4.2+.
  await AdminNotifStateModel.findOneAndUpdate(
    { adminEmail: auth.email },
    [
      {
        $set: {
          readIds: {
            $slice: [
              { $setUnion: [{ $ifNull: ["$readIds", []] }, cleanReadIds] },
              -300,
            ],
          },
          dismissedIds: {
            $slice: [
              { $setUnion: [{ $ifNull: ["$dismissedIds", []] }, cleanDismissedIds] },
              -300,
            ],
          },
          updatedAt: "$$NOW",
        },
      },
    ],
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}

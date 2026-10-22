import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { AccountModel } from "@/lib/models";
import { syncUserLinkedInComments } from "@/lib/linkedin-automation";

export const dynamic = "force-dynamic";

/**
 * Background Cron Job: Runs periodically to process LinkedIn comments
 * and send DMs for all accounts with an active LinkedIn connection.
 */
export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await dbConnect();

    // Fetch all accounts with active LinkedIn connections
    const connectedAccounts = await AccountModel.find({
      linkedinConnected: true,
      $or: [
        { linkedinLiAt: { $ne: "", $exists: true } },
        { linkedinAccountId: { $ne: "", $exists: true } },
      ],
    }).lean();

    if (connectedAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No connected LinkedIn accounts found to sync.",
        syncedAccounts: 0,
      });
    }

    const results = [];
    for (const acc of connectedAccounts) {
      try {
        const res = await syncUserLinkedInComments(acc);
        results.push({ email: acc.email, ...res });
      } catch (err: any) {
        results.push({ email: acc.email, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      syncedAccounts: connectedAccounts.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron LinkedIn Sync] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}


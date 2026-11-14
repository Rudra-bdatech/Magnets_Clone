import { NextResponse } from "next/server";
import { PLAN_RETIRED_RESPONSE } from "@/lib/billing";

export const dynamic = "force-dynamic";

// Retired: payments are India-only through Chargebee (custom domain ₹4,999 one-time, Pro ₹299/month
// via /api/billing/chargebee/create-checkout). Kept as a stub so
// stale clients get a clear answer instead of a 404. The previous implementation is in git history.
export async function POST() {
  return NextResponse.json(PLAN_RETIRED_RESPONSE, { status: 410 });
}

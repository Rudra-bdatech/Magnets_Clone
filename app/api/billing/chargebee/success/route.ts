import { NextRequest, NextResponse } from "next/server";
import { getChargebeeClient } from "@/lib/billing";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const dynamic = "force-dynamic";

// Chargebee redirects here after successful hosted page payment:
// GET /api/billing/chargebee/success?id=<hosted_page_id>
export async function GET(req: NextRequest) {
  const hostedPageId = req.nextUrl.searchParams.get("id");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!hostedPageId) {
    return NextResponse.redirect(`${appUrl}/dashboard?payment=error&reason=missing_page_id`);
  }

  try {
    const cb = getChargebeeClient();
    if (!cb) {
      // If no keys — still redirect to dashboard; webhook will handle the upgrade
      return NextResponse.redirect(`${appUrl}/dashboard?payment=pending`);
    }

    // Retrieve and verify the hosted page to confirm payment status
    const result = await (cb as any).hostedPage.retrieve(hostedPageId).request();
    const page = result.hosted_page;

    if (page.state !== "succeeded") {
      console.warn("[Chargebee Success]: Page not in succeeded state:", page.state);
      return NextResponse.redirect(`${appUrl}/dashboard?payment=pending`);
    }

    // Extract user email from pass_thru_content or customer
    let userEmail: string | null = null;
    try {
      const passThru = JSON.parse(page.pass_thru_content || "{}");
      userEmail = passThru.userEmail || null;
    } catch (_) {}

    if (!userEmail && page.content?.customer?.email) {
      userEmail = page.content.customer.email;
    }

    if (userEmail) {
      await dbConnect();
      await AccountModel.findOneAndUpdate(
        { email: userEmail.trim().toLowerCase() },
        {
          $set: {
            plan: "Pro",
            paymentProvider: "chargebee",
            paymentStatus: "paid",
            lastPaymentDate: new Date(),
            chargebeeHostedPageId: page.id,
            chargebeeInvoiceId: page.content?.invoice?.id || "",
          },
        }
      );
      console.log(`[Chargebee Success]: Upgraded ${userEmail} → Pro`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard?payment=success`);
  } catch (error: any) {
    console.error("[Chargebee Success Error]:", error);
    return NextResponse.redirect(`${appUrl}/dashboard?payment=error`);
  }
}

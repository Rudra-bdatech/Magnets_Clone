import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { handleConfirmNotifyEmail } from "@/lib/controllers/account";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function page(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:48px 16px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;text-align:center;">
<h1 style="margin:0 0 12px;font-size:20px;">${title}</h1>
<p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">${message}</p>
</div></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// Link from the confirmation email sent to a newly requested lead-alert inbox.
// Clicking it from that inbox is the proof of consent; no login is required.
export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(getClientIp(req.headers), "notify_email_confirm_click", 20, 60 * 1000);
  if (!rl.success) return page("Please wait", "Too many attempts. Please try again in a minute.", 429);

  try {
    await dbConnect();
    const result = await handleConfirmNotifyEmail(req.nextUrl.searchParams.get("token") || "");
    if (!result.success) {
      return page("Link expired", "This confirmation link is invalid or has expired. Ask the account owner to send a new one.", 400);
    }
    return page("Inbox confirmed", "New lead alerts will now be sent to this address.", 200);
  } catch (err) {
    console.error("[notify-email] Confirm failed:", err);
    return page("Something went wrong", "Please try again in a moment.", 500);
  }
}

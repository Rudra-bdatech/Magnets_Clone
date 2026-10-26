import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyPdfUnlockToken } from "@/lib/session-token";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel } from "@/lib/models";

export const dynamic = "force-dynamic";

// Cookie name pattern must match verify-code route exactly
const cookieName = (magnetId: string) => `pdf_unlocked_${magnetId}`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const magnetId = (searchParams.get("magnetId") || "").trim();
    const queryToken = (searchParams.get("token") || "").trim();

    if (!magnetId) {
      return NextResponse.json({ unlocked: false, error: "Missing magnetId." }, { status: 400 });
    }

    await dbConnect();
    const pageDoc: any = await MagnetPageModel.findOne({
      $or: [
        { id: magnetId },
        ...(mongoose.Types.ObjectId.isValid(magnetId) ? [{ _id: magnetId }] : []),
      ],
    })
      .select("id pdfPages")
      .lean();

    const resetParam = searchParams.get("reset") === "1";
    if (resetParam) {
      const res = NextResponse.json({ unlocked: false });
      const isHttps = req.nextUrl.protocol === "https:";
      const clearCookie = {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax" as const,
        maxAge: 0,
        path: "/",
      };
      res.cookies.set(cookieName(magnetId), "", clearCookie);
      if (pageDoc?.id && pageDoc.id !== magnetId) {
        res.cookies.set(cookieName(pageDoc.id), "", clearCookie);
      }
      return res;
    }

    const cookieValue =
      req.cookies.get(cookieName(magnetId))?.value ||
      (pageDoc?.id ? req.cookies.get(cookieName(pageDoc.id))?.value : undefined);
    const tokenToVerify = queryToken || cookieValue || "";

    if (!tokenToVerify) {
      return NextResponse.json({ unlocked: false });
    }

    const payload = verifyPdfUnlockToken(tokenToVerify);
    const unlocked = !!(
      payload &&
      (payload.magnetId === magnetId ||
        (pageDoc?.id && payload.magnetId === pageDoc.id) ||
        !payload.magnetId)
    );

    if (!unlocked) {
      return NextResponse.json({ unlocked: false });
    }

    // Locked pages are only delivered here, after the token is verified.
    // Prefer the snapshot taken at unlock time; fall back to the magnet's current pages.
    const snapshot = payload?.pdfPages;
    let pdfPages: string[] = Array.isArray(snapshot) ? snapshot : [];
    if (pdfPages.length === 0) {
      pdfPages = Array.isArray(pageDoc?.pdfPages) ? pageDoc.pdfPages : [];
    }

    return NextResponse.json({
      unlocked: true,
      email: payload?.email,
      pdfPages,
    });
  } catch (err: any) {
    console.error("[pdf-gate/status] Error:", err);
    return NextResponse.json({ unlocked: false }, { status: 500 });
  }
}

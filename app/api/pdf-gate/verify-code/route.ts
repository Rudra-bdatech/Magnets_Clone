import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { checkRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";
import { PdfOtpModel, MagnetPageModel, LeadModel, AccountModel } from "@/lib/models";
import { createPdfUnlockToken } from "@/lib/session-token";
import { timingSafeEqual, createHash } from "crypto";

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(createHash("sha256").update(String(a)).digest("hex"));
    const bufB = Buffer.from(createHash("sha256").update(String(b)).digest("hex"));
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

// Cookie name pattern: pdf_unlocked_{magnetId}
const cookieName = (magnetId: string) => `pdf_unlocked_${magnetId}`;

// 7-day unlock cookie
const UNLOCK_MAX_AGE = 7 * 24 * 60 * 60; // seconds

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: max 10 verify attempts per IP per minute ───────────────
    const ip = getClientIp(req.headers);

    const rl = await checkRateLimit(ip, "pdf_verify_code", 10, 60 * 1000, { failClosed: true });
    if (!rl.success) {
      const { error, status } = rateLimitMessage(rl, "Too many attempts. Please wait a moment.");
      return NextResponse.json({ error }, { status, headers: { "Retry-After": String(rl.reset) } });
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let body: { email?: string; code?: string; token?: string; magnetId?: string; name?: string; customFields?: Record<string, any> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const token = (body.token || "").trim();
    const magnetId = (body.magnetId || "").trim();

    if (!email || !code || !token || !magnetId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await dbConnect();

    // ── Find the OTP record ────────────────────────────────────────────────
    const otpRecord = await PdfOtpModel.findOne({ token, email, magnetId });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Code expired or invalid. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.used) {
      return NextResponse.json(
        { error: "This code has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await PdfOtpModel.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: "Code expired. Please request a new one." },
        { status: 400 }
      );
    }

    // ── Check per-code attempt limit (max 5 failed attempts) ──────────────
    const MAX_ATTEMPTS = 5;
    const currentAttempts = typeof otpRecord.attempts === "number" ? otpRecord.attempts : 0;

    if (currentAttempts >= MAX_ATTEMPTS) {
      await PdfOtpModel.deleteOne({ _id: otpRecord._id }).catch(() => {});
      return NextResponse.json(
        { error: "Too many incorrect attempts. This code has expired. Please request a new one." },
        { status: 429 }
      );
    }

    if (!safeCompare(otpRecord.code, code)) {
      const nextAttempts = currentAttempts + 1;
      const remaining = MAX_ATTEMPTS - nextAttempts;

      if (remaining <= 0) {
        await PdfOtpModel.deleteOne({ _id: otpRecord._id }).catch(() => {});
        return NextResponse.json(
          { error: "Too many incorrect attempts. This code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      await PdfOtpModel.updateOne(
        { _id: otpRecord._id },
        { $set: { attempts: nextAttempts } }
      ).catch(() => {});

      return NextResponse.json(
        { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
        { status: 400 }
      );
    }

    // ── Mark OTP as used ──────────────────────────────────────────────────
    otpRecord.used = true;
    await otpRecord.save();

    // ── Create Lead in MongoDB so it shows in Leads dashboard ─────
    try {
      const mongoose = await import("mongoose");
      let pageDoc = await MagnetPageModel.findOne({ id: magnetId }).lean();
      if (!pageDoc && mongoose.Types.ObjectId.isValid(magnetId)) {
        pageDoc = await MagnetPageModel.findOne({ _id: magnetId }).lean();
      }

      let ownerEmail = (pageDoc?.userEmail || "").trim().toLowerCase();
      const pageTitle = pageDoc?.name || "Locked PDF Magnet";
      const cleanEmail = email.trim().toLowerCase();
      const leadName = (otpRecord.name || body.name || "").trim() || cleanEmail.split("@")[0];
      const customFields = otpRecord.customFields || body.customFields || {};

      // Match by pageId only — page titles aren't unique across accounts, so matching
      // by title could pick up (and re-assign) another account's lead.
      const existingLead = await LeadModel.findOne({
        email: cleanEmail,
        pageId: magnetId,
      });

      if (!existingLead) {
        const userAgent = req.headers.get("user-agent") || "";
        const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
        const rawReferrer = req.headers.get("referer") || req.headers.get("referrer") || "";
        let cleanReferrer = "Direct";
        if (rawReferrer) {
          try {
            const host = new URL(rawReferrer).hostname;
            cleanReferrer = host.replace(/^www\./, "");
          } catch (e) {}
        }

        const now = new Date();
        const seqList = (pageDoc?.sequenceEmails && pageDoc.sequenceEmails.length > 0) ? pageDoc.sequenceEmails : [];
        const hasSeq = pageDoc?.sequenceEnabled || seqList.length > 0;

        await LeadModel.create({
          id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userEmail: ownerEmail,
          name: leadName,
          email: cleanEmail,
          page: pageTitle,
          pageId: magnetId,
          status: "new",
          source: "locked-pdf-otp",
          tags: ["locked-pdf"],
          sequence: hasSeq ? `${pageTitle} Follow-up` : undefined,
          sequenceStep: hasSeq ? `Step 1 of ${Math.max(1, seqList.length)} (In Progress)` : undefined,
          signedUpAt: now.toISOString(),
          customFields,
          deviceType: isMobile ? "mobile" : "desktop",
          referrer: cleanReferrer,
        });

        if (pageDoc) {
          await MagnetPageModel.updateOne({ _id: pageDoc._id }, { $inc: { signups: 1 } });
        }
      } else {
        // Keep existing owner; only fill it in if missing. Retain locked-pdf tag & customFields.
        await LeadModel.updateOne(
          { _id: existingLead._id },
          {
            $set: {
              userEmail: (existingLead as any).userEmail || ownerEmail,
              name: leadName || existingLead.name,
              customFields: { ...((existingLead as any).customFields || {}), ...customFields },
            },
            $addToSet: { tags: "locked-pdf" },
          }
        );
      }
    } catch (leadErr) {
      console.error("[pdf-gate/verify-code] Error creating lead record:", leadErr);
    }

    // ── Generate signed per-subscriber access token with snapshot ─────────
    const mongoose = await import("mongoose");
    let pageDocSnapshot = await MagnetPageModel.findOne({ id: magnetId }).lean();
    if (!pageDocSnapshot && mongoose.Types.ObjectId.isValid(magnetId)) {
      pageDocSnapshot = await MagnetPageModel.findOne({ _id: magnetId }).lean();
    }
    const pdfSnapshot: string[] = Array.isArray(pageDocSnapshot?.pdfPages) ? pageDocSnapshot.pdfPages : [];

    const unlockToken = createPdfUnlockToken({
      magnetId,
      email: email,
      pdfPages: pdfSnapshot,
    });

    const res = NextResponse.json({ ok: true, unlockToken, pdfPages: pdfSnapshot });
    const isHttps = req.nextUrl.protocol === "https:";
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax" as const,
      maxAge: UNLOCK_MAX_AGE,
      path: "/",
    };
    res.cookies.set(cookieName(magnetId), unlockToken, cookieOptions);
    if (pageDocSnapshot?.id && pageDocSnapshot.id !== magnetId) {
      res.cookies.set(cookieName(pageDocSnapshot.id), unlockToken, cookieOptions);
    }

    return res;
  } catch (err: any) {
    console.error("[pdf-gate/verify-code] Unhandled error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

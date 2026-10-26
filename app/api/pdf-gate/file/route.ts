import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel } from "@/lib/models";
import { verifyPdfUnlockToken } from "@/lib/session-token";
import { fetchStoredPdf, PdfSourceError } from "@/lib/pdf-source";
import { buildPreviewPdf } from "@/lib/pdf-preview";

export const dynamic = "force-dynamic";
// Large PDFs: fetching + building the preview can exceed the 10s default (Hobby max is 60s)
export const maxDuration = 60;

// Cookie name pattern must match verify-code route exactly
const cookieName = (magnetId: string) => `pdf_unlocked_${magnetId}`;

const MAX_SOURCE_BYTES = 100 * 1024 * 1024;

function parseFreePages(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && !isNaN(parseInt(value, 10))) return parseInt(value, 10);
  return 2;
}

/**
 * GET /api/pdf-gate/file?magnetId=<id>
 *
 * The only way the public viewer gets a locked PDF's bytes. The stored file URL
 * never reaches the browser.
 *  - Valid unlock token (cookie or X-Pdf-Unlock-Token header) → the full PDF.
 *  - Otherwise → a new PDF holding only the first `pdfFreePages` pages.
 */
export async function GET(req: NextRequest) {
  const magnetId = (req.nextUrl.searchParams.get("magnetId") || "").trim();
  if (!magnetId) {
    return NextResponse.json({ error: "Missing magnetId." }, { status: 400 });
  }

  try {
    await dbConnect();
    const pageDoc: any = await MagnetPageModel.findOne({
      $or: [
        { id: magnetId },
        ...(mongoose.Types.ObjectId.isValid(magnetId) ? [{ _id: magnetId }] : []),
      ],
    })
      .select("id pdfUrl pdfFreePages")
      .lean();

    const pdfUrl = (pageDoc?.pdfUrl || "").trim();
    if (!pageDoc || !pdfUrl) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const rawToken =
      (req.headers.get("x-pdf-unlock-token") || "").trim() ||
      req.cookies.get(cookieName(magnetId))?.value ||
      (pageDoc?.id ? req.cookies.get(cookieName(pageDoc.id))?.value : "") ||
      "";
    const payload = rawToken ? verifyPdfUnlockToken(rawToken) : null;
    const unlocked = !!(
      payload &&
      (payload.magnetId === magnetId ||
        (pageDoc?.id && payload.magnetId === pageDoc.id) ||
        !payload.magnetId)
    );

    const headers = {
      "Content-Type": "application/pdf",
      // Same URL serves preview or full depending on the token — never cache it
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    };

    if (unlocked) {
      const upstream = await fetchStoredPdf(pdfUrl, req.nextUrl.origin);
      return new NextResponse(upstream.body, {
        status: 200,
        headers: { ...headers, "X-Pdf-Access": "full" },
      });
    }

    const freePages = parseFreePages(pageDoc.pdfFreePages);
    if (freePages <= 0) {
      return NextResponse.json({ error: "Locked." }, { status: 403 });
    }

    const { bytes, pageCount } = await buildPreviewPdf(pdfUrl, freePages, async () => {
      const upstream = await fetchStoredPdf(pdfUrl, req.nextUrl.origin);
      const declared = Number(upstream.headers.get("content-length") || 0);
      if (declared > MAX_SOURCE_BYTES) {
        throw new PdfSourceError("PDF is too large to preview", 413);
      }
      const buf = await upstream.arrayBuffer();
      if (buf.byteLength > MAX_SOURCE_BYTES) {
        throw new PdfSourceError("PDF is too large to preview", 413);
      }
      return buf;
    });

    if (pageCount === 0) {
      return NextResponse.json({ error: "Locked." }, { status: 403 });
    }

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: { ...headers, "X-Pdf-Access": "preview" },
    });
  } catch (err: any) {
    if (err instanceof PdfSourceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Fail closed: never fall back to the full file
    console.error("[pdf-gate/file] Error:", err);
    return NextResponse.json({ error: "Could not load this document." }, { status: 500 });
  }
}

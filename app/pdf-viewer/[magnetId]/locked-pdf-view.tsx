import { cookies } from "next/headers";
import { FileText } from "lucide-react";
import { type MagnetPage } from "@/lib/data";
import { verifyPdfUnlockToken } from "@/lib/session-token";
import { pdfGateCopyFromAccount } from "@/lib/pdf-gate-copy";
import PdfViewerClient from "./pdf-viewer-client";

interface LockedPdfViewProps {
  /** Id the unlock cookie/token is keyed on (the URL id for /pdf-viewer, page.id elsewhere). */
  magnetId: string;
  pageDoc: any;
  accountDoc: any;
  searchParams?: { token?: string; reset?: string };
}

/**
 * Server-rendered locked PDF reader. Shared by /pdf-viewer/<id> and the branded
 * /<username>/<slug> route so both behave identically.
 */
export default async function LockedPdfView({ magnetId, pageDoc, accountDoc, searchParams }: LockedPdfViewProps) {
  // Check for signed per-subscriber access token from query param or cookie
  const cookieStore = cookies();
  const tokenFromCookie =
    cookieStore.get(`pdf_unlocked_${magnetId}`)?.value ||
    (pageDoc?.id ? cookieStore.get(`pdf_unlocked_${pageDoc.id}`)?.value : undefined);
  const tokenFromQuery = searchParams?.token;
  // ?reset=1 is the owner's "view as a new visitor" link — always start locked
  const rawToken = searchParams?.reset === "1" ? undefined : tokenFromQuery || tokenFromCookie;

  let effectivePdfPages: string[] = Array.isArray(pageDoc.pdfPages) && pageDoc.pdfPages.length > 0
    ? pageDoc.pdfPages
    : [];

  // If the subscriber has a valid unlock token with a snapshot of the pages they unlocked,
  // ensure they retain access to their original unlocked PDF version even if the owner updates the file later.
  let isUnlocked = false;
  if (rawToken) {
    const verifiedPayload = verifyPdfUnlockToken(rawToken);
    if (
      verifiedPayload &&
      (verifiedPayload.magnetId === magnetId ||
        (pageDoc?.id && verifiedPayload.magnetId === pageDoc.id) ||
        !verifiedPayload.magnetId)
    ) {
      isUnlocked = true;
      if (Array.isArray(verifiedPayload.pdfPages) && verifiedPayload.pdfPages.length > 0) {
        effectivePdfPages = verifiedPayload.pdfPages;
      }
    }
  }

  const page = pageDoc as MagnetPage;
  const businessName = accountDoc?.brandName || accountDoc?.name || "Funnels";
  const brandColor = accountDoc?.brandColor || "#0066B2";

  const pdfFreePages: number =
    typeof page.pdfFreePages === "number"
      ? page.pdfFreePages
      : typeof page.pdfFreePages === "string" && !isNaN(parseInt(page.pdfFreePages, 10))
      ? parseInt(page.pdfFreePages, 10)
      : 2;
  const pdfTitle = page.pdfTitle || page.name || "Document";
  const customFormFields = Array.isArray(page.customFormFields) ? page.customFormFields : [];

  // Server-only: the stored file URL is never sent to the browser. The viewer
  // loads bytes from /api/pdf-gate/file, which enforces the unlock gate.
  const pdfUrl = (pageDoc.pdfUrl || "").trim();
  const pdfPageCount =
    typeof pageDoc.pdfPageCount === "number" && pageDoc.pdfPageCount > 0
      ? pageDoc.pdfPageCount
      : effectivePdfPages.length;

  // Locked visitors only receive the free page images; the rest arrive from
  // /api/pdf-gate/status after a verified unlock. Blurring on the client is not a lock.
  const pageImageCount = effectivePdfPages.length;
  const sentPdfPages = isUnlocked ? effectivePdfPages : effectivePdfPages.slice(0, Math.max(0, pdfFreePages));

  // PDF pages not uploaded yet — show a setup pending screen
  if (effectivePdfPages.length === 0 && !pdfUrl) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
          gap: "1rem",
        }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400">
          <FileText className="h-8 w-8" />
        </div>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
          PDF not uploaded yet
        </h1>
        <p style={{ color: "#71717a", fontSize: "0.85rem", maxWidth: 420, margin: 0 }}>
          Go to your dashboard → edit this funnel → Landing page tab →
          upload your PDF and click <strong>&quot;Save PDF settings&quot;</strong>.
        </p>
      </div>
    );
  }

  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      {/* PDF readers are not site visitors — see components/visitor-tracker.tsx */}
      <div hidden data-visitor-tracking="off" />
      <PdfViewerClient
        magnetId={magnetId}
        pdfTitle={pdfTitle}
        pdfPages={sentPdfPages}
        pageImageCount={pageImageCount}
        pdfFreePages={pdfFreePages}
        pdfPageCount={pdfPageCount}
        hasPdfFile={Boolean(pdfUrl)}
        initiallyUnlocked={isUnlocked}
        businessName={businessName}
        brandColor={brandColor}
        gateCopy={pdfGateCopyFromAccount(accountDoc)}
        customFormFields={customFormFields}
      />
    </>
  );
}

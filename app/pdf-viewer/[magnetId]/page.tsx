import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/mongodb";
import { MagnetPageModel, AccountModel } from "@/lib/models";
import { type MagnetPage } from "@/lib/data";
import { verifyPdfUnlockToken } from "@/lib/session-token";
import PdfViewerClient from "./pdf-viewer-client";

export const dynamic = "force-dynamic";

interface Props {
  params: { magnetId: string };
  searchParams?: { token?: string };
}

export default async function PdfViewerPage({ params, searchParams }: Props) {
  const magnetId = params.magnetId;

  let pageDoc: any = null;
  let accountDoc: any = null;

  try {
    await dbConnect();

    // Try lookup by custom `id` field first, then by MongoDB _id
    pageDoc = await MagnetPageModel.findOne({ id: magnetId }).lean();

    if (!pageDoc) {
      // Fallback: try by MongoDB _id in case the id field differs
      pageDoc = await MagnetPageModel.findOne({ _id: magnetId }).lean();
    }

    if (pageDoc?.userEmail) {
      accountDoc = await AccountModel.findOne({
        email: pageDoc.userEmail.trim().toLowerCase(),
      }).lean();
    }
  } catch (err) {
    console.warn("[pdf-viewer] DB error:", err);
  }

  // If the magnet doesn't exist at all → 404
  if (!pageDoc) {
    return notFound();
  }

  // Check for signed per-subscriber access token from query param or cookie
  const cookieStore = cookies();
  const tokenFromCookie = cookieStore.get(`pdf_unlocked_${magnetId}`)?.value;
  const tokenFromQuery = searchParams?.token;
  const rawToken = tokenFromQuery || tokenFromCookie;

  let effectivePdfPages: string[] = Array.isArray(pageDoc.pdfPages) && pageDoc.pdfPages.length > 0
    ? pageDoc.pdfPages
    : [];

  // Fallback to token payload only if DB doc has no pages
  if (effectivePdfPages.length === 0 && rawToken && rawToken !== "1") {
    const verifiedPayload = verifyPdfUnlockToken(rawToken);
    if (verifiedPayload && (verifiedPayload.magnetId === magnetId || !verifiedPayload.magnetId)) {
      if (verifiedPayload.pdfPages && verifiedPayload.pdfPages.length > 0) {
        effectivePdfPages = verifiedPayload.pdfPages;
      }
    }
  }

  const page = pageDoc as MagnetPage;
  const businessName = accountDoc?.brandName || accountDoc?.name || "LeadMagnets";
  const brandColor = accountDoc?.brandColor || "#0066B2";

  const pdfFreePages: number =
    typeof page.pdfFreePages === "number"
      ? page.pdfFreePages
      : typeof page.pdfFreePages === "string" && !isNaN(parseInt(page.pdfFreePages, 10))
      ? parseInt(page.pdfFreePages, 10)
      : 2;
  const pdfTitle = page.pdfTitle || page.name || "Document";
  const customFormFields = Array.isArray(page.customFormFields) ? page.customFormFields : [];

  // PDF pages not uploaded yet — show a setup pending screen
  if (effectivePdfPages.length === 0) {
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
        <div style={{ fontSize: "2.5rem" }}>📄</div>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
          PDF not uploaded yet
        </h1>
        <p style={{ color: "#71717a", fontSize: "0.85rem", maxWidth: 420, margin: 0 }}>
          Go to your dashboard → edit this lead magnet → Landing page tab →
          upload your PDF and click <strong>&quot;Save PDF settings&quot;</strong>.
        </p>
      </div>
    );
  }

  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      <PdfViewerClient
        magnetId={magnetId}
        pdfTitle={pdfTitle}
        pdfPages={effectivePdfPages}
        pdfFreePages={pdfFreePages}
        businessName={businessName}
        brandColor={brandColor}
        customFormFields={customFormFields}
      />
    </>
  );
}

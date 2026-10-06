"use client";

/**
 * LockedPdfSetup — standalone component rendered inside the lead magnet editor
 * when template === "locked-pdf".
 *
 * SAFETY: This component is self-contained. It does NOT modify any existing
 * editor tabs or existing lead magnet functionality. It uses the same
 * Cloudinary upload endpoint (/api/upload) that the rest of the app uses.
 *
 * PDF → Images strategy:
 *   1. User selects a PDF file.
 *   2. We use pdfjs-dist (npm, no CDN) to convert each page to a JPEG blob.
 *   3. Each JPEG blob is uploaded to Cloudinary via the existing /api/upload route.
 *   4. The array of Cloudinary URLs is saved to the MagnetPage via onSave().
 *
 * This avoids any server-side binary dependencies (Ghostscript, sharp etc.)
 * and works on Vercel's free tier with zero additional configuration.
 */

import { useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Lock, Eye, Loader2, CheckCircle2, Trash2, HardDrive, FileText, Copy, ExternalLink, X, Plus } from "lucide-react";
import { loadResources } from "@/lib/store";

interface Props {
  magnetId: string;
  userEmail: string;
  pdfPages: string[];
  pdfFreePages: number;
  pdfTitle: string;
  pdfPageCount?: number;
  pdfUrl?: string;
  pageName?: string;
  pageSlug?: string;
  onSave: (updates: {
    pdfPages: string[];
    pdfFreePages: number;
    pdfTitle: string;
    pdfPageCount: number;
    pdfUrl?: string;
    name?: string;
    slug?: string;
  }) => Promise<void>;
  appUrl: string;
  hostedResources?: any[];
  onOpenAssetPicker?: () => void;
  selectedHostedPdf?: { url: string; name: string; timestamp?: number } | null;
}

// ─── PDF.js helpers (npm, worker served from /public/pdf.worker.min.mjs) ────
async function loadPdfJs(): Promise<any> {
  // Dynamic import so Next.js code-splits this large module.
  const pdfjs = await import(/* webpackChunkName: "pdfjs-dist" */ "pdfjs-dist");
  if (typeof window !== "undefined") {
    // Use same-origin local worker file from public/ to avoid browser CORS/cross-origin worker blocking
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "/pdf.worker.min.mjs",
      window.location.origin
    ).toString();
  }
  return pdfjs;
}

async function pdfPageToJpegBlob(
  pdfjs: any,
  pdfDoc: any,
  pageNum: number,
  scale = 1.2
): Promise<Blob> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 0;
        canvas.height = 0;
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed for page " + pageNum));
      },
      "image/jpeg",
      0.85
    );
  });
}

async function uploadBlob(
  blob: Blob,
  filename: string,
  userEmail: string
): Promise<string> {
  const form = new FormData();
  const file = new File([blob], filename, { type: "image/jpeg" });
  form.append("file", file);
  form.append("userEmail", userEmail);
  form.append("isPageAsset", "true");

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  if (!data?.data?.fileUrl) throw new Error("No fileUrl in upload response");
  return data.data.fileUrl as string;
}

/**
 * Fast direct-to-Cloudinary upload for the master PDF file.
 * Signs the payload server-side via /api/upload/sign to bypass Vercel's 4.5MB request limit.
 */
async function uploadPdfDirect(file: File, userEmail: string): Promise<string> {
  try {
    const signRes = await fetch("/api/upload/sign", { method: "POST" });
    if (signRes.ok) {
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: "POST",
        body: form,
      });
      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) return cloudData.secure_url;
      }
    }
  } catch (signErr) {
    console.warn("[uploadPdfDirect] Direct Cloudinary upload failed, falling back to /api/upload:", signErr);
  }

  // Fallback to /api/upload
  const form = new FormData();
  form.append("file", file);
  form.append("userEmail", userEmail);
  form.append("isPageAsset", "true");

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  if (!data?.data?.fileUrl) throw new Error("No fileUrl in upload response");
  return data.data.fileUrl as string;
}

// Cloudinary blur helper — no extra storage needed
function getBlurPreviewUrl(url: string): string {
  if (!url) return url;
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/e_blur:900,q_30/");
  }
  return url;
}

export default function LockedPdfSetup({
  magnetId,
  userEmail,
  pdfPages: initialPages,
  pdfFreePages: initialFreePages,
  pdfTitle: initialTitle,
  pdfPageCount: initialPageCount,
  pdfUrl: initialPdfUrl,
  pageName = "",
  pageSlug = "",
  onSave,
  appUrl,
  hostedResources = [],
  onOpenAssetPicker,
  selectedHostedPdf,
}: Props) {
  const [pages, setPages] = useState<string[]>(initialPages || []);
  const [pdfUrl, setPdfUrl] = useState<string>(initialPdfUrl || "");
  const [pageCount, setPageCount] = useState<number>(initialPageCount || initialPages?.length || 0);
  const [freePages, setFreePages] = useState<number>(
    Math.min(initialFreePages ?? 2, Math.max(0, (initialPageCount || (initialPages || []).length || 1) - 1))
  );
  const [pdfTitle, setPdfTitle] = useState(initialTitle || pageName || "");
  const [name, setName] = useState(pageName || initialTitle || "");
  const [slug, setSlug] = useState(pageSlug || "");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showInternalAssetModal, setShowInternalAssetModal] = useState(false);
  const [internalAssetSearch, setInternalAssetSearch] = useState("");
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenAssetPicker = () => {
    if (onOpenAssetPicker) {
      onOpenAssetPicker();
      return;
    }
    const fresh = loadResources().filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
    setAvailableAssets(fresh);
    setShowInternalAssetModal(true);
  };

  const filteredAssets = useMemo(() => {
    const list = availableAssets.length > 0 ? availableAssets : (hostedResources || []);
    const q = internalAssetSearch.trim().toLowerCase();
    return list.filter((r: any) => {
      if (r.isPageAsset === true || r.type === "page_asset" || (r.name && r.name.startsWith("page_asset_"))) {
        return false;
      }
      const isPdf =
        r.name?.toLowerCase().endsWith(".pdf") ||
        r.fileUrl?.toLowerCase().includes(".pdf") ||
        r.url?.toLowerCase().includes(".pdf") ||
        r.fileExt?.toLowerCase() === ".pdf";
      if (!isPdf) return false;
      return !q || (r.name && r.name.toLowerCase().includes(q));
    });
  }, [availableAssets, hostedResources, internalAssetSearch]);

  const effectiveAppUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : appUrl || "https://magnets.bdatech.in";
  const viewerUrl = `${effectiveAppUrl}/pdf-viewer/${magnetId}`;

  useEffect(() => {
    if (pageName) setName(pageName);
  }, [pageName]);

  useEffect(() => {
    if (pageSlug) setSlug(pageSlug);
  }, [pageSlug]);

  useEffect(() => {
    if (initialTitle) setPdfTitle(initialTitle);
  }, [initialTitle]);

  // Automatically process selected hosted PDF asset from modal
  useEffect(() => {
    if (selectedHostedPdf?.url) {
      processPdfFromUrl(selectedHostedPdf.url, selectedHostedPdf.name);
    }
  }, [selectedHostedPdf?.url, selectedHostedPdf?.timestamp]);

  async function processPdfFromUrl(url: string, title?: string) {
    setError(null);
    setProcessing(true);
    setProgress({ done: 0, total: 2 });
    const finalTitle = title || pdfTitle || "Locked PDF Document";
    setPdfTitle(finalTitle);

    try {
      const pdfjs = await loadPdfJs();

      // Resolve the best direct fileUrl first.
      let targetUrl = url;
      const matchedResource = hostedResources?.find(
        (r: any) =>
          r.url === url ||
          r.fileUrl === url ||
          r.id === url ||
          (url.includes("/r/") && r.url?.includes(url.split("/r/")[1]))
      );
      if (matchedResource?.fileUrl) {
        targetUrl = matchedResource.fileUrl;
      }

      const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(targetUrl)}&magnetId=${encodeURIComponent(magnetId)}`;
      const res = await fetch(proxyUrl);

      if (!res.ok) {
        let detail = "";
        try { detail = (await res.json()).error || ""; } catch {}
        throw new Error(`Failed to fetch PDF asset (${res.status})${detail ? ": " + detail : ""}`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("Target resource returned an HTML page instead of a valid PDF document.");
      }

      const arrayBuffer = await res.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      // Render thumbnail for page 1 for card & social preview
      setProgress({ done: 1, total: 2 });
      const thumbBlob = await pdfPageToJpegBlob(pdfjs, pdfDoc, 1, 1.2);
      const thumbFilename = `pdf-${magnetId}-thumb.jpg`;
      const thumbUrl = await uploadBlob(thumbBlob, thumbFilename, userEmail);

      setProgress({ done: 2, total: 2 });

      const pdfPagesArray = [thumbUrl, ...Array(Math.max(0, totalPages - 1)).fill(thumbUrl)];
      const computedFree = Math.min(initialFreePages ?? 2, Math.max(0, totalPages - 1));
      setPdfUrl(targetUrl);
      setPageCount(totalPages);
      setPages(pdfPagesArray);
      setFreePages(computedFree);

      // Auto-save immediately to populate parent page state & card controls
      await onSave({
        pdfUrl: targetUrl,
        pdfPages: pdfPagesArray,
        pdfFreePages: computedFree,
        pdfTitle: finalTitle,
        pdfPageCount: totalPages,
      });
      setSaved(true);
    } catch (err: any) {
      console.error("[LockedPdfSetup] Processing hosted PDF error:", err);
      setError(err.message || "Failed to process hosted PDF asset. Please try again.");
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  }

  // ── Handle PDF file selection ───────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Always reset input so same file can be re-selected
    if (e.target) (e.target as HTMLInputElement).value = "";

    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a valid PDF file.");
      return;
    }
    const MAX = 60 * 1024 * 1024; // 60 MB
    if (file.size > MAX) {
      setError("PDF must be under 60 MB.");
      return;
    }

    setError(null);
    setProcessing(true);
    setProgress({ done: 0, total: 3 });

    try {
      const pdfjs = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdfDoc.numPages;

      // Step 1: Render Page 1 thumbnail for card/dashboard preview (takes ~0.2s)
      setProgress({ done: 1, total: 3 });
      const thumbBlob = await pdfPageToJpegBlob(pdfjs, pdfDoc, 1, 1.2);
      const thumbFilename = `pdf-${magnetId}-thumb.jpg`;
      const thumbUrl = await uploadBlob(thumbBlob, thumbFilename, userEmail);

      // Step 2: Upload the master PDF directly (takes ~2s, bypasses Vercel 4.5MB limit)
      setProgress({ done: 2, total: 3 });
      const uploadedPdfUrl = await uploadPdfDirect(file, userEmail);

      setProgress({ done: 3, total: 3 });

      const finalTitle = pdfTitle || file.name.replace(/\.pdf$/i, "") || "Locked PDF Document";
      const pdfPagesArray = [thumbUrl, ...Array(Math.max(0, totalPages - 1)).fill(thumbUrl)];
      const computedFree = Math.min(freePages, Math.max(0, totalPages - 1));

      setPdfUrl(uploadedPdfUrl);
      setPageCount(totalPages);
      setPages(pdfPagesArray);
      setFreePages(computedFree);
      setPdfTitle(finalTitle);

      // Auto-save immediately to populate parent page state & card controls
      await onSave({
        pdfUrl: uploadedPdfUrl,
        pdfPages: pdfPagesArray,
        pdfFreePages: computedFree,
        pdfTitle: finalTitle,
        pdfPageCount: totalPages,
        name: name || finalTitle,
        slug: slug || undefined,
      });
      setSaved(true);
    } catch (err: any) {
      console.error("[LockedPdfSetup] Processing error:", err);
      setError(err.message || "Failed to process PDF. Please try again.");
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  }

  // ── Save settings ───────────────────────────────────────────────────────
  async function handleSave() {
    if (pages.length === 0 && !pdfUrl) {
      setError("Please upload a PDF first.");
      return;
    }
    const effectiveTotal = pageCount || pages.length;
    // Clamp freePages to safe range before saving
    const safeFreePages = Math.min(freePages, Math.max(0, effectiveTotal - 1));
    let pagesToSave = pages;
    if (effectiveTotal > pages.length && pages.length > 0) {
      pagesToSave = [pages[0], ...Array(Math.max(0, effectiveTotal - 1)).fill(pages[0])];
    }
    setSaving(true);
    setSaved(false);
    try {
      // Clear any leftover server httpOnly & localStorage unlock tokens
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(`pdf_unlock_token_${magnetId}`);
          await fetch("/api/pdf-gate/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ magnetId }),
          }).catch(() => {});
        } catch (e) {}
      }
      await onSave({
        pdfPages: pagesToSave,
        pdfFreePages: safeFreePages,
        pdfTitle: pdfTitle.trim() || name.trim(),
        name: name.trim() || pdfTitle.trim(),
        slug: slug.trim(),
        pdfPageCount: effectiveTotal,
        pdfUrl: pdfUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Remove PDF & persist to DB ──────────────────────────────────────────
  async function handleRemove() {
    if (!confirm("Remove this PDF and all uploaded pages?")) return;
    setSaving(true);
    setSaved(false);
    try {
      setPages([]);
      setPdfUrl("");
      setPageCount(0);
      setFreePages(0);
      setPdfTitle("");
      await onSave({
        pdfPages: [],
        pdfFreePages: 0,
        pdfTitle: "",
        pdfUrl: "",
        pdfPageCount: 0,
        name: name.trim(),
        slug: slug.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to remove PDF. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isDark = typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141417] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20">
          <Lock className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
              Locked PDF Setup
            </h3>
            {slug && (
              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                /{slug}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            First {freePages} page{freePages !== 1 ? "s" : ""} are free, rest unlock after email verification.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFile}
          disabled={processing}
        />

        {processing ? (
          <div className="w-full rounded-xl border-2 border-dashed border-[#0066B2]/40 bg-blue-50/20 dark:bg-[#0066B2]/10 px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-[#0066B2] dark:text-[#38BDF8] animate-spin" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {progress
                  ? `Processing page ${progress.done} of ${progress.total}…`
                  : "Loading PDF renderer…"}
              </p>
              {progress && progress.total > 0 && (
                <div className="w-full max-w-xs bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#0066B2] transition-all duration-300"
                    style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : pages.length > 0 ? (
          <div className="w-full rounded-xl border-2 border-dashed border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 transition">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {pages.length} page{pages.length !== 1 ? "s" : ""} uploaded
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs sm:max-w-md">
                    {pdfTitle || "PDF document is ready for lead generation"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Replace from Device</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAssetPicker}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs"
                >
                  <HardDrive className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                  <span>Choose from Assets</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left Half: Upload from Device */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-900/40 p-8 text-center transition-all duration-200 hover:border-[#0066B2] dark:hover:border-[#38BDF8] hover:bg-blue-50/40 dark:hover:bg-[#0066B2]/10 cursor-pointer flex flex-col items-center justify-center gap-2.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80 group-hover:scale-105 group-hover:border-[#0066B2]/40 transition-transform">
                <Upload className="h-5 w-5 text-zinc-600 dark:text-zinc-300 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">
                  Click to upload PDF from device
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[220px]">
                  Max 30 MB · Each page is converted to an image automatically
                </p>
              </div>
            </button>

            {/* Right Half: Choose from Assets */}
            <button
              type="button"
              onClick={handleOpenAssetPicker}
              className="group relative rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-900/40 p-8 text-center transition-all duration-200 hover:border-[#0066B2] dark:hover:border-[#38BDF8] hover:bg-blue-50/40 dark:hover:bg-[#0066B2]/10 cursor-pointer flex flex-col items-center justify-center gap-2.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80 group-hover:scale-105 group-hover:border-[#0066B2]/40 transition-transform">
                <HardDrive className="h-5 w-5 text-[#0066B2] dark:text-[#38BDF8] group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">
                  Choose from Assets
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[220px]">
                  Select any PDF previously uploaded to your Assets page
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium">
          ⚠️ {error}
        </p>
      )}

      {/* Settings — only shown once PDF is uploaded */}
      {pages.length > 0 && (
        <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          {/* Document Name and URL Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Document name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setPdfTitle(e.target.value);
                }}
                placeholder="e.g. 2026 Growth Playbook"
                maxLength={100}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#0066B2] dark:focus:border-[#38BDF8] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                URL slug
              </label>
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus-within:border-[#0066B2] dark:focus-within:border-[#38BDF8] transition">
                <span className="text-zinc-400 dark:text-zinc-500 mr-1 font-mono text-xs">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  placeholder="growth-playbook"
                  className="w-full bg-transparent font-mono text-xs text-zinc-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Free pages slider */}
          <div>
            {(() => {
              const effectiveTotal = pageCount || pages.length;
              return (
                <>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Free preview pages:{" "}
                    <span className="text-[#0066B2] dark:text-[#38BDF8] font-bold">{freePages}</span>
                    {" "}of {effectiveTotal}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, effectiveTotal - 1)}
                    value={Math.min(freePages, Math.max(0, effectiveTotal - 1))}
                    onChange={(e) => setFreePages(Number(e.target.value))}
                    className="w-full accent-[#0066B2]"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                    <span>0 (fully gated)</span>
                    <span>{Math.max(0, effectiveTotal - 1)} (last page locked)</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Page grid preview */}
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Preview
            </p>
            {(() => {
              const effectiveTotal = pageCount || pages.length;
              return (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {pages.slice(0, 12).map((url, i) => {
                    const isLocked = i >= freePages;
                    return (
                      <div
                        key={i}
                        className="relative aspect-[612/792] rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 animate-pulse"
                        title={`Page ${i + 1} — ${isLocked ? "locked" : "free preview"}`}
                      >
                        <img
                          src={isLocked ? getBlurPreviewUrl(url) : url}
                          alt={`Page ${i + 1}`}
                          className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                          onLoad={(e) => {
                            e.currentTarget.classList.remove("opacity-0");
                            e.currentTarget.parentElement?.classList.remove("animate-pulse");
                          }}
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute bottom-0.5 inset-x-0 flex items-center justify-center">
                          {isLocked ? (
                            <Lock className="h-2.5 w-2.5 text-white drop-shadow" />
                          ) : (
                            <Eye className="h-2.5 w-2.5 text-white drop-shadow" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {pages.length === 1 && effectiveTotal > 1 && (
                    <div
                      className="relative aspect-[612/792] rounded overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-center p-1.5"
                      title="Page 2 preview"
                    >
                      <div className="text-[10px] font-bold text-zinc-500 mb-1">Page 2</div>
                      <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        {1 >= freePages ? <Lock className="h-3 w-3 text-amber-500" /> : <Eye className="h-3 w-3 text-emerald-500" />}
                      </div>
                    </div>
                  )}
                  {effectiveTotal > (pages.length === 1 ? 2 : 12) && (
                    <div className="aspect-[612/792] rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[11px] text-zinc-500 font-semibold">
                      +{effectiveTotal - (pages.length === 1 ? 2 : 12)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Viewer URL */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Public Viewer URL
                </span>
              </div>
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                OTP Protected
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-amber-600 dark:text-amber-400 overflow-hidden shadow-xs">
                <span className="truncate select-all flex-1">{viewerUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewerUrl);
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-amber-500 transition-colors shrink-0 cursor-pointer"
                  title="Copy Viewer URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <a
                href={`${viewerUrl}?reset=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <span>Open Viewer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Save + Remove */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || pages.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] text-white text-xs font-bold px-5 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
          ) : (
            "Save PDF settings"
          )}
        </button>
        {pages.length > 0 && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 transition disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {saving ? "Removing…" : "Remove PDF"}
          </button>
        )}
      </div>

      {/* Internal Asset Picker Modal rendered via Portal at root body */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showInternalAssetModal && (
            <motion.div
              key="asset-picker-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden overscroll-contain touch-none"
              onClick={() => setShowInternalAssetModal(false)}
            >
              <motion.div
                key="asset-picker-sheet"
                initial={{ opacity: 0, y: 120 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 120 }}
                transition={{ type: "spring", damping: 30, stiffness: 360, mass: 0.8 }}
                className="w-full max-w-xl sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border-t sm:border border-zinc-200/80 bg-white dark:border-[#27272A] dark:bg-[#18181B] p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[88vh] overflow-y-auto scrollbar-thin pb-8 sm:pb-6 mt-auto sm:mt-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Bottom Sheet Grab Handle */}
                <div className="sm:hidden flex justify-center pb-1 -mt-1">
                  <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
                </div>

                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                      <HardDrive className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        Choose from Hosted Assets
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInternalAssetModal(false)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search hosted PDF assets by name..."
                    value={internalAssetSearch}
                    onChange={(e) => setInternalAssetSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#121216] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2]"
                  />
                </div>

                {/* Asset List */}
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {filteredAssets.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-xs text-zinc-400 italic">
                        {internalAssetSearch.trim()
                          ? `No PDF assets match "${internalAssetSearch}"`
                          : "No PDF assets found in your Assets page."}
                      </p>
                      <Link
                        href="/dashboard/assets"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005291] transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Upload to Assets Page</span>
                      </Link>
                    </div>
                  ) : (
                    filteredAssets.map((asset: any) => {
                      return (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#121216] hover:bg-zinc-100 dark:hover:bg-[#1C1C22] transition"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/20 bg-[#0066B2]/[0.08] text-[#0066B2] dark:border-[#38BDF8]/20 dark:bg-[#38BDF8]/10 dark:text-[#38BDF8] shadow-2xs">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{asset.name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono truncate">{asset.fileUrl || asset.url}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setShowInternalAssetModal(false);
                              processPdfFromUrl(asset.fileUrl || asset.url, asset.name);
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#005291] transition shrink-0 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Use this PDF</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    href="/dashboard/assets"
                    target="_blank"
                    className="text-xs text-[#0066B2] dark:text-[#38BDF8] font-bold hover:underline"
                  >
                    Go to Assets Page →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowInternalAssetModal(false)}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

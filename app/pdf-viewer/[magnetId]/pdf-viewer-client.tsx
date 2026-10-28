"use client";

// Adobe Acrobat PDF Viewer Client — Updated 2026

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronUp,
  ChevronDown,
  Lock,
  Menu,
} from "lucide-react";
import { getScrollParent, loadPdfJs } from "@/lib/pdfjs-client";
import PdfPageThumbnail from "@/components/pdf/PdfPageThumbnail";
import "./pdf-viewer.css";

// ─── Unlock token saved by an earlier visit (or passed as ?token=) ────────────
function readStoredUnlockToken(magnetId: string): string {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") return "";
    return params.get("token") || localStorage.getItem(`pdf_unlock_token_${magnetId}`) || "";
  } catch {
    return "";
  }
}

// ─── Locked page placeholder (no real page content is ever loaded) ───────────
function LockedPageOverlay({ pageNum }: { pageNum: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      {/* Blurred document skeleton lines */}
      <div
        style={{
          position: "absolute",
          inset: 24,
          opacity: 0.15,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          filter: "blur(2px)",
        }}
      >
        <div style={{ height: 28, width: "65%", background: "#000", borderRadius: 4 }} />
        <div style={{ height: 14, width: "95%", background: "#000", borderRadius: 4 }} />
        <div style={{ height: 14, width: "90%", background: "#000", borderRadius: 4 }} />
        <div style={{ height: 14, width: "92%", background: "#000", borderRadius: 4 }} />
        <div style={{ height: 180, width: "100%", background: "#000", borderRadius: 6, marginTop: 12 }} />
        <div style={{ height: 14, width: "88%", background: "#000", borderRadius: 4 }} />
        <div style={{ height: 14, width: "85%", background: "#000", borderRadius: 4 }} />
      </div>

      {/* Frosted lock badge */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          color: "#fff",
          padding: "18px 32px",
          borderRadius: "16px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={22} color="#f59e0b" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
          Page {pageNum} is Locked
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, maxWidth: 220 }}>
          Verify your details below to unlock all pages.
        </div>
      </div>
    </div>
  );
}

// ─── High-performance On-Demand Canvas Renderer ───────────────────────────────
function PdfPageCanvas({
  pdfDoc,
  pageNum,
  rotation,
  isLocked,
  zoomScale,
}: {
  pdfDoc: any;
  pageNum: number;
  rotation: number;
  isLocked: boolean;
  zoomScale: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(612 / 792);

  // Render pages near the viewport and free the canvas of pages far away, so
  // long documents don't hold hundreds of full-size bitmaps in memory.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setIsVisible(e.isIntersecting));
      },
      { root: getScrollParent(el), rootMargin: "1200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setRendered(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!pdfDoc || !isVisible || isLocked || pageNum > pdfDoc.numPages) return;
    let cancel = false;
    let renderTask: any = null;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (cancel) return;
        const base = page.getViewport({ scale: 1, rotation });
        setAspectRatio(base.width / base.height);

        // Match the on-screen size (zoom included) × screen density so text stays crisp
        const displayWidth = containerRef.current?.clientWidth || 860;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: (displayWidth * dpr) / base.width, rotation });

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        if (!cancel) setRendered(true);
      } catch (e: any) {
        if (e?.name !== "RenderingCancelledException") {
          console.warn(`[PdfViewer] Error rendering page ${pageNum}:`, e);
        }
      }
    }

    // Debounce so dragging through zoom levels doesn't re-render every step
    const timer = setTimeout(renderPage, canvasRef.current?.width ? 150 : 0);
    return () => {
      cancel = true;
      clearTimeout(timer);
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, pageNum, rotation, isVisible, isLocked, zoomScale]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${aspectRatio}`,
        background: "#ffffff",
        borderRadius: "4px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      {!isLocked && !rendered && (
        <div className="absolute inset-0 animate-pulse bg-zinc-200" aria-hidden="true" />
      )}
      {isLocked ? (
        <LockedPageOverlay pageNum={pageNum} />
      ) : (
        <canvas
          ref={canvasRef}
          className="adobe-page-img"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            opacity: rendered ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        />
      )}
    </div>
  );
}

interface Props {
  magnetId: string;
  pdfTitle: string;
  pdfPages: string[];
  /** Total page images; locked visitors only receive the first pdfFreePages URLs */
  pageImageCount?: number;
  pdfFreePages: number;
  pdfPageCount?: number;
  /** Magnet has a stored PDF file; bytes come from /api/pdf-gate/file, never a raw URL */
  hasPdfFile?: boolean;
  /** Server already verified an unlock cookie for this visitor */
  initiallyUnlocked?: boolean;
  businessName: string;
  brandColor: string;
  customFormFields?: import("@/lib/data").CustomFormField[];
}

export default function PdfViewerClient({
  magnetId,
  pdfTitle,
  pdfPages: initialPdfPages,
  pageImageCount,
  pdfFreePages,
  pdfPageCount,
  hasPdfFile = false,
  initiallyUnlocked = false,
  businessName,
  brandColor,
  customFormFields = [],
}: Props) {
  const isStreamingPdf = hasPdfFile;
  // Starts with only the free pages; the rest arrive after a verified unlock
  const [pdfPages, setPdfPages] = useState<string[]>(initialPdfPages);
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  // Whether the loaded document is the full file or the free-pages preview
  const [pdfDocIsFull, setPdfDocIsFull] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(isStreamingPdf);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  // Bumped by the "Try again" button to re-run the document load
  const [loadAttempt, setLoadAttempt] = useState(0);
  // Read before the first file request so it carries the visitor's token
  const unlockTokenRef = useRef<string | null>(null);
  if (unlockTokenRef.current === null) unlockTokenRef.current = readStoredUnlockToken(magnetId);
  const pdfDocRef = useRef<any>(null);

  // A preview document only holds the free pages, so the real total comes from the server
  const totalPages = isStreamingPdf
    ? (pdfDoc && pdfDocIsFull ? pdfDoc.numPages : (pdfPageCount || pdfDoc?.numPages || pdfPages.length || 1))
    : Math.max(pdfPages.length, pageImageCount || 0);

  // Load the preview while locked, then the full file once unlocked. The server
  // decides which one to send based on the unlock token.
  useEffect(() => {
    if (!isStreamingPdf) return;
    if (!unlocked && pdfFreePages <= 0) {
      // Nothing is free to show; don't request anything until unlocked
      setLoadingPdf(false);
      return;
    }
    let cancel = false;
    let loadingTask: any = null;
    const wantFull = unlocked;

    async function initPdf() {
      try {
        setPdfLoadError(null);
        // Keep showing the preview while the full file loads
        if (!pdfDocRef.current) setLoadingPdf(true);
        const pdfjs = await loadPdfJs();
        if (cancel) return;

        const fileUrl = `/api/pdf-gate/file?magnetId=${encodeURIComponent(magnetId)}&v=${wantFull ? "full" : "preview"}`;
        // Retry transient failures (cold starts, dropped connections) before giving up
        const MAX_ATTEMPTS = 3;
        let doc: any = null;
        for (let attempt = 1; ; attempt++) {
          loadingTask = pdfjs.getDocument({
            url: fileUrl,
            httpHeaders: unlockTokenRef.current ? { "X-Pdf-Unlock-Token": unlockTokenRef.current } : undefined,
            rangeChunkSize: 65536,
          });
          try {
            doc = await loadingTask.promise;
            break;
          } catch (err) {
            if (cancel || attempt >= MAX_ATTEMPTS) throw err;
            console.warn(`[pdf-viewer] Load attempt ${attempt} failed, retrying:`, err);
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            if (cancel) return;
          }
        }

        if (!cancel) {
          const previous = pdfDocRef.current;
          pdfDocRef.current = doc;
          setPdfDoc(doc);
          setPdfDocIsFull(wantFull);
          // Let pages still drawing from the preview finish before freeing it
          if (previous && previous !== doc) setTimeout(() => previous.destroy?.(), 5000);
          setLoadingPdf(false);
        }
      } catch (err: any) {
        if (!cancel) {
          console.warn("[pdf-viewer] Failed to load PDF:", err);
          setPdfLoadError("We couldn't load this document.");
          setLoadingPdf(false);
        }
      }
    }

    initPdf();
    return () => {
      cancel = true;
      loadingTask?.destroy?.();
    };
  }, [isStreamingPdf, magnetId, unlocked, pdfFreePages, loadAttempt]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoomScale, setZoomScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [gateVisible, setGateVisible] = useState(false);

  // Gate form state
  const [step, setStep] = useState<"email" | "code">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [hint, setHint] = useState<{ msg: string; isError: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Refs for IntersectionObserver
  const docRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const visibleLocked = useRef<Set<number>>(new Set());

  // ── Track view analytics beacon ───────────────────────────────────────────
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (magnetId && typeof window !== "undefined" && !hasTrackedView.current) {
      hasTrackedView.current = true;
      const payload = JSON.stringify({ pageId: magnetId, isOwner: false });
      let sent = false;
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          sent = navigator.sendBeacon("/api/track-view", blob);
        } catch (_) {}
      }
      if (!sent) {
        fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(console.error);
      }
    }
  }, [magnetId]);

  // ── Disable Lenis smooth scroll while PDF viewer is open ───────────────────
  useEffect(() => {
    const stopLenis = () => {
      const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
      if (lenis && typeof lenis.stop === "function") {
        lenis.stop();
      }
    };
    stopLenis();
    const timer1 = setTimeout(stopLenis, 100);
    const timer2 = setTimeout(stopLenis, 400);
    const timer3 = setTimeout(stopLenis, 1000);
    const timer4 = setTimeout(stopLenis, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
      if (lenis && typeof lenis.start === "function") {
        lenis.start();
      }
    };
  }, []);

  // ── Handle Ctrl + Wheel / Trackpad pinch for smooth zooming ────────────────
  useEffect(() => {
    const viewportEl = docRef.current;
    if (!viewportEl) return;

    let accumulatedDelta = 0;
    let animFrameId: number | null = null;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        accumulatedDelta += e.deltaY;

        if (animFrameId === null) {
          animFrameId = requestAnimationFrame(() => {
            const step = Math.sign(accumulatedDelta) * Math.min(25, Math.max(5, Math.abs(Math.round(accumulatedDelta * 0.08))));
            if (accumulatedDelta < 0) {
              setZoomScale((z) => Math.min(200, z + Math.abs(step)));
            } else if (accumulatedDelta > 0) {
              setZoomScale((z) => Math.max(50, z - Math.abs(step)));
            }
            accumulatedDelta = 0;
            animFrameId = null;
          });
        }
      }
    };

    viewportEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewportEl.removeEventListener("wheel", handleWheel);
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
    };
  }, []);

  // ── Check unlock status on mount ──────────────────────────────────────────
  useEffect(() => {
    let localToken = "";
    let isReset = false;
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        isReset = urlParams.get("reset") === "1";
        if (isReset) {
          localStorage.removeItem(`pdf_unlock_token_${magnetId}`);
          // Remove ?reset=1 from the URL bar immediately so subsequent page refreshes do not re-wipe the session
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("reset");
          window.history.replaceState({}, "", cleanUrl.pathname + (cleanUrl.searchParams.toString() ? `?${cleanUrl.searchParams.toString()}` : "") + cleanUrl.hash);
        } else {
          // Same source as the first file request: ?token= first, then the saved token
          localToken = readStoredUnlockToken(magnetId);
          unlockTokenRef.current = localToken;
        }
      } catch (e) {}
    }

    const statusUrl = `/api/pdf-gate/status?magnetId=${encodeURIComponent(magnetId)}${
      isReset ? "&reset=1" : localToken ? `&token=${encodeURIComponent(localToken)}` : ""
    }`;

    fetch(statusUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.unlocked) {
          performUnlock(data.pdfPages);
        } else {
          // e.g. ?reset=1 or an expired token: drop back to the preview
          setUnlocked(false);
          if (pdfFreePages === 0) setGateVisible(true);
        }
      })
      .catch(() => {
        if (pdfFreePages === 0) setGateVisible(true);
      });

    if (typeof window !== "undefined" && window.innerWidth <= 760) {
      setSidebarOpen(false);
    }
  }, [magnetId, pdfFreePages]);

  // ── Update gate visibility ─────────────────────────────────────────────────
  const updateGate = useCallback(() => {
    if (unlocked) {
      setGateVisible(false);
      return;
    }
    const shouldShow = visibleLocked.current.size > 0 || pdfFreePages === 0;
    setGateVisible(shouldShow);
  }, [unlocked, pdfFreePages]);

  // ── IntersectionObserver: page counter + gate trigger ────────────────────
  useEffect(() => {
    if (!docRef.current) return;

    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = Number((e.target as HTMLElement).dataset.pageIndex);
          setCurrentPage(idx + 1);
          thumbRefs.current.forEach((t, i) => {
            if (t) t.dataset.active = String(i === idx);
          });
        });
      },
      { root: docRef.current, rootMargin: "-45% 0px -45% 0px" }
    );

    visibleLocked.current.clear();

    const gateObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).dataset.pageIndex);
          const isLocked = !unlocked && idx >= pdfFreePages;
          if (isLocked && e.isIntersecting) {
            visibleLocked.current.add(idx);
          } else {
            visibleLocked.current.delete(idx);
          }
        });
        updateGate();
      },
      { root: docRef.current, threshold: 0.15 }
    );

    pageRefs.current.forEach((el) => {
      if (el) {
        counterObs.observe(el);
        gateObs.observe(el);
      }
    });

    return () => {
      counterObs.disconnect();
      gateObs.disconnect();
    };
  }, [pdfFreePages, sidebarOpen, updateGate, totalPages, loadingPdf]);

  // ── Auto-scroll thumbnail sidebar when current page changes ───────────────
  useEffect(() => {
    if (sidebarOpen) {
      const activeThumb = thumbRefs.current[currentPage - 1];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentPage, sidebarOpen]);

  // ── Unlock all pages ──────────────────────────────────────────────────────
  const performUnlock = useCallback((unlockedPages?: string[]) => {
    if (Array.isArray(unlockedPages) && unlockedPages.length > 0) {
      setPdfPages(unlockedPages);
    }
    setUnlocked(true);
    setGateVisible(false);
    visibleLocked.current.clear();
  }, []);

  // ── Gate: send code ───────────────────────────────────────────────────────
  const handleSendCode = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!name.trim()) {
        setHint({ msg: "Please enter your name.", isError: true });
        return;
      }
      if (!email.trim()) {
        setHint({ msg: "Please enter your email address.", isError: true });
        return;
      }
      setSending(true);
      setHint(null);
      try {
        const res = await fetch("/api/pdf-gate/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            magnetId,
            name: name.trim(),
            customFields: customAnswers,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setHint({ msg: data.error || "Failed to send code.", isError: true });
          return;
        }
        setToken(data.token);
        setStep("code");
        setHint({
          msg: `Code sent to ${email.trim()}. Check spam if it doesn't arrive in a minute.`,
          isError: false,
        });
      } catch {
        setHint({ msg: "Network error. Please try again.", isError: true });
      } finally {
        setSending(false);
      }
    },
    [email, magnetId, name, customAnswers]
  );

  // ── Gate: verify code ─────────────────────────────────────────────────────
  const handleVerifyCode = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!code.trim() || !token) {
        setHint({ msg: "Please enter the 6-digit code.", isError: true });
        return;
      }
      setVerifying(true);
      setHint(null);
      try {
        const res = await fetch("/api/pdf-gate/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            code: code.trim(),
            token,
            magnetId,
            name: name.trim(),
            customFields: customAnswers,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setHint({ msg: data.error || "Incorrect code.", isError: true });
          if (/expired/i.test(data.error || "")) {
            setStep("email");
            setToken(null);
            setCode("");
          }
          return;
        }
        if (data.unlockToken && typeof window !== "undefined") {
          try {
            localStorage.setItem(`pdf_unlock_token_${magnetId}`, data.unlockToken);
            const cleanUrl = new URL(window.location.href);
            if (cleanUrl.searchParams.has("reset")) {
              cleanUrl.searchParams.delete("reset");
              window.history.replaceState({}, "", cleanUrl.pathname + (cleanUrl.searchParams.toString() ? `?${cleanUrl.searchParams.toString()}` : "") + cleanUrl.hash);
            }
          } catch (e) {}
        }
        if (data.unlockToken) unlockTokenRef.current = data.unlockToken;
        performUnlock(data.pdfPages);
      } catch {
        setHint({ msg: "Network error. Please try again.", isError: true });
      } finally {
        setVerifying(false);
      }
    },
    [code, email, magnetId, name, token, customAnswers, performUnlock]
  );

  const scrollToPage = (idx: number) => {
    const el = pageRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };



  return (
    <div className="adobe-viewer-root" data-lenis-prevent>
      {/* ── Top Header Toolbar ────────────────────────────────────────────── */}
      <header className="adobe-bar">
        <div className="adobe-bar-left">
          <div className="adobe-logo-badge">
            <div className="adobe-pdf-icon">PDF</div>
            <span className="adobe-bar-title" title={pdfTitle}>
              {pdfTitle}
            </span>
          </div>

          <button
            className="adobe-icon-btn"
            title="Toggle Navigation Sidebar"
            aria-pressed={sidebarOpen}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <Menu size={18} />
          </button>

          <div className="adobe-divider" />

          <button
            className="adobe-icon-btn"
            title="Previous Page"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(Math.max(0, currentPage - 2))}
          >
            <ChevronUp size={18} />
          </button>

          <div className="adobe-page-counter">
            <input
              type="number"
              min={1}
              max={totalPages}
              className="adobe-page-input"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= totalPages) {
                  scrollToPage(val - 1);
                }
              }}
            />
            <span>/ {totalPages}</span>
          </div>

          <button
            className="adobe-icon-btn"
            title="Next Page"
            disabled={currentPage >= totalPages}
            onClick={() => scrollToPage(Math.min(totalPages - 1, currentPage))}
          >
            <ChevronDown size={18} />
          </button>
        </div>

        <div className="adobe-bar-center">
          <button
            className="adobe-icon-btn"
            title="Zoom Out"
            disabled={zoomScale <= 50}
            onClick={() => {
              const levels = [50, 75, 100, 125, 150, 200];
              const prev = [...levels].reverse().find((lvl) => lvl < zoomScale) || Math.max(50, zoomScale - 25);
              setZoomScale(prev);
            }}
          >
            <ZoomOut size={16} />
          </button>

          <select
            className="adobe-zoom-select"
            value={zoomScale}
            onChange={(e) => setZoomScale(Number(e.target.value))}
          >
            {![50, 75, 100, 125, 150, 200].includes(zoomScale) && (
              <option value={zoomScale}>{zoomScale}%</option>
            )}
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
            <option value={200}>200%</option>
          </select>

          <button
            className="adobe-icon-btn"
            title="Zoom In"
            disabled={zoomScale >= 200}
            onClick={() => {
              const levels = [50, 75, 100, 125, 150, 200];
              const next = levels.find((lvl) => lvl > zoomScale) || Math.min(200, zoomScale + 25);
              setZoomScale(next);
            }}
          >
            <ZoomIn size={16} />
          </button>

          <div className="adobe-divider" />

          <button
            className="adobe-icon-btn"
            title="Rotate Clockwise"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            <RotateCw size={16} />
          </button>
        </div>

        <div className="adobe-bar-right" />
      </header>

      {/* ── Main Workspace ──────────────────────────────────────────────────── */}
      <div className="adobe-main-layout">
        {/* Left Navigation Sidebar */}
        {sidebarOpen && (
          <aside className="adobe-sidebar-wrapper" ref={sideRef as any}>
            <div className="adobe-thumb-panel">
              <div className="adobe-thumb-header">Page Thumbnails</div>
              <div className="adobe-thumb-list" data-lenis-prevent>
                {Array.from({ length: totalPages }, (_, idx) => {
                  const isLocked = !unlocked && idx >= pdfFreePages;
                  // Legacy image-only magnets have one stored image per page
                  const displayUrl = isStreamingPdf ? null : pdfPages[idx];
                  return (
                    <button
                      key={idx}
                      ref={(el) => {
                        thumbRefs.current[idx] = el;
                      }}
                      className={`adobe-thumb-card ${isLocked ? "is-locked" : ""}`}
                      data-active={currentPage === idx + 1}
                      onClick={() => scrollToPage(idx)}
                    >
                      <div className="adobe-thumb-frame">
                        {isLocked ? (
                          <div className="w-full aspect-[612/792] bg-zinc-100 flex items-center justify-center">
                            <Lock size={14} className="text-amber-500" />
                          </div>
                        ) : isStreamingPdf ? (
                          // Drawn from the loaded PDF: the free preview while locked,
                          // the full document once unlocked
                          <PdfPageThumbnail pdfDoc={pdfDoc} pageNum={idx + 1} width={170} rotation={rotation} />
                        ) : displayUrl ? (
                          <img
                            src={displayUrl}
                            alt={`Thumbnail page ${idx + 1}`}
                            className="adobe-thumb-img"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-500">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <span className="adobe-thumb-num">{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Document View Canvas */}
        <main className="adobe-doc-viewport" ref={docRef} data-lenis-prevent>
          {pdfLoadError && (isStreamingPdf ? !pdfDoc : pdfPages.length === 0) ? (
            <div className="mx-auto my-24 flex max-w-md flex-col items-center gap-3 rounded-lg bg-red-500/10 px-6 py-5 text-center text-sm text-red-300">
              <p>{pdfLoadError}</p>
              <button
                type="button"
                onClick={() => setLoadAttempt((n) => n + 1)}
                className="rounded-md bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Try again
              </button>
            </div>
          ) : loadingPdf ? (
            <div className="flex flex-col items-center justify-center py-36 text-white gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-sm font-medium opacity-80">Streaming document…</p>
            </div>
          ) : isStreamingPdf && pdfDoc ? (
            Array.from({ length: totalPages }, (_, idx) => {
              const isLocked = !unlocked && idx >= pdfFreePages;
              const computedWidth = Math.round(860 * (zoomScale / 100));

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    pageRefs.current[idx] = el;
                  }}
                  data-page-index={idx}
                  className={`adobe-page-wrapper ${isLocked ? "is-locked" : ""}`}
                  style={{
                    width: `${computedWidth}px`,
                    maxWidth: zoomScale === 100 ? "min(860px, 92vw)" : undefined,
                    // No CSS rotate here: PdfPageCanvas already renders with `rotation`
                  }}
                >
                  <PdfPageCanvas
                    pdfDoc={pdfDoc}
                    pageNum={idx + 1}
                    rotation={rotation}
                    isLocked={isLocked}
                    zoomScale={zoomScale}
                  />
                </div>
              );
            })
          ) : (
            Array.from({ length: totalPages }, (_, idx) => {
              const isLocked = !unlocked && idx >= pdfFreePages;
              const url = pdfPages[idx];
              const computedWidth = Math.round(860 * (zoomScale / 100));

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    pageRefs.current[idx] = el;
                  }}
                  data-page-index={idx}
                  className={`adobe-page-wrapper ${isLocked ? "is-locked" : ""}`}
                  style={{
                    width: `${computedWidth}px`,
                    maxWidth: zoomScale === 100 ? "min(860px, 92vw)" : undefined,
                    ...(rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : {}),
                  }}
                >
                  {isLocked || !url ? (
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: `${612 / 792}`,
                        background: "#ffffff",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      {isLocked && <LockedPageOverlay pageNum={idx + 1} />}
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`Document Page ${idx + 1}`}
                      className="adobe-page-img"
                      loading={idx < 3 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                    />
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* ── Gate Modal Overlay ──────────────────────────────────────────────── */}
      <div className={`pdf-gate ${gateVisible ? "is-visible" : "is-hidden"}`}>
        <div className="pdf-gate-card" data-lenis-prevent>
          <div className="pdf-brand-bar">
            <span className="pdf-brand-dot" style={{ background: brandColor }} />
            <span style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>
              {businessName}
            </span>
          </div>

          {step === "email" ? (
            <>
              <h2>
                {pdfFreePages === 0
                  ? "Enter your details to read this guide."
                  : `You've read the preview. Enter your details to unlock all ${totalPages} pages.`}
              </h2>
              <p className="sub">Free — no credit card required.</p>
              <form className="pdf-gate-form" onSubmit={handleSendCode}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <div className="pdf-gate-row">
                    <input
                      id="pdf-gate-name"
                      className="pdf-gate-input"
                      type="text"
                      placeholder="Your name *"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={sending}
                    />
                    <input
                      id="pdf-gate-email"
                      className="pdf-gate-input"
                      type="email"
                      placeholder="Your email address *"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sending}
                    />
                  </div>

                  {customFormFields && customFormFields.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
                      {customFormFields.map((field) => (
                        <div key={field.id} style={{ textAlign: "left" }}>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#666", marginBottom: "3px" }}>
                            {field.label} {field.required ? "*" : ""}
                          </label>
                          {field.type === "select" ? (
                            <select
                              className="pdf-gate-input"
                              style={{ fontSize: "14px", padding: "10px 12px" }}
                              required={field.required}
                              value={customAnswers[field.label] || customAnswers[field.id] || ""}
                              onChange={(e) =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.label || field.id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">{field.placeholder || "Select option..."}</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "textarea" ? (
                            <textarea
                              className="pdf-gate-input"
                              style={{ fontSize: "14px", padding: "10px 12px" }}
                              rows={2}
                              placeholder={field.placeholder || field.label}
                              required={field.required}
                              value={customAnswers[field.label] || customAnswers[field.id] || ""}
                              onChange={(e) =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.label || field.id]: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              className="pdf-gate-input"
                              style={{ fontSize: "14px", padding: "10px 12px" }}
                              placeholder={field.placeholder || field.label}
                              required={field.required}
                              value={customAnswers[field.label] || customAnswers[field.id] || ""}
                              onChange={(e) =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.label || field.id]: e.target.value,
                                }))
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="pdf-gate-btn"
                    disabled={sending}
                    style={{ background: brandColor, marginTop: "4px" }}
                  >
                    {sending ? "Sending code…" : "Send code →"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2>Enter the 6-digit code we just sent you.</h2>
              <p className="sub">Check your spam folder if it isn't there in a minute.</p>
              <form className="pdf-gate-form" onSubmit={handleVerifyCode}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  className="pdf-gate-input is-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={verifying}
                />
                <button
                  type="submit"
                  className="pdf-gate-btn"
                  disabled={verifying}
                  style={{ background: brandColor, marginTop: "10px" }}
                >
                  {verifying ? "Verifying…" : "Unlock guide →"}
                </button>
              </form>
              <p className="pdf-gate-hint" style={{ marginTop: "14px", textAlign: "center" }}>
                Didn't receive it?{" "}
                <button
                  type="button"
                  className="pdf-gate-link"
                  disabled={sending}
                  onClick={() => handleSendCode()}
                >
                  Resend code
                </button>
              </p>
            </>
          )}

          {hint && (
            <p className={`pdf-gate-hint ${hint.isError ? "is-error" : ""}`}>
              {hint.msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

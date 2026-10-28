"use client";

import { useEffect, useRef, useState } from "react";
import { getScrollParent, withRenderSlot } from "@/lib/pdfjs-client";

interface Props {
  /** A loaded pdf.js document */
  pdfDoc: any;
  /** 1-based page number */
  pageNum: number;
  /** Displayed width in CSS pixels; the canvas is rendered at this × devicePixelRatio */
  width: number;
  rotation?: number;
  className?: string;
}

/**
 * Lazily renders one PDF page into a small canvas once it scrolls near view.
 * Pages missing from `pdfDoc` (e.g. not in the free preview) stay as a skeleton.
 */
export default function PdfPageThumbnail({ pdfDoc, pageNum, width, rotation = 0, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(612 / 792);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { root: getScrollParent(el), rootMargin: "300px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setRendered(false);
    if (!pdfDoc || !isVisible || pageNum > pdfDoc.numPages) return;
    let cancel = false;
    let renderTask: any = null;

    withRenderSlot(async () => {
      if (cancel) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (cancel) return;
        const base = page.getViewport({ scale: 1, rotation });
        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const viewport = page.getViewport({ scale: (width * dpr) / base.width, rotation });
        setAspectRatio(base.width / base.height);

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
          console.warn(`[PdfPageThumbnail] Error rendering page ${pageNum}:`, e);
        }
      }
    });

    return () => {
      cancel = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNum, rotation, width, isVisible]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio: `${aspectRatio}`, background: "#ffffff" }}
    >
      {!rendered && <div className="absolute inset-0 animate-pulse bg-zinc-200" aria-hidden="true" />}
      <canvas
        ref={canvasRef}
        aria-label={`Page ${pageNum}`}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          opacity: rendered ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
      />
    </div>
  );
}

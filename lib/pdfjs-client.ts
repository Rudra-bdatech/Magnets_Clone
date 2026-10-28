"use client";

// ─── PDF.js loader (npm, worker served from /public/pdf.worker.min.mjs) ──────
export async function loadPdfJs(): Promise<any> {
  // Dynamic import so Next.js code-splits this large module.
  const pdfjs = await import(/* webpackChunkName: "pdfjs-dist" */ "pdfjs-dist");
  if (typeof window !== "undefined") {
    // Same-origin worker avoids cross-origin worker blocking
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "/pdf.worker.min.mjs",
      window.location.origin
    ).toString();
  }
  return pdfjs;
}

// IntersectionObserver's rootMargin only stretches its root, so pages inside a
// scrolling panel must observe against that panel to pre-render ahead of view.
export function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement || null;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

// ─── Render queue: limits concurrent page renders so big PDFs stay smooth ────
const MAX_CONCURRENT_RENDERS = 3;
const SLOT_TIMEOUT_MS = 8000;
let activeRenders = 0;
const waiting: (() => void)[] = [];

export async function withRenderSlot<T>(job: () => Promise<T>): Promise<T> {
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    // The finishing job hands its slot straight to us, so the count stays put
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    activeRenders++;
  }
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const next = waiting.shift();
    if (next) next();
    else activeRenders--;
  };
  // A render on a document destroyed mid-flight can stay pending forever; don't
  // let it hold a slot and freeze every other thumbnail.
  const watchdog = setTimeout(release, SLOT_TIMEOUT_MS);
  try {
    return await job();
  } finally {
    clearTimeout(watchdog);
    release();
  }
}

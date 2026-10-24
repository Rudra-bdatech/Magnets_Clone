"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-in-view";

const WORDS = ["PDFs", "Guides",];

// Words are stacked in one grid cell. Once measured, the slot's width animates to the
// current word so the headline never has a gap. The first word is server-rendered (LCP safe).
export default function WordRotator() {
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState<number[] | null>(null);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const measure = () => setWidths(refs.current.map((el) => el?.offsetWidth ?? 0));
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2400);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <span
      className="relative inline-grid justify-items-start align-bottom overflow-hidden pb-[0.12em] -mb-[0.12em] transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
      style={widths ? { width: widths[index] } : undefined}
    >
      <span className="sr-only">free resources</span>
      {WORDS.map((word, i) => {
        const offset = (i - index + WORDS.length) % WORDS.length;
        const state = offset === 0 ? "active" : offset === WORDS.length - 1 ? "leaving" : "waiting";
        return (
          <span
            key={word}
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-hidden="true"
            className="col-start-1 row-start-1 whitespace-nowrap text-[#0066B2] dark:text-[#38BDF8] transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{
              transform: state === "active" ? "translateY(0)" : state === "leaving" ? "translateY(-105%)" : "translateY(105%)",
              opacity: state === "active" ? 1 : 0,
              transitionDuration: state === "waiting" ? "0ms" : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
      {/* Hand-drawn underline, redrawn each time the word changes */}
      <svg
        key={index}
        aria-hidden="true"
        viewBox="0 0 300 14"
        preserveAspectRatio="none"
        className="lm-underline pointer-events-none absolute left-0 right-0 bottom-0 h-[0.16em] w-full text-[#0066B2]/45 dark:text-[#38BDF8]/50"
      >
        <path d="M3 9.5C60 4 140 2.5 297 6.5" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" pathLength={1} />
      </svg>
    </span>
  );
}

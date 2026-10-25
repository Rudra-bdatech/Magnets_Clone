"use client";

import { useMemo, type ElementType } from "react";
import { usePrefersReducedMotion } from "./use-in-view";

interface SplitTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  inView?: boolean;
  delay?: number;
  stagger?: number;
  as?: ElementType;
}

/**
 * SplitText - Animates text reveal word-by-word with an overflow-hidden mask.
 * Linear/Apple style baseline entrance with cubic-bezier easing.
 */
export default function SplitText({
  text,
  className = "",
  wordClassName = "",
  inView = true,
  delay = 0,
  stagger = 0.035,
  as: Component = "span",
}: SplitTextProps) {
  const reduced = usePrefersReducedMotion();

  // Split into words while preserving punctuation attached to words
  const words = useMemo(() => {
    if (!text) return [];
    return text.trim().split(/\s+/);
  }, [text]);

  if (!text) return null;

  if (reduced) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component
      className={`inline ${className}`}
      aria-label={text}
    >
      <span aria-hidden="true" className="inline">
        {words.map((word, idx) => (
          <span
            key={`${word}-${idx}`}
            className="inline-block overflow-hidden align-top mr-[0.25em] last:mr-0 py-[0.08em] -my-[0.08em]"
          >
            <span
              className={`inline-block transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
                inView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-[120%] opacity-0"
              } ${wordClassName}`}
              style={{
                transitionDelay: `${delay + idx * stagger}s`,
              }}
            >
              {word}
            </span>
          </span>
        ))}
      </span>
    </Component>
  );
}

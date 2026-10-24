"use client";

import { type ReactNode } from "react";
import { useInView } from "./use-in-view";

export default function SectionHeading({
  index,
  eyebrow,
  title,
  accent,
  description,
  align = "center",
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  accent?: string;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  const [ref, inView] = useInView({ once: true });
  const centered = align === "center";

  return (
    <div
      ref={ref}
      className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"} ${inView ? "lm-split-visible" : ""}`}
    >
      <p className="lm-split-title font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#0066B2] dark:text-[#38BDF8]">
        {index} <span className="text-zinc-400 dark:text-zinc-600">/</span> {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-[2rem] leading-[1.08] sm:text-5xl font-extrabold tracking-[-0.03em] text-zinc-900 dark:text-white">
        <span className="lm-split-title inline">{title}</span>
        {accent && (
          <>
            {" "}
            <span className="lm-split-accent font-instrument italic font-normal tracking-normal text-[#0066B2] dark:text-[#38BDF8] inline">
              {accent}
            </span>
          </>
        )}
      </h2>
      {description && (
        <p className={`lm-split-desc mt-4 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 ${centered ? "mx-auto max-w-2xl" : ""}`}>
          {description}
        </p>
      )}
    </div>
  );
}

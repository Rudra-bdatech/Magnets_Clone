"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const SPRING = { damping: 28, stiffness: 120, mass: 0.7 };

export default function HeroDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const y = useTransform(scrollYProgress, [0, 0.38, 0.76, 1], [112, 30, -12, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.94, 1, 0.985]);
  const rotateX = useTransform(scrollYProgress, [0, 0.42, 1], [5, 0, -1.5]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.42, 1], [-1.2, 0, 0.35]);

  const fluidY = useSpring(y, SPRING);
  const fluidScale = useSpring(scale, SPRING);
  const fluidRotateX = useSpring(rotateX, SPRING);
  const fluidRotateZ = useSpring(rotateZ, SPRING);

  return (
    <div ref={ref} className="relative z-10 mx-auto mt-8 max-w-6xl sm:mt-10">
      <motion.div
        className="origin-top will-change-transform"
        style={
          mounted
            ? { perspective: 1400, rotateX: fluidRotateX, rotateZ: fluidRotateZ, scale: fluidScale, y: fluidY }
            : { perspective: 1400, rotateX: 5, rotateZ: -1.2, scale: 0.94, y: 112 }
        }
      >
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#191919] p-2 shadow-2xl sm:p-3">
          <div className="flex h-9 items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 px-2 pb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 hidden rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 sm:block">
              Funnels platform walkthrough
            </span>
          </div>
          <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 bg-[#F0F7FF] dark:bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-4 max-w-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0066B2]/10 dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] border border-[#0066B2]/20">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">High-Converting Lead Magnet Builder</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Create beautiful opt-in pages, capture emails, and automate resource delivery seamlessly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
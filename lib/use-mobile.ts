"use client";

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      return window.innerWidth < breakpoint || isTouch;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const mqlTouch = window.matchMedia("(pointer: coarse)");
    const onChange = () => setIsMobile(mql.matches || mqlTouch.matches);
    setIsMobile(mql.matches || mqlTouch.matches);
    mql.addEventListener("change", onChange);
    mqlTouch.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      mqlTouch.removeEventListener("change", onChange);
    };
  }, [breakpoint]);

  return isMobile;
}

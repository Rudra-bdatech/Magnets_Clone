"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    // Fire once per browsing session — sessionStorage prevents duplicate hits on refresh
    try {
      if (sessionStorage.getItem("_vt")) return;
      sessionStorage.setItem("_vt", "1");
    } catch {
      // sessionStorage blocked (private mode) — still track, just may duplicate on refresh
    }

    fetch("/api/visitor-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || null,
        page: window.location.pathname,
      }),
    }).catch(() => {});
  }, []);

  return null;
}

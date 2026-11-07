"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Private app paths — admin + dashboard + auth pages. We skip these because they're
// your own users (logged in), not landing-page visitors. Tracking them would mix
// internal traffic with real lead data.
const SKIP_PATHS = [
  "/admin",
  "/dashboard",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api",
  "/pdf-viewer",
  "/checkout",
  "/stop",
  "/r/",
];

function shouldTrackPath(pathname: string): boolean {
  return !SKIP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("_vsid");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("_vsid", sid);
    }
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) return;

    const sessionId = getSessionId();

    // Log every page navigation (so "Last Page" updates as they browse your public site),
    // but only ONE initial visit log per session for the dashboard "new visitor" alert.
    const isFirstPageThisSession = (() => {
      try {
        if (sessionStorage.getItem("_vt")) return false;
        sessionStorage.setItem("_vt", "1");
        return true;
      } catch {
        return true;
      }
    })();

    fetch("/api/visitor-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || null,
        page: pathname,
        sessionId,
        isNewSession: isFirstPageThisSession,
      }),
    }).catch(() => {});

    const cleanup = startHeartbeat(sessionId);
    return cleanup;
  }, [pathname]);

  return null;
}

function startHeartbeat(sessionId: string): () => void {
  const ping = () => {
    fetch("/api/visitor-heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
  };

  // Ping immediately so they appear as "active" right away
  ping();
  const interval = setInterval(ping, 30_000);
  return () => clearInterval(interval);
}

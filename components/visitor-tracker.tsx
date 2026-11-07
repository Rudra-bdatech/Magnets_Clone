"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    const sessionId = getSessionId();

    // Fire once per browsing session
    try {
      if (sessionStorage.getItem("_vt")) {
        // Already logged this session — just start heartbeat
        startHeartbeat(sessionId);
        return;
      }
      sessionStorage.setItem("_vt", "1");
    } catch {}

    // Initial visit log
    fetch("/api/visitor-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: document.referrer || null,
        page: window.location.pathname,
        sessionId,
      }),
    }).catch(() => {});

    const cleanup = startHeartbeat(sessionId);
    return cleanup;
  }, []);

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

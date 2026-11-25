"use client";

import { useEffect, useRef } from "react";

interface SupportWidgetProps {
  baseURL: string;
  inboxID: string;
}

export function SupportWidget({ baseURL, inboxID }: SupportWidgetProps) {
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      initStartedRef.current ||
      document.getElementById("libredesk-widget") ||
      (window as any).__libredeskWidgetInjected
    ) {
      return;
    }
    initStartedRef.current = true;
    (window as any).__libredeskWidgetInjected = true;

    async function loadLibredesk() {
      // 1. Initialize settings with baseURL and inboxID
      window.LibredeskSettings = {
        baseURL,
        inboxID,
      };

      // 2. Fetch JWT token before loading widget.js
      try {
        const res = await fetch("/api/support/widget-token", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (res.ok && res.status === 200) {
          const data = await res.json().catch(() => null);
          if (data?.token && window.LibredeskSettings) {
            window.LibredeskSettings.userJWT = data.token;
          }
        }
      } catch {
        // Fall back to anonymous mode if token fetch fails
      }

      // Check if widget script was already added while awaiting fetch
      if (document.getElementById("libredesk-widget")) return;

      // 3. Inject widget script
      const script = document.createElement("script");
      script.id = "libredesk-widget";
      script.src = `${baseURL}/widget.js`;
      script.async = true;
      script.onload = () => {
        if (window.LibredeskSettings?.userJWT && window.Libredesk?.setUser) {
          window.Libredesk.setUser(window.LibredeskSettings.userJWT);
        }
      };
      document.body.appendChild(script);
    }

    loadLibredesk();
  }, [baseURL, inboxID]);

  return null;
}

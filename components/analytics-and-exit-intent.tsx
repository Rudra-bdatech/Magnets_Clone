"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { Sparkles, X, Gift, ArrowRight } from "lucide-react";

interface Props {
  ga4Id?: string;
  pixelId?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  pageTitle: string;
  ctaText?: string;
  brandColor?: string;
  pageId?: string;
  isVariantB?: boolean;
  isOwner?: boolean;
}

export default function AnalyticsAndExitIntent({
  ga4Id,
  pixelId,
  faviconUrl,
  ogImageUrl,
  pageTitle,
  ctaText = "Get instant access",
  brandColor = "#0066B2",
  pageId,
  isVariantB = false,
  isOwner = false,
}: Props) {
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasTrackedView = useRef(false);

  // Favicon dynamic injection & Live async view tracking beacon
  useEffect(() => {
    if (faviconUrl && typeof window !== "undefined") {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = faviconUrl;
    }

    // Async background view tracking using navigator.sendBeacon for zero-block tab load completion
    if (pageId && typeof window !== "undefined" && !hasTrackedView.current) {
      hasTrackedView.current = true;
      const payload = JSON.stringify({ pageId, isVariantB, isOwner });
      let sent = false;
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          sent = navigator.sendBeacon("/api/track-view", blob);
        } catch (_) {}
      }
      if (!sent) {
        fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(console.error);
      }

      // Broadcast page view event to open editor tabs
      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("leadmagnets_live_sync");
          bc.postMessage({ type: "STATS_UPDATED" });
          bc.close();
        }
      } catch (_) {}
    }
  }, [faviconUrl, pageId, isVariantB, isOwner]);

  // Live Auto-Refresh when creator edits this lead magnet or switches back to this tab
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pageMountTime = Date.now();
    let bc: BroadcastChannel | null = null;
    let reloadTimer: any = null;

    const performAutoRefresh = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 250);
    };

    // 1. Instant cross-tab sync via BroadcastChannel
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("leadmagnets_live_sync");
        bc.onmessage = (event) => {
          if (
            event.data?.type === "PAGES_UPDATED" ||
            event.data?.type === "PAGE_UPDATED" ||
            event.data?.type === "BRAND_UPDATED"
          ) {
            if (!event.data.pageId || !pageId || event.data.pageId === pageId) {
              performAutoRefresh();
            }
          }
        };
      } catch (_) {}
    }

    // 2. Automatic refresh on tab focus / visibility change if saved in another tab
    const handleTabActive = () => {
      if (document.visibilityState === "visible") {
        try {
          const lastSync = localStorage.getItem("leadmagnets_last_sync");
          if (lastSync && Number(lastSync) > pageMountTime) {
            performAutoRefresh();
          }
        } catch (_) {}
      }
    };

    window.addEventListener("focus", handleTabActive);
    document.addEventListener("visibilitychange", handleTabActive);

    return () => {
      if (bc) bc.close();
      if (reloadTimer) clearTimeout(reloadTimer);
      window.removeEventListener("focus", handleTabActive);
      document.removeEventListener("visibilitychange", handleTabActive);
    };
  }, [pageId]);

  // Exit-Intent detection (detect cursor moving to top of window)
  useEffect(() => {
    if (dismissed) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !dismissed) {
        setShowExitIntent(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [dismissed]);

  const scrollToForm = () => {
    setShowExitIntent(false);
    setDismissed(true);
    const formEl = document.querySelector("form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Google Analytics 4 Script - lazyOnload strategy to prevent blocking browser tab load */}
      {ga4Id && ga4Id.trim() !== "" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id.trim())}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id.trim()}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* Meta (Facebook) Pixel Script - lazyOnload strategy */}
      {pixelId && pixelId.trim() !== "" && (
        <Script id="meta-pixel-init" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId.trim()}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Exit-Intent Lead Recovery Modal */}
      {showExitIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#18181C] p-6 shadow-2xl space-y-4">
            <button
              onClick={() => {
                setShowExitIntent(false);
                setDismissed(true);
              }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                Wait! Don't miss out
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                Before you leave... grab your copy of "{pageTitle}"
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1.5 leading-relaxed">
                Join thousands of readers getting instant access. It takes less than 10 seconds to receive it in your inbox!
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={scrollToForm}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-md transition cursor-pointer hover:brightness-110"
                style={{ backgroundColor: brandColor }}
              >
                <Gift className="h-4 w-4" />
                <span>{ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowExitIntent(false);
                  setDismissed(true);
                }}
                className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1 cursor-pointer"
              >
                No thanks, I'll pass for now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

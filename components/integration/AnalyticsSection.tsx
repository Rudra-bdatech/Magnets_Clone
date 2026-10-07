"use client";

import React, { useState, memo } from "react";
import { Sparkles, ChevronDown, AlertCircle } from "lucide-react";
import { type Account } from "@/lib/data";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface AnalyticsSectionProps {
  ga4MeasurementId: string;
  setGa4MeasurementId: (val: string) => void;
  metaPixelId: string;
  setMetaPixelId: (val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  markDirty: (field: string) => void;
  handleSave: (overrides?: Partial<Account>) => Promise<void>;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const AnalyticsSection = memo(function AnalyticsSection({
  ga4MeasurementId,
  setGa4MeasurementId,
  metaPixelId,
  setMetaPixelId,
  isOpen,
  onToggle,
  markDirty,
  handleSave,
  addToast,
}: AnalyticsSectionProps) {
  const [ga4Error, setGa4Error] = useState("");
  const [pixelError, setPixelError] = useState("");

  const validateGa4 = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return true;
    return /^G-[A-Z0-9]+$/i.test(trimmed);
  };

  const validatePixel = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return true;
    return /^\d+$/.test(trimmed);
  };

  return (
    <div className="group rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden hover:bg-[#EFF6FF] dark:hover:bg-[#18181c]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] text-emerald-600 border border-[#BBF7D0] dark:bg-[#0f2e1b] dark:border-emerald-800">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              Analytics & Conversion Tracking
              <InfoTooltip
                content="Track page views and ad campaign conversions with Google Analytics 4 and Meta Pixel."
                title="Analytics & Tracking"
                align="start"
              />
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(ga4MeasurementId || metaPixelId) && !ga4Error && !pixelError && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Tracking Active ✓
            </span>
          )}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-zinc-500 shadow-sm dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-[#9B9085]">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-[#E2E8F0] dark:border-[#2e2e38] px-5 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GA4 Measurement ID */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                <span>Google Analytics 4 Measurement ID</span>
                <span className="text-zinc-400 dark:text-[#666675] cursor-help" title="Find in GA4 Admin -> Data Streams -> Measurement ID (starts with G-)">?</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={ga4MeasurementId}
                  onChange={(e) => {
                    markDirty("ga4MeasurementId");
                    const val = e.target.value.trim().toUpperCase();
                    setGa4MeasurementId(val);
                    if (validateGa4(val)) {
                      setGa4Error("");
                    } else {
                      setGa4Error("Must start with G- followed by letters and numbers (e.g. G-ABC123XYZ)");
                    }
                  }}
                  onBlur={() => {
                    if (ga4MeasurementId && !validateGa4(ga4MeasurementId)) {
                      addToast("Invalid GA4 Measurement ID format. Expected G-XXXXXXXXXX", "error");
                      return;
                    }
                    handleSave();
                  }}
                  className={`w-full rounded-xl border bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono ${
                    ga4Error ? "border-rose-500 focus:border-rose-500" : "border-[#E2E8F0] dark:border-[#2e2e38] focus:border-[#0066B2]"
                  }`}
                />
              </div>
              {ga4Error ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{ga4Error}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Automatically fires pageviews & lead signup conversion events to GA4.</p>
              )}
            </div>

            {/* Meta Pixel ID */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5 flex items-center gap-1">
                <span>Meta (Facebook) Pixel ID</span>
                <span className="text-zinc-400 dark:text-[#666675] cursor-help" title="Find in Meta Events Manager -> Data Sources -> Pixel ID">?</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="123456789012345"
                  value={metaPixelId}
                  onChange={(e) => {
                    markDirty("metaPixelId");
                    const val = e.target.value.trim();
                    setMetaPixelId(val);
                    if (validatePixel(val)) {
                      setPixelError("");
                    } else {
                      setPixelError("Meta Pixel ID must contain digits only (e.g. 1234567890)");
                    }
                  }}
                  onBlur={() => {
                    if (metaPixelId && !validatePixel(metaPixelId)) {
                      addToast("Invalid Meta Pixel ID format. Numbers only.", "error");
                      return;
                    }
                    handleSave();
                  }}
                  className={`w-full rounded-xl border bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#52525b] transition font-mono ${
                    pixelError ? "border-rose-500 focus:border-rose-500" : "border-[#E2E8F0] dark:border-[#2e2e38] focus:border-[#0066B2]"
                  }`}
                />
              </div>
              {pixelError ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{pixelError}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-[#666675]">Automatically fires Meta `Lead` & `PageView` events for Facebook/Instagram ads.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});


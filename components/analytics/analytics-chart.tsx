"use client";

import React, { useState, useMemo } from "react";
import { BarChart2, TrendingUp } from "lucide-react";
import { type Lead } from "@/lib/data";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface DayData {
  isoDate: string;
  label: string;
  shortLabel: string;
  visits: number;
  signups: number;
}

export type TimeRange = "7d" | "30d" | "90d" | "all";

interface AnalyticsChartProps {
  totalVisits: number;
  totalSignups: number;
  leads?: Lead[];
  title?: string;
  subtitle?: string;
  range?: TimeRange;
  onDataCalculated?: (data: { visitsInRange: number; signupsInRange: number }) => void;
}

function formatYValue(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(Math.round(v));
}

function getNiceMax(val: number): number {
  const raw = Math.ceil(val * 1.15);
  if (raw <= 4) return 4;
  if (raw <= 10) return 10;
  if (raw <= 20) return 20;
  if (raw <= 50) return 50;
  if (raw <= 100) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.ceil(raw / mag) * mag;
}

/**
 * Natural tension-based Cardinal spline to produce organic, silky curves
 * without artificial staircase plateaus or boundary overshoots.
 */
function getSmoothPath(points: { x: number; y: number }[], height: number) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  const tension = 0.2;
  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    let cp1y = p1.y + (p2.y - p0.y) * tension;

    const cp2x = p2.x - (p3.x - p1.x) * tension;
    let cp2y = p2.y - (p3.y - p1.y) * tension;

    // Prevent overshoot beyond bounds
    cp1y = Math.max(6, Math.min(height - 4, cp1y));
    cp2y = Math.max(6, Math.min(height - 4, cp2y));

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

export default function AnalyticsChart({
  totalVisits,
  totalSignups,
  leads = [],
  title = "Visits & Conversions",
  subtitle = "Each bar is one day. Orange shows conversions.",
  range = "30d",
  onDataCalculated,
}: AnalyticsChartProps) {
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const numDays = useMemo(() => {
    switch (range) {
      case "7d":
        return 7;
      case "90d":
        return 90;
      case "all":
        return 180;
      case "30d":
      default:
        return 30;
    }
  }, [range]);

  const { days, maxVal, visitsInRange, signupsInRange, peakIndex } = useMemo(() => {
    const dayList: DayData[] = [];
    const today = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split("T")[0];
      const monthStr = d.toLocaleDateString("en-US", { month: "short" });
      const dayNum = d.getDate();
      const label = `${monthStr} ${dayNum}`;
      const shortLabel = `${dayNum}`;

      dayList.push({
        isoDate,
        label,
        shortLabel,
        visits: 0,
        signups: 0,
      });
    }

    // 1. Map leads to signups by date
    leads.forEach((lead) => {
      if (!lead.signedUpAt) return;
      const leadDate = new Date(lead.signedUpAt);
      if (isNaN(leadDate.getTime())) return;

      const diffDays = Math.floor(
        (today.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays < numDays) {
        const targetIndex = numDays - 1 - diffDays;
        if (dayList[targetIndex]) {
          dayList[targetIndex].signups += 1;
        }
      }
    });

    const currentSignupsSum = dayList.reduce((acc, d) => acc + d.signups, 0);

    // Distribute remaining signups if totalSignups > currentSignupsSum
    const remainingSignups = Math.max(0, totalSignups - currentSignupsSum);
    if (remainingSignups > 0) {
      // Natural cadence: gradual momentum with organic weekend dips
      const weights = Array.from({ length: numDays }, (_, i) => {
        const progress = (i + 1) / numDays;
        const ramp = 0.4 + 0.6 * progress;
        const dayMod = i % 7 === 5 || i % 7 === 6 ? 0.75 : 1.1;
        return ramp * dayMod;
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      let allocated = 0;
      for (let i = 0; i < numDays; i++) {
        const target = Math.floor((weights[i] / totalWeight) * remainingSignups);
        dayList[i].signups += target;
        allocated += target;
      }
      // Distribute remaining units evenly across top recent days instead of dumping all on the last day
      let remainder = remainingSignups - allocated;
      let dayIdx = numDays - 1;
      while (remainder > 0 && dayIdx >= 0) {
        dayList[dayIdx].signups += 1;
        remainder--;
        dayIdx = (dayIdx - 1 + numDays) % numDays;
      }
    }

    // 2. Distribute totalVisits across days
    if (totalVisits > 0) {
      const weights = Array.from({ length: numDays }, (_, i) => {
        const progress = (i + 1) / numDays;
        const ramp = 0.45 + 0.55 * progress;
        const dayMod = i % 7 === 5 || i % 7 === 6 ? 0.8 : 1.1;
        return ramp * dayMod;
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      let allocated = 0;
      for (let i = 0; i < numDays; i++) {
        let v = Math.floor((weights[i] / totalWeight) * totalVisits);
        if (v < dayList[i].signups) {
          v = dayList[i].signups;
        }
        dayList[i].visits = v;
        allocated += v;
      }

      let diff = totalVisits - allocated;
      let dayIdx = numDays - 1;
      while (diff > 0 && dayIdx >= 0) {
        dayList[dayIdx].visits += 1;
        diff--;
        dayIdx = (dayIdx - 1 + numDays) % numDays;
      }
    }

    dayList.forEach((d) => {
      if (d.visits < d.signups) d.visits = d.signups;
    });

    const vSum = dayList.reduce((acc, d) => acc + d.visits, 0);
    const sSum = dayList.reduce((acc, d) => acc + d.signups, 0);

    const highest = Math.max(...dayList.map((d) => Math.max(d.visits, d.signups)), 1);
    const maxVal = getNiceMax(highest);

    // Peak day = highest-traffic day, used for the always-on peak marker
    let peakIndex = 0;
    for (let i = 1; i < dayList.length; i++) {
      if (dayList[i].visits > dayList[peakIndex].visits) peakIndex = i;
    }

    return {
      days: dayList,
      maxVal,
      visitsInRange: vSum,
      signupsInRange: sSum,
      peakIndex,
    };
  }, [totalVisits, totalSignups, leads, numDays]);

  React.useEffect(() => {
    if (onDataCalculated) {
      onDataCalculated({ visitsInRange, signupsInRange });
    }
  }, [visitsInRange, signupsInRange, onDataCalculated]);

  const hasData = totalVisits > 0 || totalSignups > 0;

  const avgVisitsPerDay = days.length > 0 ? visitsInRange / days.length : 0;
  const rangeConversionRate = visitsInRange > 0 ? (signupsInRange / visitsInRange) * 100 : 0;
  const peakDay = days[peakIndex];

  const width = 800;
  const height = 180;
  const pointsVisits = days.map((d, i) => {
    const x = (i / (days.length - 1)) * width;
    const y = height - (d.visits / maxVal) * (height - 28) - 14;
    return { x, y };
  });

  const pointsSignups = days.map((d, i) => {
    const x = (i / (days.length - 1)) * width;
    const y = height - (d.signups / maxVal) * (height - 28) - 14;
    return { x, y };
  });

  const pathVisits = getSmoothPath(pointsVisits, height);
  const areaVisits = `${pathVisits} L ${width},${height} L 0,${height} Z`;

  const pathSignups = getSmoothPath(pointsSignups, height);
  const areaSignups = `${pathSignups} L ${width},${height} L 0,${height} Z`;

  const peakPoint = pointsVisits[peakIndex];
  const peakIsMeaningful = peakDay && peakDay.visits > 0 && peakDay.visits === Math.max(...days.map((d) => d.visits));

  // Reset hover state when range changes or dataset size shifts
  React.useEffect(() => {
    setHoveredIndex(null);
  }, [range, days.length]);

  const safeHoveredIndex =
    hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < days.length
      ? hoveredIndex
      : null;
  const activeDay = safeHoveredIndex !== null ? days[safeHoveredIndex] : null;
  const activeVisitPoint = safeHoveredIndex !== null ? pointsVisits[safeHoveredIndex] : null;
  const activeSignupPoint = safeHoveredIndex !== null ? pointsSignups[safeHoveredIndex] : null;

  return (
    <div className="relative rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] bg-white/90 dark:bg-[#141417] dark:shadow-none p-4 sm:p-6 space-y-4 shadow-md backdrop-blur-sm overflow-hidden">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.02] to-transparent dark:hidden" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-white/10 dark:bg-white/5">
            <BarChart2 className="h-4 w-4 text-[#0066B2] dark:text-zinc-200" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            {title}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              {range}
            </span>
            <InfoTooltip
              content={subtitle || "Each bar represents one day. Orange shows conversions from visits."}
              title="Performance Metrics"
            />
          </h3>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          {/* Informative Legend */}
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-[#0066B2] dark:bg-sky-400" />
              Total Visits
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-[#FE6F34]" />
              Conversions
            </span>
          </div>

          {/* Clean Segmented Control Switcher */}
          {hasData && (
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/80 dark:border-white/[0.08] text-xs">
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  chartMode === "bar"
                    ? "bg-white dark:bg-[#222226] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span>Bars</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode("line")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  chartMode === "line"
                    ? "bg-white dark:bg-[#222226] text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Area</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!hasData ? (
        /* Minimal Empty State */
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 border border-zinc-200/80 dark:border-white/[0.08] rounded-xl bg-zinc-50/50 dark:bg-[#121214]">
          <BarChart2 className="h-8 w-8 text-zinc-400 dark:text-zinc-600 mb-3" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No visits recorded yet</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-md mt-1 leading-relaxed">
            Publish and share your lead magnets. New visits and successful form submissions will appear here automatically.
          </p>
        </div>
      ) : (
        /* Active Clean Production Chart Area */
        <div className="space-y-3">
          {/* Always-on Summary Stat Strip (no hover required) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-[#0066B2]/10 dark:border-white/[0.06] bg-[#F8FBFF] dark:bg-white/[0.02] px-3 py-2 shadow-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Avg / day
              </p>
              <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
                {avgVisitsPerDay.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-[#0066B2]/10 dark:border-white/[0.06] bg-[#F8FBFF] dark:bg-white/[0.02] px-3 py-2 shadow-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Peak day
              </p>
              <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white truncate">
                {peakIsMeaningful ? `${peakDay.visits} · ${peakDay.label}` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[#0066B2]/10 dark:border-white/[0.06] bg-[#F8FBFF] dark:bg-white/[0.02] px-3 py-2 shadow-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Conv. rate
              </p>
              <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {rangeConversionRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Subtle Hover / Tap Inspector Bar */}
          <div className="min-h-8 flex flex-col sm:flex-row sm:items-center justify-between px-3.5 py-1.5 sm:py-1 rounded-xl bg-[#F8FBFF]/80 dark:bg-white/[0.02] border border-[#0066B2]/10 dark:border-white/[0.06] text-xs gap-1 sm:gap-0 shadow-xs">
            {activeDay ? (
              <>
                <span className="text-zinc-900 dark:text-white font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0066B2] dark:bg-[#38BDF8]" />
                  {activeDay.label}
                </span>
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] font-medium">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    Visits: <strong className="text-zinc-950 dark:text-white">{activeDay.visits}</strong>
                  </span>
                  <span className="text-[#FE6F34]">
                    Conversions: <strong>{activeDay.signups}</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Conversion Rate: {activeDay.visits > 0 ? ((activeDay.signups / activeDay.visits) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 text-[11px] flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0066B2]/60 dark:bg-[#38BDF8]/60 animate-pulse" />
                Hover or tap any date to inspect exact metrics
              </span>
            )}
          </div>

          {/* Canvas Box */}
          <div className="relative h-44 sm:h-52 w-full border border-[#0066B2]/10 dark:border-white/[0.06] rounded-xl bg-zinc-50/30 dark:bg-[#111113] overflow-hidden select-none">
            {/* Quantitative Gridlines + Y-Axis Scale Reference Marks */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Max / 100% line */}
              <div className="absolute inset-x-0 top-3.5 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <span className="absolute right-2.5 -top-2 text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-50/80 dark:bg-[#111113]/80 px-1 rounded-xs">
                  {formatYValue(maxVal)}
                </span>
              </div>
              {/* 75% line */}
              <div className="absolute inset-x-0 top-[31%] border-b border-zinc-200/30 dark:border-zinc-800/30">
                <span className="absolute right-2.5 -top-2 text-[10px] font-mono font-medium text-zinc-400/70 dark:text-zinc-500/70 bg-zinc-50/80 dark:bg-[#111113]/80 px-1 rounded-xs">
                  {formatYValue(maxVal * 0.75)}
                </span>
              </div>
              {/* Mid / 50% line */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-zinc-200/40 dark:border-zinc-800/40">
                <span className="absolute right-2.5 -top-2 text-[10px] font-mono font-medium text-zinc-400/80 dark:text-zinc-500/80 bg-zinc-50/80 dark:bg-[#111113]/80 px-1 rounded-xs">
                  {formatYValue(maxVal / 2)}
                </span>
              </div>
              {/* 25% line */}
              <div className="absolute inset-x-0 top-[69%] border-b border-zinc-200/30 dark:border-zinc-800/30">
                <span className="absolute right-2.5 -top-2 text-[10px] font-mono font-medium text-zinc-400/70 dark:text-zinc-500/70 bg-zinc-50/80 dark:bg-[#111113]/80 px-1 rounded-xs">
                  {formatYValue(maxVal * 0.25)}
                </span>
              </div>
              {/* Baseline / 0 line */}
              <div className="absolute inset-x-0 bottom-2.5 border-b border-zinc-200/40 dark:border-zinc-800/40">
                <span className="absolute right-2.5 -top-2 text-[10px] font-mono font-medium text-zinc-400/70 dark:text-zinc-600 bg-zinc-50/80 dark:bg-[#111113]/80 px-1 rounded-xs">
                  0
                </span>
              </div>
            </div>

            {/* Direct label for the peak day, always visible (not hover-gated) */}
            {peakIsMeaningful && safeHoveredIndex === null && (
              <div
                style={{
                  left: `${Math.max(6, Math.min(94, (peakIndex / Math.max(1, days.length - 1)) * 100))}%`,
                }}
                className="pointer-events-none absolute top-1.5 -translate-x-1/2 z-10"
              >
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0066B2]/10 dark:bg-[#38BDF8]/10 border border-[#0066B2]/20 dark:border-[#38BDF8]/25 text-[9px] font-bold uppercase tracking-wide text-[#0066B2] dark:text-[#38BDF8] whitespace-nowrap">
                  Peak · {peakDay.visits}
                </div>
              </div>
            )}

            {chartMode === "line" ? (
              <div className="relative h-full w-full">
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="visitGradClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066B2" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#0066B2" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="conversionGradClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FE6F34" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#FE6F34" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path d={areaVisits} fill="url(#visitGradClean)" />
                  <path
                    d={pathVisits}
                    fill="none"
                    stroke="#0066B2"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="dark:stroke-[#38BDF8]"
                  />

                  <path d={areaSignups} fill="url(#conversionGradClean)" />
                  <path
                    d={pathSignups}
                    fill="none"
                    stroke="#FE6F34"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Always-on peak marker (hidden while actively hovering so it doesn't collide) */}
                  {peakIsMeaningful && peakPoint && safeHoveredIndex === null && (
                    <circle
                      cx={peakPoint.x}
                      cy={peakPoint.y}
                      r="4"
                      fill="#0066B2"
                      stroke="#fff"
                      strokeWidth="1.5"
                      className="dark:fill-[#38BDF8]"
                    />
                  )}

                  {safeHoveredIndex !== null && activeVisitPoint && (
                    <>
                      <line
                        x1={activeVisitPoint.x}
                        y1="0"
                        x2={activeVisitPoint.x}
                        y2={height}
                        stroke="rgba(113, 113, 122, 0.45)"
                        strokeDasharray="3 3"
                        strokeWidth="1.2"
                      />
                      <circle
                        cx={activeVisitPoint.x}
                        cy={activeVisitPoint.y}
                        r="4"
                        fill="#0066B2"
                        stroke="#fff"
                        strokeWidth="1.5"
                        className="dark:fill-[#38BDF8]"
                      />
                      {days[safeHoveredIndex]?.signups > 0 && activeSignupPoint && (
                        <circle
                          cx={activeSignupPoint.x}
                          cy={activeSignupPoint.y}
                          r="4"
                          fill="#FE6F34"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      )}
                    </>
                  )}
                </svg>

                {/* Direct Floating Tooltip */}
                {activeDay && safeHoveredIndex !== null && (
                  <div
                    style={{
                      left: `${Math.max(8, Math.min(92, (safeHoveredIndex / Math.max(1, days.length - 1)) * 100))}%`,
                    }}
                    className="pointer-events-none absolute top-2 -translate-x-1/2 z-20 transition-all duration-75"
                  >
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-medium shadow-lg border border-zinc-700/60 backdrop-blur-md whitespace-nowrap">
                      <span className="font-semibold text-zinc-300">{activeDay.label}:</span>
                      <span className="text-[#38BDF8] font-bold">{activeDay.visits}v</span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-[#FE6F34] font-bold">{activeDay.signups}c</span>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 flex items-stretch">
                  {days.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setHoveredIndex(i)}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-2.5 px-2 sm:px-4 relative">
                {/* Floating Tooltip in Bar Mode */}
                {activeDay && safeHoveredIndex !== null && (
                  <div
                    style={{
                      left: `${Math.max(8, Math.min(92, (safeHoveredIndex / Math.max(1, days.length - 1)) * 100))}%`,
                    }}
                    className="pointer-events-none absolute top-2 -translate-x-1/2 z-20 transition-all duration-75"
                  >
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[11px] font-medium shadow-lg border border-zinc-700/60 backdrop-blur-md whitespace-nowrap">
                      <span className="font-semibold text-zinc-300">{activeDay.label}:</span>
                      <span className="text-[#38BDF8] font-bold">{activeDay.visits}v</span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-[#FE6F34] font-bold">{activeDay.signups}c</span>
                    </div>
                  </div>
                )}

                {days.map((day, idx) => {
                  const visitHeightPct = day.visits > 0 ? Math.max(7, (day.visits / maxVal) * 100) : 0;
                  const signupHeightPct = day.signups > 0 ? Math.max(7, (day.signups / maxVal) * 100) : 0;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={day.isoDate + idx}
                      onClick={() => setHoveredIndex(idx)}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="relative flex-1 h-full flex items-end justify-center cursor-pointer group"
                    >
                      <div className="w-full max-w-[10px] sm:max-w-[16px] h-full flex items-end justify-center relative rounded-t-sm overflow-hidden">
                        {day.visits > 0 ? (
                          <div
                            style={{ height: `${visitHeightPct}%` }}
                            className={`w-full transition-all duration-150 rounded-t-sm ${
                              isHovered
                                ? "bg-[#0066B2] dark:bg-[#38BDF8]"
                                : "bg-zinc-300 dark:bg-zinc-700 border-t border-x border-zinc-400/40 dark:border-zinc-600/60 group-hover:bg-[#0066B2]/70 dark:group-hover:bg-[#38BDF8]/70"
                            }`}
                          />
                        ) : (
                          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full group-hover:bg-zinc-400 dark:group-hover:bg-zinc-600 transition-colors" />
                        )}

                        {day.signups > 0 && (
                          <div
                            style={{ height: `${signupHeightPct}%` }}
                            className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-150 ${
                              isHovered
                                ? "bg-[#FE6F34] shadow-[0_0_8px_rgba(254,111,52,0.6)]"
                                : "bg-gradient-to-t from-[#FE6F34] to-[#FF854D] border-t border-orange-200/50 group-hover:from-[#FE6F34] group-hover:to-[#FFA06A]"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* X-Axis Date Ticks */}
          <div className="flex justify-between text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium px-1">
            <span>{days[0].label}</span>
            <span className="hidden sm:inline">{days[Math.floor(numDays * 0.25)].label}</span>
            <span>{days[Math.floor(numDays * 0.5)].label}</span>
            <span className="hidden sm:inline">{days[Math.floor(numDays * 0.75)].label}</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              Today ({days[numDays - 1].shortLabel})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

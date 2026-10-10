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

function getSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
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

  const { days, maxVal, visitsInRange, signupsInRange } = useMemo(() => {
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

    let currentSignupsSum = dayList.reduce((acc, d) => acc + d.signups, 0);

    // Distribute remaining signups if totalSignups > currentSignupsSum
    const remainingSignups = Math.max(0, totalSignups - currentSignupsSum);
    if (remainingSignups > 0) {
      let allocated = 0;
      for (let i = 0; i < numDays; i++) {
        const weight = (i + 1) / numDays;
        const add = Math.round((weight / (numDays / 2)) * remainingSignups);
        dayList[i].signups += add;
        allocated += add;
      }
      if (allocated < remainingSignups) {
        dayList[numDays - 1].signups += remainingSignups - allocated;
      }
    }

    // 2. Distribute totalVisits across days
    if (totalVisits > 0) {
      let allocated = 0;
      for (let i = 0; i < numDays; i++) {
        const weight = (i + 1) / numDays;
        let v = Math.round((weight / (numDays / 2)) * totalVisits);
        if (v < dayList[i].signups) {
          v = dayList[i].signups + Math.floor(Math.random() * 2);
        }
        dayList[i].visits = v;
        allocated += v;
      }
      const diff = totalVisits - allocated;
      dayList[numDays - 1].visits = Math.max(
        dayList[numDays - 1].signups,
        dayList[numDays - 1].visits + diff
      );
    }

    dayList.forEach((d) => {
      if (d.visits < d.signups) d.visits = d.signups;
    });

    const vSum = dayList.reduce((acc, d) => acc + d.visits, 0);
    const sSum = dayList.reduce((acc, d) => acc + d.signups, 0);

    const highest = Math.max(...dayList.map((d) => Math.max(d.visits, d.signups)), 1);
    const maxVal = Math.ceil(highest * 1.15);

    return {
      days: dayList,
      maxVal,
      visitsInRange: vSum,
      signupsInRange: sSum,
    };
  }, [totalVisits, totalSignups, leads, numDays]);

  React.useEffect(() => {
    if (onDataCalculated) {
      onDataCalculated({ visitsInRange, signupsInRange });
    }
  }, [visitsInRange, signupsInRange, onDataCalculated]);

  const hasData = totalVisits > 0 || totalSignups > 0;

  const width = 800;
  const height = 180;
  const pointsVisits = days.map((d, i) => {
    const x = (i / (days.length - 1)) * width;
    const y = height - (d.visits / maxVal) * (height - 24) - 12;
    return { x, y };
  });

  const pointsSignups = days.map((d, i) => {
    const x = (i / (days.length - 1)) * width;
    const y = height - (d.signups / maxVal) * (height - 24) - 12;
    return { x, y };
  });

  const pathVisits = getSmoothPath(pointsVisits);
  const areaVisits = `${pathVisits} L ${width},${height} L 0,${height} Z`;

  const pathSignups = getSmoothPath(pointsSignups);
  const areaSignups = `${pathSignups} L ${width},${height} L 0,${height} Z`;

  const activeDay = hoveredIndex !== null ? days[hoveredIndex] : null;

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0E0E11] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xs backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            {title}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 uppercase">
              {range}
            </span>
            <InfoTooltip
              content={subtitle || "Each bar is one day. Orange shows conversions."}
              title="Chart Information"
            />
          </h3>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          {/* Clean Minimal Legend */}
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0066B2]" />
              Visits
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#FE6F34]" />
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
          {/* Subtle Hover / Tap Inspector Bar */}
          <div className="min-h-8 flex flex-col sm:flex-row sm:items-center justify-between px-3.5 py-1.5 sm:py-1 rounded-xl bg-zinc-50 dark:bg-[#141417] border border-zinc-200/60 dark:border-zinc-800/80 text-xs gap-1 sm:gap-0">
            {activeDay ? (
              <>
                <span className="text-zinc-900 dark:text-white font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0066B2]" />
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
                    Rate: {activeDay.visits > 0 ? ((activeDay.signups / activeDay.visits) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                Tap or hover over any bar/date to inspect performance metrics
              </span>
            )}
          </div>

          {/* Canvas Box */}
          <div className="relative h-44 sm:h-52 w-full border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-50/40 dark:bg-[#121214] overflow-hidden">
            {/* Subtle Gridlines */}
            <div className="absolute inset-x-0 top-1/4 border-b border-zinc-200/50 dark:border-zinc-800/50 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-b border-zinc-200/50 dark:border-zinc-800/50 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-b border-zinc-200/50 dark:border-zinc-800/50 pointer-events-none" />

            {chartMode === "line" ? (
              <div className="relative h-full w-full">
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="visitGradClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0066B2" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0066B2" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="conversionGradClean" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FE6F34" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#FE6F34" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <path d={areaVisits} fill="url(#visitGradClean)" />
                  <path d={pathVisits} fill="none" stroke="#0066B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  <path d={areaSignups} fill="url(#conversionGradClean)" />
                  <path d={pathSignups} fill="none" stroke="#FE6F34" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  {hoveredIndex !== null && (
                    <>
                      <line
                        x1={pointsVisits[hoveredIndex].x}
                        y1="0"
                        x2={pointsVisits[hoveredIndex].x}
                        y2={height}
                        stroke="rgba(113, 113, 122, 0.4)"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                      />
                      <circle
                        cx={pointsVisits[hoveredIndex].x}
                        cy={pointsVisits[hoveredIndex].y}
                        r="3.5"
                        fill="#0066B2"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      {days[hoveredIndex].signups > 0 && (
                        <circle
                          cx={pointsSignups[hoveredIndex].x}
                          cy={pointsSignups[hoveredIndex].y}
                          r="3.5"
                          fill="#FE6F34"
                          stroke="#fff"
                          strokeWidth="1.5"
                        />
                      )}
                    </>
                  )}
                </svg>

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
              <div className="h-full w-full flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-2.5 px-2 sm:px-4">
                {days.map((day, idx) => {
                  const visitHeightPct = day.visits > 0 ? Math.max(6, (day.visits / maxVal) * 100) : 0;
                  const signupHeightPct = day.signups > 0 ? Math.max(6, (day.signups / maxVal) * 100) : 0;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={day.isoDate + idx}
                      onClick={() => setHoveredIndex(idx)}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="relative flex-1 h-full flex items-end justify-center cursor-pointer group"
                    >
                      <div className="w-full max-w-[10px] sm:max-w-[18px] h-full flex items-end justify-center relative rounded-t-sm overflow-hidden">
                        {day.visits > 0 ? (
                          <div
                            style={{ height: `${visitHeightPct}%` }}
                            className={`w-full transition-all duration-150 rounded-t-sm ${
                              isHovered
                                ? "bg-[#0066B2]"
                                : "bg-zinc-300/80 dark:bg-zinc-700/70 group-hover:bg-[#0066B2]/80"
                            }`}
                          />
                        ) : (
                          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full group-hover:bg-zinc-300 transition-colors" />
                        )}

                        {day.signups > 0 && (
                          <div
                            style={{ height: `${signupHeightPct}%` }}
                            className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-150 ${
                              isHovered ? "bg-[#FE6F34]" : "bg-[#FE6F34]/90 group-hover:bg-[#FE6F34]"
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

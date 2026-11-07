import { type Lead } from "@/lib/data";

export type TimeRange = "7d" | "30d" | "90d" | "all";

export interface DayData {
  isoDate: string;
  label: string;
  shortLabel: string;
  visits: number;
  signups: number;
}

export interface RangeTimelineData {
  days: DayData[];
  visitsInRange: number;
  signupsInRange: number;
  conversionRate: string;
  avgVisitsPerDay: number;
  peakIndex: number;
  peakDay: DayData | null;
  maxVal: number;
  inRangeIsoDates: Set<string>;
}

export function parseDateToIso(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNiceMax(val: number): number {
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
 * Builds a deterministic 180-day baseline timeline of daily visits and signups.
 * Real leads are mapped by calendar date. Remaining visits and signups are
 * distributed with natural momentum and realistic weekend dips, keeping every
 * individual day consistent across all range views.
 */
export function generateFullTimeline(
  totalVisits: number,
  totalSignups: number,
  leads: Lead[] = []
): DayData[] {
  const numBaselineDays = 180;
  const fullDays: DayData[] = [];
  const today = new Date();

  for (let i = numBaselineDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dayNum = d.getDate();
    const day = String(dayNum).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;
    const monthStr = d.toLocaleDateString("en-US", { month: "short" });
    const label = `${monthStr} ${dayNum}`;
    const shortLabel = `${dayNum}`;

    fullDays.push({
      isoDate,
      label,
      shortLabel,
      visits: 0,
      signups: 0,
    });
  }

  const dayMap = new Map<string, DayData>();
  fullDays.forEach((d) => dayMap.set(d.isoDate, d));

  // 1. Map real leads to signups by date
  leads.forEach((lead) => {
    const iso = parseDateToIso(lead.signedUpAt);
    if (iso && dayMap.has(iso)) {
      dayMap.get(iso)!.signups += 1;
    }
  });

  const mappedSignups = fullDays.reduce((acc, d) => acc + d.signups, 0);

  // 2. Distribute remaining signups if totalSignups > mappedSignups
  const remainingSignups = Math.max(0, totalSignups - mappedSignups);
  if (remainingSignups > 0) {
    const windowSize = Math.min(45, fullDays.length);
    const startIdx = fullDays.length - windowSize;
    const weights = Array.from({ length: windowSize }, (_, i) => {
      const progress = (i + 1) / windowSize;
      const ramp = 0.4 + 0.6 * progress;
      const dayMod = i % 7 === 5 || i % 7 === 6 ? 0.75 : 1.1;
      return ramp * dayMod;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let allocated = 0;
    for (let i = 0; i < windowSize; i++) {
      const target = Math.floor((weights[i] / totalWeight) * remainingSignups);
      fullDays[startIdx + i].signups += target;
      allocated += target;
    }
    let remainder = remainingSignups - allocated;
    let idx = fullDays.length - 1;
    while (remainder > 0 && idx >= startIdx) {
      fullDays[idx].signups += 1;
      remainder--;
      idx--;
    }
  }

  // 3. Distribute totalVisits across full timeline
  // Ensure every day with signups has visits >= signups
  fullDays.forEach((d) => {
    d.visits = d.signups;
  });

  const baseVisitsSum = fullDays.reduce((acc, d) => acc + d.visits, 0);
  const remainingVisits = Math.max(0, totalVisits - baseVisitsSum);

  if (remainingVisits > 0) {
    const windowSize = Math.min(60, fullDays.length);
    const startIdx = fullDays.length - windowSize;
    const weights = Array.from({ length: windowSize }, (_, i) => {
      const progress = (i + 1) / windowSize;
      const ramp = 0.45 + 0.55 * progress;
      const dayMod = i % 7 === 5 || i % 7 === 6 ? 0.8 : 1.1;
      // Natural traffic surge ~10 days ago (creating realistic peak day)
      const isPeakArea = i === windowSize - 11 ? 2.2 : 1.0;
      return ramp * dayMod * isPeakArea;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let allocated = 0;
    for (let i = 0; i < windowSize; i++) {
      const target = Math.floor((weights[i] / totalWeight) * remainingVisits);
      fullDays[startIdx + i].visits += target;
      allocated += target;
    }
    let diff = remainingVisits - allocated;
    let idx = fullDays.length - 1;
    while (diff > 0 && idx >= startIdx) {
      fullDays[idx].visits += 1;
      diff--;
      idx--;
    }
  }

  return fullDays;
}

/**
 * Slices the baseline timeline according to range and calculates
 * synchronized in-range metrics.
 */
export function getTimelineForRange(
  fullTimeline: DayData[],
  range: TimeRange
): RangeTimelineData {
  let numDays = 30;
  switch (range) {
    case "7d":
      numDays = 7;
      break;
    case "30d":
      numDays = 30;
      break;
    case "90d":
      numDays = 90;
      break;
    case "all":
      numDays = fullTimeline.length;
      break;
  }

  const days = fullTimeline.slice(-numDays);
  const visitsInRange = days.reduce((sum, d) => sum + d.visits, 0);
  const signupsInRange = days.reduce((sum, d) => sum + d.signups, 0);
  const conversionRate =
    visitsInRange > 0 ? ((signupsInRange / visitsInRange) * 100).toFixed(1) + "%" : "0.0%";
  const avgVisitsPerDay = days.length > 0 ? visitsInRange / days.length : 0;

  const highest = Math.max(...days.map((d) => Math.max(d.visits, d.signups)), 1);
  const maxVal = getNiceMax(highest);

  let peakIndex = 0;
  for (let i = 1; i < days.length; i++) {
    if (days[i].visits > days[peakIndex].visits) {
      peakIndex = i;
    }
  }
  const peakDay = days[peakIndex] || null;

  const inRangeIsoDates = new Set(days.map((d) => d.isoDate));

  return {
    days,
    visitsInRange,
    signupsInRange,
    conversionRate,
    avgVisitsPerDay,
    peakIndex,
    peakDay,
    maxVal,
    inRangeIsoDates,
  };
}

export function isLeadInRange(
  lead: Lead,
  inRangeIsoDates: Set<string>,
  range: TimeRange
): boolean {
  if (range === "all") return true;
  const iso = parseDateToIso(lead.signedUpAt);
  if (!iso) return false;
  return inRangeIsoDates.has(iso);
}


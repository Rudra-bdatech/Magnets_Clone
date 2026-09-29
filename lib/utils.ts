export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Parses diverse date string formats safely into a valid JavaScript Date object.
 * Handles:
 * - ISO strings: "2026-09-24T16:38:00.000Z"
 * - US locale with "at": "Sep 24, 2026 at 4:38 PM" -> "Sep 24, 2026"
 * - Indian / UK / slash formats: "24/9/2026, 4:38:33 pm", "23/09/2025"
 * - Unix timestamps (numbers or strings)
 */
export function parseFlexibleDate(dateInput?: string | number | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  let str = String(dateInput).trim();
  if (!str) return null;

  // If numeric timestamp
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const d = new Date(num > 1e11 ? num : num * 1000);
    if (!isNaN(d.getTime())) return d;
  }

  // Remove " at " (e.g. "Sep 22, 2026 at 4:30 PM" -> "Sep 22, 2026 4:30 PM")
  const cleaned = str.replace(/\s+at\s+/i, " ").trim();

  // Try standard Date parsing
  const standard = new Date(cleaned);
  if (!isNaN(standard.getTime())) return standard;

  // Handle DD/MM/YYYY or DD-MM-YYYY formats (e.g., "24/9/2026, 4:38:33 pm" or "23/9/2026")
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(.*))?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(dmyMatch[3], 10);
    const timePart = dmyMatch[4];

    if (timePart) {
      const timeMatch = timePart.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        const meridian = timeMatch[4]?.toLowerCase();

        if (meridian === "pm" && hours < 12) hours += 12;
        if (meridian === "am" && hours === 12) hours = 0;

        const date = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(date.getTime())) return date;
      }
    }
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Standard date formatter for leads tables and lists (e.g. "Sep 24, 2026")
 */
export function formatDateOnly(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "";
  const d = parseFlexibleDate(dateInput);
  if (!d) return String(dateInput);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Date + time formatter for detailed views (e.g. "Sep 24, 2026, 4:38 PM")
 */
export function formatDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "";
  const d = parseFlexibleDate(dateInput);
  if (!d) return String(dateInput);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Relative time formatter for cards & widgets (e.g. "just now", "15m ago", "3h ago", "2d ago", "Sep 24")
 */
export function formatRelativeTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return "";
  const d = parseFlexibleDate(dateInput);
  if (!d) return String(dateInput);

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0 && diffMs > -60000) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Extracts a deterministic numerical timestamp for magnet pages, locked PDFs, or entities.
 * Hierarchy:
 * 1. Numeric timestamp embedded in the ID (e.g. page-1727521000000)
 * 2. parseFlexibleDate on updatedAt or createdAt (ISO strings, date strings)
 * 3. Fallback to standard Date or 0
 */
export function getMagnetSortTimestamp(item: { id?: string; updatedAt?: string; createdAt?: string }): number {
  if (!item) return 0;
  // 1. Check ID numeric timestamp (page-1727521...)
  if (item.id && typeof item.id === "string") {
    const match = item.id.match(/\d{10,13}/);
    if (match) {
      const num = Number(match[0]);
      if (!isNaN(num) && num > 1e11) return num;
    }
  }
  // 2. Parse updatedAt or createdAt
  const parsed = parseFlexibleDate(item.updatedAt || item.createdAt);
  if (parsed) return parsed.getTime();

  // 3. Fallback
  const d = new Date(item.updatedAt || item.createdAt || 0).getTime();
  return isNaN(d) ? 0 : d;
}

/**
 * Strips HTML tags and converts block elements into clean human-readable plain text
 */
export function htmlToPlainText(html?: string): string {
  if (!html) return "";
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;

  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}



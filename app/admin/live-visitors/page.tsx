"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Globe, RefreshCw, Monitor, Smartphone, Tablet,
  ChevronDown, X, Check, Wifi,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Visitor {
  _id?: string;
  ts: number;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  browser: string;
  os: string;
  device: string;
  referrer: string;
  page: string;
  createdAt: string;
}

interface Toast extends Visitor {
  toastId: string;
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e0 + c.charCodeAt(0) - 65)
  );
}

function timeAgo(ts: number | string): string {
  const diff = Date.now() - (typeof ts === "number" ? ts : new Date(ts).getTime());
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return secs <= 5 ? "just now" : `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DeviceIcon({ device }: { device: string }) {
  if (device === "Mobile") return <Smartphone className="w-3.5 h-3.5" />;
  if (device === "Tablet") return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function locationLabel(v: Visitor) {
  const parts = [v.city, v.country].filter(Boolean);
  return parts.join(", ") || "Unknown";
}

// ─── Filter Select ─────────────────────────────────────────────────────────
function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1C1C1F] px-3 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer select-none"
      >
        <span className="truncate max-w-[120px]">{value || placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 top-full mt-1.5 w-52 z-50 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-zinc-200/80 dark:border-white/10 p-1.5 shadow-xl max-h-64 overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${!value ? "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"}`}
            >
              <span>{placeholder}</span>
              {!value && <Check className="w-3 h-3" />}
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${value === opt ? "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"}`}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check className="w-3 h-3 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Toast Notification ─────────────────────────────────────────────────────
function VisitorToast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.toastId), 6000);
    return () => clearTimeout(t);
  }, [toast.toastId, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)] p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-emerald-200 dark:border-emerald-500/30 shadow-xl"
    >
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <span className="text-lg leading-none">
          {toast.countryCode ? countryFlag(toast.countryCode) : "🌐"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-900 dark:text-white">
          New visitor
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          {locationLabel(toast)} · {toast.browser} on {toast.os}
        </p>
        {toast.referrer && toast.referrer !== "direct" && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
            via {toast.referrer}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.toastId)}
        className="shrink-0 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function LiveVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [countryFilter, setCountryFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const esRef = useRef<EventSource | null>(null);

  // Fetch recent visitors from MongoDB
  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(countryFilter && { country: countryFilter }),
        ...(deviceFilter && { device: deviceFilter }),
      });
      const res = await fetch(`/api/visitor-log?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVisitors(data.visitors || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setCountries(data.countries || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, countryFilter, deviceFilter, refreshKey]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  // Auto-refresh table every 30 seconds
  useEffect(() => {
    const t = setInterval(() => setRefreshKey((k) => k + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // SSE connection for live notifications
  useEffect(() => {
    const es = new EventSource("/api/visitor-stream");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const v: Visitor = JSON.parse(e.data);
        const toastId = `${v.ts}-${Math.random()}`;
        setToasts((prev) => [{ ...v, toastId }, ...prev.slice(0, 4)]);
        setLiveCount((c) => c + 1);
        // Prepend to table if no filters active
        setVisitors((prev) => [v, ...prev].slice(0, 50));
        setTotal((t) => t + 1);
      } catch {}
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  // Reset live count every 5 minutes
  useEffect(() => {
    const t = setInterval(() => setLiveCount(0), 5 * 60_000);
    return () => clearInterval(t);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== id));
  }, []);

  const DEVICE_OPTIONS = ["Desktop", "Mobile", "Tablet"];

  return (
    <>
      {/* Toast Stack — fixed top-right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.toastId} className="pointer-events-auto">
              <VisitorToast toast={t} onDismiss={dismissToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Live Visitors
                </h1>
                {/* Live connection dot */}
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${connected ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"}`}>
                  <span className={`relative flex h-1.5 w-1.5 ${connected ? "" : "opacity-50"}`}>
                    {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? "bg-emerald-500" : "bg-zinc-400"}`} />
                  </span>
                  {connected ? "Live" : "Connecting…"}
                </span>
                {/* Total count badge */}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/30">
                  {total.toLocaleString()} total
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Anonymous visitors on your landing page — no permission needed
              </p>
            </div>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171717] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Live-in-last-5-min stat strip */}
        {liveCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
          >
            <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {liveCount} new visitor{liveCount !== 1 ? "s" : ""} since you opened this page
            </p>
          </motion.div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <FilterSelect
            value={countryFilter}
            placeholder="All Countries"
            options={countries}
            onChange={(v) => { setCountryFilter(v); setPage(1); }}
          />
          <FilterSelect
            value={deviceFilter}
            placeholder="All Devices"
            options={DEVICE_OPTIONS}
            onChange={(v) => { setDeviceFilter(v); setPage(1); }}
          />
          {(countryFilter || deviceFilter) && (
            <button
              type="button"
              onClick={() => { setCountryFilter(""); setDeviceFilter(""); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Visitors Table */}
        <div className="bg-white/90 dark:bg-[#171717] border border-zinc-200/60 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-md dark:shadow-none">
          {loading ? (
            <div className="p-4 sm:p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : visitors.length === 0 ? (
            <div className="py-20 text-center px-4">
              <Globe className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No visitors yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Visitors will appear here as soon as someone lands on your landing page.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/[0.05]">
                      {["Time", "Location", "Browser", "OS", "Device", "Referrer", "Page"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100/80 dark:divide-white/[0.04]">
                    {visitors.map((v, i) => (
                      <tr key={v._id || `${v.ts}-${i}`} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                          {timeAgo(v.ts || v.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5">
                            <span className="text-base leading-none shrink-0">
                              {v.countryCode ? countryFlag(v.countryCode) : "🌐"}
                            </span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[160px]">
                              {locationLabel(v)}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">{v.browser}</td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">{v.os}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                            <DeviceIcon device={v.device} />
                            {v.device}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${v.referrer === "direct" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"}`}>
                            {v.referrer || "direct"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-500 font-mono">{v.page}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
                {visitors.map((v, i) => (
                  <div key={v._id || `${v.ts}-${i}`} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="text-lg leading-none">
                          {v.countryCode ? countryFlag(v.countryCode) : "🌐"}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[180px]">
                          {locationLabel(v)}
                        </span>
                      </span>
                      <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">
                        {timeAgo(v.ts || v.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1"><DeviceIcon device={v.device} />{v.device}</span>
                      <span>{v.browser}</span>
                      <span>{v.os}</span>
                      {v.referrer && v.referrer !== "direct" && (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          via {v.referrer}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 dark:border-white/[0.05]">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Page {page} of {pages} · {total.toLocaleString()} visitors
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200/80 dark:border-white/10 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-white/5 transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={page >= pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200/80 dark:border-white/10 disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-white/5 transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

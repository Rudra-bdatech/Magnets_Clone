"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  Calendar,
  Users,
  CheckCircle2,
  CreditCard,
  Shield,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ApplePagination } from "@/components/ui/ApplePagination";

interface AdminUser {
  email: string;
  name: string;
  plan: string;
  role: string;
  suspended?: boolean;
  paymentStatus: string;
  paymentProvider: string;
  emailVerified: boolean;
  joinedAt: string;
  customDomain: string;
  linkedinConnected: boolean;
  gmailConnected: boolean;
  smtpConnected: boolean;
  hasPaidSubscription: boolean;
  magnetCount: number;
  leadCount: number;
  storageBytes: number;
  signupCountry?: string;
  signupCountryCode?: string;
  signupCity?: string;
  signupRegion?: string;
  signupIp?: string;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const PLANS = ["Free", "Pro"];
const ROLES = ["user", "super_admin"];

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
  Pro: "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]",
};

const ROLE_COLORS: Record<string, string> = {
  user: "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400",
  super_admin: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

interface PendingChange {
  email: string;
  name: string;
  field: "plan" | "role";
  from: string;
  to: string;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

/** Pill-style dropdown used inside each table row for Plan / Role */
function RowSelect({
  value,
  options,
  colorMap,
  onChange,
  disabled,
  title = "Select Option",
}: {
  value: string;
  options: string[];
  colorMap: Record<string, string>;
  onChange: (v: string) => void;
  disabled?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    openUpward: boolean;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dropdownHeight = options.length * 38 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 150));

    if (openUpward) {
      setCoords({
        bottom: window.innerHeight - rect.top + 6,
        left,
        openUpward: true,
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        openUpward: false,
      });
    }
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (popoverRef.current && popoverRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) {
      updatePosition();
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className={`relative inline-block ${open ? "z-50" : "z-10"}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-95 ${colorMap[value] || "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"}`}
      >
        {value}
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Desktop Anchored Popover (sm:) - Portaled to document.body so it NEVER gets clipped by table overflow */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && coords && (
            <div className="hidden sm:block">
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.95, y: coords.openUpward ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: coords.openUpward ? 4 : -4 }}
                transition={{ type: "spring", damping: 28, stiffness: 450 }}
                style={{
                  position: "fixed",
                  left: coords.left,
                  top: coords.top !== undefined ? coords.top : undefined,
                  bottom: coords.bottom !== undefined ? coords.bottom : undefined,
                  transformOrigin: coords.openUpward ? "bottom left" : "top left",
                }}
                className="z-[100] min-w-[130px] rounded-xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#1C1C1F]/95 p-1 shadow-2xl backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                      value === opt
                        ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5 active:bg-zinc-200/60 dark:active:bg-white/10"
                    }`}
                  >
                    <span>{opt}</span>
                    {value === opt && <Check className="w-3.5 h-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                  </button>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Mobile Bottom Sheet (portaled directly to document.body so it pops up from bottom of device screen) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <div className="sm:hidden fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
              {/* Dimmed Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              />

              {/* Bottom Sheet Card */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative z-10 w-full rounded-t-3xl bg-white dark:bg-[#1C1C1F] border-t border-zinc-200 dark:border-white/10 p-5 pb-8 shadow-2xl overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pull grab handle */}
                <div className="w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />

                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-white/[0.08]">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Select an option to update</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Options List */}
                <div className="space-y-1.5">
                  {options.map((opt) => {
                    const isSelected = value === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(opt);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-sm font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#0066B2]/10 border-[#0066B2]/30 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:border-[#38BDF8]/30 dark:text-[#38BDF8]"
                            : "border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-[0.99]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorMap[opt] || "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"}`}>
                            {opt}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] flex items-center justify-center text-white shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

/** Filter dropdown used in the top toolbar for All Plans / All Roles */
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
  const [openUpward, setOpenUpward] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 180);
    }
    setOpen((v) => !v);
  };

  const label = value || placeholder;

  return (
    <div ref={ref} className={`relative shrink-0 w-full sm:w-auto ${open ? "z-50" : "z-10"}`}>
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full sm:w-auto flex h-9 items-center justify-between sm:justify-start gap-1.5 sm:gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer select-none active:scale-[0.98]"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Desktop Popover (hidden sm:block) */}
      <AnimatePresence>
        {open && (
          <div className="hidden sm:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: openUpward ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: openUpward ? 4 : -4 }}
              transition={{ type: "spring", damping: 28, stiffness: 450 }}
              style={{ transformOrigin: openUpward ? "bottom left" : "top left" }}
              className={`absolute left-0 sm:left-auto sm:right-0 z-50 min-w-[140px] w-full sm:w-auto rounded-xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#1C1C1F]/95 p-1 shadow-2xl backdrop-blur-xl ${
                openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
              }`}
            >
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                  !value
                    ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5 active:bg-zinc-200/60 dark:active:bg-white/10"
                }`}
              >
                <span>{placeholder}</span>
                {!value && <Check className="w-3.5 h-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                    value === opt
                      ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5 active:bg-zinc-200/60 dark:active:bg-white/10"
                  }`}
                >
                  <span>{opt}</span>
                  {value === opt && <Check className="w-3.5 h-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                </button>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet (portaled to document.body) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <div className="sm:hidden fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative z-10 w-full rounded-t-3xl bg-white dark:bg-[#1C1C1F] border-t border-zinc-200 dark:border-white/10 p-5 pb-8 shadow-2xl overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />

                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-white/[0.08]">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{placeholder}</h3>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { onChange(""); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-sm font-semibold transition-all cursor-pointer border ${
                      !value
                        ? "bg-[#0066B2]/10 border-[#0066B2]/30 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:border-[#38BDF8]/30 dark:text-[#38BDF8]"
                        : "border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{placeholder}</span>
                    {!value && <Check className="w-4 h-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                  </button>
                  {options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { onChange(opt); setOpen(false); }}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-sm font-semibold transition-all cursor-pointer border ${
                        value === opt
                          ? "bg-[#0066B2]/10 border-[#0066B2]/30 text-[#0066B2] dark:bg-[#38BDF8]/15 dark:border-[#38BDF8]/30 dark:text-[#38BDF8]"
                          : "border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{opt}</span>
                      {value === opt && <Check className="w-4 h-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

const DATE_PRESETS = [
  { value: "", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

/** Date range filter dropdown with quick presets and custom start/end date inputs */
function DateRangeFilter({
  dateRange,
  startDate,
  endDate,
  onChange,
}: {
  dateRange: string;
  startDate: string;
  endDate: string;
  onChange: (range: string, start?: string, end?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate, open]);

  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  // Compute button label
  let displayLabel = "All Time";
  if (dateRange === "7d") displayLabel = "Last 7 Days";
  else if (dateRange === "30d") displayLabel = "Last 30 Days";
  else if (dateRange === "90d") displayLabel = "Last 90 Days";
  else if (dateRange === "custom" && (startDate || endDate)) {
    const s = startDate ? new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    const e = endDate ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    displayLabel = s && e ? `${s} – ${e}` : s ? `From ${s}` : `Until ${e}`;
  }

  const isFiltered = Boolean(dateRange);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={isFiltered ? `Date: ${displayLabel}` : "Filter by date"}
        className={`flex h-9 items-center justify-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3 text-xs sm:text-sm font-medium transition shadow-xs cursor-pointer select-none shrink-0 ${
          isFiltered
            ? "border-[#0066B2]/40 bg-[#0066B2]/10 text-[#0066B2] dark:border-[#38BDF8]/40 dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
            : "border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
        }`}
      >
        <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        {isFiltered && (
          <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-[#0066B2] dark:bg-[#38BDF8] shrink-0" />
        )}
        <span className="hidden sm:inline truncate max-w-[130px] sm:max-w-none">{displayLabel}</span>
        {isFiltered ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("", "", "");
              setOpen(false);
            }}
            className="hidden sm:inline-flex rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 ml-0.5"
            title="Clear date filter"
          >
            <X className="w-3 h-3 text-current" />
          </span>
        ) : (
          <ChevronDown
            className={`hidden sm:inline-block w-3.5 h-3.5 text-zinc-400 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Desktop Anchored Popover (sm:) */}
      <AnimatePresence>
        {open && (
          <div className="hidden sm:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ type: "spring", damping: 28, stiffness: 400 }}
              style={{ transformOrigin: "top right" }}
              className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95"
            >
              {/* Quick Presets */}
              <div className="space-y-0.5">
                {DATE_PRESETS.map((preset) => {
                  const active = dateRange === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        onChange(preset.value, "", "");
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{preset.label}</span>
                      {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Range Section */}
              <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-white/[0.08]">
                <div className="px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Custom Range
                </div>

                <div className="space-y-2 px-1">
                  <div>
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-0.5 font-medium">
                      From
                    </label>
                    <input
                      type="date"
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-0.5 font-medium">
                      To
                    </label>
                    <input
                      type="date"
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!tempStart && !tempEnd}
                      onClick={() => {
                        if (!tempStart && !tempEnd) return;
                        onChange("custom", tempStart, tempEnd);
                        setOpen(false);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-[#0066B2] text-white text-xs font-semibold hover:bg-[#005596] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Apply Range
                    </button>
                    {dateRange === "custom" && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange("", "", "");
                          setOpen(false);
                        }}
                        className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet (portaled to document.body) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <div className="sm:hidden fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative z-10 w-full rounded-t-3xl bg-white dark:bg-[#1C1C1F] border-t border-zinc-200 dark:border-white/10 p-4 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100 dark:border-white/[0.08] px-1">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    Filter by Date
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Presets */}
                <div className="space-y-1">
                  {DATE_PRESETS.map((preset) => {
                    const active = dateRange === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          onChange(preset.value, "", "");
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors cursor-pointer ${
                          active
                            ? "bg-[#0066B2]/10 text-[#0066B2] font-semibold dark:bg-[#38BDF8]/15 dark:text-[#38BDF8]"
                            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                        }`}
                      >
                        <span>{preset.label}</span>
                        {active && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Range Section */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.08]">
                  <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">
                    Custom Range
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">
                        From
                      </label>
                      <input
                        type="date"
                        value={tempStart}
                        onChange={(e) => setTempStart(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">
                        To
                      </label>
                      <input
                        type="date"
                        value={tempEnd}
                        onChange={(e) => setTempEnd(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066B2] dark:[color-scheme:dark]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!tempStart && !tempEnd}
                        onClick={() => {
                          if (!tempStart && !tempEnd) return;
                          onChange("custom", tempStart, tempEnd);
                          setOpen(false);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#0066B2] text-white text-sm font-semibold hover:bg-[#005596] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Apply Range
                      </button>
                      {dateRange === "custom" && (
                        <button
                          type="button"
                          onClick={() => {
                            onChange("", "", "");
                            setOpen(false);
                          }}
                          className="py-2.5 px-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [summary, setSummary] = useState<{
    totalAccounts: number;
    verifiedCount: number;
    paidCount: number;
    adminCount: number;
  }>({
    totalAccounts: 0,
    verifiedCount: 0,
    paidCount: 0,
    adminCount: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [onlineCount, setOnlineCount] = useState<number>(0);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch("/api/user-presence");
      if (!res.ok) return;
      const data = await res.json();
      setOnlineUsers(new Set((data.online || []).map((e: string) => String(e).toLowerCase())));
      setOnlineCount(data.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 15_000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pending && typeof window !== "undefined" && window.innerWidth < 640) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [pending]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
        ...(planFilter && { plan: planFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(dateFilter && { dateRange: dateFilter }),
        ...(customStartDate && { startDate: customStartDate }),
        ...(customEndDate && { endDate: customEndDate }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch {
      setError("Could not load users. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter, roleFilter, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers, search]);

  function requestChange(user: AdminUser, field: "plan" | "role", to: string) {
    const from = field === "plan" ? user.plan : user.role;
    if (from === to) return;
    setPending({ email: user.email, name: user.name, field, from, to });
  }

  async function confirmChange() {
    if (!pending) return;
    const { email, field, to } = pending;
    setPending(null);
    setUpdating(email);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.email === email
            ? { ...u, plan: data.plan ?? u.plan, role: data.role ?? u.role }
            : u
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto touch-pan-y">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Users</h1>
          {onlineCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {onlineCount} active now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200/60 dark:border-zinc-700/30">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              0 active
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C1F] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          title="Refresh users"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? "animate-spin text-[#0066B2] dark:text-[#38BDF8]" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* KPI Glance Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        {/* Total Accounts */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Total Accounts
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-mono tabular-nums mt-0.5">
              {(summary.totalAccounts || total).toLocaleString()}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Verified Accounts */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Verified Users
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{summary.verifiedCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Paid / Pro Users */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              Paid Subscriptions
            </div>
            <div className="text-base sm:text-lg font-bold text-[#0066B2] dark:text-[#38BDF8] font-mono tabular-nums mt-0.5">
              {summary.paidCount.toLocaleString()}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#0066B2]/10 dark:bg-[#38BDF8]/15 flex items-center justify-center text-[#0066B2] dark:text-[#38BDF8] shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        {/* Admins & Staff */}
        <div className="bg-white/90 dark:bg-[#171717] rounded-2xl border border-[#0066B2]/15 dark:border-white/[0.08] p-3 sm:p-4 shadow-md dark:shadow-none backdrop-blur-sm flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">
              <span className="sm:hidden">Super Admins</span>
              <span className="hidden sm:inline">Admins & Staff</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 font-mono tabular-nums mt-0.5">
              {summary.adminCount.toLocaleString()}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-red-500/10 dark:bg-red-500/15 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1C1C1F] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#0066B2] focus:border-transparent shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none min-w-0">
            <FilterSelect
              value={planFilter}
              placeholder="All Plans"
              options={PLANS}
              onChange={(v) => { setPlanFilter(v); setPage(1); }}
            />
          </div>

          <div className="flex-1 sm:flex-none min-w-0">
            <FilterSelect
              value={roleFilter}
              placeholder="All Roles"
              options={ROLES}
              onChange={(v) => { setRoleFilter(v); setPage(1); }}
            />
          </div>

          <DateRangeFilter
            dateRange={dateFilter}
            startDate={customStartDate}
            endDate={customEndDate}
            onChange={(range, start, end) => {
              setDateFilter(range);
              setCustomStartDate(start || "");
              setCustomEndDate(end || "");
              setPage(1);
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table & Mobile Card List */}
      <div className="bg-white/90 dark:bg-[#171717] border border-[#0066B2]/15 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-md dark:shadow-none backdrop-blur-sm">
        {/* Mobile Card List (md:hidden) - Full width, zero horizontal scrolling */}
        <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/[0.06]">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/5 animate-pulse shrink-0" />
                    <div className="space-y-1.5">
                      <div className="w-28 h-4 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" />
                      <div className="w-36 h-3 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-14 h-6 bg-zinc-100 dark:bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="h-14 bg-zinc-50 dark:bg-white/[0.02] rounded-xl animate-pulse" />
                <div className="flex justify-between items-center pt-0.5">
                  <div className="flex gap-2">
                    <div className="w-16 h-6 bg-zinc-100 dark:bg-white/5 rounded-full animate-pulse" />
                    <div className="w-16 h-6 bg-zinc-100 dark:bg-white/5 rounded-full animate-pulse" />
                  </div>
                  <div className="w-16 h-3 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.email}
                onClick={() => router.push(`/admin/users/${encodeURIComponent(user.email)}`)}
                className="p-3.5 hover:bg-[#F0F7FF]/50 dark:hover:bg-white/[0.02] active:bg-[#E2F0FD]/60 dark:active:bg-white/[0.04] transition-colors cursor-pointer space-y-2.5 touch-pan-y"
              >
                {/* Top Row: User Identity Header + Quick Inspect */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-white/10 dark:to-white/5 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200/60 dark:border-white/10 shadow-xs">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                      </div>
                      {onlineUsers.has(user.email.toLowerCase()) && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5" title="Active in dashboard right now">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-[#171717]" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                          {user.name || "Unnamed"}
                        </span>
                        {onlineUsers.has(user.email.toLowerCase()) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30">
                            Active
                          </span>
                        )}
                        {user.emailVerified ? (
                          <span title="Verified email">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </span>
                        ) : (
                          <span title="Unverified email">
                            <X className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          </span>
                        )}
                        {user.suspended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 shrink-0">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/users/${encodeURIComponent(user.email)}`);
                    }}
                    className="flex items-center gap-0.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] hover:bg-[#0066B2] hover:text-white dark:hover:bg-[#0066B2] dark:hover:text-white transition-colors shrink-0"
                  >
                    Inspect
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Middle Row: 3-Metric Clean Snapshot */}
                <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.05] text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                      Leads
                    </div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {user.leadCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="border-x border-zinc-200/60 dark:border-white/10">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                      Funnels
                    </div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {user.magnetCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                      Storage
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${
                        user.storageBytes > 500 * 1024 * 1024
                          ? "text-red-600 dark:text-red-400"
                          : user.storageBytes > 100 * 1024 * 1024
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {formatBytes(user.storageBytes)}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Controls (Plan & Role) + Joined Date */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <RowSelect
                      value={user.plan}
                      options={PLANS}
                      colorMap={PLAN_COLORS}
                      disabled={updating === user.email}
                      title={`Change Plan for ${user.name || user.email}`}
                      onChange={(v) => requestChange(user, "plan", v)}
                    />
                    <RowSelect
                      value={user.role}
                      options={ROLES}
                      colorMap={ROLE_COLORS}
                      disabled={updating === user.email}
                      title={`Change Role for ${user.name || user.email}`}
                      onChange={(v) => requestChange(user, "role", v)}
                    />
                  </div>

                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                    {user.joinedAt
                      ? new Date(user.joinedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-white/[0.06] bg-zinc-50/80 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Role</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Leads</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Funnels</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Storage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Verified</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.email}
                    className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(user.email)}`)}
                        className="flex items-center gap-2.5 cursor-pointer group w-fit"
                      >
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066B2]/15 to-[#0066B2]/5 dark:from-[#38BDF8]/20 dark:to-[#38BDF8]/5 text-[#0066B2] dark:text-[#38BDF8] font-bold text-xs flex items-center justify-center border border-[#0066B2]/20 dark:border-[#38BDF8]/20 shadow-xs group-hover:scale-105 transition-transform">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          {onlineUsers.has(user.email.toLowerCase()) && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5" title="Active in dashboard right now">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-[#171717]" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="font-medium text-zinc-900 dark:text-white truncate max-w-48 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">{user.name}</div>
                            {onlineUsers.has(user.email.toLowerCase()) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30">
                                Active
                              </span>
                            )}
                            {user.suspended && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 shrink-0">
                                Suspended
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-48">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <RowSelect
                        value={user.plan}
                        options={PLANS}
                        colorMap={PLAN_COLORS}
                        disabled={updating === user.email}
                        title="Change Plan"
                        onChange={(v) => requestChange(user, "plan", v)}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <RowSelect
                        value={user.role}
                        options={ROLES}
                        colorMap={ROLE_COLORS}
                        disabled={updating === user.email}
                        title="Change Role"
                        onChange={(v) => requestChange(user, "role", v)}
                      />
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {user.leadCount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {user.magnetCount}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold ${user.storageBytes > 500 * 1024 * 1024 ? "text-red-600 dark:text-red-400" : user.storageBytes > 100 * 1024 * 1024 ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {formatBytes(user.storageBytes)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap text-xs">
                      {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {user.emailVerified ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/admin/users/${encodeURIComponent(user.email)}`)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] hover:bg-[#0066B2] hover:text-white dark:hover:bg-[#0066B2] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 25 && (
          <ApplePagination
            currentPage={page}
            totalPages={pages}
            totalItems={total}
            pageSize={25}
            onPageChange={(p) => setPage(p)}
            itemLabel="user"
            itemLabelPlural="users"
            className="rounded-t-none rounded-b-2xl border-t border-b-0 border-x-0 bg-zinc-50/60 dark:bg-white/[0.02]"
          />
        )}
      </div>

      {/* Confirmation modal - Adaptive Bottom Sheet on Mobile, Centered Modal on Desktop */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {pending && (
            <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
              {/* Dimmed Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setPending(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ y: "100%", opacity: 0.8 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative z-10 bg-white dark:bg-[#1C1C1F] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-md p-5 pb-8 sm:p-6 border-t sm:border border-zinc-200 dark:border-white/10"
              >
                <div className="sm:hidden w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mb-3" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Confirm Change</h2>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  You are about to change <span className="font-medium text-zinc-900 dark:text-white">{pending.name}</span>
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
                  {pending.field === "plan" ? "Plan" : "Role"}:{" "}
                  <span className="font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded text-xs">{pending.from}</span>
                  {" → "}
                  <span className="font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded text-xs">{pending.to}</span>
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">This action will be recorded in the audit log.</p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmChange}
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#0066B2] text-white rounded-xl hover:bg-[#005291] transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
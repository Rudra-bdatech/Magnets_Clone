"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useTransform,
  useAnimationControls,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import { createPortal } from "react-dom";
import {
  Bell, X, Check, ChevronUp, UserPlus, ShieldCheck, ShieldOff, ShieldAlert,
  TrendingUp, TrendingDown, AlertCircle, UserX, ArrowLeftRight, Key, Trash2,
  type LucideIcon,
} from "lucide-react";

export interface AdminNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: LucideIcon;
  type?: string;
}

// UIKit spring (response 0.35, dampingRatio 0.86) converted to stiffness/damping.
const SPRING = { type: "spring", stiffness: 322, damping: 31, mass: 1 } as const;
// Apple iOS/macOS fluid rubber-band stack spring: snappy launch with playful, elastic rubber overshoot & settle
const APPLE_STACK_SPRING = { type: "spring", stiffness: 350, damping: 19, mass: 0.75 } as const;
// iOS sheet spring: critically damped (bounce: 0) to glide down and land flush at the bottom with zero overshoot or constraint jitter
const SHEET_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
  bounce: 0,
  restDelta: 0.5,
  restSpeed: 0.5,
} as const;
const IOS_EASE = [0.32, 0.72, 0, 1] as const;
const FLING = { type: "tween", duration: 0.24, ease: IOS_EASE } as const;

// Apple Notification Card: 100% opaque fill, crisp perimeter border, and realistic layered drop shadow.
const GLASS_CARD =
  "bg-white border border-black/[0.08] shadow-[0_5px_15px_-2px_rgba(0,0,0,0.12),0_2px_5px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] dark:bg-[#1c1c1e] dark:border-white/[0.12] dark:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.7),0_2px_6px_-1px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]";
const GLASS_PILL =
  "bg-white text-zinc-700 border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] hover:bg-zinc-50 hover:text-zinc-900 dark:bg-[#2c2c2e] dark:text-zinc-200 dark:border-white/10 dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] dark:hover:bg-[#3a3a3c] dark:hover:text-white";
const APPLE_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';

const ACTION_W = 74;
const ACTION_GAP = 8;
const REVEAL = ACTION_W * 2 + ACTION_GAP * 2;

function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch { }
}

interface TypeConfig {
  icon: LucideIcon;
  gradient: string;
  shadow: string;
}

export const NOTIF_TYPE_CONFIG: Record<string, TypeConfig> = {
  // Destructive (Crimson / Rose)
  account_delete: {
    icon: UserX,
    gradient: "from-rose-500 via-rose-600 to-red-600",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(225,29,72,0.35)]",
  },
  funnel_delete: {
    icon: Trash2,
    gradient: "from-rose-500 via-red-500 to-red-600",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(239,68,68,0.35)]",
  },
  payment_failed: {
    icon: AlertCircle,
    gradient: "from-red-500 via-rose-600 to-pink-600",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(225,29,72,0.35)]",
  },

  // Security Hold (Warm Amber / Orange)
  suspended: {
    icon: ShieldOff,
    gradient: "from-amber-400 via-amber-500 to-orange-500",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(245,158,11,0.35)]",
  },

  // Recovery / Reactivation (Fresh Emerald / Teal)
  unsuspended: {
    icon: ShieldCheck, // Restored: Checkmark shield instead of alert shield!
    gradient: "from-emerald-400 via-emerald-500 to-teal-600",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(16,185,129,0.35)]",
  },
  verified: {
    icon: ShieldCheck,
    gradient: "from-teal-400 via-emerald-500 to-green-600",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(20,184,166,0.35)]",
  },

  // Growth & Upgrades (Royal Violet / Purple)
  upgrade: {
    icon: TrendingUp,
    gradient: "from-violet-500 via-purple-600 to-indigo-600",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(139,92,246,0.35)]",
  },

  // Identity & Platform (Signature Blue)
  signup: {
    icon: UserPlus,
    gradient: "from-sky-400 via-[#1A85D6] to-[#0066B2]",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(0,102,178,0.35)]",
  },
  plan_change: {
    icon: ArrowLeftRight,
    gradient: "from-blue-500 via-cyan-600 to-teal-600",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(6,182,212,0.35)]",
  },
  role_change: {
    icon: Key,
    gradient: "from-indigo-500 via-indigo-600 to-blue-700",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(99,102,241,0.35)]",
  },

  // Downgrades & Cancellations (Neutral Slate)
  cancelled: {
    icon: TrendingDown,
    gradient: "from-zinc-500 via-zinc-600 to-zinc-700",
    shadow: "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.25)]",
  },
};

// Map API notification type → lucide icon
const TYPE_ICON: Record<string, LucideIcon> = {
  signup:         UserPlus,
  verified:       ShieldCheck,
  suspended:      ShieldOff,
  unsuspended:    ShieldCheck,
  upgrade:        TrendingUp,
  cancelled:      TrendingDown,
  payment_failed: AlertCircle,
  account_delete: UserX,
  plan_change:    ArrowLeftRight,
  role_change:    Key,
  funnel_delete:  Trash2,
};

function relativeTime(isoTs: string): string {
  const diff = Date.now() - new Date(isoTs).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const LS_DISMISSED = "admin_notif_dismissed_v1";
const LS_READ = "admin_notif_read_v1";

function lsGet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function lsAdd(key: string, id: string) {
  try {
    const s = lsGet(key);
    s.add(id);
    // Keep at most 500 IDs so localStorage never bloats
    const arr = Array.from(s).slice(-500);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch { }
}

function lsAddMany(key: string, ids: string[]) {
  try {
    const s = lsGet(key);
    ids.forEach((id) => s.add(id));
    const arr = Array.from(s).slice(-500);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch { }
}

// Fire-and-forget: persist read/dismissed IDs to DB via PATCH
function persistToServer(readIds: string[], dismissedIds: string[]) {
  if (!readIds.length && !dismissedIds.length) return;
  fetch("/api/admin/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ readIds, dismissedIds }),
  }).catch(() => {});
}

export function useNotificationCenter(initial: AdminNotification[]) {
  const [notifications, setNotifications] = useState(initial);
  const [clearing, setClearing] = useState(false);
  const timers = useRef<number[]>([]);
  // Hydrate dismissed & seen sets from localStorage on first render (fast, optimistic).
  const dismissed = useRef<Set<string>>(lsGet(LS_DISMISSED));
  const readIds = useRef<Set<string>>(lsGet(LS_READ));
  // seenIds: superset of dismissed + read — prevents re-marking as unread on poll.
  const seenIds = useRef<Set<string>>(new Set([
    ...Array.from(dismissed.current),
    ...Array.from(readIds.current),
    ...initial.map((n) => n.id),
  ]));
  // Tracks whether we've attempted the one-time localStorage → DB migration.
  const migrationDone = useRef(false);
  // Tracks whether we've synced DB state to localStorage (only needed once per session).
  const dbStateSynced = useRef(false);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = useCallback(
    () => setNotifications((p) => {
      const ids = p.map((n) => n.id);
      lsAddMany(LS_READ, ids);
      ids.forEach((id) => readIds.current.add(id));
      persistToServer(ids, []);
      return p.map((n) => ({ ...n, unread: false }));
    }),
    []
  );
  const markRead = useCallback(
    (id: string) => {
      lsAdd(LS_READ, id);
      readIds.current.add(id);
      persistToServer([id], []);
      setNotifications((p) => p.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    },
    []
  );
  // Fix: persist to localStorage (and DB) when toggling to read via iOS swipe action.
  const toggleRead = useCallback(
    (id: string) => setNotifications((p) => p.map((n) => {
      if (n.id !== id) return n;
      if (n.unread) {
        // Becoming read — persist it.
        lsAdd(LS_READ, id);
        readIds.current.add(id);
        persistToServer([id], []);
      }
      return { ...n, unread: !n.unread };
    })),
    []
  );
  const dismiss = useCallback((id: string) => {
    dismissed.current.add(id);
    lsAdd(LS_DISMISSED, id);
    persistToServer([], [id]);
    setNotifications((p) => p.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    if (clearing) return;
    const ids = notifications.map((n) => n.id);
    if (!ids.length) return;
    haptic(12);
    ids.forEach((id) => dismissed.current.add(id));
    lsAddMany(LS_DISMISSED, ids);
    persistToServer([], ids);
    setClearing(true);
    ids.forEach((id, i) => {
      timers.current.push(
        window.setTimeout(() => setNotifications((p) => p.filter((n) => n.id !== id)), i * 55)
      );
    });
    timers.current.push(window.setTimeout(() => setClearing(false), ids.length * 55 + 600));
  }, [clearing, notifications]);

  // Apply DB state (readIds + dismissedIds) returned from the API into our in-memory refs.
  // DB is authoritative; localStorage is the fast optimistic cache.
  const applyDbState = useCallback((dbRead: string[], dbDismissed: string[]) => {
    dbRead.forEach((id) => { readIds.current.add(id); seenIds.current.add(id); });
    dbDismissed.forEach((id) => { dismissed.current.add(id); seenIds.current.add(id); });
    // Sync to localStorage only once per session — not on every 60s poll — to avoid churn.
    if (!dbStateSynced.current) {
      dbStateSynced.current = true;
      if (dbRead.length)      lsAddMany(LS_READ, dbRead);
      if (dbDismissed.length) lsAddMany(LS_DISMISSED, dbDismissed);
    }
  }, []);

  // One-time migration: if the DB has no state yet but localStorage does, push it up.
  const migrateIfNeeded = useCallback((dbRead: string[], dbDismissed: string[]) => {
    if (migrationDone.current) return;
    migrationDone.current = true;
    if (dbRead.length > 0 || dbDismissed.length > 0) return; // DB already has data
    const lsR = Array.from(lsGet(LS_READ));
    const lsD = Array.from(lsGet(LS_DISMISSED));
    if (lsR.length || lsD.length) persistToServer(lsR, lsD);
  }, []);

  // Merge fresh notifications from the API without touching dismissed or already-seen ones.
  const mergeFromApi = useCallback((fresh: Array<{
    id: string; type: string; title: string; desc: string; ts: string;
  }>) => {
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const incoming: AdminNotification[] = [];
      for (const f of fresh) {
        if (dismissed.current.has(f.id)) continue;
        if (existingIds.has(f.id)) continue;
        const isNew = !seenIds.current.has(f.id);
        seenIds.current.add(f.id);
        incoming.push({
          id: f.id,
          title: f.title,
          desc: f.desc,
          time: relativeTime(f.ts),
          unread: isNew,
          icon: NOTIF_TYPE_CONFIG[f.type]?.icon ?? TYPE_ICON[f.type] ?? UserPlus,
          type: f.type,
        });
      }
      if (!incoming.length) return prev;
      // Prepend newest, keep total ≤ 40
      return [...incoming, ...prev].slice(0, 40);
    });
  }, []);

  // Poll every 60 s. First poll also syncs DB state and runs migration.
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/admin/notifications");
        if (!res.ok || !alive) return;
        const data = await res.json();
        const dbRead: string[]      = Array.isArray(data.readIds)      ? data.readIds      : [];
        const dbDismissed: string[] = Array.isArray(data.dismissedIds) ? data.dismissedIds : [];
        // Apply DB state before merging notifications so dismissed/read is accurate.
        applyDbState(dbRead, dbDismissed);
        migrateIfNeeded(dbRead, dbDismissed);
        if (Array.isArray(data.notifications)) mergeFromApi(data.notifications);
      } catch { }
    };
    poll(); // immediate first load
    const id = window.setInterval(poll, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [mergeFromApi, applyDbState, migrateIfNeeded]);


  return { notifications, unreadCount, clearing, markAllRead, markRead, toggleRead, dismiss, clearAll };
}

export type NotificationCenter = ReturnType<typeof useNotificationCenter>;

/* ───────────────────────── Bell ───────────────────────── */

export function NotificationBell({
  count,
  onClick,
  className,
  iconClassName,
}: {
  count: number;
  onClick: () => void;
  className?: string;
  iconClassName?: string;
}) {
  const controls = useAnimationControls();
  const prev = useRef(0);

  useEffect(() => {
    if (count > prev.current) {
      controls.start({
        rotate: [0, 16, -14, 10, -7, 3, 0],
        transition: { duration: 0.75, ease: "easeInOut", delay: 0.15 },
      });
    }
    prev.current = count;
  }, [count, controls]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
      title="Notifications"
      className={className}
    >
      <motion.span animate={controls} style={{ originY: 0.15 }} className="inline-flex">
        <Bell className={iconClassName} strokeWidth={2} />
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 22 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center overflow-hidden rounded-full bg-[#FF3B30] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-[#0a0a0a]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={SPRING}
              >
                {count > 9 ? "9+" : count}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ───────────────────── Shared pieces ───────────────────── */

function ClearAllButton({
  onClear,
  className,
  size = "md",
}: {
  onClear: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <motion.button
      type="button"
      layout
      transition={SPRING}
      style={{ borderRadius: 999 }}
      aria-label={armed ? "Confirm clear all notifications" : "Clear all notifications"}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) {
          setArmed(false);
          onClear();
        } else {
          haptic(6);
          setArmed(true);
        }
      }}
      className={`flex items-center justify-center overflow-hidden font-semibold cursor-pointer select-none ${size === "sm" ? `h-6 text-[11px] ${armed ? "px-2.5" : "w-6"}` : `h-7 text-[13px] ${armed ? "px-3.5" : "w-7"}`
        } ${className ?? ""}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {armed ? (
          <motion.span
            key="clear"
            layout="position"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={SPRING}
          >
            Clear
          </motion.span>
        ) : (
          <motion.span
            key="x"
            layout="position"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={SPRING}
            className="flex"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.75} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function AppIcon({
  icon: Icon,
  type,
  size,
}: {
  icon: AdminNotification["icon"];
  type?: string;
  size: "sm" | "md";
}) {
  const cfg = (type && NOTIF_TYPE_CONFIG[type]) || {
    gradient: "from-[#1A85D6] to-[#0066B2]",
    shadow: "shadow-[inset_0_0.5px_0_rgba(255,255,255,0.35),0_2px_6px_rgba(0,102,178,0.25)]",
  };
  const IconComp = (type && NOTIF_TYPE_CONFIG[type]?.icon) || Icon;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-b ${cfg.gradient} text-white ${cfg.shadow} ${
        size === "md" ? "h-[38px] w-[38px] rounded-[11px]" : "h-8 w-8 rounded-[9px]"
      } transition-transform duration-200`}
    >
      <IconComp className={size === "md" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.2} />
    </div>
  );
}

function UnreadDot({ show }: { show: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={SPRING}
          className="h-2 w-2 shrink-0 rounded-full bg-[#0A84FF]"
        />
      )}
    </AnimatePresence>
  );
}

const rowExit = {
  exit: (clearing: boolean) =>
    clearing
      ? {
        opacity: 0,
        x: 90,
        scale: 0.92,
        height: 0,
        marginTop: 0,
        transition: { ...APPLE_STACK_SPRING, opacity: { duration: 0.2 } },
      }
      : {
        opacity: 0,
        height: 0,
        marginTop: 0,
        transition: { ...APPLE_STACK_SPRING, opacity: { duration: 0.12 } },
      },
};

function rowTarget(i: number, stacked: boolean, gap: number, stackedMargin: number) {
  if (!stacked) {
    return {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      y: 0,
      marginTop: i === 0 ? 0 : gap,
      pointerEvents: "auto" as const,
    };
  }
  if (i === 0) {
    return {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      y: 0,
      marginTop: 0,
      pointerEvents: "auto" as const,
    };
  }
  if (i === 1) {
    return {
      opacity: 1,
      scaleX: 0.95,
      scaleY: 1,
      y: 0,
      marginTop: stackedMargin,
      pointerEvents: "none" as const,
    };
  }
  if (i === 2) {
    return {
      opacity: 0.95,
      scaleX: 0.90,
      scaleY: 1,
      y: 0,
      marginTop: stackedMargin - 2,
      pointerEvents: "none" as const,
    };
  }
  if (i === 3) {
    return {
      opacity: 0.9,
      scaleX: 0.85,
      scaleY: 1,
      y: 0,
      marginTop: stackedMargin - 4,
      pointerEvents: "none" as const,
    };
  }
  return {
    opacity: 0,
    scaleX: 0.80,
    scaleY: 1,
    y: 0,
    marginTop: stackedMargin - 4,
    pointerEvents: "none" as const,
  };
}

function StackList({
  notifications,
  stacked,
  clearing,
  gap,
  stackedMargin = -44,
  renderCard,
}: {
  notifications: AdminNotification[];
  stacked: boolean;
  clearing: boolean;
  gap: number;
  stackedMargin?: number;
  renderCard: (n: AdminNotification, i: number) => ReactNode;
}) {
  return (
    <ul className="relative">
      <AnimatePresence initial={false} custom={clearing}>
        {notifications.map((n, i) => (
          <motion.li
            key={n.id}
            custom={clearing}
            variants={rowExit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={rowTarget(i, stacked, gap, stackedMargin)}
            exit="exit"
            transition={{
              ...APPLE_STACK_SPRING,
              delay: stacked ? 0 : Math.min(i * 0.02, 0.08),
            }}
            style={{
              zIndex: notifications.length - i,
              transformOrigin: "top center",
              willChange: "transform, opacity",
            }}
            className="relative"
            aria-hidden={stacked && i > 0 ? true : undefined}
          >
            {renderCard(n, i)}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

/* ─────────────────────── iOS (mobile) ─────────────────────── */

function IOSCard({
  n,
  stacked,
  isTop,
  stackCount,
  onTap,
  onDismiss,
  onToggleRead,
}: {
  n: AdminNotification;
  stacked: boolean;
  isTop: boolean;
  stackCount: number;
  onTap: () => void;
  onDismiss: () => void;
  onToggleRead: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [open, setOpen] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const pastThreshold = useRef(false);

  const actionsW = useTransform(x, (v) => Math.max(0, -v - 6));
  const clearW = useTransform(x, (v) => Math.max(ACTION_W, -v - ACTION_W - ACTION_GAP * 2 - 6));
  const actionsOpacity = useTransform(x, [-24, -REVEAL * 0.7], [0, 1]);
  const readOpacity = useTransform(x, [-REVEAL - 30, -REVEAL - 90], [1, 0]);

  const width = () => ref.current?.offsetWidth ?? 340;

  const close = () => {
    setOpen(false);
    setSwiping(false);
    animate(x, 0, SPRING);
  };

  const fling = () => {
    haptic(10);
    animate(x, -width() - 40, { ...FLING, onComplete: onDismiss });
  };

  const onDrag = () => {
    const past = x.get() < -width() * 0.6;
    if (past !== pastThreshold.current) {
      pastThreshold.current = past;
      haptic(6);
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const off = x.get();
    pastThreshold.current = false;
    if (off < -width() * 0.6 || (info.velocity.x < -1100 && off < -REVEAL * 0.4)) {
      fling();
    } else if (off < -REVEAL / 2 || info.velocity.x < -350) {
      setOpen(true);
      animate(x, -REVEAL, { ...SPRING, velocity: info.velocity.x });
    } else {
      setOpen(false);
      setSwiping(false);
      animate(x, 0, { ...SPRING, velocity: info.velocity.x });
    }
  };

  const interactive = !stacked || isTop;

  return (
    <div ref={ref} className="relative">
      {interactive && (open || swiping) && (
        <motion.div
          style={{ width: actionsW, opacity: actionsOpacity }}
          className="absolute inset-y-0 right-0 flex justify-end gap-2 overflow-hidden"
        >
          <motion.button
            type="button"
            style={{ opacity: readOpacity, width: ACTION_W }}
            onClick={() => {
              onToggleRead();
              close();
            }}
            className="shrink-0 rounded-[20px] bg-white text-[13px] font-semibold text-zinc-900 shadow-md dark:bg-[#3a3a3c] dark:text-white cursor-pointer"
          >
            {n.unread ? "Read" : "Unread"}
          </motion.button>
          <motion.button
            type="button"
            style={{ width: clearW }}
            onClick={fling}
            className="shrink-0 rounded-[20px] bg-white text-[13px] font-semibold text-zinc-900 shadow-md dark:bg-[#3a3a3c] dark:text-white cursor-pointer"
          >
            Clear
          </motion.button>
        </motion.div>
      )}

      <motion.div
        drag={interactive ? "x" : false}
        dragDirectionLock
        dragMomentum={false}
        dragConstraints={{ left: -2000, right: 0 }}
        dragElastic={{ left: 0, right: 0.12 }}
        onDragStart={() => setSwiping(true)}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onTap={() => (open ? close() : onTap())}
        style={{ x, willChange: "transform" }}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        transition={APPLE_STACK_SPRING}
        className="relative cursor-pointer rounded-[22px] border border-black/[0.08] bg-white p-3 shadow-[0_10px_28px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/[0.12] dark:bg-zinc-800 dark:shadow-[0_10px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transform-gpu"
      >
        <div className={`flex gap-3 transition-opacity duration-200 ${stacked && !isTop ? "opacity-0" : "opacity-100"}`}>
          <AppIcon icon={n.icon} type={n.type} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[15px] font-semibold leading-5 text-zinc-900 dark:text-white">{n.title}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <UnreadDot show={n.unread} />
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{n.time}</span>
              </div>
            </div>
            <p className={`mt-0.5 text-[14px] leading-[19px] text-zinc-700 dark:text-zinc-300 ${stacked ? "truncate" : "line-clamp-4"}`}>{n.desc}</p>
            {stacked && isTop && stackCount > 1 && (
              <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                {stackCount - 1} more notification{stackCount > 2 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function MobileNotificationCenter({
  open,
  onClose,
  center,
}: {
  open: boolean;
  onClose: () => void;
  center: NotificationCenter;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, clearing } = center;
  const stacked = !expanded && notifications.length > 1;

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [open]);

  useEffect(() => {
    if (notifications.length <= 1) setExpanded(false);
  }, [notifications.length]);

  useEffect(() => {
    if (!expanded && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [expanded]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="ios-nc"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={SHEET_SPRING}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: -1000, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.04 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -90 || info.velocity.y < -500) onClose();
          }}
          style={{ willChange: "transform" }}
          className="fixed inset-0 z-50 flex flex-col bg-zinc-100/55 backdrop-blur-3xl backdrop-saturate-150 dark:bg-black/55 md:hidden select-none transform-gpu"
        >
          <div className="flex items-end justify-between px-5 pb-3 pt-[max(env(safe-area-inset-top),20px)]">
            <div>
              <h2 className="text-[30px] font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                Notifications
              </h2>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.p
                  key={unreadCount ? "u" : "r"}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={SPRING}
                  className="text-[13px] text-zinc-500 dark:text-zinc-400"
                >
                  {unreadCount ? `${unreadCount} unread` : notifications.length ? "All caught up" : " "}
                </motion.p>
              </AnimatePresence>
            </div>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={onClose}
              className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/[0.08] text-zinc-700 active:scale-90 transition-transform dark:bg-white/15 dark:text-white cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className={`flex-1 overscroll-contain px-3 pb-4 ${
              stacked ? "overflow-hidden" : "overflow-y-auto"
            }`}
            data-lenis-prevent
          >
            <AnimatePresence initial={false}>
              {notifications.length > 0 && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between px-2 pb-2"
                >
                  <AnimatePresence initial={false}>
                    {unreadCount > 0 ? (
                      <motion.button
                        key="mark"
                        type="button"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={SPRING}
                        onClick={() => {
                          haptic(6);
                          center.markAllRead();
                        }}
                        className="text-[15px] font-medium text-[#0A84FF] active:opacity-50 cursor-pointer"
                      >
                        Mark all as read
                      </motion.button>
                    ) : (
                      <span />
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-2">
                    <AnimatePresence initial={false}>
                      {expanded && notifications.length > 1 && (
                        <motion.button
                          key="less"
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={SPRING}
                          onClick={() => setExpanded(false)}
                          className="flex h-7 items-center gap-1 rounded-full bg-zinc-900/[0.08] px-3 text-[13px] font-semibold text-zinc-800 dark:bg-white/15 dark:text-white cursor-pointer"
                        >
                          <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.75} />
                          Show less
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <ClearAllButton
                      onClear={center.clearAll}
                      className="bg-zinc-900/[0.08] text-zinc-800 dark:bg-white/15 dark:text-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <StackList
              notifications={notifications}
              stacked={stacked}
              clearing={clearing}
              gap={8}
              stackedMargin={-54}
              renderCard={(n, i) => (
                <IOSCard
                  n={n}
                  stacked={stacked}
                  isTop={i === 0}
                  stackCount={notifications.length}
                  onTap={() => {
                    if (stacked) {
                      haptic(6);
                      setExpanded(true);
                    } else {
                      center.markRead(n.id);
                    }
                  }}
                  onDismiss={() => (stacked ? center.clearAll() : center.dismiss(n.id))}
                  onToggleRead={() => center.toggleRead(n.id)}
                />
              )}
            />

            <AnimatePresence>
              {notifications.length === 0 && !clearing && (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...SPRING, delay: 0.15 }}
                  className="pt-24 text-center text-[17px] font-semibold text-zinc-400 dark:text-zinc-500"
                >
                  No Notifications
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="flex shrink-0 cursor-grab touch-none justify-center pb-[max(env(safe-area-inset-bottom),12px)] pt-4 active:cursor-grabbing"
            aria-hidden="true"
          >
            <div className="h-[5px] w-[134px] rounded-full bg-zinc-900/80 dark:bg-white/85" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────── macOS (desktop) ─────────────────────── */

function MacCard({
  n,
  stacked,
  isTop,
  stackCount,
  onTap,
  onDismiss,
}: {
  n: AdminNotification;
  stacked: boolean;
  isTop: boolean;
  stackCount: number;
  onTap: () => void;
  onDismiss: () => void;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 260], [1, 0]);
  const [hover, setHover] = useState(false);
  const wheelTimer = useRef<number | undefined>(undefined);
  const leaving = useRef(false);
  const interactive = !stacked || isTop;

  useEffect(() => () => clearTimeout(wheelTimer.current), []);

  const fling = () => {
    if (leaving.current) return;
    leaving.current = true;
    animate(x, 420, { ...FLING, onComplete: onDismiss });
  };

  // Two-finger trackpad swipe right dismisses, like macOS Notification Center.
  const onWheel = (e: React.WheelEvent) => {
    if (!interactive || leaving.current || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    const next = Math.max(-12, x.get() - e.deltaX);
    x.set(next);
    if (next > 120) {
      fling();
      return;
    }
    clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(() => animate(x, 0, SPRING), 140);
  };

  return (
    <motion.div
      drag={interactive ? "x" : false}
      dragDirectionLock
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 600 }}
      dragElastic={{ left: 0.08, right: 0 }}
      onDragEnd={(_, info) => {
        if (x.get() > 110 || info.velocity.x > 600) fling();
        else animate(x, 0, { ...SPRING, velocity: info.velocity.x });
      }}
      onTap={onTap}
      onWheel={onWheel}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={APPLE_STACK_SPRING}
      style={{ x, opacity }}
      className="group relative cursor-default"
    >
      <AnimatePresence>
        {hover && interactive && (
          <motion.button
            type="button"
            aria-label={stacked ? "Clear all notifications" : "Clear notification"}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              fling();
            }}
            className={`absolute -left-2 -top-2 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full cursor-pointer ${GLASS_PILL}`}
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className={`relative overflow-hidden rounded-[20px] p-3 ${GLASS_CARD}`}>
        <div className={`relative flex items-start gap-2.5 transition-opacity duration-200 ${stacked && !isTop ? "opacity-0" : "opacity-100"}`}>
          <AppIcon icon={n.icon} type={n.type} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[13px] font-semibold leading-tight text-zinc-900 dark:text-white">{n.title}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <UnreadDot show={n.unread} />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{n.time}</span>
              </div>
            </div>
            <p className={`mt-1 text-[12px] leading-snug text-zinc-600 dark:text-zinc-300 ${stacked ? "truncate" : "line-clamp-4"}`}>{n.desc}</p>
            {stacked && isTop && stackCount > 1 && (
              <p className="mt-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {stackCount - 1} more notification{stackCount > 2 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const NOTIF_PORTAL_ATTR = "data-notif-portal";

export function DesktopNotificationPopover({
  open,
  center,
  anchorRef,
  onClose,
}: {
  open: boolean;
  center: NotificationCenter;
  anchorRef?: React.RefObject<HTMLElement | null>;
  onClose?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const [justMarked, setJustMarked] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number; center: number } | null>(null);
  const { notifications, unreadCount, clearing } = center;
  const stacked = !expanded && notifications.length > 1;
  const showControls = hover && notifications.length > 0;

  useEffect(() => setMounted(true), []);

  const updateCoords = useCallback(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({
      top: Math.round(rect.bottom + 8),
      right: Math.round(window.innerWidth - rect.right),
      center: Math.round(rect.left + rect.width / 2),
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      setHover(false);
      return;
    }
    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (notifications.length <= 1) setExpanded(false);
  }, [notifications.length]);

  useEffect(() => {
    if (!justMarked) return;
    const t = setTimeout(() => setJustMarked(false), 1400);
    return () => clearTimeout(t);
  }, [justMarked]);

  if (!mounted) return null;

  // When empty: anchor the "No Notifications" pill directly below the notification button
  if (notifications.length === 0 && !clearing) {
    return createPortal(
      <AnimatePresence>
        {open && (
          <div
            key="mac-nc-empty"
            {...{ [NOTIF_PORTAL_ATTR]: "" }}
            role="dialog"
            aria-label="Notifications"
            style={{
              position: "fixed",
              top: coords ? `${coords.top}px` : "52px",
              left: coords ? `${coords.center}px` : undefined,
              right: coords ? undefined : "12px",
              transform: coords ? "translateX(-50%)" : undefined,
              zIndex: 60,
            }}
            className="hidden select-none antialiased md:block pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.94, transition: { duration: 0.14, ease: IOS_EASE } }}
              transition={{ type: "spring", stiffness: 360, damping: 27, mass: 0.8 }}
              style={{ fontFamily: APPLE_FONT, willChange: "transform, opacity" }}
            >
              <span className={`inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-medium shadow-md ${GLASS_PILL}`}>
                No Notifications
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  // Portalled to <body>: a backdrop-filter inside the blurred top bar can only sample the bar, not the page.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Gentle background blur overlay — softens the dashboard underneath so notifications take focus */}
          <motion.div
            key="mac-nc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] hidden bg-black/[0.04] backdrop-blur-[3.5px] dark:bg-black/25 md:block cursor-default"
            aria-hidden="true"
          />

          <motion.div
            key="mac-nc"
            {...{ [NOTIF_PORTAL_ATTR]: "" }}
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.15, ease: IOS_EASE } }}
            transition={{ type: "spring", stiffness: 360, damping: 27, mass: 0.8 }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            style={{
              fontFamily: APPLE_FONT,
              overscrollBehaviorX: "contain",
              transformOrigin: "top right",
              willChange: "transform, opacity",
              top: coords ? `${coords.top}px` : "52px",
              right: coords ? `${Math.max(12, coords.right)}px` : "12px",
            }}
            className="fixed z-[60] hidden w-[356px] select-none antialiased md:block"
          >
            <div className="flex h-8 items-center justify-between px-0.5 pb-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {showControls && unreadCount > 0 ? (
                  <motion.button
                    key="mark"
                    type="button"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING}
                    onClick={() => {
                      center.markAllRead();
                      setJustMarked(true);
                    }}
                    className={`h-6 rounded-full px-2.5 text-[11px] font-semibold !text-[#0A84FF] cursor-pointer ${GLASS_PILL}`}
                  >
                    Mark all as read
                  </motion.button>
                ) : justMarked ? (
                  <motion.span
                    key="done"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={SPRING}
                    className={`flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold !text-emerald-600 dark:!text-emerald-400 ${GLASS_PILL}`}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                    All read
                  </motion.span>
                ) : (
                  <span key="none" />
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {showControls && (
                  <motion.div
                    key="group-controls"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5"
                  >
                    <AnimatePresence initial={false}>
                      {expanded && notifications.length > 1 && (
                        <motion.button
                          key="less"
                          type="button"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={SPRING}
                          onClick={() => setExpanded(false)}
                          className={`h-6 rounded-full px-2.5 text-[11px] font-semibold cursor-pointer ${GLASS_PILL}`}
                        >
                          Show Less
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <ClearAllButton onClear={center.clearAll} size="sm" className={GLASS_PILL} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="-mx-3 max-h-[calc(100vh-110px)] overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-6 pt-2 [scrollbar-width:none]"
              data-lenis-prevent
            >
              <StackList
                notifications={notifications}
                stacked={stacked}
                clearing={clearing}
                gap={10}
                renderCard={(n, i) => (
                  <MacCard
                    n={n}
                    stacked={stacked}
                    isTop={i === 0}
                    stackCount={notifications.length}
                    onTap={() => (stacked ? setExpanded(true) : center.markRead(n.id))}
                    onDismiss={() => (stacked ? center.clearAll() : center.dismiss(n.id))}
                  />
                )}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

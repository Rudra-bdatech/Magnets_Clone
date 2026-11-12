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
import { Bell, X, Check, ChevronUp, type LucideIcon } from "lucide-react";

export interface AdminNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: LucideIcon;
}

// UIKit spring (response 0.35, dampingRatio 0.86) converted to stiffness/damping.
const SPRING = { type: "spring", stiffness: 322, damping: 31, mass: 1 } as const;
// UIKit sheet spring (response 0.5, dampingRatio 0.86).
const SHEET_SPRING = { type: "spring", stiffness: 158, damping: 21.6, mass: 1 } as const;
const IOS_EASE = [0.32, 0.72, 0, 1] as const;
const FLING = { type: "tween", duration: 0.24, ease: IOS_EASE } as const;

// macOS 26 "Liquid Glass": translucent fill, heavy saturated blur, specular top edge.
const GLASS_CARD =
  "bg-white/55 backdrop-blur-[28px] backdrop-saturate-[1.8] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_0_0_0.5px_rgba(255,255,255,0.4),0_10px_30px_rgba(0,0,0,0.14)] dark:bg-[#1c1c1e]/55 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_0_0_0.5px_rgba(255,255,255,0.10),0_12px_34px_rgba(0,0,0,0.5)]";
const GLASS_PILL =
  "bg-white/65 backdrop-blur-2xl backdrop-saturate-[1.8] text-zinc-700 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.8),0_2px_10px_rgba(0,0,0,0.14)] hover:bg-white/80 hover:text-zinc-900 dark:bg-[#2c2c2e]/65 dark:text-zinc-200 dark:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.16),0_2px_10px_rgba(0,0,0,0.45)] dark:hover:bg-[#3a3a3c]/75 dark:hover:text-white";
const APPLE_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';

const ACTION_W = 74;
const ACTION_GAP = 8;
const REVEAL = ACTION_W * 2 + ACTION_GAP * 2;

function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

export function useNotificationCenter(initial: AdminNotification[]) {
  const [notifications, setNotifications] = useState(initial);
  const [clearing, setClearing] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = useCallback(
    () => setNotifications((p) => p.map((n) => ({ ...n, unread: false }))),
    []
  );
  const markRead = useCallback(
    (id: string) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, unread: false } : n))),
    []
  );
  const toggleRead = useCallback(
    (id: string) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))),
    []
  );
  const dismiss = useCallback(
    (id: string) => setNotifications((p) => p.filter((n) => n.id !== id)),
    []
  );

  const clearAll = useCallback(() => {
    if (clearing) return;
    const ids = notifications.map((n) => n.id);
    if (!ids.length) return;
    haptic(12);
    setClearing(true);
    ids.forEach((id, i) => {
      timers.current.push(
        window.setTimeout(() => setNotifications((p) => p.filter((n) => n.id !== id)), i * 55)
      );
    });
    // Keep the "clearing" exit variant alive until the last card has finished leaving.
    timers.current.push(window.setTimeout(() => setClearing(false), ids.length * 55 + 600));
  }, [clearing, notifications]);

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
      className={`flex items-center justify-center overflow-hidden font-semibold cursor-pointer select-none ${
        size === "sm" ? `h-6 text-[11px] ${armed ? "px-2.5" : "w-6"}` : `h-7 text-[13px] ${armed ? "px-3.5" : "w-7"}`
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

function AppIcon({ icon: Icon, size }: { icon: AdminNotification["icon"]; size: "sm" | "md" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-b from-[#1A85D6] to-[#0066B2] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.35)] ${
        size === "md" ? "h-[38px] w-[38px] rounded-[9px]" : "h-8 w-8 rounded-[7px]"
      }`}
    >
      <Icon className={size === "md" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.2} />
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
          paddingBottom: 0,
          transition: { ...SPRING, opacity: { duration: 0.2 } },
        }
      : {
          opacity: 0,
          height: 0,
          paddingBottom: 0,
          transition: { ...SPRING, opacity: { duration: 0.12 } },
        },
};

function rowTarget(i: number, stacked: boolean, gap: number) {
  if (!stacked) return { opacity: 1, height: "auto", scaleX: 1, paddingBottom: gap };
  if (i === 0) return { opacity: 1, height: "auto", scaleX: 1, paddingBottom: 0 };
  if (i < 3) return { opacity: i === 1 ? 0.8 : 0.55, height: 9, scaleX: 1 - i * 0.05, paddingBottom: 0 };
  return { opacity: 0, height: 0, scaleX: 0.85, paddingBottom: 0 };
}

function StackList({
  notifications,
  stacked,
  clearing,
  gap,
  renderCard,
}: {
  notifications: AdminNotification[];
  stacked: boolean;
  clearing: boolean;
  gap: number;
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
            initial={{ opacity: 0, height: 0, scaleX: 0.92, paddingBottom: 0 }}
            animate={rowTarget(i, stacked, gap)}
            exit="exit"
            transition={SPRING}
            style={{
              zIndex: notifications.length - i,
              originY: 0,
              overflow: stacked && i > 0 ? "hidden" : "visible",
            }}
            className="relative flex flex-col justify-end"
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
  const pastThreshold = useRef(false);

  const actionsW = useTransform(x, (v) => Math.max(0, -v - 6));
  const clearW = useTransform(x, (v) => Math.max(ACTION_W, -v - ACTION_W - ACTION_GAP * 2 - 6));
  const actionsOpacity = useTransform(x, [-24, -REVEAL * 0.7], [0, 1]);
  const readOpacity = useTransform(x, [-REVEAL - 30, -REVEAL - 90], [1, 0]);

  const width = () => ref.current?.offsetWidth ?? 340;

  const close = () => {
    setOpen(false);
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
      animate(x, 0, { ...SPRING, velocity: info.velocity.x });
    }
  };

  const interactive = !stacked || isTop;

  return (
    <div ref={ref} className="relative">
      {interactive && (
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
            className="shrink-0 rounded-[20px] bg-white/70 text-[13px] font-semibold text-zinc-900 backdrop-blur-xl dark:bg-zinc-700/60 dark:text-white cursor-pointer"
          >
            {n.unread ? "Read" : "Unread"}
          </motion.button>
          <motion.button
            type="button"
            style={{ width: clearW }}
            onClick={fling}
            className="shrink-0 rounded-[20px] bg-white/70 text-[13px] font-semibold text-zinc-900 backdrop-blur-xl dark:bg-zinc-700/60 dark:text-white cursor-pointer"
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
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onTap={() => (open ? close() : onTap())}
        style={{ x }}
        whileTap={interactive ? { scale: 0.985 } : undefined}
        transition={SPRING}
        className="relative cursor-pointer rounded-[22px] border border-white/50 bg-white/75 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/[0.06] dark:bg-zinc-800/70 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
      >
        <div className="flex gap-3">
          <AppIcon icon={n.icon} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[15px] font-semibold leading-5 text-zinc-900 dark:text-white">{n.title}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <UnreadDot show={n.unread} />
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{n.time}</span>
              </div>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[14px] leading-[19px] text-zinc-700 dark:text-zinc-300">{n.desc}</p>
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
  const { notifications, unreadCount, clearing } = center;
  const stacked = !expanded && notifications.length > 1;

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  useEffect(() => {
    if (notifications.length <= 1) setExpanded(false);
  }, [notifications.length]);

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
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.9, bottom: 0.04 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -90 || info.velocity.y < -500) onClose();
          }}
          className="fixed inset-0 z-50 flex flex-col bg-zinc-100/55 backdrop-blur-3xl backdrop-saturate-150 dark:bg-black/55 md:hidden select-none"
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

          <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4" data-lenis-prevent>
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

      <div className={`relative overflow-hidden rounded-[22px] px-3 py-2.5 ${GLASS_CARD}`}>
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/35 via-white/0 to-white/0 dark:from-white/[0.08]" />
        <div className="relative flex gap-2.5">
          <AppIcon icon={n.icon} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[13px] font-semibold leading-[18px] text-zinc-900 dark:text-white">{n.title}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <UnreadDot show={n.unread} />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{n.time}</span>
              </div>
            </div>
            <p className="line-clamp-2 text-[12px] leading-[16px] text-zinc-600 dark:text-zinc-300">{n.desc}</p>
            {stacked && isTop && stackCount > 1 && (
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
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

export function DesktopNotificationPopover({ open, center }: { open: boolean; center: NotificationCenter }) {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const [justMarked, setJustMarked] = useState(false);
  const { notifications, unreadCount, clearing } = center;
  const stacked = !expanded && notifications.length > 1;
  const showControls = hover && notifications.length > 0;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      setHover(false);
    }
  }, [open]);

  useEffect(() => {
    if (notifications.length <= 1) setExpanded(false);
  }, [notifications.length]);

  useEffect(() => {
    if (!justMarked) return;
    const t = setTimeout(() => setJustMarked(false), 1400);
    return () => clearTimeout(t);
  }, [justMarked]);

  if (!mounted) return null;

  // Portalled to <body>: a backdrop-filter inside the blurred top bar can only sample the bar, not the page.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="mac-nc"
          {...{ [NOTIF_PORTAL_ATTR]: "" }}
          role="dialog"
          aria-label="Notifications"
          initial={{ x: "calc(100% + 24px)" }}
          animate={{ x: 0 }}
          exit={{ x: "calc(100% + 24px)", transition: { duration: 0.3, ease: IOS_EASE } }}
          transition={SHEET_SPRING}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          style={{ fontFamily: APPLE_FONT, overscrollBehaviorX: "contain" }}
          className="fixed right-3 top-[52px] z-[60] hidden w-[356px] select-none antialiased md:block"
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
              gap={8}
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
            <AnimatePresence>
              {notifications.length === 0 && !clearing && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ ...SPRING, delay: 0.15 }}
                  className="flex justify-end"
                >
                  <span className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${GLASS_PILL}`}>
                    No Notifications
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

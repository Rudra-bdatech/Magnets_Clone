"use client";

import { useReducedMotion } from "framer-motion";
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createTickPlayer } from "@/lib/tick-sound";
import {
  capturePointer,
  releasePointer,
  TOUCH_GESTURE_CLASS,
} from "@/lib/touch";
import { cn } from "@/lib/utils";

export type WheelPickerOption = string | { label: string; value: string };

export interface WheelPickerProps {
  options: WheelPickerOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Rows visible through the window, odd. More = flatter curve. Default 5. */
  visibleCount?: number;
  /** Row height in px. Default 36. */
  itemHeight?: number;
  disabled?: boolean;
  /** Play a short tick each time the selected value changes. Default false. */
  sound?: boolean;
  className?: string;
  /** Alignment of options: center | left | right. Default center. */
  align?: "center" | "left" | "right";
  "aria-label"?: string;
}

const DEG = Math.PI / 180;
const DECELERATION = 0.00042;
const MAX_VELOCITY = 0.18;
const VELOCITY_WINDOW = 90;
const WHEEL_SENS = 0.012;
const WHEEL_SETTLE = 110;
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
const BACK = 1.35;
const easeOutBack = (p: number) =>
  1 + (BACK + 1) * (p - 1) ** 3 + BACK * (p - 1) ** 2;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(v, hi));

function optionValue(option: WheelPickerOption) {
  return typeof option === "string" ? option : option.value;
}
function optionLabel(option: WheelPickerOption) {
  return typeof option === "string" ? option : option.label;
}

export function WheelPicker({
  options,
  value,
  defaultValue,
  onValueChange,
  visibleCount = 5,
  itemHeight = 36,
  disabled = false,
  sound = false,
  className,
  align = "center",
  "aria-label": ariaLabel,
}: WheelPickerProps) {
  const reduce = useReducedMotion() ?? false;
  const controlled = value !== undefined;
  const last = options.length - 1;

  const indexOf = useCallback(
    (v: string | undefined) => {
      const i = options.findIndex((o) => optionValue(o) === v);
      return i < 0 ? 0 : i;
    },
    [options],
  );

  const [internal, setInternal] = useState(() => defaultValue ?? value);
  const currentValue = controlled ? value : internal;
  const [grabbing, setGrabbing] = useState(false);

  // Cylinder geometry: tuned for single crisp drum with gentle Apple iOS curvature
  const { itemAngle, radius, height, hideBeyond } = useMemo(() => {
    const rowsEachSide = Math.max(1, Math.floor(visibleCount / 2));
    const angle = visibleCount === 3 ? 24 : 90 / (rowsEachSide + 1);
    const r = itemHeight / Math.tan(angle * DEG);
    return {
      itemAngle: angle,
      radius: r,
      hideBeyond: rowsEachSide + 0.35,
      height: visibleCount === 3 ? Math.round(itemHeight * 2.5) : Math.round(2 * r * Math.sin(rowsEachSide * angle * DEG) + itemHeight),
    };
  }, [visibleCount, itemHeight]);

  const container = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLUListElement>(null);
  const scroll = useRef(indexOf(currentValue));
  const raf = useRef(0);
  const emitted = useRef(currentValue);
  const tickPlayer = useRef<ReturnType<typeof createTickPlayer> | null>(null);
  const lastTick = useRef(indexOf(currentValue));

  const paint = useCallback(
    (s: number) => {
      const drum = drumRef.current;
      if (!drum) return;
      drum.style.transform = `translateZ(${-radius}px) rotateX(${itemAngle * s}deg)`;
      for (const node of Array.from(drum.children)) {
        const li = node as HTMLLIElement;
        const i = Number(li.dataset.index);
        const dist = Math.abs(i - s);
        if (dist > hideBeyond) {
          if (li.style.visibility !== "hidden") li.style.visibility = "hidden";
        } else {
          if (li.style.visibility !== "visible") li.style.visibility = "visible";
          const opacity = Math.max(0.28, Math.min(1, 1 - dist * 0.65));
          li.style.opacity = String(opacity);
          const isCenter = dist < 0.5;
          const targetWeight = isCenter ? "700" : "500";
          if (li.style.fontWeight !== targetWeight) li.style.fontWeight = targetWeight;
        }
      }
    },
    [radius, itemAngle, hideBeyond],
  );

  const getPlayer = useCallback(() => {
    if (!tickPlayer.current) tickPlayer.current = createTickPlayer();
    return tickPlayer.current;
  }, []);

  const emit = useCallback(
    (i: number) => {
      const v = optionValue(options[clamp(i, 0, last)]);
      if (v === emitted.current) return;
      emitted.current = v;
      if (sound && reduce) getPlayer().play();
      if (!controlled) setInternal(v);
      onValueChange?.(v);
    },
    [options, last, controlled, onValueChange, sound, reduce, getPlayer],
  );

  const maybeTick = useCallback(
    (pos: number) => {
      const row = clamp(Math.round(pos), 0, last);
      if (!sound || reduce) {
        lastTick.current = row;
        return;
      }
      if (row === lastTick.current) return;
      lastTick.current = row;
      getPlayer().play();
    },
    [sound, reduce, last, getPlayer],
  );

  const stop = useCallback(() => cancelAnimationFrame(raf.current), []);

  const glide = useCallback(
    (
      to: number,
      duration: number,
      ease: (p: number) => number = easeOutCubic,
    ) => {
      stop();
      const from = scroll.current;
      const dist = to - from;
      if (!dist || duration <= 0) {
        scroll.current = to;
        paint(to);
        maybeTick(to);
        emit(to);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const p = (now - start) / duration;
        if (p >= 1) {
          scroll.current = to;
          paint(to);
          maybeTick(to);
          emit(to);
          return;
        }
        scroll.current = from + dist * ease(p);
        paint(scroll.current);
        maybeTick(scroll.current);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [stop, paint, emit, maybeTick],
  );

  const fling = useCallback(
    (velocity: number) => {
      const from = scroll.current;
      if (from < 0 || from > last) {
        glide(clamp(Math.round(from), 0, last), 260);
        return;
      }
      const dir = Math.sign(velocity);
      const coast = ((velocity * velocity) / (2 * DECELERATION)) * dir;
      const to = clamp(Math.round(from + coast), 0, last);
      const duration = clamp(
        Math.sqrt(Math.abs(to - from)) * 300 + 240,
        280,
        1700,
      );
      glide(to, duration, easeOutBack);
    },
    [glide, last],
  );

  const step = useCallback(
    (by: number) =>
      glide(clamp(Math.round(scroll.current) + by, 0, last), 300, easeOutBack),
    [glide, last],
  );

  const drag = useRef<{
    y: number;
    scroll: number;
    pts: [number, number][];
  } | null>(null);
  const dragFrame = useRef(0);
  const latestY = useRef(0);

  const beginDrag = useCallback(
    (y: number) => {
      stop();
      if (sound) getPlayer().prepare();
      setGrabbing(true);
      drag.current = {
        y,
        scroll: scroll.current,
        pts: [[y, performance.now()]],
      };
    },
    [stop, sound, getPlayer],
  );
  const moveDrag = useCallback(
    (y: number) => {
      const d = drag.current;
      if (!d) return;
      latestY.current = y;
      d.pts.push([y, performance.now()]);
      if (d.pts.length > 8) d.pts.shift();
      if (dragFrame.current) return;
      dragFrame.current = requestAnimationFrame(() => {
        dragFrame.current = 0;
        const dd = drag.current;
        if (!dd) return;
        let next = dd.scroll + (dd.y - latestY.current) / itemHeight;
        if (next < 0) next *= 0.3;
        else if (next > last) next = last + (next - last) * 0.3;
        scroll.current = next;
        paint(next);
        maybeTick(next);
        emit(Math.round(clamp(next, 0, last)));
      });
    },
    [itemHeight, last, paint, emit, maybeTick],
  );
  const endDrag = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    if (dragFrame.current) {
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = 0;
    }
    drag.current = null;
    setGrabbing(false);
    const pts = d.pts;
    let v = 0;
    if (pts.length > 1) {
      const latest = pts[pts.length - 1];
      let ref = pts[0];
      for (const p of pts) {
        if (latest[1] - p[1] <= VELOCITY_WINDOW) {
          ref = p;
          break;
        }
      }
      const dt = latest[1] - ref[1];
      if (dt > 0) {
        const raw = (ref[0] - latest[0]) / itemHeight / dt;
        v = clamp(raw, -MAX_VELOCITY, MAX_VELOCITY);
      }
    }
    fling(v);
  }, [itemHeight, fling]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || reduce || event.pointerType === "touch") return;
      beginDrag(event.clientY);
      capturePointer(event.currentTarget, event.pointerId);
    },
    [disabled, reduce, beginDrag],
  );
  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      moveDrag(event.clientY);
    },
    [moveDrag],
  );
  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      releasePointer(event.currentTarget, event.pointerId);
      endDrag();
    },
    [endDrag],
  );

  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWheel = useCallback(
    (event: globalThis.WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled || reduce) return;
      if (sound) getPlayer().prepare();
      stop();
      const px = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const next = clamp(scroll.current + px * WHEEL_SENS, 0, last);
      scroll.current = next;
      paint(next);
      maybeTick(next);
      emit(Math.round(next));
      if (wheelSnap.current) clearTimeout(wheelSnap.current);
      wheelSnap.current = setTimeout(() => {
        glide(clamp(Math.round(scroll.current), 0, last), 240, easeOutBack);
      }, WHEEL_SETTLE);
    },
    [
      disabled,
      reduce,
      sound,
      last,
      paint,
      emit,
      stop,
      glide,
      maybeTick,
      getPlayer,
    ],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const at = Math.round(scroll.current);
      const map: Record<string, number> = {
        ArrowUp: -1,
        ArrowDown: 1,
        Home: -at,
        End: last - at,
      };
      if (event.key in map) {
        event.preventDefault();
        if (sound) getPlayer().prepare();
        step(map[event.key]);
      }
    },
    [disabled, sound, last, step, getPlayer],
  );

  useEffect(() => {
    if (drag.current) return;
    const target = indexOf(currentValue);
    emitted.current = currentValue;
    if (Math.abs(Math.round(scroll.current) - target) < 0.001) {
      paint(scroll.current);
      return;
    }
    glide(target, 260);
  }, [currentValue, indexOf, paint, glide]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      cancelAnimationFrame(dragFrame.current);
      if (wheelSnap.current) clearTimeout(wheelSnap.current);
      tickPlayer.current?.dispose();
    },
    [],
  );

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      if (reduce || disabled) return;
      const t = e.touches[0];
      if (t) beginDrag(t.clientY);
    };
    const onMove = (e: TouchEvent) => {
      if (reduce || disabled) return;
      const t = e.touches[0];
      if (!t || !drag.current) return;
      e.preventDefault();
      moveDrag(t.clientY);
    };
    const onEnd = () => {
      if (reduce || disabled) return;
      endDrag();
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [reduce, disabled, beginDrag, moveDrag, endDrag, onWheel]);

  const maskFade =
    "[mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%,#000_82%,transparent_100%)]";

  if (reduce) {
    const pad = (height - itemHeight) / 2;
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        style={{ height }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 border-border border-y bg-foreground/[0.04]"
          style={{ height: itemHeight }}
        />
        <ul
          className={cn(
            "h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            maskFade,
          )}
          style={{ paddingTop: pad, paddingBottom: pad }}
        >
          {options.map((option) => {
            const v = optionValue(option);
            return (
              <li key={v} className="snap-center">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => emit(options.indexOf(option))}
                  className={cn(
                    "flex w-full items-center justify-center font-bold text-base",
                    v === currentValue
                      ? "text-foreground"
                      : "text-muted-foreground/40",
                  )}
                  style={{ height: itemHeight }}
                >
                  {optionLabel(option)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const justifyClass =
    align === "right"
      ? "justify-end pr-5 sm:pr-6"
      : align === "left"
      ? "justify-start pl-5 sm:pl-6"
      : "justify-center";

  return (
    <div
      ref={container}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "relative touch-none overflow-hidden rounded-2xl border border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
        TOUCH_GESTURE_CLASS,
        grabbing ? "cursor-grabbing" : "cursor-grab",
        disabled && "pointer-events-none opacity-50",
        maskFade,
        className,
      )}
      style={{ height, perspective: 800 }}
    >
      {/* Razor-sharp single drum: zero ghosting, zero overlapping text */}
      <ul
        ref={drumRef}
        aria-hidden
        className="absolute inset-x-0 top-1/2 m-0 h-0 list-none p-0 [backface-visibility:hidden] [transform-style:preserve-3d] [will-change:transform]"
      >
        {options.map((option, i) => (
          <li
            key={optionValue(option)}
            data-index={i}
            className={cn(
              "absolute inset-x-0 flex items-center text-foreground text-base sm:text-lg tracking-tight select-none",
              justifyClass,
            )}
            style={{
              top: -itemHeight / 2,
              height: itemHeight,
              transform: `rotateX(${-itemAngle * i}deg) translateZ(${radius}px)`,
            }}
          >
            {optionLabel(option)}
          </li>
        ))}
      </ul>
    </div>
  );
}

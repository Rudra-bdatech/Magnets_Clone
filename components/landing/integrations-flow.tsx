"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { Mail, Webhook, TrendingUp, Target, Check, X, RotateCw, BookOpen, Zap, Calendar } from "lucide-react";
import { MagnetIcon } from "@/components/brand";
import { useInView, usePrefersReducedMotion } from "./use-in-view";

// 0 reset · 1 signup → hub · 2 fan-out (cards land one by one) · 3 webhook failed · 4 webhook retries · 5 all delivered
type Phase = 0 | 1 | 2 | 3 | 4 | 5;
const PHASE_MS: Record<Phase, number> = { 0: 500, 1: 800, 2: 1250, 3: 1300, 4: 820, 5: 2800 };

type Status = "idle" | "sending" | "ok" | "failed" | "retrying";

type Dest = {
  key: string;
  name: string;
  action: string;
  color: string;
  logo: ReactNode;
  flaky?: boolean;
};

const DESTS: Dest[] = [
  { key: "kit", name: "Kit", action: "Tagged instagram-checklist", color: "#FB7360", logo: <Mail className="h-4 w-4 text-[#FB7360]" /> },
  {
    key: "slack",
    name: "Slack",
    action: "Posted to #new-leads",
    color: "#E01E5A",
    logo: <Image src="/brand/slack.svg" alt="" width={16} height={16} unoptimized className="h-4 w-4" />,
  },
  {
    key: "pipedrive",
    name: "Pipedrive",
    action: "Person + deal created",
    color: "#28A745",
    logo: <Image src="/brand/pipedrive.svg" alt="" width={18} height={18} unoptimized className="h-[18px] w-[18px]" />,
  },
  { key: "webhook", name: "Webhook", action: "POST /leads on your server", color: "#6366F1", logo: <Webhook className="h-4 w-4 text-[#6366F1]" />, flaky: true },
  { key: "ga4", name: "GA4", action: "generate_lead event", color: "#E8710A", logo: <TrendingUp className="h-4 w-4 text-[#E8710A]" /> },
  { key: "meta", name: "Meta Pixel", action: "Lead event for retargeting", color: "#0866FF", logo: <Target className="h-4 w-4 text-[#0866FF]" /> },
];

const ALSO: { name: string; Icon: typeof BookOpen; note?: string }[] = [
  { name: "Substack", Icon: BookOpen },
  { name: "Zapier", Icon: Zap },
];

const BRAND = "#0066B2";
const OK_GREEN = "#10B981";
const FAIL_RED = "#EF4444";
const RETRY_AMBER = "#F59E0B";

// Diagram geometry, in viewBox units. Overlay nodes are positioned with matching percentages.
const VB_W = 1000;
const VB_H = 480;
const MID = VB_H / 2;
const SIGNUP_RIGHT = 262;
const HUB_X = 450;
const HUB_R = 44;
const DEST_LEFT = 640;
const destY = (i: number) => 45 + i * 78;
const fanPath = (y: number) =>
  `M${HUB_X + HUB_R} ${MID} C ${HUB_X + HUB_R + 72} ${MID}, ${DEST_LEFT - 72} ${y}, ${DEST_LEFT} ${y}`;

// Longer (outer) paths take longer, so the middle cards land first.
const DUR = DESTS.map((_, i) => Math.round(640 + Math.abs(destY(i) - MID) * 2.2));
const ARRIVE_DESKTOP = DUR.map((d) => Math.round(d * 0.85));

// Mobile rail geometry (px): hub row is 80 tall (hub centre 40), cards are 56 tall with 8 gap.
// The rail grows linearly over RAIL_MS from the hub centre to the last card centre, so card i
// lands exactly when the growing front passes its centre.
const RAIL_MS = 1000;
const RAIL_START = 40;
const cardCentre = (i: number) => 80 + i * 64 + 28;
const ARRIVE_MOBILE = DESTS.map((_, i) =>
  Math.round(((cardCentre(i) - RAIL_START) / (cardCentre(DESTS.length - 1) - RAIL_START)) * RAIL_MS),
);
const ALL_TRUE = DESTS.map(() => true);
const ALL_FALSE = DESTS.map(() => false);

function statusFor(phase: Phase, landed: boolean, flaky?: boolean): Status {
  if (phase <= 1) return "idle";
  if (phase === 2) return landed ? (flaky ? "failed" : "ok") : "sending";
  if (!flaky) return "ok";
  if (phase === 3) return "failed";
  if (phase === 4) return "retrying";
  return "ok";
}

function statusColor(s: Status, d: Dest) {
  if (s === "failed") return FAIL_RED;
  if (s === "retrying") return RETRY_AMBER;
  if (s === "ok" && d.flaky) return OK_GREEN;
  return d.color;
}

export default function IntegrationsFlow() {
  const [ref, inView] = useInView({ rootMargin: "0px" });
  const reduced = usePrefersReducedMotion();
  const live = inView && !reduced;
  const [phase, setPhase] = useState<Phase>(5);
  const [cycle, setCycle] = useState(0);
  const [landed, setLanded] = useState<boolean[]>(ALL_TRUE);
  const [desktop, setDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const arrive = desktop ? ARRIVE_DESKTOP : ARRIVE_MOBILE;
    if (!live) {
      setPhase(5);
      setLanded(ALL_TRUE);
      return;
    }
    const timers: number[] = [];
    const enter = (p: Phase) => {
      if (p === 0) {
        setCycle((c) => c + 1);
        setLanded(ALL_FALSE);
      }
      if (p === 2) {
        arrive.forEach((ms, i) =>
          timers.push(window.setTimeout(() => setLanded((l) => l.map((v, j) => (j === i ? true : v))), ms)),
        );
      }
      setPhase(p);
      timers.push(window.setTimeout(() => enter(((p + 1) % 6) as Phase), PHASE_MS[p]));
    };
    enter(0);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [live, desktop]);

  const statuses = DESTS.map((d, i) => statusFor(phase, landed[i], d.flaky));
  const signupVisible = phase >= 1;
  const hubActive = phase >= 2;
  const routing = live && (phase === 1 || phase === 2);

  const okCount = statuses.filter((s) => s === "ok").length;
  const counter =
    phase <= 1
      ? "Waiting for a signup…"
      : `${okCount}/${DESTS.length} delivered${
          statuses.includes("failed") ? " · 1 failed" : statuses.includes("retrying") ? " · retrying 1" : ""
        }`;
  const allDone = okCount === DESTS.length;

  return (
    <div ref={ref} className="relative mt-10 sm:mt-14">
      <div
        aria-hidden="true"
        className="vercel-dot-bg pointer-events-none absolute inset-0 opacity-50 dark:opacity-25 [mask-image:radial-gradient(70%_70%_at_50%_45%,black,transparent)]"
      />

      <p className="sr-only">
        Example: one new signup is sent to Kit, Slack, Pipedrive, a webhook, Google Analytics 4 and Meta Pixel. The webhook
        delivery fails once and is retried automatically.
      </p>

      {/* Desktop diagram */}
      <div aria-hidden="true" className="relative hidden py-6 lg:block">
        <div className="relative w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
            <path
              d={`M${SIGNUP_RIGHT} ${MID} L${HUB_X - HUB_R} ${MID}`}
              vectorEffect="non-scaling-stroke"
              strokeWidth={1.5}
              className={signupVisible ? "" : "stroke-zinc-300 dark:stroke-white/10"}
              style={signupVisible ? { stroke: BRAND, strokeOpacity: 0.5 } : undefined}
            />
            {live && phase === 1 && (
              <Comet key={`in-${cycle}`} d={`M${SIGNUP_RIGHT} ${MID} L${HUB_X - HUB_R} ${MID}`} color={BRAND} dur={700} />
            )}

            {DESTS.map((d, i) => {
              const s = statuses[i];
              const y = destY(i);
              const path = fanPath(y);
              const c = statusColor(s, d);
              const lit = s === "ok" || s === "failed" || s === "retrying";
              return (
                <g key={d.key}>
                  <path
                    d={path}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={1.5}
                    strokeDasharray={s === "failed" || s === "retrying" ? "4 5" : undefined}
                    className={lit ? "transition-[stroke] duration-300" : "stroke-zinc-300 dark:stroke-white/10"}
                    style={lit ? { stroke: s === "ok" ? d.color : c, strokeOpacity: s === "ok" ? 0.5 : 0.75 } : undefined}
                  />
                  {live && s === "sending" && <Trail key={`t-${cycle}`} d={path} color={d.color} dur={DUR[i]} />}
                  {live && s === "retrying" && <Trail key={`rt-${cycle}`} d={path} color={RETRY_AMBER} dur={760} />}
                  {live && phase === 2 && <Comet key={`out-${cycle}`} d={path} color={d.color} dur={DUR[i]} />}
                  {live && phase === 4 && d.flaky && <Comet key={`retry-${cycle}`} d={path} color={RETRY_AMBER} dur={760} />}

                  <circle
                    cx={DEST_LEFT}
                    cy={y}
                    r={3}
                    className={lit ? "transition-[fill] duration-300" : "fill-zinc-300 dark:fill-zinc-700"}
                    style={lit ? { fill: c } : undefined}
                  />
                  {live && (s === "ok" || s === "failed") && (
                    <circle key={`rp-${cycle}-${s}`} cx={DEST_LEFT} cy={y} r={6} className="lm-ripple" style={{ fill: c }} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Signup node */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2" style={{ width: `${(SIGNUP_RIGHT / VB_W) * 100}%` }}>
            <SignupCard visible={signupVisible} />
          </div>

          {/* Hub */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(HUB_X / VB_W) * 100}%`, top: "50%" }}>
            <div className="relative flex h-20 w-20 items-center justify-center">
              {live && phase === 2 && (
                <span key={`ping-${cycle}`} className="absolute inset-0 animate-ping rounded-full bg-[#0066B2]/25" />
              )}
              {routing && (
                <span
                  className="absolute -inset-[3px] animate-spin rounded-full"
                  style={{ background: "conic-gradient(from 0deg, transparent 0 55%, #38BDF8 85%, transparent 100%)" }}
                />
              )}
              <span
                className={`relative flex h-20 w-20 items-center justify-center rounded-full border bg-white shadow-lg transition-[border-color,box-shadow] duration-500 dark:bg-[#18181C] ${
                  hubActive
                    ? "border-[#0066B2]/40 shadow-[0_0_0_6px_rgba(0,102,178,0.08),0_12px_32px_-12px_rgba(0,102,178,0.5)]"
                    : "border-zinc-200 dark:border-white/10"
                }`}
              >
                <MagnetIcon className="h-9 w-9" />
              </span>
            </div>
            <p className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Funnels
            </p>
          </div>

          {/* Destinations */}
          {DESTS.map((d, i) => (
            <div
              key={d.key}
              className="absolute right-0 -translate-y-1/2"
              style={{ left: `${(DEST_LEFT / VB_W) * 100}%`, top: `${(destY(i) / VB_H) * 100}%` }}
            >
              <DestCard d={d} status={statuses[i]} live={live} cycle={cycle} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile / tablet stack */}
      <div aria-hidden="true" className="relative mx-auto max-w-xl lg:hidden">
        <SignupCard visible={signupVisible} />

        <div className="relative">
          {/* Rail: base, lit segment into the hub, lit segment growing down to the cards */}
          <span
            className="absolute left-7 top-0 w-px -translate-x-1/2 bg-zinc-300 dark:bg-white/10"
            style={{ bottom: 28 }}
          />
          <span
            className={`absolute left-7 top-0 w-px -translate-x-1/2 origin-top bg-[#0066B2]/70 dark:bg-[#38BDF8]/70 ${
              phase === 1 ? "transition-transform duration-500 ease-out" : ""
            }`}
            style={{ height: RAIL_START, transform: `translateX(-50%) scaleY(${signupVisible ? 1 : 0})` }}
          />
          <span
            className={`absolute left-7 w-px origin-top bg-[#0066B2]/70 dark:bg-[#38BDF8]/70 ${
              phase === 2 ? "transition-transform ease-linear" : ""
            }`}
            style={{
              top: RAIL_START,
              bottom: 28,
              transitionDuration: `${RAIL_MS}ms`,
              transform: `translateX(-50%) scaleY(${hubActive ? 1 : 0})`,
            }}
          />
          {live && phase === 2 && (
            <span
              key={`beam-${cycle}`}
              className="lm-beam absolute left-7 h-10 w-[3px] -translate-x-1/2 rounded-full"
              style={{ background: "linear-gradient(to bottom, transparent, #38BDF8 70%, #fff)" }}
            />
          )}

          {/* Hub row */}
          <div className="relative flex h-20 items-center pl-[64px]">
            <span className="absolute left-7 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              {live && phase === 2 && (
                <span key={`mping-${cycle}`} className="absolute inset-0 animate-ping rounded-full bg-[#0066B2]/25" />
              )}
              {routing && (
                <span
                  className="absolute -inset-[3px] animate-spin rounded-full"
                  style={{ background: "conic-gradient(from 0deg, transparent 0 55%, #38BDF8 85%, transparent 100%)" }}
                />
              )}
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-md transition-colors duration-500 dark:bg-[#18181C] ${
                  hubActive ? "border-[#0066B2]/40" : "border-zinc-200 dark:border-white/10"
                }`}
              >
                <MagnetIcon className="h-6 w-6" />
              </span>
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Funnels</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {phase <= 1 ? "Waiting for a signup…" : phase === 5 ? "Delivered everywhere" : "Routing to 6 tools…"}
              </p>
            </div>
          </div>

          {/* Destination rows */}
          <div className="space-y-2">
            {DESTS.map((d, i) => {
              const s = statuses[i];
              const lit = s === "ok" || s === "failed" || s === "retrying";
              const c = statusColor(s, d);
              return (
                <div key={d.key} className="relative pl-[52px]">
                  <span
                    className={`absolute left-7 top-1/2 w-6 border-t ${lit ? "" : "border-zinc-300 dark:border-white/10"}`}
                    style={lit ? { borderColor: c, borderStyle: s === "ok" ? "solid" : "dashed" } : undefined}
                  />
                  <span
                    className={`absolute left-[49px] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                      lit ? "" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                    style={lit ? { background: c } : undefined}
                  />
                  {live && (s === "ok" || s === "failed") && (
                    <span
                      key={`mrp-${cycle}-${s}`}
                      className="lm-ripple absolute left-[49px] top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full"
                      style={{ background: c }}
                    />
                  )}
                  <DestCard d={d} status={s} live={live} cycle={cycle} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          <span>Example run</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span
            aria-hidden="true"
            className={`tabular-nums transition-colors duration-300 ${allDone ? "text-emerald-600 dark:text-emerald-400" : ""}`}
          >
            {counter}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Also connects</span>
          {ALSO.map(({ name, Icon, note }) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            >
              <Icon className="h-3 w-3 text-zinc-400" aria-hidden="true" />
              {name}
              {note && <span className="hidden text-zinc-400 sm:inline">· {note}</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Comet({ d, color, dur, delay = 0 }: { d: string; color: string; dur: number; delay?: number }) {
  const timing = { "--dur": `${dur}ms`, "--delay": `${delay}ms` } as CSSProperties;
  return (
    <>
      <path d={d} pathLength={1} strokeWidth={3} strokeLinecap="round" className="lm-comet" style={{ ...timing, stroke: color, color }} />
      <path d={d} pathLength={1} strokeWidth={2} strokeLinecap="round" className="lm-comet-core" style={{ ...timing, stroke: "#fff" }} />
    </>
  );
}

function Trail({ d, color, dur }: { d: string; color: string; dur: number }) {
  return (
    <path
      d={d}
      pathLength={1}
      strokeWidth={1.5}
      className="lm-trail"
      style={{ stroke: color, strokeOpacity: 0.6, "--dur": `${dur}ms` } as CSSProperties}
    />
  );
}

function SignupCard({ visible }: { visible: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm transition-all duration-500 ease-out dark:border-white/10 dark:bg-[#18181C] ${
        visible ? "translate-x-0 opacity-100 blur-0" : "-translate-x-3 opacity-0 blur-[3px]"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#0066B2] dark:text-[#38BDF8]">New signup</span>
        <span className="font-mono text-[10px] text-zinc-400">just now</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0066B2] to-[#38BDF8] text-xs font-semibold text-white">
          AN
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">ananya@…</p>
          <p className="truncate text-xs text-zinc-500">Bakery Instagram checklist</p>
        </div>
      </div>
    </div>
  );
}

function DestCard({ d, status, live, cycle }: { d: Dest; status: Status; live: boolean; cycle: number }) {
  const tone =
    status === "failed"
      ? "border-red-500/50 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
      : status === "retrying"
      ? "border-amber-500/50 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]"
      : "border-zinc-200 dark:border-white/10";
  const hit = live && (status === "ok" || status === "failed");
  return (
    <div
      className={`relative flex h-14 items-center gap-3 rounded-xl border bg-white px-3 transition-[border-color,box-shadow] duration-300 dark:bg-[#18181C] ${tone} ${
        live && status === "failed" ? "lm-shake" : ""
      }`}
    >
      {hit && (
        <span
          key={`${cycle}-${status}`}
          className="lm-hit rounded-xl"
          style={{ "--c": statusColor(status, d) } as CSSProperties}
        />
      )}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5">
        {d.logo}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-zinc-900 dark:text-white">{d.name}</p>
        <p className="truncate text-xs text-zinc-500">{d.action}</p>
      </div>
      <span key={live ? status : "static"} className={`flex shrink-0 ${live ? "lm-pop" : ""}`}>
        <StatusChip status={status} color={d.color} retried={d.flaky} />
      </span>
    </div>
  );
}

function StatusChip({ status, color, retried }: { status: Status; color: string; retried?: boolean }) {
  const chip = "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider";
  switch (status) {
    case "idle":
      return <span className="mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />;
    case "sending":
      return (
        <span className="relative mr-1 flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: color }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
        </span>
      );
    case "ok":
      return (
        <span className={`${chip} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}>
          <Check className="h-3 w-3" />
          {retried ? "Retried" : "Sent"}
        </span>
      );
    case "failed":
      return (
        <span className={`${chip} bg-red-500/10 text-red-600 dark:text-red-400`}>
          <X className="h-3 w-3" />
          503
        </span>
      );
    case "retrying":
      return (
        <span className={`${chip} bg-amber-500/10 text-amber-600 dark:text-amber-400`}>
          <RotateCw className="h-3 w-3 animate-spin" />
          Retry
        </span>
      );
  }
}

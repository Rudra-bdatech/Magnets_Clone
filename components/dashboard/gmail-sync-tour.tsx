"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { loadAccount, syncWithDatabase } from "@/lib/store";
import type { Account } from "@/lib/data";

// Coachmark tour for accounts without a connected sender.
// Step 1 points at the sidebar account button on /dashboard, step 2 points at the
// Gmail card on the settings email tab, step 3 confirms after ?gmail=connected.

const STEP_KEY = "leadmagnets_gmail_tour_step";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

type Step = "intro" | "spotlight" | "success";

function snoozeKey(email: string) {
  return `leadmagnets_gmail_tour_snooze_v2:${email.toLowerCase()}`;
}

function isSnoozed(email: string) {
  try {
    return Number(localStorage.getItem(snoozeKey(email)) || 0) > Date.now();
  } catch (_) {
    return false;
  }
}

function hasSender(account: Account | null) {
  return Boolean(
    account?.gmailOAuth?.connected ||
    (account?.customSmtp?.enabled && account?.customSmtp?.isVerified)
  );
}

function getStoredStep(): Step | null {
  try {
    return sessionStorage.getItem(STEP_KEY) === "spotlight" ? "spotlight" : null;
  } catch (_) {
    return null;
  }
}

function setStoredStep(step: Step | null) {
  try {
    if (step) sessionStorage.setItem(STEP_KEY, step);
    else sessionStorage.removeItem(STEP_KEY);
  } catch (_) {}
}

export default function GmailSyncTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [hadError, setHadError] = useState(false);

  // Use server truth before deciding, so a stale cache never nags a connected user
  useEffect(() => {
    let cancelled = false;
    syncWithDatabase()
      .then((data) => {
        if (cancelled) return;
        setAccount((data?.account as Account) || loadAccount());
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setAccount(loadAccount());
        setReady(true);
      });

    const handleAccountUpdate = () => setAccount(loadAccount());
    window.addEventListener("accountUpdated", handleAccountUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("accountUpdated", handleAccountUpdate);
    };
  }, []);

  useEffect(() => {
    if (!ready || !account?.email) return;

    const params = new URLSearchParams(window.location.search);
    const connected = hasSender(account);
    const inTour = getStoredStep() === "spotlight" || params.get("tour") === "gmail";

    if (connected) {
      if (inTour && pathname === "/dashboard/settings" && params.get("gmail") === "connected") {
        setStep("success");
      } else if (step !== "success") {
        setStep(null);
      }
      setStoredStep(null);
      return;
    }

    if (pathname === "/dashboard/settings" && inTour) {
      setHadError(params.has("gmailError"));
      setStoredStep("spotlight");
      setStep("spotlight");
      return;
    }

    // Leaving settings mid-tour ends it; only the dashboard home starts it
    if (inTour) setStoredStep(null);
    // ?tour=gmail on the dashboard forces the intro, bypassing the snooze
    const forced = params.get("tour") === "gmail";
    if (pathname === "/dashboard" && (forced || !isSnoozed(account.email))) {
      const t = setTimeout(() => setStep("intro"), 900);
      return () => clearTimeout(t);
    }
    setStep(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, account, pathname]);

  const snooze = useCallback(() => {
    if (account?.email) {
      try {
        localStorage.setItem(snoozeKey(account.email), String(Date.now() + SNOOZE_MS));
      } catch (_) {}
    }
    setStoredStep(null);
    setStep(null);
  }, [account?.email]);

  const finish = useCallback(() => {
    setStoredStep(null);
    setStep(null);
  }, []);

  const startSpotlight = useCallback(() => {
    setStoredStep("spotlight");
    setStep(null);
    router.push("/dashboard/settings?tab=email&tour=gmail");
  }, [router]);

  const connectGmail = useCallback(() => {
    setStoredStep("spotlight");
    window.location.href = "/api/account/gmail/connect";
  }, []);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "success") finish();
      else snooze();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, snooze, finish]);

  return (
    <AnimatePresence>
      {step === "intro" && (
        <Coachmark
          key="intro"
          selectors={['[data-tour="account-menu"]', '[data-tour="mobile-menu"]']}
          prefer="right"
          ringPad={3}
          onClose={snooze}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">
            Email sending
          </p>
          <h4 className="mt-1 text-[14px] font-bold leading-snug">Connect Gmail to start sending</h4>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-[#9B9085]">
            Leads won&apos;t get their resources or sequence emails until Gmail is connected. Takes about
            30 seconds.
          </p>
          <Actions>
            <SecondaryButton onClick={snooze}>Later</SecondaryButton>
            <PrimaryButton onClick={startSpotlight}>
              Set it up <ArrowRight className="h-3 w-3" />
            </PrimaryButton>
          </Actions>
        </Coachmark>
      )}

      {step === "spotlight" && (
        <Coachmark
          key="spotlight"
          selectors={['[data-tour="gmail-connect"]']}
          prefer="bottom"
          ringPad={6}
          scrollIntoView
          onClose={snooze}
        >
          {hadError && (
            <div className="mb-2.5 flex items-start gap-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-[12px] leading-snug text-amber-700 dark:text-amber-300">
                Google sign-in didn&apos;t finish. Try again and allow the send permission.
              </p>
            </div>
          )}
          <h4 className="text-[14px] font-bold leading-snug">Click &ldquo;Connect Gmail&rdquo;</h4>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-[#9B9085]">
            Sign in with the Google account your leads should hear from. We only ask to send, never to
            read your inbox.
          </p>
          <Actions>
            <SecondaryButton onClick={snooze}>Not now</SecondaryButton>
            <PrimaryButton onClick={connectGmail}>Connect Gmail</PrimaryButton>
          </Actions>
        </Coachmark>
      )}

      {step === "success" && (
        <Coachmark
          key="success"
          selectors={['[data-tour="gmail-connect"]']}
          prefer="bottom"
          ringPad={6}
          tone="success"
          onClose={finish}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h4 className="text-[14px] font-bold leading-snug">Gmail connected</h4>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-[#9B9085]">
            {account?.gmailOAuth?.gmailAddress ? (
              <>
                Leads will now get emails from{" "}
                <strong className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {account.gmailOAuth.gmailAddress}
                </strong>
                .
              </>
            ) : (
              "Leads will now get emails from your Gmail."
            )}
          </p>
          <Actions>
            <SecondaryButton onClick={finish}>Close</SecondaryButton>
            <PrimaryButton
              onClick={() => {
                finish();
                router.push("/dashboard");
              }}
            >
              Back to dashboard
            </PrimaryButton>
          </Actions>
        </Coachmark>
      )}
    </AnimatePresence>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 flex items-center justify-end gap-1.5">{children}</div>;
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg bg-[#0066B2] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#005291] active:scale-95 transition-all cursor-pointer"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-[#9B9085] dark:hover:text-white dark:hover:bg-[#25252b] transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

type Box = { top: number; left: number; width: number; height: number };
type Side = "right" | "bottom" | "top";

// Follows the first visible match each frame, so it survives async loads, tab animations,
// sidebar collapse and scroll without wiring into the target component.
function useTargetBox(selectors: string[], scrollIntoView: boolean) {
  const [box, setBox] = useState<Box | null>(null);
  const scrolledRef = useRef(false);
  const selectorKey = selectors.join(",");

  useEffect(() => {
    let raf = 0;
    let last = "";
    const tick = () => {
      let found: HTMLElement | null = null;
      for (const sel of selectorKey.split(",")) {
        for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            found = el;
            break;
          }
        }
        if (found) break;
      }

      if (found && scrollIntoView && !scrolledRef.current) {
        scrolledRef.current = true;
        const lenis = (window as any).__lenis;
        if (lenis && typeof lenis.scrollTo === "function") lenis.scrollTo(found, { offset: -160 });
        else found.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      const r = found?.getBoundingClientRect();
      const key = r
        ? `${Math.round(r.top)}|${Math.round(r.left)}|${Math.round(r.width)}|${Math.round(r.height)}|${window.innerWidth}|${window.innerHeight}`
        : "none";
      if (key !== last) {
        last = key;
        setBox(r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selectorKey, scrollIntoView]);

  return box;
}

function Coachmark({
  selectors,
  prefer,
  ringPad,
  scrollIntoView = false,
  tone = "brand",
  onClose,
  children,
}: {
  selectors: string[];
  prefer: "right" | "bottom";
  ringPad: number;
  scrollIntoView?: boolean;
  tone?: "brand" | "success";
  onClose: () => void;
  children: React.ReactNode;
}) {
  const box = useTargetBox(selectors, scrollIntoView);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(150);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  });

  if (!box) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gutter = 12;
  const gap = 14;
  const width = Math.min(288, vw - gutter * 2);
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;

  let side: Side;
  if (prefer === "right" && vw - (box.left + box.width) >= width + gap + gutter) side = "right";
  else if (vh - (box.top + box.height) >= cardH + gap + gutter) side = "bottom";
  else side = "top";

  let top: number;
  let left: number;
  if (side === "right") {
    left = box.left + box.width + gap;
    top = Math.max(gutter, Math.min(cy - cardH / 2, vh - cardH - gutter));
  } else {
    left = Math.max(gutter, Math.min(cx - width / 2, vw - width - gutter));
    top = side === "bottom" ? box.top + box.height + gap : box.top - cardH - gap;
  }

  const arrowStyle: React.CSSProperties =
    side === "right"
      ? { left: -6, top: Math.max(14, Math.min(cy - top, cardH - 14)) - 6 }
      : side === "bottom"
        ? { top: -6, left: Math.max(16, Math.min(cx - left, width - 16)) - 6 }
        : { bottom: -6, left: Math.max(16, Math.min(cx - left, width - 16)) - 6 };
  const arrowBorders =
    side === "right" ? "border-l border-b" : side === "bottom" ? "border-l border-t" : "border-r border-b";

  const ringColor =
    tone === "success" ? "ring-emerald-500" : "ring-[#0066B2] dark:ring-[#38BDF8]";
  const pulseColor =
    tone === "success" ? "text-emerald-500" : "text-[#0066B2] dark:text-[#38BDF8]";
  const offset = side === "right" ? { x: -6, y: 0 } : side === "bottom" ? { x: 0, y: -6 } : { x: 0, y: 6 };

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed z-[200] pointer-events-none rounded-xl ring-2 ${ringColor}`}
        style={{
          top: box.top - ringPad,
          left: box.left - ringPad,
          width: box.width + ringPad * 2,
          height: box.height + ringPad * 2,
        }}
      >
        <span className={`absolute inset-0 rounded-xl ${pulseColor} animate-coachmark-pulse motion-reduce:hidden`} />
      </div>

      <motion.div
        ref={cardRef}
        role="dialog"
        aria-live="polite"
        initial={{ opacity: 0, scale: 0.96, ...offset }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className="fixed z-[201] rounded-xl border border-zinc-200/90 bg-white/95 p-3.5 pr-8 text-zinc-900 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/15 dark:bg-[#18181B]/95 dark:text-white dark:shadow-[0_14px_36px_-6px_rgba(0,0,0,0.6)]"
        style={{ top, left, width }}
      >
        <span
          aria-hidden="true"
          className={`absolute h-3 w-3 rotate-45 bg-white/95 dark:bg-[#18181B]/95 border-zinc-200/90 dark:border-white/15 ${arrowBorders}`}
          style={arrowStyle}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="relative">{children}</div>
      </motion.div>
    </>
  );
}

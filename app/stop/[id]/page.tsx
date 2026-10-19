"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, Mail, Loader2, BellOff, AlertTriangle } from "lucide-react";

type ViewState = "checking" | "invalid" | "confirm" | "done";

/**
 * Unsubscribe page linked from the footer of every email sent to a lead.
 * The route id is the lead id and `t` is its signed token (see lib/unsubscribe.ts).
 * Unsubscribing needs a click: email security scanners open links automatically,
 * so loading this page must never unsubscribe anyone by itself.
 */
export default function StopSequencePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";
  const leadId = params.id || "";

  const [view, setView] = useState<ViewState>("checking");
  const [pageName, setPageName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const query = `lid=${encodeURIComponent(leadId)}&t=${encodeURIComponent(token)}`;

  useEffect(() => {
    if (!leadId || !token) {
      setView("invalid");
      return;
    }
    let cancelled = false;
    fetch(`/api/unsubscribe?${query}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.valid) {
          setView("invalid");
          return;
        }
        setPageName(typeof data.pageName === "string" ? data.pageName : "");
        setView(data.unsubscribed ? "done" : "confirm");
      })
      .catch(() => {
        if (!cancelled) setView("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, token, query]);

  async function handleConfirmUnsubscribe() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/unsubscribe?${query}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setView("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sourceLabel = pageName ? (
    <span className="font-semibold text-zinc-200">&ldquo;{pageName}&rdquo;</span>
  ) : (
    "this sender"
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center p-6 selection:bg-[#0066B2]">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#18181B] border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
        {view === "checking" && (
          <div className="flex flex-col items-center gap-3 py-6 text-xs text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            <span>Checking your link...</span>
          </div>
        )}

        {view === "invalid" && (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">This Link Isn&rsquo;t Valid</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The unsubscribe link is incomplete or has been changed. Please use the Unsubscribe link at the
                bottom of the most recent email you received, or reply to that email and ask the sender to remove you.
              </p>
            </div>
          </div>
        )}

        {view === "done" && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <BellOff className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">You Have Been Unsubscribed</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You will no longer receive automated follow-up emails from {sourceLabel}.
              </p>
            </div>

            <div className="pt-2 text-xs text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Your email preferences have been saved.</span>
            </div>
          </div>
        )}

        {view === "confirm" && (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0066B2]/10 border border-[#0066B2]/20 text-[#38BDF8]">
              <Mail className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Unsubscribe From Emails</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Stop receiving automated follow-up emails from {sourceLabel}.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmUnsubscribe}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] py-3 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
                <span>{submitting ? "Unsubscribing..." : "Unsubscribe"}</span>
              </button>

              {error && (
                <p role="alert" className="text-xs text-rose-400">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

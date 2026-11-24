"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lock, RotateCcw } from "lucide-react";
import { saveAccount } from "@/lib/store";
import type { Account } from "@/lib/data";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  PDF_GATE_ACCOUNT_FIELDS,
  PDF_GATE_DEFAULTS,
  PDF_GATE_KEYS,
  PDF_GATE_LIMITS,
  pdfGateCopyFromAccount,
  pdfGateShowsBrand,
  resolvePdfGateCopy,
  type PdfGateCopy,
  type PdfGateKey,
} from "@/lib/pdf-gate-copy";

interface Props {
  account: Account | null;
  businessName: string;
  brandColor: string;
  onSaved: (acc: Account) => void;
  toast: (msg: string) => void;
}

type Step = "details" | "code";

const FIELDS: { key: PdfGateKey; label: string; step: Step; multiline?: boolean; help?: React.ReactNode }[] = [
  {
    key: "headline",
    label: "Headline",
    step: "details",
    multiline: true,
    help: (
      <>
        Type <code className="font-mono font-semibold">{"{pages}"}</code> to show the PDF&apos;s page count.
      </>
    ),
  },
  { key: "subtext", label: "Subtext", step: "details" },
  { key: "buttonText", label: "Button text", step: "details" },
  { key: "codeHeadline", label: "Headline", step: "code", multiline: true },
  { key: "codeSubtext", label: "Subtext", step: "code" },
  { key: "unlockText", label: "Unlock button text", step: "code" },
  { key: "resendText", label: "Resend link text", step: "code" },
];

const STEPS: { id: Step; title: string; hint: string }[] = [
  { id: "details", title: "Step 1 · Name & email", hint: "First screen readers see." },
  { id: "code", title: "Step 2 · Verification code", hint: "Shown after the code is emailed." },
];

const PREVIEW_PAGES = 14;
const EMPTY_COPY = pdfGateCopyFromAccount(null);
const inputClass =
  "w-full rounded-md border border-[#E2E8F0] bg-white dark:border-white/10 dark:bg-[#121212] px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#5c5650] focus:border-[#0066B2] transition";

/** Templates-page card for the wording on the locked-PDF unlock popup (account-wide). */
export default function PdfGateCopyCard({ account, businessName, brandColor, onSaved, toast }: Props) {
  const saved = useMemo(() => pdfGateCopyFromAccount(account), [account]);
  const savedKey = PDF_GATE_KEYS.map((k) => saved[k]).join("\u0000");

  const savedShowBrand = pdfGateShowsBrand(account);

  const [copy, setCopy] = useState<Required<PdfGateCopy>>(saved);
  const [showBrand, setShowBrand] = useState(savedShowBrand);
  const [previewStep, setPreviewStep] = useState<Step>("details");
  const [saving, setSaving] = useState(false);

  // Load the saved settings (also after the background database sync)
  useEffect(() => {
    setCopy(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);
  useEffect(() => {
    setShowBrand(savedShowBrand);
  }, [savedShowBrand]);

  const dirty = PDF_GATE_KEYS.some((k) => copy[k] !== saved[k]) || showBrand !== savedShowBrand;
  const isDefault = PDF_GATE_KEYS.every((k) => copy[k] === "") && showBrand;

  const preview = useMemo(() => resolvePdfGateCopy(copy, PREVIEW_PAGES, true), [copy]);
  const color = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(brandColor) ? brandColor : "#0066B2";

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);
    const updated: Account = { ...account, pdfGateShowBrand: showBrand };
    for (const k of PDF_GATE_KEYS) {
      (updated as any)[PDF_GATE_ACCOUNT_FIELDS[k]] = copy[k].trim();
    }
    const res = await saveAccount(updated);
    setSaving(false);
    if (!res.success) {
      toast(res.error || "Couldn't save. Please try again.");
      return;
    }
    onSaved(res.account || updated);
    try {
      window.dispatchEvent(new Event("accountUpdated"));
    } catch (_) {}
    toast("Unlock screen text saved!");
  };

  return (
    <div className="mt-5 rounded-2xl border border-[#0066B2]/15 bg-white/90 dark:border-white/[0.08] dark:bg-[#171717] dark:shadow-none p-4 sm:p-6 shadow-md backdrop-blur-sm transition-colors">
      {/* Heading */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
          <Lock className="h-4 w-4 text-[#0066B2]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-base font-bold text-zinc-900 dark:text-white">Locked PDF unlock screen</h4>
            <InfoTooltip
              content="The popup readers see when they reach the end of the free preview. Applies to every locked PDF on this account."
              title="Unlock screen"
              size="sm"
            />
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            Leave a field empty to keep the default text.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Fields */}
        <div className="lg:col-span-5 space-y-6">
          {/* Brand bar on/off */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] dark:border-white/10 bg-zinc-50 dark:bg-[#121212] px-3.5 py-3">
            <span className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-[#a1a1aa]">
              Show workspace name
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showBrand}
              aria-label="Show workspace name"
              onClick={() => setShowBrand((v) => !v)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                showBrand ? "bg-[#0066B2]" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  showBrand ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {STEPS.map((step) => (
            <div key={step.id} className="space-y-4">
              <div className="flex items-baseline justify-between gap-2 border-b border-[#0066B2]/10 dark:border-white/[0.06] pb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">{step.title}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 text-right">{step.hint}</span>
              </div>
              {FIELDS.filter((f) => f.step === step.id).map((f) => {
                const common = {
                  value: copy[f.key],
                  maxLength: PDF_GATE_LIMITS[f.key],
                  placeholder: PDF_GATE_DEFAULTS[f.key],
                  onFocus: () => setPreviewStep(f.step),
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const value = e.target.value;
                    setCopy((prev) => ({ ...prev, [f.key]: value }));
                  },
                };
                return (
                  <div key={f.key}>
                    <label className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-[#a1a1aa] mb-1.5">
                      {f.label}
                    </label>
                    {f.multiline ? (
                      <textarea rows={2} {...common} className={`${inputClass} resize-none`} />
                    ) : (
                      <input type="text" {...common} className={inputClass} />
                    )}
                    {f.help && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">{f.help}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="border-t border-[#0066B2]/10 dark:border-white/[0.06] pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setCopy(EMPTY_COPY);
                setShowBrand(true);
              }}
              disabled={isDefault}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to default
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty || !account}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-[#0066B2] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 sm:py-2.5 text-xs sm:text-[12.2px] font-bold text-white hover:bg-[#005799] active:scale-[0.98] transition cursor-pointer touch-manipulation"
            >
              <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5 stroke-[3px]" />
              {saving ? "Saving..." : "Save text"}
            </button>
          </div>
        </div>

        {/* Live preview — mirrors the popup in app/pdf-viewer/[magnetId]/pdf-viewer-client.tsx */}
        <div className="lg:col-span-7 lg:sticky lg:top-20 flex flex-col gap-3">
          <div className="flex items-center gap-1 self-start rounded-lg border border-[#0066B2]/15 dark:border-white/[0.08] bg-white dark:bg-[#121212] p-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPreviewStep(s.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  previewStep === s.id
                    ? "bg-[#0066B2] text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {s.id === "details" ? "Name & email" : "Code"}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-zinc-800/90 dark:bg-black/60 p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-[440px] rounded-2xl bg-white p-5 sm:p-6 shadow-2xl text-left">
              {showBrand && (
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-medium text-zinc-500 truncate">{businessName || "Your workspace"}</span>
                </div>
              )}

              {previewStep === "details" ? (
                <>
                  <h3 className="text-[17px] font-bold leading-snug text-zinc-900 break-words">{preview.headline}</h3>
                  <p className="mt-1.5 text-[13px] text-zinc-500 break-words">{preview.subtext}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-zinc-200 px-3 py-2.5 text-[13px] text-zinc-400">Your name *</div>
                    <div className="rounded-lg border border-zinc-200 px-3 py-2.5 text-[13px] text-zinc-400 truncate">
                      Your email address *
                    </div>
                  </div>
                  <div
                    className="mt-2.5 rounded-lg py-2.5 px-3 text-center text-[13px] font-semibold text-white break-words"
                    style={{ background: color }}
                  >
                    {preview.buttonText}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-[17px] font-bold leading-snug text-zinc-900 break-words">{preview.codeHeadline}</h3>
                  <p className="mt-1.5 text-[13px] text-zinc-500 break-words">{preview.codeSubtext}</p>
                  <div className="mt-4 rounded-lg border border-zinc-200 px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-zinc-300">
                    000000
                  </div>
                  <div
                    className="mt-2.5 rounded-lg py-2.5 px-3 text-center text-[13px] font-semibold text-white break-words"
                    style={{ background: color }}
                  >
                    {preview.unlockText}
                  </div>
                  <p className="mt-3.5 text-center text-[12px] text-zinc-500 break-words">
                    Didn&apos;t receive it?{" "}
                    <span className="font-medium text-zinc-800 underline">{preview.resendText}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

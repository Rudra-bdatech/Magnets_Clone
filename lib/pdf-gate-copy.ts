/**
 * Wording on the locked-PDF unlock popup (pdf-viewer-client.tsx), editable per account
 * from the Templates page. Empty values fall back to these defaults, so accounts that
 * never set them keep the original text.
 */

export const PDF_GATE_LIMITS = {
  headline: 160,
  subtext: 120,
  buttonText: 30,
  codeHeadline: 160,
  codeSubtext: 120,
  unlockText: 30,
  resendText: 30,
} as const;

export const PDF_GATE_DEFAULTS = {
  // ── Step 1: name + email ──
  /** {pages} is replaced with the PDF's total page count */
  headline: "You've read the preview. Enter your details to unlock all {pages} pages.",
  /** Used when the owner set 0 free pages (nothing to preview) */
  headlineNoPreview: "Enter your details to read this guide.",
  subtext: "Free — no credit card required.",
  buttonText: "Send code →",
  /** Button label while the code is being sent */
  sendingText: "Sending code…",
  /** Sending label when the owner set their own button text ("code" may not match their wording) */
  sendingTextCustom: "Sending…",

  // ── Step 2: 6-digit code ──
  codeHeadline: "Enter the 6-digit code we just sent you.",
  codeSubtext: "Check your spam folder if it isn't there in a minute.",
  unlockText: "Unlock guide →",
  resendText: "Resend code",
} as const;

export interface PdfGateCopy {
  headline?: string;
  subtext?: string;
  buttonText?: string;
  codeHeadline?: string;
  codeSubtext?: string;
  unlockText?: string;
  resendText?: string;
}

/** Account fields that store each piece of wording */
export const PDF_GATE_ACCOUNT_FIELDS = {
  headline: "pdfGateHeadline",
  subtext: "pdfGateSubtext",
  buttonText: "pdfGateButtonText",
  codeHeadline: "pdfGateCodeHeadline",
  codeSubtext: "pdfGateCodeSubtext",
  unlockText: "pdfGateUnlockText",
  resendText: "pdfGateResendText",
} as const satisfies Record<keyof PdfGateCopy, string>;

export type PdfGateKey = keyof typeof PDF_GATE_ACCOUNT_FIELDS;
export const PDF_GATE_KEYS = Object.keys(PDF_GATE_ACCOUNT_FIELDS) as PdfGateKey[];

export function cleanGateText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Reads the saved wording off an account document (missing fields → ""). */
export function pdfGateCopyFromAccount(account: any): Required<PdfGateCopy> {
  const out = {} as Required<PdfGateCopy>;
  for (const key of PDF_GATE_KEYS) {
    const v = account?.[PDF_GATE_ACCOUNT_FIELDS[key]];
    out[key] = typeof v === "string" ? v : "";
  }
  return out;
}

/** Final text for the popup. A custom headline is used for both the preview and no-preview cases. */
export function resolvePdfGateCopy(copy: PdfGateCopy | undefined, totalPages: number, hasPreview: boolean) {
  const pick = (key: PdfGateKey) => copy?.[key]?.trim() || "";
  const headline = pick("headline") || (hasPreview ? PDF_GATE_DEFAULTS.headline : PDF_GATE_DEFAULTS.headlineNoPreview);
  const customButton = pick("buttonText");
  return {
    headline: headline.replace(/\{pages\}/gi, String(totalPages)),
    subtext: pick("subtext") || PDF_GATE_DEFAULTS.subtext,
    buttonText: customButton || PDF_GATE_DEFAULTS.buttonText,
    sendingText: customButton ? PDF_GATE_DEFAULTS.sendingTextCustom : PDF_GATE_DEFAULTS.sendingText,
    codeHeadline: pick("codeHeadline") || PDF_GATE_DEFAULTS.codeHeadline,
    codeSubtext: pick("codeSubtext") || PDF_GATE_DEFAULTS.codeSubtext,
    unlockText: pick("unlockText") || PDF_GATE_DEFAULTS.unlockText,
    resendText: pick("resendText") || PDF_GATE_DEFAULTS.resendText,
  };
}

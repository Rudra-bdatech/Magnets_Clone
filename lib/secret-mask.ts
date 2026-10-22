/**
 * Integration secrets (Pipedrive / Kit tokens, Slack / Zapier webhook URLs) never leave the server.
 * The browser gets a masked placeholder that still shows "connected" and fits the inputs' URL checks.
 * When a masked value comes back in a save or test request it means "unchanged / use the stored one".
 */

const MASK = "••••••••";

export function isMaskedSecret(value: unknown): boolean {
  return typeof value === "string" && value.includes("••••");
}

export function maskSecret(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const v = value.trim();
  return v.length > 12 ? `${MASK}${v.slice(-4)}` : MASK;
}

export function maskWebhookUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    return `${new URL(value.trim()).origin}/${MASK}`;
  } catch {
    return MASK;
  }
}

/** The value a test endpoint should use: a fresh one typed by the user, else the stored secret. */
export function resolveSecretInput(input: unknown, stored: unknown): string {
  if (typeof input === "string" && input.trim() && !isMaskedSecret(input)) return input.trim();
  return typeof stored === "string" ? stored.trim() : "";
}

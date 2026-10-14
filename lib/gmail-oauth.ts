import { decrypt } from "@/lib/encryption";

// Cookie holding the random OAuth `state` for the Gmail connect flow (CSRF protection).
export const GMAIL_STATE_COOKIE = "gmail_oauth_state";

/**
 * Best-effort revoke of our Gmail access on Google's side, so the app disappears from the
 * user's Google Account permissions. Takes the encrypted refresh token as stored on the account.
 * Never throws — callers continue removing the tokens from the DB regardless.
 */
export async function revokeGmailAccess(encryptedRefreshToken?: string | null): Promise<void> {
  const refreshToken = decrypt(encryptedRefreshToken || "");
  if (!refreshToken) return;
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Non-fatal
  }
}

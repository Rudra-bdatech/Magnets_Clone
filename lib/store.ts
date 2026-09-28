"use client";

import { pages as seedPages, sequences as seedSequences, type MagnetPage, type Sequence, type Account, type Lead, type Integration, account as seedAccount, leads as seedLeads, integrations as seedIntegrations } from "@/lib/data";

export function safeSetItem(key: string, value: string) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage quota exceeded for ${key}`, e);
      try {
        if (key === "currentUserAccount") {
          const parsed = JSON.parse(value);
          if (parsed.logo && parsed.logo.length > 20000) {
            delete parsed.logo;
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        }
      } catch (fallbackErr) {
        console.error("Could not write to localStorage fallback:", fallbackErr);
      }
    }
  }
}

export function loadPages(): MagnetPage[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserPages");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }
  return [];
}

export function savePages(pages: MagnetPage[]) {
  if (typeof window !== "undefined") {
    safeSetItem("currentUserPages", JSON.stringify(pages));
    try {
      localStorage.setItem("leadmagnets_last_sync", Date.now().toString());
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel("leadmagnets_live_sync");
        bc.postMessage({ type: "PAGES_UPDATED", timestamp: Date.now() });
        bc.close();
      }
    } catch (_) {}
    const email = localStorage.getItem("currentUserEmail");
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "savePages", data: pages, email }),
    }).catch(console.error);

    // Keep corresponding sequences in loadSequences() in sync with page sequence updates
    try {
      const currentSequences = loadSequences();
      let seqsChanged = false;
      const nextSequences = currentSequences.map((s) => {
        const matchingPage = pages.find((p) => p.id === s.pageId || p.id === s.id);
        if (matchingPage && matchingPage.sequenceEmails) {
          seqsChanged = true;
          return {
            ...s,
            status: (matchingPage.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
            stopOnBooking: matchingPage.stopOnCall ?? s.stopOnBooking,
            emails: matchingPage.sequenceEmails.map((e, idx) => {
              const min = e.delayUnit === "minutes"
                ? 0
                : e.delayUnit === "hours"
                  ? (e.delayDays ?? 1) * 60
                  : (e.delayDays ?? (idx === 0 ? 0 : 1)) * 1440;
              const lbl = min === 0
                ? "Instantly"
                : min < 1440
                  ? `${Math.round(min / 60)} hour${Math.round(min / 60) > 1 ? "s" : ""} later`
                  : `${Math.round(min / 1440)} day${Math.round(min / 1440) > 1 ? "s" : ""} later`;
              return {
                id: e.id || `se_${s.id}_${idx + 1}`,
                subject: e.subject || `Follow-up #${idx + 1}`,
                delayLabel: lbl,
                delayMinutes: min,
                status: (matchingPage.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
                sent: s.emails[idx]?.sent || 0,
                opened: s.emails[idx]?.opened || 0,
                body: e.body || "",
              };
            }),
          };
        }
        return s;
      });
      if (seqsChanged) {
        saveSequences(nextSequences);
      }
    } catch (_) {}
  }
}

export function deletePage(id: string) {
  if (typeof window !== "undefined") {
    const current = loadPages().filter((p) => p.id !== id);
    safeSetItem("currentUserPages", JSON.stringify(current));
    const email = localStorage.getItem("currentUserEmail");
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deletePage", data: { id }, email }),
    }).catch(console.error);
    // Also save the pruned list so savePages won't overwrite with full list
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "savePages", data: current, email }),
    }).catch(console.error);
  }
}

export function resetPages() {
  savePages(seedPages);
}

export function loadSequences(): Sequence[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserSequences");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
    return [];
  }
  return [];
}

export function saveSequences(sequences: Sequence[]) {
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  if (typeof window !== "undefined") {
    safeSetItem("currentUserSequences", JSON.stringify(sequences));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveSequences", data: sequences, email }),
  }).catch(console.error);
}

export function deleteSequence(id: string) {
  if (typeof window !== "undefined") {
    const current = loadSequences();
    const targetSeq = current.find((s) => s.id === id);
    const targetPageId = targetSeq?.pageId || id;

    const nextSequences = current.filter((s) => s.id !== id);
    safeSetItem("currentUserSequences", JSON.stringify(nextSequences));

    // Also disable sequence on the associated lead magnet page
    const pages = loadPages();
    let pagesChanged = false;
    const updatedPages = pages.map((p) => {
      if (p.id === id || p.id === targetPageId) {
        pagesChanged = true;
        return { ...p, sequenceEnabled: false, sequenceEmails: [] };
      }
      return p;
    });
    if (pagesChanged) {
      savePages(updatedPages);
    }
  }
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteSequence", data: { id }, email }),
  }).catch(console.error);
}

export function resetSequences() {
  saveSequences([]);
}

export function setSessionExpiry(days = 7) {
  if (typeof window !== "undefined") {
    const expiryTime = Date.now() + days * 24 * 60 * 60 * 1000;
    safeSetItem("sessionExpiry", String(expiryTime));
  }
}

export function isSessionValid(): boolean {
  if (typeof window === "undefined") return false;
  const email = localStorage.getItem("currentUserEmail");
  if (!email) return false;

  const expiry = localStorage.getItem("sessionExpiry");
  if (expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      // 7-day session expired! Clear local browser session keys ONLY.
      // NOTE: Database user data remains 100% safe & untouched in MongoDB.
      localStorage.removeItem("currentUserEmail");
      localStorage.removeItem("currentUserAccount");
      localStorage.removeItem("sessionExpiry");
      return false;
    }
  }
  return true;
}

export function loadAccount(): Account | null {
  if (typeof window !== "undefined") {
    if (!isSessionValid()) return null;
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return null;
    const cached = localStorage.getItem("currentUserAccount");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed) {
          return { ...parsed, email: email.trim() };
        }
      } catch (e) { }
    }
    return null;
  }
  return null;
}

export async function saveAccount(account: Account): Promise<{ success: boolean; account?: Account; error?: string }> {
  try {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "saveAccount", data: account }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to save account" };
    }
    const cleanAccount = data.account || account;
    if (typeof window !== "undefined") {
      const sanitized = { ...cleanAccount };
      delete sanitized.password;
      safeSetItem("currentUserAccount", JSON.stringify(sanitized));
      if (account.email) safeSetItem("currentUserEmail", account.email.trim().toLowerCase());
      try {
        localStorage.setItem("leadmagnets_last_sync", Date.now().toString());
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("leadmagnets_live_sync");
          bc.postMessage({ type: "BRAND_UPDATED", timestamp: Date.now() });
          bc.close();
        }
      } catch (_) {}
    }
    return { success: true, account: cleanAccount };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save account" };
  }
}

export function loadIntegrations(): Integration[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserIntegrations");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
    return [];
  }
  return [];
}

export function saveIntegrations(integrations: Integration[]) {
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  if (typeof window !== "undefined") {
    safeSetItem("currentUserIntegrations", JSON.stringify(integrations));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveIntegrations", data: integrations, email }),
  }).catch(console.error);
}

export function loadLeads(): Lead[] {
  if (typeof window !== "undefined") {
    const email = localStorage.getItem("currentUserEmail");
    if (!email) return [];
    const cached = localStorage.getItem("currentUserLeads");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
    return [];
  }
  return [];
}

export function saveLeads(leads: Lead[]) {
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  if (typeof window !== "undefined") {
    safeSetItem("currentUserLeads", JSON.stringify(leads));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveLeads", data: leads, email }),
  }).catch(console.error);
}

export function deleteLead(leadId: string) {
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  if (typeof window !== "undefined") {
    const current = loadLeads().filter((l) => l.id !== leadId);
    safeSetItem("currentUserLeads", JSON.stringify(current));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteLead", data: { id: leadId }, email }),
  }).catch(console.error);
}

export function loadResources(): any[] {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("currentUserResources");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) { }
    }
  }
  return [];
}

export function saveResources(resources: any[]) {
  const email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
  if (typeof window !== "undefined") {
    safeSetItem("currentUserResources", JSON.stringify(resources));
  }
  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "saveResources", data: resources, email }),
  }).catch(console.error);
}
let inFlightSyncPromise: Promise<any> | null = null;
let inFlightSyncEmail: string | null = null;

export async function syncUserData(): Promise<{
  account: Account;
  pages: MagnetPage[];
  sequences: Sequence[];
  leads: Lead[];
  integrations: Integration[];
  resources?: any[];
} | null> {
  try {
    let email = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
    if (!email) {
      const meRes = await fetch("/api/auth/me").catch(() => null);
      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.email) {
          email = meData.email;
          if (typeof window !== "undefined") {
            safeSetItem("currentUserEmail", email as string);
          }
        }
      }
    }
    if (!email) return null;

    const normEmail = email.toLowerCase();
    if (inFlightSyncPromise && inFlightSyncEmail === normEmail) {
      return inFlightSyncPromise;
    }

    inFlightSyncEmail = normEmail;
    inFlightSyncPromise = (async () => {
      try {
        const url = `/api/data?email=${encodeURIComponent(email!)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data && typeof window !== "undefined") {
          if (data.account && data.account.email) {
            if (data.account.email.toLowerCase() === normEmail) {
              safeSetItem("currentUserAccount", JSON.stringify(data.account));
              safeSetItem("currentUserEmail", data.account.email);
            }
          }

          if (data.pages && Array.isArray(data.pages)) {
            safeSetItem("currentUserPages", JSON.stringify(data.pages));
          }

          if (data.sequences) safeSetItem("currentUserSequences", JSON.stringify(data.sequences));
          if (data.leads) safeSetItem("currentUserLeads", JSON.stringify(data.leads));
          if (data.integrations) safeSetItem("currentUserIntegrations", JSON.stringify(data.integrations));
          if (data.resources) {
            const cleanResources = data.resources.filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
            safeSetItem("currentUserResources", JSON.stringify(cleanResources));
          }
        }
        return data;
      } finally {
        inFlightSyncPromise = null;
        inFlightSyncEmail = null;
      }
    })();

    return inFlightSyncPromise;
  } catch (error) {
    console.error("Failed to sync database", error);
    return null;
  }
}

export const syncWithDatabase = syncUserData;
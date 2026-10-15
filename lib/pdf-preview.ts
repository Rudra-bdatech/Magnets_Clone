import { PDFDocument } from "pdf-lib";

// Small in-memory cache so a busy locked PDF isn't re-downloaded and re-split on
// every view. Best-effort only: each server instance has its own copy.
const MAX_CACHE_ENTRIES = 20;
const MAX_CACHE_BYTES = 80 * 1024 * 1024;
const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { bytes: Uint8Array; pageCount: number; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  // Refresh LRU position
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function cacheSet(key: string, bytes: Uint8Array, pageCount: number) {
  cache.set(key, { bytes, pageCount, expiresAt: Date.now() + CACHE_TTL_MS });
  let total = 0;
  cache.forEach((e) => (total += e.bytes.byteLength));
  while (cache.size > MAX_CACHE_ENTRIES || total > MAX_CACHE_BYTES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey === undefined) break;
    total -= cache.get(oldestKey)!.bytes.byteLength;
    cache.delete(oldestKey);
  }
}

/**
 * Build a new PDF containing only the first `freePages` pages of `source`.
 * The locked pages are not copied, so they never leave the server.
 */
export async function buildPreviewPdf(
  cacheKey: string,
  freePages: number,
  loadSource: () => Promise<ArrayBuffer>
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const key = `${cacheKey}#${freePages}`;
  const cached = cacheGet(key);
  if (cached) {
    return { bytes: cached.bytes, pageCount: cached.pageCount };
  }

  const source = await PDFDocument.load(await loadSource(), { ignoreEncryption: true });
  if (source.isEncrypted) {
    // pdf-lib cannot decrypt; copied pages would be unreadable
    throw new Error("Encrypted PDFs cannot be split into a preview");
  }
  const count = Math.min(Math.max(0, freePages), source.getPageCount());

  const preview = await PDFDocument.create();
  const copied = await preview.copyPages(source, Array.from({ length: count }, (_, i) => i));
  copied.forEach((p) => preview.addPage(p));
  const bytes = await preview.save();

  cacheSet(key, bytes, count);
  return { bytes, pageCount: count };
}

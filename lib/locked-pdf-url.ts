/**
 * Public URLs for locked PDFs.
 *
 * A locked PDF is served at /<username>/<slug> (the same branded URL shape as landing
 * pages). /pdf-viewer/<id> keeps working forever and redirects to that URL.
 *
 * The /<username>/<x> route resolves landing pages first, then locked PDFs, matching x
 * against both `slug` and `id`. A slug only gives a correct link when no other page of
 * the same user uses it, so when it is shared (or missing) we fall back to the page id,
 * which always resolves to exactly this PDF.
 *
 * Safe to import from client and server code.
 */

export interface SlugOwner {
  id?: string | null;
  slug?: string | null;
}

const SAFE_SLUG = /^[a-z0-9][a-z0-9-]*$/i;

/** Path segment under /<username>/ that resolves to this PDF and nothing else. */
export function lockedPdfSegment(pdf: SlugOwner, siblings: ReadonlyArray<SlugOwner | null | undefined>): string {
  const id = String(pdf.id || "");
  const slug = (pdf.slug || "").trim();
  if (!slug || slug === id || !SAFE_SLUG.test(slug)) return id;
  const clash = siblings.some(
    (p) => p && String(p.id || "") !== id && ((p.slug || "").trim() === slug || String(p.id || "") === slug)
  );
  return clash ? id : slug;
}

/**
 * Root-relative public path for a locked PDF. Falls back to /pdf-viewer/<id> while the
 * owner's username is unknown, so a link copied early is never broken.
 */
export function lockedPdfPath(
  username: string | null | undefined,
  pdf: SlugOwner,
  siblings: ReadonlyArray<SlugOwner | null | undefined>
): string {
  const id = String(pdf.id || "");
  const user = (username || "").trim();
  if (!user) return `/pdf-viewer/${encodeURIComponent(id)}`;
  return `/${encodeURIComponent(user)}/${encodeURIComponent(lockedPdfSegment(pdf, siblings))}`;
}

/** `base` if no other page uses it, otherwise base-2, base-3, … */
export function uniqueSlug(
  base: string,
  pages: ReadonlyArray<SlugOwner | null | undefined>,
  excludeId?: string | null
): string {
  const root = base.trim() || "locked-pdf";
  const taken = new Set<string>();
  for (const p of pages) {
    if (!p || (excludeId && String(p.id || "") === excludeId)) continue;
    if (p.slug) taken.add(p.slug.trim());
    if (p.id) taken.add(String(p.id));
  }
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

/**
 * Shown on a public landing page / profile / PDF viewer whose owner's free trial ended more than
 * PUBLIC_PAGE_GRACE_DAYS ago without a subscription (lib/subscription.ts publicPagesLive).
 * Visitors get a neutral message; the owner gets a way back to the dashboard to upgrade.
 */
export default function PageUnavailable({ isOwner = false }: { isOwner?: boolean }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0E0E10] px-4 text-center">
      <div className="max-w-md space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181B] p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-500/10 text-zinc-500">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">This page is unavailable</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {isOwner
            ? "Your free trial has ended, so your pages are offline for visitors. Upgrade to Pro to bring them back instantly."
            : "This page has been paused by its owner and is not accepting visitors right now."}
        </p>
        {isOwner && (
          <a
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 text-xs font-bold text-white transition shadow-md"
          >
            Upgrade to Pro
          </a>
        )}
      </div>
    </main>
  );
}

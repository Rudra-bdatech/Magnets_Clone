"use client";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#F8FBFF] dark:bg-[#0E0E10] px-6 py-6 lg:px-8 animate-pulse">
      {/* ── Header Skeleton ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-zinc-200 dark:bg-[#202026]" />
          <div className="h-4 w-72 rounded-lg bg-zinc-100 dark:bg-[#18181C]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 rounded-xl bg-zinc-200 dark:bg-[#202026]" />
          <div className="h-10 w-36 rounded-xl bg-[#0066B2]/20 dark:bg-[#0066B2]/30" />
        </div>
      </div>

      {/* ── Top Metric / Stats Cards Skeleton ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-xs dark:border-[#202026] dark:bg-[#141418]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 rounded-md bg-zinc-200 dark:bg-[#202026]" />
              <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-[#1C1C22]" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-zinc-300 dark:bg-[#282830] mb-2" />
            <div className="h-3.5 w-32 rounded-md bg-zinc-100 dark:bg-[#18181C]" />
          </div>
        ))}
      </div>

      {/* ── Main Content / Table Area Skeleton ── */}
      <div className="rounded-2xl border border-zinc-200/70 bg-white shadow-xs dark:border-[#202026] dark:bg-[#141418] overflow-hidden">
        {/* Filter / Search Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-zinc-100 dark:border-[#202026]">
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 rounded-xl bg-zinc-200 dark:bg-[#202026]" />
            <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-[#18181C]" />
            <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-[#18181C]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-44 rounded-xl bg-zinc-100 dark:bg-[#18181C]" />
            <div className="h-9 w-28 rounded-xl bg-zinc-100 dark:bg-[#18181C]" />
          </div>
        </div>

        {/* Row Items Skeleton */}
        <div className="divide-y divide-zinc-100 dark:divide-[#202026]">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-[#1C1C22] shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-48 rounded-md bg-zinc-200 dark:bg-[#202026]" />
                  <div className="h-3 w-32 rounded-md bg-zinc-100 dark:bg-[#18181C]" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-8">
                <div className="h-3.5 w-16 rounded-md bg-zinc-100 dark:bg-[#18181C]" />
                <div className="h-3.5 w-24 rounded-md bg-zinc-100 dark:bg-[#18181C]" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 rounded-lg bg-zinc-100 dark:bg-[#1C1C22]" />
                <div className="h-8 w-20 rounded-lg bg-zinc-200 dark:bg-[#202026]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

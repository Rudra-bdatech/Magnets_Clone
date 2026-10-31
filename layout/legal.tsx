import { ArrowLeftIcon } from "@/components/icons";
import BrandLogo from "@/components/brand";

export function LegalHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a aria-label="Funnels home" href="/">
          <BrandLogo height="h-8" />
        </a>
        <a
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] px-3 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition hover:bg-zinc-100 dark:hover:bg-[#282830]"
          href="/"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Home
        </a>
      </div>
    </header>
  );
}

export function LegalFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-4 py-6 text-xs text-zinc-500 dark:text-[#9B9085] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Funnels</span>
        <div className="flex gap-4 font-medium">
          <a className="hover:text-zinc-900 dark:hover:text-white transition" href="/">
            Home
          </a>
          <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition" target="_blank" rel="noreferrer">
            Privacy
          </a>
          <a href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition" target="_blank" rel="noreferrer">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}

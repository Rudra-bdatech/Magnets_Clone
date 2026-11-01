import Image from "next/image";
import BrandLogo from "@/components/brand";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Features", href: "/#features" },
      { label: "Integrations", href: "/#integrations" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Create account", href: "/register" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-600 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2">
            <BrandLogo height="h-[28px] sm:h-[32px]" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Opt-in pages, file delivery and follow-up emails for people who give away useful things.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a className="transition hover:text-zinc-900 dark:hover:text-white" href={l.href}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-row items-center justify-between border-t border-zinc-200/80 dark:border-zinc-800/80 py-5 text-xs">
          <span>© {new Date().getFullYear()} Funnels</span>
          <span>funnels.co.in</span>
        </div>
      </div>

      {/* Crystal-clear vector brand wordmark anchored to the footer bottom */}
      <div className="pointer-events-none select-none w-full overflow-hidden flex justify-center items-end pt-6 sm:pt-8 -mb-[2.5vw] sm:-mb-[3vw]">
        <div className="w-full">
          {/* Light mode vector logo */}
          <Image
            src="/brand/funnels-footer-light.svg"
            alt="Funnels"
            width={2495}
            height={541}
            unoptimized
            priority
            className="w-full h-auto object-contain dark:hidden"
          />
          {/* Dark mode vector logo */}
          <Image
            src="/brand/funnels-footer-dark.svg"
            alt="Funnels"
            width={2495}
            height={541}
            unoptimized
            priority
            className="w-full h-auto object-contain hidden dark:block"
          />
        </div>
      </div>
    </footer>
  );
}

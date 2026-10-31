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
          <span>magnets.bdatech.in</span>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the page edge */}
      <p
        aria-hidden="true"
        className="pointer-events-none select-none whitespace-nowrap text-center font-extrabold leading-[0.8] tracking-[-0.06em] text-[28vw] sm:text-[28.3vw] -mb-[4.5vw] sm:-mb-[5vw] text-transparent [-webkit-text-stroke:1px_rgba(0,102,178,0.28)] dark:[-webkit-text-stroke:1px_rgba(56,189,248,0.2)]"
        style={{ paintOrder: "stroke fill", WebkitTextFillColor: "transparent", color: "rgba(0,102,178,0.28)" }}
      >
        Funnels
      </p>
    </footer>
  );
}



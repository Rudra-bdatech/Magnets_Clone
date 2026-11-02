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
  const productCol = columns.find((c) => c.title === "Product");
  const accountCol = columns.find((c) => c.title === "Account");
  const legalCol = columns.find((c) => c.title === "Legal");

  return (
    <footer className="relative overflow-hidden border-t border-zinc-200/80 dark:border-zinc-800/80 bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-600 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <BrandLogo height="h-[28px] sm:h-[32px]" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Opt-in pages, file delivery and follow-up emails for people who give away useful things.
            </p>
          </div>

          {/* Product Column (Left on mobile, 3rd col on desktop) */}
          {productCol && (
            <div className="col-span-1 lg:col-span-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{productCol.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {productCol.links.map((l) => (
                  <li key={l.label}>
                    <a className="transition hover:text-zinc-900 dark:hover:text-white" href={l.href}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Right column on mobile (Account + Legal stacked), separate columns on desktop */}
          <div className="col-span-1 flex flex-col gap-8 lg:contents">
            {accountCol && (
              <div className="lg:col-span-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{accountCol.title}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {accountCol.links.map((l) => (
                    <li key={l.label}>
                      <a className="transition hover:text-zinc-900 dark:hover:text-white" href={l.href}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {legalCol && (
              <div className="lg:col-span-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{legalCol.title}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {legalCol.links.map((l) => (
                    <li key={l.label}>
                      <a className="transition hover:text-zinc-900 dark:hover:text-white" href={l.href}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-row items-center justify-between border-t border-zinc-200/80 dark:border-zinc-800/80 py-5 text-[11px] sm:text-xs">
          <span>© {new Date().getFullYear()} Funnels</span>
          <a
            href="https://bdatechnologies.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-right inline-flex items-center"
          >
            <span className="shiny-text font-medium">A Product by BDA Technologies</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

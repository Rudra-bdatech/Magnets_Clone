import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarClock, Globe, Inbox, Link2, Mail, Rocket, Tag, UserPlus } from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import Button from "@/components/ui/button";
import { type Lead } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";
import { dbConnect } from "@/lib/mongodb";
import { LeadModel, AccountModel } from "@/lib/models";
import { account as seedAccount } from "@/lib/data";

export const dynamic = "force-dynamic";

const statusCopy: Record<Lead["status"], { label: string; desc: string; color: string }> = {
  new: { label: "Signed up", desc: "The signup was recorded.", color: "bg-brand-orange" },
  delivered: { label: "Resource delivered", desc: "The resource email was sent automatically.", color: "bg-ink-400" },
  opened: { label: "Opened", desc: "They opened a follow-up email.", color: "bg-brand-aqua" },
  replied: { label: "Replied", desc: "They replied to your sequence.", color: "bg-emerald-500" },
  stopped: { label: "Sequence stopped", desc: "Follow-ups stopped, likely after booking.", color: "bg-brand-yellow" },
  completed: { label: "Completed", desc: "Sequence completed all steps.", color: "bg-blue-500" },
  pending_email: { label: "DM Sent (Pending)", desc: "LinkedIn DM sent, awaiting email signup.", color: "bg-amber-500" },
  converted: { label: "Converted", desc: "Email captured & resource claimed.", color: "bg-emerald-500" },
};

function SourceLabel({ source }: { source: Lead["source"] }) {
  if (source === "leadmagnets" || (source as string) === "magnets")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
        <Inbox className="h-3 w-3" aria-hidden="true" /> LeadMagnets URL
      </span>
    );
  if (source === "custom-domain")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
        <Globe className="h-3 w-3" aria-hidden="true" /> Custom domain
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
      <Link2 className="h-3 w-3" aria-hidden="true" /> Integration
    </span>
  );
}

export default async function LeadDetail({ params }: { params: { id: string } }) {
  await dbConnect();

  const [accountRaw, leadRaw] = await Promise.all([
    AccountModel.findOne().lean(),
    LeadModel.findOne({ id: params.id }).lean()
  ]);
  const account = accountRaw ? JSON.parse(JSON.stringify(accountRaw)) : seedAccount;
  const lead = leadRaw ? (JSON.parse(JSON.stringify(leadRaw)) as Lead) : null;

  if (!lead) {
    return (
      <DashboardShell account={account} title="Lead">
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <p className="text-sm font-medium text-ink-700 dark:text-ink-300">Lead not found</p>
          <Link
            href="/dashboard/leads"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950 dark:bg-brand-orange dark:text-ink-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to leads
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const st = statusCopy[lead.status];

  return (
    <DashboardShell account={account} title="Lead">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">
        <Link
          href="/dashboard/leads"
          className="inline-flex h-8 items-center gap-1.5 text-sm font-medium text-ink-600 transition hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to leads
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-base font-bold text-white">
              {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-ink-950 dark:text-white">{lead.name}</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">{lead.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="w-auto">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Send email
            </Button>
            <Button className="w-auto hover:border-brand-coral hover:bg-brand-coral hover:text-white">
              Remove
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95">
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${st.color}`} />
                <div>
                  <p className="text-sm font-semibold text-ink-950 dark:text-white">{st.label}</p>
                  <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">{st.desc}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95">
              <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Signed up via</h3>
              <div className="mt-3 flex items-center gap-2">
                <SourceLabel source={lead.source} />
                <Link
                  href={`/dashboard/leadmagnets/${lead.pageId}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white transition"
                >
                  {lead.page} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-4 space-y-2 border-t border-ink-200 pt-4 dark:border-ink-700">
                <p className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <CalendarClock className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  Signed up {formatDateTime(lead.signedUpAt)}
                </p>
                {lead.sequence && (
                  <p className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <Rocket className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    <Link
                      href="/dashboard/sequences"
                      className="font-medium text-ink-900 hover:opacity-80 dark:text-white transition"
                    >
                      {lead.sequence}
                    </Link>
                    {lead.sequenceStep ? ` · ${lead.sequenceStep}` : ""}
                  </p>
                )}
              </div>
            </section>

            {/* Custom Field Responses */}
            {lead.customFields && Object.keys(lead.customFields).length > 0 && (
              <section className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95">
                <h3 className="text-sm font-semibold text-ink-950 dark:text-white flex items-center gap-1.5">
                  <span>Form & Interaction Data</span>
                </h3>
                <div className="mt-3 space-y-2 text-xs">
                  {Object.entries(lead.customFields).map(([key, val]) => {
                    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
                    const label =
                      norm === "linkedinprofile"
                        ? "LinkedIn Profile"
                        : norm === "linkedinpost"
                        ? "LinkedIn Post"
                        : norm === "commenttext"
                        ? "Comment Text"
                        : norm === "dmsentat"
                        ? "DM Sent At"
                        : norm === "isconverted"
                        ? "Conversion Status"
                        : norm === "convertedat"
                        ? "Converted At"
                        : key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/_/g, " ")
                            .replace(/^./, (s) => s.toUpperCase())
                            .trim();

                    const strVal = String(val ?? "");
                    const isUrl = strVal.startsWith("http://") || strVal.startsWith("https://");

                    return (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-ink-950 border border-zinc-100 dark:border-ink-800 overflow-hidden"
                      >
                        <span className="font-medium text-ink-600 dark:text-ink-400 shrink-0 text-[11px]">
                          {label}
                        </span>
                        <div className="min-w-0 max-w-full">
                          {isUrl ? (
                            <a
                              href={strVal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0066B2] dark:text-[#38BDF8] hover:opacity-80 font-semibold text-xs truncate block max-w-[260px] transition"
                            >
                              {strVal}
                            </a>
                          ) : (
                            <span className="font-bold text-ink-900 dark:text-white break-words text-xs">
                              {strVal}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95">
              <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Notes</h3>
              <textarea
                placeholder="Add a note about this lead…"
                rows={3}
                className="mt-3 w-full resize-none rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:ring-1 focus:border-brand-orange focus:ring-brand-orange dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
            </section>
          </div>

          <aside className="h-fit space-y-4">
            <section className="rounded-2xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/95">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-950 dark:text-white">
                <Tag className="h-4 w-4 text-ink-400" aria-hidden="true" />
                Tags
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.tags.length ? (
                  lead.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-ink-700 dark:bg-ink-950 dark:text-ink-300"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-ink-400">No tags yet.</p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-ink-200 bg-brand-soft p-5 dark:border-ink-700 dark:bg-ink-900/95">
              <h3 className="text-sm font-semibold text-ink-950 dark:text-white">Who converted</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-300">
                {lead.name} is one of {lead.pageId === "p1" ? "962" : "611"} signups on {lead.page}. Follow-up emails are the
                highest-leverage next step.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

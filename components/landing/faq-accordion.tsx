"use client";

import { Wand2, HardDrive, Workflow, BarChart3, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { MailIcon } from "@/components/icons";
import { BouncyAccordion, BouncyAccordionItem } from "@/components/motion/bouncy-accordion";

const faqs: BouncyAccordionItem[] = [
  {
    id: "setup-domains",
    category: "SETUP & DOMAINS",
    title: "Do I need technical skills or a custom domain to start?",
    description: "Not at all. You can generate and publish your lead magnet on a free LeadMagnets subdomain in 60 seconds. Custom CNAME subdomain integration (e.g. get.yourdomain.com) with auto-SSL is available whenever you are ready.",
    icon: <Wand2 className="h-3 w-3" aria-hidden="true" />,
    badgeColor: "bg-blue-500/10 text-[#0066B2] dark:text-[#38BDF8] border-[#0066B2]/20",
  },
  {
    id: "resource-storage",
    category: "RESOURCE STORAGE",
    title: "How does instant resource delivery work?",
    description: "When a visitor enters their email, LeadMagnets immediately fires a personalized delivery email containing their file or document link directly from native platform storage — zero Google Drive or third-party links required.",
    icon: <HardDrive className="h-3 w-3" aria-hidden="true" />,
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    id: "email-automation",
    category: "EMAIL AUTOMATION",
    title: "Can I automatically sequence follow-up emails?",
    description: "Yes! Set up automated email sequences with customized day delays (e.g. Day 1, Day 3, Day 7). You can also set smart stop conditions so sequences stop automatically when leads book a call on Calendly.",
    icon: <Workflow className="h-3 w-3" aria-hidden="true" />,
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    id: "stack-integrations",
    category: "STACK INTEGRATIONS",
    title: "Can I sync leads to my existing CRM or email stack?",
    description: "Absolutely. Seamlessly sync contacts with Kit (ConvertKit), Substack, Slack, Pipedrive, Zapier, and custom webhooks in real time.",
    icon: <BarChart3 className="h-3 w-3" aria-hidden="true" />,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
];

export default function FaqAccordion() {
  return (
    <>
      {/* Bouncy Accordion Section for FAQ Cards */}
      <div className="w-full mx-auto max-w-4xl">
        <BouncyAccordion
          items={faqs}
          defaultValue={null}
          collapsible={true}
        />
      </div>

      {/* Bottom Live Assistance Card */}
      <div className="mt-12 sm:mt-16 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-gradient-to-r from-blue-50/70 via-white/80 to-purple-50/70 dark:from-[#181824]/80 dark:via-[#14141C]/80 dark:to-[#1C1828]/80 backdrop-blur-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="h-12 w-12 rounded-2xl bg-[#0066B2]/10 dark:bg-[#38BDF8]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center shrink-0 border border-[#0066B2]/20 shadow-inner">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">Still have questions?</h4>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              Our team is here to help you set up your high-converting lead magnet engines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/register"
            className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-5 text-xs font-bold text-white shadow-md shadow-[#0066B2]/20 transition-all hover:scale-[1.02] active:scale-98"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Start Free Today
          </Link>
          <Link
            href="mailto:support@leadmagnets.app"
            className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#20202A]/80 backdrop-blur-md px-4 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <MailIcon className="h-3.5 w-3.5" aria-hidden="true" /> Contact Support
          </Link>
        </div>
      </div>
    </>
  );
}

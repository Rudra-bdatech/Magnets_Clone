import type { Metadata } from "next";
import { LegalFooter, LegalHeader } from "@/layout/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Funnels Terms of Service.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://magnets.bdatech.in/terms" },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] dark:bg-[#0E0E10] text-zinc-900 dark:text-white transition-colors">
      <LegalHeader />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-[#9B9085]">Effective July 14, 2026</p>
        <article className="mt-10 space-y-8 text-[15px] leading-7 text-zinc-800 dark:text-zinc-300">
          <p className="text-zinc-800 dark:text-zinc-200 font-normal">
            These Terms govern your use of Funnels (the &ldquo;Service&rdquo;). By creating an account, publishing a page, or
            otherwise using the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </p>
          <LegalSection title="1. What Funnels does">
            <p>
              Funnels lets you create branded lead-magnet pages, collect signups, deliver resources by email, and optionally run
              follow-up emails and connected integrations. Pages may be hosted at a Funnels URL or, if you choose, on a custom
              domain you connect. Funnels may be offered free of charge or with different plans and features over time.
            </p>
          </LegalSection>

          <LegalSection title="2. Your account">
            <p>
              You are responsible for your account, password, and the accuracy of the information you provide. You must keep your
              credentials confidential and promptly tell us if you believe your account has been accessed without permission. You
              may only connect domains, sender addresses, API keys, webhook URLs, and third-party accounts that you own or are
              authorised to use.
            </p>
          </LegalSection>

          <LegalSection title="3. Sending email">
            <p>
              Funnels can send a resource email from a Funnels-managed sender address so you can get started without setting up a
              sender domain. You may choose to send from your own verified domain instead. We will only use a customer sender
              address when the related domain has been verified for that sending setup.
            </p>
            <p>
              You are responsible for your email content, the resources you offer, and compliance with applicable laws, including
              consent, disclosure, unsubscribe, and anti-spam requirements. Where you enable a follow-up sequence, recipients can
              use the provided stop link to stop that sequence. You must not remove, obscure, or circumvent that control.
            </p>
          </LegalSection>

          <LegalSection title="4. Follow-up sequences and auto-stops">
            <p>
              A follow-up sequence sends the schedule and content you configure after a person signs up. You may choose to stop an
              enabled sequence when a subscriber converts or opts out. You are responsible for configuring your sequence and for
              checking that the sequence content and timing are appropriate for your audience.
            </p>
          </LegalSection>

          <LegalSection title="5. Optional integrations">
            <p>
              You may connect supported third-party services, including Substack, Kit, Slack, Pipedrive, and Zapier.
              If you do, you authorise Funnels to send the information needed to perform the selected action, such as
              adding a subscriber, posting a signup notification, or creating or updating a contact. Your use
              of those services is also governed by their terms, privacy notices, pricing, and limits.
            </p>
          </LegalSection>

          <LegalSection title="6. Your content and your subscribers">
            <p>
              You retain ownership of the pages, copy, images, resources, and other content you submit to Funnels. You give us the
              limited rights needed to store, host, display, deliver, and operate that content through the Service. You are
              responsible for ensuring you have all rights and permissions needed to use that content.
            </p>
            <p>
              You are also responsible for the personal data you collect through your pages. This includes providing an appropriate
              privacy notice, having a lawful basis for collection and messaging, responding to data-rights requests, and complying
              with the laws that apply to you and your subscribers.
            </p>
          </LegalSection>

          <LegalSection title="7. Acceptable use">
            <p>You must not use Funnels to:</p>
            <ul className="list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              <li>Send unsolicited, deceptive, unlawful, or abusive messages, including spam, phishing, or malware.</li>
              <li>Collect or use personal data without a lawful basis or required permissions.</li>
              <li>Publish content that is illegal, infringes rights, or is otherwise harmful.</li>
              <li>Attempt to bypass security controls, abuse rate limits, scrape the Service, or interfere with its operation.</li>
              <li>Use the Service in a way that harms Funnels, its providers, or other users.</li>
            </ul>
            <p>
              We may suspend, limit, or terminate access where we reasonably believe these Terms have been breached or the Service,
              its users, or providers are at risk.
            </p>
          </LegalSection>

          <LegalSection title="8. Third-party services">
            <p>
              Funnels relies on third-party providers for hosting, storage, authentication, email delivery, and integrations. We do
              not control those services and are not responsible for their availability, policies, changes, or charges. You are
              responsible for maintaining any third-party accounts or plans required for features you choose to use.
            </p>
          </LegalSection>

          <LegalSection title="9. Availability and changes">
            <p>
              We work to keep Funnels available and reliable, but the Service is provided on an &ldquo;as available&rdquo; basis.
              We may change, suspend, or discontinue features, including third-party integrations, where reasonably needed to
              operate, secure, or improve the Service. We do not guarantee uninterrupted or error-free operation.
            </p>
          </LegalSection>

          <LegalSection title="10. Disclaimer and limitation of liability">
            <p>
              To the maximum extent permitted by law, Funnels is provided without warranties of any kind, whether express, implied,
              or statutory. We are not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or
              for lost profits, revenue, data, goodwill, or business opportunity arising from your use of the Service.
            </p>
            <p>
              To the maximum extent permitted by law, our total liability for any claim related to the Service is limited to one
              hundred US dollars (USD $100). Nothing in these Terms excludes liability that cannot lawfully be excluded.
            </p>
          </LegalSection>

          <LegalSection title="11. Ending use">
            <p>
              You may stop using Funnels at any time. You can request or use the dashboard controls to delete your account. We may
              suspend or terminate your access where permitted by law, including for non-use, security reasons, or a breach of
              these Terms. Sections that should reasonably survive termination will continue to apply.
            </p>
          </LegalSection>

          <LegalSection title="12. Changes to these Terms">
            <p>
              We may update these Terms as Funnels changes. If a change is material, we will provide reasonable notice before it
              takes effect. Continued use after the effective date means you accept the updated Terms.
            </p>
          </LegalSection>

          <LegalSection title="13. Governing law and contact">
            <p>
              These Terms are governed by the laws of England and Wales, without regard to conflict-of-law rules. Courts in London,
              England have exclusive jurisdiction, except where mandatory law provides otherwise. Questions about these Terms can be
              sent to <a className="text-[#0066B2] dark:text-[#38BDF8] font-semibold underline-offset-4 hover:underline" href="mailto:info@bdatechnologies.com">info@bdatechnologies.com</a>.
            </p>
          </LegalSection>
        </article>
        <div className="mt-12 border-t border-zinc-200 dark:border-[#2e2e38] pt-6 text-sm text-zinc-600 dark:text-[#9B9085]">
          <p>
            Questions? Email{" "}
            <a className="text-[#0066B2] dark:text-[#38BDF8] font-semibold underline-offset-4 hover:underline" href="mailto:info@bdatechnologies.com">
              info@bdatechnologies.com
            </a>
            .
          </p>
        </div>
      </div>
      <LegalFooter />
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
      <div className="space-y-3 text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}
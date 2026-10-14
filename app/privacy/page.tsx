import type { Metadata } from "next";
import { LegalFooter, LegalHeader } from "@/layout/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LeadMagnets Privacy Policy.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://magnets.bdatech.in/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FBFF] dark:bg-[#0E0E10] text-zinc-900 dark:text-white transition-colors">
      <LegalHeader />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold text-zinc-900 dark:text-white sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-[#9B9085]">Effective October 14, 2026</p>
        <article className="mt-10 space-y-8 text-[15px] leading-7 text-zinc-800 dark:text-zinc-300">
          <p className="text-zinc-800 dark:text-zinc-200 font-normal">
            This Policy explains how LeadMagnets handles personal data when you use our service. It applies to LeadMagnets account holders
            and to people who submit a form on a page created with LeadMagnets.
          </p>
          <LegalSection title="1. The short version">
            <ul className="list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              <li>We collect the information needed to host pages, deliver emails, run selected integrations, and keep the service secure.</li>
              <li>We do not sell personal data, use it for advertising, or use it to train AI models.</li>
              <li>Signup data belongs to the account holder whose page collected it.</li>
              <li>Secrets such as API keys and webhook URLs are encrypted at rest when stored by LeadMagnets.</li>
              <li>Custom domains and custom sender domains are optional. A page can be hosted and sent from LeadMagnets by default.</li>
              <li>
                If you connect Gmail, we only use it to send the emails you set up. We never read your inbox, and our use of Google
                user data follows the Google API Services User Data Policy, including its Limited Use requirements.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="2. Your role and our role">
            <p>
              For account data, LeadMagnets is the controller. For signup data collected through a page created by an account holder,
              the account holder is normally the controller and LeadMagnets acts as a processor on that account holder&apos;s behalf.
              The account holder is responsible for their privacy notice, lawful basis, permissions, and the content of messages
              they send to their audience.
            </p>
          </LegalSection>

          <LegalSection title="3. Information we collect from account holders">
            <p>When you create or use an account, we may process:</p>
            <ul className="list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              <li>Your name, email address, authentication details, and account timestamps. Passwords are stored as hashes, not plaintext.</li>
              <li>Your chosen LeadMagnets username, custom-domain settings, brand settings, sender settings, and page configuration.</li>
              <li>The copy, images, resource links, email content, and follow-up sequences you create.</li>
              <li>
                Integration settings and credentials you choose to add, including email, newsletter, calendar, Slack, Pipedrive, and
                Zapier connections.
              </li>
              <li>
                If you connect a Gmail account, your Gmail address, the display name on your Google account, and the OAuth tokens
                Google issues to us. See section 7 for details.
              </li>
              <li>
                Technical and security information, including IP address information used for abuse prevention and rate limiting,
                request metadata, and error logs.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Information collected from page visitors and subscribers">
            <p>
              When a person submits a LeadMagnets form, we process the name and email address they provide, the page they signed up on,
              and the submission time. When a follow-up sequence is enabled, we also keep the information needed to track whether
              that sequence is active, completed, stopped, or failed for that email address.
            </p>
            <p>
              Page analytics use a random browser-tab session identifier to count visits and visible-page engagement without
              analytics cookies or raw IP addresses. For successful signups, we may also record whether that signup explicitly
              started a configured post-signup video or completed a configured quiz. These outcome timestamps are used only to
              provide aggregate performance reporting to the account holder.
            </p>
            <p>
              Forms can appear on a LeadMagnets-hosted URL or an account holder&apos;s custom domain. The host does not change which
              account owns the signup data.
            </p>
          </LegalSection>

          <LegalSection title="5. How we use information">
            <p>We use information to:</p>
            <ul className="list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              <li>Provide, secure, and improve the service, including account authentication and abuse prevention.</li>
              <li>Host and serve lead-magnet pages, uploaded images, and the resource email requested by a subscriber.</li>
              <li>Run follow-up email sequences configured by an account holder and honour a recipient&apos;s request to stop those follow-ups.</li>
              <li>
                Stop a configured follow-up sequence when a connected calendar provider reports that the same person booked a call,
                if the account holder has enabled that option.
              </li>
              <li>
                Send signup data to the optional integrations selected by the account holder, such as Substack, Kit, Slack,
                Pipedrive, or Zapier.
              </li>
              <li>Send account holders product updates and important service notices. You can unsubscribe from product marketing emails without deleting your account.</li>
              <li>Respond to support requests and enforce our Terms.</li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Email delivery and integrations">
            <p>
              LeadMagnets can deliver resource emails and follow-up sequences in one of three ways: from a LeadMagnets-managed
              sender address, through an SMTP server whose credentials the account holder provides, or from the account holder&apos;s
              own Gmail address if they connect their Google account (see section 7). SMTP passwords and Google tokens are encrypted
              at rest.
            </p>
            <p>
              Optional integrations are activated by the account holder. Depending on what they connect, signup information may be
              sent to Substack or Kit for newsletter subscription, Slack for a notification, Pipedrive to create or update
              a person, Zapier to trigger an account holder&apos;s automation, or Calendly or Cal.com to stop an enabled follow-up
              sequence after a booking. Each third party processes information under its own terms and privacy notice.
            </p>
          </LegalSection>

          <LegalSection title="7. Google user data (Gmail)">
            <p>
              Account holders can choose to connect a Gmail or Google Workspace account so that emails are sent from their own address.
              Connecting is optional. When you connect, Google asks you to grant LeadMagnets the following permissions:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              <li>
                <strong className="text-zinc-900 dark:text-white">Send email on your behalf</strong> (<code>gmail.send</code>). This lets us send the resource emails and
                follow-up sequence emails you configure, from your Gmail address. Messages sent this way appear in your Gmail Sent folder.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Your email address and basic profile</strong> (<code>userinfo.email</code>,{" "}
                <code>userinfo.profile</code>). This lets us show which Gmail account is connected and use your name as the sender name.
              </li>
            </ul>
            <p>
              <strong className="text-zinc-900 dark:text-white">What we do not do.</strong> We cannot and do not read, search, download, modify, or delete the emails in
              your mailbox, and we do not access your contacts, calendar, or files. We only send the messages that you have set up in
              LeadMagnets.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-white">How it is stored.</strong> The access and refresh tokens Google issues to us are encrypted at rest with
              AES-256-GCM and are used only by our servers to send your emails. They are never shown in the browser or shared with other
              account holders.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-white">Sharing.</strong> We do not sell Google user data, and we do not use it for advertising, for
              credit-worthiness or lending decisions, or to develop, improve, or train generalised AI or machine-learning models. We do not
              transfer it to third parties except as needed to provide this sending feature, to comply with applicable law, for security
              purposes, or as part of a merger or acquisition with prior notice. Our staff do not read Google user data unless you give us
              explicit permission for a specific message, it is necessary for security or abuse investigation, or it is required by law.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-white">Limited Use.</strong> LeadMagnets&apos; use and transfer to any other app of information received from
              Google APIs will adhere to the{" "}
              <a className="text-[#0066B2] dark:text-[#38BDF8] font-semibold underline-offset-4 hover:underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <p>
              <strong className="text-zinc-900 dark:text-white">Disconnecting.</strong> You can disconnect Gmail at any time in Settings &rarr; Email &amp; Gmail Sync.
              When you disconnect, we revoke our access with Google and delete the stored tokens. Deleting your LeadMagnets account also
              deletes them. You can also remove access from your{" "}
              <a className="text-[#0066B2] dark:text-[#38BDF8] font-semibold underline-offset-4 hover:underline" href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
                Google Account permissions page
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="8. Service providers and disclosures">
            <p>We use service providers to operate LeadMagnets. Depending on which features are used, these include:</p>
            <ul className="list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              <li><strong className="text-zinc-900 dark:text-white">Vercel</strong> for application hosting, content delivery, and file storage.</li>
              <li><strong className="text-zinc-900 dark:text-white">MongoDB</strong> for the hosted application database.</li>
              <li><strong className="text-zinc-900 dark:text-white">SocketLabs</strong> for email delivery from LeadMagnets-managed sender addresses.</li>
              <li><strong className="text-zinc-900 dark:text-white">Google</strong> for sign-in with Google and, when an account holder connects Gmail, sending email through the Gmail API.</li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Substack, Kit, Slack, Pipedrive, Zapier, Calendly, and Cal.com</strong> when an account holder
                elects to connect those services.
              </li>
            </ul>
            <p>
              We may also disclose information where required by law, to protect the rights and safety of LeadMagnets and others, or in
              connection with a reorganisation, merger, or sale of the service.
            </p>
          </LegalSection>

          <LegalSection title="9. Retention and deletion">
            <p>
              We retain account data while an account is active. Deleting an account removes the active account record and its
              associated LeadMagnets pages, signup records, and follow-up records from our application database. Copies may remain in
              provider backups for a limited period under their normal backup-retention processes. We may retain limited information
              where necessary for legal obligations, security, dispute resolution, or enforcement.
            </p>
          </LegalSection>

          <LegalSection title="10. Security">
            <p>
              We use reasonable technical and organisational measures to protect information, including HTTPS in transit, password
              hashing, encrypted storage for supported integration secrets, access controls, and rate limiting. No service can
              guarantee absolute security. If a security incident requires notice, we will provide it as required by applicable law.
            </p>
          </LegalSection>

          <LegalSection title="11. Your choices and rights">
            <p>
              Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or receive a copy of
              your personal data. Account holders can update much of their account information in the dashboard. To make a request,
              email{" "}
              <a className="text-[#0066B2] dark:text-[#38BDF8] font-semibold underline-offset-4 hover:underline" href="mailto:info@bdatechnologies.com">
                info@bdatechnologies.com
              </a>
              .
            </p>
            <p>
              If you submitted your details through an account holder&apos;s page, contact that account holder first. They control
              the purpose of that collection and any messages sent to you. You can also use the stop link in an eligible follow-up
              email to stop that sequence.
            </p>
          </LegalSection>

          <LegalSection title="12. International transfers">
            <p>
              LeadMagnets and our providers may process information in countries other than your own, including the United States. Where
              required, we rely on appropriate safeguards for international transfers.
            </p>
          </LegalSection>

          <LegalSection title="13. Children">
            <p>
              LeadMagnets is not intended for children under 16, and we do not knowingly collect personal information from children
              under 16. Contact us if you believe this has happened.
            </p>
          </LegalSection>

          <LegalSection title="14. Changes and contact">
            <p>
              We may update this Policy as LeadMagnets changes. For material changes, we will provide reasonable notice before they take
              effect. Questions can be sent to{" "}
              <a className="text-[#0066B2] dark:text-[#38BDF8] font-semibold underline-offset-4 hover:underline" href="mailto:info@bdatechnologies.com">
                info@bdatechnologies.com
              </a>
              .
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
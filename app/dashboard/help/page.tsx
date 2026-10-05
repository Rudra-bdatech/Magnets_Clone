"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { CircleHelp, BookOpen, MessageSquare, ArrowRight } from "lucide-react";
import { syncWithDatabase } from "@/lib/store";
import type { Account } from "@/lib/data";

export default function HelpPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
      }
      setLoading(false);
    });
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Message sent! We will get back to you shortly.");
    setMessage("");
    setSending(false);
  };

  const guides = [
    {
      title: "Creating your first lead magnet",
      description: "Learn how to build a landing page, customize styling, and add email sequences in minutes.",
    },
    {
      title: "Connecting a custom domain",
      description: "How to point your CNAME records to publish lead magnets on your own branding.",
    },
    {
      title: "Integrating with your CRM",
      description: "Export contacts or automatically push leads to ConvertKit, Mailchimp, or webhooks.",
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
      <div className="mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 lg:px-10 flex-1">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-ink-950 dark:text-white">
            Help Center
            <span className="cursor-help rounded-full border border-ink-300 px-1.5 py-0 text-xs font-normal text-ink-500 hover:bg-ink-100">?</span>
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Browse guides or contact our support team directly.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Documentation Guides */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] uppercase tracking-wider mb-2">
              <BookOpen className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" /> Common Guides
            </span>

            {guides.map((guide, idx) => (
              <div
                key={idx}
                className="group cursor-pointer rounded-2xl border border-[#0066B2]/30 bg-white p-5 transition hover:border-[#0066B2] dark:border-[#0066B2]/35 dark:bg-[#18181B]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-900 group-hover:text-[#0066B2] dark:text-white dark:group-hover:text-[#38BDF8]">
                    {guide.title}
                  </h4>
                  <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8]" />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed dark:text-[#9B9085]">
                  {guide.description}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] uppercase tracking-wider mb-4">
              <MessageSquare className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" /> Contact Support
            </span>

            <form onSubmit={handleSendMessage} className="rounded-2xl border border-[#0066B2]/30 bg-white p-5 dark:border-[#0066B2]/35 dark:bg-[#18181B]">
              <div className="space-y-4">
                <div>
                  <FieldLabel>Your Email</FieldLabel>
                  <Input type="email" value={account?.email || ""} disabled />
                </div>
                <div>
                  <FieldLabel>How can we help?</FieldLabel>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or request..."
                    className="w-full h-32 rounded-md border border-[#E2E8F0] bg-white p-3 text-xs text-zinc-900 focus:border-[#0066B2] focus:outline-none focus:ring-1 focus:ring-[#0066B2] dark:border-[#2e2e38] dark:bg-[#121214] dark:text-white"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4 bg-[#0066B2] hover:bg-[#005799] text-white" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

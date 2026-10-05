"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import Input, { FieldLabel } from "@/components/ui/input";
import { type MagnetPage, type Sequence, type Account } from "@/lib/data";
import { loadPages, savePages, loadSequences, saveSequences, loadAccount, syncWithDatabase } from "@/lib/store";
import AIMagnetModal from "@/components/leadmagnets/ai-magnet-modal";

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "untitled-page"
  );
}

export default function NewPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const slug = slugify(name);

  useEffect(() => {

    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    syncWithDatabase().then((data) => {
      if (data && data.account) setAccount(data.account);
    });
  }, []);

  function handleAIGenerated(data: any) {
    const page: MagnetPage = {
      id: `p_${Date.now()}`,
      name: data.name,
      slug: slugify(data.name),
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: data.headline,
      subheadline: data.subheadline,
      cta: data.cta,
      deliverable: data.deliverable,
      pitch: data.pitch,
      bullets: data.bullets,
      imageUrl: data.imageUrl || null,
      updatedAt: "Just now",
      publishedAt: null,
      template: (account?.templateId as any) || data.template || "template1",
      accent: data.accent || "#FE6F34",
    };

    const nextPages = [page, ...loadPages()];
    savePages(nextPages);

    // Save generated email sequence if returned
    if (data.emails && data.emails.length > 0) {
      const seq: Sequence = {
        id: `s_${Date.now()}`,
        name: `${data.name} Follow-up Sequence`,
        pageId: page.id,
        status: "live",
        emails: data.emails,
        stopOnBooking: true,
        stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0 },
      };
      saveSequences([seq, ...loadSequences()]);
    }

    router.push(`/dashboard/leadmagnets/${page.id}`);
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const page: MagnetPage = {
      id: `p_${Date.now()}`,
      userEmail: account?.email,
      name: name.trim() || "Untitled page",
      slug,
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: "",
      subheadline: "",
      cta: "",
      deliverable: "",
      pitch: "",
      bullets: [],
      updatedAt: "Just now",
      publishedAt: null,
      template: (account?.templateId as any) || "template1",
      accent: "#FE6F34",
    };
    const next = [page, ...loadPages()];
    savePages(next);
    router.push(`/dashboard/leadmagnets/${page.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/dashboard/leadmagnets"
          className="inline-flex h-8 items-center gap-1.5 text-sm font-medium text-ink-600 transition hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to pages
        </Link>
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand-orange dark:bg-ink-950">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink-950 dark:text-white">Create a new page</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400">Name your lead magnet or generate with AI.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" /> 1-Click AI Create
          </button>
        </div>

        <form onSubmit={create} className="mt-8 space-y-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-card dark:border-ink-700 dark:bg-ink-900/95">
          <label className="block">
            <FieldLabel>Page name</FieldLabel>
            <Input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The 5-Minute Content Engine"
              maxLength={80}
              required
            />
          </label>
          <div>
            <FieldLabel>Your LeadMagnets URL</FieldLabel>
            <div className="flex h-9 items-center gap-1 overflow-hidden rounded-md border border-ink-200 bg-ink-50 px-3 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300">
              <span className="text-ink-500 dark:text-ink-400">leadmagnets.so/{account?.username || ""}/</span>
              <span className="truncate font-medium">{slug}</span>
            </div>
            <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
              Publish on this link immediately. You can connect your own domain later.
            </p>
          </div>



          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-ink-500 dark:text-ink-400">Free forever. No credit card.</p>
            <Button type="submit">
              Create page <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>

        <AIMagnetModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onGenerated={handleAIGenerated}
        />
      </div>
    );
}
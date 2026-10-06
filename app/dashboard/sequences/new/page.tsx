"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  Sparkles, 
  Rocket, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Layers,
  Check,
  ChevronDown,
  Search
} from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { type Sequence, type SequenceEmail, type MagnetPage, type Account } from "@/lib/data";
import { loadPages, loadSequences, saveSequences, loadAccount, syncWithDatabase } from "@/lib/store";

export default function NewSequence() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {

    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);
    const localPages = loadPages();
    if (localPages.length > 0) {
      setPages(localPages);
      if (localPages[0]) setSelectedPageId(localPages[0].id);
    }

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.pages) {
          setPages(data.pages);
          if (data.pages.length > 0 && !selectedPageId) {
            setSelectedPageId(data.pages[0].id);
          }
        }
        if (data.account) setAccount(data.account);
      }
    });
  }, []);

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const isStandalone = !selectedPageId;
    const initialEmail: SequenceEmail = {
      id: `e_${Date.now()}`,
      subject: subject.trim() || (isStandalone ? "Welcome! Here's what to expect" : "Your requested resource is inside!"),
      delayLabel: "Instantly",
      delayMinutes: 0,
      status: "live",
      sent: 0,
      opened: 0,
    };

    const followUpEmail: SequenceEmail = {
      id: `e_${Date.now() + 1}`,
      subject: isStandalone 
        ? "Quick follow-up: Checking in" 
        : "Quick follow-up: Did you get a chance to check out the resource?",
      delayLabel: "1 day later",
      delayMinutes: 1440,
      status: "live",
      sent: 0,
      opened: 0,
    };

    const seq: Sequence = {
      id: `s_${Date.now()}`,
      name: name.trim(),
      pageId: selectedPageId || undefined,
      status: "live",
      stopOnBooking: false,
      stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0 },
      emails: [initialEmail, followUpEmail],
    };

    const next = [seq, ...loadSequences()];
    saveSequences(next);

    // If attached to a magnet page, also update magnet page's sequence info
    if (selectedPageId) {
      const updatedPages = pages.map((p) => {
        if (p.id === selectedPageId) {
          return {
            ...p,
            sequenceEnabled: true,
            sequenceEmails: [
              { id: initialEmail.id, subject: initialEmail.subject, delayDays: 0, body: "Here is your download link." },
              { id: followUpEmail.id, subject: followUpEmail.subject, delayDays: 1, body: "Checking in to see if you have any questions!" },
            ],
          };
        }
        return p;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUserPages", JSON.stringify(updatedPages));
      }
    }

    setTimeout(() => {
      router.push(`/dashboard/sequences/${seq.id}`);
    }, 400);
  }

  const validPages = useMemo(() => {
    return pages.filter((p) => {
      if (p.template === "locked-pdf") {
        return (p.pdfPages && p.pdfPages.length > 0) || (p.pdfTitle && p.pdfTitle !== "Untitled Locked PDF") || p.status === "live";
      }
      return true;
    });
  }, [pages]);

  const landingPagesList = useMemo(() => validPages.filter((p) => p.template !== "locked-pdf"), [validPages]);
  const lockedPdfPagesList = useMemo(() => validPages.filter((p) => p.template === "locked-pdf"), [validPages]);

  const selectedPage = useMemo(() => {
    return validPages.find((p) => p.id === selectedPageId) || null;
  }, [validPages, selectedPageId]);

  const filteredLandingPages = useMemo(() => {
    if (!searchQuery.trim()) return landingPagesList;
    const q = searchQuery.toLowerCase();
    return landingPagesList.filter((p) => 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.slug && p.slug.toLowerCase().includes(q))
    );
  }, [landingPagesList, searchQuery]);

  const filteredLockedPdfPages = useMemo(() => {
    if (!searchQuery.trim()) return lockedPdfPagesList;
    const q = searchQuery.toLowerCase();
    return lockedPdfPagesList.filter((p) => 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.pdfTitle && p.pdfTitle.toLowerCase().includes(q)) ||
      (p.slug && p.slug.toLowerCase().includes(q))
    );
  }, [lockedPdfPagesList, searchQuery]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 lg:px-8 flex-1">
          
          {/* Back button */}
          <Link
            href="/dashboard/sequences"
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-[#2e2e38] px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#25252A] transition shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sequences</span>
          </Link>

          {/* Heading */}
          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Create Follow-up Sequence
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                Automate your initial resource delivery email and scheduled follow-up drip campaign.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <form 
            onSubmit={create}
            className="mt-8 rounded-2xl border border-zinc-200/90 dark:border-[#2e2e38] bg-white/90 dark:bg-[#18181B]/90 p-6 sm:p-8 shadow-sm backdrop-blur-sm space-y-6"
          >
            {/* Sequence Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
                Sequence Name *
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VIP eBook Welcome Sequence"
                maxLength={80}
                required
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500 shadow-xs font-medium"
              />
            </div>

            {/* Attach to Lead Magnet - Production Grade Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Attach to Lead Magnet</span>
                <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold lowercase">automates signups</span>
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition shadow-xs cursor-pointer ${
                  isDropdownOpen
                    ? "border-[#0066B2] ring-2 ring-[#0066B2]/20 bg-white dark:bg-[#202026]"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-[#2e2e38] dark:bg-[#202026] dark:hover:border-zinc-700"
                }`}
              >
                {selectedPage ? (
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#2a2a32] text-sm border border-zinc-200/50 dark:border-white/5">
                      {selectedPage.template === "locked-pdf" ? "🔒" : "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {selectedPage.name || selectedPage.pdfTitle || "Untitled Page"}
                        </span>
                        {selectedPage.status === "live" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-zinc-500 dark:text-[#9B9085] font-mono truncate">
                        <span>/{selectedPage.slug || selectedPage.id}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#2a2a32] text-zinc-500 text-xs font-bold">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Standalone Sequence
                      </span>
                      <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">
                        No lead magnet attached
                      </span>
                    </div>
                  </div>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-[#0066B2] dark:text-[#38BDF8]" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu Panel */}
              {isDropdownOpen && (
                <div 
                  data-lenis-prevent="true"
                  className="absolute z-50 mt-2 w-full rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-[#2e2e38] dark:bg-[#18181B]/95 flex flex-col max-h-80"
                >
                  {/* Pinned Search Input at the top */}
                  {validPages.length > 3 && (
                    <div className="relative px-1 pt-1 pb-2 border-b border-zinc-100 dark:border-[#2e2e38] shrink-0">
                      <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search lead magnets..."
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Scrollable list container */}
                  <div 
                    data-lenis-prevent="true"
                    className="overflow-y-auto overscroll-contain flex-1 p-1 space-y-3 max-h-64"
                    tabIndex={0}
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {/* Landing Pages Group */}
                    {filteredLandingPages.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                          <span>Landing Pages</span>
                          <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                            {filteredLandingPages.length}
                          </span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {filteredLandingPages.map((p) => {
                            const isSelected = selectedPageId === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPageId(p.id);
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                                  isSelected
                                    ? "bg-[#0066B2]/10 dark:bg-[#0066B2]/20 border border-[#0066B2]/30"
                                    : "hover:bg-zinc-100 dark:hover:bg-[#222228] border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#282830] text-xs">
                                    🎯
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                        {p.name || "Untitled Landing Page"}
                                      </span>
                                      {p.status === "live" ? (
                                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          Live
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500 dark:text-zinc-400">
                                          Draft
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                                      /{p.slug || p.id}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Saved Locked PDFs Group */}
                    {filteredLockedPdfPages.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                          <span>Saved Locked PDFs</span>
                          <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                            {filteredLockedPdfPages.length}
                          </span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {filteredLockedPdfPages.map((p) => {
                            const isSelected = selectedPageId === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPageId(p.id);
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                                  isSelected
                                    ? "bg-[#0066B2]/10 dark:bg-[#0066B2]/20 border border-[#0066B2]/30"
                                    : "hover:bg-zinc-100 dark:hover:bg-[#222228] border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#282830] text-xs">
                                    🔒
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                        {p.name || p.pdfTitle || "Locked PDF"}
                                      </span>
                                      {p.status === "live" ? (
                                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          Live
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-500 dark:text-zinc-400">
                                          Draft
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                                      /{p.slug || p.id}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Standalone / None option */}
                    <div className="pt-1 border-t border-zinc-100 dark:border-[#2e2e38]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPageId("");
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                          !selectedPageId
                            ? "bg-[#0066B2]/10 dark:bg-[#0066B2]/20 border border-[#0066B2]/30"
                            : "hover:bg-zinc-100 dark:hover:bg-[#222228] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#282830] text-xs font-bold text-zinc-500">
                            ⚡
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              Standalone Sequence
                            </span>
                            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
                              Do not attach to any lead magnet
                            </span>
                          </div>
                        </div>
                        {!selectedPageId && (
                          <Check className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                        )}
                      </button>
                    </div>

                    {filteredLandingPages.length === 0 && filteredLockedPdfPages.length === 0 && searchQuery && (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        No matching lead magnets found for &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Resource Email Subject */}
            <div>
              <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
                Initial Delivery Email Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Here is your free guide download →"
                maxLength={120}
                required
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500 shadow-xs font-medium"
              />
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-[#9B9085]">
                Sent instantly to subscribers the moment they sign up on your lead magnet form.
              </p>
            </div>

            {/* Sequence Steps Preview Card */}
            <div className="rounded-xl border border-[#0066B2]/20 bg-[#EFF6FF]/60 dark:border-[#0066B2]/30 dark:bg-[#0066B2]/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                <Sparkles className="h-4 w-4" />
                <span>Automated Email Steps Preview</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 bg-white dark:bg-[#18181B] p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0066B2] text-[10px] font-bold text-white shrink-0">1</span>
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-zinc-900 dark:text-white">Resource Delivery Email</span>
                    <span className="block text-[11px] text-zinc-500 dark:text-[#9B9085] truncate">{subject || "Here is your resource download"}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">Instantly</span>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-[#18181B] p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-white shrink-0">2</span>
                  <div className="flex-1 truncate">
                    <span className="font-semibold text-zinc-900 dark:text-white">Follow-up Email #1</span>
                    <span className="block text-[11px] text-zinc-500 dark:text-[#9B9085]">Checking in to see if you have any questions</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">1 Day Later</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-zinc-100 dark:border-[#2e2e38] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11px] text-zinc-500 dark:text-[#9B9085] flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Automated & Verified Email Sender
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#0066B2] px-6 py-3 text-xs font-bold text-white hover:bg-[#005291] active:scale-[0.98] transition shadow-md cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? "Creating Sequence..." : "Create Sequence & Edit Steps"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}
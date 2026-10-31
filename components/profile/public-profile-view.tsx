"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import {
  Search,
  Share2,
  Check,
  ArrowRight,
  FileText,
  Sparkles,
  BadgeCheck,
  Layers,
  X,
  BookOpen,
  Download,
} from "lucide-react";

interface PublicMagnetPage {
  id: string;
  slug?: string;
  name: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  imageUrl?: string | null;
  isPdf?: boolean;
  pdfPageCount?: number;
  deliverable?: string;
  views?: number;
}

interface PublicAccount {
  name: string;
  brandName?: string;
  username: string;
  email: string;
  logo?: string | null;
  avatar?: string | null;
  brandColor?: string;
  privacyPolicy?: string;
  termsOfService?: string;
}

interface PublicProfileViewProps {
  account: PublicAccount;
  pages: PublicMagnetPage[];
  isCustomDomain?: boolean;
}

export default function PublicProfileView({
  account,
  pages,
  isCustomDomain = false,
}: PublicProfileViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pdf" | "instant">("all");
  const [copied, setCopied] = useState(false);

  const brandColor = account.brandColor || "#10B981";
  const name = account.name || "Workspace";
  const avatarImage = account.avatar || account.logo;

  // Filter items based on search and category tab
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const isPdf = Boolean(page.isPdf);

      if (activeFilter === "pdf" && !isPdf) return false;
      if (activeFilter === "instant" && isPdf) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (page.name || "").toLowerCase().includes(q);
      const headlineMatch = (page.headline || "").toLowerCase().includes(q);
      const subheadlineMatch = (page.subheadline || "").toLowerCase().includes(q);
      return titleMatch || headlineMatch || subheadlineMatch;
    });
  }, [pages, searchQuery, activeFilter]);

  const pdfCount = useMemo(() => {
    return pages.filter((p) =>
      Boolean(p.isPdf)
    ).length;
  }, [pages]);

  const instantCount = pages.length - pdfCount;

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Soft dynamic ambient mesh glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[360px] opacity-20 dark:opacity-20 blur-[110px] transition-all"
        style={{
          background: `radial-gradient(circle, ${brandColor} 0%, transparent 70%)`,
        }}
      />

      {/* Top Navbar Header with Brand Pill and Right-Side Controls */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-white/70 dark:bg-[#090D16]/80 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Creator badge / domain moniker */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: brandColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: brandColor }}
              />
            </span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">
              {isCustomDomain ? "Verified Domain" : "Creator Hub"}
            </span>
          </div>

          {/* Right-Side Actions: Share Button + Light/Dark Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111726] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition shadow-xs cursor-pointer active:scale-95"
              aria-label="Share profile link"
              title="Copy public profile link"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500 animate-in zoom-in" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Light / Dark Mode Toggle directly positioned at the right side */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Body Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        
        {/* Profile Hero Card: Compact, balanced, with circular avatar */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#111726]/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl text-center flex flex-col items-center">
          {/* Subtle top brand color accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1 opacity-90"
            style={{ backgroundColor: brandColor }}
          />

          {/* Avatar: Circular with border ring and verified checkmark */}
          <div className="relative mb-3.5 group">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={name}
                className="h-20 w-20 sm:h-22 sm:w-22 rounded-full object-cover border-2 border-white dark:border-[#161D2A] shadow-xl ring-2 ring-zinc-200/80 dark:ring-zinc-700/80 transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                style={{ backgroundColor: brandColor }}
                className="h-20 w-20 sm:h-22 sm:w-22 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-xl border-2 border-white dark:border-[#161D2A] ring-2 ring-zinc-200/80 dark:ring-zinc-700/80"
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className="absolute bottom-0 right-0 p-0.5 rounded-full bg-white dark:bg-[#111726] shadow-md border border-zinc-100 dark:border-zinc-800"
              title="Verified Resource Hub"
            >
              <BadgeCheck className="h-4.5 w-4.5 text-sky-500 fill-sky-500/20" />
            </div>
          </div>

          {/* Name & Clean Meta Tag */}
          <div className="space-y-1 max-w-lg">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {name}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium">@{account.username}</span>
              {account.brandName && account.brandName !== account.name && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">{account.brandName}</span>
                </>
              )}
            </div>
          </div>

          {/* Badges / Quick Stats Pill */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100/80 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>{pages.length} Free {pages.length === 1 ? "Resource" : "Resources"}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100/80 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs">
              <Layers className="h-3 w-3 text-emerald-500" />
              <span>Instant Download</span>
            </span>
          </div>
        </div>

        {/* Discovery Toolbar: Search and Filter Tabs */}
        {pages.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search input: compact, sleek glass styling */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources, guides, templates..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#111726]/90 text-xs sm:text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded-md"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="inline-flex p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#111726]/90 shadow-xs shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    activeFilter === "all"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  All ({pages.length})
                </button>
                {pdfCount > 0 && (
                  <button
                    onClick={() => setActiveFilter("pdf")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeFilter === "pdf"
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    PDFs ({pdfCount})
                  </button>
                )}
                {instantCount > 0 && (
                  <button
                    onClick={() => setActiveFilter("instant")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      activeFilter === "instant"
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Guides ({instantCount})
                  </button>
                )}
              </div>
            </div>

            {/* Results count label */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Featured Lead Magnets ({filteredPages.length})
              </h2>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2"
                >
                  Reset search
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lead Magnets Grid */}
        {pages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-[#111726]/40">
            <BookOpen className="h-10 w-10 mx-auto text-zinc-400 dark:text-zinc-600 mb-3" />
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No public lead magnets published yet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Check back soon for new resources and guides.
            </p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-[#111726]/40">
            <Search className="h-10 w-10 mx-auto text-zinc-400 dark:text-zinc-600 mb-3" />
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No matching resources found
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Try adjusting your search terms or filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition"
            >
              Show all resources
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredPages.map((page) => {
              const slug = page.slug || page.id;
              const pageUrl = isCustomDomain ? `/${slug}` : `/${account.username}/${slug}`;
              const isPdf = Boolean(page.isPdf);

              return (
                <Link
                  key={page.id}
                  href={pageUrl}
                  className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#111726]/95 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1 backdrop-blur-md"
                >
                  {/* Subtle top accent bar */}
                  <div
                    style={{ backgroundColor: brandColor }}
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
                  />

                  {/* Watermark icon on background for cards without images */}
                  {!page.imageUrl && (
                    <div className="pointer-events-none absolute -bottom-4 -right-4 text-zinc-200/50 dark:text-zinc-800/30 group-hover:text-emerald-500/10 group-hover:scale-110 transition-all duration-500">
                      {isPdf ? (
                        <FileText className="h-28 w-28 -rotate-12" />
                      ) : (
                        <Sparkles className="h-28 w-28 -rotate-12" />
                      )}
                    </div>
                  )}

                  <div>
                    {/* Header Row: Format badge and deliverable tag */}
                    <div className="flex items-center justify-between mb-3.5">
                      {isPdf ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <FileText className="h-3 w-3" />
                          <span>PDF {page.pdfPageCount ? `(${page.pdfPageCount}p)` : "Guide"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                          <Sparkles className="h-3 w-3" />
                          <span>Instant Access</span>
                        </span>
                      )}

                      <span className="text-[11px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors">
                        Free Access
                      </span>
                    </div>

                    {/* Image Thumbnail Preview (Clean 16:9 ratio, only if real image exists) */}
                    {page.imageUrl && (
                      <div className="mb-3.5 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800/60 aspect-video max-h-36 bg-zinc-100 dark:bg-zinc-900">
                        <img
                          src={page.imageUrl}
                          alt={page.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Title and Headline: Typography forward, clear hierarchy */}
                    <div className="space-y-1.5 relative z-10">
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {page.name || "Untitled Lead Magnet"}
                      </h3>
                      {page.headline && (
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {page.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card CTA Footer with Arrow Button */}
                  <div className="mt-5 flex items-center justify-between pt-3.5 border-t border-zinc-100 dark:border-zinc-800/70 text-xs font-semibold relative z-10">
                    <span
                      style={{ color: brandColor }}
                      className="group-hover:underline underline-offset-4"
                    >
                      {page.cta || "Get instant access"}
                    </span>
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-white shadow-xs group-hover:translate-x-1 transition-transform"
                      style={{ backgroundColor: brandColor }}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Polished Footer */}
        <footer className="pt-8 pb-6 text-center text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {account.privacyPolicy && (
              <a
                href={account.privacyPolicy}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-900 dark:hover:text-white transition"
              >
                Privacy Policy
              </a>
            )}
            {account.termsOfService && (
              <a
                href={account.termsOfService}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-900 dark:hover:text-white transition"
              >
                Terms of Service
              </a>
            )}
          </div>
          <p className="flex items-center justify-center gap-1.5">
            <span>Powered by</span>
            <Link
              href="https://magnets.bdatech.in"
              className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition"
            >
              Funnels
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

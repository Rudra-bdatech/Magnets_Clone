"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  LayoutDashboard,
  BarChart3,
  Users,
  FileText,
  Lock,
  Mail,
  Sliders,
  Palette,
  Plus,
  Moon,
  Sun,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";
import { loadPages, loadSequences, loadLeads } from "@/lib/store";
import type { MagnetPage, Sequence, Lead } from "@/lib/data";

interface CommandItem {
  id: string;
  category: "Navigation" | "Lead Magnets" | "Email Sequences" | "Quick Actions";
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  badge?: string;
}

export function CommandMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Manage Lenis & body scroll lock when Command Menu is open
  useEffect(() => {
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (lenis && typeof lenis.stop === "function") lenis.stop();
    } else {
      document.body.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    }
    return () => {
      document.body.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPages(loadPages());
      setSequences(loadSequences());
      setLeads(loadLeads());
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Quick Actions
      {
        id: "act-new-page",
        category: "Quick Actions",
        title: "Create New Landing Page",
        subtitle: "Build a high-converting lead capture page",
        icon: Plus,
        badge: "Action",
        action: () => {
          onClose();
          router.push("/dashboard/landing-page");
        },
      },
      {
        id: "act-new-pdf",
        category: "Quick Actions",
        title: "Create New Locked PDF",
        subtitle: "Upload and lock a PDF document behind email capture",
        icon: Lock,
        badge: "Action",
        action: () => {
          onClose();
          router.push("/dashboard/locked-pdf");
        },
      },
      {
        id: "act-new-seq",
        category: "Quick Actions",
        title: "Create Follow-up Sequence",
        subtitle: "Automate email nurturing for your subscribers",
        icon: Mail,
        badge: "Action",
        action: () => {
          onClose();
          router.push("/dashboard/sequences/new");
        },
      },

      // Core Navigation
      {
        id: "nav-dash",
        category: "Navigation",
        title: "Dashboard Overview",
        subtitle: "Key metrics and active magnets summary",
        icon: LayoutDashboard,
        action: () => {
          onClose();
          router.push("/dashboard");
        },
      },
      {
        id: "nav-analytics",
        category: "Navigation",
        title: "Analytics & Conversion",
        subtitle: "Deep-dive into views, conversion rates and traffic",
        icon: BarChart3,
        action: () => {
          onClose();
          router.push("/dashboard/analytics");
        },
      },
      {
        id: "nav-leads",
        category: "Navigation",
        title: "Leads & Audience CRM",
        subtitle: `Manage ${leads.length} captured subscriber contacts`,
        icon: Users,
        action: () => {
          onClose();
          router.push("/dashboard/leads");
        },
      },
      {
        id: "nav-sequences",
        category: "Navigation",
        title: "Email Sequences Hub",
        subtitle: `Manage ${sequences.length} follow-up automation flows`,
        icon: Mail,
        action: () => {
          onClose();
          router.push("/dashboard/sequences");
        },
      },
      {
        id: "nav-locked-pdf",
        category: "Navigation",
        title: "Locked PDF Engine",
        subtitle: "Manage protected documents and unlock gates",
        icon: Lock,
        action: () => {
          onClose();
          router.push("/dashboard/locked-pdf");
        },
      },
      {
        id: "nav-landing-page",
        category: "Navigation",
        title: "Landing Pages",
        subtitle: "Manage classic opt-in landing pages",
        icon: FileText,
        action: () => {
          onClose();
          router.push("/dashboard/landing-page");
        },
      },
      {
        id: "nav-integrations",
        category: "Navigation",
        title: "Integrations & Webhooks",
        subtitle: "Connect Zapier, Webhooks, Resend, and tools",
        icon: Sliders,
        action: () => {
          onClose();
          router.push("/dashboard/integration");
        },
      },
    ];

    // Add Lead Magnets dynamically
    pages.slice(0, 8).forEach((p) => {
      const isLocked = p.template === "locked-pdf" || (p as any).isLockedPdf;
      list.push({
        id: `magnet-${p.id}`,
        category: "Lead Magnets",
        title: p.name || "Untitled Magnet",
        subtitle: `${p.views || 0} views • ${p.signups || 0} leads (${isLocked ? "Locked PDF" : "Landing Page"})`,
        icon: isLocked ? Lock : FileText,
        badge: isLocked ? "PDF" : "Page",
        action: () => {
          onClose();
          router.push(isLocked ? "/dashboard/locked-pdf" : `/dashboard/landing-page`);
        },
      });
    });

    // Add Sequences dynamically
    sequences.slice(0, 8).forEach((s) => {
      list.push({
        id: `seq-${s.id}`,
        category: "Email Sequences",
        title: s.name || "Untitled Sequence",
        subtitle: `${s.emails.length} steps • ${s.status === "live" ? "Active" : "Draft"}`,
        icon: Mail,
        badge: s.status === "live" ? "Live" : "Draft",
        action: () => {
          onClose();
          router.push(`/dashboard/sequences/${s.id}`);
        },
      });
    });

    return list;
  }, [pages, sequences, leads, router, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (selectedEl && typeof selectedEl.scrollIntoView === "function") {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation within command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-white/[0.12] bg-white dark:bg-[#121215] shadow-2xl ring-1 ring-black/10"
          >
            {/* Top Search Input */}
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-white/[0.08] px-4 py-3.5">
              <Search className="h-5 w-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search magnets, sequences, leads..."
                className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              className="max-h-[380px] overflow-y-auto overscroll-contain p-2 divide-y-0"
            >
              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                </div>
              ) : (
                filtered.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0066B2]/10 dark:bg-[#38BDF8]/15 text-[#0066B2] dark:text-[#38BDF8]"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            isSelected
                              ? "border-[#0066B2]/30 bg-white dark:bg-[#1A1A20] text-[#0066B2] dark:text-[#38BDF8]"
                              : "border-zinc-200/60 dark:border-white/5 bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span className="rounded-md bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {item.category}
                        </span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform ${
                            isSelected ? "translate-x-0.5 text-[#0066B2] dark:text-[#38BDF8]" : "text-zinc-300 dark:text-zinc-600"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Hint */}
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-[#0E0E11] px-4 py-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-1 py-0.5 text-[10px] font-bold">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-1 py-0.5 text-[10px] font-bold">
                    ↓
                  </kbd>
                  to navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-bold">
                    ↵
                  </kbd>
                  to select
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">
                Linear-grade Command Center
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

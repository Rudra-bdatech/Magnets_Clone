"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ExternalLink,
  Eye,
  Mail,
  MousePointerClick,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  BarChart2,
  Image as ImageIcon,
  Copy,
  Check,
  CheckSquare,
  LayoutGrid,
  List,
  TrendingUp,
  Globe,
  Share2,
  SlidersHorizontal,
  ChevronDown,
  Lock,
  ChevronRight,
  FileText,
  Zap,
  ArrowUpRight,
  Filter,
  AlertTriangle
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, savePages, loadAccount, syncWithDatabase, deletePage } from "@/lib/store";
import { getMagnetSortTimestamp } from "@/lib/utils";
import { AppleCheckbox } from "@/components/leads/AppleCheckbox";

interface MagnetCardProps {
  page: MagnetPage;
  index: number;
  isSelected: boolean;
  isChecked: boolean;
  isSelectMode?: boolean;
  anyChecked?: boolean;
  onSelect: (id: string) => void;
  onOpenMobileDetails: (id: string, e?: React.MouseEvent) => void;
  onToggleCheck: (id: string, e?: React.MouseEvent) => void;
  account: Account | null;
  copiedId: string | null;
  onCopyLink: (page: MagnetPage, e?: React.MouseEvent) => void;
}

const MagnetCard = React.memo(
  function MagnetCard({
    page,
    index,
    isSelected,
    isChecked,
    isSelectMode = false,
    anyChecked = false,
    onSelect,
    onOpenMobileDetails,
    onToggleCheck,
    account,
    copiedId,
    onCopyLink,
  }: MagnetCardProps) {
    const showCheckbox = isChecked || isSelectMode || anyChecked;
    return (
      <motion.div
        layout
        transition={{
          layout: { type: "spring", stiffness: 280, damping: 30, mass: 0.8 },
        }}
        whileHover={{ y: -3, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
        whileTap={{ scale: 0.985 }}
        onClick={() => onSelect(page.id)}
        className={`group relative rounded-2xl border cursor-pointer overflow-hidden flex flex-col will-change-transform transition-colors duration-200 ${isChecked
            ? "border-[#0066B2] dark:border-[#38BDF8] bg-white dark:bg-[#18181C] ring-2 ring-[#0066B2]/40 dark:ring-[#38BDF8]/40 shadow-[0_8px_30px_rgba(0,102,178,0.12)]"
            : isSelected
              ? "border-[#0066B2] dark:border-[#38BDF8] bg-white dark:bg-[#18181C] shadow-[0_8px_30px_rgba(0,102,178,0.15)] ring-1 ring-[#0066B2]/30"
              : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#141417]/95 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-sm"
          }`}
      >
        <div className="relative h-32 w-full bg-zinc-100 dark:bg-[#0F0F12] border-b border-zinc-100 dark:border-zinc-800/60 overflow-hidden">
          {page.imageUrl && page.imageUrl.trim() !== "" ? (
            <Image
              src={page.imageUrl}
              alt={page.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index === 0}
              unoptimized={page.imageUrl.startsWith("data:") || page.imageUrl.startsWith("blob:")}
              className="object-cover will-change-transform group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center relative bg-gradient-to-br from-[#EFF6FF] via-zinc-50 to-slate-100 dark:from-[#0B1726] dark:via-[#121215] dark:to-[#18181C] p-4 select-none">
              {/* Subtle decorative grid background */}
              <div className="absolute inset-0 bg-[radial-gradient(#0066B2_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.06] dark:opacity-[0.12]" />

              {/* Mini Sleek Landing Page Mockup Skeleton */}
              <div className="relative z-0 w-36 rounded-lg border border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-[#1C1C22]/95 p-3 shadow-2xs backdrop-blur-xs flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#0066B2]/60 dark:bg-[#38BDF8]/60" />
                    <div className="h-1.5 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <div className="h-1 w-4 rounded-full bg-[#0066B2]/40" />
                </div>
                <div className="space-y-1 my-0.5">
                  <div className="h-1.5 w-24 rounded-full bg-zinc-400/80 dark:bg-zinc-500" />
                  <div className="h-1 w-20 rounded-full bg-zinc-200/80 dark:bg-zinc-700/80" />
                </div>
                <div className="h-2.5 w-full rounded bg-[#0066B2]/15 dark:bg-[#0066B2]/30 flex items-center justify-center">
                  <div className="h-1 w-10 rounded-full bg-[#0066B2]/70 dark:bg-[#38BDF8]/80" />
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center z-10">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border backdrop-blur-xs ${page.status === "live"
                  ? "bg-emerald-500 text-white border-emerald-400/30 shadow-xs"
                  : "bg-white/95 text-zinc-600 border-zinc-200/90 dark:bg-zinc-900/80 dark:text-zinc-300 dark:border-zinc-700/50 shadow-2xs"
                }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${page.status === "live" ? "bg-white animate-pulse" : "bg-zinc-400"}`} />
              {page.status === "live" ? "Published" : "Draft"}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => onToggleCheck(page.id, e)}
            className={`absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-lg border transition-all z-10 cursor-pointer ${isChecked
                ? "bg-[#0066B2] border-[#0066B2] text-white shadow-md scale-105 opacity-100"
                : showCheckbox
                  ? "bg-white/90 dark:bg-black/70 border-zinc-300 dark:border-zinc-700 text-transparent hover:border-[#0066B2] dark:hover:border-[#38BDF8] opacity-100 shadow-xs active:scale-95"
                  : "bg-white/90 dark:bg-black/70 border-zinc-300 dark:border-zinc-700 text-transparent hover:border-[#0066B2] dark:hover:border-[#38BDF8] opacity-0 md:group-hover:opacity-100 shadow-xs"
              }`}
            title={isChecked ? "Deselect magnet" : "Select magnet"}
          >
            <Check className={`h-3.5 w-3.5 stroke-[3px] ${isChecked ? "opacity-100 text-white" : "opacity-0"}`} />
          </button>
        </div>

        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition">
              {page.headline || page.name}
            </h3>
            {page.subheadline ? (
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                {page.subheadline}
              </p>
            ) : (
              <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                {page.updatedAt ? `Updated ${page.updatedAt}` : "Standard Landing Page"}
              </p>
            )}
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate max-w-[110px] sm:max-w-[140px]">/{page.slug}</span>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => onOpenMobileDetails(page.id, e)}
                className="lg:hidden inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 px-2 sm:px-2.5 py-1 text-[10.5px] sm:text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 transition cursor-pointer active:scale-95"
                title="Open Details Sheet"
              >
                <SlidersHorizontal className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8]" />
                <span>Details</span>
              </button>

              <Link
                href={`/dashboard/leadmagnets/${page.id}`}
                prefetch={true}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0066B2]/10 hover:bg-[#0066B2] text-[#0066B2] hover:text-white dark:bg-[#0066B2]/20 dark:text-[#38BDF8] dark:hover:bg-[#0066B2] dark:hover:text-white px-2 sm:px-2.5 py-1 text-[10.5px] sm:text-[11px] font-semibold transition"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.isChecked === next.isChecked &&
    prev.isSelectMode === next.isSelectMode &&
    prev.anyChecked === next.anyChecked &&
    prev.page === next.page &&
    prev.copiedId === next.copiedId
);

type SortOption = "recent" | "name" | "views" | "signups" | "conversion";

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "recent", label: "Most Recent" },
  { id: "name", label: "Name (A-Z)" },
  { id: "views", label: "Most Views" },
  { id: "signups", label: "Most Leads" },
  { id: "conversion", label: "Highest Conv. %" },
];

export default function PagesPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [pageToDeleteId, setPageToDeleteId] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Close sort menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setIsSortOpen(false);
    };
    if (isSortOpen) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [isSortOpen]);

  const newSlug = useMemo(() => {
    return newName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") || "untitled-page";
  }, [newName]);

  const landingPages = useMemo(() => {
    const list = pages.filter((p) => p.template !== "locked-pdf");
    return [...list].sort((a, b) => {
      const diff = getMagnetSortTimestamp(b) - getMagnetSortTimestamp(a);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [pages]);

  const liveCount = useMemo(() => landingPages.filter((p) => p.status === "live").length, [landingPages]);
  const draftCount = useMemo(() => landingPages.filter((p) => p.status === "draft").length, [landingPages]);
  const total = landingPages.length;

  const totalViews = useMemo(() => landingPages.reduce((sum, p) => sum + (p.views || 0), 0), [landingPages]);
  const totalSignups = useMemo(() => landingPages.reduce((sum, p) => sum + (p.signups || 0), 0), [landingPages]);
  const avgConversion = useMemo(() => totalViews > 0 ? ((totalSignups / totalViews) * 100).toFixed(1) : "0.0", [totalViews, totalSignups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = landingPages.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.headline && p.headline.toLowerCase().includes(q))
      );
    });

    list.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = (a.headline || a.name || "").toLowerCase();
        const nameB = (b.headline || b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "views") {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === "signups") {
        return (b.signups || 0) - (a.signups || 0);
      }
      if (sortBy === "conversion") {
        const rateA = a.views && a.views > 0 ? (a.signups || 0) / a.views : (a.conversionRate ? a.conversionRate / 100 : 0);
        const rateB = b.views && b.views > 0 ? (b.signups || 0) / b.views : (b.conversionRate ? b.conversionRate / 100 : 0);
        return rateB - rateA;
      }
      // default: recent
      const diff = getMagnetSortTimestamp(b) - getMagnetSortTimestamp(a);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });

    return list;
  }, [landingPages, search, statusFilter, sortBy]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">("all");
  const effectivePageSize = itemsPerPage === "all" ? (filtered.length || 1) : itemsPerPage;
  const totalPagesCount = itemsPerPage === "all" ? 1 : Math.ceil(filtered.length / effectivePageSize) || 1;

  const paginatedItems = useMemo(() => {
    if (itemsPerPage === "all") return filtered;
    const start = (currentPage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, currentPage, itemsPerPage, effectivePageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage, sortBy]);

  const activePage = useMemo(() => {
    if (!selectedPageId) return null;
    return landingPages.find((p) => p.id === selectedPageId) || null;
  }, [selectedPageId, landingPages]);

  useEffect(() => {
    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localPages.length > 0) {
      setPages(localPages);
    }
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    const fetchLatest = () => {
      syncWithDatabase().then((data) => {
        if (data) {
          if (data.pages) {
            setPages(data.pages);
          }
          if (data.account) setAccount(data.account);
        }
      });
    };

    fetchLatest();

    const handleFocus = () => fetchLatest();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (showCreateModal || showBulkDeleteModal || pageToDeleteId || mobileInspectorOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreateModal, showBulkDeleteModal, pageToDeleteId, mobileInspectorOpen]);

  const handleToggleCheck = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (filtered.length === 0) return;
    const allFilteredIds = filtered.map((p) => p.id);
    const isAllChecked = allFilteredIds.every((id) => checkedIds.includes(id));
    if (isAllChecked) {
      setCheckedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setCheckedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  }, [filtered, checkedIds]);

  const handleSelectPage = useCallback((id: string) => {
    setSelectedPageId((prev) => (prev === id ? null : id));
  }, []);

  const handleOpenMobileDetails = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPageId(id);
    setMobileInspectorOpen(true);
  }, []);

  const removePage = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPageToDeleteId(id);
  }, []);

  const confirmPageDeletion = useCallback(() => {
    if (!pageToDeleteId) return;
    const id = pageToDeleteId;
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    deletePage(id);
    setCheckedIds((prev) => prev.filter((i) => i !== id));
    if (selectedPageId === id) {
      setSelectedPageId(next[0]?.id || null);
    }
    setPageToDeleteId(null);
    router.refresh();
  }, [pageToDeleteId, pages, selectedPageId, router]);

  const confirmBulkDeletion = useCallback(() => {
    if (checkedIds.length === 0) return;
    const remaining = pages.filter((p) => !checkedIds.includes(p.id));
    setPages(remaining);
    savePages(remaining);
    checkedIds.forEach((id) => deletePage(id));

    if (selectedPageId && checkedIds.includes(selectedPageId)) {
      setSelectedPageId(remaining[0]?.id || null);
    }
    setCheckedIds([]);
    setIsSelectMode(false);
    setShowBulkDeleteModal(false);
    router.refresh();
  }, [checkedIds, pages, selectedPageId, router]);

  const handleCopyLink = useCallback((page: MagnetPage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const username = account?.username || "demo";
    const fullUrl = `${window.location.origin}/${username}/${page.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(page.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, [account?.username]);

  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-[#0B0B0D] w-full max-w-full">
        {/* Top Executive Header & Stat Cards */}
        <div className="px-3.5 sm:px-6 pt-4 sm:pt-6 lg:px-8 space-y-4 w-full max-w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">
                Landing Page
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-md shadow-[#0066B2]/20 cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
                <span className="hidden sm:inline">Create Lead Magnet</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics 4 Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Active Pages */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  <Globe className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Active Pages
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {liveCount} <span className="text-xs font-normal text-zinc-400">/ {total}</span>
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  published live
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Total Traffic */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Total Traffic
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {totalViews.toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  all page views
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Leads Collected */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400">
                  <MousePointerClick className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Leads Collected
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {totalSignups.toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  form submissions
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Avg Conv. Rate */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400">
                  <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Avg. Conv. Rate
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {avgConversion}%
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  visitor to lead
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>

        {/* Main Split-Pane Workspace (Dynamic 3-col full width, or 2-col 65% + 35% Sticky Inspector) */}
        <LayoutGroup id="landing-page-workspace">
          <div className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 lg:px-8 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start w-full max-w-full min-w-0">
            <motion.div
              layout
              transition={{ layout: { type: "spring", stiffness: 280, damping: 30, mass: 0.8 } }}
              className={`flex flex-col space-y-4 min-w-0 max-w-full ${
                activePage ? "w-full lg:w-[65%]" : "w-full"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full max-w-full min-w-0">
              <div className="flex items-center gap-2 flex-1 rounded-xl bg-zinc-50 dark:bg-[#1C1C20] px-3.5 py-2 border border-zinc-200/60 dark:border-zinc-800 focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] min-w-0">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter lead magnets by title or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 w-full min-w-0"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-between sm:justify-end w-full sm:w-auto min-w-0">
                <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1C1C20] rounded-xl text-xs font-semibold">
                  {[
                    { id: "all", label: `All (${total})` },
                    { id: "live", label: `Live (${liveCount})` },
                    { id: "draft", label: `Draft (${draftCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={`relative px-3 py-1 rounded-lg transition-colors duration-200 cursor-pointer ${statusFilter === tab.id
                        ? tab.id === "live"
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-zinc-900 dark:text-white font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                    >
                      {statusFilter === tab.id && (
                        <motion.div
                          layoutId="activeStatusFilterTab"
                          className="absolute inset-0 bg-white dark:bg-[#2A2A30] rounded-lg shadow-xs"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Animated Sort Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSortOpen((v) => !v);
                    }}
                    className="flex h-8 items-center gap-1 sm:gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] px-2 sm:px-3 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#222226] transition shadow-2xs cursor-pointer select-none"
                  >
                    <SlidersHorizontal className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[76px] sm:max-w-none">{sortOptions.find((o) => o.id === sortBy)?.label || "Sort"}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isSortOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isSortOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ type: "spring", damping: 28, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full z-40 mt-1.5 w-48 rounded-xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#1C1C20]/95 p-1.5 shadow-xl backdrop-blur-xl dark:text-white"
                      >
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Sort by
                        </div>
                        {sortOptions.map((opt) => {
                          const isSelected = sortBy === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id);
                                setIsSortOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer text-left ${
                                isSelected
                                  ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5 font-medium"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1C1C20] rounded-xl">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`relative p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${viewMode === "grid" ? "text-[#0066B2] dark:text-[#38BDF8]" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    title="Grid View"
                  >
                    {viewMode === "grid" && (
                      <motion.div
                        layoutId="activeViewModeTab"
                        className="absolute inset-0 bg-white dark:bg-[#2A2A30] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    <LayoutGrid className="relative z-10 h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setViewMode("table")}
                    className={`relative p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${viewMode === "table" ? "text-[#0066B2] dark:text-[#38BDF8]" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    title="Table View"
                  >
                    {viewMode === "table" && (
                      <motion.div
                        layoutId="activeViewModeTab"
                        className="absolute inset-0 bg-white dark:bg-[#2A2A30] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    <List className="relative z-10 h-4 w-4" />
                  </button>

                  <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectMode((prev) => {
                        const next = !prev;
                        if (!next) setCheckedIds([]);
                        return next;
                      });
                    }}
                    className={`relative p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                      isSelectMode || checkedIds.length > 0
                        ? "bg-white dark:bg-[#2A2A30] text-[#0066B2] dark:text-[#38BDF8] shadow-xs"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                    title={isSelectMode || checkedIds.length > 0 ? "Exit Select Mode" : "Select Lead Magnets"}
                  >
                    <CheckSquare className="relative z-10 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#141417] p-12 text-center flex flex-col items-center justify-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">No lead magnets found</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                    {search ? "Try adjusting your search query or clear filters." : "Create your first lead magnet to start collecting emails."}
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Create Lead Magnet
                  </button>
                </motion.div>
              ) : viewMode === "grid" ? (
                <motion.div
                  key="grid-view"
                  initial={{ opacity: 0, y: 6, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.995 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col space-y-4"
                >
                  <motion.div
                    layout
                    transition={{ layout: { type: "spring", stiffness: 280, damping: 30, mass: 0.8 } }}
                    className={`grid gap-4 w-full ${
                      activePage
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    }`}
                  >
                    {paginatedItems.map((page, index) => (
                      <MagnetCard
                        key={page.id}
                        page={page}
                        index={index}
                        isSelected={selectedPageId === page.id}
                        isChecked={checkedIds.includes(page.id)}
                        isSelectMode={isSelectMode}
                        anyChecked={checkedIds.length > 0}
                        onSelect={handleSelectPage}
                        onOpenMobileDetails={handleOpenMobileDetails}
                        onToggleCheck={handleToggleCheck}
                        account={account}
                        copiedId={copiedId}
                        onCopyLink={handleCopyLink}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="table-view"
                  initial={{ opacity: 0, y: 6, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.995 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-zinc-200/80 dark:border-[#2e2e38] bg-white dark:bg-[#18181B] overflow-hidden shadow-xs"
                >
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FBFF] dark:bg-[#151518] text-zinc-500 dark:text-[#9B9085] uppercase text-[11px] font-semibold tracking-wider border-b border-zinc-200/80 dark:border-[#2e2e38]">
                      <tr>
                        <th className="px-6 py-3.5 text-left">
                          <div className="flex items-center">
                            <AnimatePresence initial={false}>
                              {(checkedIds.length > 0 || isSelectMode) && (
                                <motion.div
                                  initial={{ opacity: 0, width: 0, marginRight: 0 }}
                                  animate={{ opacity: 1, width: 22, marginRight: 10 }}
                                  exit={{ opacity: 0, width: 0, marginRight: 0 }}
                                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                  className="flex items-center justify-center shrink-0 overflow-hidden"
                                >
                                  <AppleCheckbox
                                    checked={filtered.length > 0 && checkedIds.length === filtered.length}
                                    indeterminate={checkedIds.length > 0 && checkedIds.length < filtered.length}
                                    onChange={handleToggleSelectAll}
                                    title={
                                      checkedIds.length === filtered.length && filtered.length > 0
                                        ? "Deselect all"
                                        : "Select all"
                                    }
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <span>Lead Magnet</span>
                          </div>
                        </th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Views</th>
                        <th className="px-6 py-3.5 text-right">Leads</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white dark:divide-[#222228] dark:bg-[#18181B]">
                      {paginatedItems.map((page) => {
                        const isSelected = activePage?.id === page.id;
                        const isChecked = checkedIds.includes(page.id);
                        return (
                          <tr
                            key={page.id}
                            onClick={() => setSelectedPageId(page.id)}
                            className={`group transition-all duration-200 ${
                              isChecked
                                ? "bg-gradient-to-r from-[#0066B2]/[0.08] via-[#0066B2]/[0.04] to-transparent dark:from-[#38BDF8]/15 dark:via-[#38BDF8]/[0.06] dark:to-transparent"
                                : isSelected
                                  ? "bg-gradient-to-r from-[#0066B2]/[0.06] via-[#0066B2]/[0.02] to-transparent dark:from-[#38BDF8]/10 dark:via-[#38BDF8]/[0.04] dark:to-transparent"
                                  : "hover:bg-zinc-50/80 dark:hover:bg-[#1F1F24]/70"
                            }`}
                          >
                            <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                              <div className="flex items-center min-w-0">
                                <AnimatePresence initial={false}>
                                  {(checkedIds.length > 0 || isChecked || isSelectMode) && (
                                    <motion.div
                                      initial={{ opacity: 0, width: 0, marginRight: 0 }}
                                      animate={{ opacity: 1, width: 22, marginRight: 12 }}
                                      exit={{ opacity: 0, width: 0, marginRight: 0 }}
                                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleCheck(page.id, e);
                                      }}
                                      className="flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                                    >
                                      <AppleCheckbox
                                        checked={isChecked}
                                        onChange={() => handleToggleCheck(page.id)}
                                        title={isChecked ? "Deselect magnet" : "Select magnet"}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="relative h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                                    {page.imageUrl ? (
                                      <Image
                                        src={page.imageUrl}
                                        alt=""
                                        fill
                                        sizes="36px"
                                        unoptimized={page.imageUrl.startsWith("data:") || page.imageUrl.startsWith("blob:")}
                                        className="object-cover"
                                      />
                                    ) : (
                                      <ImageIcon className="h-4 w-4 text-zinc-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-zinc-900 dark:text-white line-clamp-1 truncate">{page.name}</p>
                                    <p className="text-[11px] font-mono text-zinc-400 truncate">/{page.slug}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${page.status === "live"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                  }`}
                              >
                                {page.status === "live" ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                              {page.views || 0}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                              {page.signups || 0}
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={(e) => handleCopyLink(page, e)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                  title="Copy link"
                                >
                                  {copiedId === page.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                                <Link
                                  href={`/dashboard/leadmagnets/${page.id}`}
                                  prefetch={true}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>

            {filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:bg-white sm:dark:bg-[#141417] px-2 sm:px-4 py-2 sm:py-3 rounded-2xl sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800/80 text-xs sm:shadow-xs">
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium text-center sm:text-left">
                  Showing{" "}
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {itemsPerPage === "all" ? filtered.length : Math.min(filtered.length, (currentPage - 1) * (itemsPerPage as number) + 1)}
                  </span>
                  {itemsPerPage !== "all" && (
                    <>
                      {" "}to <span className="font-bold text-zinc-900 dark:text-white">{Math.min(currentPage * (itemsPerPage as number), filtered.length)}</span>
                    </>
                  )}{" "}
                  of <span className="font-bold text-zinc-900 dark:text-white">{filtered.length}</span> lead magnets
                </p>

                {filtered.length > 10 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-xl text-[11px]">
                      <span className="text-[10px] text-zinc-500 px-1.5 font-medium">Show:</span>
                      {([10, 25, 50, "all"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setItemsPerPage(size)}
                          className={`px-2 py-0.5 rounded-lg font-semibold transition ${
                            itemsPerPage === size
                              ? "bg-white dark:bg-[#1C1C20] text-[#0066B2] dark:text-[#38BDF8] shadow-xs"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          {size === "all" ? "All" : size}
                        </button>
                      ))}
                    </div>

                    {itemsPerPage !== "all" && totalPagesCount > 1 && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1C1C20] text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition text-[11px]"
                        >
                          Previous
                        </button>
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 px-1">
                          {currentPage} / {totalPagesCount}
                        </span>
                        <button
                          disabled={currentPage === totalPagesCount}
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesCount))}
                          className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1C1C20] text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold transition text-[11px]"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Right Fixed Sticky Inspector Card (Only rendered when a page is selected) */}
          <AnimatePresence mode="popLayout">
            {activePage && (
              <motion.div
                layout
                initial={{ opacity: 0, x: 28, scale: 0.96, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 28, scale: 0.96, filter: "blur(6px)" }}
                transition={{
                  layout: { type: "spring", stiffness: 280, damping: 30, mass: 0.8 },
                  type: "spring",
                  stiffness: 280,
                  damping: 30,
                  mass: 0.8,
                  opacity: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                  filter: { duration: 0.22 },
                }}
                className="hidden lg:block lg:w-[35%] sticky top-6 z-20 space-y-4 shrink-0"
              >
                <div className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#141417]/95 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">
                        SELECTED INSPECTOR
                      </span>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-0.5 line-clamp-1">
                        {activePage.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          activePage.status === "live"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {activePage.status === "live" ? "Published" : "Draft"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPageId(null)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                        title="Close inspector"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-zinc-50 dark:bg-[#1A1A1E] p-3 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Public Share URL</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate">
                        /{account?.username || "demo"}/{activePage.slug}
                      </span>
                      <button
                        onClick={() => handleCopyLink(activePage)}
                        className="flex items-center gap-1 rounded-lg bg-white dark:bg-[#25252A] px-2.5 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shrink-0"
                      >
                        {copiedId === activePage.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedId === activePage.id ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Magnet Conversion Metrics
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#1A1A1E]/50">
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">Total Views</p>
                        <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{activePage.views || 0}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#1A1A1E]/50">
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase">Leads Captured</p>
                        <p className="text-lg font-bold text-[#0066B2] dark:text-[#38BDF8] mt-1">{activePage.signups || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href={`/dashboard/leadmagnets/${activePage.id}`}
                      prefetch={true}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-sm"
                    >
                      <Pencil className="h-4 w-4" /> Open Full Editor
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/leadmagnets/${activePage.id}/analytics`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C20] px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <BarChart2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Analytics
                      </Link>

                      <a
                        href={`/${account?.username || "demo"}/${activePage.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C20] px-3 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" /> Preview
                      </a>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={(e) => removePage(activePage.id, e)}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Magnet
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => { setShowCreateModal(false); setNewName(""); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="relative w-full sm:max-w-[460px] rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[#0066B2]/30 bg-white p-5 sm:p-6 text-zinc-900 shadow-2xl space-y-4 sm:space-y-5 dark:border-[#0066B2]/35 dark:bg-[#18181c] dark:text-white max-h-[90vh] overflow-y-auto pb-8 sm:pb-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Bottom Sheet Grab Handle */}
              <div className="sm:hidden flex justify-center pb-1 -mt-1">
                <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create Landing Page</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5 sm:mt-1">Name the page and choose its URL.</p>
                </div>
                <button
                  onClick={() => { setShowCreateModal(false); setNewName(""); }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isCreating) return;
                  setIsCreating(true);

                  const cleanSlug = newSlug;
                  const newId = `page-${Date.now()}`;
                  const newMagnetPage: MagnetPage = {
                    id: newId,
                    userEmail: account?.email,
                    name: newName.trim() || "Untitled Page",
                    slug: cleanSlug,
                    status: "draft",
                    headline: newName.trim() || "Untitled Page",
                    subheadline: "",
                    cta: "Get instant access",
                    deliverable: "Instant Access",
                    accent: account?.brandColor || "#0066B2",
                    views: 0,
                    signups: 0,
                    conversionRate: 0,
                    updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                    publishedAt: null,
                    template: (account?.templateId as any) || "template1"
                  };

                  const nextPages = [newMagnetPage, ...pages];
                  setPages(nextPages);
                  savePages(nextPages);
                  router.push(`/dashboard/leadmagnets/${newId}`);
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">Page name</label>
                  <input
                    type="text"
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="AI Pipeline Playbook"
                    className="w-full rounded-xl border border-[#0066B2]/30 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] dark:border-[#0066B2]/60 dark:bg-[#121214] dark:text-white dark:placeholder:text-[#52525b] dark:focus:border-[#0066B2] dark:focus:ring-[#0066B2] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">URL slug</label>
                  <div className="flex items-center rounded-xl border border-[#0066B2]/30 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-600 dark:border-[#0066B2]/35 dark:bg-[#121214] dark:text-[#9B9085]">
                    <span className="text-zinc-400 dark:text-[#666675] shrink-0 mr-1.5">/</span>
                    <span className="font-mono text-zinc-800 dark:text-[#d4c8bc] truncate">{newSlug}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-[#666675]">The path of the page. Lowercase, digits, and hyphens only.</p>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-[#0066B2]/30 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-[#0066B2]/35 dark:bg-[#222228] dark:text-white dark:hover:bg-[#2c2c34] transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={() => {
                      if (isCreating) return;
                      setIsCreating(true);
                      const cleanSlug = newSlug;
                      const newId = `page-${Date.now()}`;
                      const name = newName.trim() || "Untitled Landing Page";
                      const newMagnetPage: MagnetPage = {
                        id: newId,
                        userEmail: account?.email,
                        name,
                        slug: cleanSlug,
                        status: "draft",
                        headline: name,
                        subheadline: "",
                        cta: "Get instant access",
                        deliverable: "Instant Access",
                        accent: account?.brandColor || "#0066B2",
                        views: 0,
                        signups: 0,
                        conversionRate: 0,
                        updatedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        publishedAt: null,
                        template: (account?.templateId as any) || "template1"
                      };

                      const nextPages = [newMagnetPage, ...pages];
                      setPages(nextPages);
                      savePages(nextPages);
                      setShowCreateModal(false);
                      setNewName("");
                      setIsCreating(false);
                      router.push(`/dashboard/leadmagnets/${newId}`);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Create Landing Page</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pageToDeleteId && (
          <motion.div
            key="page-delete-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
          >
            {/* Backdrop with Subtle Soft Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setPageToDeleteId(null)}
            />

            {/* Bottom Sheet Drawer / Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="relative z-10 w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-5 sm:p-6 text-zinc-900 dark:text-white shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80 mx-auto -mt-1 mb-2.5 cursor-grab active:scale-95 transition-transform sm:hidden" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Delete this magnet?</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setPageToDeleteId(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <p>
                  This removes the page and stops it serving. Any signups already collected stay on your list.
                </p>
              </div>

              <div className="pt-3 sm:pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPageToDeleteId(null)}
                  className="flex-1 sm:flex-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPageDeletion}
                  className="flex-1 sm:flex-none rounded-xl border border-rose-500/30 bg-rose-500/15 dark:bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all cursor-pointer shadow-sm text-center"
                >
                  Delete magnet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkDeleteModal && (
          <motion.div
            key="page-bulk-delete-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
          >
            {/* Backdrop with Subtle Soft Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setShowBulkDeleteModal(false)}
            />

            {/* Bottom Sheet Drawer / Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="relative z-10 w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-5 sm:p-6 text-zinc-900 dark:text-white shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80 mx-auto -mt-1 mb-2.5 cursor-grab active:scale-95 transition-transform sm:hidden" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                      Delete {checkedIds.length} lead magnet{checkedIds.length > 1 ? "s" : ""}?
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <p>
                  This will permanently delete the <span className="font-bold text-zinc-900 dark:text-white">{checkedIds.length}</span> selected lead magnet{checkedIds.length > 1 ? "s" : ""} and stop serving them on their URLs. Any signups already collected stay on your list.
                </p>
              </div>

              <div className="pt-3 sm:pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 sm:flex-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBulkDeletion}
                  className="flex-1 sm:flex-none rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-all cursor-pointer shadow-sm text-center"
                >
                  Delete {checkedIds.length} magnet{checkedIds.length > 1 ? "s" : ""}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Slide-Up Inspector Bottom Sheet Drawer */}
      <AnimatePresence>
        {mobileInspectorOpen && activePage && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end overflow-hidden w-full max-w-full">
            {/* Backdrop with Subtle Soft Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileInspectorOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="relative z-10 w-full max-w-full max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-t-[28px] border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-4 sm:space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80 mx-auto -mt-1 mb-2.5 cursor-grab active:scale-95 transition-transform" />

              <div className="flex items-start justify-between pb-1">
                <div className="pr-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">
                    SELECTED INSPECTOR
                  </span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 line-clamp-1">
                    {activePage.name}
                  </h3>
                </div>
                <div className="flex items-center shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      activePage.status === "live"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {activePage.status === "live" ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Public Share URL */}
              <div className="rounded-xl bg-zinc-50 dark:bg-[#1A1A1E] p-3 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Public Share URL</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate">
                    /{account?.username || "demo"}/{activePage.slug}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activePage)}
                    className="flex items-center gap-1 rounded-lg bg-white dark:bg-[#25252A] px-2.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shrink-0 cursor-pointer"
                  >
                    {copiedId === activePage.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedId === activePage.id ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Conversion Metrics */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Magnet Conversion Metrics
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#1A1A1E]/50">
                    <p className="text-[10px] text-zinc-400 font-semibold uppercase">Total Views</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{activePage.views || 0}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-[#1A1A1E]/50">
                    <p className="text-[10px] text-zinc-400 font-semibold uppercase">Leads Captured</p>
                    <p className="text-lg font-bold text-[#0066B2] dark:text-[#38BDF8] mt-1">{activePage.signups || 0}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href={`/dashboard/leadmagnets/${activePage.id}`}
                  prefetch={true}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066B2] px-4 py-3 text-xs font-bold text-white hover:bg-[#005799] transition shadow-sm cursor-pointer"
                >
                  <Pencil className="h-4 w-4" /> Open Full Editor
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/dashboard/leadmagnets/${activePage.id}/analytics`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C20] px-3 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" /> Analytics
                  </Link>

                  <a
                    href={`/${account?.username || "demo"}/${activePage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C20] px-3 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" /> Preview
                  </a>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMobileInspectorOpen(false)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setMobileInspectorOpen(false);
                    removePage(activePage.id, e);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Magnet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Multi-Select Bar */}
      <AnimatePresence>
        {checkedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 40, x: "-50%" }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900/30 dark:bg-black/30 border border-white/20 dark:border-white/15 text-white px-4 sm:px-5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
          >
            <span className="text-xs font-bold whitespace-nowrap">
              <span className="text-[#38BDF8] font-black">{checkedIds.length}</span> selected
            </span>
            <div className="h-4 w-px bg-white/20" />
            <button
              onClick={handleToggleSelectAll}
              className="text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              {filtered.length > 0 && filtered.every((p) => checkedIds.includes(p.id)) ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={() => {
                setCheckedIds([]);
                setIsSelectMode(false);
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition cursor-pointer whitespace-nowrap"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete ({checkedIds.length})</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
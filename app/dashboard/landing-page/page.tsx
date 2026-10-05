"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  LayoutGrid,
  List,
  TrendingUp,
  Globe,
  Share2,
  SlidersHorizontal,
  Lock,
  ChevronRight,
  FileText,
  Zap,
  ArrowUpRight,
  Filter,
  AlertTriangle
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, savePages, loadAccount, syncWithDatabase, deletePage } from "@/lib/store";
import { getMagnetSortTimestamp } from "@/lib/utils";

interface MagnetCardProps {
  page: MagnetPage;
  index: number;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
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
    onSelect,
    onToggleCheck,
    account,
    copiedId,
    onCopyLink,
  }: MagnetCardProps) {
    return (
      <div
        onClick={() => onSelect(page.id)}
        style={{ animationDelay: `${Math.min(index * 15, 100)}ms` }}
        className={`magnet-card-enter group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col ${isChecked
            ? "border-[#0066B2] dark:border-[#38BDF8] bg-white dark:bg-[#18181C] ring-2 ring-[#0066B2]/30 dark:ring-[#38BDF8]/30 shadow-md"
            : isSelected
              ? "border-[#0066B2] dark:border-[#38BDF8] bg-white dark:bg-[#18181C] shadow-md dark:shadow-none"
              : "border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#141417] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs hover:shadow-md"
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
            <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-[#121216] dark:to-[#18181D]">
              <ImageIcon className="h-8 w-8 stroke-[1.5px]" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${page.status === "live"
                  ? "bg-emerald-500/90 text-white border-emerald-400/30"
                  : "bg-zinc-900/80 text-zinc-300 border-zinc-700/50"
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
                ? "bg-[#0066B2] border-[#0066B2] text-white shadow-md scale-105"
                : "bg-white/90 dark:bg-black/70 border-zinc-300 dark:border-zinc-700 text-transparent hover:border-[#0066B2] dark:hover:border-[#38BDF8]"
              }`}
            title={isChecked ? "Deselect magnet" : "Select magnet"}
          >
            <Check className={`h-3.5 w-3.5 stroke-[3px] ${isChecked ? "opacity-100" : "opacity-0"}`} />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition">
              {page.headline || page.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
              {page.subheadline || "No description set yet."}
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[130px]">/{page.slug}</span>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onSelect(page.id)}
                className="lg:hidden inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                title="Open Details Sheet"
              >
                <SlidersHorizontal className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8]" />
                <span>Details</span>
              </button>

              <Link
                href={`/dashboard/leadmagnets/${page.id}`}
                prefetch={true}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0066B2]/10 hover:bg-[#0066B2] text-[#0066B2] hover:text-white dark:bg-[#0066B2]/20 dark:text-[#38BDF8] dark:hover:bg-[#0066B2] dark:hover:text-white px-2.5 py-1 text-[11px] font-semibold transition"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.isChecked === next.isChecked &&
    prev.page === next.page &&
    prev.copiedId === next.copiedId
);

export default function PagesPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">("all");

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [pageToDeleteId, setPageToDeleteId] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
    if (!q && statusFilter === "all") return landingPages;
    return landingPages.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.headline && p.headline.toLowerCase().includes(q))
      );
    });
  }, [landingPages, search, statusFilter]);

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
  }, [search, statusFilter, itemsPerPage]);

  const activePage = useMemo(() => {
    if (!selectedPageId) return filtered[0] || landingPages[0] || null;
    return landingPages.find((p) => p.id === selectedPageId) || filtered[0] || landingPages[0] || null;
  }, [selectedPageId, landingPages, filtered]);

  useEffect(() => {
    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localPages.length > 0) {
      setPages(localPages);
      const initialLanding = localPages.filter((p) => p.template !== "locked-pdf");
      if (initialLanding[0]) {
        setSelectedPageId((prev) => prev || initialLanding[0].id);
      }
    }
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    const fetchLatest = () => {
      syncWithDatabase().then((data) => {
        if (data) {
          if (data.pages) {
            setPages(data.pages);
            const landingList = data.pages.filter((p) => p.template !== "locked-pdf");
            if (landingList.length > 0) {
              setSelectedPageId((prev) => prev || landingList[0].id);
            }
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
    if (!selectedPageId && filtered.length > 0) {
      setSelectedPageId(filtered[0].id);
    }
  }, [filtered, selectedPageId]);

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
    <DashboardShell account={account} title="Landing Page">
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-[#0B0B0D]">
        {/* Top Executive Header */}
        <div className="px-6 pt-6 lg:px-8 border-b border-zinc-200/80 dark:border-zinc-800/60 bg-white/80 dark:bg-[#121215] dark:bg-opacity-85 backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Landing Page
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-md shadow-[#0066B2]/20 cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
                <span>Create Lead Magnet</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#0066B2]/15 dark:border-[#38BDF8]/20 dark:bg-[#0066B2]/15 text-[#0066B2] dark:text-[#38BDF8] shrink-0 shadow-2xs">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">Active Pages</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{liveCount} <span className="text-xs font-normal text-zinc-400">/ {total}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-500/20 dark:border-emerald-500/20 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                <Eye className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">Total Traffic</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{totalViews.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-500/20 dark:border-purple-500/20 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0 shadow-2xs">
                <MousePointerClick className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">Leads Collected</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{totalSignups.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-500/20 dark:border-amber-500/20 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider truncate">Avg. Conv. Rate</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{avgConversion}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Split-Pane Workspace */}
        <div className="flex-1 px-6 py-6 lg:px-8 flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[65%] flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 rounded-xl bg-zinc-50 dark:bg-[#1C1C20] px-3.5 py-2 border border-zinc-200/60 dark:border-zinc-800 focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2]">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter lead magnets by title or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 w-full"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
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
                </div>
              </div>
            </div>

            {checkedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center justify-between rounded-xl border border-[#0066B2]/30 bg-[#0066B2]/10 dark:bg-[#0066B2]/15 px-4 py-2.5 text-xs shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#0066B2] dark:text-[#38BDF8]">
                    {checkedIds.length} lead magnet{checkedIds.length > 1 ? "s" : ""} selected
                  </span>
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer"
                  >
                    {filtered.length > 0 && filtered.every((p) => checkedIds.includes(p.id))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCheckedIds([])}
                    className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#1A1A1E] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Clear Selection
                  </button>

                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Selected ({checkedIds.length})</span>
                  </button>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
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
                  key={`grid-${statusFilter}-${search}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedItems.map((page, index) => (
                      <MagnetCard
                        key={page.id}
                        page={page}
                        index={index}
                        isSelected={selectedPageId === page.id}
                        isChecked={checkedIds.includes(page.id)}
                        onSelect={handleSelectPage}
                        onToggleCheck={handleToggleCheck}
                        account={account}
                        copiedId={copiedId}
                        onCopyLink={handleCopyLink}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`table-${statusFilter}-${search}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141417] overflow-hidden shadow-xs"
                >
                  <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                    <thead className="bg-zinc-50/80 dark:bg-[#1A1A1E] text-zinc-400 dark:text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-zinc-200/80 dark:border-zinc-800">
                      <tr>
                        <th className="px-3 py-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={filtered.length > 0 && filtered.every((p) => checkedIds.includes(p.id))}
                            onChange={handleToggleSelectAll}
                            className="rounded border-zinc-300 dark:border-zinc-700 text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3">Lead Magnet</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Views</th>
                        <th className="px-4 py-3 text-right">Leads</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {paginatedItems.map((page) => {
                        const isSelected = activePage?.id === page.id;
                        const isChecked = checkedIds.includes(page.id);
                        return (
                          <tr
                            key={page.id}
                            onClick={() => setSelectedPageId(page.id)}
                            className={`cursor-pointer transition ${isChecked
                                ? "bg-[#0066B2]/10 dark:bg-[#0066B2]/20"
                                : isSelected
                                  ? "bg-[#EFF6FF]/60 dark:bg-[#0066B2]/10"
                                  : "hover:bg-zinc-50 dark:hover:bg-[#1A1A1E]/50"
                              }`}
                          >
                            <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleToggleCheck(page.id, e as any)}
                                className="rounded border-zinc-300 dark:border-zinc-700 text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                              <div className="flex items-center gap-3">
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
                                <div>
                                  <p className="font-bold text-zinc-900 dark:text-white line-clamp-1">{page.name}</p>
                                  <p className="text-[11px] font-mono text-zinc-400">/{page.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${page.status === "live"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                  }`}
                              >
                                {page.status === "live" ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                              {page.views || 0}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">
                              {page.signups || 0}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={(e) => handleCopyLink(page, e)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  title="Copy link"
                                >
                                  {copiedId === page.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                                <Link
                                  href={`/dashboard/leadmagnets/${page.id}`}
                                  prefetch={true}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
          </div>

          <div className="hidden lg:block lg:w-[35%] sticky top-[195px] z-20 space-y-4 transition-all duration-200">
            {activePage ? (
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141417] p-5 shadow-lg space-y-5">
                <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">
                      SELECTED INSPECTOR
                    </span>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-0.5 line-clamp-1">
                      {activePage.name}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${activePage.status === "live"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}
                  >
                    {activePage.status === "live" ? "Published" : "Draft"}
                  </span>
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

                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
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

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-end">
                  <button
                    onClick={(e) => removePage(activePage.id, e)}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Magnet
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141417] p-8 text-center text-zinc-400">
                Select a lead magnet to open the live inspector panel.
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-200"
          onClick={() => { setShowCreateModal(false); setNewName(""); }}
        >
          <div
            className="relative w-full max-w-[460px] rounded-2xl border border-[#0066B2]/30 bg-white p-6 text-zinc-900 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 dark:border-[#0066B2]/35 dark:bg-[#18181c] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create Landing Page</h3>
                <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Name the page and choose its URL.</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setNewName(""); }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
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
          </div>
        </div>
      )}

      {pageToDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-all duration-200 animate-in fade-in duration-150"
          onClick={() => setPageToDeleteId(null)}
        >
          <div
            className="relative w-full max-w-[440px] rounded-3xl border border-zinc-800 bg-[#18181B] p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Delete this magnet?</h3>
              </div>
              <button
                onClick={() => setPageToDeleteId(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1 text-xs leading-relaxed text-zinc-400">
              <p>
                This removes the page and stops it serving. Any signups already collected stay on your list.
              </p>
              <p className="text-zinc-500 font-medium">
                This action cannot be undone.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPageToDeleteId(null)}
                className="rounded-xl border border-zinc-800 bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPageDeletion}
                className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                Delete magnet
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-all duration-200 animate-in fade-in duration-150"
          onClick={() => setShowBulkDeleteModal(false)}
        >
          <div
            className="relative w-full max-w-[440px] rounded-3xl border border-zinc-800 bg-[#18181B] p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Delete {checkedIds.length} lead magnet{checkedIds.length > 1 ? "s" : ""}?
                </h3>
              </div>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1 text-xs leading-relaxed text-zinc-400">
              <p>
                This will permanently delete the <span className="font-bold text-white">{checkedIds.length}</span> selected lead magnet{checkedIds.length > 1 ? "s" : ""} and stop serving them on their URLs. Any signups already collected will stay on your list.
              </p>
              <p className="text-zinc-500 font-medium">
                This action cannot be undone.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="rounded-xl border border-zinc-800 bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkDeletion}
                className="rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-all cursor-pointer shadow-sm"
              >
                Delete {checkedIds.length} magnet{checkedIds.length > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slide-Up Inspector Bottom Sheet Drawer */}
      <AnimatePresence>
        {mobileInspectorOpen && activePage && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
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
              className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-[28px] border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-5 shadow-2xl space-y-5"
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
                <div className="flex items-center gap-2 shrink-0">
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
                    onClick={() => setMobileInspectorOpen(false)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
    </DashboardShell>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MailOpen,
  Pause,
  Play,
  Plus,
  Rocket,
  StopCircle,
  Trash2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Copy,
  MoreVertical,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  LayoutGrid,
  List,
  Sparkles,
  Send,
  Check,
  BarChart3,
  Eye,
  X,
  Filter,
  Zap,
  Info,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";
import StatusBadge from "@/components/dashboard/status-badge";
import { AppleCheckbox } from "@/components/leads/AppleCheckbox";
import { MobileSequenceCard } from "@/components/sequences/MobileSequenceCard";
import { type Sequence, type SequenceEmail, type Account, type Lead, type MagnetPage } from "@/lib/data";
import { useSidebar } from "@/components/dashboard/dashboard-shell";
import {
  loadSequences,
  loadPages,
  loadLeads,
  loadAccount,
  saveSequences,
  savePages,
  deleteSequence,
  syncWithDatabase,
} from "@/lib/store";

type FilterStatus = "all" | "live" | "draft";
type SortOption = "recent" | "name" | "subscribers" | "delivered" | "open_rate";
type ViewMode = "grid" | "table";

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "recent", label: "Most Recent" },
  { id: "name", label: "Name (A-Z)" },
  { id: "subscribers", label: "Subscribers" },
  { id: "delivered", label: "Most Delivered" },
  { id: "open_rate", label: "Highest Open %" },
];

export default function SequencesPage() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Selection & Bulk Actions State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Dropdown menu tracking
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [mobileActionSeq, setMobileActionSeq] = useState<Sequence | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile New Sequence Drawer state
  const [showNewSequenceModal, setShowNewSequenceModal] = useState(false);
  const [newSeqName, setNewSeqName] = useState("");
  const [newSeqSubject, setNewSeqSubject] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [isCreatingSeq, setIsCreatingSeq] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [magnetSearchQuery, setMagnetSearchQuery] = useState("");
  const [seqToDelete, setSeqToDelete] = useState<Sequence | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleCheck = (seqId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCheckedIds((prev) =>
      prev.includes(seqId) ? prev.filter((id) => id !== seqId) : [...prev, seqId]
    );
  };

  const handleToggleSelectAll = () => {
    if (checkedIds.length === filteredSequences.length && filteredSequences.length > 0) {
      setCheckedIds([]);
    } else {
      setCheckedIds(filteredSequences.map((s) => s.id));
    }
  };

  const handleBulkToggleStatus = async (targetStatus: "live" | "draft") => {
    if (checkedIds.length === 0) return;
    const count = checkedIds.length;

    const updated = sequences.map((s) =>
      checkedIds.includes(s.id) ? { ...s, status: targetStatus } : s
    );
    setSequences(updated);
    saveSequences(updated);

    const currentPages = loadPages();
    const updatedPages = currentPages.map((p) => {
      const isAttached = checkedIds.some((id) => id === `seq_${p.id}` || id === p.id);
      if (isAttached) {
        return { ...p, sequenceEnabled: targetStatus === "live" };
      }
      return p;
    });
    setPages(updatedPages);
    savePages(updatedPages);

    showToast(`${count} sequence${count > 1 ? "s" : ""} ${targetStatus === "live" ? "resumed" : "paused"}`);
    setCheckedIds([]);
    setIsSelectMode(false);
  };

  const confirmBulkDeletion = async () => {
    if (checkedIds.length === 0) return;
    setIsBulkDeleting(true);
    const count = checkedIds.length;

    try {
      let currentSequences = [...sequences];
      let currentPages = loadPages();

      for (const id of checkedIds) {
        currentSequences = currentSequences.filter((s) => s.id !== id);
        currentPages = currentPages.map((p) => {
          if (p.id === id || `seq_${p.id}` === id) {
            return { ...p, sequenceEmails: [], sequenceEnabled: false };
          }
          return p;
        });
      }

      setSequences(currentSequences);
      saveSequences(currentSequences);
      setPages(currentPages);
      savePages(currentPages);

      showToast(`Deleted ${count} sequence${count > 1 ? "s" : ""}`);
      setCheckedIds([]);
      setIsSelectMode(false);
      setShowBulkDeleteModal(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete sequences");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Lock body scroll when mobile modals are open
  useEffect(() => {
    if (showNewSequenceModal || seqToDelete || mobileActionSeq || showBulkDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showNewSequenceModal, seqToDelete, mobileActionSeq, showBulkDeleteModal]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
      setIsSortOpen(false);
      setIsStatusFilterOpen(false);
    };
    if (activeMenuId || isSortOpen || isStatusFilterOpen) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [activeMenuId, isSortOpen, isStatusFilterOpen]);

  useEffect(() => {
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    const localSeq = loadSequences();
    const localPages = loadPages();
    const localLeads = loadLeads();

    setPages(localPages);
    setLeads(localLeads);

    const combineSequences = (seqList: Sequence[], pagesList = localPages, leadsList = localLeads) => {
      const pageSequences: Sequence[] = pagesList
        .filter((p) => (p.sequenceEmails && p.sequenceEmails.length > 0) || p.sequenceEnabled)
        .map((p) => {
          const associatedLeads = leadsList.filter((l) => l.pageId === p.id || l.page === p.name);
          const signupCount = Math.max(associatedLeads.length, p.signups || 0);

          const deliveredCount =
            associatedLeads.filter(
              (l) =>
                l.status === "delivered" ||
                l.status === "opened" ||
                l.status === "completed" ||
                l.status === "replied"
            ).length || (signupCount > 0 ? signupCount : 0);

          const openedCount = associatedLeads.filter(
            (l) => l.opened || l.status === "opened" || l.status === "replied" || (l.openedSteps && l.openedSteps.length > 0)
          ).length;

          const completedCount = associatedLeads.filter(
            (l) =>
              l.status === "completed" ||
              (l.sequenceStep && l.sequenceStep.toLowerCase().includes("completed"))
          ).length;

          const repliedCount = associatedLeads.filter((l) => l.status === "replied").length;
          const stoppedCount = associatedLeads.filter((l) => l.status === "stopped").length;

          const emailsList: SequenceEmail[] =
            p.sequenceEmails && p.sequenceEmails.length > 0
              ? p.sequenceEmails.map((e, idx) => {
                  const min = e.delayMinutes !== undefined
                    ? e.delayMinutes
                    : e.delayUnit === "minutes"
                      ? (e.delayDays ?? 0)
                      : e.delayUnit === "hours"
                        ? (e.delayDays ?? 1) * 60
                        : (e.delayDays ?? (idx === 0 ? 0 : 1)) * 1440;
                  const lbl = min === 0
                    ? "Instantly"
                    : min < 60
                      ? `${min}m delay`
                      : min < 1440
                        ? `${Math.round(min / 60)}h delay`
                        : `${Math.round(min / 1440)}d delay`;
                  return {
                    id: e.id || `se_${p.id}_${idx + 1}`,
                    subject: e.subject || `Follow-up #${idx + 1}`,
                    delayLabel: lbl,
                    delayMinutes: min,
                    status: (p.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
                    sent: deliveredCount,
                    opened: openedCount,
                  };
                })
              : [
                  {
                    id: `se_${p.id}_1`,
                    subject: `${p.name} Follow-up #1`,
                    delayLabel: "1 day delay",
                    delayMinutes: 1440,
                    status: "live" as const,
                    sent: deliveredCount,
                    opened: openedCount,
                  },
                  {
                    id: `se_${p.id}_2`,
                    subject: `${p.name} Follow-up #2`,
                    delayLabel: "3 days delay",
                    delayMinutes: 4320,
                    status: "live" as const,
                    sent: deliveredCount,
                    opened: openedCount,
                  },
                ];

          return {
            id: p.id,
            name: `${p.name} Follow-up`,
            pageId: p.id,
            status: (p.sequenceEnabled === false ? "draft" : "live") as "draft" | "live",
            emails: emailsList,
            stopOnBooking: p.stopOnCall || false,
            stats: {
              signedUp: signupCount,
              delivered: deliveredCount,
              opened: openedCount,
              replied: repliedCount,
              stopped: stoppedCount,
              completed: completedCount,
            },
          };
        });

      const map = new Map<string, Sequence>();
      for (const s of pageSequences) {
        map.set(s.pageId || s.id, s);
      }
      for (const s of seqList) {
        const associatedLeads = leadsList.filter(
          (l) => (s.pageId && l.pageId === s.pageId) || l.sequence === s.name
        );
        if (associatedLeads.length > 0) {
          const liveOpened = associatedLeads.filter(
            (l) => l.opened || l.status === "opened" || l.status === "replied" || (l.openedSteps && l.openedSteps.length > 0)
          ).length;
          const liveDelivered =
            associatedLeads.filter(
              (l) =>
                l.status === "delivered" ||
                l.status === "opened" ||
                l.status === "completed" ||
                l.status === "replied"
            ).length || s.stats.delivered;
          const liveCompleted = associatedLeads.filter(
            (l) =>
              l.status === "completed" ||
              (l.sequenceStep && l.sequenceStep.toLowerCase().includes("completed"))
          ).length;
          s.stats = {
            ...s.stats,
            signedUp: Math.max(s.stats.signedUp || 0, associatedLeads.length),
            delivered: Math.max(s.stats.delivered || 0, liveDelivered),
            opened: liveOpened,
            completed: Math.max(s.stats.completed || 0, liveCompleted),
          };

          if (s.emails && s.emails.length > 0) {
            s.emails = s.emails.map((e, idx) => {
              const stepIdentifier = e.id || `se_${s.id}_${idx + 1}`;
              let stepDelivered = e.sent || 0;
              let stepOpened = e.opened || 0;
              if (associatedLeads.length > 0) {
                const leadsAtStep = associatedLeads.filter((l) => {
                  if (l.openedSteps && (l.openedSteps.includes(stepIdentifier) || l.openedSteps.includes(`step_${idx + 1}`) || (e.id && l.openedSteps.includes(e.id)))) {
                    return true;
                  }
                  if (!l.sequenceStep) return false;
                  const stepMatch = l.sequenceStep.match(/Step\s+(\d+)/i);
                  if (stepMatch) {
                    return parseInt(stepMatch[1], 10) >= idx + 2;
                  }
                  const emailMatch = l.sequenceStep.match(/Email\s+(\d+)/i);
                  if (emailMatch) {
                    return parseInt(emailMatch[1], 10) >= idx + 1;
                  }
                  return false;
                });
                stepDelivered = leadsAtStep.length;
                stepOpened = leadsAtStep.filter((l) => {
                  if (l.openedSteps && (l.openedSteps.includes(stepIdentifier) || l.openedSteps.includes(`step_${idx + 1}`) || (e.id && l.openedSteps.includes(e.id)))) {
                    return true;
                  }
                  return false;
                }).length;
              }
              return { ...e, sent: stepDelivered, opened: stepOpened };
            });
          }
        }
        // Deduplicate: If this sequence belongs to a pageId that was also in pageSequences, replace it with this custom sequence
        if (s.pageId && map.has(s.pageId)) {
          map.delete(s.pageId);
        }
        map.set(s.id, s);
      }
      return Array.from(map.values());
    };

    setSequences(combineSequences(localSeq));

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        const remoteSeq = data.sequences || [];
        const remotePages = data.pages || localPages;
        const remoteLeads = data.leads || localLeads;
        if (data.pages) setPages(data.pages);
        if (data.leads) setLeads(data.leads);
        setSequences(combineSequences(remoteSeq, remotePages, remoteLeads));
      }
    });
  }, []);

  // Quick Action Handlers
  const handleToggleStatus = (seq: Sequence, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus: "draft" | "live" = seq.status === "live" ? "draft" : "live";
    const updated: Sequence[] = sequences.map((s) => (s.id === seq.id ? { ...s, status: newStatus } : s));
    setSequences(updated);
    saveSequences(updated);

    if (seq.pageId) {
      const currentPages = loadPages();
      const updatedPages = currentPages.map((p) =>
        p.id === seq.pageId ? { ...p, sequenceEnabled: newStatus === "live" } : p
      );
      savePages(updatedPages);
      setPages(updatedPages);
    }
    showToast(`"${seq.name}" is now ${newStatus === "live" ? "Active (Live)" : "Paused (Draft)"}`);
    setActiveMenuId(null);
  };

  const handleDuplicate = (seq: Sequence, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newId = `seq_${Date.now().toString(36)}`;
    const newSeq: Sequence = {
      ...seq,
      id: newId,
      name: `${seq.name} (Copy)`,
      status: "draft",
      pageId: undefined,
      stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0, completed: 0 },
      emails: seq.emails.map((email, idx) => ({
        ...email,
        id: `se_${newId}_${idx + 1}`,
        sent: 0,
        opened: 0,
      })),
    };
    const updated = [newSeq, ...sequences];
    setSequences(updated);
    saveSequences(updated);
    showToast(`Duplicated as "${newSeq.name}"`);
    setActiveMenuId(null);
  };

  const handleDelete = (seq: Sequence, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(null);
    setSeqToDelete(seq);
  };

  const confirmDeleteSequence = () => {
    if (!seqToDelete) return;
    deleteSequence(seqToDelete.id);
    setSequences((prev) => prev.filter((item) => item.id !== seqToDelete.id));
    showToast(`Deleted "${seqToDelete.name}"`);
    setSeqToDelete(null);
  };

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
    if (!magnetSearchQuery.trim()) return landingPagesList;
    const q = magnetSearchQuery.toLowerCase();
    return landingPagesList.filter((p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.slug && p.slug.toLowerCase().includes(q))
    );
  }, [landingPagesList, magnetSearchQuery]);

  const filteredLockedPdfPages = useMemo(() => {
    if (!magnetSearchQuery.trim()) return lockedPdfPagesList;
    const q = magnetSearchQuery.toLowerCase();
    return lockedPdfPagesList.filter((p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.pdfTitle && p.pdfTitle.toLowerCase().includes(q)) ||
      (p.slug && p.slug.toLowerCase().includes(q))
    );
  }, [lockedPdfPagesList, magnetSearchQuery]);

  const handleCreateSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeqName.trim() || isCreatingSeq) return;

    setIsCreatingSeq(true);

    const initialEmail: SequenceEmail = {
      id: `e_${Date.now()}`,
      subject: newSeqSubject.trim() || "Your requested resource is inside!",
      delayLabel: "Instantly",
      delayMinutes: 0,
      status: "live",
      sent: 0,
      opened: 0,
    };

    const followUpEmail: SequenceEmail = {
      id: `e_${Date.now() + 1}`,
      subject: "Quick follow-up: Did you get a chance to check out the resource?",
      delayLabel: "1 day later",
      delayMinutes: 1440,
      status: "live",
      sent: 0,
      opened: 0,
    };

    const seqId = `s_${Date.now()}`;
    const newSeq: Sequence = {
      id: seqId,
      name: newSeqName.trim(),
      pageId: selectedPageId || undefined,
      status: "live",
      stopOnBooking: false,
      stats: { signedUp: 0, delivered: 0, opened: 0, replied: 0, stopped: 0, completed: 0 },
      emails: [initialEmail, followUpEmail],
    };

    const next = [newSeq, ...loadSequences()];
    saveSequences(next);
    setSequences(next);

    if (selectedPageId) {
      const currentPages = loadPages();
      const updatedPages = currentPages.map((p) => {
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
      savePages(updatedPages);
      setPages(updatedPages);
    }

    setShowNewSequenceModal(false);
    setNewSeqName("");
    setNewSeqSubject("");
    setSelectedPageId("");
    setIsCreatingSeq(false);
    showToast(`Created sequence "${newSeq.name}"`);

    setTimeout(() => {
      router.push(`/dashboard/sequences/${seqId}`);
    }, 250);
  };

  // Top Aggregated Executive KPI Stats
  const metrics = useMemo(() => {
    let totalSignedUp = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalCompleted = 0;
    let totalReplied = 0;
    let liveCount = 0;
    let pausedCount = 0;

    for (const seq of sequences) {
      if (seq.status === "live") liveCount++;
      else pausedCount++;

      totalSignedUp += seq.stats.signedUp || 0;
      totalDelivered += seq.stats.delivered || 0;
      totalOpened += seq.stats.opened || 0;
      totalCompleted += seq.stats.completed || (seq.stats.delivered > 0 ? seq.stats.delivered : 0);
      totalReplied += seq.stats.replied || 0;
    }

    const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
    const completionRate = totalSignedUp > 0 ? Math.round((totalCompleted / totalSignedUp) * 100) : 0;
    const replyRate = totalDelivered > 0 ? Math.round((totalReplied / totalDelivered) * 100) : 0;

    return {
      totalSequences: sequences.length,
      liveCount,
      pausedCount,
      totalSignedUp,
      totalDelivered,
      totalOpened,
      totalCompleted,
      totalReplied,
      openRate,
      completionRate,
      replyRate,
    };
  }, [sequences]);

  // Filter & Sort Logic
  const filteredSequences = useMemo(() => {
    let list = [...sequences];

    // Status Tab Filter
    if (statusFilter === "live") {
      list = list.filter((s) => s.status === "live");
    } else if (statusFilter === "draft") {
      list = list.filter((s) => s.status === "draft");
    }

    // Search Query Filter
    const q = deferredSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.pageId && s.pageId.toLowerCase().includes(q)) ||
          s.emails.some((e) => e.subject.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "subscribers") {
        return (b.stats.signedUp || 0) - (a.stats.signedUp || 0);
      }
      if (sortBy === "delivered") {
        return (b.stats.delivered || 0) - (a.stats.delivered || 0);
      }
      if (sortBy === "open_rate") {
        const rateA = a.stats.delivered > 0 ? (a.stats.opened || 0) / a.stats.delivered : 0;
        const rateB = b.stats.delivered > 0 ? (b.stats.opened || 0) / b.stats.delivered : 0;
        return rateB - rateA;
      }
      // default: recent
      return 0;
    });

    return list;
  }, [sequences, statusFilter, deferredSearch, sortBy]);

  return (
    <>
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10 dark:bg-zinc-800 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-4 w-4 text-[#38BDF8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10] w-full overflow-x-hidden">
        <div className={`flex-1 px-3 sm:px-6 py-3.5 sm:py-6 lg:px-8 mx-auto w-full space-y-3.5 sm:space-y-5 overflow-x-hidden transition-[max-width] duration-300 ease-out ${isCollapsed ? "max-w-[1440px]" : "max-w-7xl"}`}>
          
          {/* Header Section */}
          <div className="flex items-center justify-between gap-2.5 mb-1 sm:mb-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">
                Follow-up Sequences
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Link */}
              <Link
                href="/dashboard/sequences/new"
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white hover:bg-[#005291] transition shadow-md cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" aria-hidden="true" />
                <span>New sequence</span>
              </Link>
              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setShowNewSequenceModal(true)}
                className="sm:hidden flex items-center gap-1 rounded-lg bg-[#0066B2] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#005291] transition shadow-md cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5px]" aria-hidden="true" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Top Executive KPI Performance Cards (2-cols on mobile, 4-cols on desktop) */}
          {sequences.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {/* Card 1: Active Flows */}
              <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <Rocket className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                    Active Flows
                  </p>
                  <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                    {metrics.liveCount} <span className="text-xs font-normal text-zinc-400">/ {metrics.totalSequences}</span>
                  </p>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Card 2: Total Delivered */}
              <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <Send className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                    Delivered
                  </p>
                  <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                    {metrics.totalDelivered.toLocaleString()}
                  </p>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Card 3: Avg Open Rate */}
              <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                    Avg. Open Rate
                  </p>
                  <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                    {metrics.openRate}%
                  </p>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Card 4: Sequence Completed */}
              <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400">
                    <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                    Completed
                  </p>
                  <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                    {metrics.totalCompleted.toLocaleString()}
                  </p>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          )}

          {/* Search, Filter & View Controls Bar */}
          {sequences.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full max-w-full min-w-0">
              
              {/* Search Bar on Left */}
              <div className="flex items-center gap-2 flex-1 rounded-xl bg-zinc-50 dark:bg-[#1C1C20] px-3.5 py-2 border border-zinc-200/60 dark:border-zinc-800 focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2] min-w-0">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter sequences by name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 w-full min-w-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Right Controls: Status Tabs Pod, Custom Sort Dropdown, View Toggle Pod */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-between sm:justify-end w-full sm:w-auto min-w-0">
                
                {/* Desktop Status Tabs Pod (Preserved untouched) */}
                <div className="hidden sm:flex items-center p-1 bg-zinc-100 dark:bg-[#1C1C20] rounded-xl text-xs font-semibold min-w-0">
                  {[
                    { id: "all", label: `All (${sequences.length})` },
                    { id: "live", label: `Active (${metrics.liveCount})` },
                    { id: "draft", label: `Paused (${metrics.pausedCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as FilterStatus)}
                      className={`relative px-2.5 sm:px-3 py-1 font-semibold rounded-lg transition-colors duration-150 cursor-pointer text-[11px] sm:text-xs ${
                        statusFilter === tab.id
                          ? "text-zinc-900 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {statusFilter === tab.id && (
                        <motion.div
                          layoutId="activeStatusFilterTabSequences"
                          className="absolute inset-0 bg-white dark:bg-[#2A2A30] rounded-lg shadow-xs"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Mobile Filter Dropdown Button */}
                <div className="sm:hidden relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSortOpen(false);
                      setIsStatusFilterOpen((v) => !v);
                    }}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] px-2.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#222226] transition shadow-2xs cursor-pointer select-none"
                  >
                    <Filter className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span className="truncate">
                      {statusFilter === "all"
                        ? `Filter (${sequences.length})`
                        : statusFilter === "live"
                        ? `Active (${metrics.liveCount})`
                        : `Paused (${metrics.pausedCount})`}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isStatusFilterOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isStatusFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ type: "spring", damping: 28, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-full z-40 mt-1.5 w-48 rounded-xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#1C1C20]/95 p-1.5 shadow-xl backdrop-blur-xl dark:text-white"
                      >
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Filter Status
                        </div>
                        {[
                          { id: "all", label: "All Sequences", count: sequences.length },
                          { id: "live", label: "Active", count: metrics.liveCount },
                          { id: "draft", label: "Paused", count: metrics.pausedCount },
                        ].map((item) => {
                          const isSelected = statusFilter === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setStatusFilter(item.id as FilterStatus);
                                setIsStatusFilterOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer text-left ${
                                isSelected
                                  ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5 font-medium"
                              }`}
                            >
                              <span>{item.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-zinc-400">({item.count})</span>
                                {isSelected && <Check className="h-3.5 w-3.5" />}
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

                {/* View Mode & Selection Toggle Pod */}
                <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1C1C20] rounded-xl shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Card Grid View"
                    className={`relative p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                      viewMode === "grid" ? "text-[#0066B2] dark:text-[#38BDF8]" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    {viewMode === "grid" && (
                      <motion.div
                        layoutId="activeViewModeTabSequences"
                        className="absolute inset-0 bg-white dark:bg-[#2A2A30] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    <LayoutGrid className="relative z-10 h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    title="Compact List View"
                    className={`relative p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                      viewMode === "table" ? "text-[#0066B2] dark:text-[#38BDF8]" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    {viewMode === "table" && (
                      <motion.div
                        layoutId="activeViewModeTabSequences"
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
                    title={isSelectMode || checkedIds.length > 0 ? "Exit Select Mode" : "Select Sequences"}
                  >
                    <CheckSquare className="relative z-10 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Sequences List / Cards */}
          {filteredSequences.length > 0 ? (
            <>
              {/* MOBILE STREAM (block md:hidden) - Supports both Card and Compact List views */}
              <div className={`block md:hidden ${viewMode === "grid" ? "space-y-3" : "space-y-2"}`}>
                {filteredSequences.map((seq) => {
                  const attachedPage = seq.pageId ? pages.find((p) => p.id === seq.pageId) : null;
                  return (
                    <MobileSequenceCard
                      key={seq.id}
                      seq={seq}
                      variant={viewMode === "grid" ? "card" : "list"}
                      isChecked={checkedIds.includes(seq.id)}
                      isSelectMode={isSelectMode || checkedIds.length > 0}
                      onToggleCheck={handleToggleCheck}
                      attachedPage={attachedPage}
                      onOpenMobileActions={(s) => setMobileActionSeq(s)}
                      onToggleStatus={handleToggleStatus}
                    />
                  );
                })}
              </div>

              {/* DESKTOP STREAM (hidden md:block) - Preserves Grid & Table Layouts */}
              <div className="hidden md:block">
                {viewMode === "grid" ? (
                  /* GRID VIEW */
                  <div className="grid gap-3.5 lg:grid-cols-2 min-w-0 max-w-full">
                {filteredSequences.map((seq) => {
                  const { signedUp, delivered, opened, replied } = seq.stats;
                  const completed = seq.stats.completed || (delivered > 0 ? delivered : 0);
                  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
                  const linkHref = `/dashboard/sequences/${seq.id}`;
                  const attachedPage = seq.pageId ? pages.find((p) => p.id === seq.pageId) : null;
                  const isStandalone = !seq.pageId || !attachedPage;
                  const attachedName = attachedPage?.name || seq.name.replace(" Follow-up", "").replace(" (Copy)", "");
                  const isMenuOpen = activeMenuId === seq.id;
                  const isChecked = checkedIds.includes(seq.id);
                  const totalStepsCount = isStandalone ? seq.emails.length : seq.emails.length + 1;

                  return (
                    <div
                      key={seq.id}
                      onClick={(e) => {
                        if (isSelectMode || checkedIds.length > 0) {
                          handleToggleCheck(seq.id, e);
                        }
                      }}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-3 sm:p-5 transition-all duration-200 hover:border-[#0066B2] dark:hover:border-[#38BDF8] shadow-2xs hover:shadow-sm min-w-0 w-full max-w-full cursor-pointer ${
                        isMenuOpen ? "z-30" : "z-0"
                      } ${
                        isChecked
                          ? "border-[#0066B2] dark:border-[#38BDF8] bg-blue-50/40 dark:bg-[#0066B2]/15 ring-2 ring-[#0066B2]/30 shadow-md"
                          : "border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#18181B]"
                      }`}
                    >
                      {/* Top Row: Icon, Title, Actions */}
                      <div className="min-w-0 w-full max-w-full">
                        <div className="flex items-start justify-between gap-2 sm:gap-3 min-w-0 max-w-full">
                          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                            {/* Animated Checkbox on desktop grid card */}
                            <AnimatePresence initial={false}>
                              {(isSelectMode || isChecked) && (
                                <motion.div
                                  initial={{ opacity: 0, width: 0, marginRight: 0 }}
                                  animate={{ opacity: 1, width: 24, marginRight: 8 }}
                                  exit={{ opacity: 0, width: 0, marginRight: 0 }}
                                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCheck(seq.id, e);
                                  }}
                                  className="flex h-10 items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                                >
                                  <AppleCheckbox
                                    checked={isChecked}
                                    onChange={() => handleToggleCheck(seq.id)}
                                    title={isChecked ? "Deselect sequence" : "Select sequence"}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <Link href={linkHref} onClick={(e) => { if (isSelectMode || checkedIds.length > 0) { e.preventDefault(); } }} className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] group-hover:scale-105 transition">
                                <Rocket className="h-4 w-4 sm:h-4.5 sm:w-4.5" aria-hidden="true" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap min-w-0">
                                  <p className="truncate text-xs sm:text-base font-bold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition">
                                    {seq.name}
                                  </p>
                                  {isStandalone ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 px-1.5 py-0.5 text-[9px] sm:text-[9.5px] font-bold text-[#0066B2] dark:text-[#38BDF8] shrink-0">
                                      ⚡ Standalone
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[9px] sm:text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                                      🎯 Lead Magnet
                                    </span>
                                  )}
                                </div>
                              <p className="mt-0.5 truncate text-[10.5px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                                {isStandalone ? (
                                  <span>Standalone automation flow</span>
                                ) : (
                                  <>
                                    Attached to{" "}
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-200 hover:text-[#0066B2] dark:hover:text-[#38BDF8]">
                                      "{attachedName}"
                                    </span>
                                  </>
                                )}{" "}
                                · {totalStepsCount} {totalStepsCount === 1 ? "step" : "steps"}
                              </p>
                            </div>
                          </Link>
                        </div>

                          {/* Top Right Controls & Menu */}
                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <StatusBadge status={seq.status} />

                            {/* 3-Dot Dropdown Actions Menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (typeof window !== "undefined" && window.innerWidth < 640) {
                                    setMobileActionSeq(seq);
                                  } else {
                                    setActiveMenuId(isMenuOpen ? null : seq.id);
                                  }
                                }}
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition cursor-pointer"
                                title="Sequence options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Desktop-only dropdown popup */}
                              {isMenuOpen && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="hidden sm:block absolute right-0 top-8 z-50 w-52 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] py-1 shadow-xl animate-in fade-in zoom-in-95"
                                >
                                  <Link
                                    href={`/dashboard/sequences/${seq.id}`}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-zinc-400" />
                                    Open Sequence Editor
                                  </Link>

                                  {seq.pageId && (
                                    <Link
                                      href={`/dashboard/leadmagnets/${seq.pageId}?tab=sequence`}
                                      className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                                      Edit in Lead Magnet Builder
                                    </Link>
                                  )}

                                  <button
                                    onClick={(e) => handleToggleStatus(seq, e)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer text-left"
                                  >
                                    {seq.status === "live" ? (
                                      <>
                                        <Pause className="h-3.5 w-3.5 text-amber-500" />
                                        Pause Sequence
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3.5 w-3.5 text-emerald-500" />
                                        Resume Sequence
                                      </>
                                    )}
                                  </button>

                                  <Link
                                    href={`/dashboard/leads?search=${encodeURIComponent(attachedName)}`}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                                  >
                                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                                    View Sequence Leads
                                  </Link>

                                  <button
                                    onClick={(e) => handleDuplicate(seq, e)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer text-left"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                                    Duplicate Sequence
                                  </button>

                                  <div className="my-1 border-t border-zinc-100 dark:border-white/5" />

                                  <button
                                    onClick={(e) => handleDelete(seq, e)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-left"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Sequence
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Visual Step Timeline Node Preview */}
                        <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-white/[0.02] p-1.5 sm:p-2 scrollbar-none">
                          {seq.pageId ? (
                            <>
                              {/* Attached Sequence: Step 1 Instant Lead Magnet Delivery Node */}
                              <div className="flex items-center gap-1 shrink-0">
                                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 px-2 py-1 text-[10px] sm:text-[10.5px] shadow-2xs">
                                  <Zap className="h-3 w-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                  <span className="truncate font-extrabold text-emerald-950 dark:text-emerald-200">
                                    1. Instant Delivery
                                  </span>
                                </div>
                              </div>

                              {seq.emails && seq.emails.slice(0, 2).map((email, idx) => (
                                <div key={email.id || idx} className="flex items-center gap-1 shrink-0">
                                  <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
                                  <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-white/10 px-2 py-1 text-[10px] sm:text-[10.5px] shadow-2xs max-w-[120px] sm:max-w-[140px]">
                                    <Clock className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                                    <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                                      {idx + 2}. {email.delayLabel || `Follow-up #${idx + 1}`}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {seq.emails && seq.emails.length > 2 && (
                                <span className="rounded-lg bg-zinc-200/70 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                                  +{seq.emails.length - 2} more
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Standalone Sequence: Direct sequence steps */}
                              {seq.emails && seq.emails.length > 0 ? (
                                <>
                                  {seq.emails.slice(0, 3).map((email, idx) => (
                                    <div key={email.id || idx} className="flex items-center gap-1 shrink-0">
                                      {idx > 0 && <ArrowRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />}
                                      <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] sm:text-[10.5px] shadow-2xs max-w-[130px] sm:max-w-[150px] ${
                                        idx === 0
                                          ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60"
                                          : "bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-white/10"
                                      }`}>
                                        {idx === 0 ? (
                                          <Zap className="h-3 w-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                        ) : (
                                          <Clock className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                                        )}
                                        <span className={`truncate font-medium ${idx === 0 ? "font-extrabold text-emerald-950 dark:text-emerald-200" : "text-zinc-700 dark:text-zinc-300"}`}>
                                          {idx + 1}. {email.delayLabel || (idx === 0 ? "Instantly" : `Follow-up #${idx}`)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  {seq.emails.length > 3 && (
                                    <span className="rounded-lg bg-zinc-200/70 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                                      +{seq.emails.length - 3} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] text-zinc-400 font-medium italic">No email steps added yet</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Bottom Performance Metrics Grid (Scales down seamlessly on small mobile) */}
                      <div className="mt-2.5 sm:mt-3 grid grid-cols-5 divide-x divide-zinc-100 dark:divide-white/5 rounded-xl border border-zinc-100 dark:border-white/5 bg-[#F9F9FB] dark:bg-[#141417] text-center min-w-0 w-full max-w-full">
                        <Link
                          href={`/dashboard/leads?search=${encodeURIComponent(attachedName)}`}
                          className="px-0.5 sm:px-1 py-1.5 sm:py-2.5 hover:bg-zinc-100/60 dark:hover:bg-white/5 transition rounded-l-xl"
                          title="View signed up leads"
                        >
                          <p className="text-[11px] sm:text-sm md:text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">
                            {signedUp.toLocaleString()}
                          </p>
                          <p className="text-[8.5px] sm:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">Signups</p>
                        </Link>

                        <div className="px-0.5 sm:px-1 py-1.5 sm:py-2.5">
                          <p className="text-[11px] sm:text-sm md:text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">
                            {delivered.toLocaleString()}
                          </p>
                          <p className="text-[8.5px] sm:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">Delivered</p>
                        </div>

                        <div className="px-0.5 sm:px-1 py-1.5 sm:py-2.5">
                          <p className="text-[11px] sm:text-sm md:text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">
                            {opened.toLocaleString()}
                          </p>
                          <p className="text-[8.5px] sm:text-[10px] font-medium text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                            {openRate > 0 ? `${openRate}%` : "Opened"}
                          </p>
                        </div>

                        <div className="px-0.5 sm:px-1 py-1.5 sm:py-2.5">
                          <p className="text-[11px] sm:text-sm md:text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">
                            {completed.toLocaleString()}
                          </p>
                          <p className="text-[8.5px] sm:text-[10px] font-medium text-emerald-600 dark:text-emerald-400 truncate mt-0.5">Done</p>
                        </div>

                        <div className="px-0.5 sm:px-1 py-1.5 sm:py-2.5">
                          <p className="text-[11px] sm:text-sm md:text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">
                            {replied.toLocaleString()}
                          </p>
                          <p className="text-[8.5px] sm:text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">Replied</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#18181B] shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 pl-5 pr-3">
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
                                    checked={filteredSequences.length > 0 && checkedIds.length === filteredSequences.length}
                                    indeterminate={checkedIds.length > 0 && checkedIds.length < filteredSequences.length}
                                    onChange={handleToggleSelectAll}
                                    title={
                                      checkedIds.length === filteredSequences.length && filteredSequences.length > 0
                                        ? "Deselect all"
                                        : "Select all"
                                    }
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <span>Sequence & Magnet</span>
                          </div>
                        </th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Steps</th>
                        <th className="py-3 px-3 text-right">Signed Up</th>
                        <th className="py-3 px-3 text-right">Delivered</th>
                        <th className="py-3 px-3 text-right">Open Rate</th>
                        <th className="py-3 px-3 text-right">Completed</th>
                        <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-xs">
                      {filteredSequences.map((seq) => {
                        const { signedUp, delivered, opened, replied } = seq.stats;
                        const completed = seq.stats.completed || (delivered > 0 ? delivered : 0);
                        const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
                        const linkHref = `/dashboard/sequences/${seq.id}`;
                        const attachedPage = seq.pageId ? pages.find((p) => p.id === seq.pageId) : null;
                        const isStandalone = !seq.pageId || !attachedPage;
                        const attachedName = attachedPage?.name || seq.name.replace(" Follow-up", "").replace(" (Copy)", "");
                        const totalStepsCount = isStandalone ? seq.emails.length : seq.emails.length + 1;
                        const isChecked = checkedIds.includes(seq.id);

                        return (
                          <tr
                            key={seq.id}
                            onClick={(e) => {
                              if (isSelectMode || checkedIds.length > 0) {
                                handleToggleCheck(seq.id, e);
                              }
                            }}
                            className={`group transition-all duration-200 ${
                              isSelectMode || checkedIds.length > 0 ? "cursor-pointer" : ""
                            } ${
                              isChecked
                                ? "bg-gradient-to-r from-[#0066B2]/[0.08] via-[#0066B2]/[0.04] to-transparent dark:from-[#38BDF8]/15 dark:via-[#38BDF8]/[0.06] dark:to-transparent"
                                : "hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]"
                            }`}
                          >
                            <td className="py-3 pl-5 pr-3">
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
                                        handleToggleCheck(seq.id, e);
                                      }}
                                      className="flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                                    >
                                      <AppleCheckbox
                                        checked={isChecked}
                                        onChange={() => handleToggleCheck(seq.id)}
                                        title={isChecked ? "Deselect sequence" : "Select sequence"}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                <Link
                                  href={linkHref}
                                  onClick={(e) => {
                                    if (isSelectMode || checkedIds.length > 0) {
                                      e.preventDefault();
                                      handleToggleCheck(seq.id);
                                    }
                                  }}
                                  className="flex items-center gap-2.5 min-w-0 flex-1"
                                >
                                  <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                                    <Rocket className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-bold text-zinc-900 dark:text-white group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition truncate">
                                        {seq.name}
                                      </p>
                                      {isStandalone ? (
                                        <span className="rounded bg-blue-50 dark:bg-blue-950/50 text-[#0066B2] dark:text-[#38BDF8] border border-blue-200/60 dark:border-blue-900/40 text-[9px] font-bold px-1 py-0.2">
                                          Standalone
                                        </span>
                                      ) : (
                                        <span className="rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 text-[9px] font-bold px-1 py-0.2">
                                          Lead Magnet
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                      {isStandalone ? "Standalone automation flow" : `Attached to "${attachedName}"`}
                                    </p>
                                  </div>
                                </Link>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <StatusBadge status={seq.status} />
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-medium text-zinc-700 dark:text-zinc-300">
                              {totalStepsCount} steps
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-white">
                              {signedUp.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-white">
                              {delivered.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="inline-flex items-center font-bold text-indigo-600 dark:text-indigo-400">
                                {openRate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {completed.toLocaleString()}
                            </td>
                            <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => handleToggleStatus(seq, e)}
                                  title={seq.status === "live" ? "Pause sequence" : "Resume sequence"}
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition cursor-pointer"
                                >
                                  {seq.status === "live" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                </button>
                                <Link
                                  href={linkHref}
                                  title="Edit sequence"
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  onClick={(e) => handleDelete(seq, e)}
                                  title="Delete sequence"
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Empty State for Search or 0 Sequences */
            sequences.length > 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-[#18181B]/50 p-5 sm:p-8 text-center">
                <Search className="mx-auto h-6 w-6 sm:h-7 sm:w-7 text-zinc-400" />
                <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
                  No matching sequences found
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  No sequences matched your search or status filter. Try clearing the filters to view all.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              /* Global Empty State */
              <>
                <div className="mt-2 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-5 sm:p-10 text-center shadow-2xs">
                  <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#0066B2]/10 dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] mb-3 sm:mb-4 border border-[#0066B2]/20">
                    <MailOpen className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white">
                    No follow-up sequences yet
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Automate your email delivery, send scheduled follow-ups, and convert new subscribers into clients automatically.
                  </p>
                  <div className="mt-4 sm:mt-5 flex justify-center">
                    {/* Desktop Link */}
                    <Link
                      href="/dashboard/sequences/new"
                      className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005799] transition dark:bg-[#0066B2] dark:hover:bg-[#005799]"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5px]" />
                      Create your first sequence
                    </Link>
                    {/* Mobile Drawer Trigger */}
                    <button
                      type="button"
                      onClick={() => setShowNewSequenceModal(true)}
                      className="sm:hidden inline-flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005799] transition dark:bg-[#0066B2] dark:hover:bg-[#005799] cursor-pointer active:scale-95"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5px]" />
                      Create your first sequence
                    </button>
                  </div>
                </div>

                {/* Feature Highlights Grid (Clean cards with pure hover 'i' Info tooltips) */}
                <div className="mt-3 sm:mt-4 grid gap-2.5 sm:gap-3.5 sm:grid-cols-3">
                  {/* Card 1: Instant Trigger */}
                  <div className="relative flex items-center justify-between rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-4 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                        <MailOpen className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">Instant Trigger</h4>
                    </div>

                    <div className="relative group/info shrink-0 ml-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:text-[#0066B2] hover:bg-blue-50 dark:bg-white/10 dark:text-zinc-400 dark:hover:text-[#38BDF8] dark:hover:bg-[#0066B2]/20 transition cursor-help"
                        aria-label="Info about Instant Trigger"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </div>

                      {/* Pure CSS Hover Tooltip */}
                      <div className="pointer-events-none absolute right-0 bottom-full mb-2 z-50 w-60 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-900 text-white dark:bg-[#1C1C20] dark:text-zinc-200 p-2.5 text-[11px] leading-relaxed shadow-xl opacity-0 translate-y-1 group-hover/info:opacity-100 group-hover/info:translate-y-0 transition-all duration-200">
                        The first email sends the moment someone signs up. No manual work.
                        <div className="absolute right-2 top-full border-4 border-transparent border-t-zinc-900 dark:border-t-[#1C1C20]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Custom Delays */}
                  <div className="relative flex items-center justify-between rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-4 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                        <Pause className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">Custom Delays</h4>
                    </div>

                    <div className="relative group/info shrink-0 ml-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:text-[#0066B2] hover:bg-blue-50 dark:bg-white/10 dark:text-zinc-400 dark:hover:text-[#38BDF8] dark:hover:bg-[#0066B2]/20 transition cursor-help"
                        aria-label="Info about Custom Delays"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </div>

                      {/* Pure CSS Hover Tooltip */}
                      <div className="pointer-events-none absolute right-0 bottom-full mb-2 z-50 w-60 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-900 text-white dark:bg-[#1C1C20] dark:text-zinc-200 p-2.5 text-[11px] leading-relaxed shadow-xl opacity-0 translate-y-1 group-hover/info:opacity-100 group-hover/info:translate-y-0 transition-all duration-200">
                        Control the delay for each email. Pause or stop the sequence anytime.
                        <div className="absolute right-2 top-full border-4 border-transparent border-t-zinc-900 dark:border-t-[#1C1C20]" />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Smart Calendar Stop */}
                  <div className="relative flex items-center justify-between rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] p-4 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                        <StopCircle className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">Smart Calendar Stop</h4>
                    </div>

                    <div className="relative group/info shrink-0 ml-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:text-[#0066B2] hover:bg-blue-50 dark:bg-white/10 dark:text-zinc-400 dark:hover:text-[#38BDF8] dark:hover:bg-[#0066B2]/20 transition cursor-help"
                        aria-label="Info about Smart Calendar Stop"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </div>

                      {/* Pure CSS Hover Tooltip */}
                      <div className="pointer-events-none absolute right-0 bottom-full mb-2 z-50 w-60 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-900 text-white dark:bg-[#1C1C20] dark:text-zinc-200 p-2.5 text-[11px] leading-relaxed shadow-xl opacity-0 translate-y-1 group-hover/info:opacity-100 group-hover/info:translate-y-0 transition-all duration-200">
                        Stops automatically when a lead books a call via Calendly or Cal.com.
                        <div className="absolute right-2 top-full border-4 border-transparent border-t-zinc-900 dark:border-t-[#1C1C20]" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet Modal: Create New Sequence */}
      <AnimatePresence>
        {showNewSequenceModal && (
          <motion.div
            key="new-sequence-bottom-sheet-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => {
                setShowNewSequenceModal(false);
                setNewSeqName("");
                setNewSeqSubject("");
                setSelectedPageId("");
                setIsDropdownOpen(false);
              }}
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="relative z-10 w-full max-h-[88vh] overflow-y-auto rounded-t-[28px] border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-5 text-zinc-900 dark:text-white shadow-2xl space-y-4 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab Handle */}
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80 mx-auto -mt-1 mb-1 cursor-grab active:scale-95 transition-transform" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Create Sequence</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Automate your delivery & follow-ups</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSequenceModal(false);
                    setNewSeqName("");
                    setNewSeqSubject("");
                    setSelectedPageId("");
                    setIsDropdownOpen(false);
                  }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSequence} className="space-y-4">
                {/* Sequence Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Sequence Name *
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newSeqName}
                    onChange={(e) => setNewSeqName(e.target.value)}
                    placeholder="e.g. VIP Welcome Sequence"
                    maxLength={80}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500 shadow-xs font-medium"
                  />
                </div>

                {/* Attach to Lead Magnet Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Attach to Lead Magnet</span>
                    <span className="text-[10px] text-[#0066B2] dark:text-[#38BDF8] font-semibold lowercase">automates signups</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl border p-2.5 text-left transition shadow-xs cursor-pointer ${
                      isDropdownOpen
                        ? "border-[#0066B2] ring-2 ring-[#0066B2]/20 bg-white dark:bg-[#202026]"
                        : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-[#2e2e38] dark:bg-[#202026]"
                    }`}
                  >
                    {selectedPage ? (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#2a2a32] text-xs border border-zinc-200/50 dark:border-white/5">
                          {selectedPage.template === "locked-pdf" ? "🔒" : "🎯"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white truncate block">
                            {selectedPage.name || selectedPage.pdfTitle || "Untitled Page"}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate block">
                            /{selectedPage.slug || selectedPage.id}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#2a2a32] text-xs font-bold text-zinc-500">
                          ⚡
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                            Standalone Sequence
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                            No lead magnet attached
                          </span>
                        </div>
                      </div>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180 text-[#0066B2] dark:text-[#38BDF8]" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Options */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-[#2e2e38] dark:bg-[#18181B]/95 flex flex-col max-h-56">
                      {validPages.length > 3 && (
                        <div className="relative px-1 pt-1 pb-2 border-b border-zinc-100 dark:border-[#2e2e38] shrink-0">
                          <Search className="absolute left-3 top-3 h-3 w-3 text-zinc-400" />
                          <input
                            type="text"
                            value={magnetSearchQuery}
                            onChange={(e) => setMagnetSearchQuery(e.target.value)}
                            placeholder="Search magnets..."
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-7 pr-3 py-1 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}

                      <div className="overflow-y-auto overscroll-contain flex-1 p-1 space-y-2 max-h-44" style={{ scrollbarWidth: "thin" }}>
                        {filteredLandingPages.length > 0 && (
                          <div>
                            <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Landing Pages
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
                                      setMagnetSearchQuery("");
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition cursor-pointer ${
                                      isSelected
                                        ? "bg-[#0066B2]/10 dark:bg-[#0066B2]/20 border border-[#0066B2]/30"
                                        : "hover:bg-zinc-100 dark:hover:bg-[#222228] border border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="text-xs">🎯</span>
                                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                        {p.name || "Untitled Page"}
                                      </span>
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {filteredLockedPdfPages.length > 0 && (
                          <div>
                            <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              Locked PDFs
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
                                      setMagnetSearchQuery("");
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition cursor-pointer ${
                                      isSelected
                                        ? "bg-[#0066B2]/10 dark:bg-[#0066B2]/20 border border-[#0066B2]/30"
                                        : "hover:bg-zinc-100 dark:hover:bg-[#222228] border border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="text-xs">🔒</span>
                                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                        {p.name || p.pdfTitle || "Locked PDF"}
                                      </span>
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-1 border-t border-zinc-100 dark:border-[#2e2e38]">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPageId("");
                              setIsDropdownOpen(false);
                              setMagnetSearchQuery("");
                            }}
                            className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition cursor-pointer ${
                              !selectedPageId
                                ? "bg-[#0066B2]/10 dark:bg-[#0066B2]/20 border border-[#0066B2]/30"
                                : "hover:bg-zinc-100 dark:hover:bg-[#222228] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs">⚡</span>
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                Standalone Sequence
                              </span>
                            </div>
                            {!selectedPageId && <Check className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Initial Delivery Email Subject */}
                <div>
                  <label className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1.5">
                    Initial Delivery Subject *
                  </label>
                  <input
                    type="text"
                    value={newSeqSubject}
                    onChange={(e) => setNewSeqSubject(e.target.value)}
                    placeholder="e.g. Here is your free guide download →"
                    maxLength={120}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500 shadow-xs font-medium"
                  />
                </div>

                {/* Sequence Steps Preview */}
                <div className="rounded-xl border border-[#0066B2]/20 bg-[#EFF6FF]/60 dark:border-[#0066B2]/30 dark:bg-[#0066B2]/10 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Automated Email Steps</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 bg-white dark:bg-[#18181B] p-2 rounded-lg border border-zinc-200/80 dark:border-white/5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066B2] text-[9px] font-bold text-white shrink-0">1</span>
                      <span className="flex-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {newSeqSubject || "Resource Delivery Email"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">Instantly</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-[#18181B] p-2 rounded-lg border border-zinc-200/80 dark:border-white/5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-600 text-[9px] font-bold text-white shrink-0">2</span>
                      <span className="flex-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        Follow-up: Did you get a chance to check it out?
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">1d later</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isCreatingSeq}
                    onClick={() => {
                      setShowNewSequenceModal(false);
                      setNewSeqName("");
                      setNewSeqSubject("");
                      setSelectedPageId("");
                      setIsDropdownOpen(false);
                    }}
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSeq || !newSeqName.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005291] active:scale-[0.98] transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <span>{isCreatingSeq ? "Creating..." : "Create Sequence"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Sequence Modal (Bottom Sheet on Mobile, Centered on Desktop) */}
      <AnimatePresence>
        {seqToDelete && (
          <motion.div
            key="seq-delete-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setSeqToDelete(null)}
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
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Delete sequence?</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[220px] sm:max-w-xs">"{seqToDelete.name}"</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSeqToDelete(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <p>
                  Are you sure you want to delete this sequence? This action cannot be undone.
                </p>
              </div>

              <div className="pt-3 sm:pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSeqToDelete(null)}
                  className="flex-1 sm:flex-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSequence}
                  className="flex-1 sm:flex-none rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-all cursor-pointer shadow-sm text-center active:scale-95"
                >
                  Delete sequence
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Action Bottom Sheet for Sequence Options */}
      <AnimatePresence>
        {mobileActionSeq && (
          <motion.div
            key="mobile-action-sheet-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setMobileActionSeq(null)}
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-[28px] border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-5 text-zinc-900 dark:text-white shadow-2xl space-y-3.5 pb-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab Handle */}
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-1 mb-2 cursor-grab active:scale-95 transition-transform" />

              {/* Header Info */}
              <div className="flex items-center gap-3 min-w-0 px-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  <Rocket className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {mobileActionSeq.name}
                    </h3>
                    <StatusBadge status={mobileActionSeq.status} />
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {mobileActionSeq.pageId ? `Attached to "${pages.find(p => p.id === mobileActionSeq.pageId)?.name || mobileActionSeq.name}"` : "Standalone sequence"}
                  </p>
                </div>
              </div>

              {/* Actions List */}
              <div className="space-y-1">
                <Link
                  href={`/dashboard/sequences/${mobileActionSeq.id}`}
                  onClick={() => setMobileActionSeq(null)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition"
                >
                  <Eye className="h-4 w-4 text-zinc-400" />
                  <span>Open Sequence Editor</span>
                </Link>

                {mobileActionSeq.pageId && (
                  <Link
                    href={`/dashboard/leadmagnets/${mobileActionSeq.pageId}?tab=sequence`}
                    onClick={() => setMobileActionSeq(null)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition"
                  >
                    <ExternalLink className="h-4 w-4 text-zinc-400" />
                    <span>Edit in Lead Magnet Builder</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    handleToggleStatus(mobileActionSeq, e);
                    setMobileActionSeq(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition cursor-pointer text-left"
                >
                  {mobileActionSeq.status === "live" ? (
                    <>
                      <Pause className="h-4 w-4 text-amber-500" />
                      <span>Pause Sequence</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-emerald-500" />
                      <span>Resume Sequence</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/dashboard/leads?search=${encodeURIComponent(mobileActionSeq.pageId ? pages.find(p => p.id === mobileActionSeq.pageId)?.name || mobileActionSeq.name : mobileActionSeq.name)}`}
                  onClick={() => setMobileActionSeq(null)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition"
                >
                  <Users className="h-4 w-4 text-zinc-400" />
                  <span>View Sequence Leads</span>
                </Link>

                <button
                  type="button"
                  onClick={(e) => {
                    handleDuplicate(mobileActionSeq, e);
                    setMobileActionSeq(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 active:bg-zinc-100 dark:active:bg-white/10 transition cursor-pointer text-left"
                >
                  <Copy className="h-4 w-4 text-zinc-400" />
                  <span>Duplicate Sequence</span>
                </button>

                <div className="my-1 border-t border-zinc-100 dark:border-white/5" />

                <button
                  type="button"
                  onClick={(e) => {
                    const toDel = mobileActionSeq;
                    setMobileActionSeq(null);
                    handleDelete(toDel, e);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100 dark:active:bg-rose-950/60 transition cursor-pointer text-left"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>Delete Sequence</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setMobileActionSeq(null)}
                  className="w-full rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-100/90 dark:bg-[#1E1E24] py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-[0.99] transition cursor-pointer text-center shadow-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Multi-Select Bar */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {checkedIds.length > 0 && !showBulkDeleteModal && !seqToDelete && !mobileActionSeq && !showNewSequenceModal && (
            <motion.div
              initial={{ opacity: 0, y: 40, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 40, x: "-50%" }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="fixed bottom-6 left-1/2 z-[100] flex items-center gap-2 sm:gap-3 rounded-2xl bg-white/90 dark:bg-[#18181B]/95 border border-zinc-200/90 dark:border-white/10 text-zinc-900 dark:text-white px-3 sm:px-5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 max-w-[calc(100vw-24px)] overflow-x-auto scrollbar-none"
            >
              <span className="text-xs font-bold whitespace-nowrap text-zinc-900 dark:text-white">
                <span className="text-[#0066B2] dark:text-[#38BDF8] font-black">{checkedIds.length}</span> selected
              </span>

              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition cursor-pointer whitespace-nowrap"
              >
                {filteredSequences.length > 0 && filteredSequences.every((s) => checkedIds.includes(s.id))
                  ? "Deselect All"
                  : "Select All"}
              </button>

              <button
                type="button"
                onClick={() => handleBulkToggleStatus("live")}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition cursor-pointer whitespace-nowrap"
                title="Resume selected sequences"
              >
                <Play className="h-3 w-3" />
                <span>Resume</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkToggleStatus("draft")}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition cursor-pointer whitespace-nowrap"
                title="Pause selected sequences"
              >
                <Pause className="h-3 w-3" />
                <span>Pause</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckedIds([]);
                  setIsSelectMode(false);
                }}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({checkedIds.length})</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <motion.div
            key="bulk-delete-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className="relative z-10 w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto rounded-t-[28px] sm:rounded-3xl border-t sm:border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl p-5 sm:p-6 text-zinc-900 dark:text-white shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700/80 mx-auto -mt-1 mb-2.5 cursor-grab active:scale-95 transition-transform sm:hidden" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                      Delete {checkedIds.length} sequence{checkedIds.length > 1 ? "s" : ""}?
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <p>
                  This will permanently delete the <span className="font-bold text-zinc-900 dark:text-white">{checkedIds.length}</span> selected sequence{checkedIds.length > 1 ? "s" : ""} and their email steps.
                </p>
                <p className="text-zinc-500 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              <div className="pt-3 sm:pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 sm:flex-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#25252A] px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={confirmBulkDeletion}
                  className="flex-1 sm:flex-none rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-all cursor-pointer shadow-sm text-center disabled:opacity-50 active:scale-95"
                >
                  {isBulkDeleting ? "Deleting..." : `Delete ${checkedIds.length} sequence${checkedIds.length > 1 ? "s" : ""}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
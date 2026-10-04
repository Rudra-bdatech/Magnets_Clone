"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
  Users,
  Download,
  Search,
  Upload,
  ChevronDown,
  Filter,
  Trash2,
  Check,
  X,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Lock,
  TrendingUp,
  FileText,
  Layers,
  Linkedin,
  Zap,
} from "lucide-react";
import {
  syncWithDatabase,
  loadLeads,
  loadAccount,
  loadPages,
  loadSequences,
  saveLeads,
  deleteLead,
} from "@/lib/store";
import type { Account, Lead, MagnetPage, Sequence } from "@/lib/data";

import dynamic from "next/dynamic";
import { LeadTableRow } from "@/components/leads/LeadTableRow";
import { MobileLeadCard } from "@/components/leads/MobileLeadCard";
import { LeadToastContainer, type Toast } from "@/components/leads/LeadToastContainer";

const AddLeadModal = dynamic(() => import("@/components/leads/AddLeadModal").then((mod) => mod.AddLeadModal), { ssr: false });
const ImportCsvModal = dynamic(() => import("@/components/leads/ImportCsvModal").then((mod) => mod.ImportCsvModal), { ssr: false });
const DeleteLeadModal = dynamic(() => import("@/components/leads/DeleteLeadModal").then((mod) => mod.DeleteLeadModal), { ssr: false });
const BulkDeleteModal = dynamic(() => import("@/components/leads/BulkDeleteModal").then((mod) => mod.BulkDeleteModal), { ssr: false });
const LeadDetailsModal = dynamic(() => import("@/components/leads/LeadDetailsModal").then((mod) => mod.LeadDetailsModal), { ssr: false });

import { formatDateOnly, parseFlexibleDate } from "@/lib/utils";

function generateSafeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).substring(2, 9);
}

// Sanitize CSV cells against Formula Injection (CWE-1236)
function sanitizeCsvCell(val: string): string {
  if (!val) return '""';
  let cleaned = val.replace(/"/g, '""');
  if (/^[=+\-@]/.test(cleaned)) {
    cleaned = `'${cleaned}`;
  }
  return `"${cleaned}"`;
}

export default function LeadsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [magnetPages, setMagnetPages] = useState<MagnetPage[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering & Search (React 18 Concurrent Search)
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filterMagnet, setFilterMagnet] = useState("All lead magnets");
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadMagnet, setNewLeadMagnet] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importedLeadsPreview, setImportedLeadsPreview] = useState<Partial<Lead>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");

  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection & Bulk Delete State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isMobileSelectionMode, setIsMobileSelectionMode] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Load local data instantly
    const localLeads = loadLeads();
    const localAccount = loadAccount();
    const localPages = loadPages();
    const localSequences = loadSequences();

    if (localLeads.length > 0) setLeads(localLeads);
    if (localAccount) setAccount(localAccount);
    if (localPages.length > 0) setMagnetPages(localPages);
    if (localSequences.length > 0) setSequences(localSequences);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setLeads(data.leads || []);
        if (data.pages) setMagnetPages(data.pages);
        if (data.sequences) setSequences(data.sequences);
      }
    });
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (mobileFilterRef.current && !mobileFilterRef.current.contains(e.target as Node)) {
        setMobileFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Lock body scroll when any modal is open
  const isAnyModalOpen = Boolean(selectedLead || showAddModal || showImportModal || leadToDelete || showBulkDeleteModal);
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyModalOpen]);

  const addToast = useCallback((type: "success" | "error" | "info", message: string) => {
    const id = generateSafeId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check if lead is from LinkedIn Automation / Comments
  const checkIsLinkedInLead = useCallback((l: Lead): boolean => {
    return (
      l.source === "linkedin-comment" ||
      l.source === "linkedin" ||
      Boolean(l.tags?.includes("linkedin")) ||
      Boolean(l.tags?.includes("dm-sent")) ||
      Boolean(l.tags?.includes("auto-reply")) ||
      Boolean(l.email && l.email.endsWith("@linkedin-prospect.com")) ||
      l.referrer === "linkedin.com" ||
      Boolean(l.customFields?.linkedinProfile)
    );
  }, []);

  // Check if lead or magnet page is a Locked PDF
  const checkIsLockedPdfLead = useCallback(
    (l: Lead): boolean => {
      const page = magnetPages.find((p) => p.id === l.pageId || p.name === l.page);
      return (
        l.source === "locked-pdf-otp" ||
        Boolean(l.tags?.includes("locked-pdf")) ||
        page?.template === "locked-pdf" ||
        Boolean(l.page && l.page.toLowerCase().includes("locked"))
      );
    },
    [magnetPages]
  );

  // Counts for each of the 4 Quick Filters
  const filterCounts = useMemo(() => {
    let linkedInTotal = 0;
    let lockedPdfTotal = 0;
    let formTotal = 0;

    leads.forEach((l) => {
      if (checkIsLinkedInLead(l)) {
        linkedInTotal++;
      } else if (checkIsLockedPdfLead(l)) {
        lockedPdfTotal++;
      } else {
        formTotal++;
      }
    });

    return {
      all: leads.length,
      linkedIn: linkedInTotal,
      lockedPdf: lockedPdfTotal,
      forms: formTotal,
    };
  }, [leads, checkIsLockedPdfLead, checkIsLinkedInLead]);

  // Filtered leads using React 18 Deferred Search Value
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const matched = leads.filter((l) => {
      let matchMagnet = false;
      const isLocked = checkIsLockedPdfLead(l);
      const isLinkedIn = checkIsLinkedInLead(l);

      if (filterMagnet === "All lead magnets") {
        matchMagnet = true;
      } else if (filterMagnet === "All LinkedIn Leads") {
        matchMagnet = isLinkedIn;
      } else if (filterMagnet === "All Locked PDFs") {
        matchMagnet = isLocked;
      } else if (filterMagnet === "All Form Magnets") {
        matchMagnet = !isLocked && !isLinkedIn;
      } else {
        matchMagnet = l.page === filterMagnet;
      }

      const matchSearch =
        !q ||
        l.email.toLowerCase().includes(q) ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.page && l.page.toLowerCase().includes(q)) ||
        (l.customFields?.linkedinProfile && String(l.customFields.linkedinProfile).toLowerCase().includes(q));

      return matchMagnet && matchSearch;
    });

    return matched.sort((a, b) => {
      const timeA = parseFlexibleDate(a.signedUpAt)?.getTime() || 0;
      const timeB = parseFlexibleDate(b.signedUpAt)?.getTime() || 0;
      return timeB - timeA;
    });
  }, [leads, filterMagnet, deferredSearch, checkIsLockedPdfLead, checkIsLinkedInLead]);

  // 5. Pagination Logic
  const totalPages = useMemo(() => Math.ceil(filtered.length / pageSize) || 1, [filtered.length, pageSize]);
  const paginatedLeads = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  // 1. Delete Lead (Modal Powered)
  const confirmDeleteLead = useCallback(async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);

    try {
      const updated = leads.filter((l) => l.id !== leadToDelete.id);
      setLeads(updated);
      deleteLead(leadToDelete.id);
      setSelectedLeadIds((prev) => prev.filter((id) => id !== leadToDelete.id));

      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null);
      }

      addToast("info", `Removed ${leadToDelete.email} from leads.`);
    } catch (err) {
      console.error("Error deleting lead:", err);
      addToast("error", "Failed to delete lead.");
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
    }
  }, [leadToDelete, leads, selectedLead, addToast]);

  // Bulk Selection Helpers & Handler
  const toggleSelectAll = useCallback(() => {
    if (selectedLeadIds.length === paginatedLeads.length && paginatedLeads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map((l) => l.id));
    }
  }, [selectedLeadIds.length, paginatedLeads]);

  const toggleSelectLead = useCallback((id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedLeadIds.length === 0) return;
    setIsBulkDeleting(true);

    try {
      const idsToDelete = new Set(selectedLeadIds);
      const updated = leads.filter((l) => !idsToDelete.has(l.id));
      setLeads(updated);

      selectedLeadIds.forEach((id) => deleteLead(id));

      addToast("info", `Successfully deleted ${selectedLeadIds.length} selected leads.`);
      setSelectedLeadIds([]);
      setIsMobileSelectionMode(false);
      setShowBulkDeleteModal(false);
    } catch (err) {
      console.error("Error bulk deleting leads:", err);
      addToast("error", "Failed to delete selected leads.");
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedLeadIds, leads, addToast]);

  // 2. Add Lead Manually (Modal Powered)
  const handleAddManuallySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLeadEmail.trim()) {
        addToast("error", "Email address is required.");
        return;
      }

      setIsAdding(true);

      try {
        const magnetTitle = newLeadMagnet || (magnetPages.length > 0 ? magnetPages[0].name : "Direct Lead");
        const pageId = magnetPages.find((p) => p.name === magnetTitle)?.id || "";

        const newLead: Lead = {
          id: generateSafeId(),
          email: newLeadEmail.trim().toLowerCase(),
          name: newLeadName.trim() || newLeadEmail.split("@")[0],
          page: magnetTitle,
          pageId: pageId,
          signedUpAt: new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          sequence: `${magnetTitle} Sequence`,
          status: "new",
          source: "leadmagnets",
          tags: [],
        };

        const updated = [newLead, ...leads];
        setLeads(updated);
        saveLeads(updated);

        // Trigger backend addLead endpoint to send lead alerts & sync MongoDB
        const currentUserEmail = localStorage.getItem("currentUserEmail") || account?.email || "";
        fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addLead",
            data: newLead,
            email: currentUserEmail,
          }),
        }).catch(console.error);

        addToast("success", `Added ${newLead.email} to leads.`);
        setNewLeadName("");
        setNewLeadEmail("");
        setNewLeadMagnet("");
        setShowAddModal(false);
      } catch (err) {
        console.error("Failed to add lead", err);
        addToast("error", "Failed to add lead.");
      } finally {
        setIsAdding(false);
      }
    },
    [newLeadEmail, newLeadMagnet, magnetPages, newLeadName, leads, account?.email, addToast]
  );

  // 3. Import CSV File & Parse Contacts
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        addToast("error", "CSV file is empty.");
        return;
      }

      const parsed: Partial<Lead>[] = [];
      const defaultMagnet = magnetPages.length > 0 ? magnetPages[0].name : "Imported Magnet";

      const startIndex = lines[0].toLowerCase().includes("email") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length > 0 && cols[0].includes("@")) {
          parsed.push({
            id: generateSafeId(),
            email: cols[0].toLowerCase(),
            name: cols[1] || cols[0].split("@")[0],
            page: cols[2] || defaultMagnet,
            signedUpAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            sequence: "Imported Contact",
          });
        } else if (cols.length > 1 && cols[1].includes("@")) {
          parsed.push({
            id: generateSafeId(),
            email: cols[1].toLowerCase(),
            name: cols[0] || cols[1].split("@")[0],
            page: cols[2] || defaultMagnet,
            signedUpAt: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            sequence: "Imported Contact",
          });
        }
      }

      if (parsed.length === 0) {
        addToast("error", "Could not find valid email addresses in CSV.");
        return;
      }

      setImportedLeadsPreview(parsed);
      setShowImportModal(true);
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmCSVImport = useCallback(async () => {
    if (importedLeadsPreview.length === 0) return;
    setIsImporting(true);

    try {
      const fullLeads = importedLeadsPreview as Lead[];
      const updated = [...fullLeads, ...leads];
      setLeads(updated);
      saveLeads(updated);

      addToast("success", `Successfully imported ${fullLeads.length} leads!`);
      setShowImportModal(false);
      setImportedLeadsPreview([]);
      setCsvFileName("");
    } catch (err) {
      console.error("Failed to import CSV", err);
      addToast("error", "Error importing CSV file.");
    } finally {
      setIsImporting(false);
    }
  }, [importedLeadsPreview, leads, addToast]);

  const copyEmailToClipboard = useCallback(
    (emailStr: string) => {
      navigator.clipboard.writeText(emailStr);
      addToast("success", `Copied ${emailStr} to clipboard!`);
    },
    [addToast]
  );

  // 4. Export CSV (Filter & Selection Aware with Formula Sanitization)
  const handleExportCSV = useCallback(() => {
    const exportTarget =
      selectedLeadIds.length > 0
        ? filtered.filter((l) => selectedLeadIds.includes(l.id))
        : filtered;

    if (exportTarget.length === 0) {
      addToast("info", "No matching leads available to export.");
      return;
    }

    const header = ["Email", "Name", "Lead Magnet", "Signup Date", "Leads Count", "Sequence Status"];
    const rows = exportTarget.map((l) => {
      const page = magnetPages.find((p) => p.id === l.pageId || p.name === l.page);
      const foundSeq = sequences.find(
        (s) => s.id === page?.id || s.pageId === page?.id || (page && s.name.includes(page.name))
      );
      const isEnabled = page ? page.sequenceEnabled || (page.sequenceEmails && page.sequenceEmails.length > 0) : false;
      const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
      const totalSteps = foundSeq?.emails?.length || page?.sequenceEmails?.length || 1;

      let computedStatus = `Step 1 of ${totalSteps} (In Progress)`;
      if (!isSeqLive) {
        computedStatus = "Sequence Ended";
      } else if (l.status === "stopped") {
        computedStatus = "Stopped";
      } else if (l.status === "completed" || l.status === "delivered") {
        computedStatus = `Completed (${totalSteps}/${totalSteps} steps)`;
      }

      const cleanPageName = (l.page || "").replace(/"/g, '""');
      const excelSafePage = /^\d{1,2}\/\d{1,2}/.test(cleanPageName) ? `="${cleanPageName}"` : sanitizeCsvCell(cleanPageName);

      return [
        sanitizeCsvCell(l.email || ""),
        sanitizeCsvCell(l.name || ""),
        excelSafePage,
        sanitizeCsvCell(l.signedUpAt || ""),
        "1",
        sanitizeCsvCell(computedStatus),
      ];
    });

    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filterSuffix = filterMagnet !== "All lead magnets" ? `_${filterMagnet.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
    a.download = `leads${filterSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", `Exported ${exportTarget.length} lead${exportTarget.length === 1 ? "" : "s"} successfully.`);
  }, [selectedLeadIds, filtered, magnetPages, sequences, filterMagnet, addToast]);

  // Metrics
  const totalLeads = leads.length;

  const uniqueSignups = useMemo(
    () => new Set(leads.map((l) => (l.email ? l.email.toLowerCase().trim() : ""))).size,
    [leads]
  );

  const recentMonthCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return leads.filter((l) => {
      if (!l.signedUpAt) return true;
      const d = parseFlexibleDate(l.signedUpAt);
      if (!d) return true;
      return d >= thirtyDaysAgo;
    }).length;
  }, [leads]);

  const activeInSequenceCount = useMemo(() => {
    return leads.filter((lead) => {
      const page = magnetPages.find((p) => p.id === lead.pageId || p.name === lead.page);
      const foundSeq = sequences.find(
        (s) => s.id === page?.id || s.pageId === page?.id || (page && s.name.includes(page.name))
      );
      const isEnabled = page ? page.sequenceEnabled || (page.sequenceEmails && page.sequenceEmails.length > 0) : false;
      const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
      if (!isSeqLive) return false;
      if (lead.status === "stopped" || lead.status === "completed" || lead.status === "delivered") {
        return false;
      }
      return true;
    }).length;
  }, [leads, magnetPages, sequences]);



  // Helper to render sequence column per lead
  const renderSequenceStatus = useCallback(
    (lead: Lead) => {
      const page = magnetPages.find((p) => p.id === lead.pageId || p.name === lead.page);
      const foundSeq = sequences.find(
        (s) => s.id === page?.id || s.pageId === page?.id || (page && s.name.includes(page.name))
      );
      const isEnabled = page ? page.sequenceEnabled || (page.sequenceEmails && page.sequenceEmails.length > 0) : false;
      const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
      const totalSteps = foundSeq?.emails?.length || page?.sequenceEmails?.length || 2;

      if (!isSeqLive) {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            Sequence Ended
          </span>
        );
      }

      if (lead.status === "stopped") {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
            🛑 Stopped
          </span>
        );
      }

      if (lead.status === "completed" || lead.status === "delivered") {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-purple-600 dark:text-purple-400 text-xs font-bold">
            <Check className="h-3 w-3" /> Completed ({totalSteps}/{totalSteps} steps)
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Step 1 of {totalSteps} (In Progress)
        </span>
      );
    },
    [magnetPages, sequences]
  );

  const handleResendEmail = useCallback(
    async (lead: Lead) => {
      try {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "resendLeadEmail",
            data: {
              leadId: lead.id,
              email: lead.email,
              name: lead.name,
              pageTitle: lead.page,
              ownerEmail: account?.email,
            },
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          addToast("success", `📧 Resource delivery email resent to ${lead.email}!`);
        } else {
          addToast("error", data.error || "Failed to resend email.");
        }
      } catch (err: any) {
        addToast("error", err.message || "Failed to resend email.");
      }
    },
    [account?.email, addToast]
  );

  return (
    <DashboardShell account={account} title="Leads">
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/50 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="flex-1 px-3.5 sm:px-6 py-4 sm:py-6 lg:px-8 max-w-7xl mx-auto w-full">

          {/* ========================================================================= */}
          {/* 1. DESKTOP Page Heading (hidden md:flex) - Preserved 100% Unchanged       */}
          {/* ========================================================================= */}
          <div className="hidden md:flex flex-col justify-between gap-4 md:flex-row md:items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Leads
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-3 w-3" /> Live Email Alerts Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005291] transition shadow-md cursor-pointer"
              >
                <UserPlus className="h-4 w-4" /> + Add Subscriber
              </button>

              <label className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-zinc-300 dark:hover:bg-[#25252A] transition cursor-pointer shadow-xs">
                <Download className="h-4 w-4 text-[#0066B2]" /> Import CSV
                <input type="file" accept=".csv" onChange={handleCSVFileSelect} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-zinc-300 dark:hover:bg-[#25252A] transition cursor-pointer shadow-xs"
              >
                <Upload className="h-4 w-4 text-[#0066B2]" /> Export CSV
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. MOBILE Page Heading (flex md:hidden) - Senior Designer Crafted         */}
          {/* ========================================================================= */}
          <div className="flex md:hidden flex-col gap-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Leads
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#005291] active:scale-95 transition shadow-sm cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add</span>
              </button>
            </div>

            {/* Mobile Actions Quick Bar */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white py-2 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-zinc-300 active:scale-98 transition cursor-pointer shadow-2xs">
                <Download className="h-3.5 w-3.5 text-[#0066B2] shrink-0" />
                <span className="truncate">Import CSV</span>
                <input type="file" accept=".csv" onChange={handleCSVFileSelect} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white py-2 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-zinc-300 active:scale-98 transition cursor-pointer shadow-2xs"
              >
                <Upload className="h-3.5 w-3.5 text-[#0066B2] shrink-0" />
                <span className="truncate">Export CSV</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DESKTOP Stat Cards (hidden md:grid) - Preserved 100% Unchanged         */}
          {/* ========================================================================= */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
            {/* Total Subscribers */}
            <div className="flex items-center rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-[#2e2e38] dark:bg-[#18181B]/80 px-5 py-4 sm:py-5 shadow-sm backdrop-blur-sm transition-all hover:border-zinc-300 dark:hover:border-[#3e3e4a]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-400 mr-3.5">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">Total Subscribers</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">{totalLeads}</p>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hidden xl:inline">all captures</span>
                </div>
              </div>
            </div>

            {/* Unique Subscribers */}
            <div className="flex items-center rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-[#2e2e38] dark:bg-[#18181B]/80 px-5 py-4 sm:py-5 shadow-sm backdrop-blur-sm transition-all hover:border-zinc-300 dark:hover:border-[#3e3e4a]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mr-3.5">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">Unique Subscribers</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">{uniqueSignups}</p>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hidden xl:inline">distinct emails</span>
                </div>
              </div>
            </div>

            {/* Monthly Growth */}
            <div className="flex items-center rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-[#2e2e38] dark:bg-[#18181B]/80 px-5 py-4 sm:py-5 shadow-sm backdrop-blur-sm transition-all hover:border-zinc-300 dark:hover:border-[#3e3e4a]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 mr-3.5">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">New This Month</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">+{recentMonthCount}</p>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hidden xl:inline">past 30 days</span>
                </div>
              </div>
            </div>

            {/* Active in Sequence */}
            <div className="flex items-center rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-[#2e2e38] dark:bg-[#18181B]/80 px-5 py-4 sm:py-5 shadow-sm backdrop-blur-sm transition-all hover:border-zinc-300 dark:hover:border-[#3e3e4a]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400 mr-3.5">
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">Active In Sequence</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-none">{activeInSequenceCount}</p>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hidden xl:inline">in automation</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. MOBILE Stat Cards (grid md:hidden) - Ergonomic, High-Density Scannable  */}
          {/* ========================================================================= */}
          <div className="grid md:hidden grid-cols-2 gap-2 mb-4">
            {/* Total Subscribers */}
            <div className="flex items-center rounded-xl border border-zinc-200/80 bg-white/90 dark:border-[#282832] dark:bg-[#18181C]/90 p-2.5 shadow-2xs backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-400 mr-2.5">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">Total</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{totalLeads}</p>
              </div>
            </div>

            {/* Unique Subscribers */}
            <div className="flex items-center rounded-xl border border-zinc-200/80 bg-white/90 dark:border-[#282832] dark:bg-[#18181C]/90 p-2.5 shadow-2xs backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mr-2.5">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">Unique</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{uniqueSignups}</p>
              </div>
            </div>

            {/* Monthly Growth */}
            <div className="flex items-center rounded-xl border border-zinc-200/80 bg-white/90 dark:border-[#282832] dark:bg-[#18181C]/90 p-2.5 shadow-2xs backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400 mr-2.5">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">30d Growth</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">+{recentMonthCount}</p>
              </div>
            </div>

            {/* Active in Sequence */}
            <div className="flex items-center rounded-xl border border-zinc-200/80 bg-white/90 dark:border-[#282832] dark:bg-[#18181C]/90 p-2.5 shadow-2xs backdrop-blur-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-50 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400 mr-2.5">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] truncate">In Sequence</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white leading-tight mt-0.5">{activeInSequenceCount}</p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm relative">

            {/* ========================================================================= */}
            {/* 3. DESKTOP Toolbar (hidden md:block) - Preserved 100% Unchanged           */}
            {/* ========================================================================= */}
            <div className="hidden md:block p-3.5 sm:p-5 border-b border-zinc-200/80 dark:border-[#2e2e38]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">All Subscribers</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Bulk Delete Selected Button */}
                  {selectedLeadIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Selected ({selectedLeadIds.length})</span>
                    </button>
                  )}

                  {/* Filter by Magnet — Glassy & Smooth Animated Dropdown */}
                  <div className="relative" ref={filterRef}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterOpen((v) => !v);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs backdrop-blur-md transition-all hover:bg-white/90 focus:outline-none dark:border-white/10 dark:bg-[#18181B]/80 dark:text-zinc-200 dark:hover:bg-[#222226] cursor-pointer select-none"
                    >
                      {filterMagnet === "All LinkedIn Leads" ? (
                        <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] dark:text-[#38BDF8] shrink-0" />
                      ) : filterMagnet === "All Locked PDFs" ? (
                        <Lock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      ) : filterMagnet === "All Form Magnets" ? (
                        <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                      ) : (
                        <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      )}
                      <span className="truncate max-w-[150px]">{filterMagnet}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-300 ${filterOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {filterOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -4 }}
                          transition={{ type: "spring", damping: 28, stiffness: 400 }}
                          style={{ transformOrigin: "top left" }}
                          className="absolute left-0 top-full z-40 mt-1.5 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181F]/95 dark:text-white dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Quick Filters
                          </div>

                          {/* All Leads */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterMagnet("All lead magnets");
                              setFilterOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                              filterMagnet === "All lead magnets"
                                ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              All lead magnets
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-200/60 text-[9px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                                {filterCounts.all}
                              </span>
                              {filterMagnet === "All lead magnets" && <Check className="h-3.5 w-3.5 text-current shrink-0" />}
                            </div>
                          </button>

                          {/* LinkedIn Leads */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterMagnet("All LinkedIn Leads");
                              setFilterOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                              filterMagnet === "All LinkedIn Leads"
                                ? "bg-[#0A66C2]/10 text-[#0A66C2] font-bold dark:bg-[#0A66C2]/20 dark:text-[#38BDF8]"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] dark:text-[#38BDF8] shrink-0" />
                              All LinkedIn Leads
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.2 rounded bg-[#0A66C2]/10 text-[9px] font-semibold text-[#0A66C2] dark:bg-[#0A66C2]/25 dark:text-[#38BDF8]">
                                {filterCounts.linkedIn}
                              </span>
                              {filterMagnet === "All LinkedIn Leads" && <Check className="h-3.5 w-3.5 text-current shrink-0" />}
                            </div>
                          </button>

                          {/* Locked PDFs */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterMagnet("All Locked PDFs");
                              setFilterOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                              filterMagnet === "All Locked PDFs"
                                ? "bg-amber-500/10 text-amber-600 font-bold dark:bg-amber-500/20 dark:text-amber-400"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              All Locked PDFs
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                                {filterCounts.lockedPdf}
                              </span>
                              {filterMagnet === "All Locked PDFs" && <Check className="h-3.5 w-3.5 text-current shrink-0" />}
                            </div>
                          </button>

                          {/* Form Magnets */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterMagnet("All Form Magnets");
                              setFilterOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                              filterMagnet === "All Form Magnets"
                                ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                              All Form Magnets
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.2 rounded bg-[#0066B2]/10 text-[9px] font-semibold text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]">
                                {filterCounts.forms}
                              </span>
                              {filterMagnet === "All Form Magnets" && <Check className="h-3.5 w-3.5 text-current shrink-0" />}
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search email, name, or magnet..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-8 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#202026] dark:text-white dark:placeholder-zinc-500"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. MOBILE Toolbar (block md:hidden) - 50/50 Search & Filter Dropdown      */}
            {/* ========================================================================= */}
            <div className="block md:hidden p-3.5 border-b border-zinc-200/80 dark:border-[#2e2e38] space-y-2.5">
              {/* 50/50 Row: Search Input & Filter Dropdown */}
              <div className="grid grid-cols-2 gap-2">
                {/* 50% Search Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 py-2 pl-7 pr-6 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:bg-white focus:outline-none dark:border-[#2e2e38] dark:bg-[#1C1C22] dark:text-white dark:placeholder-zinc-500 transition-all shadow-2xs"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* 50% Filter Dropdown */}
                <div className="relative" ref={mobileFilterRef}>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-1 rounded-xl border border-zinc-200/90 bg-white py-2 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#1C1C22] dark:text-zinc-200 active:scale-98 transition cursor-pointer shadow-2xs select-none"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {filterMagnet === "All LinkedIn Leads" ? (
                        <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] dark:text-[#38BDF8] shrink-0" />
                      ) : filterMagnet === "All Locked PDFs" ? (
                        <Lock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      ) : filterMagnet === "All Form Magnets" ? (
                        <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                      ) : (
                        <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      )}
                      <span className="truncate text-[11px]">
                        {filterMagnet === "All lead magnets"
                          ? "All Leads"
                          : filterMagnet === "All LinkedIn Leads"
                          ? "LinkedIn"
                          : filterMagnet === "All Locked PDFs"
                          ? "Locked PDFs"
                          : "Forms"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                        mobileFilterOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {mobileFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-40 mt-1.5 w-56 rounded-xl border border-zinc-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181F]/95 dark:text-white"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setFilterMagnet("All lead magnets");
                            setMobileFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                            filterMagnet === "All lead magnets"
                              ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            All Leads
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-200/60 text-[9px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                            {filterCounts.all}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFilterMagnet("All LinkedIn Leads");
                            setMobileFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                            filterMagnet === "All LinkedIn Leads"
                              ? "bg-[#0A66C2]/10 text-[#0A66C2] font-bold dark:bg-[#0A66C2]/20 dark:text-[#38BDF8]"
                              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] dark:text-[#38BDF8] shrink-0" />
                            LinkedIn
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-[#0A66C2]/10 text-[9px] font-semibold text-[#0A66C2] dark:bg-[#0A66C2]/25 dark:text-[#38BDF8]">
                            {filterCounts.linkedIn}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFilterMagnet("All Locked PDFs");
                            setMobileFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                            filterMagnet === "All Locked PDFs"
                              ? "bg-amber-500/10 text-amber-600 font-bold dark:bg-amber-500/20 dark:text-amber-400"
                              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            Locked PDFs
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-[9px] font-semibold text-amber-600 dark:bg-amber-500/25 dark:text-amber-400">
                            {filterCounts.lockedPdf}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFilterMagnet("All Form Magnets");
                            setMobileFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                            filterMagnet === "All Form Magnets"
                              ? "bg-sky-500/10 text-sky-600 font-bold dark:bg-sky-500/20 dark:text-sky-400"
                              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                            Form Magnets
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-[9px] font-semibold text-sky-600 dark:bg-sky-500/25 dark:text-sky-400">
                            {filterCounts.forms}
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mobile Selection Mode Bar / Subtitle Strip */}
              <div className="pt-1 text-xs">
                {isMobileSelectionMode ? (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.includes(l.id))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                      />
                      <span className="font-bold text-zinc-900 dark:text-white">
                        Select All ({paginatedLeads.length})
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileSelectionMode(false);
                        setSelectedLeadIds([]);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0066B2] hover:bg-[#0066B2]/10 dark:text-[#38BDF8] dark:hover:bg-[#38BDF8]/10 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                      All Subscribers ({filtered.length})
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsMobileSelectionMode(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-zinc-200/90 bg-white dark:border-[#2e2e38] dark:bg-[#202026] text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#282830] transition cursor-pointer shadow-2xs"
                    >
                      <span>Select</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. DESKTOP Table View (hidden md:block) - Preserved 100% Unchanged        */}
            {/* ========================================================================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left divide-y divide-zinc-200/80 dark:divide-[#2e2e38]">
                <thead className="bg-[#F8FBFF] dark:bg-[#151518]">
                  <tr>
                    <th className="px-3 py-3.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={paginatedLeads.length > 0 && selectedLeadIds.length === paginatedLeads.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                        title="Select All On Page"
                      />
                    </th>
                    <th className="px-3 lg:px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Subscriber</th>
                    <th className="px-3 lg:px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Source / Gate</th>
                    <th className="px-3 lg:px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Lead Magnet</th>
                    <th className="px-3 lg:px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Signup Date</th>
                    <th className="px-3 lg:px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Sequence</th>
                    <th className="px-3 lg:px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white dark:divide-[#222228] dark:bg-[#18181B]">
                  {paginatedLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    const isLinkedIn = checkIsLinkedInLead(lead);
                    const isLockedPdf = !isLinkedIn && checkIsLockedPdfLead(lead);
                    const isManual =
                      !isLinkedIn &&
                      (lead.source === "integration" ||
                      (lead.source as string) === "manual" ||
                      lead.page === "Direct Manual Add" ||
                      lead.sequence === "Imported Contact");

                    return (
                      <LeadTableRow
                        key={lead.id}
                        lead={lead}
                        isSelected={isSelected}
                        isLockedPdf={isLockedPdf}
                        isManual={isManual}
                        isLinkedIn={isLinkedIn}
                        formattedDate={formatDateOnly(lead.signedUpAt)}
                        sequenceStatusNode={renderSequenceStatus(lead)}
                        onToggleSelect={toggleSelectLead}
                        onViewDetails={setSelectedLead}
                        onDelete={setLeadToDelete}
                        onCopyEmail={copyEmailToClipboard}
                      />
                    );
                  })}
                </tbody>
              </table>

              {/* Empty state desktop */}
              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                    {search ? "No matching leads found" : "No leads yet"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085]">
                    {search
                      ? "Try searching for a different name, email, or magnet."
                      : "Leads appear automatically when users enter their email on a published magnet."}
                  </p>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 4. MOBILE Card-Based Leads List (block md:hidden) - Senior UX Engineered  */}
            {/* ========================================================================= */}
            <div className="block md:hidden p-3 space-y-2.5">
              {paginatedLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const isLinkedIn = checkIsLinkedInLead(lead);
                const isLockedPdf = !isLinkedIn && checkIsLockedPdfLead(lead);
                const isManual =
                  !isLinkedIn &&
                  (lead.source === "integration" ||
                  (lead.source as string) === "manual" ||
                  lead.page === "Direct Manual Add" ||
                  lead.sequence === "Imported Contact");

                return (
                  <MobileLeadCard
                    key={lead.id}
                    lead={lead}
                    isSelected={isSelected}
                    isSelectionMode={isMobileSelectionMode}
                    isLockedPdf={isLockedPdf}
                    isManual={isManual}
                    isLinkedIn={isLinkedIn}
                    formattedDate={formatDateOnly(lead.signedUpAt)}
                    sequenceStatusNode={renderSequenceStatus(lead)}
                    onToggleSelect={toggleSelectLead}
                    onEnterSelectionMode={(id) => {
                      setIsMobileSelectionMode(true);
                      setSelectedLeadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                    }}
                    onViewDetails={setSelectedLead}
                    onDelete={setLeadToDelete}
                    onCopyEmail={copyEmailToClipboard}
                  />
                );
              })}

              {/* Empty state mobile */}
              {filtered.length === 0 && (
                <div className="py-12 px-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                    {search ? "No matching leads found" : "No leads yet"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] max-w-xs mx-auto mb-4">
                    {search
                      ? "Try searching for a different name, email, or magnet."
                      : "Leads appear automatically when users enter their email on a published magnet."}
                  </p>
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066B2] text-xs font-bold text-white shadow-sm cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>+ Add Subscriber</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 5. DESKTOP Pagination (hidden md:flex) - Preserved 100% Unchanged         */}
            {/* ========================================================================= */}
            {filtered.length > 0 && (
              <div className="hidden md:flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-t border-zinc-200/80 dark:border-[#2e2e38] bg-[#F8FBFF]/50 dark:bg-[#151518]/50 text-xs text-zinc-600 dark:text-[#9B9085]">
                <div>
                  Showing <strong className="text-zinc-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                  <strong className="text-zinc-900 dark:text-white">{Math.min(currentPage * pageSize, filtered.length)}</strong> of{" "}
                  <strong className="text-zinc-900 dark:text-white">{filtered.length}</strong> leads
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 font-semibold text-zinc-900 dark:text-white text-xs">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. MOBILE Pagination (flex md:hidden) - Ergonomic Thumb Buttons           */}
            {/* ========================================================================= */}
            {filtered.length > 0 && (
              <div className="flex md:hidden flex-col gap-2.5 p-3.5 border-t border-zinc-200/80 dark:border-[#2e2e38] bg-[#F8FBFF]/50 dark:bg-[#151518]/50">
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-[#9B9085]">
                  <div>
                    Showing <strong className="text-zinc-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</strong>-
                    <strong className="text-zinc-900 dark:text-white">{Math.min(currentPage * pageSize, filtered.length)}</strong> of{" "}
                    <strong className="text-zinc-900 dark:text-white">{filtered.length}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition shadow-2xs cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  <span className="px-3 text-xs font-bold text-zinc-900 dark:text-white shrink-0">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition shadow-2xs cursor-pointer"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. MOBILE Floating Bulk Action Bar (fixed bottom pill)                     */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {selectedLeadIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed bottom-4 left-3 right-3 z-40 flex md:hidden items-center justify-between rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-[#18181F]/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0066B2] text-xs font-bold text-white shadow-xs">
                  {selectedLeadIds.length}
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Selected</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:opacity-80 transition cursor-pointer ml-1"
                >
                  {selectedLeadIds.length === paginatedLeads.length ? "Deselect" : "Select All"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLeadIds([]);
                    setIsMobileSelectionMode(false);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#222228] text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete ({selectedLeadIds.length})</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Add Subscriber Manually Modal */}
        <AddLeadModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddManuallySubmit}
          newLeadEmail={newLeadEmail}
          setNewLeadEmail={setNewLeadEmail}
          newLeadName={newLeadName}
          setNewLeadName={setNewLeadName}
          newLeadMagnet={newLeadMagnet}
          setNewLeadMagnet={setNewLeadMagnet}
          magnetPages={magnetPages}
          isAdding={isAdding}
        />

        {/* 2. Import CSV Preview Modal */}
        <ImportCsvModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          csvFileName={csvFileName}
          importedLeadsPreview={importedLeadsPreview}
          isImporting={isImporting}
          onConfirmImport={confirmCSVImport}
        />

        {/* 3. Delete Lead Modal */}
        <DeleteLeadModal
          leadToDelete={leadToDelete}
          isDeleting={isDeleting}
          onClose={() => setLeadToDelete(null)}
          onConfirmDelete={confirmDeleteLead}
        />

        {/* 4. Bulk Delete Confirmation Modal */}
        <BulkDeleteModal
          isOpen={showBulkDeleteModal}
          selectedCount={selectedLeadIds.length}
          isBulkDeleting={isBulkDeleting}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirmBulkDelete={confirmBulkDelete}
        />

        {/* 5. Lead Details Modal */}
        <AnimatePresence>
          {selectedLead && (
            <LeadDetailsModal
              key="lead-details-modal"
              selectedLead={selectedLead}
              magnetPages={magnetPages}
              sequences={sequences}
              account={account}
              onClose={() => setSelectedLead(null)}
              onDelete={(lead) => {
                setSelectedLead(null);
                setLeadToDelete(lead);
              }}
              onResendEmail={handleResendEmail}
            />
          )}
        </AnimatePresence>

        {/* 6. Floating Toast Notification Container */}
        <LeadToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </DashboardShell>
  );
}

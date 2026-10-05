"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import dynamic from "next/dynamic";
import {
  FileLock,
  Plus,
  Eye,
  Check,
  Lock,
  Mail,
  Clock,
  Home,
  Globe,
  MousePointer,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  X,
  Sparkles,
  FileText,
  TrendingUp,
  HardDrive,
  Copy,
  ExternalLink,
  Search,
  LayoutGrid,
  List,
  Pencil,
  BarChart2,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import {
  loadPages,
  savePages,
  deletePage,
  syncWithDatabase,
  loadAccount,
  loadResources,
} from "@/lib/store";
import type { Account, MagnetPage } from "@/lib/data";
import { getMagnetSortTimestamp } from "@/lib/utils";

import type { SequenceEmailItem } from "@/components/leadmagnets/edit/SequenceTab";

import LockedPdfSetup from "@/components/leadmagnets/locked-pdf-setup";

// Code-split heavy secondary workflow tabs & modals so TipTap editor and preview bundles load on demand
const DeliveryEmailTab = dynamic(() => import("@/components/leadmagnets/edit/DeliveryEmailTab"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <Loader2 className="h-6 w-6 animate-spin text-[#0066B2]" />
    </div>
  ),
});

const SequenceTab = dynamic(() => import("@/components/leadmagnets/edit/SequenceTab"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <Loader2 className="h-6 w-6 animate-spin text-[#0066B2]" />
    </div>
  ),
});

const AfterSignupTab = dynamic(() => import("@/components/leadmagnets/edit/AfterSignupTab"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <Loader2 className="h-6 w-6 animate-spin text-[#0066B2]" />
    </div>
  ),
});

const EmailPreviewModal = dynamic(() => import("@/components/leadmagnets/edit/EmailPreviewModal"), {
  ssr: false,
});

const SequencePreviewModal = dynamic(() => import("@/components/leadmagnets/edit/SequencePreviewModal"), {
  ssr: false,
});

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function LockedPdfPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active Tab navigation state ("locked" | "email" | "sequence" | "after")
  const [activeTab, setActiveTab] = useState<"locked" | "email" | "sequence" | "after">("locked");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Toasts & Modal States
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMagnetName, setCreateMagnetName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isCustomSlugEdited, setIsCustomSlugEdited] = useState(false);

  // List / Grid / Search / View Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delivery Email tab state
  const [emailSubject, setEmailSubject] = useState("Your PDF resource is inside!");
  const [emailPreviewText, setEmailPreviewText] = useState("Here is your link to view the document.");
  const [emailBody, setEmailBody] = useState("<p>Hi there,</p><p>Thanks for requesting access! Click below to view the document.</p>");
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [showInsertResourceMenu, setShowInsertResourceMenu] = useState(false);
  const [hostedResources, setHostedResources] = useState<any[]>([]);
  const [showAssetPickerModal, setShowAssetPickerModal] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [selectedHostedPdf, setSelectedHostedPdf] = useState<{ url: string; name: string; timestamp?: number } | null>(null);
  const [enableAiPersonalizedDeliverable, setEnableAiPersonalizedDeliverable] = useState(false);
  const [customPromptQuestion, setCustomPromptQuestion] = useState("");
  const [customPromptPlaceholder, setCustomPromptPlaceholder] = useState("");

  const filteredHostedAssets = useMemo(() => {
    const q = assetSearchQuery.trim().toLowerCase();
    return hostedResources.filter((r: any) => {
      // Exclude internal page assets
      if (r.isPageAsset === true || r.type === "page_asset" || (r.name && r.name.startsWith("page_asset_"))) {
        return false;
      }
      // On the Locked PDF page, only show PDF files
      const isPdf =
        r.name?.toLowerCase().endsWith(".pdf") ||
        r.fileUrl?.toLowerCase().includes(".pdf") ||
        r.url?.toLowerCase().includes(".pdf") ||
        r.fileExt?.toLowerCase() === ".pdf";
      if (!isPdf) return false;
      return !q || (r.name && r.name.toLowerCase().includes(q));
    });
  }, [hostedResources, assetSearchQuery]);

  // Sequence tab state
  const [sequenceEnabled, setSequenceEnabled] = useState(false);
  const [stopOnCall, setStopOnCall] = useState(false);
  const [sequenceEmails, setSequenceEmails] = useState<SequenceEmailItem[]>([
    {
      id: "seq-1",
      subject: "Did you have a chance to read the document?",
      delayDays: 1,
      delayUnit: "hours",
      previewText: "Quick check-in regarding your access",
      body: "Hi there,\n\nJust wanted to follow up and see if you had any questions after reading through the PDF!\n\nBest,",
    },
  ]);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState(0);
  const [showSequencePreviewModal, setShowSequencePreviewModal] = useState(false);
  const [previewSequenceIndex, setPreviewSequenceIndex] = useState(0);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<"desktop" | "mobile">("desktop");

  // After Signup tab state
  const [afterSignupOption, setAfterSignupOption] = useState<"standard" | "elsewhere" | "custom">("standard");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customHeading, setCustomHeading] = useState("Access Granted!");
  const [customMessage, setCustomMessage] = useState("Thank you for verifying your email. You can now read the full PDF document.");
  const [videoUrl, setVideoUrl] = useState("");
  const [buttonLabel, setButtonLabel] = useState("View Full PDF");
  const [buttonUrl, setButtonUrl] = useState("");
  const [quizFunnelEnabled, setQuizFunnelEnabled] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<import("@/lib/data").QuizQuestion[]>([]);

  // Enterprise Keyboard Navigation & Accessibility (a11y) Refs
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const handleTabKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    const tabIds = ["locked", "email", "sequence", "after"];
    const currentIndex = tabIds.indexOf(currentId);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % tabIds.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = tabIds.length - 1;
    } else {
      return;
    }

    const nextTabId = tabIds[targetIndex] as "locked" | "email" | "sequence" | "after";
    setActiveTab(nextTabId);
    tabRefs.current[nextTabId]?.focus();
  };

  // Enterprise Auto-Save & Debounce State
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPagesRef = useRef<MagnetPage[] | null>(null);

  // Production-grade debounced save handler (500ms delay)
  const triggerDebouncedSave = useCallback((updatedPages: MagnetPage[]) => {
    setPages(updatedPages);
    pendingPagesRef.current = updatedPages;
    setSaveStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (pendingPagesRef.current) {
        savePages(pendingPagesRef.current);
        pendingPagesRef.current = null;
      }
      setSaveStatus("saved");
    }, 500);
  }, []);

  // Immediate save for explicit actions (like delete or manual create)
  const triggerImmediateSave = useCallback((updatedPages: MagnetPage[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    pendingPagesRef.current = null;
    setPages(updatedPages);
    savePages(updatedPages);
    setSaveStatus("saved");
  }, []);

  useEffect(() => {
    const anyOpen = showEmailPreviewModal || showSequencePreviewModal || showDeleteModal || showCreateModal || showAssetPickerModal || showBulkDeleteModal;
    const lenis = typeof window !== "undefined" ? (window as any).__lenis : null;
    if (anyOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (lenis && typeof lenis.stop === "function") lenis.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (lenis && typeof lenis.start === "function") lenis.start();
    };
  }, [showEmailPreviewModal, showSequencePreviewModal, showDeleteModal, showCreateModal, showAssetPickerModal, showBulkDeleteModal]);

  // Ensure unmount cleanup flushes any pending unsaved state
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (pendingPagesRef.current) {
        savePages(pendingPagesRef.current);
      }
    };
  }, []);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Initial Load & Store Sync
  useEffect(() => {
    const localPages = loadPages();
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    const localResources = loadResources();
    if (localResources) setHostedResources(localResources);

    if (localPages.length > 0) {
      setPages(localPages);
      const lockedPages = localPages.filter((p) => p.template === "locked-pdf");
      if (lockedPages.length > 0) {
        setSelectedPageId((prev) => prev || lockedPages[0].id);
      }
    }
    setLoading(false);

    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        if (data.pages && data.pages.length > 0) {
          setPages(data.pages);
          const lockedPages = data.pages.filter((p) => p.template === "locked-pdf");
          if (lockedPages.length > 0) {
            setSelectedPageId((prev) => prev || lockedPages[0].id);
          }
        }
      }
    });
  }, []);

  // Filter ONLY for pages that are explicitly Locked PDFs (sorted newest first)
  const lockedPdfPages = useMemo(() => {
    const list = pages.filter((p) => p.template === "locked-pdf");
    return [...list].sort((a, b) => {
      const diff = getMagnetSortTimestamp(b) - getMagnetSortTimestamp(a);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });
  }, [pages]);

  // Total and Status Counts
  const total = lockedPdfPages.length;
  const liveCount = useMemo(() => lockedPdfPages.filter((p) => p.status === "live").length, [lockedPdfPages]);
  const draftCount = useMemo(() => lockedPdfPages.filter((p) => p.status !== "live").length, [lockedPdfPages]);

  const totalViews = useMemo(() => lockedPdfPages.reduce((sum, p) => sum + (p.views || 0), 0), [lockedPdfPages]);
  const totalSignups = useMemo(() => lockedPdfPages.reduce((sum, p) => sum + (p.signups || 0), 0), [lockedPdfPages]);
  const avgConversion = useMemo(() => totalViews > 0 ? ((totalSignups / totalViews) * 100).toFixed(1) : "0.0", [totalViews, totalSignups]);

  // Filtered locked PDFs based on search and status
  const filtered = useMemo(() => {
    return lockedPdfPages.filter((p) => {
      if (statusFilter === "live" && p.status !== "live") return false;
      if (statusFilter === "draft" && p.status === "live") return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = (p.name || "").toLowerCase().includes(q);
        const matchesSlug = (p.slug || "").toLowerCase().includes(q);
        const matchesTitle = (p.pdfTitle || "").toLowerCase().includes(q);
        if (!matchesName && !matchesSlug && !matchesTitle) return false;
      }
      return true;
    });
  }, [lockedPdfPages, statusFilter, search]);

  // Saved Locked PDFs for cards grid
  const savedLockedPdfPages = useMemo(() => {
    return filtered;
  }, [filtered]);

  // Active selected locked PDF page object
  const activePage = useMemo(() => {
    if (selectedPageId) {
      const found = lockedPdfPages.find((p) => p.id === selectedPageId);
      if (found) return found;
    }
    return lockedPdfPages[0] || null;
  }, [selectedPageId, lockedPdfPages]);

  // Document-specific statistics for active Locked PDF
  const activePdfStats = useMemo(() => {
    if (!activePage) {
      return {
        pagesCount: 0,
        freePages: 2,
        views: 0,
        signups: 0,
        convRate: "0.0%",
      };
    }

    const pagesCount = activePage.pdfPageCount || activePage.pdfPages?.length || 0;
    const freePages = activePage.pdfFreePages !== undefined ? activePage.pdfFreePages : 2;
    const views = activePage.views || 0;
    const signups = activePage.signups || 0;
    const convRate = views > 0 ? ((signups / views) * 100).toFixed(1) + "%" : "0.0%";

    return {
      pagesCount,
      freePages,
      views,
      signups,
      convRate,
    };
  }, [activePage]);

  // Populate activePage states when activePage changes
  useEffect(() => {
    if (!activePage) return;
    if (activePage.deliveryEmail) {
      setEmailSubject(activePage.deliveryEmail.subject || "Your PDF resource is inside!");
      setEmailPreviewText(activePage.deliveryEmail.previewText || "Here is your link to view the document.");
      if (activePage.deliveryEmail.body) setEmailBody(activePage.deliveryEmail.body);
    } else {
      if (activePage.emailSubject) setEmailSubject(activePage.emailSubject);
      if (activePage.emailPreviewText) setEmailPreviewText(activePage.emailPreviewText);
      if (activePage.emailBody) setEmailBody(activePage.emailBody);
    }
    if (activePage.sequenceEnabled !== undefined) {
      setSequenceEnabled(activePage.sequenceEnabled);
    }
    if (activePage.sequenceEmails && Array.isArray(activePage.sequenceEmails)) {
      setSequenceEmails(activePage.sequenceEmails);
    }
    if (activePage.afterSignupOption) setAfterSignupOption(activePage.afterSignupOption);
    if (activePage.destinationUrl) setDestinationUrl(activePage.destinationUrl);
    if (activePage.customHeading) setCustomHeading(activePage.customHeading);
    if (activePage.customMessage) setCustomMessage(activePage.customMessage);
    if (activePage.videoUrl) setVideoUrl(activePage.videoUrl);
    if (activePage.buttonLabel) setButtonLabel(activePage.buttonLabel);
    if (activePage.buttonUrl) setButtonUrl(activePage.buttonUrl);
    if (activePage.quizFunnelEnabled !== undefined) setQuizFunnelEnabled(activePage.quizFunnelEnabled);
    if (activePage.enableAiPersonalizedDeliverable !== undefined) setEnableAiPersonalizedDeliverable(activePage.enableAiPersonalizedDeliverable);
    if (activePage.customPromptQuestion) setCustomPromptQuestion(activePage.customPromptQuestion);
    if (activePage.customPromptPlaceholder) setCustomPromptPlaceholder(activePage.customPromptPlaceholder);
  }, [activePage?.id]);

  const handleUpdateEmailSubject = useCallback((val: string) => {
    setEmailSubject(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id
          ? {
            ...p,
            deliveryEmail: {
              subject: val,
              previewText: emailPreviewText,
              body: emailBody,
              linkText: p.deliveryEmail?.linkText || "Access document",
              linkUrl: p.deliveryEmail?.linkUrl || "",
            },
            emailSubject: val,
          }
          : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, emailPreviewText, emailBody, triggerDebouncedSave]);

  const handleUpdateEmailPreviewText = useCallback((val: string) => {
    setEmailPreviewText(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id
          ? {
            ...p,
            deliveryEmail: {
              subject: emailSubject,
              previewText: val,
              body: emailBody,
              linkText: p.deliveryEmail?.linkText || "Access document",
              linkUrl: p.deliveryEmail?.linkUrl || "",
            },
            emailPreviewText: val,
          }
          : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, emailSubject, emailBody, triggerDebouncedSave]);

  const handleUpdateEmailBody: React.Dispatch<React.SetStateAction<string>> = useCallback((value) => {
    setEmailBody((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (activePage) {
        const updated = pages.map((p) =>
          p.id === activePage.id
            ? {
              ...p,
              deliveryEmail: {
                subject: emailSubject,
                previewText: emailPreviewText,
                body: next,
                linkText: p.deliveryEmail?.linkText || "Access document",
                linkUrl: p.deliveryEmail?.linkUrl || "",
              },
              emailBody: next,
            }
            : p
        );
        triggerDebouncedSave(updated);
      }
      return next;
    });
  }, [activePage, pages, emailSubject, emailPreviewText, triggerDebouncedSave]);

  const handleUpdateEnableAi = useCallback((val: boolean) => {
    setEnableAiPersonalizedDeliverable(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, enableAiPersonalizedDeliverable: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateCustomPromptQuestion = useCallback((val: string) => {
    setCustomPromptQuestion(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, customPromptQuestion: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateCustomPromptPlaceholder = useCallback((val: string) => {
    setCustomPromptPlaceholder(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, customPromptPlaceholder: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateAfterSignupOption = useCallback((val: "standard" | "elsewhere" | "custom") => {
    setAfterSignupOption(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, afterSignupOption: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateDestinationUrl = useCallback((val: string) => {
    setDestinationUrl(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, destinationUrl: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateCustomHeading = useCallback((val: string) => {
    setCustomHeading(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, customHeading: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateCustomMessage = useCallback((val: string) => {
    setCustomMessage(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, customMessage: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateVideoUrl = useCallback((val: string) => {
    setVideoUrl(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, videoUrl: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateButtonLabel = useCallback((val: string) => {
    setButtonLabel(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, buttonLabel: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateButtonUrl = useCallback((val: string) => {
    setButtonUrl(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, buttonUrl: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateQuizFunnelEnabled = useCallback((val: boolean) => {
    setQuizFunnelEnabled(val);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, quizFunnelEnabled: val } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleToggleSequenceEnabled = useCallback((enabled: boolean) => {
    setSequenceEnabled(enabled);
    if (activePage) {
      const updated = pages.map((p) =>
        p.id === activePage.id ? { ...p, sequenceEnabled: enabled } : p
      );
      triggerDebouncedSave(updated);
    }
  }, [activePage, pages, triggerDebouncedSave]);

  const handleUpdateSequenceEmails: React.Dispatch<React.SetStateAction<SequenceEmailItem[]>> = useCallback((value) => {
    setSequenceEmails((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (activePage) {
        const updated = pages.map((p) =>
          p.id === activePage.id ? { ...p, sequenceEmails: next } : p
        );
        triggerDebouncedSave(updated);
      }
      return next;
    });
  }, [activePage, pages, triggerDebouncedSave]);

  const addSequenceEmail = useCallback(() => {
    const nextNum = sequenceEmails.length + 1;
    const newId = Date.now().toString();
    const newItem: SequenceEmailItem = {
      id: newId,
      subject: `Follow-up ${nextNum}: Check out this document`,
      delayDays: 1,
      delayUnit: "hours",
      previewText: "Quick follow-up regarding your access",
      body: `Hi there,\n\nFollowing up to see if you had any questions regarding the document!\n\nBest,\n${account?.name || "The Team"}`,
    };
    const updated = [...sequenceEmails, newItem];
    setSequenceEmails(updated);
    setSelectedSequenceIndex(updated.length - 1);
    setSequenceEnabled(true);

    if (activePage) {
      const nextPages = pages.map((p) =>
        p.id === activePage.id ? { ...p, sequenceEnabled: true, sequenceEmails: updated } : p
      );
      triggerImmediateSave(nextPages);
    }
  }, [sequenceEmails, account?.name, activePage, pages, triggerImmediateSave]);

  const removeSequenceEmail = useCallback((id: string, index?: number) => {
    const updated = sequenceEmails.filter((item, i) => (id && item.id ? item.id !== id : i !== index));
    setSequenceEmails(updated);
    const nextEnabled = updated.length > 0 ? sequenceEnabled : false;
    if (updated.length === 0) {
      setSelectedSequenceIndex(0);
    } else if (selectedSequenceIndex >= updated.length) {
      setSelectedSequenceIndex(updated.length - 1);
    }

    if (activePage) {
      const nextPages = pages.map((p) =>
        p.id === activePage.id ? { ...p, sequenceEnabled: nextEnabled, sequenceEmails: updated } : p
      );
      triggerImmediateSave(nextPages);
    }
  }, [sequenceEmails, sequenceEnabled, selectedSequenceIndex, activePage, pages, triggerImmediateSave]);

  const derivedSlug = useMemo(() => {
    return (
      createMagnetName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-") || "locked-pdf"
    );
  }, [createMagnetName]);

  const handleCreateLockedPdf = () => {
    const name = createMagnetName.trim() || "Locked PDF Document";
    const rawSlug = (isCustomSlugEdited ? customSlug : (customSlug || derivedSlug)).trim();
    const cleanSlug = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") || "locked-pdf";
    const newId = `page-${Date.now()}`;

    const newMagnet: MagnetPage = {
      id: newId,
      userEmail: account?.email,
      name,
      slug: cleanSlug,
      status: "live",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: name,
      subheadline: "Enter your email to verify and unlock full PDF access instantly.",
      cta: "Verify & Unlock PDF",
      deliverable: "Locked PDF Document",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      template: "locked-pdf",
      accent: account?.brandColor || "#0066B2",
      pdfPages: [],
      pdfFreePages: 2,
      pdfTitle: name,
      pdfPageCount: 0,
    };

    const updated = [newMagnet, ...pages];
    setPages(updated);
    savePages(updated);
    setSelectedPageId(newId);
    setShowCreateModal(false);
    setCreateMagnetName("");
    setCustomSlug("");
    setIsCustomSlugEdited(false);
    addToast(`Created "${name}". Ready for PDF upload!`);
  };

  const handleCreateLandingPage = () => {
    const name = createMagnetName.trim() || "Untitled Landing Page";
    const cleanSlug = derivedSlug || "untitled-page";
    const newId = `page-${Date.now()}`;

    const newMagnet: MagnetPage = {
      id: newId,
      name,
      slug: cleanSlug,
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: name,
      subheadline: "Enter your email to get instant access.",
      cta: "Get instant access",
      deliverable: "Instant Access",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      publishedAt: null,
      template: "classic",
      accent: account?.brandColor || "#0066B2",
    };

    const updated = [newMagnet, ...pages];
    setPages(updated);
    savePages(updated);
    setShowCreateModal(false);
    setCreateMagnetName("");
    router.push(`/dashboard/leadmagnets/${newId}`);
  };

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

  const confirmBulkDeletion = useCallback(() => {
    if (checkedIds.length === 0) return;
    const remaining = pages.filter((p) => !checkedIds.includes(p.id));
    setPages(remaining);
    savePages(remaining);
    checkedIds.forEach((id) => deletePage(id));

    if (selectedPageId && checkedIds.includes(selectedPageId)) {
      const remainingLocked = remaining.filter((p) => p.template === "locked-pdf" || p.pdfFreePages !== undefined);
      setSelectedPageId(remainingLocked[0]?.id || remaining[0]?.id || null);
    }
    addToast(`Deleted ${checkedIds.length} locked PDF${checkedIds.length > 1 ? "s" : ""}.`);
    setCheckedIds([]);
    setShowBulkDeleteModal(false);
    router.refresh();
  }, [checkedIds, pages, selectedPageId, router]);

  const handleDeleteActiveDocument = () => {
    if (!activePage) return;
    setIsDeleting(true);
    try {
      deletePage(activePage.id);
      const remaining = pages.filter((p) => p.id !== activePage.id);
      setPages(remaining);
      savePages(remaining);
      setCheckedIds((prev) => prev.filter((id) => id !== activePage.id));

      const remainingLocked = remaining.filter(
        (p) => p.template === "locked-pdf" || p.pdfFreePages !== undefined
      );
      if (remainingLocked.length > 0) {
        setSelectedPageId(remainingLocked[0].id);
      } else if (remaining[0]) {
        setSelectedPageId(remaining[0].id);
      } else {
        setSelectedPageId(null);
      }

      addToast(`Deleted "${activePage.name}".`);
      setShowDeleteModal(false);
    } catch (e) {
      addToast("Failed to delete document.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in");

  return (
    <DashboardShell account={account} title="Locked PDF">
      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${toast.type === "error"
                  ? "bg-rose-900/90 text-rose-100 border-rose-700/50"
                  : "bg-zinc-900/95 text-white border-zinc-700/60 dark:bg-zinc-800/95"
                }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-[#0B0B0D]">
        {/* Top Executive Header */}
        <div className="px-6 pt-6 lg:px-8 border-b border-zinc-200/80 dark:border-zinc-800/60 bg-white/80 dark:bg-[#121215] dark:bg-opacity-85 backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="flex items-center justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                Locked PDF
              </h1>
            </div>

            {/* Actions: Choose Assets, Create Locked PDF */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const fresh = loadResources().filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
                  setHostedResources(fresh);
                  setShowAssetPickerModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#1E1E24] px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#27272A] transition shadow-xs cursor-pointer active:scale-95"
              >
                <HardDrive className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
                <span className="hidden sm:inline">Choose Assets</span>
                <span className="sm:hidden">Assets</span>
              </button>

              <button
                onClick={() => {
                  setCreateMagnetName("");
                  setCustomSlug("");
                  setIsCustomSlugEdited(false);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-md shadow-[#0066B2]/20 cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
                <span className="hidden sm:inline">Create Locked PDF</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 text-xs">
            {/* Active Pages */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#0066B2]/15 text-[#0066B2] dark:text-[#38BDF8]">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Active Pages</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  {liveCount} <span className="text-xs font-normal text-zinc-400">/ {total}</span>
                </p>
              </div>
            </div>

            {/* Total Traffic */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Traffic</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  {totalViews.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Leads Collected */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <MousePointer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Leads Collected</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  {totalSignups.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Avg Conv. Rate */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Avg. Conv. Rate</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  {avgConversion}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Split-Pane Workspace (65% List, 35% Sticky Inspector) */}
        <div className="flex-1 px-6 py-6 lg:px-8 flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[65%] flex flex-col space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 rounded-xl bg-zinc-50 dark:bg-[#1C1C20] px-3.5 py-2 border border-zinc-200/60 dark:border-zinc-800 focus-within:border-[#0066B2] dark:focus-within:border-[#0066B2]">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter locked PDFs by title or slug..."
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
                <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1C1C20] rounded-xl text-xs">
                  {[
                    { id: "all", label: `All (${total})` },
                    { id: "live", label: `Live (${liveCount})` },
                    { id: "draft", label: `Draft (${draftCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={`relative px-3 py-1 font-semibold rounded-lg transition-colors duration-150 cursor-pointer ${
                        statusFilter === tab.id
                          ? "text-zinc-900 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {statusFilter === tab.id && (
                        <motion.div
                          layoutId="activeStatusFilterTabLockedPdf"
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
                    className={`relative p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                      viewMode === "grid" ? "text-[#0066B2] dark:text-[#38BDF8]" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                    title="Grid View"
                  >
                    {viewMode === "grid" && (
                      <motion.div
                        layoutId="activeViewModeTabLockedPdf"
                        className="absolute inset-0 bg-white dark:bg-[#2A2A30] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    <LayoutGrid className="relative z-10 h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setViewMode("table")}
                    className={`relative p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
                      viewMode === "table" ? "text-[#0066B2] dark:text-[#38BDF8]" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                    title="Table View"
                  >
                    {viewMode === "table" && (
                      <motion.div
                        layoutId="activeViewModeTabLockedPdf"
                        className="absolute inset-0 bg-white dark:bg-[#2A2A30] rounded-lg shadow-xs"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    <List className="relative z-10 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Cards Library Grid */}
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
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">No locked PDFs found</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                    {search ? "Try adjusting your search query or clear filters." : "Create your first locked PDF document to start collecting leads."}
                  </p>
                  <button
                    onClick={() => {
                      setCreateMagnetName("");
                      setCustomSlug("");
                      setIsCustomSlugEdited(false);
                      setShowCreateModal(true);
                    }}
                    className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Create Locked PDF
                  </button>
                </motion.div>
              ) : viewMode === "grid" ? (
                <motion.div
                  key={`grid-${statusFilter}-${search}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filtered.map((pdf) => {
                    const isSelected = activePage?.id === pdf.id;
                    const isChecked = checkedIds.includes(pdf.id);
                    const shareUrl = typeof window !== "undefined"
                      ? `${window.location.origin}/pdf-viewer/${pdf.id}`
                      : `/pdf-viewer/${pdf.id}`;

                    return (
                      <div
                        key={pdf.id}
                        onClick={() => {
                          setSelectedPageId(pdf.id);
                          setMobileInspectorOpen(true);
                        }}
                        className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                          isChecked
                            ? "border-[#0066B2] dark:border-[#38BDF8] bg-white dark:bg-[#18181C] ring-2 ring-[#0066B2]/40 dark:ring-[#38BDF8]/40 shadow-md"
                            : isSelected
                              ? "border-[#0066B2] dark:border-[#38BDF8]/80 bg-gradient-to-b from-[#0066B2]/[0.08] via-[#0066B2]/[0.02] to-transparent ring-1 ring-[#0066B2]/30 dark:ring-[#38BDF8]/30 shadow-[0_0_20px_rgba(0,102,178,0.15)]"
                              : "border-zinc-200/80 dark:border-[#1F1F24] bg-white dark:bg-[#151518] hover:border-zinc-300 dark:hover:border-[#27272A] shadow-xs"
                        }`}
                      >


                        {/* PDF Canvas Preview Box */}
                        <div className="relative pt-4 px-3 pb-2 bg-gradient-to-b from-zinc-100 to-zinc-200/60 dark:from-[#18181D] dark:to-[#0F0F12] border-b border-zinc-200/70 dark:border-[#1F1F24] overflow-hidden flex flex-col items-center justify-center min-h-[135px]">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleCheck(pdf.id, e)}
                            className={`absolute top-2.5 right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                              isChecked
                                ? "bg-[#0066B2] border-[#0066B2] text-white shadow-md scale-105 opacity-100"
                                : checkedIds.length > 0
                                  ? "bg-white/90 dark:bg-[#18181D]/90 border-zinc-300 dark:border-zinc-700 text-transparent hover:border-[#0066B2] dark:hover:border-[#38BDF8] opacity-100"
                                  : "bg-white/90 dark:bg-[#18181D]/90 border-zinc-300 dark:border-zinc-700 text-transparent hover:border-[#0066B2] dark:hover:border-[#38BDF8] opacity-0 group-hover:opacity-100"
                            }`}
                            title={isChecked ? "Deselect PDF" : "Select PDF"}
                          >
                            <Check className={`h-3.5 w-3.5 stroke-[3px] ${isChecked ? "opacity-100" : "opacity-0"}`} />
                          </button>
                          {/* Stacked Paper Pages Background (depth effect) */}
                          <div className="absolute inset-x-8 top-2.5 h-[105px] bg-zinc-200/80 dark:bg-zinc-800/60 rounded-t-lg transform scale-95 border border-zinc-300/50 dark:border-zinc-700/50 shadow-xs" />
                          <div className="absolute inset-x-6 top-3 h-[108px] bg-zinc-100 dark:bg-zinc-800/90 rounded-t-lg transform scale-[0.98] border border-zinc-300/60 dark:border-zinc-700/60 shadow-xs" />

                          {/* Main PDF Paper Document Sheet */}
                          <div className="relative w-full max-w-[120px] aspect-[1/1.22] bg-white dark:bg-[#1A1A20] rounded-t-lg rounded-b-sm border border-zinc-300/80 dark:border-zinc-700/80 shadow-[0_6px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] transition-transform duration-300 overflow-hidden flex flex-col">
                            {pdf.pdfPages && pdf.pdfPages.length > 0 ? (
                              <div className="relative flex-1 w-full h-full bg-white dark:bg-[#1A1A20]">
                                <Image
                                  src={pdf.pdfPages[0]}
                                  alt={pdf.name}
                                  fill
                                  sizes="120px"
                                  unoptimized
                                  className="object-cover object-top"
                                />
                              </div>
                            ) : (
                              <div className="p-2 flex-1 flex flex-col justify-between bg-zinc-50/90 dark:bg-[#141418]/90">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center">
                                      <FileText className="h-2 w-2" />
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8] font-mono">
                                      PDF
                                    </span>
                                  </div>
                                  <Lock className="h-2 w-2 text-[#0066B2] dark:text-[#38BDF8]" />
                                </div>

                                <div className="space-y-1 my-auto">
                                  <div className="h-1 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                                  <div className="h-0.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                  <div className="h-0.5 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                  <div className="h-0.5 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                </div>

                                <div className="text-[7.5px] font-mono font-bold text-zinc-400 dark:text-zinc-500 text-center pt-0.5 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                  {pdf.pdfPageCount || 1} {pdf.pdfPageCount === 1 ? "Page" : "Pages"}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Page Count Tag */}
                          <div className="absolute bottom-1.5 right-2 z-10">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-mono font-medium bg-zinc-900/80 text-zinc-300 border border-zinc-700/60 backdrop-blur-md shadow-xs">
                              <FileText className="h-2.5 w-2.5 text-zinc-400" />
                              {pdf.pdfPageCount || (pdf.pdfPages ? pdf.pdfPages.length : 1)}P
                            </span>
                          </div>
                        </div>

                        {/* PDF Info & Actions Footer */}
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] border border-[#0066B2]/20">
                                <Lock className="h-2.5 w-2.5" />
                              </div>
                              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors">
                                {pdf.name}
                              </h3>
                            </div>

                            {/* Interactive Copyable URL Pill */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(shareUrl);
                                addToast(`Copied viewer URL!`);
                              }}
                              className="group/code flex items-center justify-between gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#101013] border border-zinc-200/80 dark:border-[#27272A] hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/40 transition-all cursor-pointer"
                              title="Click to copy Viewer URL"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[8.5px] font-bold text-[#0066B2] dark:text-[#38BDF8] uppercase font-mono tracking-wider">URL</span>
                                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
                                  /pdf-viewer/{pdf.id}
                                </span>
                              </div>
                              <Copy className="h-3 w-3 text-zinc-400 group-hover/code:text-[#0066B2] dark:group-hover/code:text-[#38BDF8] shrink-0 transition-colors" />
                            </div>
                          </div>

                          {/* Bottom Action Row */}
                          <div className="pt-0.5 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPageId(pdf.id);
                                setMobileInspectorOpen(true);
                              }}
                              className="lg:hidden p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-[#0066B2] dark:hover:text-[#38BDF8] bg-zinc-100 dark:bg-zinc-800 transition-all cursor-pointer"
                              title="Details"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(shareUrl);
                                addToast(`Copied share link for "${pdf.name}"!`);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066B2] hover:bg-[#005799] text-white font-extrabold text-[11px] shadow-xs hover:shadow-[#0066B2]/20 active:scale-95 transition-all cursor-pointer"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Share Link</span>
                            </button>

                            <Link
                              href={`/dashboard/leadmagnets/${pdf.id}?type=locked-pdf`}
                              prefetch={true}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                              title="Edit Locked PDF"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>

                            <a
                              href={shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                              title="Open Viewer in New Tab"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPageId(pdf.id);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                              title="Delete Locked PDF"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                /* Table View */
                <motion.div
                  key={`table-${statusFilter}-${search}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141417] overflow-hidden shadow-xs"
                >
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-[#1A1A1E] text-zinc-500 font-bold border-b border-zinc-200/60 dark:border-zinc-800/60">
                      <tr>
                        <th className="px-3 py-3 w-8">
                          <button
                            type="button"
                            onClick={handleToggleSelectAll}
                            className={`flex h-4 w-4 items-center justify-center rounded border transition cursor-pointer ${
                              filtered.length > 0 && filtered.every((p) => checkedIds.includes(p.id))
                                ? "bg-[#0066B2] border-[#0066B2] text-white"
                                : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-transparent"
                            }`}
                          >
                            <Check className={`h-3 w-3 stroke-[3px] ${filtered.length > 0 && filtered.every((p) => checkedIds.includes(p.id)) ? "opacity-100" : "opacity-0"}`} />
                          </button>
                        </th>
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3 text-right">Pages</th>
                        <th className="px-4 py-3 text-right">Views</th>
                        <th className="px-4 py-3 text-right">Unlocks</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {filtered.map((pdf) => {
                        const isSelected = activePage?.id === pdf.id;
                        const isChecked = checkedIds.includes(pdf.id);
                        const shareUrl = typeof window !== "undefined"
                          ? `${window.location.origin}/pdf-viewer/${pdf.id}`
                          : `/pdf-viewer/${pdf.id}`;
                        return (
                          <tr
                            key={pdf.id}
                            onClick={() => {
                              setSelectedPageId(pdf.id);
                              setMobileInspectorOpen(true);
                            }}
                            className={`cursor-pointer transition ${
                              isChecked
                                ? "bg-[#EFF6FF] dark:bg-[#0066B2]/20"
                                : isSelected
                                  ? "bg-[#EFF6FF]/60 dark:bg-[#0066B2]/10"
                                  : "hover:bg-zinc-50 dark:hover:bg-[#1A1A1E]/50"
                            }`}
                          >
                            <td className="px-3 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleToggleCheck(pdf.id, e)}
                                className={`flex h-4 w-4 items-center justify-center rounded border transition cursor-pointer ${
                                  isChecked
                                    ? "bg-[#0066B2] border-[#0066B2] text-white"
                                    : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-transparent hover:border-[#0066B2]"
                                }`}
                              >
                                <Check className={`h-3 w-3 stroke-[3px] ${isChecked ? "opacity-100" : "opacity-0"}`} />
                              </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                              <div className="flex items-center gap-3">
                                <div className="relative h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                                  {pdf.pdfPages && pdf.pdfPages.length > 0 ? (
                                    <Image
                                      src={pdf.pdfPages[0]}
                                      alt=""
                                      fill
                                      sizes="36px"
                                      unoptimized
                                      className="object-cover"
                                    />
                                  ) : (
                                    <FileText className="h-4 w-4 text-zinc-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-zinc-900 dark:text-white line-clamp-1">{pdf.name}</p>
                                  <p className="text-[11px] font-mono text-zinc-400">/pdf-viewer/{pdf.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                              {pdf.pdfPageCount || (pdf.pdfPages ? pdf.pdfPages.length : 1)}P
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                              {pdf.views || 0}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-white">
                              {pdf.signups || 0}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    addToast("Copied viewer link!");
                                  }}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                  title="Copy link"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <Link
                                  href={`/dashboard/leadmagnets/${pdf.id}?type=locked-pdf`}
                                  prefetch={true}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
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
          </div>

          {/* Right Fixed Sticky Inspector Card */}
          <div className="hidden lg:block lg:w-[35%] sticky top-[165px] z-20 space-y-4 transition-all duration-200">
            {activePage ? (
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#141417] p-5 shadow-lg space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">
                      SELECTED INSPECTOR
                    </span>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mt-0.5 line-clamp-1">
                      {activePage.name}
                    </h3>
                  </div>
                </div>

                <div className="rounded-xl bg-zinc-50 dark:bg-[#1A1A1E] p-3 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Public Share URL</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate">
                      /pdf-viewer/{activePage.id}
                    </span>
                    <button
                      onClick={() => {
                        const fullUrl = `${window.location.origin}/pdf-viewer/${activePage.id}`;
                        navigator.clipboard.writeText(fullUrl);
                        setCopiedId(activePage.id);
                        addToast("Copied viewer link!");
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-white dark:bg-[#25252A] px-2.5 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shrink-0 cursor-pointer"
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
                    href={`/dashboard/leadmagnets/${activePage.id}?type=locked-pdf`}
                    prefetch={true}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-sm cursor-pointer active:scale-95"
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
                      href={`/pdf-viewer/${activePage.id}`}
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
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Magnet
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-white dark:bg-[#141417]">
                <FileLock className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-500">Select a Locked PDF to inspect details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showEmailPreviewModal && (
        <EmailPreviewModal
          account={account}
          emailSubject={emailSubject}
          emailPreviewText={emailPreviewText}
          emailBody={emailBody}
          page={activePage!}
          pageId={activePage?.id || ""}
          onClose={() => setShowEmailPreviewModal(false)}
        />
      )}

      {/* Sequence Preview Modal */}
      {showSequencePreviewModal && (
        <SequencePreviewModal
          account={account}
          emailSubject={emailSubject}
          emailPreviewText={emailPreviewText}
          emailBody={emailBody}
          sequenceEmails={sequenceEmails}
          previewSequenceIndex={previewSequenceIndex}
          previewDeviceMode={previewDeviceMode}
          onSetPreviewSequenceIndex={setPreviewSequenceIndex}
          onSetPreviewDeviceMode={setPreviewDeviceMode}
          onClose={() => setShowSequencePreviewModal(false)}
        />
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && activePage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Document?</h3>
              </div>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-white">&quot;{activePage.name}&quot;</span>? This will permanently remove its PDF pages and viewer link.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteActiveDocument}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 'Create a magnet' Popup Modal Overlay */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all duration-200"
            onClick={() => {
              setShowCreateModal(false);
              setCreateMagnetName("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="relative w-full sm:max-w-[460px] rounded-t-[28px] sm:rounded-2xl border-t sm:border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#18181c] p-5 sm:p-6 text-zinc-900 dark:text-white shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Bottom Sheet Grab Handle */}
              <div className="sm:hidden flex justify-center pb-1 -mt-1">
                <div className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
              </div>

              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create Locked PDF</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5 sm:mt-1">Name the page and choose its URL.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateMagnetName("");
                  }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="space-y-4">
                {/* Page Name Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">Page name</label>
                  <input
                    type="text"
                    autoFocus
                    value={createMagnetName}
                    onChange={(e) => {
                      setCreateMagnetName(e.target.value);
                      if (!isCustomSlugEdited) {
                        setCustomSlug(
                          e.target.value
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9\s-]/g, "")
                            .replace(/\s+/g, "-")
                        );
                      }
                    }}
                    placeholder="e.g. 2026 SaaS Growth Playbook"
                    className="w-full rounded-xl border border-[#0066B2]/40 bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:border-[#0066B2] focus:ring-1 focus:ring-[#0066B2] dark:border-[#0066B2]/60 dark:focus:border-[#0066B2] dark:focus:ring-[#0066B2] transition-all"
                  />
                </div>

                {/* URL Slug Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">URL slug</label>
                  <div className="flex items-center rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] px-3 py-2 text-xs text-zinc-500 dark:text-[#9B9085] focus-within:border-[#0066B2] focus-within:ring-1 focus-within:ring-[#0066B2] transition-all">
                    <span className="text-zinc-400 dark:text-[#666675] shrink-0 mr-1.5 font-mono">/</span>
                    <input
                      type="text"
                      value={isCustomSlugEdited ? customSlug : (customSlug || derivedSlug)}
                      onChange={(e) => {
                        setIsCustomSlugEdited(true);
                        setCustomSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                        );
                      }}
                      placeholder="locked-pdf"
                      className="w-full bg-transparent font-mono text-xs text-zinc-900 dark:text-white outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-[#666675]">The path of the page. Lowercase, digits, and hyphens only.</p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateMagnetName("");
                      setCustomSlug("");
                      setIsCustomSlugEdited(false);
                    }}
                    className="rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#222228] px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2c2c34] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateLockedPdf}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005799] transition-all cursor-pointer shadow-sm"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Create Locked PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Asset Picker Modal */}
      {showAssetPickerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overscroll-contain touch-none"
          onClick={() => setShowAssetPickerModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#18181B] p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3.5 border-zinc-100 dark:border-[#27272A]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  <HardDrive className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Choose from Hosted Assets
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Select any file uploaded on your Assets page to attach or load into your Locked PDF.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetPickerModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search hosted assets by name..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#121216] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#0066B2]"
              />
            </div>

            {/* Asset List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {hostedResources.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-zinc-400 italic">No hosted assets found in your Assets page.</p>
                  <Link
                    href="/dashboard/assets"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-4 py-2 text-xs font-bold text-white hover:bg-[#005291] transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Upload to Assets Page</span>
                  </Link>
                </div>
              ) : filteredHostedAssets.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 italic">
                  No assets match &quot;{assetSearchQuery}&quot;
                </div>
              ) : (
                filteredHostedAssets.map((asset: any) => {
                  const isPdf =
                    asset.name?.toLowerCase().endsWith(".pdf") ||
                    asset.url?.toLowerCase().includes(".pdf") ||
                    asset.fileUrl?.toLowerCase().includes(".pdf") ||
                    asset.fileExt?.toLowerCase() === ".pdf";
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#121216] hover:bg-zinc-100 dark:hover:bg-[#1C1C22] transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${isPdf ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-[#0066B2]/10 text-[#0066B2] border-[#0066B2]/20"}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{asset.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono truncate">{asset.fileUrl || asset.url}</p>
                        </div>
                      </div>

                      {isPdf ? (
                        <button
                          type="button"
                          onClick={() => {
                            const pdfUrl = asset.fileUrl || asset.url;
                            setSelectedHostedPdf({ url: pdfUrl, name: asset.name, timestamp: Date.now() });
                            setShowAssetPickerModal(false);
                            setActiveTab("locked");
                            addToast(`Selected "${asset.name}" from Assets! Loading into setup card...`);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-[#0066B2] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#005291] transition shrink-0 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Use as Locked PDF</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(asset.url);
                            setShowAssetPickerModal(false);
                            addToast(`Link copied for "${asset.name}"!`);
                          }}
                          className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0 cursor-pointer"
                        >
                          <span>Copy Link</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-3 border-zinc-100 dark:border-[#27272A]">
              <Link
                href="/dashboard/assets"
                className="text-xs text-[#0066B2] dark:text-[#38BDF8] font-bold hover:underline"
              >
                Go to Assets Page →
              </Link>
              <button
                type="button"
                onClick={() => setShowAssetPickerModal(false)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
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
                  Delete {checkedIds.length} locked PDF{checkedIds.length > 1 ? "s" : ""}?
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
                This will permanently delete the <span className="font-bold text-white">{checkedIds.length}</span> selected locked PDF{checkedIds.length > 1 ? "s" : ""} and stop serving them on their URLs. Any signups already collected will stay on your list.
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
                className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                Delete {checkedIds.length} locked PDF{checkedIds.length > 1 ? "s" : ""}
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
                    /pdf-viewer/{activePage.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/pdf-viewer/${activePage.id}`;
                      navigator.clipboard.writeText(fullUrl);
                      setCopiedId(activePage.id);
                      addToast("Copied viewer link!");
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
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
                  href={`/dashboard/leadmagnets/${activePage.id}?type=locked-pdf`}
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
                    href={`/pdf-viewer/${activePage.id}`}
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
                    setSelectedPageId(activePage.id);
                    setShowDeleteModal(true);
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
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900/95 dark:bg-[#1A1A1E]/95 border border-zinc-700/80 text-white px-4 sm:px-5 py-2.5 shadow-2xl backdrop-blur-md"
          >
            <span className="text-xs font-bold whitespace-nowrap">
              <span className="text-[#38BDF8] font-black">{checkedIds.length}</span> selected
            </span>
            <div className="h-4 w-px bg-zinc-700" />
            <button
              onClick={handleToggleSelectAll}
              className="text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              {filtered.length > 0 && filtered.every((p) => checkedIds.includes(p.id)) ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={() => setCheckedIds([])}
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
    </DashboardShell>
  );
}

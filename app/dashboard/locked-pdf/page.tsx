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
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  Sparkles,
  FileText,
  TrendingUp,
  HardDrive,
  Copy,
  ExternalLink,
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
  const [loading, setLoading] = useState(true);

  // Active Tab navigation state ("locked" | "email" | "sequence" | "after")
  const [activeTab, setActiveTab] = useState<"locked" | "email" | "sequence" | "after">("locked");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Toasts & Modal States
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMagnetName, setCreateMagnetName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isCustomSlugEdited, setIsCustomSlugEdited] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

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
    const anyOpen = showEmailPreviewModal || showSequencePreviewModal || showDeleteModal || showCreateModal || showAssetPickerModal;
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
  }, [showEmailPreviewModal, showSequencePreviewModal, showDeleteModal, showCreateModal, showAssetPickerModal]);

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
      const lockedPages = localPages.filter(
        (p) => p.template === "locked-pdf" || p.pdfFreePages !== undefined || (p.pdfPages && p.pdfPages.length > 0)
      );
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
          const lockedPages = data.pages.filter(
            (p) => p.template === "locked-pdf" || p.pdfFreePages !== undefined || (p.pdfPages && p.pdfPages.length > 0)
          );
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

  // Saved Locked PDFs for bottom cards grid
  const savedLockedPdfPages = useMemo(() => {
    return lockedPdfPages.filter((p) => (p.pdfPages && p.pdfPages.length > 0) || (p.pdfTitle && p.pdfTitle !== "Untitled Locked PDF") || p.status === "live");
  }, [lockedPdfPages]);

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

  const removeSequenceEmail = useCallback((id: string) => {
    const updated = sequenceEmails.filter((item) => item.id !== id);
    setSequenceEmails(updated);
    const nextEnabled = updated.length > 0 ? sequenceEnabled : false;
    if (updated.length === 0) {
      setSequenceEnabled(false);
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

  const handleGenerateAiTitle = async () => {
    setIsGeneratingTitle(true);
    try {
      const res = await fetch("/api/ai/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest_titles", magnetTitle: createMagnetName.trim() || "AI Pipeline Playbook" }),
      });
      const data = await res.json();
      if (data.suggestions?.length) {
        const randomTitle = data.suggestions[Math.floor(Math.random() * data.suggestions.length)];
        setCreateMagnetName(randomTitle);
        if (!isCustomSlugEdited) {
          setCustomSlug(
            randomTitle
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
          );
        }
      }
    } catch (e) {
      console.error("AI Title Generator Error:", e);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

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
      status: "draft",
      views: 0,
      signups: 0,
      conversionRate: 0,
      headline: name,
      subheadline: "Enter your email to verify and unlock full PDF access instantly.",
      cta: "Verify & Unlock PDF",
      deliverable: "Locked PDF Document",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      publishedAt: null,
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

  const handleDeleteActiveDocument = () => {
    if (!activePage) return;
    setIsDeleting(true);
    try {
      deletePage(activePage.id);
      const remaining = pages.filter((p) => p.id !== activePage.id);
      setPages(remaining);
      savePages(remaining);

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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Locked PDF
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Upload your document, set free preview pages, configure delivery emails and lead nurture sequences.
            </p>
          </div>

          {/* Production-grade Keystroke Auto-Save Status Badge & Create Action */}
          <div className="flex items-center gap-3 shrink-0">
            {saveStatus === "saving" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving changes...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All changes saved</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                const fresh = loadResources().filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
                setHostedResources(fresh);
                setShowAssetPickerModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#1E1E24] px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#27272A] transition shadow-xs cursor-pointer active:scale-95"
            >
              <HardDrive className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />
              <span>Choose Assets</span>
            </button>

            <button
              onClick={() => {
                setCreateMagnetName("");
                setCustomSlug("");
                setIsCustomSlugEdited(false);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005799] transition shadow-md shadow-[#0066B2]/20 cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[2.5px]" />
              <span>Create Locked PDF</span>
            </button>
          </div>
        </div>

        {/* Locked PDF Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Pages & Preview Limit */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-[#1F1F24] dark:bg-[#151518] p-4 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Pages & Preview</p>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                {activePdfStats.pagesCount} <span className="text-xs font-semibold text-zinc-400">({activePdfStats.freePages} Free Preview)</span>
              </p>
            </div>
          </div>

          {/* Preview Traffic */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-[#1F1F24] dark:bg-[#151518] p-4 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Preview Traffic</p>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                {activePdfStats.views.toLocaleString()}
              </p>
            </div>
          </div>

          {/* OTP Unlocks */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-[#1F1F24] dark:bg-[#151518] p-4 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">OTP Unlocks</p>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                {activePdfStats.signups.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Unlock Rate */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-[#1F1F24] dark:bg-[#151518] p-4 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Unlock Rate</p>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5">
                {activePdfStats.convRate}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Tabs Bar — Workflow Navigation (WAI-ARIA Compliant) */}
        <div
          role="tablist"
          aria-label="Locked PDF Workflow Navigation"
          className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-zinc-200/80 bg-zinc-100/80 dark:border-[#1F1F24] dark:bg-[#121215] p-2.5 sm:p-3 gap-2.5 sm:gap-4 w-full transition-colors duration-200"
          onMouseLeave={() => setHoveredTab(null)}
        >
          {[
            { id: "locked", label: "Locked PDF", desc: "Design the PDF", icon: Lock },
            { id: "email", label: "Delivery email", desc: "Send the resource", icon: Mail },
            { id: "sequence", label: "Sequence", desc: "Nurture leads", icon: Clock },
            { id: "after", label: "After signup", desc: "Choose the next step", icon: Home },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 600, damping: 28 }}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onClick={() => setActiveTab(tab.id as any)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`relative flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-colors w-full cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2] focus-visible:ring-offset-2 ${isActive
                    ? "border-zinc-200/80 dark:border-[#27272A] text-zinc-900 dark:text-white shadow-sm"
                    : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
              >
                {/* Active Tab Solid Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeLockedPdfTabPill"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-white dark:bg-[#1E1E24] shadow-sm border border-zinc-200/60 dark:border-[#27272A]"
                  />
                )}
                {/* Hover Morphing Pill */}
                {!isActive && isHovered && (
                  <motion.div
                    layoutId="hoverLockedPdfTabPill"
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-zinc-200/70 dark:bg-[#18181C]"
                  />
                )}
                <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isActive
                    ? "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]"
                    : "bg-zinc-200/60 text-zinc-600 dark:bg-[#27272A] dark:text-zinc-400"
                  }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="relative z-10 text-left leading-tight">
                  <span className="block text-xs font-bold text-zinc-900 dark:text-white">{tab.label}</span>
                  <span className="block text-[10px] font-normal text-zinc-500 dark:text-zinc-400">{tab.desc}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content Body (WAI-ARIA Tabpanel) */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Loader2 className="h-6 w-6 animate-spin text-[#0066B2]" />
          </div>
        ) : activePage ? (
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            className="space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-[#0066B2]/40 rounded-2xl"
          >
            {/* TAB 1: LOCKED PDF SETUP */}
            {activeTab === "locked" && (
              <>
                <LockedPdfSetup
                  key={activePage.id}
                  magnetId={activePage.id}
                  userEmail={account?.email || ""}
                  pdfPages={activePage.pdfPages || []}
                  pdfFreePages={activePage.pdfFreePages !== undefined ? activePage.pdfFreePages : 2}
                  pdfTitle={activePage.pdfTitle || activePage.name}
                  pageName={activePage.name}
                  pageSlug={activePage.slug}
                  appUrl={appUrl}
                  hostedResources={hostedResources}
                  onOpenAssetPicker={() => {
                    const fresh = loadResources().filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
                    setHostedResources(fresh);
                    setShowAssetPickerModal(true);
                  }}
                  selectedHostedPdf={selectedHostedPdf}
                  onSave={async (updates) => {
                    const updatedPages = pages.map((p) => {
                      if (p.id === activePage.id) {
                        return {
                          ...p,
                          name: updates.name?.trim() || updates.pdfTitle.trim() || p.name,
                          slug: updates.slug?.trim() || p.slug,
                          pdfPages: updates.pdfPages,
                          pdfFreePages: updates.pdfFreePages,
                          pdfTitle: updates.pdfTitle.trim() || updates.name?.trim() || p.name,
                          pdfPageCount: updates.pdfPageCount,
                          template: "locked-pdf" as const,
                          updatedAt: new Date().toISOString().split("T")[0],
                        };
                      }
                      return p;
                    });

                    setPages(updatedPages);
                    savePages(updatedPages);
                    addToast("Locked PDF settings saved!");
                  }}
                />

                {/* ══════════════════════════════════════════════
                    SAVED LOCKED PDF CARDS LIBRARY (LOCKED TAB ONLY)
                ══════════════════════════════════════════════ */}
                <div className="mt-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] border border-[#0066B2]/20 shadow-xs">
                        <Lock className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Saved Locked PDFs
                          </h2>
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] border border-[#0066B2]/20">
                            {savedLockedPdfPages.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                          Click any card to edit its settings. Use Share Link to copy its public OTP viewer URL.
                        </p>
                      </div>
                    </div>
                  </div>

                  {savedLockedPdfPages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {savedLockedPdfPages.map((pdf) => {
                        const isSelected = activePage?.id === pdf.id;
                        const shareUrl = typeof window !== "undefined"
                          ? `${window.location.origin}/pdf-viewer/${pdf.id}`
                          : `/pdf-viewer/${pdf.id}`;

                        return (
                          <div
                            key={pdf.id}
                            onClick={() => setSelectedPageId(pdf.id)}
                            className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                              isSelected
                                ? "border-[#0066B2] dark:border-[#38BDF8]/80 bg-gradient-to-b from-[#0066B2]/[0.08] via-[#0066B2]/[0.02] to-transparent ring-1 ring-[#0066B2]/30 dark:ring-[#38BDF8]/30 shadow-[0_0_20px_rgba(0,102,178,0.15)]"
                                : "border-zinc-200/80 dark:border-[#1F1F24] bg-white dark:bg-[#151518] hover:border-zinc-300 dark:hover:border-[#27272A] shadow-xs hover:shadow-xl hover:-translate-y-0.5"
                            }`}
                          >
                            {/* Active Selection Badge */}
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 z-30 inline-flex items-center gap-1 bg-[#0066B2] text-white dark:bg-[#38BDF8] dark:text-zinc-950 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md">
                                <Sparkles className="h-2.5 w-2.5 fill-current" />
                                <span>Active Editor</span>
                              </div>
                            )}

                            {/* PDF Canvas Preview Box */}
                            <div className="relative pt-4 px-4 pb-3 bg-gradient-to-b from-zinc-100 to-zinc-200/60 dark:from-[#18181D] dark:to-[#0F0F12] border-b border-zinc-200/70 dark:border-[#1F1F24] overflow-hidden flex flex-col items-center justify-center min-h-[175px]">
                              {/* Stacked Paper Pages Background (depth effect) */}
                              <div className="absolute inset-x-8 top-3 h-[140px] bg-zinc-200/80 dark:bg-zinc-800/60 rounded-t-lg transform scale-95 border border-zinc-300/50 dark:border-zinc-700/50 shadow-xs" />
                              <div className="absolute inset-x-6 top-3.5 h-[142px] bg-zinc-100 dark:bg-zinc-800/90 rounded-t-lg transform scale-[0.98] border border-zinc-300/60 dark:border-zinc-700/60 shadow-xs" />

                              {/* Main PDF Paper Document Sheet */}
                              <div className="relative w-full max-w-[150px] aspect-[1/1.25] bg-white dark:bg-[#1A1A20] rounded-t-lg rounded-b-sm border border-zinc-300/80 dark:border-zinc-700/80 shadow-[0_8px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] transition-transform duration-300 overflow-hidden flex flex-col">
                                {/* PDF Cover Image or Skeleton */}
                                {pdf.pdfPages && pdf.pdfPages.length > 0 ? (
                                  <div className="relative flex-1 w-full h-full bg-white dark:bg-[#1A1A20]">
                                    <Image
                                      src={pdf.pdfPages[0]}
                                      alt={pdf.name}
                                      fill
                                      sizes="150px"
                                      unoptimized
                                      className="object-cover object-top"
                                    />
                                  </div>
                                ) : (
                                  <div className="p-3 flex-1 flex flex-col justify-between bg-zinc-50/90 dark:bg-[#141418]/90">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1">
                                        <div className="w-3.5 h-3.5 rounded bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] flex items-center justify-center">
                                          <FileText className="h-2.5 w-2.5" />
                                        </div>
                                        <span className="text-[7.5px] font-black uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8] font-mono">
                                          PDF
                                        </span>
                                      </div>
                                      <Lock className="h-2.5 w-2.5 text-[#0066B2] dark:text-[#38BDF8]" />
                                    </div>

                                    <div className="space-y-1.5 my-auto">
                                      <div className="h-1.5 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                                      <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                      <div className="h-1 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                      <div className="h-1 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                                    </div>

                                    <div className="text-[8px] font-mono font-bold text-zinc-400 dark:text-zinc-500 text-center pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                      {pdf.pdfPageCount || 1} {pdf.pdfPageCount === 1 ? "Page" : "Pages"}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Page Count Tag */}
                              <div className="absolute bottom-2 right-2.5 z-20">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-zinc-900/80 text-zinc-300 border border-zinc-700/60 backdrop-blur-md shadow-xs">
                                  <FileText className="h-2.5 w-2.5 text-zinc-400" />
                                  {pdf.pdfPageCount || (pdf.pdfPages ? pdf.pdfPages.length : 1)}P
                                </span>
                              </div>
                            </div>

                            {/* PDF Info & Actions Footer */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] border border-[#0066B2]/20">
                                    <Lock className="h-3 w-3" />
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
                                  className="group/code flex items-center justify-between gap-1.5 mt-2.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#101013] border border-zinc-200/80 dark:border-[#27272A] hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/40 transition-all cursor-pointer"
                                  title="Click to copy Viewer URL"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[9px] font-bold text-[#0066B2] dark:text-[#38BDF8] uppercase font-mono tracking-wider">URL</span>
                                    <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
                                      /pdf-viewer/{pdf.id}
                                    </span>
                                  </div>
                                  <Copy className="h-3 w-3 text-zinc-400 group-hover/code:text-[#0066B2] dark:group-hover/code:text-[#38BDF8] shrink-0 transition-colors" />
                                </div>
                              </div>

                              {/* Bottom Action Row */}
                              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-1.5">
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
                                    if (confirm(`Delete "${pdf.name}"?`)) {
                                      const updated = pages.filter((p) => p.id !== pdf.id);
                                      triggerImmediateSave(updated);
                                      deletePage(pdf.id);
                                      addToast(`Deleted "${pdf.name}"`, "info");
                                    }
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
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] mb-3 border border-[#0066B2]/20">
                        <Lock className="h-5 w-5" />
                      </div>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">No Locked PDFs Saved</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
                        Upload a PDF document in the editor above and click &quot;Save PDF settings&quot; to create your first locked PDF lead magnet card.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: DELIVERY EMAIL */}
            {activeTab === "email" && (
              <DeliveryEmailTab
                account={account}
                setShowEmailPreviewModal={setShowEmailPreviewModal}
                emailSubject={emailSubject}
                setEmailSubject={handleUpdateEmailSubject}
                emailPreviewText={emailPreviewText}
                setEmailPreviewText={handleUpdateEmailPreviewText}
                showInsertResourceMenu={showInsertResourceMenu}
                setShowInsertResourceMenu={setShowInsertResourceMenu}
                hostedResources={hostedResources}
                emailBody={emailBody}
                setEmailBody={handleUpdateEmailBody}
                enableAiPersonalizedDeliverable={enableAiPersonalizedDeliverable}
                setEnableAiPersonalizedDeliverable={handleUpdateEnableAi}
                customPromptQuestion={customPromptQuestion}
                setCustomPromptQuestion={handleUpdateCustomPromptQuestion}
                customPromptPlaceholder={customPromptPlaceholder}
                setCustomPromptPlaceholder={handleUpdateCustomPromptPlaceholder}
              />
            )}

            {/* TAB 3: SEQUENCE */}
            {activeTab === "sequence" && (
              <SequenceTab
                account={account}
                sequenceEnabled={sequenceEnabled}
                setSequenceEnabled={handleToggleSequenceEnabled}
                stopOnCall={stopOnCall}
                setStopOnCall={setStopOnCall}
                sequenceEmails={sequenceEmails}
                setSequenceEmails={handleUpdateSequenceEmails}
                selectedSequenceIndex={selectedSequenceIndex}
                setSelectedSequenceIndex={setSelectedSequenceIndex}
                addSequenceEmail={addSequenceEmail}
                removeSequenceEmail={removeSequenceEmail}
                setShowSequencePreviewModal={setShowSequencePreviewModal}
                setPreviewSequenceIndex={setPreviewSequenceIndex}
              />
            )}

            {/* TAB 4: AFTER SIGNUP */}
            {activeTab === "after" && (
              <AfterSignupTab
                account={account}
                afterSignupOption={afterSignupOption}
                setAfterSignupOption={handleUpdateAfterSignupOption}
                destinationUrl={destinationUrl}
                setDestinationUrl={handleUpdateDestinationUrl}
                customHeading={customHeading}
                setCustomHeading={handleUpdateCustomHeading}
                customMessage={customMessage}
                setCustomMessage={handleUpdateCustomMessage}
                videoUrl={videoUrl}
                setVideoUrl={handleUpdateVideoUrl}
                buttonLabel={buttonLabel}
                setButtonLabel={handleUpdateButtonLabel}
                buttonUrl={buttonUrl}
                setButtonUrl={handleUpdateButtonUrl}
                quizFunnelEnabled={quizFunnelEnabled}
                setQuizFunnelEnabled={handleUpdateQuizFunnelEnabled}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
              <FileLock className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
              No Locked PDF Setup yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
              Create a Locked PDF document to upload your PDF file, set free preview pages, and collect email verification signups.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 flex items-center gap-2 rounded-xl bg-[#0066B2] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#005291] transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Locked PDF</span>
            </button>
          </div>
        )}

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-200"
            onClick={() => {
              setShowCreateModal(false);
              setCreateMagnetName("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-[460px] rounded-2xl border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#18181c] p-6 text-zinc-900 dark:text-white shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Create Locked PDF</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">Name the page and choose its URL.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateMagnetName("");
                  }}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#25252b] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="space-y-4">
                {/* Page Name Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-[#d4c8bc]">Page name</label>
                    <button
                      type="button"
                      disabled={isGeneratingTitle}
                      onClick={handleGenerateAiTitle}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingTitle ? (
                        <Loader2 className="h-3 w-3 animate-spin text-[#0066B2] dark:text-[#38BDF8]" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-[#0066B2] dark:text-[#38BDF8]" />
                      )}
                      <span>AI Title Generator</span>
                    </button>
                  </div>
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
    </DashboardShell>
  );
}

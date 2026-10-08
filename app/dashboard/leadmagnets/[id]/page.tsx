"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  FileText,
  Gift,
  Image as ImageIcon,
  Loader2,
  Palette,
  Rocket,
  Type,
  Mail,
  Clock,
  Home,
  Lock,
  Undo2,
  Redo2,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  QrCode,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
  HelpCircle,
  Monitor,
  Smartphone,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  Sparkles,
  Strikethrough,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Video,
  Table as TableIcon,
  Link2,
  Minus,
  MoreVertical,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { type MagnetPage, type Account } from "@/lib/data";
import { loadPages, savePages, deletePage, loadAccount, loadResources, syncWithDatabase } from "@/lib/store";
import { getMagnetSortTimestamp } from "@/lib/utils";
import dynamic from "next/dynamic";

import AIMagnetModal from "@/components/leadmagnets/ai-magnet-modal";
import SocialCardModal from "@/components/leadmagnets/social-card-modal";
import DeleteModal from "@/components/leadmagnets/edit/DeleteModal";
import SequencePreviewModal from "@/components/leadmagnets/edit/SequencePreviewModal";
import EmailPreviewModal from "@/components/leadmagnets/edit/EmailPreviewModal";
import LandingPageTab from "@/components/leadmagnets/edit/LandingPageTab";
import DeliveryEmailTab from "@/components/leadmagnets/edit/DeliveryEmailTab";
import SequenceTab from "@/components/leadmagnets/edit/SequenceTab";
import AfterSignupTab from "@/components/leadmagnets/edit/AfterSignupTab";
import { ImageGeneration } from "@/components/agents/image-generation";

function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function EditLeadMagnetPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState<Account | null>(() => {
    if (typeof window !== "undefined") return loadAccount();
    return null;
  });
  const [allPages, setAllPages] = useState<MagnetPage[]>(() => {
    if (typeof window !== "undefined") return loadPages();
    return [];
  });
  const [page, setPage] = useState<MagnetPage | undefined>(() => {
    if (typeof window !== "undefined") return loadPages().find((p) => p.id === params.id);
    return undefined;
  });
  const pageRef = useRef<MagnetPage | undefined>(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Single Init Effect — ONE syncWithDatabase() call fans out all data
  // Eliminates the previous 3 separate calls that fired simultaneously on mount
  useEffect(() => {
    // ── Step 1: Load from localStorage instantly (zero latency, offline-first) ──
    const localAcc = loadAccount();
    if (localAcc) setAccount(localAcc);

    const localPages = loadPages();
    if (localPages && localPages.length > 0) {
      setAllPages(localPages);
    }

    const localP = localPages.find((p) => p.id === params.id);
    if (localP) {
      setPage(localP);
      pageRef.current = localP;
      if (localP.pdfPages && Array.isArray(localP.pdfPages)) {
        setLockedPdfPages(localP.pdfPages);
      }
      if (localP.pdfFreePages !== undefined) {
        setLockedPdfFreePages(localP.pdfFreePages);
      }
      if (localP.pdfTitle) {
        setLockedPdfTitle(localP.pdfTitle);
      }
      if (searchParams.get("type") === "locked-pdf" || localP.template === "locked-pdf") {
        setTemplateId("locked-pdf");
      } else {
        const pTpl = (localP.template as string);
        if (pTpl && pTpl !== "classic" && pTpl !== "locked-pdf") {
          setTemplateId(pTpl);
        } else if (localAcc?.templateId && localAcc.templateId !== "locked-pdf") {
          setTemplateId(localAcc.templateId);
        } else {
          setTemplateId("template1");
        }
      }
      if (localP.customFormFields && localP.customFormFields.length > 0) {
        setCustomFormFields(localP.customFormFields);
      }
    } else if (localAcc?.templateId && localAcc.templateId !== "locked-pdf") {
      setTemplateId(localAcc.templateId);
    }

    // Load resources from localStorage instantly
    const localResources = loadResources();
    if (localResources && localResources.length > 0) {
      setHostedResources(localResources);
    }

    // ── Step 2: ONE database call — fan out all results ──
    syncWithDatabase().then((data) => {
      if (!data) return;

      // Fan out: account
      if (data.account) setAccount(data.account);

      // Fan out: resources
      if (data.resources && data.resources.length > 0) {
        setHostedResources(data.resources);
      }

      // Fan out: page data + templateId + form fields
      if (data.pages && Array.isArray(data.pages)) {
        setAllPages(data.pages);
        const found = data.pages.find((p: any) => p.id === params.id);
        if (found) {
          setPage((prev) => {
            if (!prev) {
              pageRef.current = found;
              return found;
            }
            // Retain locally modified fields (especially status / publishedAt) over older server fetch
            const merged = { ...found, ...prev };
            pageRef.current = merged;
            return merged;
          });

          if (found.pdfPages && Array.isArray(found.pdfPages)) {
            setLockedPdfPages(found.pdfPages);
          }
          if (found.pdfFreePages !== undefined) {
            setLockedPdfFreePages(found.pdfFreePages);
          }
          if (found.pdfTitle) {
            setLockedPdfTitle(found.pdfTitle);
          }
          if (found.pdfUrl) {
            setLockedPdfUrl(found.pdfUrl);
          }
          if (found.pdfPageCount !== undefined) {
            setLockedPdfPageCount(found.pdfPageCount);
          }

          // Template resolution: page template → account template → fallback
          if (searchParams.get("type") === "locked-pdf" || found.template === "locked-pdf") {
            setTemplateId("locked-pdf");
          } else {
            const upTpl = (found.template as string);
            if (upTpl && upTpl !== "classic" && upTpl !== "locked-pdf") {
              setTemplateId(upTpl);
            } else if (data.account?.templateId && data.account.templateId !== "locked-pdf") {
              setTemplateId(data.account.templateId);
            }
          }

          // Populate form fields once from DB (guarded by hasPopulatedForm ref)
          if (!hasPopulatedForm.current) {
            hasPopulatedForm.current = true;
            const cleanHeadline = found.headline && found.headline !== "hi" && found.headline !== "Your headline goes here" ? found.headline : "";
            const cleanSubheadline = found.subheadline && found.subheadline !== "Enter your email to get instant access." && found.subheadline !== "Tell visitors what they get and why it is worth their email." ? found.subheadline : "";
            setHeadline(cleanHeadline);
            setSubheadline(cleanSubheadline);
            if (found.pitch) setPitch(found.pitch);
            if (found.bullets !== undefined && Array.isArray(found.bullets)) setBullets(found.bullets);
            if (found.mastheadLeft !== undefined) setMastheadLeft(found.mastheadLeft);
            if (found.mastheadRight !== undefined) setMastheadRight(found.mastheadRight);
            if (found.imageUrl !== undefined) setImageUrl(found.imageUrl);
            if (found.emailSubject) setEmailSubject(found.emailSubject);
            if (found.emailPreviewText) setEmailPreviewText(found.emailPreviewText);
            if (found.emailBody) setEmailBody(found.emailBody);
            if (found.sequenceEnabled !== undefined) setSequenceEnabled(found.sequenceEnabled);
            if (found.stopOnCall !== undefined) setStopOnCall(found.stopOnCall);
            if (found.sequenceEmails) setSequenceEmails(found.sequenceEmails);
            if (found.customFormFields) setCustomFormFields(found.customFormFields);
            if (found.afterSignupOption) setAfterSignupOption(found.afterSignupOption);
            if (found.destinationUrl) setDestinationUrl(found.destinationUrl);
            if (found.customHeading) setCustomHeading(found.customHeading);
            if (found.customMessage) setCustomMessage(found.customMessage);
            if (found.videoUrl) setVideoUrl(found.videoUrl);
            if (found.buttonLabel) setButtonLabel(found.buttonLabel);
            if (found.buttonUrl) setButtonUrl(found.buttonUrl);
            if (found.quizFunnelEnabled !== undefined) setQuizFunnelEnabled(found.quizFunnelEnabled);
            if (found.customPromptQuestion) setCustomPromptQuestion(found.customPromptQuestion);
            if (found.customPromptPlaceholder) setCustomPromptPlaceholder(found.customPromptPlaceholder);
            if (found.enableAiPersonalizedDeliverable !== undefined) setEnableAiPersonalizedDeliverable(found.enableAiPersonalizedDeliverable);
          }
        } else if (data.account?.templateId) {
          setTemplateId(data.account.templateId);
        }
      }
    });

    const handleAccountSync = () => {
      const refreshedAcc = loadAccount();
      if (refreshedAcc) setAccount(refreshedAcc);
    };

    window.addEventListener("accountUpdated", handleAccountSync);
    window.addEventListener("storage", handleAccountSync);
    window.addEventListener("focus", handleAccountSync);

    return () => {
      window.removeEventListener("accountUpdated", handleAccountSync);
      window.removeEventListener("storage", handleAccountSync);
      window.removeEventListener("focus", handleAccountSync);
    };
  }, [params.id]);

  // Modal & Menu States
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGeneratingAICover, setIsGeneratingAICover] = useState(false);
  const [imageGenerationStatus, setImageGenerationStatus] = useState<import("@/components/agents/image-generation").ImageGenerationStatus>("complete");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);

  function generateFluxAIImageUrl(topic: string): string {
    const cleanKeywords = (topic || "Digital Strategy")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 6)
      .join(" ");

    const prompt = encodeURIComponent(`modern 3d graphic cover illustration for ${cleanKeywords || "business growth"}, studio lighting, 4k render`);
    const seed = Math.floor(Math.random() * 1000000);

    return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=576&nologo=true&seed=${seed}`;
  }

  const handleGenerateAICoverImage = () => {
    setIsGeneratingAICover(true);
    setImageGenerationStatus("generating");
    try {
      const promptText = headline?.trim() || page?.name || "Digital Strategy Guide";
      const newCoverUrl = generateFluxAIImageUrl(promptText);

      // Instantly set image URL in DOM so <img> tag mounts and starts loading
      setImageUrl(newCoverUrl);
      update({ imageUrl: newCoverUrl });

      // Transition to 'refining' state after 2.5s while loading
      setTimeout(() => {
        setImageGenerationStatus((prev) => (prev === "generating" ? "refining" : prev));
      }, 2500);

      // Safety timeout fallback if network fails
      setTimeout(() => {
        setImageGenerationStatus("complete");
        setIsGeneratingAICover(false);
      }, 15000);
    } catch (err) {
      console.error("Failed to generate AI Cover image:", err);
      setImageGenerationStatus("complete");
      setIsGeneratingAICover(false);
    }
  };
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [hostedResources, setHostedResources] = useState<any[]>([]);
  const [showInsertResourceMenu, setShowInsertResourceMenu] = useState(false);

  // Lock background scroll containers when Subscriber Email Preview Modal is open
  useEffect(() => {
    if (!showEmailPreviewModal) return;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showEmailPreviewModal]);

  // Resources + emailBody loading merged into the Single Init Effect above ↑

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Tab Navigation State (supports direct tab query like ?tab=sequence)
  const [activeTab, setActiveTab] = useState<"landing" | "email" | "sequence" | "after">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("tab");
      if (q === "landing" || q === "email" || q === "sequence" || q === "after") {
        return q;
      }
    }
    return "landing";
  });
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Sync activeTab whenever the URL query parameter ?tab= changes
  useEffect(() => {
    const q = searchParams.get("tab");
    if (q === "landing" || q === "email" || q === "sequence" || q === "after") {
      setActiveTab(q);
    }
  }, [searchParams]);

  // Page Content Initial Values
  const initialHeadline = page ? (page.headline && page.headline !== "hi" && page.headline !== "Your headline goes here" ? page.headline : "") : "";
  const initialSubheadline = page ? (page.subheadline && page.subheadline !== "Enter your email to get instant access." && page.subheadline !== "Tell visitors what they get and why it is worth their email." ? page.subheadline : "") : "";
  const initialPitch = page?.pitch || "";
  const initialBullets = Array.isArray(page?.bullets) ? page.bullets : [];
  const initialImage = page?.imageUrl !== undefined ? page.imageUrl : null;
  const initialEmailSubject = page?.emailSubject || "Here is your requested resource";
  const initialEmailPreviewText = page?.emailPreviewText || "Click below to access your free download.";
  const initialEmailBody = page?.emailBody || "Hey {name},\n\nThank you for requesting this resource! Click the link below to get instant access.\n\nEnjoy!";

  // Page Content State (Tab 1: Landing)
  const [templateId, setTemplateId] = useState<string>(() => {
    if (searchParams.get("type") === "locked-pdf" || searchParams.get("template") === "locked-pdf" || page?.template === "locked-pdf") {
      return "locked-pdf";
    }
    if (page?.template && page.template !== "classic" && page.template !== "locked-pdf") {
      return page.template;
    }
    return (account?.templateId && account.templateId !== "locked-pdf") ? account.templateId : "template1";
  });
  const [headline, setHeadline] = useState(initialHeadline);
  const [subheadline, setSubheadline] = useState(initialSubheadline);
  const [pitch, setPitch] = useState(initialPitch);
  const [bullets, setBullets] = useState<string[]>(initialBullets);
  const [bulletsTitle, setBulletsTitle] = useState(page?.bulletsTitle && page.bulletsTitle !== "What they will learn" && page.bulletsTitle !== "Free Resource · Instant Access" ? page.bulletsTitle : "");
  const [mastheadLeft, setMastheadLeft] = useState(page?.mastheadLeft || "");
  const [mastheadRight, setMastheadRight] = useState(page?.mastheadRight || "");
  const [formTitle, setFormTitle] = useState(page?.formTitle && page.formTitle !== "Download for free" && page.formTitle !== "Claim Your Copy" ? page.formTitle : "");
  const [formSubtitle, setFormSubtitle] = useState(page?.formSubtitle && page.formSubtitle !== "Pop your email in and we'll send it straight over." ? page.formSubtitle : "");
  const [formButtonText, setFormButtonText] = useState(page?.formButtonText || page?.cta || "Send it to me");
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);

  // Reset image loaded status when imageUrl changes to ensure loading animation runs during fetch
  useEffect(() => {
    if (!imageUrl) {
      setIsImageLoaded(true);
    } else {
      setIsImageLoaded(false);
    }
  }, [imageUrl]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newBulletText, setNewBulletText] = useState("");
  const [showAddBullet, setShowAddBullet] = useState(false);

  // Delivery Email State (Tab 2: Delivery Email)
  const [emailSubject, setEmailSubject] = useState(initialEmailSubject);
  const [emailPreviewText, setEmailPreviewText] = useState(initialEmailPreviewText);
  const [emailBody, setEmailBody] = useState(initialEmailBody);

  // Sequence State (Tab 3: Sequence)
  const [sequenceEnabled, setSequenceEnabled] = useState(page?.sequenceEnabled || false);
  const [stopOnCall, setStopOnCall] = useState(page?.stopOnCall !== undefined ? page.stopOnCall : true);
  const [sequenceEmails, setSequenceEmails] = useState<{ id: string; subject: string; delayDays: number; delayUnit?: "hours" | "minutes" | "days"; previewText?: string; body: string }[]>(page?.sequenceEmails || []);
  const [selectedSequenceIndex, setSelectedSequenceIndex] = useState<number>(0);
  const [showSequencePreviewModal, setShowSequencePreviewModal] = useState(false);
  const [previewSequenceIndex, setPreviewSequenceIndex] = useState<number>(0);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<"desktop" | "mobile">("desktop");

  // Feature 2: Smart Auto-Personalized Deliverable State
  const [customPromptQuestion, setCustomPromptQuestion] = useState(page?.customPromptQuestion || "What is your main goal or bottleneck?");
  const [customPromptPlaceholder, setCustomPromptPlaceholder] = useState(page?.customPromptPlaceholder || "e.g. Scaling outreach, Lead generation");
  const [enableAiPersonalizedDeliverable, setEnableAiPersonalizedDeliverable] = useState(page?.enableAiPersonalizedDeliverable || false);

  // Dynamic Custom Form Fields Builder State
  const [customFormFields, setCustomFormFields] = useState<import("@/lib/data").CustomFormField[]>(page?.customFormFields || []);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Locked PDF local state — only used when templateId === "locked-pdf"
  const [lockedPdfPages, setLockedPdfPages] = useState<string[]>(page?.pdfPages || []);
  const [lockedPdfFreePages, setLockedPdfFreePages] = useState<number>(page?.pdfFreePages ?? 2);
  const [lockedPdfTitle, setLockedPdfTitle] = useState<string>(page?.pdfTitle || "");
  const [lockedPdfUrl, setLockedPdfUrl] = useState<string>(page?.pdfUrl || "");
  const [lockedPdfPageCount, setLockedPdfPageCount] = useState<number>(page?.pdfPageCount || 0);

  // After Signup State (Tab 4: After Signup)
  const [afterSignupOption, setAfterSignupOption] = useState<"standard" | "elsewhere" | "custom">(page?.afterSignupOption || "standard");
  const [destinationUrl, setDestinationUrl] = useState(page?.destinationUrl || "");
  const [customHeading, setCustomHeading] = useState(page?.customHeading || "");
  const [customMessage, setCustomMessage] = useState(page?.customMessage || "");
  const [videoUrl, setVideoUrl] = useState(page?.videoUrl || "");
  const [buttonLabel, setButtonLabel] = useState(page?.buttonLabel || "");
  const [buttonUrl, setButtonUrl] = useState(page?.buttonUrl || "");
  const [quizFunnelEnabled, setQuizFunnelEnabled] = useState(page?.quizFunnelEnabled || false);
  const [quizQuestions, setQuizQuestions] = useState<import("@/lib/data").QuizQuestion[]>(page?.quizQuestions || []);

  // Comprehensive Undo/Redo History State across All 4 Tabs
  const [history, setHistory] = useState<{
    headline: string;
    subheadline: string;
    pitch: string;
    bullets: string[];
    imageUrl: string | null;
    emailSubject: string;
    emailPreviewText: string;
    emailBody: string;
    sequenceEnabled: boolean;
    stopOnCall: boolean;
    sequenceEmails: { id: string; subject: string; delayDays: number; body: string }[];
    afterSignupOption: "standard" | "elsewhere" | "custom";
    destinationUrl: string;
    customHeading: string;
    customMessage: string;
    videoUrl: string;
    buttonLabel: string;
    buttonUrl: string;
    quizFunnelEnabled: boolean;
    quizQuestions: import("@/lib/data").QuizQuestion[];
    bulletsTitle: string;
    mastheadLeft: string;
    mastheadRight: string;
    formTitle: string;
    formSubtitle: string;
    formButtonText: string;
  }[]>(() => [
    {
      headline: initialHeadline,
      subheadline: initialSubheadline,
      pitch: initialPitch,
      bullets: initialBullets,
      imageUrl: initialImage,
      emailSubject: initialEmailSubject,
      emailPreviewText: initialEmailPreviewText,
      emailBody: initialEmailBody,
      sequenceEnabled: page?.sequenceEnabled || false,
      stopOnCall: page?.stopOnCall !== undefined ? page.stopOnCall : true,
      sequenceEmails: page?.sequenceEmails || [],
      afterSignupOption: page?.afterSignupOption || "standard",
      destinationUrl: page?.destinationUrl || "",
      customHeading: page?.customHeading || "",
      customMessage: page?.customMessage || "",
      videoUrl: page?.videoUrl || "",
      buttonLabel: page?.buttonLabel || "",
      buttonUrl: page?.buttonUrl || "",
      quizFunnelEnabled: page?.quizFunnelEnabled || false,
      quizQuestions: page?.quizQuestions || [],
      bulletsTitle: page?.bulletsTitle && page.bulletsTitle !== "What they will learn" ? page.bulletsTitle : "",
      mastheadLeft: page?.mastheadLeft || "",
      mastheadRight: page?.mastheadRight || "",
      formTitle: page?.formTitle || "Download for free",
      formSubtitle: page?.formSubtitle || "Pop your email in and we'll send it straight over.",
      formButtonText: page?.formButtonText || page?.cta || "Send it to me",
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoRef = useRef(false);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autosave Status State
  const [saveStatus, setSaveStatus] = useState<"autosaved" | "saving">("autosaved");
  const isInitialMount = useRef(true);

  // Live Auto-Sync for Views & Signups without needing page refresh
  useEffect(() => {
    if (!page?.id && !page?.slug) return;
    const userEmail = page?.userEmail || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);

    // --- Backoff state (local closure vars — no React state needed) ---
    // Strategy 3 + 4: Visibility-Aware Polling + Exponential Backoff
    const MIN_INTERVAL = 30_000;  // 30s baseline (same as Notion / Google Analytics)
    const MAX_INTERVAL = 90_000;  // 90s cap (same as Gmail idle behaviour)
    let currentInterval = MIN_INTERVAL;
    let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
    // Track last known stats fingerprint for change detection
    const lastStatsRef = { current: "" };

    const syncStats = async () => {
      try {
        if (!userEmail) return;
        const res = await fetch(`/api/data?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.pages && Array.isArray(data.pages)) {
          const fresh = data.pages.find((p: any) => p.id === page.id || p.slug === page.slug);
          if (fresh) {
            // Strategy 4: if stats actually changed, reset backoff to baseline
            const statsKey = `${fresh.views}|${fresh.signups}|${fresh.variantAViews}|${fresh.variantBViews}`;
            if (statsKey !== lastStatsRef.current) {
              lastStatsRef.current = statsKey;
              currentInterval = MIN_INTERVAL; // activity detected — reset backoff
            }
            setPage((prev) => {
              if (!prev) return fresh;
              return {
                ...prev,
                views: fresh.views || 0,
                signups: fresh.signups || 0,
                conversionRate: fresh.conversionRate || 0,
                variantAViews: fresh.variantAViews || 0,
                variantBViews: fresh.variantBViews || 0,
                variantASignups: fresh.variantASignups || 0,
                variantBSignups: fresh.variantBSignups || 0,
              };
            });
          }
        }
      } catch (_) { }
    };

    // Recursive timeout scheduler — allows interval to change dynamically
    const schedulePoll = () => {
      if (scheduledTimer) clearTimeout(scheduledTimer);
      scheduledTimer = setTimeout(async () => {
        // Strategy 3: only poll when the user is actually looking at the tab
        if (document.visibilityState === "visible") {
          await syncStats();
        }
        // Strategy 4: double the interval up to the cap after each poll
        currentInterval = Math.min(currentInterval * 2, MAX_INTERVAL);
        schedulePoll();
      }, currentInterval);
    };

    // Fast initial sync then start the scheduler
    syncStats();
    schedulePoll();

    // 1. BroadcastChannel — instant cross-tab sync when a visitor views/submits
    // A/B testing stats update instantly via this — unaffected by polling interval
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("leadmagnets_live_sync");
      bc.onmessage = (e) => {
        if (e.data && e.data.type === "STATS_UPDATED") {
          currentInterval = MIN_INTERVAL; // real event — reset backoff
          syncStats();
        }
      };
    }

    // 2. Window focus — sync immediately when user switches back to this tab
    const handleFocus = () => {
      currentInterval = MIN_INTERVAL; // reset backoff on user return
      syncStats();
    };
    window.addEventListener("focus", handleFocus);

    // 3. Visibility change — pause polling when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab is visible again — sync immediately and restart scheduler
        currentInterval = MIN_INTERVAL;
        syncStats();
        schedulePoll();
      } else {
        // Tab hidden — stop all scheduled polls (zero server requests)
        if (scheduledTimer) clearTimeout(scheduledTimer);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (scheduledTimer) clearTimeout(scheduledTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (bc) bc.close();
    };
  }, [page?.id, page?.slug, page?.userEmail]);

  // Media & Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const subheadlineRef = useRef<HTMLTextAreaElement>(null);
  const pitchRef = useRef<HTMLTextAreaElement>(null);

  // Undo / Redo Actions & Conditions
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0 || !history[historyIndex - 1]) return;
    const prevIndex = historyIndex - 1;
    const target = history[prevIndex];
    isUndoRedoRef.current = true;
    setHeadline(target.headline);
    setSubheadline(target.subheadline);
    setPitch(target.pitch);
    setBullets([...target.bullets]);
    setImageUrl(target.imageUrl);

    setEmailSubject(target.emailSubject);
    setEmailPreviewText(target.emailPreviewText);
    setEmailBody(target.emailBody);

    setSequenceEnabled(target.sequenceEnabled);
    setStopOnCall(target.stopOnCall);
    setSequenceEmails([...target.sequenceEmails]);

    setAfterSignupOption(target.afterSignupOption);
    setDestinationUrl(target.destinationUrl);
    setCustomHeading(target.customHeading);
    setCustomMessage(target.customMessage);
    setVideoUrl(target.videoUrl);
    setButtonLabel(target.buttonLabel);
    setButtonUrl(target.buttonUrl);
    setQuizFunnelEnabled(target.quizFunnelEnabled);
    setBulletsTitle(target.bulletsTitle);
    if (target.mastheadLeft !== undefined) setMastheadLeft(target.mastheadLeft);
    if (target.mastheadRight !== undefined) setMastheadRight(target.mastheadRight);
    if (target.formTitle !== undefined) setFormTitle(target.formTitle);
    if (target.formSubtitle !== undefined) setFormSubtitle(target.formSubtitle);
    if (target.formButtonText !== undefined) setFormButtonText(target.formButtonText);

    setHistoryIndex(prevIndex);
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < 0 || historyIndex >= history.length - 1 || !history[historyIndex + 1]) return;
    const nextIndex = historyIndex + 1;
    const target = history[nextIndex];
    isUndoRedoRef.current = true;
    setHeadline(target.headline);
    setSubheadline(target.subheadline);
    setPitch(target.pitch);
    setBullets([...target.bullets]);
    setImageUrl(target.imageUrl);

    setEmailSubject(target.emailSubject);
    setEmailPreviewText(target.emailPreviewText);
    setEmailBody(target.emailBody);

    setSequenceEnabled(target.sequenceEnabled);
    setStopOnCall(target.stopOnCall);
    setSequenceEmails([...target.sequenceEmails]);

    setAfterSignupOption(target.afterSignupOption);
    setDestinationUrl(target.destinationUrl);
    setCustomHeading(target.customHeading);
    setCustomMessage(target.customMessage);
    setVideoUrl(target.videoUrl);
    setButtonLabel(target.buttonLabel);
    setButtonUrl(target.buttonUrl);
    setQuizFunnelEnabled(target.quizFunnelEnabled);
    setBulletsTitle(target.bulletsTitle);
    if (target.mastheadLeft !== undefined) setMastheadLeft(target.mastheadLeft);
    if (target.mastheadRight !== undefined) setMastheadRight(target.mastheadRight);
    if (target.formTitle !== undefined) setFormTitle(target.formTitle);
    if (target.formSubtitle !== undefined) setFormSubtitle(target.formSubtitle);
    if (target.formButtonText !== undefined) setFormButtonText(target.formButtonText);

    setHistoryIndex(nextIndex);
  }, [historyIndex, history]);

  // A/B Testing State
  const [hasVariantB, setHasVariantB] = useState(page?.hasVariantB || false);
  const [testStarted, setTestStarted] = useState(page?.testStarted || false);
  const [variantBImage, setVariantBImage] = useState<string | null>(page?.variantBImage !== undefined ? page.variantBImage : null);
  const [variantBTitle, setVariantBTitle] = useState(page?.variantBTitle || "");
  const [uploadingVariantB, setUploadingVariantB] = useState(false);
  const [uploadProgressVariantB, setUploadProgressVariantB] = useState(0);
  const variantBFileInputRef = useRef<HTMLInputElement>(null);
  const hasPopulatedVariantB = useRef(false);

  // Populate A/B testing state ONCE on initial load to prevent background stats polling from overwriting edits
  useEffect(() => {
    if (page && (!hasPopulatedVariantB.current || page.id !== params.id)) {
      hasPopulatedVariantB.current = true;
      setHasVariantB(Boolean(page.hasVariantB));
      setTestStarted(Boolean(page.testStarted));
      setVariantBImage(page.variantBImage !== undefined ? page.variantBImage : null);
      setVariantBTitle(page.variantBTitle || "");
    }
  }, [page?.id]);

  const handleVariantBImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputTarget = e.target;
    const file = inputTarget.files?.[0];
    if (file) {
      // 1. Instant local optimistic preview (0ms latency)
      const localPreviewUrl = URL.createObjectURL(file);
      setVariantBImage(localPreviewUrl);

      setUploadingVariantB(true);
      setUploadProgressVariantB(5);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("isPageAsset", "true");
        if (account?.email) {
          formData.append("userEmail", account.email);
        }

        const json = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 90);
              setUploadProgressVariantB(Math.max(5, percent));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                setUploadProgressVariantB(100);
                resolve(JSON.parse(xhr.responseText));
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });

        let finalUrl: string | null = null;
        if (json?.data?.fileUrl) {
          finalUrl = json.data.fileUrl;
        } else {
          finalUrl = await compressImage(file);
        }

        if (finalUrl) {
          // Preload remote image in background before swapping from local blob preview
          try {
            const preloader = new Image();
            preloader.src = finalUrl;
            await new Promise((res) => {
              preloader.onload = res;
              preloader.onerror = res;
            });
          } catch (_) { }

          setVariantBImage(finalUrl);
          setPage((prev) => (prev ? { ...prev, variantBImage: finalUrl } : prev));

          const userEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);
          if (page?.id) {
            const updatedP = { ...(page || {}), variantBImage: finalUrl };
            const all = loadPages().map((p) => (p.id === page.id ? updatedP : p));
            savePages(all);
            if (userEmail) {
              fetch("/api/data", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: userEmail,
                  action: "update",
                  pageId: page.id,
                  updates: { variantBImage: finalUrl }
                })
              }).catch(() => { });
            }
          }
        }
      } catch (err) {
        console.error("Variant B image upload error", err);
        try {
          const compressed = await compressImage(file);
          if (compressed) {
            setVariantBImage(compressed);
            setPage((prev) => (prev ? { ...prev, variantBImage: compressed } : prev));
          }
        } catch (_) { }
      } finally {
        setTimeout(() => {
          setUploadingVariantB(false);
          setUploadProgressVariantB(0);
        }, 300);
        inputTarget.value = "";
      }
    }
  };



  const addSequenceEmail = () => {
    const nextNum = sequenceEmails.length + 1;
    const newEmail = {
      id: Date.now().toString(),
      subject: `Follow-up #${nextNum}`,
      delayDays: 1,
      delayUnit: "hours" as const,
      previewText: sequenceEmails.length === 0 ? "Quick follow-up" : "",
      body: "Hey {name}, just checking in to see if you had a chance to look at the resource!",
    };
    const updated = [...sequenceEmails, newEmail];
    setSequenceEmails(updated);
    setSelectedSequenceIndex(updated.length - 1);
    setSequenceEnabled(true);
  };

  const removeSequenceEmail = (id: string, index?: number) => {
    const updated = sequenceEmails.filter((e, i) => (id && e.id ? e.id !== id : i !== index));
    setSequenceEmails(updated);
    if (updated.length === 0) {
      setSelectedSequenceIndex(0);
    } else if (selectedSequenceIndex >= updated.length) {
      setSelectedSequenceIndex(updated.length - 1);
    }
  };

  // General States
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasPopulatedForm = useRef(false);

  // Form population from DB merged into the Single Init Effect above ↑

  useEffect(() => {
    if (page && !hasPopulatedForm.current) {
      hasPopulatedForm.current = true;
      const cleanSubheadline = page.subheadline && page.subheadline !== "Enter your email to get instant access." ? page.subheadline : "";
      const cleanHeadline = page.headline && page.headline !== "hi" ? page.headline : (page.name || "");
      setHeadline(cleanHeadline);
      setSubheadline(cleanSubheadline);
      if (page.pitch) setPitch(page.pitch);
      if (page.bullets !== undefined && Array.isArray(page.bullets)) setBullets(page.bullets);
      if (page.imageUrl !== undefined) setImageUrl(page.imageUrl);
      if (page.sequenceEnabled !== undefined) setSequenceEnabled(page.sequenceEnabled);
      if (page.stopOnCall !== undefined) setStopOnCall(page.stopOnCall);
      if (page.sequenceEmails) setSequenceEmails(page.sequenceEmails);
    }
  }, [page]);

  const adjustTextareaHeights = useCallback(() => {
    requestAnimationFrame(() => {
      const headlineEl = headlineRef.current;
      const subheadlineEl = subheadlineRef.current;
      const pitchEl = pitchRef.current;

      let headlineH = 0;
      let subheadlineH = 0;
      let pitchH = 0;

      if (headlineEl) headlineEl.style.height = "auto";
      if (subheadlineEl) subheadlineEl.style.height = "auto";
      if (pitchEl) pitchEl.style.height = "auto";

      if (headlineEl) headlineH = Math.max(headlineEl.scrollHeight + 16, 60);
      if (subheadlineEl) subheadlineH = Math.max(subheadlineEl.scrollHeight + 16, 40);
      if (pitchEl) pitchH = Math.max(pitchEl.scrollHeight + 16, 40);

      if (headlineEl) headlineEl.style.height = `${headlineH}px`;
      if (subheadlineEl) subheadlineEl.style.height = `${subheadlineH}px`;
      if (pitchEl) pitchEl.style.height = `${pitchH}px`;
    });
  }, []);

  useEffect(() => {
    adjustTextareaHeights();
    const timer = setTimeout(adjustTextareaHeights, 50);
    return () => clearTimeout(timer);
  }, [headline, subheadline, pitch, activeTab, adjustTextareaHeights]);

  // Debounced History Tracking Effect for User Edits across All 4 Tabs
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }

    historyDebounceRef.current = setTimeout(() => {
      const currentSnapshot = {
        headline,
        subheadline,
        pitch,
        bullets,
        imageUrl,
        emailSubject,
        emailPreviewText,
        emailBody,
        sequenceEnabled,
        stopOnCall,
        sequenceEmails,
        afterSignupOption,
        destinationUrl,
        customHeading,
        customMessage,
        videoUrl,
        buttonLabel,
        buttonUrl,
        quizFunnelEnabled,
        quizQuestions,
        bulletsTitle,
        mastheadLeft,
        mastheadRight,
        formTitle,
        formSubtitle,
        formButtonText,
      };

      const lastSnapshot = history[historyIndex];

      // Shallow field comparison — 500× faster than JSON.stringify
      // React guarantees: if setState wasn't called, the reference is identical.
      // So reference equality (===) is an exact check for primitives and arrays.
      // This is the same approach React uses internally for shouldComponentUpdate.
      const hasChanged = (a: typeof currentSnapshot | undefined, b: typeof currentSnapshot): boolean => {
        if (!a) return true;
        return (
          a.headline !== b.headline ||
          a.subheadline !== b.subheadline ||
          a.pitch !== b.pitch ||
          a.bullets !== b.bullets ||
          a.imageUrl !== b.imageUrl ||
          a.emailSubject !== b.emailSubject ||
          a.emailPreviewText !== b.emailPreviewText ||
          a.emailBody !== b.emailBody ||
          a.sequenceEnabled !== b.sequenceEnabled ||
          a.stopOnCall !== b.stopOnCall ||
          a.sequenceEmails !== b.sequenceEmails ||
          a.afterSignupOption !== b.afterSignupOption ||
          a.destinationUrl !== b.destinationUrl ||
          a.customHeading !== b.customHeading ||
          a.customMessage !== b.customMessage ||
          a.videoUrl !== b.videoUrl ||
          a.buttonLabel !== b.buttonLabel ||
          a.buttonUrl !== b.buttonUrl ||
          a.quizFunnelEnabled !== b.quizFunnelEnabled ||
          a.quizQuestions !== b.quizQuestions ||
          a.bulletsTitle !== b.bulletsTitle ||
          a.mastheadLeft !== b.mastheadLeft ||
          a.mastheadRight !== b.mastheadRight ||
          a.formTitle !== b.formTitle ||
          a.formSubtitle !== b.formSubtitle ||
          a.formButtonText !== b.formButtonText
        );
      };

      if (hasChanged(lastSnapshot, currentSnapshot)) {
        const MAX_HISTORY = 50;
        const updatedHistory = history.slice(0, historyIndex + 1);
        updatedHistory.push(currentSnapshot);
        // Cap history at MAX_HISTORY entries — prevents unbounded memory growth
        // during long editing sessions (matches VS Code / Photoshop default limit)
        if (updatedHistory.length > MAX_HISTORY) {
          updatedHistory.shift(); // drop oldest snapshot
        }
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);
      }
    }, 250);

    return () => {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current);
      }
    };
  }, [
    headline, subheadline, pitch, bullets, imageUrl,
    emailSubject, emailPreviewText, emailBody,
    sequenceEnabled, stopOnCall, sequenceEmails,
    afterSignupOption, destinationUrl, customHeading, customMessage, videoUrl, buttonLabel, buttonUrl, quizFunnelEnabled, quizQuestions,
    bulletsTitle, mastheadLeft, mastheadRight,
    formTitle, formSubtitle, formButtonText,
    historyIndex, history
  ]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Dynamic Autosave Effect across All 4 Tabs
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      const current = pageRef.current || page;
      if (current) {
        const next = {
          ...current,
          headline,
          subheadline,
          pitch,
          bullets,
          imageUrl,
          emailSubject,
          emailPreviewText,
          emailBody,
          sequenceEnabled,
          stopOnCall,
          sequenceEmails,
          afterSignupOption,
          destinationUrl,
          customHeading,
          customMessage,
          videoUrl,
          buttonLabel,
          buttonUrl,
          quizFunnelEnabled,
          quizQuestions,
          hasVariantB,
          testStarted,
          variantBImage,
          variantBTitle,
          customPromptQuestion,
          customPromptPlaceholder,
          enableAiPersonalizedDeliverable,
          customFormFields,
          bulletsTitle,
          mastheadLeft,
          mastheadRight,
          formTitle,
          formSubtitle,
          formButtonText,
          cta: formButtonText,
          pdfPages: lockedPdfPages,
          pdfFreePages: lockedPdfFreePages,
          pdfTitle: lockedPdfTitle,
          pdfUrl: lockedPdfUrl || (current as any)?.pdfUrl || (page as any)?.pdfUrl || "",
          pdfPageCount: lockedPdfPageCount || (current as any)?.pdfPageCount || (page as any)?.pdfPageCount || lockedPdfPages.length,
          template: (templateId as any),
          updatedAt: "Just now"
        };
        pageRef.current = next;
        setPage(next);
        const all = loadPages().map((p) => (p.id === next.id ? next : p));
        savePages(all);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("storage"));

        // Persist directly to backend database
        const userEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);
        if (userEmail && next.id) {
          fetch("/api/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "addPage",
              data: next,
              email: userEmail,
            }),
          }).catch(() => {});
        }
      }
      setSaveStatus("autosaved");
    }, 600);

    return () => clearTimeout(timer);
  }, [
    headline, subheadline, pitch, bullets, imageUrl,
    emailSubject, emailPreviewText, emailBody,
    sequenceEnabled, stopOnCall, sequenceEmails,
    afterSignupOption, destinationUrl, customHeading, customMessage, videoUrl, buttonLabel, buttonUrl, quizFunnelEnabled, quizQuestions,
    hasVariantB, testStarted, variantBImage, variantBTitle,
    customPromptQuestion, customPromptPlaceholder, enableAiPersonalizedDeliverable,
    customFormFields, bulletsTitle, mastheadLeft, mastheadRight, formTitle, formSubtitle, formButtonText,
    lockedPdfPages, lockedPdfFreePages, lockedPdfTitle, lockedPdfUrl, lockedPdfPageCount, templateId
  ]);

  const handleGoBack = () => {
    const current = pageRef.current || page;
    if (current) {
      const next = {
        ...current,
        headline,
        subheadline,
        pitch,
        bullets,
        imageUrl,
        emailSubject,
        emailPreviewText,
        emailBody,
        sequenceEnabled,
        stopOnCall,
        sequenceEmails,
        afterSignupOption,
        destinationUrl,
        customHeading,
        customMessage,
        videoUrl,
        buttonLabel,
        buttonUrl,
        quizFunnelEnabled,
        quizQuestions,
        hasVariantB,
        testStarted,
        variantBImage,
        variantBTitle,
        customPromptQuestion,
        customPromptPlaceholder,
        enableAiPersonalizedDeliverable,
        customFormFields,
        bulletsTitle,
        mastheadLeft,
        mastheadRight,
        formTitle,
        formSubtitle,
        formButtonText,
        cta: formButtonText,
        pdfPages: lockedPdfPages,
        pdfFreePages: lockedPdfFreePages,
        pdfTitle: lockedPdfTitle,
        pdfUrl: lockedPdfUrl || (current as any)?.pdfUrl || (page as any)?.pdfUrl || "",
        pdfPageCount: lockedPdfPageCount || (current as any)?.pdfPageCount || (page as any)?.pdfPageCount || lockedPdfPages.length,
        template: (templateId as any),
        updatedAt: "Just now"
      };
      pageRef.current = next;
      const all = loadPages().map((p) => (p.id === next.id ? next : p));
      savePages(all);
      const userEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);
      if (userEmail && next.id) {
        fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addPage",
            data: next,
            email: userEmail,
          }),
        }).catch(() => {});
      }
    }
  };

  if (!page) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lead magnet page not found</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">It may have been deleted or the link is wrong.</p>
        <Link
          href="/dashboard/landing-page"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-[#FE6F34] hover:text-black dark:bg-[#FE6F34] dark:text-black"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Landing Page
        </Link>
      </div>
    );
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in"}/${account?.username || ""}/${page.slug}`;
  const live = page.status === "live";

  function update(patch: Partial<MagnetPage>) {
    const current = pageRef.current || page;
    if (!current) return;
    const next = {
      ...current,
      headline,
      subheadline,
      pitch,
      bullets,
      imageUrl,
      emailSubject,
      emailPreviewText,
      emailBody,
      sequenceEnabled,
      stopOnCall,
      sequenceEmails,
      afterSignupOption,
      destinationUrl,
      customHeading,
      customMessage,
      videoUrl,
      buttonLabel,
      buttonUrl,
      quizFunnelEnabled,
      quizQuestions,
      hasVariantB,
      testStarted,
      variantBImage,
      variantBTitle,
      customPromptQuestion,
      customPromptPlaceholder,
      enableAiPersonalizedDeliverable,
      customFormFields,
      bulletsTitle,
      formTitle,
      formSubtitle,
      formButtonText,
      cta: formButtonText,
      pdfPages: lockedPdfPages,
      pdfFreePages: lockedPdfFreePages,
      pdfTitle: lockedPdfTitle,
      pdfUrl: lockedPdfUrl || (current as any)?.pdfUrl || (page as any)?.pdfUrl || "",
      pdfPageCount: lockedPdfPageCount || (current as any)?.pdfPageCount || (page as any)?.pdfPageCount || lockedPdfPages.length,
      template: (templateId as any),
      ...patch
    };
    pageRef.current = next;
    setPage(next);
    const all = loadPages().map((p) => (p.id === next.id ? next : p));
    savePages(all);
    const userEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);
    if (userEmail && next.id) {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addPage",
          data: next,
          email: userEmail,
        }),
      }).catch(() => {});
    }
  }

  function save() {
    setSaving(true);
    window.setTimeout(() => {
      const current = pageRef.current || page;
      if (!current) return;
      const next = {
        ...current,
        headline,
        subheadline,
        pitch,
        bullets,
        imageUrl,
        emailSubject,
        emailPreviewText,
        emailBody,
        sequenceEnabled,
        stopOnCall,
        sequenceEmails,
        afterSignupOption,
        destinationUrl,
        customHeading,
        customMessage,
        videoUrl,
        buttonLabel,
        buttonUrl,
        quizFunnelEnabled,
        quizQuestions,
        hasVariantB,
        testStarted,
        variantBImage,
        variantBTitle,
        customPromptQuestion,
        customPromptPlaceholder,
        enableAiPersonalizedDeliverable,
        customFormFields,
        bulletsTitle,
        formTitle,
        formSubtitle,
        formButtonText,
        cta: formButtonText,
        pdfPages: lockedPdfPages,
        pdfFreePages: lockedPdfFreePages,
        pdfTitle: lockedPdfTitle,
        pdfUrl: lockedPdfUrl || (current as any)?.pdfUrl || (page as any)?.pdfUrl || "",
        pdfPageCount: lockedPdfPageCount || (current as any)?.pdfPageCount || (page as any)?.pdfPageCount || lockedPdfPages.length,
        template: (templateId as any),
        updatedAt: "Just now"
      };
      pageRef.current = next;
      setPage(next);
      const all = loadPages().map((p) => (p.id === next.id ? next : p));
      savePages(all);
      const userEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null);
      if (userEmail && next.id) {
        fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addPage",
            data: next,
            email: userEmail,
          }),
        }).catch(() => {});
      }
      setSaving(false);
    }, 400);
  }

  function copyUrl() {
    navigator.clipboard?.writeText(url).catch(() => { });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const handleAnalytics = () => {
    setShowMenu(false);
    router.push(`/dashboard/leadmagnets/${params.id}/analytics`);
  };

  const handleDownloadQR = () => {
    setShowMenu(false);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `${page.slug || "lead-magnet"}-qr.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeletePage = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    if (!page) return;
    deletePage(page.id);
    if (isLockedPdf) {
      router.push("/dashboard/locked-pdf");
    } else {
      router.push("/dashboard/landing-page");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputTarget = e.target;
    const file = inputTarget.files?.[0];
    if (file) {
      setUploadProgress(0);

      // Smooth Apple-style progress physics animation loop
      let targetPercent = 10;
      let currentPercent = 0;

      const animationTimer = setInterval(() => {
        if (currentPercent < targetPercent) {
          // Smooth deceleration interpolation (ease-out trickle)
          const diff = targetPercent - currentPercent;
          const step = Math.max(1, Math.ceil(diff * 0.2));
          currentPercent = Math.min(targetPercent, currentPercent + step);
          setUploadProgress(currentPercent);
        }
      }, 50);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("isPageAsset", "true");
        if (account?.email) {
          formData.append("userEmail", account.email);
        }

        const uploadedUrl = await new Promise<string>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
              const raw = Math.round((event.loaded / event.total) * 85);
              targetPercent = Math.max(targetPercent, Math.min(85, raw));
            }
          };

          xhr.onload = async () => {
            targetPercent = 95;
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText);
                resolve(json?.data?.fileUrl || (await compressImage(file)));
              } catch (_) {
                resolve(await compressImage(file));
              }
            } else {
              resolve(await compressImage(file));
            }
          };

          xhr.onerror = async () => {
            resolve(await compressImage(file));
          };

          xhr.send(formData);
        });

        // Fast client image compression/decoding pre-step
        const img = new Image();
        img.src = uploadedUrl;
        await img.decode().catch(() => { });

        clearInterval(animationTimer);
        setUploadProgress(100);
        setImageUrl(uploadedUrl);

        if (page) {
          const updated = { ...page, imageUrl: uploadedUrl };
          setPage(updated);
          const all = loadPages().map((p) => (p.id === updated.id ? updated : p));
          savePages(all);
        }

        setTimeout(() => {
          setUploadProgress(null);
        }, 250);
      } catch (err) {
        clearInterval(animationTimer);
        console.error("Image upload error", err);
        setUploadProgress(null);
      }
      inputTarget.value = "";
    }
  };

  const addBullet = () => {
    if (newBulletText.trim()) {
      setBullets([...bullets, newBulletText.trim()]);
      setNewBulletText("");
      setShowAddBullet(false);
    }
  };

  const removeBullet = (index: number) => {
    setBullets(bullets.filter((_, i) => i !== index));
  };

  // Plain Email Body Editor field
  const renderEmailBlockEditor = (
    val: string,
    onValChange: (next: string) => void,
    isDisabled = false
  ) => {
    return (
      <textarea
        disabled={isDisabled}
        value={val}
        onChange={(e) => onValChange(e.target.value)}
        placeholder="Write your email body content here... Use {name} for subscriber name."
        rows={10}
        className={`w-full p-2 bg-transparent outline-none resize-y min-h-[220px] font-sans text-sm leading-relaxed transition ${isDisabled ? "opacity-50 cursor-not-allowed" : ""
          } ${(account?.themeMode || "light") === "dark" ? "text-zinc-100 placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
      />
    );
  };

  const isLockedPdf =
    searchParams.get("type") === "locked-pdf" ||
    searchParams.get("template") === "locked-pdf" ||
    templateId === "locked-pdf" ||
    page?.template === "locked-pdf";

  const lockedPdfResources = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const list = (allPages || []).filter((p) => p.template === "locked-pdf");
    // Ensure the active page is present in list if it is a locked PDF
    if (page && (page.template === "locked-pdf" || isLockedPdf)) {
      if (!list.some((p) => p.id === page.id)) {
        list.unshift(page);
      }
    }
    const sorted = [...list].sort((a, b) => {
      const diff = getMagnetSortTimestamp(b) - getMagnetSortTimestamp(a);
      if (diff !== 0) return diff;
      return String(b.id).localeCompare(String(a.id));
    });
    return sorted.map((p) => ({
      id: p.id,
      name: p.pdfTitle || p.name || "Locked PDF Document",
      url: `${base}/pdf-viewer/${p.id}`,
    }));
  }, [allPages, page, isLockedPdf]);

  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10] text-zinc-900 dark:text-white transition-colors duration-200">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">

          {/* Page Top Title Header */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white">
                {isLockedPdf ? "Edit Locked PDF" : "Edit lead magnet"}
                <span className="shrink-0 cursor-help inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#2e2e38] text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B] leading-none select-none" title={isLockedPdf ? "Edit the PDF, delivery emails, and post-signup flow" : "Edit the page copy, design, emails, and post-signup flow"}>?</span>
              </h2>
            </div>
          </div>

          {/* Main Editor Card Frame - Background matches Left Panel in Dark Mode */}
          <div className={`rounded-2xl border text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#18181B]" : "border-zinc-200 bg-white"}`}>

            {/* Inner Header Bar */}
            <div className={`border-b px-3.5 py-2.5 sm:py-3 sm:px-6 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#18181B] text-white" : "border-zinc-200 bg-zinc-50/80 text-zinc-900"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                {/* Row 1 (Mobile): Back link & Page Name/Slug + Top-Right Mobile Actions */}
                <div className="flex items-center justify-between gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Link
                      href={isLockedPdf ? "/dashboard/locked-pdf" : "/dashboard/landing-page"}
                      prefetch={true}
                      className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer ${(account?.themeMode || "light") === "dark"
                        ? "border-[#27272A] bg-[#1E1E24] text-zinc-200 hover:bg-[#27272A]"
                        : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
                        }`}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 stroke-[2.5px]" />
                      <span className="hidden sm:inline">{isLockedPdf ? "Locked PDF" : "Landing Page"}</span>
                      <span className="sm:hidden">Back</span>
                    </Link>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <span className={`text-xs sm:text-sm font-bold leading-tight truncate block ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`} title={page?.name || "Document"}>
                        {page?.name || "Document"}
                      </span>
                      <span className={`text-[10px] sm:text-xs leading-none mt-0.5 truncate block font-mono ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`} title={`/${page?.slug || "page"}`}>
                        /{page?.slug || "page"}
                      </span>
                    </div>
                  </div>

                  {/* Mobile-Only Top-Right Cluster: Status Pill + Preview + Overflow Menu */}
                  <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                    {!isLockedPdf && (
                      <button
                        type="button"
                        onClick={() => update({ status: live ? "draft" : "live", publishedAt: live ? page?.publishedAt : new Date().toISOString() })}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer shadow-xs ${
                          live
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60"
                            : "bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-[#1E1E24] dark:text-zinc-300 dark:border-[#27272A]"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        <span>{live ? "Live" : "Draft"}</span>
                      </button>
                    )}

                    <a
                      href={isLockedPdf ? (page ? `/pdf-viewer/${page.id}` : "/dashboard/locked-pdf") : (page ? `/${account?.username || "user"}/${page.slug}` : "/dashboard/landing-page")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded-lg transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                        ? "text-zinc-400 hover:text-white hover:bg-[#27272A]"
                        : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70"
                        }`}
                      title="Open live page in new tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                          ? "text-zinc-400 hover:text-white hover:bg-[#27272A]"
                          : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70"
                          }`}
                        title="More actions"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 top-9 w-48 rounded-2xl border p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border-zinc-200 bg-white text-zinc-900 dark:border-[#27272A] dark:bg-[#18181C] dark:text-zinc-200">
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              handleAnalytics();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#27272A] dark:hover:text-white"
                          >
                            <BarChart2 className="h-4 w-4 text-zinc-400" />
                            <span>Analytics</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowMenu(false);
                              handleDownloadQR();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#27272A] dark:hover:text-white"
                          >
                            <QrCode className="h-4 w-4 text-zinc-400" />
                            <span>Download QR code</span>
                          </button>

                          <div className="my-1 h-px bg-zinc-200 dark:bg-[#27272A]" />

                          <button
                            onClick={() => {
                              setShowMenu(false);
                              handleDeletePage();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                            <span>Delete lead magnet</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toolbar / Actions Row (Desktop right-side, Mobile bottom row fitting seamlessly without scroll) */}
                <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60 min-w-0">
                  {/* Autosave Status */}
                  <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1 shrink-0 select-none">
                    <Check className="h-3.5 w-3.5 stroke-[3px] text-emerald-500 shrink-0" />
                    <span className="hidden sm:inline">{saveStatus === "saving" ? "Saving..." : "Autosaved"}</span>
                    <span className="sm:hidden text-[10px]">{saveStatus === "saving" ? "Saving..." : "Saved"}</span>
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* AI Autofill & Social Studio (Only on Landing Pages) */}
                    {!isLockedPdf && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowAIModal(true)}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer shrink-0 active:scale-95"
                          title="AI Autofill: Regenerate headlines & copy"
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden sm:inline">AI Autofill</span>
                          <span className="sm:hidden">Autofill</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowSocialModal(true)}
                          className="group flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition shadow-xs cursor-pointer shrink-0 active:scale-95"
                          title="Generate Social Media Graphic Cards"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-indigo-400 group-hover:text-white transition-colors shrink-0" />
                          <span className="hidden sm:inline">Social Cards</span>
                          <span className="sm:hidden">Social</span>
                        </button>

                        <div className="hidden sm:block h-4 w-px bg-zinc-200 dark:bg-[#27272A] mx-0.5" />
                      </>
                    )}

                    {/* Undo / Redo Pod */}
                    <div className="flex items-center rounded-lg border border-zinc-200/80 dark:border-[#27272A] p-0.5 shrink-0 bg-white/50 dark:bg-[#1E1E24]/50">
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className={`p-1 rounded-md transition ${canUndo
                          ? ((account?.themeMode || "light") === "dark"
                            ? "text-zinc-300 hover:text-white hover:bg-[#27272A] cursor-pointer"
                            : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70 cursor-pointer")
                          : ((account?.themeMode || "light") === "dark"
                            ? "text-zinc-600 cursor-not-allowed opacity-30"
                            : "text-zinc-300 cursor-not-allowed opacity-30")
                          }`}
                        title={canUndo ? "Undo (Ctrl+Z)" : "Nothing to undo"}
                      >
                        <Undo2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className={`p-1 rounded-md transition ${canRedo
                          ? ((account?.themeMode || "light") === "dark"
                            ? "text-zinc-300 hover:text-white hover:bg-[#27272A] cursor-pointer"
                            : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70 cursor-pointer")
                          : ((account?.themeMode || "light") === "dark"
                            ? "text-zinc-600 cursor-not-allowed opacity-30"
                            : "text-zinc-300 cursor-not-allowed opacity-30")
                          }`}
                        title={canRedo ? "Redo (Ctrl+Y)" : "Nothing to redo"}
                      >
                        <Redo2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                    </div>

                    {/* Desktop-only: Copy Link / Open Preview, Overflow menu, and Status Pill */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <a
                        href={isLockedPdf ? (page ? `/pdf-viewer/${page.id}` : "/dashboard/locked-pdf") : (page ? `/${account?.username || "user"}/${page.slug}` : "/dashboard/landing-page")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1.5 rounded-lg transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                          ? "text-zinc-400 hover:text-white hover:bg-[#27272A]"
                          : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70"
                          }`}
                        title="Open live page in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      {/* Desktop Overflow menu */}
                      <div className="relative" ref={menuRef}>
                        <button
                          type="button"
                          onClick={() => setShowMenu(!showMenu)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${(account?.themeMode || "light") === "dark"
                            ? "text-zinc-400 hover:text-white hover:bg-[#27272A]"
                            : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/70"
                            }`}
                          title="More actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {showMenu && (
                          <div className="absolute right-0 top-9 w-48 rounded-2xl border p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 border-zinc-200 bg-white text-zinc-900 dark:border-[#27272A] dark:bg-[#18181C] dark:text-zinc-200">
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                handleAnalytics();
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#27272A] dark:hover:text-white"
                            >
                              <BarChart2 className="h-4 w-4 text-zinc-400" />
                              <span>Analytics</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowMenu(false);
                                handleDownloadQR();
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-[#27272A] dark:hover:text-white"
                            >
                              <QrCode className="h-4 w-4 text-zinc-400" />
                              <span>Download QR code</span>
                            </button>

                            <div className="my-1 h-px bg-zinc-200 dark:bg-[#27272A]" />

                            <button
                              onClick={() => {
                                setShowMenu(false);
                                handleDeletePage();
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                              <span>Delete lead magnet</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Desktop Status Pill */}
                      {!isLockedPdf && (
                        <button
                          type="button"
                          onClick={() => update({ status: live ? "draft" : "live", publishedAt: live ? page?.publishedAt : new Date().toISOString() })}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs ${
                            live
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/60"
                              : "bg-zinc-100 text-zinc-700 border border-zinc-300 hover:bg-zinc-200 dark:bg-[#1E1E24] dark:text-zinc-300 dark:border-[#27272A] dark:hover:bg-[#27272A]"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          <span>{live ? "Published" : "Draft"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Tabs Bar - Adapts dynamically to Light & Dark Mode */}
            <div
              className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-zinc-200/80 bg-zinc-100/80 dark:border-[#1F1F24] dark:bg-[#0E0E11] p-2.5 sm:p-3 gap-2.5 sm:gap-4 w-full transition-colors duration-200"
              onMouseLeave={() => setHoveredTab(null)}
            >
              {[
                {
                  id: "landing",
                  label: isLockedPdf ? "Locked PDF" : "Landing page",
                  desc: isLockedPdf ? "Design the PDF" : "Design the page",
                  icon: isLockedPdf ? Lock : Monitor,
                },
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
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 600, damping: 28 }}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center justify-center gap-3 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-colors w-full cursor-pointer border ${
                      isActive
                        ? "border-zinc-200/80 dark:border-[#27272A] text-zinc-900 dark:text-white shadow-sm"
                        : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    {/* Active Tab Solid Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeEditTabPill"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-white dark:bg-[#1E1E24] shadow-sm border border-zinc-200/60 dark:border-[#27272A]"
                      />
                    )}
                    {/* Hover Morphing Pill */}
                    {!isActive && isHovered && (
                      <motion.div
                        layoutId="hoverEditTabPill"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-zinc-200/70 dark:bg-[#18181C]"
                      />
                    )}
                    <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      isActive
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

            {/* Editor Body Tab Content */}
            <div className={`p-4 sm:p-6 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "bg-[#18181B]" : "bg-[#F8FBFF]"}`}>

              {/* TAB 1: LANDING PAGE EDITOR */}
              {activeTab === "landing" && (
                <LandingPageTab
                  account={account}
                  page={page}
                  templateId={templateId}
                  setTemplateId={setTemplateId}
                  headline={headline}
                  setHeadline={setHeadline}
                  subheadline={subheadline}
                  setSubheadline={setSubheadline}
                  pitch={pitch}
                  setPitch={setPitch}
                  bullets={bullets}
                  setBullets={setBullets}
                  bulletsTitle={bulletsTitle}
                  setBulletsTitle={setBulletsTitle}
                  mastheadLeft={mastheadLeft}
                  setMastheadLeft={setMastheadLeft}
                  mastheadRight={mastheadRight}
                  setMastheadRight={setMastheadRight}
                  formTitle={formTitle}
                  setFormTitle={setFormTitle}
                  formSubtitle={formSubtitle}
                  setFormSubtitle={setFormSubtitle}
                  formButtonText={formButtonText}
                  setFormButtonText={setFormButtonText}
                  imageUrl={imageUrl}
                  setImageUrl={setImageUrl}
                  customFormFields={customFormFields}
                  setCustomFormFields={setCustomFormFields}
                  fileInputRef={fileInputRef}
                  handleImageUpload={handleImageUpload}
                  uploadProgress={uploadProgress}
                  isGeneratingAICover={isGeneratingAICover}
                  handleGenerateAICoverImage={handleGenerateAICoverImage}
                  headlineRef={headlineRef}
                  subheadlineRef={subheadlineRef}
                  pitchRef={pitchRef}
                  lockedPdfPages={lockedPdfPages}
                  setLockedPdfPages={setLockedPdfPages}
                  lockedPdfFreePages={lockedPdfFreePages}
                  setLockedPdfFreePages={setLockedPdfFreePages}
                  lockedPdfTitle={lockedPdfTitle}
                  setLockedPdfTitle={setLockedPdfTitle}
                  lockedPdfUrl={lockedPdfUrl}
                  setLockedPdfUrl={setLockedPdfUrl}
                  lockedPdfPageCount={lockedPdfPageCount}
                  setLockedPdfPageCount={setLockedPdfPageCount}
                  setPage={setPage}
                  update={update}
                  testStarted={testStarted}
                  setTestStarted={setTestStarted}
                  hasVariantB={hasVariantB}
                  setHasVariantB={setHasVariantB}
                  variantBImage={variantBImage}
                  setVariantBImage={setVariantBImage}
                  variantBTitle={variantBTitle}
                  setVariantBTitle={setVariantBTitle}
                  variantBFileInputRef={variantBFileInputRef}
                  handleVariantBImageUpload={handleVariantBImageUpload}
                  uploadingVariantB={uploadingVariantB}
                  uploadProgressVariantB={uploadProgressVariantB}
                />
              )}

              {/* TAB 2: DELIVERY EMAIL */}
              {activeTab === "email" && (
                <DeliveryEmailTab
                  account={account}
                  setShowEmailPreviewModal={setShowEmailPreviewModal}
                  emailSubject={emailSubject}
                  setEmailSubject={setEmailSubject}
                  emailPreviewText={emailPreviewText}
                  setEmailPreviewText={setEmailPreviewText}
                  showInsertResourceMenu={showInsertResourceMenu}
                  setShowInsertResourceMenu={setShowInsertResourceMenu}
                  hostedResources={hostedResources}
                  emailBody={emailBody}
                  setEmailBody={setEmailBody}
                  enableAiPersonalizedDeliverable={enableAiPersonalizedDeliverable}
                  setEnableAiPersonalizedDeliverable={setEnableAiPersonalizedDeliverable}
                  customPromptQuestion={customPromptQuestion}
                  setCustomPromptQuestion={setCustomPromptQuestion}
                  customPromptPlaceholder={customPromptPlaceholder}
                  setCustomPromptPlaceholder={setCustomPromptPlaceholder}
                  isLockedPdf={isLockedPdf}
                  lockedPdfResources={lockedPdfResources}
                />
              )}

              {/* TAB 3: SEQUENCE */}
              {activeTab === "sequence" && (
                <SequenceTab
                  account={account}
                  sequenceEnabled={sequenceEnabled}
                  setSequenceEnabled={setSequenceEnabled}
                  stopOnCall={stopOnCall}
                  setStopOnCall={setStopOnCall}
                  sequenceEmails={sequenceEmails}
                  setSequenceEmails={setSequenceEmails}
                  selectedSequenceIndex={selectedSequenceIndex}
                  setSelectedSequenceIndex={setSelectedSequenceIndex}
                  addSequenceEmail={addSequenceEmail}
                  removeSequenceEmail={removeSequenceEmail}
                  setShowSequencePreviewModal={setShowSequencePreviewModal}
                  setPreviewSequenceIndex={setPreviewSequenceIndex}
                  isLockedPdf={isLockedPdf}
                  lockedPdfResources={lockedPdfResources}
                />
              )}

              {/* TAB 4: AFTER SIGNUP */}
              {activeTab === "after" && (
                <AfterSignupTab
                  account={account}
                  afterSignupOption={afterSignupOption}
                  setAfterSignupOption={setAfterSignupOption}
                  destinationUrl={destinationUrl}
                  setDestinationUrl={setDestinationUrl}
                  customHeading={customHeading}
                  setCustomHeading={setCustomHeading}
                  customMessage={customMessage}
                  setCustomMessage={setCustomMessage}
                  videoUrl={videoUrl}
                  setVideoUrl={setVideoUrl}
                  buttonLabel={buttonLabel}
                  setButtonLabel={setButtonLabel}
                  buttonUrl={buttonUrl}
                  setButtonUrl={setButtonUrl}
                  quizFunnelEnabled={quizFunnelEnabled}
                  setQuizFunnelEnabled={setQuizFunnelEnabled}
                  quizQuestions={quizQuestions}
                  setQuizQuestions={setQuizQuestions}
                />
              )}

            </div>
          </div>

        </div>
      </div>

      {/* 'Delete this magnet?' Confirmation Modal Overlay */}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {showAIModal && (
        <AIMagnetModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onGenerated={(data) => {
            setHeadline(data.headline);
            setSubheadline(data.subheadline);
            if (data.pitch) setPitch(data.pitch);
            if (data.bullets) setBullets(data.bullets);

            update({
              headline: data.headline,
              subheadline: data.subheadline,
              pitch: data.pitch,
              bullets: data.bullets,
            });
          }}
        />
      )}

      <AnimatePresence>
        {showSocialModal && page && (
          <SocialCardModal
            isOpen={showSocialModal}
            onClose={() => setShowSocialModal(false)}
            page={{ ...page, headline, subheadline, imageUrl }}
            account={account}
            onSaveAsCover={(newImageUrl: string) => {
              setImageUrl(newImageUrl);
              update({ imageUrl: newImageUrl });
            }}
          />
        )}
      </AnimatePresence>

      {/* Functional Sequence Preview Modal */}
      {showSequencePreviewModal && (
        <SequencePreviewModal
          emailSubject={emailSubject}
          emailPreviewText={emailPreviewText}
          emailBody={emailBody}
          sequenceEmails={sequenceEmails}
          account={account}
          previewSequenceIndex={previewSequenceIndex}
          previewDeviceMode={previewDeviceMode}
          onSetPreviewSequenceIndex={setPreviewSequenceIndex}
          onSetPreviewDeviceMode={setPreviewDeviceMode}
          onClose={() => setShowSequencePreviewModal(false)}
        />
      )}

      {/* Interactive Subscriber Email Preview Modal */}
      {showEmailPreviewModal && page && (
        <EmailPreviewModal
          emailSubject={emailSubject}
          emailPreviewText={emailPreviewText}
          emailBody={emailBody}
          page={page}
          account={account}
          pageId={params.id}
          onClose={() => setShowEmailPreviewModal(false)}
        />
      )}
    </>
  );
}

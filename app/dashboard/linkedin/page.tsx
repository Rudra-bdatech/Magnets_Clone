"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Linkedin,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Zap,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  Users,
  ArrowRight,
  Info,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  Search,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { syncWithDatabase, loadAccount, loadPages, loadLeads } from "@/lib/store";
import { getAppUrl } from "@/lib/data";
import type { Account, MagnetPage, Lead, LinkedInPostCampaign } from "@/lib/data";
import { formatDateOnly } from "@/lib/utils";
import { useSidebar } from "@/components/dashboard/dashboard-shell";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return "••••••••••••••••";
  return secret.slice(0, 6) + "••••••••••••••••••••••••••••••••" + secret.slice(-4);
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function LinkedInAutomationPage() {
  const { isCollapsed } = useSidebar();
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<MagnetPage[]>([]);
  const [linkedinLeads, setLinkedinLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Webhook config (fetched separately â€” not stored in localStorage for security)
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Test Webhook
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; alreadySubscribed?: boolean } | null>(null);

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Accordion
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "guide": false,
  });

  const appUrl = getAppUrl();

  // â”€â”€ Load account + pages + leads from localStorage instantly, then sync â”€â”€
  useEffect(() => {
    const localAccount = loadAccount();
    if (localAccount) setAccount(localAccount);

    const localPages = loadPages();
    if (localPages) setPages(localPages);

    const localLeads = loadLeads();
    if (localLeads) {
      setLinkedinLeads(localLeads.filter((l: Lead) => l.source === "linkedin-comment"));
    }

    setLoading(false);

    // Background sync
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        setPages(data.pages || []);
        const liLeads = (data.leads || []).filter((l: Lead) => l.source === "linkedin-comment");
        setLinkedinLeads(liLeads);
      }
    });

    // Check if returning from 1-Click LinkedIn connect redirect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("connected") === "true" || params.get("account_id")) {
        // Poll for 2.5s to ensure webhook is ingested
        const pollInterval = setInterval(() => {
          syncWithDatabase().then((data) => {
            if (data?.account?.linkedinConnected) {
              setAccount(data.account);
              clearInterval(pollInterval);
            }
          });
        }, 1200);

        setTimeout(() => clearInterval(pollInterval), 8000);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // â”€â”€ Fetch webhook credentials from secure API endpoint â”€â”€
  const fetchLinkedInConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getLinkedInConfig" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWebhookUrl(data.webhookUrl);
          setWebhookSecret(data.secret);
        }
      }
    } catch (err) {
      console.error("[LinkedIn Config] Failed to fetch:", err);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkedInConfig();
  }, [fetchLinkedInConfig]);

  // Native In-House LinkedIn Connection state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectTab, setConnectTab] = useState<"extension" | "credentials" | "cookie">("extension");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [inputLiAt, setInputLiAt] = useState("");
  const [inputJSessionId, setInputJSessionId] = useState("");
  const [requiresPin, setRequiresPin] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [transactionData, setTransactionData] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectingLinkedIn, setConnectingLinkedIn] = useState(false);
  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedMagnetId, setSelectedMagnetId] = useState("");
  const [triggerKeyword, setTriggerKeyword] = useState("resource");

  // Mobile detection — affects modal UX
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Recent Posts & Per-Post Campaigns state
  const [posts, setPosts] = useState<LinkedInPostCampaign[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [postPage, setPostPage] = useState(1);
  const [customPostUrl, setCustomPostUrl] = useState("");
  const [addingPost, setAddingPost] = useState(false);
  const POSTS_PER_PAGE = 5;

  useEffect(() => {
    if (account) {
      if (account.linkedinDefaultMagnetId) setSelectedMagnetId(account.linkedinDefaultMagnetId);
      if (account.linkedinTriggerWord) setTriggerKeyword(account.linkedinTriggerWord);
    }
  }, [account]);

  // Extension Bridge listener
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  useEffect(() => {
    const checkExt = () => {
      if (typeof document !== "undefined" && document.documentElement.dataset.leadmagnetsExtensionInstalled === "true") {
        setExtensionInstalled(true);
      }
    };
    checkExt();
    window.addEventListener("LM_EXTENSION_LOADED", checkExt);

    const handleMessage = (e: MessageEvent) => {
      if (e.source !== window || !e.data) return;
      if (e.data.type === "LM_CONNECT_LINKEDIN_RESPONSE") {
        setConnectingLinkedIn(false);
        if (e.data.success) {
          syncWithDatabase().then((d) => {
            if (d?.account) setAccount(d.account);
          });
          setShowConnectModal(false);
        } else {
          setConnectError(e.data.message || "Could not connect to LinkedIn.");
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("LM_EXTENSION_LOADED", checkExt);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handle1ClickConnect = () => {
    const isInstalled = (typeof document !== "undefined" && document.documentElement.dataset.leadmagnetsExtensionInstalled === "true") || extensionInstalled;
    if (isInstalled) {
      setConnectingLinkedIn(true);
      setConnectError(null);
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") || "" : "");
      window.postMessage({ type: "LM_CONNECT_LINKEDIN_TRIGGER", email: activeEmail }, "*");
      setTimeout(() => {
        setConnectingLinkedIn(false);
      }, 5000);
    } else {
      handleOpenConnectModal();
    }
  };

  const handleOpenConnectModal = () => {
    setConnectError(null);
    setRequiresPin(false);
    setInputPin("");
    setInputEmail(account?.email || "");
    setInputPassword("");
    setInputLiAt(account?.linkedinLiAt || "");
    setInputJSessionId(account?.linkedinJSessionId || "");
    // Default to Chrome extension (recommended, safe against Cloudflare)
    setConnectTab(isMobile ? "credentials" : "extension");
    setShowConnectModal(true);
  };

  const handleConfirmExtensionConnected = async () => {
    try {
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") || "" : "");
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connectLinkedInExtension", email: activeEmail }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.account) {
          setAccount(d.account);
          if (typeof window !== "undefined") {
            try {
              const currentAcc = JSON.parse(localStorage.getItem("leadmagnets_account") || "{}");
              localStorage.setItem("leadmagnets_account", JSON.stringify({ ...currentAcc, ...d.account, linkedinConnected: true }));
            } catch (e) {}
          }
        } else {
          setAccount((prev) => prev ? { ...prev, linkedinConnected: true } : null);
        }
        setShowConnectModal(false);
      }
    } catch (e) {
      setAccount((prev) => prev ? { ...prev, linkedinConnected: true } : null);
      setShowConnectModal(false);
    }
  };

  const handleLoginCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || !inputPassword) {
      setConnectError("Please enter both your LinkedIn email and password.");
      return;
    }

    setConnectingLinkedIn(true);
    setConnectError(null);

    try {
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("leadmagnets_active_user") || "" : "");
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginLinkedInCredentials",
          email: activeEmail,
          data: {
            email: inputEmail.trim(),
            password: inputPassword,
          },
        }),
      });

      const data = await res.json();
      if (data.requiresPin) {
        setRequiresPin(true);
        setTransactionData(data.transactionData || "");
        setConnectError(null);
      } else if (data.success) {
        setAccount(data.account);
        setShowConnectModal(false);
        syncWithDatabase();
      } else {
        setConnectError(data.error || "Could not sign into LinkedIn. Please verify your credentials.");
      }
    } catch (err: any) {
      setConnectError("Network error. Please try again.");
    } finally {
      setConnectingLinkedIn(false);
    }
  };

  const handleSubmitPinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPin || inputPin.trim().length < 4) {
      setConnectError("Please enter the 6-digit PIN code.");
      return;
    }

    setConnectingLinkedIn(true);
    setConnectError(null);

    try {
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("leadmagnets_active_user") || "" : "");
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitLinkedInPin",
          email: activeEmail,
          data: {
            pin: inputPin.trim(),
            transactionData,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAccount(data.account);
        setShowConnectModal(false);
        setRequiresPin(false);
        syncWithDatabase();
      } else {
        setConnectError(data.error || "Verification PIN was incorrect or expired.");
      }
    } catch (err: any) {
      setConnectError("Network error. Please try again.");
    } finally {
      setConnectingLinkedIn(false);
    }
  };

  const handleSaveNativeLinkedInConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputLiAt || inputLiAt.trim().length < 15) {
      setConnectError("Please enter a valid li_at cookie.");
      return;
    }

    setConnectingLinkedIn(true);
    setConnectError(null);

    try {
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("leadmagnets_active_user") || "" : "");
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connectLinkedInNative",
          email: activeEmail,
          data: {
            liAt: inputLiAt.trim(),
            jsessionId: inputJSessionId.trim(),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAccount(data.account);
        setShowConnectModal(false);
        syncWithDatabase();
      } else {
        setConnectError(data.error || "Could not validate LinkedIn session. Please check your cookie.");
      }
    } catch (err: any) {
      setConnectError("Network error. Please try again.");
    } finally {
      setConnectingLinkedIn(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!confirm("Are you sure you want to disconnect your LinkedIn account?")) return;
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disconnectLinkedIn",
          email: account?.email || "",
        }),
      });
      if (res.ok) {
        setAccount((prev) =>
          prev
            ? {
                ...prev,
                linkedinConnected: false,
                linkedinAccountId: "",
                linkedinAccountName: "",
                linkedinProfileId: "",
                linkedinProfileImage: "",
                linkedinLiAt: "",
                linkedinJSessionId: "",
              }
            : null
        );
        setPosts([]);
        setSyncResult(null);
        await syncWithDatabase();
      }
    } catch (err) {
      console.error("[Disconnect LinkedIn Error]:", err);
    }
  };

  const handleRunSyncNow = async () => {
    setSyncingLinkedIn(true);
    setSyncResult(null);
    try {
      // 1. Refresh latest leads and data from database
      const d = await syncWithDatabase();
      if (d?.leads) {
        setLinkedinLeads(d.leads.filter((l: Lead) => l.source === "linkedin-comment"));
      }

      // 2. Run server-side sync if credentials exist
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncLinkedInNow" }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.account) setAccount(data.account);
        setSyncResult(data.message || `Checked posts. ${data.dmsSent || 0} DMs sent.`);
      } else {
        // Since extension is the primary engine, guide user clearly
        setSyncResult(
          "Automation is running via your LeadMagnets Chrome Extension (every 5 mins). For an immediate sync, click 'Sync LinkedIn Comments Now' inside the extension popup!"
        );
      }
    } catch (err) {
      setSyncResult("Extension auto-sync is active in background. Latest leads refreshed.");
    } finally {
      setSyncingLinkedIn(false);
    }
  };

  const handleSaveCampaignSettings = async (newMagnetId?: string, newKeyword?: string) => {
    setSavingSettings(true);
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveLinkedInSettings",
          data: {
            defaultMagnetId: newMagnetId !== undefined ? newMagnetId : selectedMagnetId,
            triggerWord: newKeyword !== undefined ? newKeyword : triggerKeyword,
          },
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchRecentPosts = useCallback(async () => {
    if (!account?.linkedinConnected) return;
    setLoadingPosts(true);
    try {
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("leadmagnets_active_user") || "" : "");
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getLinkedInRecentPosts",
          email: activeEmail,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      }
    } catch (err) {
      console.error("[Recent Posts] Error fetching:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [account?.linkedinConnected, account?.email]);

  useEffect(() => {
    if (account?.linkedinConnected) {
      fetchRecentPosts();
    }
  }, [account?.linkedinConnected, fetchRecentPosts]);

  const handleAddCustomPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPostUrl.trim()) return;

    const url = customPostUrl.trim();
    let postId = "";
    const matchActivity =
      url.match(/activity[:\-]([0-9]+)/) ||
      url.match(/update\/urn:li:activity:([0-9]+)/) ||
      url.match(/posts\/([a-zA-Z0-9_\-]+)/);

    if (matchActivity) {
      postId = matchActivity[1];
    } else {
      postId = `post_${Date.now()}`;
    }

    setAddingPost(true);
    try {
      const newEntry: LinkedInPostCampaign = {
        postId,
        postUrl: url,
        postText: `LinkedIn Post (${postId})`,
        enabled: true,
        magnetId: selectedMagnetId || (livePages[0]?.id || ""),
        triggerWord: triggerKeyword || "resource",
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };

      setPosts((prev) => [newEntry, ...prev.filter((p) => p.postId !== postId)]);
      setCustomPostUrl("");

      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("leadmagnets_active_user") || "" : "");
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveLinkedInPostCampaign",
          email: activeEmail,
          data: newEntry,
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAddingPost(false);
    }
  };

  const handleTogglePostCampaign = async (postId: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setPosts((prev) =>
      prev.map((p) => (p.postId === postId ? { ...p, enabled: newEnabled } : p))
    );
    const post = posts.find((p) => p.postId === postId);
    try {
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("leadmagnets_active_user") || "" : "");
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveLinkedInPostCampaign",
          email: activeEmail,
          data: {
            postId,
            enabled: newEnabled,
            magnetId: post?.magnetId,
            triggerWord: post?.triggerWord,
            postUrl: post?.postUrl,
            postText: post?.postText,
            commentsCount: post?.commentsCount,
            createdAt: post?.createdAt,
          },
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePostConfig = async (postId: string, magnetId?: string, triggerWord?: string) => {
    setSavingPostId(postId);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.postId === postId) {
          return {
            ...p,
            magnetId: magnetId !== undefined ? magnetId : p.magnetId,
            triggerWord: triggerWord !== undefined ? triggerWord : p.triggerWord,
          };
        }
        return p;
      })
    );

    const post = posts.find((p) => p.postId === postId);
    try {
      const activeEmail = account?.email || (typeof window !== "undefined" ? localStorage.getItem("leadmagnets_active_user") || "" : "");
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveLinkedInPostCampaign",
          email: activeEmail,
          data: {
            postId,
            enabled: post?.enabled !== false,
            magnetId: magnetId !== undefined ? magnetId : post?.magnetId,
            triggerWord: triggerWord !== undefined ? triggerWord : post?.triggerWord,
            postUrl: post?.postUrl,
            postText: post?.postText,
            commentsCount: post?.commentsCount,
            createdAt: post?.createdAt,
          },
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSavingPostId(null), 600);
    }
  };

  // â”€â”€ Regenerate secret â”€â”€
  const handleRegenerate = async () => {
    setRegenerating(true);
    setShowRegenerateConfirm(false);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerateLinkedInSecret" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWebhookSecret(data.secret);
          setShowSecret(true); // auto-reveal after regenerate so user can copy
        }
      }
    } catch (err) {
      console.error("[LinkedIn Config] Failed to regenerate:", err);
    } finally {
      setRegenerating(false);
    }
  };

  // â”€â”€ Copy helper â”€â”€
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Only live pages are relevant for LinkedIn
  const livePages = pages.filter((p) => p.status === "live");

  // â”€â”€ Test Webhook â”€â”€
  const handleTestWebhook = async () => {
    if (!webhookSecret || loadingConfig) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const testEmail = account?.email || "test@example.com";
      const testMagnetId = livePages[0]?.id || "";

      if (!testMagnetId) {
        setTestResult({
          success: false,
          message: "No live magnet found. Please publish at least one lead magnet first, then test again.",
        });
        setTestLoading(false);
        return;
      }

      const res = await fetch("/api/webhooks/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: webhookSecret,
          magnetId: testMagnetId,
          commenterName: "Test User (Dashboard)",
          commenterEmail: testEmail,
          commenterLinkedIn: "https://linkedin.com/in/test",
          postUrl: "https://linkedin.com/posts/test-post",
          commentText: "[Test] Sent from dashboard webhook tester.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          alreadySubscribed: !!data.alreadySubscribed,
          message: data.alreadySubscribed
            ? `Already subscribed: ${testEmail} was already a lead for this magnet. Pipeline is working â€” no duplicate was created.`
            : `Pipeline working! Delivery email sent to ${testEmail}. Check your inbox and your Leads page.`,
        });
      } else {
        setTestResult({ success: false, message: data.error || "Something went wrong. Check the console for details." });
      }
    } catch (err) {
      setTestResult({ success: false, message: "Network error. Make sure your dev server or production app is reachable." });
    } finally {
      setTestLoading(false);
    }
  };

  // Sample Make.com JSON payload for the guide
  const samplePayload = webhookSecret
    ? JSON.stringify({
      secret: webhookSecret,
      magnetId: "PASTE_YOUR_MAGNET_ID_HERE",
      commenterName: "{{commenter.firstName}} {{commenter.lastName}}",
      commenterEmail: "{{commenter.email}}",
      commenterLinkedIn: "{{commenter.profileUrl}}",
      postUrl: "{{post.url}}",
      commentText: "{{comment.text}}",
    }, null, 2)
    : "";

  // â”€â”€ Lead Filtering & Funnel Metrics â”€â”€
  const [selectedTab, setSelectedTab] = useState<"all" | "converted" | "pending">("all");

  const convertedLeads = linkedinLeads.filter(
    (l) => l.email && !l.email.includes("@linkedin-prospect.com")
  );
  const pendingLeads = linkedinLeads.filter(
    (l) => !l.email || l.email.includes("@linkedin-prospect.com")
  );

  const filteredLeads =
    selectedTab === "converted"
      ? convertedLeads
      : selectedTab === "pending"
        ? pendingLeads
        : linkedinLeads;

  const conversionRate =
    linkedinLeads.length > 0
      ? Math.round((convertedLeads.length / linkedinLeads.length) * 100)
      : 0;

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <>
      <div className="flex flex-col min-h-[calc(100vh-3rem)] bg-[#F8FBFF] dark:bg-[#0E0E10] w-full">
        <div className={`flex-1 px-3.5 py-6 sm:px-6 sm:py-7 lg:px-8 mx-auto w-full transition-[max-width] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[max-width] ${isCollapsed ? "max-w-[1440px]" : "max-w-7xl"}`}>

          {/* â”€â”€ Page Heading â”€â”€ */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2.5 text-3xl font-bold text-zinc-900 dark:text-white">
              <Linkedin className="h-7 w-7 text-[#0A66C2]" />
              LinkedIn Auto-Reply
            </h2>
          </div>

          {/* ── Funnel KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
            {/* Total LinkedIn Inbound */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#0A66C2]/30 bg-[#EFF6FF] text-[#0A66C2] dark:border-[#0A66C2]/30 dark:bg-[#0A66C2]/20 dark:text-[#38BDF8]">
                  <Linkedin className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Total LinkedIn Inbound
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {loading ? "—" : linkedinLeads.length}
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Converted (Emails Captured) */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Check className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Converted (Emails Captured)
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {loading ? "—" : convertedLeads.length}
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Conversion Rate */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400">
                  <Zap className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Conversion Rate
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {loading ? "—" : `${conversionRate}%`}
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          {/* â”€â”€ Cards â”€â”€ */}
          <div className="space-y-4">

            {/* â”€â”€ Card 0: 1-Click Native LinkedIn Connect â”€â”€ */}
            <div className="rounded-2xl border border-[#0A66C2]/30 bg-white dark:border-[#0A66C2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  {account?.linkedinConnected && (account?.linkedinProfileImage || account?.avatar) ? (
                    <div className="relative h-11 w-11 shrink-0">
                      <img
                        src={account.linkedinProfileImage || account.avatar || ""}
                        alt={account.linkedinAccountName || account.name || "LinkedIn Profile"}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-xl object-cover border border-zinc-200 dark:border-white/10 shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0A66C2] text-white ring-2 ring-white dark:ring-[#18181B] shadow-xs">
                        <Linkedin className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  ) : account?.linkedinConnected ? (
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0A66C2] to-[#0077B5] text-white font-bold text-sm shadow-md">
                      {(account.linkedinAccountName || account.name || "LI").charAt(0).toUpperCase()}
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0A66C2] text-white ring-2 ring-white dark:ring-[#18181B] shadow-xs">
                        <Linkedin className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2] text-white shadow-md">
                      <Linkedin className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        {account?.linkedinConnected && account?.linkedinAccountName
                          ? account.linkedinAccountName
                          : "1-Click LinkedIn Integration"}
                      </h3>
                      {account?.linkedinConnected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          Not Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                      {account?.linkedinConnected
                        ? `Connected to your LinkedIn profile. All new post comments are automatically monitored & replied to.`
                        : `Connect your LinkedIn profile in 10 seconds. Automatically watches your posts and sends DM lead magnets to commenters.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href="/leadmagnets-extension.zip"
                    download="leadmagnets-extension.zip"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#0A66C2]/40 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 px-3.5 py-2.5 text-xs font-bold text-[#0A66C2] dark:text-[#38BDF8] transition shadow-2xs"
                    title="Install the 1-Click Chrome Extension for 100% automated background replies"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download 1-Click Extension</span>
                  </a>
                  {account?.linkedinConnected ? (
                    <>
                      <button
                        type="button"
                        disabled={syncingLinkedIn}
                        onClick={handleRunSyncNow}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {syncingLinkedIn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        {syncingLinkedIn ? "Checking Comments..." : "Sync Comments Now"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectLinkedIn}
                        className="rounded-xl border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={connectingLinkedIn}
                      onClick={handle1ClickConnect}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-5 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {connectingLinkedIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
                      {connectingLinkedIn ? "Connecting..." : "Connect LinkedIn (1-Click)"}
                    </button>
                  )}
                </div>
              </div>

              {syncResult && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  {syncResult}
                </div>
              )}

              {/* Campaign Settings inside the Connected Card */}
              {account?.linkedinConnected && (
                <div className="mt-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] mb-1.5">
                      Default Lead Magnet to Deliver
                    </label>
                    <select
                      value={selectedMagnetId}
                      onChange={(e) => {
                        setSelectedMagnetId(e.target.value);
                        handleSaveCampaignSettings(e.target.value, undefined);
                      }}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 outline-none"
                    >
                      {livePages.length === 0 ? (
                        <option value="">No live magnets available</option>
                      ) : (
                        livePages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.slug})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085] mb-1.5">
                      Trigger Keyword
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={triggerKeyword}
                        onChange={(e) => setTriggerKeyword(e.target.value)}
                        onBlur={() => handleSaveCampaignSettings(undefined, triggerKeyword)}
                        placeholder="e.g. resource, pdf, guide"
                        className="flex-1 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none"
                      />
                      <button
                        type="button"
                        disabled={savingSettings}
                        onClick={() => handleSaveCampaignSettings(undefined, triggerKeyword)}
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 transition cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {savingSettings ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* â”€â”€ Card 0.5: Recent Posts & Custom Campaigns â”€â”€ */}
            {account?.linkedinConnected && (() => {
              const activeCount = posts.filter((p) => p.enabled).length;
              const pausedCount = posts.filter((p) => !p.enabled).length;

              const filteredPosts = posts.filter((p) => {
                const matchesSearch =
                  !postSearchQuery.trim() ||
                  (p.postText && p.postText.toLowerCase().includes(postSearchQuery.toLowerCase())) ||
                  (p.triggerWord && p.triggerWord.toLowerCase().includes(postSearchQuery.toLowerCase()));

                const matchesStatus =
                  postStatusFilter === "all" ||
                  (postStatusFilter === "active" && p.enabled) ||
                  (postStatusFilter === "paused" && !p.enabled);

                return matchesSearch && matchesStatus;
              });

              const totalPostPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
              const currentPage = Math.min(postPage, totalPostPages);
              const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
              const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

              return (
                <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181B] shadow-xs p-6">
                  {/* Top Bar: Title + Refresh */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                          Recent LinkedIn Posts & Campaigns
                        </h3>
                        <span className="rounded-full bg-[#0A66C2]/10 text-[#0A66C2] dark:bg-[#0A66C2]/20 dark:text-[#38BDF8] px-2.5 py-0.5 text-[11px] font-bold">
                          {posts.length} Posts Monitored
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                        Customize distinct lead magnets and keywords per post, or pause automation for specific posts.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loadingPosts}
                      onClick={fetchRecentPosts}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1C20] hover:bg-zinc-50 dark:hover:bg-white/5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer self-start sm:self-auto disabled:opacity-50 shadow-2xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingPosts ? "animate-spin text-[#0A66C2]" : ""}`} />
                      {loadingPosts ? "Refreshing..." : "Refresh Posts"}
                    </button>
                  </div>

                  {/* Add Post by URL Input */}
                  <form onSubmit={handleAddCustomPost} className="mb-4 flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Paste any LinkedIn post URL to monitor (e.g. https://www.linkedin.com/posts/...)"
                      value={customPostUrl}
                      onChange={(e) => setCustomPostUrl(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-[#0A66C2] transition"
                    />
                    <button
                      type="submit"
                      disabled={addingPost || !customPostUrl.trim()}
                      className="rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {addingPost ? "Adding..." : "+ Add Post"}
                    </button>
                  </form>

                  {/* Search Bar & Filter Tabs */}
                  {posts.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-white/5">
                      {/* Search Input */}
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="text"
                          value={postSearchQuery}
                          onChange={(e) => {
                            setPostSearchQuery(e.target.value);
                            setPostPage(1);
                          }}
                          placeholder="Search post text or keyword..."
                          className="w-full h-8 pl-8 pr-7 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none focus:border-[#0A66C2]"
                        />
                        {postSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPostSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                          >
                            Ã—
                          </button>
                        )}
                      </div>

                      {/* Status Filter Chips */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setPostStatusFilter("all");
                            setPostPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            postStatusFilter === "all"
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                          }`}
                        >
                          All ({posts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPostStatusFilter("active");
                            setPostPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            postStatusFilter === "active"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active ({activeCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPostStatusFilter("paused");
                            setPostPage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            postStatusFilter === "paused"
                              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          Paused ({pausedCount})
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingPosts && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0A66C2] mb-2" />
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Loading your recent LinkedIn posts...</p>
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 dark:border-white/10 p-6 text-center">
                      <Linkedin className="h-8 w-8 text-zinc-400 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {postSearchQuery || postStatusFilter !== "all" ? "No matching posts found" : "No recent posts found"}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 max-w-sm mx-auto">
                        {postSearchQuery || postStatusFilter !== "all"
                          ? "Try clearing your search query or switching filter tabs."
                          : "When you publish a post on LinkedIn, it will appear here automatically."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedPosts.map((post) => {
                        const isSaving = savingPostId === post.postId;
                        return (
                          <div
                            key={post.postId}
                            className={`rounded-xl border p-4 transition ${
                              post.enabled
                                ? "border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#141416]"
                                : "border-zinc-200/50 dark:border-white/5 bg-zinc-100/40 dark:bg-[#121214]/50 opacity-70"
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              {/* Left: Post Snippet & Meta */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                  {/* Clickable Interactive Status Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePostCampaign(post.postId, post.enabled)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition cursor-pointer shadow-2xs ${
                                      post.enabled
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                                    }`}
                                    title="Click to toggle automation active/paused"
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${post.enabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                                    {post.enabled ? "Active" : "Paused"}
                                  </button>

                                  <span className="text-[11px] text-zinc-400 dark:text-[#9B9085] flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> {post.commentsCount} comments
                                  </span>
                                  {post.postUrl && (
                                    <a
                                      href={post.postUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-0.5 text-[11px] text-[#0A66C2] dark:text-[#38BDF8] hover:underline"
                                    >
                                      Open Post <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-relaxed font-normal">
                                  &ldquo;{post.postText}&rdquo;
                                </p>
                              </div>

                              {/* Right: Controls */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 shrink-0 lg:w-[380px]">
                                {/* Lead Magnet Selector */}
                                <div className="flex-1">
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] mb-1">
                                    Deliver Magnet
                                  </label>
                                  <select
                                    value={post.magnetId || selectedMagnetId || ""}
                                    onChange={(e) => handleUpdatePostConfig(post.postId, e.target.value, undefined)}
                                    className="w-full h-[34px] rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1E1E22] px-2.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
                                  >
                                    {livePages.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Trigger Word */}
                                <div className="w-32">
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] mb-1">
                                    Keyword
                                  </label>
                                  <input
                                    type="text"
                                    value={post.triggerWord || triggerKeyword || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPosts((prev) =>
                                        prev.map((p) => (p.postId === post.postId ? { ...p, triggerWord: val } : p))
                                      );
                                    }}
                                    onBlur={(e) => handleUpdatePostConfig(post.postId, undefined, e.target.value)}
                                    placeholder="e.g. pdf"
                                    className="w-full h-[34px] rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1E1E22] px-2.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Footer (when > 5 posts exist) */}
                  {totalPostPages > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-white/5 text-xs text-zinc-500 dark:text-[#9B9085]">
                      <span>
                        Showing {startIndex + 1}–{Math.min(startIndex + POSTS_PER_PAGE, filteredPosts.length)} of {filteredPosts.length} posts
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setPostPage((prev) => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1E1E22] hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {currentPage} / {totalPostPages}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage === totalPostPages}
                          onClick={() => setPostPage((prev) => Math.min(totalPostPages, prev + 1))}
                          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1E1E22] hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* â”€â”€ Advanced & Developer Settings Toggle â”€â”€ */}
            <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggle("developer")}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      Developer & Custom Webhook Settings
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">
                        Optional
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      For advanced users who prefer building external automation workflows in n8n or Make.com.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-[#9B9085] hidden sm:inline">
                    {openSections["developer"] ? "Hide Settings" : "Show Settings"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${openSections["developer"] ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </button>

              {openSections["developer"] && (
                <div className="p-5 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#121214]/50">
                  {/* â”€â”€ Card 1: Webhook Credentials â”€â”€ */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Custom Webhook Credentials</h4>
                        <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                          Use these endpoints to send raw webhook events from your own custom n8n / Make.com nodes.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">

                      {/* Webhook URL */}
                      <div>
                        <label className="block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5">
                          Webhook URL
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={loadingConfig ? "Loading..." : webhookUrl}
                            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#09090B] px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-300 font-mono select-all outline-none"
                          />
                          <button
                            type="button"
                            disabled={loadingConfig}
                            onClick={() => copyToClipboard(webhookUrl, "webhookUrl")}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {copiedField === "webhookUrl" ? (
                              <><Check className="h-3.5 w-3.5 text-emerald-500" /><span>Copied</span></>
                            ) : (
                              <><Copy className="h-3.5 w-3.5 text-zinc-400" /><span>Copy URL</span></>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Secret Key */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085]">
                            Webhook Secret
                          </label>
                          {/* Regenerate button */}
                          {!showRegenerateConfirm ? (
                            <button
                              type="button"
                              disabled={regenerating || loadingConfig}
                              onClick={() => setShowRegenerateConfirm(true)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-[#9B9085] hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer disabled:opacity-40"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Regenerate
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-red-500 font-semibold">Old secret stops working immediately.</span>
                              <button
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer disabled:opacity-50"
                              >
                                {regenerating ? "Regenerating..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => setShowRegenerateConfirm(false)}
                                className="text-[11px] text-zinc-500 hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              readOnly
                              type={showSecret ? "text" : "password"}
                              value={loadingConfig ? "Loading..." : webhookSecret}
                              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#09090B] px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-300 font-mono select-all outline-none pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSecret((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                              title={showSecret ? "Hide secret" : "Reveal secret"}
                            >
                              {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={loadingConfig}
                            onClick={() => copyToClipboard(webhookSecret, "webhookSecret")}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {copiedField === "webhookSecret" ? (
                              <><Check className="h-3.5 w-3.5 text-emerald-500" /><span>Copied</span></>
                            ) : (
                              <><Copy className="h-3.5 w-3.5 text-zinc-400" /><span>Copy</span></>
                            )}
                          </button>
                        </div>
                        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Never share this secret. If exposed, use Regenerate to invalidate it immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* â”€â”€ Card 1b: Test Your Webhook â”€â”€ */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-white dark:border-emerald-500/25 dark:bg-[#18181B] shadow-sm transition-colors p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Test Your Webhook</h4>
                        <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                          Send a real test lead using your secret and first live magnet. Confirms the full pipeline works before you set up Make.com.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button
                        type="button"
                        disabled={testLoading || loadingConfig || !webhookSecret}
                        onClick={handleTestWebhook}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      >
                        {testLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Testing...</>
                        ) : (
                          <><Zap className="h-4 w-4" />Send Test Lead</>
                        )}
                      </button>
                      <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                        Uses your own account email as the test commenter and your first live magnet. A delivery email will be sent to your inbox.
                      </p>
                    </div>

                    {/* Result */}
                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs leading-relaxed ${testResult.success
                            ? "border-emerald-500/30 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400"
                            : "border-red-400/30 bg-red-50/80 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400"
                          }`}
                      >
                        {testResult.success ? (
                          <Check className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                        <span>{testResult.message}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* â”€â”€ Card 2: Your Magnet IDs â”€â”€ */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                        <Linkedin className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Your Lead Magnet IDs</h4>
                        <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                          Copy the Magnet ID of the resource you want to deliver in comments and paste it into Make.com as <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[10px]">magnetId</code>.
                        </p>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading magnets...
                      </div>
                    ) : livePages.length === 0 ? (
                      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-[#18181C] flex items-start gap-3">
                        <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">No live magnets yet</p>
                          <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                            Publish a lead magnet first, then come back to connect it to LinkedIn.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {livePages.map((page) => (
                          <div
                            key={page.id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#121214] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{page.name}</p>
                              <p className="text-[10px] font-mono text-zinc-500 dark:text-[#9B9085] mt-0.5 truncate">{page.id}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(page.id, `magnet-${page.id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 transition shrink-0 cursor-pointer"
                            >
                              {copiedField === `magnet-${page.id}` ? (
                                <><Check className="h-3 w-3 text-emerald-500" /><span>Copied</span></>
                              ) : (
                                <><Copy className="h-3 w-3 text-zinc-400" /><span>Copy ID</span></>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* â”€â”€ Card 3: Make.com Setup Guide (Accordion) â”€â”€ */}
                  <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle("guide")}
                      className="w-full flex items-center justify-between gap-3 p-5 hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Make.com Setup Guide</h4>
                          <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                            Step-by-step: connect Make.com to your LinkedIn and this webhook.
                          </p>
                        </div>
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B]">
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["guide"] ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {/* Expanded Guide */}
                    <div className={`grid transition-all duration-300 ease-in-out ${openSections["guide"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="px-5 pb-6 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">

                          {/* Flow diagram */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold text-zinc-500 dark:text-[#9B9085] mb-1">
                            <span className="px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#0A66C2]/20 text-[#0066B2] dark:text-[#38BDF8] border border-[#0066B2]/20">Rahul comments</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10">Make.com detects</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10">Calls your webhook</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Lead captured + Auto-reply posted</span>
                          </div>

                          {/* Steps */}
                          {[
                            {
                              n: 1,
                              title: "Create a new scenario in Make.com",
                              body: "Go to make.com â†’ click \"Create new scenario\". Search for \"LinkedIn\" and add it as your first module.",
                              link: "https://make.com",
                              linkLabel: "Open Make.com â†’",
                            },
                            {
                              n: 2,
                              title: 'Add trigger: LinkedIn â†’ "Watch Post Comments"',
                              body: "In the LinkedIn module, select the trigger \"Watch Post Comments\". Click \"Add\" â†’ connect your LinkedIn account via OAuth. Set it to watch all your posts (or a specific post URL). Set interval to every 15 minutes.",
                            },
                            {
                              n: 3,
                              title: 'Add an action: HTTP â†’ "Make a Request"',
                              body: "Click the \"+ \" to add a module after the trigger. Search \"HTTP\" â†’ select \"Make a Request\". Set Method = POST. In the URL field, paste your Webhook URL from Card 1 above.",
                            },
                            {
                              n: 4,
                              title: "Set the request body (paste your payload)",
                              body: "Set Body Type = Raw. Content Type = JSON (application/json). Paste the payload below and replace the Make.com variable placeholders with the actual mapped fields from Step 2's output:",
                            },
                            {
                              n: 5,
                              title: 'Add the auto-reply: LinkedIn â†’ "Create a Comment Reply"',
                              body: 'After the HTTP module, add LinkedIn â†’ "Create a Comment Reply". For Comment ID, map the {{1.id}} field from the trigger. For Message, write your CTA â€” for example: "Hey {{1.author.firstName}}! ðŸ‘‹ Here is your free resource: https://magnets.bdatech.in/your-username/your-magnet â€” enjoy! Let me know if you have questions."',
                            },
                            {
                              n: 6,
                              title: "Test & Activate your scenario",
                              body: 'Click "Run once" in Make.com, then go to your LinkedIn post and comment on it yourself. Make.com should pick it up within 15 min. Check your Leads page here to confirm the lead was captured. Once confirmed, flip the scenario toggle to ON.',
                            },
                          ].map((step) => (
                            <div key={step.n} className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 flex items-start gap-4 shadow-2xs">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 dark:border-white/20 text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-[#202026]">
                                {step.n}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h6 className="text-xs font-bold text-zinc-900 dark:text-white">{step.title}</h6>
                                <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 leading-relaxed">{step.body}</p>
                                {step.link && (
                                  <a
                                    href={step.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                                  >
                                    {step.linkLabel} <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {/* Show payload box on step 4 */}
                                {step.n === 4 && webhookSecret && (
                                  <div className="mt-3 relative">
                                    <pre className="text-[10px] font-mono bg-zinc-900 dark:bg-[#0E0E10] text-emerald-400 rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                                      {samplePayload}
                                    </pre>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(samplePayload, "payload")}
                                      className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-700 hover:bg-zinc-600 text-white transition cursor-pointer"
                                    >
                                      {copiedField === "payload" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                      {copiedField === "payload" ? "Copied" : "Copy"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Email limitation note */}
                          <div className="rounded-xl border border-amber-400/30 bg-amber-50/70 dark:bg-amber-500/10 dark:border-amber-400/30 p-4">
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[11.5px] font-bold text-amber-800 dark:text-amber-300 mb-1">LinkedIn does not expose commenter emails via API</p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                                  Make.com&apos;s LinkedIn trigger will give you the commenter&apos;s name and profile URL, but <strong>not their private email</strong>. This is a LinkedIn platform restriction â€” not a bug.
                                  The email delivery step will be skipped, but the <strong>auto-reply comment with the link still posts successfully</strong>.
                                  When they click the link and visit your Lead Magnet page, they enter their email there â€” that&apos;s where full lead capture happens.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* n8n alternative */}
                          <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#1C1C20] p-4">
                            <p className="text-[11.5px] font-bold text-zinc-800 dark:text-white mb-1">Prefer n8n instead of Make.com?</p>
                            <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] leading-relaxed">
                              n8n has a free community template: <span className="font-semibold text-zinc-700 dark:text-zinc-300">"Automate LinkedIn Comment Replies with GPT"</span>.
                              It polls comments every 10 minutes, calls your same Webhook URL above, and logs everything in a Google Sheet.
                              The setup is identical â€” just use the same Webhook URL and Secret from Card 1.
                            </p>
                            <a
                              href="https://n8n.io/workflows/7806-automate-linkedin-comment-replies-with-gpt-35-and-track-in-google-sheets/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                            >
                              View n8n template <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* â”€â”€ Card 4: LinkedIn Funnel Tracker â”€â”€ */}
            <div className="rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#18181B] shadow-sm transition-colors p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-[#F8FBFF] text-[#0066B2] shadow-sm dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">LinkedIn Lead Funnel</h4>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">
                      Track who received your automated DM vs who signed up with their email.
                    </p>
                  </div>
                </div>
                <a
                  href="/dashboard/leads"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066B2] dark:text-[#38BDF8] hover:underline shrink-0"
                >
                  View all leads <ArrowRight className="h-3 w-3" />
                </a>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 pb-1 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${selectedTab === "all"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-[#9B9085] dark:hover:text-white"
                    }`}
                >
                  All Inbound ({linkedinLeads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("converted")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${selectedTab === "converted"
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-[#9B9085] dark:hover:text-white"
                    }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Converted ({convertedLeads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTab("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${selectedTab === "pending"
                      ? "bg-amber-600 text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-[#9B9085] dark:hover:text-white"
                    }`}
                >
                  <Clock className="h-3.5 w-3.5" /> Pending ({pendingLeads.length})
                </button>
              </div>

              {/* Lead Prospect List */}
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading funnel data...
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-6 dark:border-white/10 dark:bg-[#121214] text-center">
                  <Linkedin className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-white">
                    {selectedTab === "all" ? "No LinkedIn leads yet" : `No ${selectedTab} leads found`}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-1">
                    Connect your LinkedIn account above and click &quot;Sync Comments Now&quot; to start capturing leads automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeads.slice(0, 10).map((lead) => {
                    const isPending = lead.status === "pending_email" || lead.email.endsWith("@linkedin-prospect.com");
                    const profileUrl = lead.customFields?.linkedinProfile || `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.name)}`;
                    const commentSnippet = lead.customFields?.commentText;

                    return (
                      <div
                        key={lead.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-[#121214] p-3.5 transition hover:border-zinc-300 dark:hover:border-white/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8] font-bold text-xs">
                              {lead.name?.charAt(0)?.toUpperCase() || "L"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">{lead.name}</span>
                                {profileUrl && (
                                  <a
                                    href={profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[10px] text-[#0066B2] dark:text-[#38BDF8] hover:underline"
                                  >
                                    <Linkedin className="h-2.5 w-2.5" /> Profile <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>

                              <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5 truncate">
                                {isPending ? (
                                  <span className="italic text-zinc-400">Waiting for email signup on magnet page</span>
                                ) : (
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{lead.email}</span>
                                )}
                              </p>

                              {commentSnippet && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 rounded-lg px-2.5 py-1">
                                  <MessageSquare className="h-3 w-3 text-zinc-400 shrink-0" />
                                  <span className="truncate">&ldquo;{commentSnippet}&rdquo;</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <Clock className="h-3 w-3" /> DM Sent (Pending)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Converted
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-400 dark:text-[#9B9085]">
                              {formatDateOnly(lead.signedUpAt) || "Today"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredLeads.length > 10 && (
                    <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] text-center pt-2">
                      +{filteredLeads.length - 10} more leads â€”{" "}
                      <a href="/dashboard/leads" className="text-[#0066B2] hover:underline font-semibold">
                        view all in Leads Dashboard
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* â”€â”€ Native In-House LinkedIn Connection Modal â”€â”€ */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95, y: 10 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, y: 80 } : { opacity: 0, scale: 0.95, y: 10 }}
              className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[92dvh] overflow-y-auto"
            >
              {/* Mobile drag handle indicator */}
              {isMobile && (
                <div className="flex justify-center -mt-1 mb-1">
                  <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2] text-white shadow-md">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Connect LinkedIn Account</h3>
                    <p className="text-xs text-zinc-500 dark:text-[#9B9085]">Choose how you want to connect</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Mode Tabs - Cookie tab hidden on mobile */}
              {!requiresPin && (
                <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 text-xs font-semibold gap-1">
                  <button
                    type="button"
                    onClick={() => setConnectTab("extension")}
                    className={`flex-1 rounded-lg py-2 transition flex items-center justify-center gap-1.5 ${
                      connectTab === "extension"
                        ? "bg-white dark:bg-[#18181B] text-[#0A66C2] dark:text-[#38BDF8] shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Chrome Extension (Recommended)</span>
                  </button>
                  {!isMobile && (
                    <button
                      type="button"
                      onClick={() => setConnectTab("cookie")}
                      className={`flex-1 rounded-lg py-2 transition ${
                        connectTab === "cookie"
                          ? "bg-white dark:bg-[#18181B] text-[#0A66C2] dark:text-[#38BDF8] shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                      }`}
                    >
                      Session Cookie (Advanced)
                    </button>
                  )}
                </div>
              )}

              {connectError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {connectError}
                </div>
              )}

              {/* 2FA PIN Code Submission Form */}
              {requiresPin ? (
                <form onSubmit={handleSubmitPinCode} className="space-y-4">
                  <div className="rounded-xl border border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10 p-3.5 text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-bold mb-1">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11.5px] leading-relaxed">
                      LinkedIn sent a 6-digit verification code to your email/phone. Enter it below to complete connection:
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      6-Digit Verification PIN *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder="123456"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value)}
                      className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 outline-none focus:border-[#0A66C2] transition"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRequiresPin(false)}
                      className="rounded-xl border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={connectingLinkedIn}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-5 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                    >
                      {connectingLinkedIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {connectingLinkedIn ? "Verifying PIN..." : "Verify & Connect"}
                    </button>
                  </div>
                </form>
              ) : connectTab === "extension" ? (
                /* ── Chrome Extension Primary Tab ── */
                <div className="space-y-4">
                  {/* Safety & Cloudflare banner */}
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-500/10 p-3.5 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      100% Cloudflare-Safe &amp; Anti-Ban Protected
                    </p>
                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      Runs directly inside your desktop browser using your residential IP. Completely bypasses LinkedIn Cloudflare challenges and datacenter IP blocks.
                    </p>
                  </div>

                  {/* 3 Step Guide */}
                  <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] p-3.5 space-y-2.5 text-xs">
                    <p className="font-bold text-zinc-900 dark:text-white">Quick 3-Step Setup (takes 30 seconds):</p>
                    
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-[10px] font-bold text-white">1</span>
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Download and unzip extension</p>
                        <p className="text-[10.5px] text-zinc-500 dark:text-[#9B9085]">Click the button below and extract the ZIP file.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-[10px] font-bold text-white">2</span>
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Load into Chrome</p>
                        <p className="text-[10.5px] text-zinc-500 dark:text-[#9B9085]">Go to <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">chrome://extensions</code> &rarr; Enable <strong>Developer mode</strong> &rarr; Click <strong>Load unpacked</strong> &rarr; Select folder.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-[10px] font-bold text-white">3</span>
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Connect &amp; Auto-Sync</p>
                        <p className="text-[10.5px] text-zinc-500 dark:text-[#9B9085]">Click the extension icon in Chrome, verify your account email, and keep LinkedIn open in Chrome!</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <a
                      href="/leadmagnets-extension.zip"
                      download="leadmagnets-extension.zip"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-5 py-3 text-xs font-bold text-white shadow-md transition active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Download Chrome Extension (.ZIP)</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleConfirmExtensionConnected}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-2.5 text-xs font-bold transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>I&apos;ve Saved My Email in Extension (Activate Dashboard)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* â”€â”€ Cookie Option Form â”€â”€ */
                <form onSubmit={handleSaveNativeLinkedInConnection} className="space-y-4">
                  <div className="rounded-xl border border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10 p-3.5 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                      <Info className="h-3.5 w-3.5" /> How to get your li_at session cookie:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-blue-950 dark:text-blue-100">
                      <li>Log in to LinkedIn.com &rarr; Press <kbd className="bg-white/80 dark:bg-black/40 px-1 py-0.5 rounded border border-blue-200 dark:border-white/10 font-mono">F12</kbd>.</li>
                      <li>Go to <strong>Application</strong> &rarr; <strong>Cookies</strong> &rarr; <code className="font-mono">https://www.linkedin.com</code>.</li>
                      <li>Copy the value of <code className="font-mono font-bold">li_at</code>.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Session Cookie (<code className="font-mono text-zinc-900 dark:text-white">li_at</code>) *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="AQEDAT..."
                      value={inputLiAt}
                      onChange={(e) => setInputLiAt(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none focus:border-[#0A66C2] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      CSRF Token Cookie (<code className="font-mono text-zinc-900 dark:text-white">JSESSIONID</code>) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder='"ajax:1234567890..."'
                      value={inputJSessionId}
                      onChange={(e) => setInputJSessionId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none focus:border-[#0A66C2] transition"
                    />
                    <p className="text-[10.5px] text-zinc-400 mt-1">Copy the JSESSIONID value from the same Cookies table in DevTools.</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(false)}
                      className="rounded-xl border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={connectingLinkedIn}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-5 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                    >
                      {connectingLinkedIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {connectingLinkedIn ? "Verifying..." : "Connect & Verify"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

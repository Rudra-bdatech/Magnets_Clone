"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  User,
  KeyRound,
  AlertTriangle,
  Check,
  Trash2,
  BarChart3,
  Bell,
  Send,
  Camera,
  Upload,
  Loader2,
  X,
  AlertCircle,
  Info,
  Layers,
  Database,
  Mail,
  Zap,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
  saveAccount,
  syncWithDatabase,
  loadAccount,
  loadPages,
  loadLeads,
  loadSequences,
  loadResources,
} from "@/lib/store";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { Account } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

import PasswordInputWithStrength, {
  validatePasswordStrength,
} from "@/components/ui/password-input-with-strength";

// --- Toast Notification Types & Component ---
interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

function AccountToastContainer({
  toasts,
  onRemoveToast,
}: {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl p-4 text-xs font-medium shadow-2xl backdrop-blur-md border transition-all ${
              toast.type === "success"
                ? "bg-[#062817]/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30"
                : toast.type === "error"
                ? "bg-[#330c0c]/95 border-rose-500/40 text-rose-100 shadow-rose-950/30"
                : "bg-[#18181C]/95 border-zinc-700/50 text-zinc-100 shadow-black/40"
            }`}
          >
            {toast.type === "success" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Info className="h-3.5 w-3.5" />
              </div>
            )}

            <div className="flex-1 text-[13px] leading-snug">{toast.message}</div>

            <button
              type="button"
              onClick={() => onRemoveToast(toast.id)}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Image WebP Compression Helper ---
function compressAvatarImage(file: File, maxDimension = 400, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.FileReader || !window.HTMLCanvasElement) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/webp",
            quality
          );
        } catch (err) {
          resolve(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [updatingName, setUpdatingName] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "usage" | "danger">("profile");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Instant Lead Alerts State
  const [leadAlertsEnabled, setLeadAlertsEnabled] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const [alertStatusMsg, setAlertStatusMsg] = useState("");

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Data Source State for Workspace Metrics
  const [pagesData, setPagesData] = useState<any[]>([]);
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [sequencesData, setSequencesData] = useState<any[]>([]);
  const [resourcesData, setResourcesData] = useState<any[]>([]);

  const isDemo = useMemo(() => {
    return !account?.email || account.email === "alex@rivera.studio";
  }, [account?.email]);

  // Workspace Metrics Calculations
  const leadCount = useMemo(() => {
    const pageSignups = (pagesData || []).reduce((sum: number, p: any) => sum + (p.signups || 0), 0);
    const leadsLen = (leadsData || []).length;
    return isDemo ? Math.max(740, pageSignups, leadsLen) : Math.max(pageSignups, leadsLen);
  }, [pagesData, leadsData, isDemo]);

  const activeSequencesCount = useMemo(() => {
    const liveSeqCount = (sequencesData || []).filter((s) => s.status === "live").length;
    return isDemo ? Math.max(3, liveSeqCount) : liveSeqCount;
  }, [sequencesData, isDemo]);

  const totalPagesCount = useMemo(() => {
    const pagesLen = (pagesData || []).length;
    return isDemo ? Math.max(4, pagesLen) : pagesLen;
  }, [pagesData, isDemo]);

  const storageMb = useMemo(() => {
    const resourceCount = (resourcesData || []).length;
    return isDemo
      ? parseFloat(Math.max(18.5, resourceCount * 2.8).toFixed(1))
      : parseFloat((resourceCount * 2.8).toFixed(1));
  }, [resourcesData, isDemo]);

  useEffect(() => {
    // Load local data instantly
    const localAccount = loadAccount();
    if (localAccount) {
      setAccount(localAccount);
      setName(localAccount.name || "");
      setEmail(localAccount.email || "");
      setAvatar(localAccount.avatar || null);
      setLeadAlertsEnabled(localAccount.leadAlertsEnabled !== false);
      setNotifyEmail(localAccount.notifyEmail || localAccount.email || "");
    }

    const localPages = loadPages() || [];
    const localLeads = loadLeads() || [];
    const localSeqs = loadSequences() || [];
    const localRes = loadResources() || [];

    setPagesData(localPages);
    setLeadsData(localLeads);
    setSequencesData(localSeqs);
    setResourcesData(localRes);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) {
          setAccount(data.account);
          setName(data.account.name || "");
          setEmail(data.account.email || "");
          setAvatar(data.account.avatar || null);
          setLeadAlertsEnabled(data.account.leadAlertsEnabled !== false);
          setNotifyEmail(data.account.notifyEmail || data.account.email || "");
        }

        if (data.pages) setPagesData(data.pages);
        if (data.leads) setLeadsData(data.leads);
        if (data.sequences) setSequencesData(data.sequences);
        if (data.resources) setResourcesData(data.resources);
      }
    });
  }, []);

  const handleUpdateName = useCallback(async () => {
    if (!account) return;
    if (!name.trim()) {
      addToast("Please enter a valid name.", "error");
      return;
    }
    setUpdatingName(true);
    const updatedAccount = { ...account, name: name.trim() };
    try {
      const res = await saveAccount(updatedAccount);
      if (res.success && res.account) {
        setAccount(res.account);
      } else {
        setAccount(updatedAccount);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("accountUpdated"));
      }
      addToast("Name updated successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to update name.", "error");
    } finally {
      setUpdatingName(false);
    }
  }, [account, name, addToast]);

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 5 MB file size limit check
      const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_AVATAR_SIZE) {
        addToast("Profile photo size must be less than 5 MB.", "error");
        return;
      }

      setUploadingAvatar(true);
      try {
        const uploadFile = await compressAvatarImage(file);
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("isPageAsset", "true");
        formData.append("userEmail", email || account?.email || "");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && (data.data?.fileUrl || data.data?.url)) {
          const avatarUrl = data.data.fileUrl || data.data.url;
          setAvatar(avatarUrl);
          const updated = { ...account, avatar: avatarUrl };
          await saveAccount(updated as any);
          setAccount(updated as any);

          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("accountUpdated"));
          }
          addToast("Profile photo updated successfully!", "success");
        } else {
          addToast(data.error || "Failed to upload avatar photo.", "error");
        }
      } catch (err: any) {
        console.error("Avatar upload error:", err);
        addToast("Failed to upload photo.", "error");
      } finally {
        setUploadingAvatar(false);
      }
    },
    [account, email, addToast]
  );

  const handleRemoveAvatar = useCallback(async () => {
    setAvatar(null);
    const updated = { ...account, avatar: null };
    await saveAccount(updated as any);
    setAccount(updated as any);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("accountUpdated"));
    }
    addToast("Profile photo removed.", "info");
  }, [account, addToast]);

  const handleSyncGoogle = useCallback(async () => {
    setSyncingGoogle(true);
    try {
      const res = await fetch("/api/auth/sync-google", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success && data.avatar) {
        setAvatar(data.avatar);
        const updated = { ...(account || {}), avatar: data.avatar };
        setAccount(updated as any);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("currentUserAccount", JSON.stringify(updated));
            window.dispatchEvent(new Event("accountUpdated"));
          } catch (_) { }
        }
        addToast("Profile photo synced from Google!", "success");
      } else if (data.requireReauth) {
        await signIn("google", { callbackUrl: "/dashboard/settings?synced=google" });
      } else {
        addToast(data.error || "Could not sync Google photo. Please try signing in with Google.", "error");
      }
    } catch (err: any) {
      console.error("Google sync error:", err);
      try {
        await signIn("google", { callbackUrl: "/dashboard/settings?synced=google" });
      } catch (_) {
        addToast("Failed to connect with Google.", "error");
      }
    } finally {
      setSyncingGoogle(false);
    }
  }, [account, addToast]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("synced") === "google") {
        addToast("Google profile picture synced successfully!", "success");
        window.history.replaceState({}, "", "/dashboard/settings");
        syncWithDatabase().then((data) => {
          if (data?.account) {
            setAccount(data.account);
            if (data.account.avatar) setAvatar(data.account.avatar);
            window.dispatchEvent(new Event("accountUpdated"));
          }
        });
      }
    }
  }, [addToast]);

  const handleUpdatePassword = useCallback(async () => {
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      addToast(passwordError, "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match!", "error");
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePassword",
          data: { email: account!.email, currentPassword, newPassword },
        }),
      });
      if (res.ok) {
        addToast("Password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errData = await res.json();
        addToast(errData.error || "Failed to update password.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update password.", "error");
    } finally {
      setUpdatingPassword(false);
    }
  }, [account, newPassword, confirmPassword, currentPassword, addToast]);

  const handleSaveLeadAlerts = useCallback(async () => {
    setSavingAlerts(true);
    setAlertStatusMsg("");
    try {
      const updated = {
        ...account,
        leadAlertsEnabled,
        notifyEmail: notifyEmail.trim(),
      };
      await saveAccount(updated as any);
      setAccount(updated as any);

      setAlertStatusMsg("Notification preferences saved successfully!");
      addToast("Notification preferences saved successfully!", "success");
      setTimeout(() => setAlertStatusMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      addToast("Failed to save notification settings.", "error");
    } finally {
      setSavingAlerts(false);
    }
  }, [account, leadAlertsEnabled, notifyEmail, addToast]);

  const handleSendTestAlert = useCallback(async () => {
    setSendingTestAlert(true);
    setAlertStatusMsg("");
    const targetEmail = notifyEmail.trim() || email || account?.email || "";
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendTestLeadAlert",
          data: { email: targetEmail },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertStatusMsg(`Test lead alert dispatched to ${targetEmail}!`);
        addToast(`Test lead alert dispatched to ${targetEmail}!`, "success");
      } else {
        addToast(data.error || "Failed to send test alert.", "error");
      }
    } catch (err: any) {
      console.error(err);
      addToast("Failed to send test alert email.", "error");
    } finally {
      setSendingTestAlert(false);
    }
  }, [notifyEmail, email, account?.email, addToast]);

  const handleDeleteAccount = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (deleteConfirmText !== "DELETE") {
        setDeleteError("Please type DELETE to confirm.");
        return;
      }

      setDeleting(true);
      setDeleteError("");
      try {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deleteAccount",
            data: { email: account!.email, password: deletePassword },
          }),
        });
        if (res.ok) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("currentUserAccount");
            localStorage.removeItem("currentUserEmail");
            localStorage.removeItem("currentUserPages");
            localStorage.removeItem("currentUserLeads");
            localStorage.removeItem("currentUserSequences");
            localStorage.removeItem("currentUserIntegrations");
            localStorage.removeItem("currentUserResources");
            localStorage.removeItem("sessionExpiry");
          }
          addToast("Account successfully deleted.", "info");
          setTimeout(() => {
            router.push("/");
          }, 600);
        } else {
          const errData = await res.json();
          setDeleteError(errData.error || "Failed to delete account.");
          addToast(errData.error || "Failed to delete account.", "error");
        }
      } catch (err: any) {
        console.error(err);
        setDeleteError(err.message || "Failed to delete account.");
        addToast(err.message || "Failed to delete account.", "error");
      } finally {
        setDeleting(false);
      }
    },
    [deleteConfirmText, account, deletePassword, router, addToast]
  );

  const inputClass =
    "w-full max-w-lg rounded-xl border border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2.5 text-[14.2px] text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-[#9B9085] focus:border-[#0066B2] transition";

  const labelClass = "block text-[12.2px] font-semibold text-zinc-700 dark:text-[#9B9085] mb-1.5";

  return (
    <DashboardShell account={account} title="Account">
      <div className="flex flex-col min-h-full bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]">
        <div className="flex-1 px-6 py-6 lg:px-8 w-full">
          {/* Page heading */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-3xl font-bold text-zinc-900 dark:text-white">
                Account Settings
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("openHelpTopic", { detail: { topic: "Account settings" } })
                      );
                    }
                  }}
                  className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-full border border-zinc-200 dark:border-[#2e2e38] text-xs font-normal text-zinc-500 dark:text-[#9B9085] hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors"
                  title="View Account Settings Help"
                >
                  ?
                </button>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-1">
                Manage your identity, security, notifications, and workspace resources.
              </p>
            </div>
          </div>

          {/* Segmented Tab Navigation Bar */}
          <div
            className="flex flex-wrap items-center gap-2 mb-6 relative"
            onMouseLeave={() => setHoveredTab(null)}
          >
            {[
              { id: "profile", label: "Profile & Identity", icon: User },
              { id: "security", label: "Security & Password", icon: KeyRound },
              { id: "notifications", label: "Instant Lead Alerts", icon: Bell },
              { id: "usage", label: "Workspace Metrics", icon: BarChart3 },
              { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              const isHovered = hoveredTab === t.id;

              return (
                <motion.button
                  key={t.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 600, damping: 28 }}
                  onMouseEnter={() => setHoveredTab(t.id)}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isActive
                      ? "text-white"
                      : t.danger
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-600 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {/* Active Tab Solid Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      className={`absolute inset-0 rounded-xl shadow-sm ${
                        t.danger ? "bg-red-500" : "bg-[#0066B2]"
                      }`}
                    />
                  )}
                  {/* Hover Morphing Pill */}
                  {!isActive && isHovered && (
                    <motion.div
                      layoutId="settingsHoverTabPill"
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      className={`absolute inset-0 rounded-xl ${
                        t.danger
                          ? "bg-red-50 dark:bg-red-950/40"
                          : "bg-zinc-200/60 dark:bg-zinc-800/60"
                      }`}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{t.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              {/* TAB 1: Profile & Identity */}
              {activeTab === "profile" && (
                <motion.section
                  key="profile"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-zinc-200/80 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/30 dark:bg-[#1a2638] text-[#0066B2]">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Who you are</h4>
                      <p className="text-[12.2px] text-[#71717a] dark:text-[#9B9085] mt-0.5">{email}</p>
                    </div>
                  </div>

                  <div className="mt-5 pl-12 space-y-5 max-w-2xl">
                    {/* Profile Avatar Upload */}
                    <div className="flex items-center gap-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                      <div className="relative group shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="Profile Avatar"
                            decoding="async"
                            fetchPriority="high"
                            className="h-20 w-20 rounded-full object-cover border-2 border-[#0066B2] shadow-md"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0066B2] to-[#004B82] text-white font-extrabold text-2xl shadow-md border-2 border-[#0066B2]/40">
                            {name
                              ? name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)
                              : "U"}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                          title="Upload profile photo"
                        >
                          {uploadingAvatar ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                          ) : (
                            <Camera className="h-3.5 w-3.5 text-[#0066B2]" />
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Profile Photo</h5>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          JPG, PNG or WEBP (Max 5 MB). Compressed automatically to high-speed WebP.
                        </p>
                        <div className="flex items-center gap-2.5 pt-1">
                          <input
                            type="file"
                            ref={avatarInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadingAvatar || syncingGoogle}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121214] px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                          >
                            <Upload className="h-3.5 w-3.5 text-[#0066B2]" />
                            {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                          </button>

                          <button
                            type="button"
                            onClick={handleSyncGoogle}
                            disabled={syncingGoogle || uploadingAvatar}
                            className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121214] px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                            title="Sync avatar from your Google account"
                          >
                            {syncingGoogle ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                            ) : (
                              <svg width={14} height={14} viewBox="0 0 24 24" className="shrink-0">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                            )}
                            <span>{syncingGoogle ? "Syncing..." : "Sync with Google"}</span>
                          </button>

                          {avatar && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline transition cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full max-w-lg rounded-xl border border-[#E2E8F0] bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2.5 text-[14.2px] text-zinc-500 dark:text-white outline-none opacity-60 cursor-not-allowed transition"
                      />
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                        Primary account identifier. Contact support to change your account email.
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end max-w-lg">
                      <button
                        onClick={handleUpdateName}
                        disabled={updatingName}
                        className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-5 py-2.5 text-[12.2px] font-bold text-white hover:bg-[#005799] disabled:opacity-60 transition shadow-sm cursor-pointer"
                      >
                        {updatingName ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-white stroke-[2.5px]" />
                        )}
                        {updatingName ? "Updating..." : "Update name"}
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* TAB 2: Security & Password */}
              {activeTab === "security" && (
                <motion.section
                  key="security"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-zinc-200/80 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/30 dark:bg-[#1a2638] text-[#0066B2]">
                      <KeyRound className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">Change password</h4>
                      <p className="text-[12.2px] text-[#71717a] dark:text-[#9B9085] mt-0.5">
                        Use at least 8 characters with numbers and symbols.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pl-12 space-y-4 max-w-lg">
                    <div>
                      <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">
                        Current password
                      </label>
                      <PasswordInputWithStrength
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        showStrengthMeter={false}
                      />
                    </div>
                    <div>
                      <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">
                        New password
                      </label>
                      <PasswordInputWithStrength
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        showStrengthMeter={true}
                      />
                    </div>
                    <div>
                      <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">
                        Confirm new password
                      </label>
                      <PasswordInputWithStrength
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Type it again"
                        autoComplete="new-password"
                        showStrengthMeter={false}
                      />
                    </div>

                    <div className="pt-2 flex justify-end max-w-lg">
                      <button
                        onClick={handleUpdatePassword}
                        disabled={updatingPassword}
                        className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-5 py-2.5 text-[12.2px] font-bold text-white hover:bg-[#005799] disabled:opacity-60 transition shadow-sm cursor-pointer"
                      >
                        {updatingPassword ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          <KeyRound className="h-3.5 w-3.5 text-white stroke-[2.5px]" />
                        )}
                        {updatingPassword ? "Updating..." : "Update password"}
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* TAB 3: Instant Lead Email Alerts */}
              {activeTab === "notifications" && (
                <motion.section
                  key="notifications"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-zinc-200/80 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/30 dark:bg-[#1a2638] text-[#0066B2]">
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Instant Lead Email Alerts
                            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              Active Feature
                            </span>
                          </h4>
                          <p className="text-[12.2px] text-[#71717a] dark:text-[#9B9085] mt-0.5">
                            Receive instant email notifications as soon as a new visitor submits their email on any lead magnet.
                          </p>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => setLeadAlertsEnabled(!leadAlertsEnabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            leadAlertsEnabled ? "bg-[#0066B2]" : "bg-zinc-300 dark:bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              leadAlertsEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {leadAlertsEnabled && (
                    <div className="mt-5 pl-12 space-y-4 max-w-lg">
                      <div>
                        <label className="block text-[12.2px] font-semibold text-[#71717a] dark:text-[#9B9085] mb-1.5">
                          Target Notification Inbox Email
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.value)}
                            placeholder={email || "your-email@example.com"}
                            className="w-full rounded-xl border border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-3.5 py-2.5 text-[14.2px] text-zinc-900 dark:text-white outline-none placeholder:text-[#9B9085] focus:border-[#0066B2] transition"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                          New lead alerts will be sent to this email address immediately after signup.
                        </p>
                      </div>

                      {alertStatusMsg && (
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {alertStatusMsg}
                        </div>
                      )}

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={handleSendTestAlert}
                          disabled={sendingTestAlert}
                          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121214] px-4 py-2 text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                          {sendingTestAlert ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0066B2]" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {sendingTestAlert ? "Sending..." : "Send Test Alert Email"}
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveLeadAlerts}
                          disabled={savingAlerts}
                          className="flex items-center gap-1.5 rounded-lg bg-[#0066B2] px-5 py-2 text-[12.2px] font-bold text-white hover:bg-[#005799] disabled:opacity-60 transition shadow-sm cursor-pointer"
                        >
                          {savingAlerts ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-white stroke-[2.5px]" />
                          )}
                          {savingAlerts ? "Saving..." : "Save alert preferences"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.section>
              )}

              {/* TAB 4: Workspace Metrics & Storage */}
              {activeTab === "usage" && (
                <motion.section
                  key="usage"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-zinc-200/80 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#0066B2]/30 bg-[#EFF6FF] dark:border-[#0066B2]/30 dark:bg-[#1a2638] text-[#0066B2]">
                      <BarChart3 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[14.2px] font-bold text-zinc-900 dark:text-white">
                        Workspace Metrics & Resources
                      </h4>
                      <p className="text-[12.2px] text-[#71717a] dark:text-[#9B9085] mt-0.5">
                        Real-time overview of your captured leads, cloud storage, and automation resources.
                      </p>
                    </div>
                  </div>

                  {/* High Level Stats Grid */}
                  <div className="mt-6 pl-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Total Leads</span>
                        <div className="p-1.5 rounded-lg bg-[#EFF6FF] dark:bg-[#1a2638] text-[#0066B2]">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                        {leadCount.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Captured across all magnets</span>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Lead Magnets</span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <Layers className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                        {totalPagesCount}
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Published landing pages</span>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Live Sequences</span>
                        <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                        {activeSequencesCount}
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Active email automations</span>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Storage Used</span>
                        <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                          <Database className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                        {storageMb} MB
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">PDFs, images & assets</span>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* TAB 5: Danger Zone */}
              {activeTab === "danger" && (
                <motion.section
                  key="danger"
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#18181B] p-6 transition-colors shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 dark:border-[#552e2e] dark:bg-[#2a1414] text-red-600 dark:text-[#FF8585]">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14.2px] font-bold text-red-600 dark:text-[#FF8585]">Danger zone</h4>
                      <p className="text-[12.2px] text-[#9B9085] leading-relaxed mt-1">
                        Deleting your account removes your magnets, signups, integrations, and any custom domains attached to your account. This is permanent. There is no recovery.
                      </p>

                      {deleteError && (
                        <div className="mt-3 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded p-2 max-w-md">
                          {deleteError}
                        </div>
                      )}

                      {!showDeleteConfirm ? (
                        <div className="mt-5 flex justify-start">
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-[14px] py-[8px] text-sm font-extrabold text-red-600 dark:text-[#FF8585] hover:border-red-400 dark:hover:border-red-800 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 stroke-[3px]" />
                            Delete account
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleDeleteAccount} className="mt-5 space-y-4 max-w-2xl">
                          <div>
                            <label className={labelClass}>Confirm with your password</label>
                            <input
                              type="password"
                              required
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Type DELETE to confirm</label>
                            <input
                              type="text"
                              required
                              placeholder="DELETE"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className={inputClass}
                            />
                            <span className="block text-[10px] text-[#5c5650] mt-1">
                              Case-sensitive.
                            </span>
                          </div>

                          <div className="pt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeletePassword("");
                                setDeleteConfirmText("");
                                setDeleteError("");
                              }}
                              className="rounded-md border border-[#E2E8F0] bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-[14px] py-[8px] text-sm font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#2e2e38] transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={deleting}
                              className="flex items-center gap-1.5 rounded-md border border-red-200 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] px-[14px] py-[8px] text-sm font-extrabold text-red-600 dark:text-[#FF8585] hover:border-red-400 dark:hover:border-red-800 disabled:opacity-60 transition cursor-pointer"
                            >
                              {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="h-4 w-4 stroke-[3px]" />
                              )}
                              {deleting ? "Deleting..." : "Delete permanently"}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modern Non-Blocking Toast Notification Container */}
      <AccountToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </DashboardShell>
  );
}
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
  UploadCloud,
  Lock,
  FileText,
  Trash2,
  Link2,
  Search,
  Check,
  HardDrive,
  Layers,
  Download,
  FileCode,
  Image as ImageIcon,
  Film,
  Archive,
  Sparkles,
  AlertCircle,
  X,
  Send,
  Loader2,
  Plus,
  ChevronDown,
  Pencil
} from "lucide-react";
import { syncWithDatabase, loadResources, loadAccount } from "@/lib/store";
import type { Account } from "@/lib/data";

interface Resource {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface UploadProgressState {
  current: number;
  total: number;
  currentFileName: string;
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  stage: "uploading" | "saving";
}

export default function ResourcesPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Active XHR reference & cancellation tracking
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "docs" | "images" | "media" | "archives">("all");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size" | "name">("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // In-place rename state
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);



  useEffect(() => {
    // Load local data instantly
    const localResources = loadResources().filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
    const localAccount = loadAccount();
    if (localResources.length > 0) setResources(localResources);
    if (localAccount) setAccount(localAccount);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        setAccount(data.account);
        if (data.resources) {
          const filtered = data.resources.filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
          setResources(filtered);
        }
      }
    });
  }, []);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const startRenaming = (resource: Resource) => {
    setEditingResourceId(resource.id);
    setEditingName(resource.name);
  };

  const handleSaveRename = async (resource: Resource) => {
    if (!editingName.trim()) {
      addToast("error", "Asset name cannot be empty.");
      return;
    }

    const trimmed = editingName.trim();
    if (trimmed === resource.name) {
      setEditingResourceId(null);
      return;
    }

    // Preserve original file extension if omitted
    const originalExt = resource.name.includes(".") ? resource.name.split(".").pop() : "";
    let finalName = trimmed;
    if (originalExt && !finalName.toLowerCase().endsWith(`.${originalExt.toLowerCase()}`)) {
      finalName = `${finalName}.${originalExt}`;
    }

    setIsSavingName(true);

    try {
      // Optimistic update
      setResources((prev) => {
        const updated = prev.map((r) => (r.id === resource.id ? { ...r, name: finalName } : r));
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserResources", JSON.stringify(updated));
        }
        return updated;
      });

      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateResource",
          data: { id: resource.id, name: finalName },
        }),
      });

      if (res.ok) {
        addToast("success", `Renamed to "${finalName}"`);
      } else {
        addToast("error", "Failed to save new name in database.");
      }
    } catch (err) {
      console.error("Failed to rename resource", err);
      addToast("error", "Error renaming resource.");
    } finally {
      setIsSavingName(false);
      setEditingResourceId(null);
    }
  };

  const cancelUpload = () => {
    isCancelledRef.current = true;
    if (activeXhrRef.current) {
      try {
        activeXhrRef.current.abort();
      } catch (e) {
        // Ignore abort error
      }
      activeXhrRef.current = null;
    }
    setUploading(false);
    setUploadProgress(null);
    setIsDragOver(false);
    addToast("info", "Upload was cancelled.");
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return;

    const MAX_SIZE = 15 * 1024 * 1024;
    const validFiles: File[] = [];
    const oversizedFiles: File[] = [];

    for (const f of rawFiles) {
      if (f.size > MAX_SIZE) {
        oversizedFiles.push(f);
      } else {
        validFiles.push(f);
      }
    }

    if (oversizedFiles.length > 0) {
      if (oversizedFiles.length === 1) {
        addToast("error", `"${oversizedFiles[0].name}" exceeds 15 MB limit and was skipped.`);
      } else {
        addToast("error", `${oversizedFiles.length} files exceeded 15 MB limit and were skipped.`);
      }
    }

    if (validFiles.length === 0) {
      setIsDragOver(false);
      return;
    }

    setUploading(true);
    isCancelledRef.current = false;
    const newlyUploaded: Resource[] = [];
    let failedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      if (isCancelledRef.current) break;

      const file = validFiles[i];
      setUploadProgress({
        current: i + 1,
        total: validFiles.length,
        currentFileName: file.name,
        loadedBytes: 0,
        totalBytes: file.size,
        percent: 0,
        stage: "uploading",
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        const currentUserEmail = localStorage.getItem("currentUserEmail") || account?.email || "";
        if (currentUserEmail) {
          formData.append("userEmail", currentUserEmail);
        }

        const json = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          activeXhrRef.current = xhr;

          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && !isCancelledRef.current) {
              const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
              setUploadProgress({
                current: i + 1,
                total: validFiles.length,
                currentFileName: file.name,
                loadedBytes: event.loaded,
                totalBytes: event.total,
                percent,
                stage: percent >= 99 ? "saving" : "uploading",
              });
            }
          };

          xhr.onload = () => {
            activeXhrRef.current = null;
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                setUploadProgress({
                  current: i + 1,
                  total: validFiles.length,
                  currentFileName: file.name,
                  loadedBytes: file.size,
                  totalBytes: file.size,
                  percent: 100,
                  stage: "saving",
                });
                resolve(JSON.parse(xhr.responseText));
              } catch (parseErr) {
                reject(parseErr);
              }
            } else {
              try {
                const errJson = JSON.parse(xhr.responseText);
                reject(new Error(errJson.error || `Upload failed (${xhr.status})`));
              } catch {
                reject(new Error(`Upload failed (${xhr.status})`));
              }
            }
          };

          xhr.onerror = () => {
            activeXhrRef.current = null;
            reject(new Error("Network connection error"));
          };

          xhr.onabort = () => {
            activeXhrRef.current = null;
            reject(new Error("Upload cancelled"));
          };

          xhr.send(formData);
        });

        if (json && json.data) {
          newlyUploaded.unshift(json.data);
        } else {
          failedCount++;
        }
      } catch (err: any) {
        activeXhrRef.current = null;
        if (err?.message === "Upload cancelled" || isCancelledRef.current) {
          break;
        }
        failedCount++;
        console.error(`Error uploading ${file.name}:`, err);
      }
    }

    if (newlyUploaded.length > 0) {
      setResources((prev) => {
        const updated = [...newlyUploaded, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserResources", JSON.stringify(updated));
        }
        return updated;
      });

      if (!isCancelledRef.current) {
        if (newlyUploaded.length === 1 && failedCount === 0) {
          addToast("success", `"${newlyUploaded[0].name}" uploaded successfully and ready for delivery!`);
        } else if (failedCount === 0) {
          addToast("success", `All ${newlyUploaded.length} resources uploaded successfully!`);
        } else {
          addToast("info", `${newlyUploaded.length} uploaded successfully (${failedCount} failed).`);
        }
      }
    } else if (failedCount > 0 && !isCancelledRef.current) {
      addToast("error", "Failed to upload selected file(s). Please check network and try again.");
    }

    setUploading(false);
    setUploadProgress(null);
    setIsDragOver(false);
    activeXhrRef.current = null;
  };

  const handleSimulatedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await uploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const confirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteResource", data: { id: resourceToDelete.id } }),
      });

      if (res.ok) {
        setResources((prev) => {
          const updated = prev.filter((r) => r.id !== resourceToDelete.id);
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUserResources", JSON.stringify(updated));
          }
          return updated;
        });
        setSelectedResourceIds((prev) => prev.filter((id) => id !== resourceToDelete.id));
        addToast("info", `Resource "${resourceToDelete.name}" deleted.`);
      } else {
        addToast("error", "Failed to delete resource");
      }
    } catch (err) {
      console.error("Failed to delete resource", err);
      addToast("error", "Error deleting resource.");
    } finally {
      setIsDeleting(false);
      setResourceToDelete(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedResourceIds.length === 0) return;
    setIsBulkDeleting(true);

    try {
      let successCount = 0;
      for (const id of selectedResourceIds) {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteResource", data: { id } }),
        });
        if (res.ok) successCount++;
      }

      setResources((prev) => {
        const updated = prev.filter((r) => !selectedResourceIds.includes(r.id));
        if (typeof window !== "undefined") {
          localStorage.setItem("currentUserResources", JSON.stringify(updated));
        }
        return updated;
      });

      addToast("info", `Deleted ${successCount} hosted resource(s).`);
      setSelectedResourceIds([]);
    } catch (err) {
      console.error("Failed to bulk delete resources", err);
      addToast("error", "Error deleting selected resources.");
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  const copyToClipboard = useCallback((url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast("success", "Link copied! Paste it into lead magnets or email sequences.");
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }, [addToast]);

  const formatBytes = useCallback((bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }, []);

  // Extension helpers for icons & badges
  const getFileCategory = useCallback((filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["pdf", "doc", "docx", "txt", "rtf", "xlsx", "pptx"].includes(ext)) return "docs";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "images";
    if (["mp4", "mp3", "mov", "avi", "wav", "m4a"].includes(ext)) return "media";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archives";
    return "docs";
  }, []);

  const getFileBadge = useCallback((filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "file";
    const category = getFileCategory(filename);

    switch (category) {
      case "images":
        return {
          icon: <ImageIcon className="h-4 w-4 text-emerald-500" />,
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          ext: ext.toUpperCase(),
        };
      case "media":
        return {
          icon: <Film className="h-4 w-4 text-purple-500" />,
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          ext: ext.toUpperCase(),
        };
      case "archives":
        return {
          icon: <Archive className="h-4 w-4 text-amber-500" />,
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          ext: ext.toUpperCase(),
        };
      default:
        if (ext === "pdf") {
          return {
            icon: <FileText className="h-4 w-4 text-red-500" />,
            bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
            ext: "PDF",
          };
        }
        return {
          icon: <FileCode className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />,
          bg: "bg-[#0066B2]/10 text-[#0066B2] dark:text-[#38BDF8] border-[#0066B2]/20",
          ext: ext.toUpperCase(),
        };
    }
  }, [getFileCategory]);

  // Filtering & Sorting
  const totalSizeBytes = useMemo(() => {
    return resources.reduce((acc, r) => acc + (r.size || 0), 0);
  }, [resources]);

  const storagePercentage = useMemo(() => {
    const maxStorageBytes = 500 * 1024 * 1024; // 500 MB quota
    return Math.min(100, Math.round((totalSizeBytes / maxStorageBytes) * 100));
  }, [totalSizeBytes]);

  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources
      .filter((r: any) => {
        if (r.isPageAsset === true || r.type === "page_asset" || (r.name && r.name.startsWith("page_asset_"))) {
          return false;
        }
        const matchesSearch = !q || r.name.toLowerCase().includes(q);
        if (!matchesSearch) return false;
        if (activeCategory === "all") return true;
        return getFileCategory(r.name) === activeCategory;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "size") return (b.size || 0) - (a.size || 0);
        if (sortBy === "oldest") return a.id.localeCompare(b.id);
        return b.id.localeCompare(a.id);
      });
  }, [resources, searchQuery, activeCategory, sortBy, getFileCategory]);

  return (
    <DashboardShell account={account} title="Assets">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative flex flex-col min-h-[calc(100vh-3rem)] bg-gradient-to-b from-[#EFF6FF]/50 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0E0E10]"
      >

        {/* Global Drag Overlay when dragging files anywhere onto the page */}
        {isDragOver && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0066B2]/85 backdrop-blur-md text-white p-6 animate-in fade-in duration-200">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-2xl animate-bounce">
              <UploadCloud className="h-10 w-10 text-white" />
            </div>
            <h3 className="mt-4 text-2xl font-bold">Drop your file(s) to upload instantly</h3>
            <p className="mt-1 text-sm text-blue-100">Supports multi-file upload · PDF, DOCX, ZIP, MP4, Images up to 15 MB</p>
          </div>
        )}

        <div className="flex-1 px-6 py-6 lg:px-8 max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Assets
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="h-3 w-3" /> Ready for Email Delivery
                </span>
              </div>
            </div>

            <div className="relative group shrink-0">
              <input
                type="file"
                id="resource-upload-header"
                multiple
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-20"
                onChange={handleSimulatedUpload}
                disabled={uploading}
              />
              <button
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0066B2] group-hover:bg-[#004A85] px-4 py-2.5 text-xs font-semibold text-white shadow-sm group-hover:shadow-md group-hover:shadow-[#0066B2]/30 disabled:opacity-60 transition-colors duration-200 cursor-pointer border border-white/20 group-hover:border-white/40 dark:border-white/10"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>
                      {uploadProgress
                        ? `Uploading (${uploadProgress.current}/${uploadProgress.total})...`
                        : "Uploading files..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 stroke-[2.25] transition-transform duration-300 group-hover:rotate-90" />
                    <span className="tracking-tight">Upload Resources</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Premium Overview Metrics Bar */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">Total Resources</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{resources.length} {resources.length === 1 ? "File" : "Files"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-[#0066B2]" /> Storage Used
                </p>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{formatBytes(totalSizeBytes)}</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-[#25252A]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(storagePercentage, 2)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider">Email Delivery Status</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active & Automated
                </p>
              </div>
            </div>
          </div>

          {/* Option 1: SMART EMPTY STATE DROPZONE (Only rendered when user has NO files) */}
          {resources.length === 0 && (
            <div className="relative mt-6 rounded-2xl border-2 border-dashed border-[#0066B2]/40 bg-white/90 p-12 text-center backdrop-blur-sm hover:border-[#0066B2] dark:border-[#0066B2]/40 dark:bg-[#18181B]/90 shadow-sm transition-all">
              <input
                type="file"
                multiple
                className="absolute inset-0 cursor-pointer opacity-0 z-10"
                onChange={handleSimulatedUpload}
                disabled={uploading}
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                {uploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <UploadCloud className="h-7 w-7" />}
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                {uploading
                  ? uploadProgress
                    ? `Uploading (${uploadProgress.current} of ${uploadProgress.total}): ${uploadProgress.currentFileName}`
                    : "Uploading documents..."
                  : "Drag & Drop lead magnet files here"}
              </h3>
              <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0066B2] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#005291] transition cursor-pointer">
                <UploadCloud className="h-4 w-4" /> Browse Files from Device
              </button>
            </div>
          )}



          {/* Search & Filter Toolbar (Only when files exist or searching) */}
          {resources.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Category Tabs with Framer Motion Spring Pill */}
              <div
                onMouseLeave={() => setHoveredCategory(null)}
                className="relative flex flex-wrap sm:flex-nowrap items-center gap-1.5 scrollbar-none"
              >
                {(
                  [
                    { id: "all", label: "All Files" },
                    { id: "docs", label: "Documents" },
                    { id: "images", label: "Images" },
                    { id: "media", label: "Audio & Video" },
                    { id: "archives", label: "Archives" },
                  ] as const
                ).map((tab) => {
                  const isActive = activeCategory === tab.id;
                  const isHovered = hoveredCategory === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id)}
                      onMouseEnter={() => setHoveredCategory(tab.id)}
                      className={`relative rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        isActive
                          ? "text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      {/* Active Tab Solid Sliding Pill */}
                      {isActive && (
                        <motion.div
                          layoutId="activeAssetCategoryTab"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-[#0066B2] shadow-sm"
                        />
                      )}

                      {/* Hover Morphing Pill */}
                      {!isActive && isHovered && (
                        <motion.div
                          layoutId="hoverAssetCategoryTab"
                          transition={{ type: "spring", stiffness: 500, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-zinc-200/60 dark:bg-white/10"
                        />
                      )}

                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search, Bulk Action & Sort */}
              <div className="flex items-center gap-2">
                {selectedResourceIds.length > 0 && (
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Selected ({selectedResourceIds.length})</span>
                  </button>
                )}

                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-white dark:placeholder-zinc-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Custom Glassy Sort Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSortOpen((prev) => !prev);
                    }}
                    className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs backdrop-blur-md transition-all hover:bg-white/90 focus:outline-none dark:border-white/10 dark:bg-[#18181B]/80 dark:text-zinc-200 dark:hover:bg-[#222226] cursor-pointer"
                  >
                    <span>
                      Sort: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "size" ? "File Size" : "Name (A-Z)"}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-300 ${isSortOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isSortOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: -4 }}
                          transition={{ type: "spring", damping: 28, stiffness: 400 }}
                          className="absolute right-0 mt-1.5 z-50 w-44 rounded-xl border border-zinc-200/60 bg-white/85 p-1 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-[#18181F]/95 dark:text-white dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
                        >
                          {[
                            { id: "newest", label: "Sort: Newest" },
                            { id: "oldest", label: "Sort: Oldest" },
                            { id: "size", label: "Sort: File Size" },
                            { id: "name", label: "Sort: Name (A-Z)" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortBy(opt.id as any);
                                setIsSortOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer ${sortBy === opt.id
                                ? "bg-zinc-100 text-zinc-900 font-bold dark:bg-white/10 dark:text-[#38BDF8] dark:border dark:border-white/10"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                                }`}
                            >
                              <span>{opt.label}</span>
                              {sortBy === opt.id && <Check className="h-3.5 w-3.5 text-current shrink-0" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {/* Resources Table Container */}
          {resources.length > 0 && (
            <div className="mt-4">
              {filteredResources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 py-12 text-center dark:border-[#2e2e38] dark:bg-[#18181B]/80 shadow-sm backdrop-blur-sm">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                    No matching resources found
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-[#9B9085]">
                    Try clearing your search term or changing category filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200/80 dark:divide-[#2e2e38]">
                      <thead className="bg-[#F8FBFF] dark:bg-[#151518]">
                        <tr>
                          <th className="px-4 py-3.5 text-center w-10">
                            <input
                              type="checkbox"
                              checked={filteredResources.length > 0 && selectedResourceIds.length === filteredResources.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedResourceIds(filteredResources.map((r) => r.id));
                                } else {
                                  setSelectedResourceIds([]);
                                }
                              }}
                              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                              title="Select All On Page"
                            />
                          </th>
                          <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Resource Name</th>
                          <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Size</th>
                          <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Uploaded Date & Time</th>
                          <th className="px-6 py-3.5 text-right text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white dark:divide-[#222228] dark:bg-[#18181B]">
                        {filteredResources.map((resource) => {
                          const badge = getFileBadge(resource.name);
                          const isCopied = copiedId === resource.id;
                          const isSelected = selectedResourceIds.includes(resource.id);

                          return (
                            <tr key={resource.id} className={`transition-colors ${isSelected ? "bg-[#EFF6FF] dark:bg-[#0066B2]/10" : "hover:bg-[#EFF6FF]/40 dark:hover:bg-[#1C1C22]/60"}`}>
                              <td className="px-4 py-4 text-center w-10">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedResourceIds((prev) => [...prev, resource.id]);
                                    } else {
                                      setSelectedResourceIds((prev) => prev.filter((id) => id !== resource.id));
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                                />
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${badge.bg}`}>
                                    {badge.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {editingResourceId === resource.id ? (
                                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="text"
                                          value={editingName}
                                          onChange={(e) => setEditingName(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveRename(resource);
                                            if (e.key === "Escape") setEditingResourceId(null);
                                          }}
                                          autoFocus
                                          disabled={isSavingName}
                                          className="w-full min-w-[200px] max-w-sm rounded-lg border border-[#0066B2] bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0066B2]/20 dark:border-[#38BDF8] dark:bg-[#202026] dark:text-white"
                                        />
                                        <button
                                          onClick={() => handleSaveRename(resource)}
                                          disabled={isSavingName}
                                          className="rounded-lg bg-[#0066B2] p-1.5 text-white hover:bg-[#005291] transition cursor-pointer"
                                          title="Save Name"
                                        >
                                          {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                        </button>
                                        <button
                                          onClick={() => setEditingResourceId(null)}
                                          disabled={isSavingName}
                                          className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-[#202026] dark:text-zinc-400 transition cursor-pointer"
                                          title="Cancel"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="group/title flex items-center gap-2">
                                        <p
                                          onDoubleClick={() => startRenaming(resource)}
                                          className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-xs md:max-w-md cursor-pointer hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition-colors"
                                          title="Double-click or click pencil to rename"
                                        >
                                          {resource.name}
                                        </p>
                                        <button
                                          onClick={() => startRenaming(resource)}
                                          className="opacity-0 group-hover/title:opacity-100 p-1 text-zinc-400 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition cursor-pointer rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                                          title="Rename asset"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">
                                          {badge.ext}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {formatBytes(resource.size)}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {resource.uploadedAt}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Direct Download Link */}
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Test download file"
                                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 dark:hover:bg-[#282830] transition shadow-xs"
                                  >
                                    <Download className="h-3.5 w-3.5 text-zinc-500" /> Direct Test
                                  </a>

                                  {/* Copy Link Button */}
                                  <button
                                    onClick={() => copyToClipboard(resource.url, resource.id)}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-xs cursor-pointer ${isCopied
                                      ? "bg-emerald-500 text-white"
                                      : "bg-[#0066B2] text-white hover:bg-[#005291]"
                                      }`}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-white" /> Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Link2 className="h-3.5 w-3.5" /> Copy Link
                                      </>
                                    )}
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => setResourceToDelete(resource)}
                                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition cursor-pointer"
                                    title="Delete Resource"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
          )}
        </div>

        {/* Bulk Delete Confirmation Modal */}
        <AnimatePresence>
          {showBulkDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setShowBulkDeleteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 8 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
                  Delete {selectedResourceIds.length} Selected Resources?
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-[#9B9085]">
                  Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{selectedResourceIds.length} hosted resources</strong>? Any active lead magnet forms or emails linking to these file links will no longer be able to access them.
                </p>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    disabled={isBulkDeleting}
                    onClick={() => setShowBulkDeleteModal(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isBulkDeleting}
                    onClick={confirmBulkDelete}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                  >
                    {isBulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>Delete {selectedResourceIds.length} Resources</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {resourceToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setResourceToDelete(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 8 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border border-zinc-200 dark:border-[#2e2e38]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">Delete Hosted Resource?</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-[#9B9085]">
                  Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{resourceToDelete.name}</strong>? Any active lead magnet forms or emails linking to this file link will no longer be able to access it.
                </p>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    disabled={isDeleting}
                    onClick={() => setResourceToDelete(null)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 dark:hover:bg-[#282830] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                  >
                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>Delete Resource</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Upload Live Progress Card */}
        <AnimatePresence>
          {uploading && uploadProgress && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed bottom-24 right-5 z-50 w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-[#18181B]/95 text-zinc-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    <UploadCloud className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      Uploading {uploadProgress.current} of {uploadProgress.total}
                    </h4>
                    <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[170px]">
                      {uploadProgress.currentFileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-full bg-[#0066B2]/10 px-2 py-0.5 text-[10px] font-bold text-[#0066B2] dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                    {uploadProgress.stage === "saving" ? "Finalizing" : `${uploadProgress.percent}%`}
                  </span>
                  <button
                    onClick={cancelUpload}
                    title="Cancel upload"
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Track */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0066B2] via-[#38BDF8] to-emerald-400 transition-all duration-150"
                    style={{ width: `${Math.max(uploadProgress.percent, 4)}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                <span>
                  {formatBytes(uploadProgress.loadedBytes)} of {formatBytes(uploadProgress.totalBytes)}
                </span>
                <span>
                  {uploadProgress.stage === "saving" ? "Optimizing & saving..." : "Uploading data..."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toast Notification Container — Glassmorphic Right Stack */}
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none max-w-sm w-full flex flex-col-reverse gap-2 items-end">
          {toasts.map((toast, idx) => {
            const reverseIdx = toasts.length - 1 - idx;
            const translateY = -reverseIdx * 6;
            const scale = Math.max(0.88, 1 - reverseIdx * 0.04);

            return (
              <div
                key={toast.id}
                style={{
                  transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                  transformOrigin: "bottom right",
                  zIndex: 100 - reverseIdx,
                }}
                className={`w-full pointer-events-auto flex items-center gap-3 rounded-2xl p-4 text-xs font-bold shadow-2xl backdrop-blur-2xl border transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 ring-1 ring-white/10 ${toast.type === "success"
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-100 shadow-black/80"
                  : toast.type === "error"
                    ? "bg-red-950/50 border-red-500/40 text-red-100 shadow-black/80"
                    : "bg-black/60 border-white/20 text-white shadow-black/80"
                  }`}
              >
                {toast.type === "success" && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
                {toast.type === "info" && <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />}
                <span className="flex-1 leading-snug">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-zinc-400 hover:text-white transition cursor-pointer p-0.5 rounded-md hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}

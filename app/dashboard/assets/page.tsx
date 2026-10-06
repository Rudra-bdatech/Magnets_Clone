"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { syncWithDatabase, loadResources, loadAccount, loadPages, loadLeads } from "@/lib/store";
import type { Account, MagnetPage, Lead } from "@/lib/data";
import { MobileAssetCard } from "@/components/assets/MobileAssetCard";
import { AppleCheckbox } from "@/components/leads/AppleCheckbox";

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
  const [magnetPages, setMagnetPages] = useState<MagnetPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
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
  const sortRef = useRef<HTMLDivElement>(null);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const mobileCategoryRef = useRef<HTMLDivElement>(null);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const mobileSortRef = useRef<HTMLDivElement>(null);
  const [isMobileSelectionMode, setIsMobileSelectionMode] = useState(false);
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

  // Close popovers on outside click
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (mobileCategoryRef.current && !mobileCategoryRef.current.contains(e.target as Node)) {
        setIsMobileCategoryOpen(false);
      }
      if (mobileSortRef.current && !mobileSortRef.current.contains(e.target as Node)) {
        setIsMobileSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);



  useEffect(() => {
    // Load local data instantly
    const localResources = loadResources().filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
    const localAccount = loadAccount();
    const localPages = loadPages();
    const localLeads = loadLeads();
    if (localResources.length > 0) setResources(localResources);
    if (localAccount) setAccount(localAccount);
    if (localPages.length > 0) setMagnetPages(localPages);
    if (localLeads.length > 0) setLeads(localLeads);
    setLoading(false);

    // Sync in background silently
    syncWithDatabase().then((data) => {
      if (data) {
        if (data.account) setAccount(data.account);
        if (data.resources) {
          const filtered = data.resources.filter((r: any) => !r.isPageAsset && r.type !== "page_asset");
          setResources(filtered);
        }
        if (data.pages) setMagnetPages(data.pages);
        if (data.leads) setLeads(data.leads);
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

    const brandBg = "bg-[#0066B2]/[0.08] dark:bg-[#38BDF8]/10 border-[#0066B2]/20 dark:border-[#38BDF8]/20 shadow-2xs backdrop-blur-md";
    const brandTag = "bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] border-[#0066B2]/20 dark:border-[#38BDF8]/30";

    switch (category) {
      case "images":
        return {
          icon: <ImageIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />,
          bg: "bg-emerald-500/[0.08] dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/20 shadow-2xs backdrop-blur-md",
          tagBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20",
          ext: ext.toUpperCase(),
        };
      case "media":
        return {
          icon: <Film className="h-4 w-4 text-purple-500 dark:text-purple-400" />,
          bg: "bg-purple-500/[0.08] dark:bg-purple-500/10 border-purple-500/20 dark:border-purple-500/20 shadow-2xs backdrop-blur-md",
          tagBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 border-purple-500/20",
          ext: ext.toUpperCase(),
        };
      case "archives":
        return {
          icon: <Archive className="h-4 w-4 text-amber-500 dark:text-amber-400" />,
          bg: "bg-amber-500/[0.08] dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/20 shadow-2xs backdrop-blur-md",
          tagBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/20",
          ext: ext.toUpperCase(),
        };
      default:
        if (ext === "pdf") {
          return {
            icon: <FileText className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />,
            bg: brandBg,
            tagBg: brandTag,
            ext: "PDF",
          };
        }
        return {
          icon: <FileCode className="h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />,
          bg: brandBg,
          tagBg: brandTag,
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

  // Check which lead magnets link to a given resource
  const getResourceLinkedPages = useCallback(
    (resId: string) => {
      return magnetPages.filter(
        (p) =>
          p.resourceId === resId ||
          (p.assetUrl && p.assetUrl.includes(resId)) ||
          (p.emailBody && p.emailBody.includes(resId)) ||
          p.id === resId ||
          (p.pdfUrl && p.pdfUrl.includes(resId))
      );
    },
    [magnetPages]
  );

  // Calculate linked magnets statistics
  const linkedStats = useMemo(() => {
    let linkedCount = 0;
    resources.forEach((r) => {
      const isLinked = magnetPages.some((p) =>
        p.resourceId === r.id ||
        (p.assetUrl && p.assetUrl.includes(r.id)) ||
        (p.emailBody && p.emailBody.includes(r.id)) ||
        p.id === r.id ||
        (p.pdfUrl && p.pdfUrl.includes(r.id))
      );
      if (isLinked) linkedCount++;
    });
    const unlinkedCount = Math.max(0, resources.length - linkedCount);
    return { linkedCount, unlinkedCount };
  }, [resources, magnetPages]);

  // Calculate total deliveries from leads data
  const totalDeliveries = useMemo(() => {
    return leads.filter((l) => {
      if (l.status === "delivered" || l.status === "completed" || l.status === "opened" || l.status === "replied") return true;
      const page = magnetPages.find((p) => p.id === l.pageId || p.name === l.page);
      if (page && (page.resourceId || page.assetUrl || page.template === "locked-pdf")) return true;
      return false;
    }).length;
  }, [leads, magnetPages]);

  // Category counts memo
  const categoryCounts = useMemo(() => {
    const valid = resources.filter(
      (r: any) =>
        !(
          r.isPageAsset === true ||
          r.type === "page_asset" ||
          (r.name && r.name.startsWith("page_asset_"))
        )
    );
    return {
      all: valid.length,
      docs: valid.filter((r) => getFileCategory(r.name) === "docs").length,
      images: valid.filter((r) => getFileCategory(r.name) === "images").length,
      media: valid.filter((r) => getFileCategory(r.name) === "media").length,
      archives: valid.filter((r) => getFileCategory(r.name) === "archives").length,
    };
  }, [resources, getFileCategory]);

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

  const toggleSelectResource = useCallback((id: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedResourceIds.length === filteredResources.length && filteredResources.length > 0) {
      setSelectedResourceIds([]);
    } else {
      setSelectedResourceIds(filteredResources.map((r) => r.id));
    }
  }, [selectedResourceIds.length, filteredResources]);

  return (
    <div
      onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative flex flex-col min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-[#EFF6FF]/40 via-[#F8FBFF] to-[#F8FBFF] dark:bg-none dark:bg-[#0B0B0D]"
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

        <div className="flex-1 px-3.5 py-6 sm:px-6 sm:py-7 lg:px-8 max-w-7xl mx-auto w-full flex flex-col gap-4">

          {/* ========================================================================= */}
          {/* 1. DESKTOP Page Heading (hidden md:flex)                                 */}
          {/* ========================================================================= */}
          <div className="hidden md:flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
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

          {/* ========================================================================= */}
          {/* 1. MOBILE Page Heading (flex md:hidden)                                   */}
          {/* ========================================================================= */}
          <div className="flex md:hidden flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Assets
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </span>
              </div>

              <div className="relative shrink-0">
                <input
                  type="file"
                  id="resource-upload-mobile-header"
                  multiple
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-20"
                  onChange={handleSimulatedUpload}
                  disabled={uploading}
                />
                <button
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0066B2] hover:bg-[#005291] px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. Stat Cards (Unified Responsive Compact Horizontal Row)                */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Total Resources */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <Layers className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Total Resources
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {resources.length}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  {resources.length === 1 ? "1 file hosted" : `${resources.length} files hosted`}
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Storage Used */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#0066B2]/30 bg-[#EFF6FF] text-[#0066B2] dark:border-[#0066B2]/30 dark:bg-[#0066B2]/20 dark:text-[#38BDF8]">
                  <HardDrive className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Storage Used
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight truncate">
                  {formatBytes(totalSizeBytes)}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  {storagePercentage}% of 500 MB
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Active in Magnets */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-400">
                  <Link2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Active in Magnets
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {linkedStats.linkedCount}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  {linkedStats.unlinkedCount > 0 ? `${linkedStats.unlinkedCount} unlinked` : "all connected"}
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Total Deliveries */}
            <div className="group relative h-full rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm hover:border-[#0066B2]/40 dark:hover:border-[#38BDF8]/25 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Send className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#9B9085] leading-none truncate">
                  Total Deliveries
                </p>
                <p className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-white mt-1 leading-none tracking-tight">
                  {totalDeliveries}
                </p>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-[#9B9085] truncate">
                  sent to leads
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066B2]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          {/* Option 1: SMART EMPTY STATE DROPZONE (Only rendered when user has NO files) */}
          {resources.length === 0 && (
            <div className="relative rounded-2xl border-2 border-dashed border-[#0066B2]/40 bg-white/90 p-12 text-center backdrop-blur-sm hover:border-[#0066B2] dark:border-[#0066B2]/40 dark:bg-[#18181B]/90 shadow-sm transition-all">
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

          {/* ========================================================================= */}
          {/* Main Table Card Container (Standardized 16px gap to match Dashboard)     */}
          {/* ========================================================================= */}
          {resources.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white/90 dark:border-[#2e2e38] dark:bg-[#18181B]/90 shadow-sm backdrop-blur-sm relative overflow-hidden">
              {/* ===================================================================== */}
              {/* 3. DESKTOP Search & Filter Toolbar (hidden md:flex)                   */}
              {/* ===================================================================== */}
              <div className="hidden md:flex p-3.5 sm:p-4 border-b border-zinc-200/80 dark:border-[#2e2e38] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

              {/* Search & Sort */}
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 rounded-xl border border-zinc-200 bg-white pl-9 pr-8 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:outline-none dark:border-[#2e2e38] dark:bg-[#18181B] dark:text-white dark:placeholder-zinc-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Custom Glassy Sort Dropdown — 100% Matching Leads Smooth Spring Physics & UI */}
                <div className="relative" ref={sortRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSortOpen((prev) => !prev);
                    }}
                    className="flex h-9 items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-3.5 text-xs font-semibold text-zinc-700 shadow-xs backdrop-blur-md transition-all hover:bg-white/90 focus:outline-none dark:border-white/10 dark:bg-[#18181B]/80 dark:text-zinc-200 dark:hover:bg-[#222226] cursor-pointer select-none"
                  >
                    <span>
                      Sort: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "size" ? "File Size" : "Name (A-Z)"}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-300 ${isSortOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isSortOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ type: "spring", damping: 28, stiffness: 400 }}
                        style={{ transformOrigin: "top right" }}
                        className="absolute right-0 top-full z-40 mt-1.5 w-52 max-w-[calc(100vw-3rem)] rounded-xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181F]/95 dark:text-white dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                      >
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          Sort By
                        </div>
                        {[
                          { id: "newest", label: "Newest First" },
                          { id: "oldest", label: "Oldest First" },
                          { id: "size", label: "File Size" },
                          { id: "name", label: "Name (A-Z)" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSortBy(opt.id as any);
                              setIsSortOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                              sortBy === opt.id
                                ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {sortBy === opt.id && <Check className="h-3.5 w-3.5 text-current shrink-0" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* 3. MOBILE Toolbar (block md:hidden) - 50/50 Search & Filter Dropdown  */}
            {/* ===================================================================== */}
            <div className="block md:hidden p-3.5 border-b border-zinc-200/80 dark:border-[#2e2e38] space-y-2.5">
              {/* 50/50 Row: Search Input & Category Filter Dropdown */}
              <div className="grid grid-cols-2 gap-2">
                {/* 50% Search Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200/90 bg-zinc-50/70 py-2 pl-7 pr-6 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066B2] focus:bg-white focus:outline-none dark:border-[#2e2e38] dark:bg-[#1C1C22] dark:text-white dark:placeholder-zinc-500 transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* 50% Category Filter Dropdown */}
                <div className="relative" ref={mobileCategoryRef}>
                  <button
                    type="button"
                    onClick={() => setIsMobileCategoryOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-1 rounded-xl border border-zinc-200/90 bg-white py-2 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#1C1C22] dark:text-zinc-200 active:scale-98 transition cursor-pointer shadow-2xs select-none"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {activeCategory === "docs" ? (
                        <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />
                      ) : activeCategory === "images" ? (
                        <ImageIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : activeCategory === "media" ? (
                        <Film className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      ) : activeCategory === "archives" ? (
                        <Archive className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      )}
                      <span className="truncate text-[11px]">
                        {activeCategory === "all"
                          ? "All Files"
                          : activeCategory === "docs"
                          ? "Docs"
                          : activeCategory === "images"
                          ? "Images"
                          : activeCategory === "media"
                          ? "Media"
                          : "Archives"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                        isMobileCategoryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isMobileCategoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-40 mt-1.5 w-56 rounded-xl border border-zinc-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181F]/95 dark:text-white"
                      >
                        {[
                          { id: "all", label: "All Files", icon: <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />, count: categoryCounts.all },
                          { id: "docs", label: "Documents", icon: <FileText className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8] shrink-0" />, count: categoryCounts.docs },
                          { id: "images", label: "Images", icon: <ImageIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />, count: categoryCounts.images },
                          { id: "media", label: "Audio & Video", icon: <Film className="h-3.5 w-3.5 text-purple-500 shrink-0" />, count: categoryCounts.media },
                          { id: "archives", label: "Archives", icon: <Archive className="h-3.5 w-3.5 text-amber-500 shrink-0" />, count: categoryCounts.archives },
                        ].map((cat) => {
                          const isCatActive = activeCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setActiveCategory(cat.id as any);
                                setIsMobileCategoryOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                                isCatActive
                                  ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                {cat.icon}
                                {cat.label}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-1.5 py-0.2 rounded bg-zinc-200/60 text-[9px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                                  {cat.count}
                                </span>
                                {isCatActive && <Check className="h-3.5 w-3.5 text-current shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mobile Subtitle Strip & Sort / Selection Mode Toggle */}
              <div className="pt-0.5 text-xs overflow-hidden min-h-[30px] flex items-center">
                <AnimatePresence mode="wait" initial={false}>
                  {isMobileSelectionMode ? (
                    <motion.div
                      key="mobile-select-bar"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex items-center justify-between w-full"
                    >
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={filteredResources.length > 0 && selectedResourceIds.length === filteredResources.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202026] text-[#0066B2] focus:ring-[#0066B2] cursor-pointer"
                        />
                        <span className="font-bold text-zinc-900 dark:text-white">
                          Select All ({filteredResources.length})
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileSelectionMode(false);
                          setSelectedResourceIds([]);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#0066B2] hover:bg-[#0066B2]/10 dark:text-[#38BDF8] dark:hover:bg-[#38BDF8]/10 transition cursor-pointer"
                      >
                        Done
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mobile-normal-bar"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-600 dark:text-zinc-400 text-xs">
                          All Files ({filteredResources.length})
                        </span>

                        {/* Mobile Compact Sort Trigger */}
                        <div className="relative" ref={mobileSortRef}>
                          <button
                            type="button"
                            onClick={() => setIsMobileSortOpen((v) => !v)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
                          >
                            <span>
                              {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "size" ? "Size" : "Name"}
                            </span>
                            <ChevronDown className="h-3 w-3 text-zinc-400" />
                          </button>

                          <AnimatePresence>
                            {isMobileSortOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 top-full z-40 mt-1 w-40 rounded-xl border border-zinc-200/90 bg-white/95 p-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181F]/95 dark:text-white"
                              >
                                {[
                                  { id: "newest", label: "Newest" },
                                  { id: "oldest", label: "Oldest" },
                                  { id: "size", label: "File Size" },
                                  { id: "name", label: "Name (A-Z)" },
                                ].map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setSortBy(opt.id as any);
                                      setIsMobileSortOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                                      sortBy === opt.id
                                        ? "bg-[#0066B2]/10 text-[#0066B2] font-bold dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]"
                                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {sortBy === opt.id && <Check className="h-3 w-3 text-current" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsMobileSelectionMode(true)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-zinc-200/90 bg-white dark:border-[#2e2e38] dark:bg-[#202026] text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#282830] transition cursor-pointer shadow-2xs"
                      >
                        <span>Select</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* Table / List Body                                                         */}
            {/* ========================================================================= */}
            <div>
              {filteredResources.length === 0 ? (
                  <div className="py-12 text-center">
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
                  <>
                    {/* ========================================================================= */}
                    {/* 4. DESKTOP Table View (hidden md:block) - Preserved 100% Unchanged        */}
                    {/* ========================================================================= */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-200/80 dark:divide-[#2e2e38]">
                        <thead className="bg-[#F8FBFF] dark:bg-[#151518]">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-[11px] font-semibold tracking-wider text-zinc-500 dark:text-[#9B9085] uppercase">
                              <div className="flex items-center">
                                <div className="flex items-center mr-2.5">
                                  <AppleCheckbox
                                    checked={filteredResources.length > 0 && selectedResourceIds.length === filteredResources.length}
                                    indeterminate={selectedResourceIds.length > 0 && selectedResourceIds.length < filteredResources.length}
                                    onChange={() => {
                                      if (selectedResourceIds.length === filteredResources.length && filteredResources.length > 0) {
                                        setSelectedResourceIds([]);
                                      } else {
                                        setSelectedResourceIds(filteredResources.map((r) => r.id));
                                      }
                                    }}
                                    title={
                                      selectedResourceIds.length === filteredResources.length && filteredResources.length > 0
                                        ? "Deselect all on page"
                                        : "Select all on page"
                                    }
                                  />
                                </div>
                                <span>Resource Name</span>
                              </div>
                            </th>
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
                            const linkedPages = getResourceLinkedPages(resource.id);

                            return (
                              <tr
                                key={resource.id}
                                className={`group transition-all duration-200 ${
                                  isSelected
                                    ? "bg-gradient-to-r from-[#0066B2]/[0.08] via-[#0066B2]/[0.04] to-transparent dark:from-[#38BDF8]/15 dark:via-[#38BDF8]/[0.06] dark:to-transparent"
                                    : "hover:bg-zinc-50/80 dark:hover:bg-[#1F1F24]/70"
                                }`}
                              >
                                <td className="whitespace-nowrap px-6 py-4">
                                  <div className="flex items-center min-w-0">
                                    {/* Animated Spring Checkbox - 100% Matching Leads & Mobile Physics */}
                                    <AnimatePresence initial={false}>
                                      {(selectedResourceIds.length > 0 || isSelected) && (
                                        <motion.div
                                          initial={{ opacity: 0, width: 0, marginRight: 0 }}
                                          animate={{ opacity: 1, width: 22, marginRight: 12 }}
                                          exit={{ opacity: 0, width: 0, marginRight: 0 }}
                                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isSelected) {
                                              setSelectedResourceIds((prev) => prev.filter((id) => id !== resource.id));
                                            } else {
                                              setSelectedResourceIds((prev) => [...prev, resource.id]);
                                            }
                                          }}
                                          className="flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                                        >
                                          <AppleCheckbox
                                            checked={isSelected}
                                            onChange={() => {
                                              if (isSelected) {
                                                setSelectedResourceIds((prev) => prev.filter((id) => id !== resource.id));
                                              } else {
                                                setSelectedResourceIds((prev) => [...prev, resource.id]);
                                              }
                                            }}
                                            title={isSelected ? "Deselect asset" : "Select asset"}
                                          />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isSelected) {
                                            setSelectedResourceIds((prev) => prev.filter((id) => id !== resource.id));
                                          } else {
                                            setSelectedResourceIds((prev) => [...prev, resource.id]);
                                          }
                                        }}
                                        title={isSelected ? "Deselect" : "Select"}
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${badge.bg} cursor-pointer active:scale-95 transition-transform`}
                                      >
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
                                        <div>
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
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider border uppercase shrink-0 ${badge.tagBg || "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300 border-zinc-200 dark:border-white/10"}`}>
                                                {badge.ext}
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            {linkedPages.length > 0 ? (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 truncate max-w-xs">
                                                <Link2 className="h-3 w-3 shrink-0" />
                                                <span>{linkedPages.length === 1 ? `Attached to "${linkedPages[0].name}"` : `Attached to ${linkedPages.length} magnets`}</span>
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                                                Unlinked
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
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
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Direct Download / Test File */}
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Test / Download file"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200/90 bg-white dark:border-[#2e2e38] dark:bg-[#202026] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#282830] hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>

                                    {/* Copy Link Button */}
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(resource.url, resource.id)}
                                      title={isCopied ? "Link copied!" : "Copy shareable link"}
                                      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 ${
                                        isCopied
                                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                          : "border-zinc-200/90 bg-white dark:border-[#2e2e38] dark:bg-[#202026] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#282830] hover:text-[#0066B2] dark:hover:text-[#38BDF8]"
                                      }`}
                                    >
                                      {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => setResourceToDelete(resource)}
                                      title="Delete resource"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-zinc-400 hover:border-red-200 dark:hover:border-red-950/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150 cursor-pointer active:scale-95"
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

                    {/* ========================================================================= */}
                    {/* 4. MOBILE Card-Based Asset List (block md:hidden) - Senior UX Engineered   */}
                    {/* ========================================================================= */}
                    <div className="block md:hidden p-3 space-y-2.5">
                      {filteredResources.map((resource) => {
                        const badge = getFileBadge(resource.name);
                        const isCopied = copiedId === resource.id;
                        const isSelected = selectedResourceIds.includes(resource.id);
                        const linkedPages = getResourceLinkedPages(resource.id);

                        return (
                          <MobileAssetCard
                            key={resource.id}
                            resource={resource}
                            badge={badge}
                            linkedPages={linkedPages}
                            isSelected={isSelected}
                            isSelectionMode={isMobileSelectionMode}
                            isCopied={isCopied}
                            formattedSize={formatBytes(resource.size)}
                            isEditing={editingResourceId === resource.id}
                            editingName={editingName}
                            isSavingName={isSavingName}
                            onToggleSelect={toggleSelectResource}
                            onEnterSelectionMode={(id) => {
                              setIsMobileSelectionMode(true);
                              setSelectedResourceIds((prev) =>
                                prev.includes(id) ? prev : [...prev, id]
                              );
                            }}
                            onCopyLink={copyToClipboard}
                            onStartRenaming={startRenaming}
                            onEditingNameChange={setEditingName}
                            onSaveRename={handleSaveRename}
                            onCancelRename={() => setEditingResourceId(null)}
                            onDelete={setResourceToDelete}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Floating Bottom Multi-Select Bar - 100% Consistent with Landing Page      */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {selectedResourceIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 40, x: "-50%" }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900/70 dark:bg-[#121216]/70 border border-white/15 dark:border-white/10 text-white px-4 sm:px-5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            >
              <span className="text-xs font-bold whitespace-nowrap">
                <span className="text-[#38BDF8] font-black">{selectedResourceIds.length}</span> selected
              </span>
              <div className="h-4 w-px bg-white/20" />
              <button
                type="button"
                onClick={() => {
                  if (selectedResourceIds.length === filteredResources.length && filteredResources.length > 0) {
                    setSelectedResourceIds([]);
                  } else {
                    setSelectedResourceIds(filteredResources.map((r) => r.id));
                  }
                }}
                className="text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer whitespace-nowrap"
              >
                {selectedResourceIds.length === filteredResources.length && filteredResources.length > 0 ? "Deselect All" : "Select All"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedResourceIds([]);
                  setIsMobileSelectionMode(false);
                }}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({selectedResourceIds.length})</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Delete Confirmation Modal */}
        <AnimatePresence>
          {showBulkDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
              onClick={() => setShowBulkDeleteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border-t sm:border border-zinc-200 dark:border-[#2e2e38]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Drag Indicator */}
                <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden" />

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
                    className="flex-1 sm:flex-initial rounded-xl border border-zinc-200 bg-white px-4 py-2.5 sm:py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isBulkDeleting}
                    onClick={confirmBulkDelete}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 sm:py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm text-center"
                  >
                    {isBulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>Delete {selectedResourceIds.length} Files</span>
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
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
              onClick={() => setResourceToDelete(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 dark:bg-[#18181B] shadow-2xl border-t sm:border border-zinc-200 dark:border-[#2e2e38]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Drag Indicator */}
                <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4 sm:hidden" />

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
                    className="flex-1 sm:flex-initial rounded-xl border border-zinc-200 bg-white px-4 py-2.5 sm:py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-[#2e2e38] dark:bg-[#202026] dark:text-zinc-300 dark:hover:bg-[#282830] transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 sm:py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm text-center"
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
              className="fixed bottom-20 inset-x-3 sm:inset-x-auto sm:bottom-24 sm:right-5 z-50 w-auto sm:w-full sm:max-w-sm rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-[#18181B]/95 text-zinc-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10"
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

        {/* Floating Toast Notification Container — Mobile Responsive & Glassmorphic */}
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm z-50 pointer-events-none flex flex-col-reverse gap-2 items-center sm:items-end">
          {toasts.map((toast, idx) => {
            const reverseIdx = toasts.length - 1 - idx;
            const translateY = -reverseIdx * 6;
            const scale = Math.max(0.88, 1 - reverseIdx * 0.04);

            return (
              <div
                key={toast.id}
                style={{
                  transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                  transformOrigin: "bottom center",
                  zIndex: 100 - reverseIdx,
                }}
                className={`w-full pointer-events-auto flex items-center gap-2.5 sm:gap-3 rounded-2xl p-3.5 sm:p-4 text-xs font-bold shadow-xl backdrop-blur-xl border transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 ring-1 ring-white/10 ${toast.type === "success"
                  ? "bg-emerald-950/30 dark:bg-emerald-950/40 border-emerald-500/35 text-emerald-100"
                  : toast.type === "error"
                    ? "bg-rose-950/30 dark:bg-rose-950/40 border-rose-500/35 text-rose-100"
                    : "bg-zinc-900/35 dark:bg-black/40 border-white/15 text-white"
                  }`}
              >
                {toast.type === "success" && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />}
                {toast.type === "info" && <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />}
                <span className="flex-1 leading-snug">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-zinc-400 hover:text-white transition cursor-pointer p-0.5 rounded-md hover:bg-white/10 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Upload, Loader2, AlertCircle } from "lucide-react";

export interface InsertPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
  themeMode?: "light" | "dark" | string;
}

export default function InsertPhotoModal({
  isOpen,
  onClose,
  onInsert,
  themeMode = "light",
}: InsertPhotoModalProps) {
  const [activeTab, setActiveTab] = useState<"url" | "upload">("upload");
  const [url, setUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync dark mode state with props or document class
  const isDark =
    themeMode === "dark" ||
    (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setUrl("");
      setImageError(false);
      setIsDragging(false);
      setUploading(false);
      setUploadError(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (PNG, JPG, WebP, GIF, SVG).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Image size exceeds 15MB limit.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("isPageAsset", "true");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.success && (data.data?.fileUrl || data.data?.url)) {
        const finalUrl = data.data.fileUrl || data.data.url;
        onInsert(finalUrl);
        onClose();
      } else {
        setUploadError(data?.error || "Failed to upload image. Please try again.");
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setUploadError(err?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFile(e.target.files[0]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl flex flex-col ${
              isDark
                ? "border-zinc-800 bg-[#1A1A1E] text-white"
                : "border-zinc-200/90 bg-[#F8FAFD] text-zinc-900"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                isDark ? "border-zinc-800/80 bg-[#1E1E24]" : "border-zinc-200/80 bg-white"
              }`}
            >
              <h2 className="text-base font-medium tracking-tight text-zinc-900 dark:text-white">
                Insert photo
              </h2>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-1 rounded-full text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body: Left Sidebar Tabs + Right Content Area */}
            <div className="flex flex-col sm:flex-row min-h-[380px]">
              {/* Left Sidebar */}
              <div
                className={`w-full sm:w-52 p-3 flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r shrink-0 ${
                  isDark ? "border-zinc-800/80 bg-[#16161A]" : "border-zinc-200/80 bg-[#F0F4F9]"
                }`}
              >
                {/* Web Address (URL) Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium transition cursor-pointer text-left ${
                    activeTab === "url"
                      ? isDark
                        ? "bg-[#0066B2]/30 text-[#38BDF8] font-semibold"
                        : "bg-[#c2e7ff] text-[#001d35] font-semibold"
                      : isDark
                        ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
                  }`}
                >
                  <Link2 className="h-4 w-4 shrink-0" />
                  <span>Web Address (URL)</span>
                </button>

                {/* Upload Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium transition cursor-pointer text-left ${
                    activeTab === "upload"
                      ? isDark
                        ? "bg-[#0066B2]/30 text-[#38BDF8] font-semibold"
                        : "bg-[#c2e7ff] text-[#001d35] font-semibold"
                      : isDark
                        ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
                  }`}
                >
                  <Upload className="h-4 w-4 shrink-0" />
                  <span>Upload</span>
                </button>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
                {activeTab === "url" && (
                  <div className="space-y-4 flex flex-col flex-1">
                    <div className="space-y-2">
                      <input
                        type="url"
                        autoFocus
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          setImageError(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && url.trim() && !imageError) {
                            e.preventDefault();
                            onInsert(url.trim());
                            onClose();
                          }
                        }}
                        placeholder="Paste URL of image..."
                        className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition ${
                          isDark
                            ? "border-zinc-700/80 bg-[#121214] text-white placeholder:text-zinc-500 focus:border-[#38BDF8]"
                            : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"
                        }`}
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Only select images which you&apos;ve confirmed that you have the licence to use
                      </p>
                    </div>

                    {/* Image Preview Container */}
                    {url.trim() && (
                      <div
                        className={`rounded-xl border border-dashed p-4 flex flex-col items-center justify-center flex-1 min-h-[160px] max-h-[220px] overflow-hidden ${
                          isDark
                            ? "border-zinc-800 bg-[#121214]/60"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        {imageError ? (
                          <div className="flex items-center gap-2 text-xs text-rose-500">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>Unable to load image. Please verify the URL.</span>
                          </div>
                        ) : (
                          <img
                            src={url.trim()}
                            alt="Preview"
                            onError={() => setImageError(true)}
                            className="max-h-[190px] max-w-full rounded-md object-contain shadow-xs"
                          />
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto pt-4 flex items-center justify-end gap-2 border-t border-zinc-200/60 dark:border-white/5">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-semibold rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!url.trim() || imageError}
                        onClick={() => {
                          if (url.trim() && !imageError) {
                            onInsert(url.trim());
                            onClose();
                          }
                        }}
                        className="px-6 py-2 text-xs font-semibold rounded-full bg-[#0066B2] hover:bg-[#005596] text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                      >
                        Insert
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "upload" && (
                  <div className="flex flex-col flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* Google Style Drag & Drop Area */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`flex-1 min-h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors ${
                        isDragging
                          ? isDark
                            ? "border-[#38BDF8] bg-[#0066B2]/15"
                            : "border-[#0066B2] bg-[#EFF6FF]"
                          : isDark
                            ? "border-zinc-800 bg-[#141416]/50 hover:border-zinc-700"
                            : "border-zinc-300 bg-white/60 hover:border-zinc-400"
                      }`}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-[#0066B2] dark:text-[#38BDF8]" />
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            Uploading image...
                          </p>
                          <p className="text-xs text-zinc-400">
                            Optimizing and attaching to your email
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Google-Style Cloud Illustration with Green-to-Blue Gradient */}
                          <div className="relative mb-5 flex items-center justify-center">
                            <svg
                              className="w-28 h-20"
                              viewBox="0 0 120 80"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <defs>
                                <linearGradient
                                  id="googleCloudGrad"
                                  x1="0%"
                                  y1="30%"
                                  x2="100%"
                                  y2="70%"
                                >
                                  <stop offset="0%" stopColor="#48d374" />
                                  <stop offset="45%" stopColor="#5edb97" />
                                  <stop offset="85%" stopColor="#7fc7fb" />
                                  <stop offset="100%" stopColor="#9fd4fa" />
                                </linearGradient>
                              </defs>
                              <path
                                d="M35 70H88C101.5 70 112 59.5 112 46C112 33.5 103 23.5 91 22.2C89 9.5 78 0 65 0C54.2 0 44.8 6.5 40.5 16C38.5 15.2 36.3 14.8 34 14.8C21.8 14.8 12 24.6 12 36.8C12 38.2 12.1 39.5 12.4 40.8C5.3 45.1 0.5 53 0.5 62C0.5 72 8 70 20 70"
                                fill="url(#googleCloudGrad)"
                                stroke="#1e293b"
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                              />
                              {/* Arrow */}
                              <path
                                d="M64 56V26M64 26L54 36M64 26L74 36"
                                stroke="#1e293b"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>

                          {/* Browse Pill Button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-7 py-2 rounded-full bg-[#0066B2] hover:bg-[#005596] text-white text-xs font-semibold shadow-xs cursor-pointer transition active:scale-98"
                          >
                            Browse
                          </button>

                          {/* Subtext */}
                          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            or drag files here
                          </p>

                          {uploadError && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span>{uploadError}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


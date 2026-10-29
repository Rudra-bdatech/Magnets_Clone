"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, Loader2 } from "lucide-react";

interface FileViewerModalProps {
  resource: { id: string; name: string; url: string } | null;
  onClose: () => void;
}

/** Adds ?inline=1 so /r/[id] serves the file for viewing instead of downloading it. */
function inlineUrl(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}inline=1`;
}

/** Opens an asset in the browser's built-in PDF viewer without leaving the page. */
export function FileViewerModal({ resource, onClose }: FileViewerModalProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (!resource) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [resource, onClose]);

  return (
    <AnimatePresence>
      {resource && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-zinc-900 sm:h-[90vh] sm:rounded-2xl sm:border sm:border-zinc-200 dark:sm:border-white/10"
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-white/10">
              <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {resource.name}
              </h2>
              <a
                href={resource.url}
                title="Download"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
              </a>
              <a
                href={inlineUrl(resource.url)}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative flex-1 bg-zinc-100 dark:bg-zinc-950">
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              )}
              <iframe
                key={resource.id}
                src={inlineUrl(resource.url)}
                title={resource.name}
                onLoad={() => setLoaded(true)}
                className="h-full w-full border-0"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

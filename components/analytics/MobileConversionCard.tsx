"use client";

import React, { useState } from "react";
import { Mail, Check, Copy, Laptop, Smartphone, FileText, Globe, Clock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { type Lead } from "@/lib/data";

interface MobileConversionCardProps {
  lead: Lead;
  isPerMagnet?: boolean;
}

export default function MobileConversionCard({ lead, isPerMagnet = false }: MobileConversionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.email) return;
    navigator.clipboard.writeText(lead.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMobileDevice = lead.deviceType === "mobile";

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "converted":
        return {
          label: status,
          className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "opened":
      case "replied":
        return {
          label: status,
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "pending_email":
        return {
          label: "pending",
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      default:
        return {
          label: status || "new",
          className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
        };
    }
  };

  const statusInfo = getStatusBadge(lead.status);

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="p-3.5 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-2.5 transition-all"
    >
      {/* Top row: Name, Status & Device */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
              {lead.name || "Anonymous Subscriber"}
            </h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Device pill */}
        <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/60 dark:border-white/[0.08] text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
          {isMobileDevice ? (
            <>
              <Smartphone className="h-3 w-3 text-orange-500 dark:text-orange-400" />
              <span>Mobile</span>
            </>
          ) : (
            <>
              <Laptop className="h-3 w-3 text-[#0066B2] dark:text-cyan-400" />
              <span>Desktop</span>
            </>
          )}
        </div>
      </div>

      {/* Email row with quick copy */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-mono truncate min-w-0">
          <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{lead.email || "No email"}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyEmail}
          className="cursor-pointer shrink-0 p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition"
          title="Copy email"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Bottom metadata row: Lead Magnet & Signup Time */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-white/[0.04] text-[11px]">
        {!isPerMagnet ? (
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-medium truncate min-w-0">
            <FileText className="h-3 w-3 text-[#0066B2] dark:text-cyan-400 shrink-0" />
            <span className="truncate">{lead.page || "Lead Magnet"}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
            <Globe className="h-3 w-3 text-zinc-400 shrink-0" />
            <span className="truncate">{lead.referrer || lead.source || "Direct link"}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-mono text-[10px] shrink-0">
          <Clock className="h-3 w-3" />
          <span>{lead.signedUpAt || "Recently"}</span>
        </div>
      </div>
    </motion.div>
  );
}

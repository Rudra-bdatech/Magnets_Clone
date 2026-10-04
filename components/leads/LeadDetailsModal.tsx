"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Lock,
  Upload,
  Mail,
  Check,
  Send,
  Trash2,
  Linkedin,
  ExternalLink,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { Lead, MagnetPage, Sequence, Account } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

interface LeadDetailsModalProps {
  selectedLead: Lead | null;
  magnetPages: MagnetPage[];
  sequences: Sequence[];
  account: Account | null;
  onClose: () => void;
  onDelete: (lead: Lead) => void;
  onResendEmail: (lead: Lead) => Promise<void>;
}

function formatFieldKey(key: string): string {
  const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {
    linkedinprofile: "LinkedIn Profile",
    linkedinpost: "LinkedIn Post",
    commenttext: "Comment Text",
    dmsentat: "DM Sent At",
    isconverted: "Conversion Status",
    convertedat: "Converted At",
    verifiedemail: "Verified Email",
    commentid: "Comment ID",
    postid: "Post ID",
    unipilecommentid: "Comment ID",
    unipilepostid: "Post ID",
    lileadid: "LinkedIn Lead ID",
    liauthorid: "LinkedIn Author ID",
  };
  if (map[norm]) return map[norm];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function renderFieldValue(key: string, val: any) {
  const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Conversion / Boolean flags
  if (typeof val === "boolean" || normKey === "isconverted" || val === "true" || val === "false") {
    const isTrue = val === true || val === "true" || val === 1 || val === "1";
    return isTrue ? (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
        <CheckCircle2 className="h-3 w-3 shrink-0" /> Converted (Email Captured)
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
        <Clock className="h-3 w-3 shrink-0" /> DM Sent (Pending Signup)
      </span>
    );
  }

  const strVal = String(val ?? "").trim();

  // Date fields (e.g. dmSentAt, convertedAt, or ISO strings)
  if (
    normKey === "dmsentat" ||
    normKey === "convertedat" ||
    normKey === "signedupat" ||
    (strVal.length >= 19 && strVal.includes("T") && !isNaN(Date.parse(strVal)))
  ) {
    return (
      <span className="font-semibold text-zinc-900 dark:text-white text-xs whitespace-nowrap">
        {formatDateTime(strVal)}
      </span>
    );
  }

  // URLs
  if (strVal.startsWith("http://") || strVal.startsWith("https://")) {
    const isProfile = normKey.includes("profile");
    const isPost = normKey.includes("post");
    const label = isProfile ? "View Profile" : isPost ? "View Post" : "Open Link";

    return (
      <a
        href={strVal}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-[#0066B2]/10 dark:hover:bg-[#38BDF8]/10 text-[#0066B2] dark:text-[#38BDF8] border border-zinc-200/80 dark:border-white/10 font-semibold text-xs max-w-full group transition-colors overflow-hidden shrink-0"
        title={strVal}
      >
        <span className="font-medium">{label}</span>
        <span className="text-[10px] opacity-60 truncate max-w-[120px] sm:max-w-[180px]">
          ({strVal.replace(/^https?:\/\/(www\.)?/, "")})
        </span>
        <ExternalLink className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </a>
    );
  }

  return (
    <span className="font-semibold text-zinc-900 dark:text-white text-xs break-all sm:break-words text-left sm:text-right max-w-full">
      {strVal}
    </span>
  );
}

export const LeadDetailsModal = memo(function LeadDetailsModal({
  selectedLead,
  magnetPages,
  sequences,
  onClose,
  onDelete,
  onResendEmail,
}: LeadDetailsModalProps) {
  if (!selectedLead) return null;

  const page = magnetPages.find(
    (p) => p.id === selectedLead.pageId || p.name === selectedLead.page
  );
  const isLinkedIn =
    selectedLead.source === "linkedin-comment" ||
    selectedLead.source === "linkedin" ||
    Boolean(selectedLead.tags?.includes("linkedin")) ||
    Boolean(selectedLead.tags?.includes("dm-sent")) ||
    Boolean(selectedLead.tags?.includes("auto-reply")) ||
    Boolean(selectedLead.email && selectedLead.email.endsWith("@linkedin-prospect.com")) ||
    Boolean(selectedLead.referrer && selectedLead.referrer.toLowerCase().includes("linkedin")) ||
    Boolean(
      selectedLead.customFields?.linkedinProfile ||
      (selectedLead.customFields as any)?.LinkedinProfile ||
      selectedLead.customFields?.linkedinPost ||
      (selectedLead.customFields as any)?.LinkedinPost
    );
  const isLockedPdf =
    !isLinkedIn &&
    (selectedLead.source === "locked-pdf-otp" ||
      selectedLead.tags?.includes("locked-pdf") ||
      page?.template === "locked-pdf" ||
      selectedLead.page?.toLowerCase().includes("locked"));
  const isManual =
    !isLinkedIn &&
    (selectedLead.source === "integration" ||
      (selectedLead.source as string) === "manual" ||
      selectedLead.page === "Direct Manual Add" ||
      selectedLead.sequence === "Imported Contact");

  // Sequence Funnel Information (using cached sequences in props instead of synchronous localStorage reads)
  const foundSeq = sequences.find(
    (s) =>
      s.id === page?.id ||
      s.pageId === page?.id ||
      (page && s.name.includes(page.name))
  );
  const isEnabled = page
    ? page.sequenceEnabled ||
      (page.sequenceEmails && page.sequenceEmails.length > 0)
    : false;
  const isSeqLive = foundSeq ? foundSeq.status === "live" : isEnabled;
  const totalSteps =
    foundSeq?.emails?.length || page?.sequenceEmails?.length || 2;
  const stepsList = foundSeq?.emails || page?.sequenceEmails || [
    { id: "1", subject: "Initial Delivery Email", delayLabel: "Instantly" },
    {
      id: "2",
      subject: "Follow-up Check-in Email",
      delayLabel: "1 day later",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 6 }}
          transition={{ type: "spring", damping: 26, stiffness: 360 }}
          className="w-full max-w-xl sm:max-w-2xl rounded-2xl border border-zinc-200/80 bg-white dark:border-[#2e2e38] dark:bg-[#18181B] p-4 sm:p-6 shadow-2xl relative space-y-4 my-auto max-h-[92vh] overflow-y-auto scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-1 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0066B2]/10 text-[#0066B2] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] text-sm font-bold uppercase border border-[#0066B2]/20 dark:border-[#38BDF8]/30">
                {(selectedLead.name || selectedLead.email || "U").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                  {selectedLead.name || "Subscriber Details"}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] truncate max-w-[200px] sm:max-w-[280px]">
                    {selectedLead.email}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      !selectedLead.email.endsWith("@gmail.com") &&
                      !selectedLead.email.endsWith("@yahoo.com")
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {!selectedLead.email.endsWith("@gmail.com") &&
                    !selectedLead.email.endsWith("@yahoo.com")
                      ? "🔥 Hot Prospect (80 pts)"
                      : "⚡ Warm Lead (60 pts)"}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-[#25252A] dark:hover:text-white transition cursor-pointer shrink-0"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Top Grid Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 py-1">
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 dark:text-[#9B9085]">
                  Signup Method / Gate
                </span>
                <div className="mt-1">
                  {isLinkedIn ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2]/10 px-2.5 py-1 text-xs font-bold text-[#0A66C2] dark:text-[#38BDF8] border border-[#0A66C2]/20">
                      <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] dark:text-[#38BDF8] shrink-0" />
                      <span>LinkedIn Auto-DM</span>
                    </span>
                  ) : isLockedPdf ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Locked PDF Gate (OTP)</span>
                    </span>
                  ) : isManual ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <Upload className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span>Manual Import</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span>Landing Page Form</span>
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 dark:text-[#9B9085]">
                  Subscribed On Magnet
                </span>
                <strong className="font-semibold text-zinc-900 dark:text-white block truncate mt-1 text-xs">
                  {selectedLead.page}
                </strong>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 dark:text-[#9B9085]">
                  Signup Date & Time
                </span>
                <strong className="font-semibold text-zinc-900 dark:text-white block mt-1 text-xs">
                  {formatDateTime(selectedLead.signedUpAt)}
                </strong>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-zinc-500 dark:text-[#9B9085]">
                  Traffic Source / Referrer
                </span>
                <strong className="font-semibold text-zinc-900 dark:text-white block capitalize mt-1 text-xs">
                  {selectedLead.referrer || "Direct Link"}{" "}
                  <span className="text-zinc-400 font-normal text-[11px]">
                    ({selectedLead.deviceType || "Desktop"})
                  </span>
                </strong>
              </div>
            </div>

            {/* Custom Fields / LinkedIn Data */}
            {(() => {
              const HIDDEN_INTERNAL_KEYS = new Set([
                "lileadid",
                "liauthorid",
                "commentid",
                "postid",
                "unipilecommentid",
                "unipilepostid",
                "id",
                "leadid",
              ]);
              const validCustomFields = Object.entries(selectedLead.customFields || {}).filter(
                ([key, val]) => {
                  const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
                  if (HIDDEN_INTERNAL_KEYS.has(norm)) return false;
                  return val !== undefined && val !== null && String(val).trim() !== "";
                }
              );
              if (validCustomFields.length === 0) return null;
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white block text-xs">
                      {isLinkedIn ? "LinkedIn Interaction & Prospect Data" : "Form Submissions"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {validCustomFields.length} field{validCustomFields.length === 1 ? "" : "s"} recorded
                    </span>
                  </div>
                  <div className="space-y-2">
                    {validCustomFields.map(([key, val]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-[#121214] border border-zinc-100 dark:border-white/5 overflow-hidden"
                      >
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#9B9085] shrink-0">
                          {formatFieldKey(key)}
                        </span>
                        <div className="min-w-0 max-w-full flex items-center sm:justify-end overflow-hidden">
                          {renderFieldValue(key, val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Visitor Prompt Answer */}
            {selectedLead.customAnswer && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 block">
                  ✨ Visitor Prompt Answer
                </span>
                <p className="text-xs italic text-zinc-800 dark:text-zinc-200 bg-amber-500/5 p-3 rounded-xl border border-amber-500/15 leading-relaxed">
                  "{selectedLead.customAnswer}"
                </p>
              </div>
            )}

            {/* Sequence Delivery Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/80 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                  Follow-up Funnel Progress
                </span>
                {!isSeqLive ? (
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    Sequence Ended
                  </span>
                ) : selectedLead.status === "stopped" ? (
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    🛑 Stopped
                  </span>
                ) : selectedLead.status === "completed" ||
                  selectedLead.status === "delivered" ? (
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {totalSteps}/{totalSteps} Steps Completed
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    1/{totalSteps} Steps Delivered
                  </span>
                )}
              </div>

              {/* Step Items List */}
              <div className="space-y-1.5 pt-1">
                {stepsList.map((step: any, idx: number) => {
                  const isDone = !isSeqLive
                    ? false
                    : selectedLead.status === "completed" ||
                      selectedLead.status === "delivered" ||
                      idx === 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] bg-white dark:bg-[#18181B] p-2 rounded-lg border border-zinc-100 dark:border-white/5 gap-2"
                    >
                      <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 min-w-0">
                        {isDone ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <span className="font-semibold truncate">
                          {step.subject || `Step #${idx + 1}`}
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        {step.delayLabel ||
                          (step.delayDays !== undefined
                            ? step.delayUnit === "minutes"
                              ? `${step.delayDays} min${step.delayDays > 1 ? "s" : ""} later`
                              : step.delayUnit === "hours"
                              ? `${step.delayDays} hr${step.delayDays > 1 ? "s" : ""} later`
                              : `${step.delayDays} day${step.delayDays > 1 ? "s" : ""} later`
                            : step.delayMinutes !== undefined
                            ? step.delayMinutes === 0
                              ? "Instantly"
                              : step.delayMinutes < 60
                              ? `${step.delayMinutes} min${step.delayMinutes > 1 ? "s" : ""} later`
                              : step.delayMinutes < 1440
                              ? `${Math.round(step.delayMinutes / 60)} hr${Math.round(step.delayMinutes / 60) > 1 ? "s" : ""} later`
                              : `${Math.round(step.delayMinutes / 1440)} day${Math.round(step.delayMinutes / 1440) > 1 ? "s" : ""} later`
                            : idx === 0
                            ? "Instantly"
                            : `${idx} day later`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-between sm:items-center mt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onResendEmail(selectedLead)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-[#2e2e38] bg-white dark:bg-[#202026] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#282830] transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-emerald-500" /> Resend Email
              </button>
              <button
                type="button"
                onClick={() => onDelete(selectedLead)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-[#0066B2] text-xs font-semibold text-white hover:bg-[#005799] transition cursor-pointer text-center"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

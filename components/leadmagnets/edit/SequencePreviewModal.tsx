"use client";

import { Monitor, Smartphone, Magnet } from "lucide-react";
import { type Account } from "@/lib/data";

interface SequenceEmail {
  id: string;
  subject: string;
  delayDays: number;
  delayUnit?: "hours" | "minutes" | "days";
  previewText?: string;
  body: string;
}

interface SequencePreviewModalProps {
  emailSubject: string;
  emailPreviewText: string;
  emailBody: string;
  sequenceEmails: SequenceEmail[];
  account: Account | null;
  previewSequenceIndex: number;
  previewDeviceMode: "desktop" | "mobile";
  onSetPreviewSequenceIndex: (index: number) => void;
  onSetPreviewDeviceMode: (mode: "desktop" | "mobile") => void;
  onClose: () => void;
}

export default function SequencePreviewModal({
  emailSubject,
  emailPreviewText,
  emailBody,
  sequenceEmails,
  account,
  previewSequenceIndex,
  previewDeviceMode,
  onSetPreviewSequenceIndex,
  onSetPreviewDeviceMode,
  onClose,
}: SequencePreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl border border-[#27272A] bg-[#121216] text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">

        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-4 bg-[#18181C]">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-extrabold text-white truncate">
              {previewSequenceIndex === 0
                ? (emailSubject || "Untitled email")
                : (sequenceEmails[previewSequenceIndex - 1]?.subject || "Untitled email")}
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {previewSequenceIndex === 0
                ? (emailPreviewText || "No preview text yet")
                : (sequenceEmails[previewSequenceIndex - 1]?.previewText || "No preview text yet")}
            </p>
          </div>

          {/* Right Toggle & Close */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center rounded-lg border border-[#27272A] bg-[#121216] p-1 text-xs">
              <button
                onClick={() => onSetPreviewDeviceMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition cursor-pointer ${previewDeviceMode === "desktop" ? "bg-[#272730] text-white" : "text-zinc-400 hover:text-white"
                  }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => onSetPreviewDeviceMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition cursor-pointer ${previewDeviceMode === "mobile" ? "bg-[#272730] text-white" : "text-zinc-400 hover:text-white"
                  }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-[#27272A] bg-[#1E1E24] px-4 py-1.5 text-xs font-bold text-zinc-300 hover:bg-[#272730] hover:text-white transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar List */}
          <div className="w-64 border-r border-[#27272A] bg-[#141418] p-4 flex flex-col gap-2 overflow-y-auto shrink-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-2">Sequence Preview</span>

            {/* Email 1: Delivery Email */}
            <div
              onClick={() => onSetPreviewSequenceIndex(0)}
              className={`rounded-xl p-3 flex items-center justify-between transition cursor-pointer ${previewSequenceIndex === 0
                ? "bg-[#FE6F34] text-white shadow-md font-bold"
                : "bg-[#1B1B20] text-zinc-300 hover:bg-[#24242A] border border-[#27272A]"
                }`}
            >
              <div className="min-w-0 pr-2">
                <span className="block text-xs font-extrabold truncate">Email 1</span>
                <span className={`block text-[11px] truncate mt-0.5 ${previewSequenceIndex === 0 ? "text-white/80" : "text-zinc-400"}`}>
                  {emailSubject || "Untitled email"}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${previewSequenceIndex === 0 ? "bg-white/20 text-white" : "bg-zinc-800/40 text-zinc-400"}`}>
                0m
              </span>
            </div>

            {/* Follow-up Emails (Email 2, Email 3, etc.) */}
            {sequenceEmails.map((item, idx) => {
              const seqIndex = idx + 1;
              const isSelected = previewSequenceIndex === seqIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => onSetPreviewSequenceIndex(seqIndex)}
                  className={`rounded-xl p-3 flex items-center justify-between transition cursor-pointer ${isSelected
                    ? "bg-[#FE6F34] text-white shadow-md font-bold"
                    : "bg-[#1B1B20] text-zinc-300 hover:bg-[#24242A] border border-[#27272A]"
                    }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="block text-xs font-extrabold truncate">Email {idx + 2}</span>
                    <span className={`block text-[11px] truncate mt-0.5 ${isSelected ? "text-white/80" : "text-zinc-400"}`}>
                      {item.subject || "Untitled email"}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-zinc-800/40 text-zinc-400"}`}>
                    {item.delayDays || 1}{item.delayUnit === "minutes" ? "m" : item.delayUnit === "days" ? "d" : "h"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Preview Canvas */}
          <div className="flex-1 bg-[#EBEAE6] p-4 sm:p-8 flex items-start justify-center overflow-y-auto">
            <div className={`w-full transition-all duration-300 my-auto ${previewDeviceMode === "mobile" ? "max-w-xs" : "max-w-xl"}`}>
              <div className="rounded-2xl bg-white text-zinc-900 shadow-2xl overflow-hidden border border-zinc-200">

                {/* Inner Email Body Content */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div
                    className="text-xs text-zinc-800 leading-relaxed email-rendered-content [&_p]:mb-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        const rawBody = previewSequenceIndex === 0
                          ? emailBody
                          : (sequenceEmails[previewSequenceIndex - 1]?.body || "");
                        const raw = (rawBody || "No email body written yet.").replace(/\{name\}/g, "John");
                        const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
                        return hasHtml ? raw : raw.replace(/\n/g, "<br/>");
                      })(),
                    }}
                  />

                  {/* Sequence Opt-out footer */}
                  <div className="pt-6 border-t border-zinc-100 text-center">
                    <p className="text-[11px] text-zinc-500">
                      Don&apos;t want these follow-up emails?{" "}
                      <span className="underline cursor-pointer text-zinc-700 hover:text-black">Stop this sequence</span>.
                    </p>
                  </div>
                </div>

                {/* Black Magnet Footer Banner */}
                <div className="bg-[#0B0F19] p-5 text-center flex items-center justify-center">
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-zinc-900 shadow-md hover:bg-zinc-100 transition cursor-pointer">
                    {account?.logo || account?.avatar_url || account?.avatar ? (
                      <img src={account?.logo || account?.avatar_url || account?.avatar || ""} alt="Logo" className="h-5 w-5 rounded object-cover" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#0066B2] text-white">
                        <Magnet className="h-3 w-3" />
                      </span>
                    )}
                    <span>Build yours free with Magnets</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

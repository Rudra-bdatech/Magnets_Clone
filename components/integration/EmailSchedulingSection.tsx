"use client";

import React, { useState, memo } from "react";
import { Mail, Calendar, ChevronDown, Check, Copy } from "lucide-react";
import { type Account } from "@/lib/data";

interface EmailSchedulingSectionProps {
  account: Account | null;
  setAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  appBaseUrl: string;
  openSections: Record<string, boolean>;
  toggle: (key: string) => void;
  markDirty: (field: string) => void;
  handleSave: (overrides?: Partial<Account>) => Promise<void>;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const EmailSchedulingSection = memo(function EmailSchedulingSection({
  account,
  setAccount,
  appBaseUrl,
  openSections,
  toggle,
  markDirty,
  handleSave,
  addToast,
}: EmailSchedulingSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldKey: string, successMsg?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    if (successMsg) addToast(successMsg, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* EMAIL & SCHEDULING Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">EMAIL & SCHEDULING</p>
            <p className="text-xs text-zinc-500 dark:text-[#666675]">Where messages come from and when sequences should stop.</p>
          </div>
          <span className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#0066B2] dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-400">
            Sending ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Your sender domain Expandable Card */}
          <div className={`${openSections["sender-domain"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
            <div
              onClick={() => toggle("sender-domain")}
              className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF4ED] text-[#FF6A3D] border border-[#FFDEC9] dark:bg-[#2A170F] dark:border-[#422215]">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Your sender domain</h5>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Send from your own address instead of Magnets.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["sender-domain"] ? "rotate-180" : ""}`} />
              </div>
            </div>

            {/* Expanded Sender Domain 3-Step Setup Panel */}
            <div className={`grid transition-all duration-300 ease-in-out ${openSections["sender-domain"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="px-5 pb-6 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                  {/* Step 1 Box */}
                  <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 flex items-start gap-4 shadow-2xs">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-700 dark:border-white/20 dark:text-white">
                      1
                    </span>
                    <div>
                      <h6 className="text-xs font-bold text-zinc-900 dark:text-white">Pick your sending subdomain</h6>
                      <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                        Pick a subdomain to put the sending records under, so they don't collide with anything you already have.
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-[#666675] mt-2">
                        Set your root domain in Publishing first.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 Box */}
                  <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 space-y-3.5 shadow-2xs">
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-700 dark:border-white/20 dark:text-white">
                        2
                      </span>
                      <div>
                        <h6 className="text-xs font-bold text-zinc-900 dark:text-white">Set your sender address</h6>
                        <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                          Pick the local part. The domain part stays locked to the subdomain you chose above.
                        </p>
                      </div>
                    </div>

                    <div className="pl-11 space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-[#9B9085] mb-1">
                          Display name (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Your Brand"
                          value={account?.senderDisplayName || ""}
                          onChange={(e) => {
                            markDirty("senderDisplayName");
                            const val = e.target.value;
                            setAccount((prev) => prev ? { ...prev, senderDisplayName: val } : prev);
                          }}
                          onBlur={() => handleSave()}
                          className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#FF6A3D] transition"
                        />
                        <p className="text-[10px] text-zinc-400 dark:text-[#666675] mt-1">
                          Shown in the inbox as the sender's name.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 dark:text-[#9B9085] mb-1">
                          Sender address
                        </label>
                        <div className="flex items-center rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] overflow-hidden">
                          <input
                            type="text"
                            placeholder="@ hello"
                            value={account?.senderAddress || ""}
                            onChange={(e) => {
                              markDirty("senderAddress");
                              const val = e.target.value;
                              setAccount((prev) => prev ? { ...prev, senderAddress: val } : prev);
                            }}
                            onBlur={() => handleSave()}
                            className="w-full bg-transparent px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none"
                          />
                          <span className="px-3 py-2 text-[10px] font-mono text-zinc-400 dark:text-[#555] bg-zinc-50 dark:bg-[#151518] border-l border-zinc-200 dark:border-white/10 shrink-0">
                            @pick subdomain first
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 dark:text-[#666675] mt-1">
                          The part before @ is up to you. The suffix is locked to the subdomain you chose above.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 Box */}
                  <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-4 flex items-start gap-4 shadow-2xs">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold text-zinc-700 dark:border-white/20 dark:text-white">
                      3
                    </span>
                    <div>
                      <h6 className="text-xs font-bold text-zinc-900 dark:text-white">Add the sending DNS records</h6>
                      <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">
                        These appear once your sender is set.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar booking Expandable Card */}
          <div className={`${openSections["calendar-booking"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
            <div
              onClick={() => toggle("calendar-booking")}
              className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] dark:bg-[#2e2208]">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Calendar booking</h5>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Stop sequences after a Calendly or Cal.com booking.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["calendar-booking"] ? "rotate-180" : ""}`} />
              </div>
            </div>

            {/* Expanded Calendar Booking Setup Panel */}
            <div className={`grid transition-all duration-300 ease-in-out ${openSections["calendar-booking"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                  {/* Calendar Provider Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                      Calendar platform
                    </label>
                    <select
                      value={account?.calendarProvider || "Cal.com"}
                      onChange={(e) => {
                        markDirty("calendarProvider");
                        const prov = e.target.value as "Calendly" | "Cal.com";
                        setAccount((prev) => prev ? { ...prev, calendarProvider: prov } : prev);
                        handleSave({ calendarProvider: prov });
                        addToast(`Calendar provider set to ${prov}`, "info");
                      }}
                      className="w-full sm:w-64 rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-[#D97706] transition"
                    >
                      <option value="Cal.com">Cal.com / CalID</option>
                      <option value="Calendly">Calendly</option>
                    </select>
                  </div>

                  {/* Live Webhook Receiver URL */}
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0E0E10] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          Booking Webhook URL
                        </label>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Webhook Engine Ready
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${appBaseUrl}/api/webhooks/booking`}
                        className="flex-1 min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#09090B] px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-300 font-mono select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${appBaseUrl}/api/webhooks/booking`, "booking-webhook", "Booking webhook URL copied to clipboard!")}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shrink-0 shadow-sm cursor-pointer"
                      >
                        {copiedField === "booking-webhook" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Webhook URL</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-[#888895] leading-relaxed pt-1 border-t border-zinc-100 dark:border-white/5 space-y-1">
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">Quick 1-minute setup:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-zinc-500 dark:text-[#777785]">
                        <li>
                          {account?.calendarProvider === "Calendly" ? (
                            <span>In <b>Calendly</b> $\rightarrow$ <b>Integrations & apps</b> $\rightarrow$ <b>Webhooks</b> $\rightarrow$ Add New Webhook $\rightarrow$ paste this URL.</span>
                          ) : (
                            <span>In <b>Cal.com / CalID</b> $\rightarrow$ <b>Event Types</b> $\rightarrow$ Click your event $\rightarrow$ <b>Webhooks</b> $\rightarrow$ Add this URL with trigger <code>BOOKING_CREATED</code>.</span>
                          )}
                        </li>
                        <li>When a lead books a call, Magnets automatically halts their email nurture sequence so they aren't spammed.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between">
                    <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                      One webhook URL works across all your calendars and lead magnets.
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check className="h-3.5 w-3.5" />
                      Auto Stop-on-Booking Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});


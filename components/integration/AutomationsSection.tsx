"use client";

import React, { useState, memo } from "react";
import { ChevronDown, Check, Eye, EyeOff, Slack, Zap, Mail } from "lucide-react";
import { type Account } from "@/lib/data";

interface AutomationsSectionProps {
  account: Account | null;
  setAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  openSections: Record<string, boolean>;
  toggle: (key: string) => void;
  markDirty: (field: string) => void;
  handleSave: (overrides?: Partial<Account>) => Promise<void>;
  substackPublication: string;
  setSubstackPublication: (val: string) => void;
  addToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const AutomationsSection = memo(function AutomationsSection({
  account,
  setAccount,
  openSections,
  toggle,
  markDirty,
  handleSave,
  substackPublication,
  setSubstackPublication,
  addToast,
}: AutomationsSectionProps) {
  const [showSlackUrl, setShowSlackUrl] = useState(false);
  const [showZapierUrl, setShowZapierUrl] = useState(false);
  const [showPipedriveToken, setShowPipedriveToken] = useState(false);
  const [showKitKey, setShowKitKey] = useState(false);

  const [slackUrlError, setSlackUrlError] = useState("");
  const [zapierUrlError, setZapierUrlError] = useState("");

  const validateUrl = (url: string) => {
    if (!url.trim()) return true;
    return /^https?:\/\/.+/i.test(url.trim());
  };

  return (
    <div className="space-y-6">
      {/* AUTOMATIONS Section */}
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#9B9085]">AUTOMATIONS</p>
          <p className="text-xs text-zinc-500 dark:text-[#666675]">Send each new signup to the tools your team already uses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Slack Expandable Card */}
          <div className={`${openSections["slack-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
            <div
              onClick={() => toggle("slack-webhook")}
              className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] border border-[#E9D5FF] dark:bg-[#251838] overflow-hidden p-1.5">
                  <img src="/brand/slack.svg" alt="Slack" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Slack</h5>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Get a compact Slack message whenever a new lead signs up.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["slack-webhook"] ? "rotate-180" : ""}`} />
              </div>
            </div>

            {/* Expanded Webhook Input Panel with Grid Height Animation */}
            <div className={`grid transition-all duration-300 ease-in-out ${openSections["slack-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                      Slack incoming-webhook URL
                    </label>
                    <div className="relative">
                      <input
                        type={showSlackUrl ? "text" : "password"}
                        placeholder="https://hooks.slack.com/services/..."
                        value={account?.slackWebhookUrl || ""}
                        onChange={(e) => {
                          markDirty("slackWebhookUrl");
                          const url = e.target.value;
                          if (validateUrl(url)) {
                            setSlackUrlError("");
                          } else {
                            setSlackUrlError("Please enter a valid URL (starting with http:// or https://)");
                          }
                          setAccount((prev) => prev ? { ...prev, slackWebhookUrl: url } : prev);
                        }}
                        onBlur={() => {
                          if (account?.slackWebhookUrl && !validateUrl(account.slackWebhookUrl)) {
                            addToast("Please enter a valid Slack webhook URL (https://...)", "error");
                            return;
                          }
                          handleSave();
                        }}
                        className={`w-full rounded-xl border bg-white dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none transition font-mono ${
                          slackUrlError ? "border-rose-500 focus:border-rose-500" : "border-zinc-200 dark:border-white/10 focus:border-[#0066B2]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSlackUrl(!showSlackUrl)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                        title={showSlackUrl ? "Hide URL" : "Show URL"}
                      >
                        {showSlackUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {slackUrlError ? (
                      <p className="text-[11px] text-rose-500 mt-1.5">{slackUrlError}</p>
                    ) : (
                      <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                        In Slack, create an Incoming Webhook, choose its channel, then paste the generated hooks.slack.com URL here. Leave it blank to disconnect.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                      Slack receives the name, email, lead magnet title, and a link to the page. It never blocks the signup or resource email.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!account?.slackWebhookUrl) {
                          addToast("Please enter your Slack incoming-webhook URL first.", "error");
                          return;
                        }
                        if (!validateUrl(account.slackWebhookUrl)) {
                          addToast("Invalid Slack webhook URL format.", "error");
                          return;
                        }
                        try {
                          const res = await fetch("/api/data", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "sendTestSlackAlert",
                              data: { webhookUrl: account.slackWebhookUrl },
                              email: account.email,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            addToast("🎉 Test Slack message sent! Check your Slack channel.", "success");
                          } else {
                            addToast(data.error || "Failed to send test message to Slack. Check the webhook URL.", "error");
                          }
                        } catch (err: any) {
                          addToast(`Error sending test message: ${err.message}`, "error");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0 cursor-pointer"
                    >
                      <Slack className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
                      Send test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zapier Expandable Card */}
          <div className={`${openSections["zapier-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
            <div
              onClick={() => toggle("zapier-webhook")}
              className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#FF4F00] border border-[#FFDCD0] dark:bg-[#33180F] dark:border-[#522518]">
                  <Zap className="h-4.5 w-4.5 fill-current" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Zapier</h5>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Trigger a Zap whenever a new lead signs up.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["zapier-webhook"] ? "rotate-180" : ""}`} />
              </div>
            </div>

            {/* Expanded Zapier Webhook Input Panel with Grid Height Animation */}
            <div className={`grid transition-all duration-300 ease-in-out ${openSections["zapier-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                  {/* Instruction Note Box */}
                  <div className="rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1C1C20] p-3 text-xs text-zinc-600 dark:text-[#9B9085]">
                    In Zapier, choose <strong className="text-zinc-900 dark:text-white font-semibold">Webhooks by Zapier</strong> as the trigger, select <strong className="text-zinc-900 dark:text-white font-semibold">Catch Hook</strong>, then copy its webhook URL.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                      Zapier Catch Hook URL
                    </label>
                    <div className="relative">
                      <input
                        type={showZapierUrl ? "text" : "password"}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        value={account?.zapierWebhookUrl || ""}
                        onChange={(e) => {
                          markDirty("zapierWebhookUrl");
                          const url = e.target.value;
                          if (validateUrl(url)) {
                            setZapierUrlError("");
                          } else {
                            setZapierUrlError("Please enter a valid URL (starting with http:// or https://)");
                          }
                          setAccount((prev) => prev ? { ...prev, zapierWebhookUrl: url } : prev);
                        }}
                        onBlur={() => {
                          if (account?.zapierWebhookUrl && !validateUrl(account.zapierWebhookUrl)) {
                            addToast("Please enter a valid Zapier catch hook URL (https://...)", "error");
                            return;
                          }
                          handleSave();
                        }}
                        className={`w-full rounded-xl border bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none transition font-mono ${
                          zapierUrlError ? "border-rose-500 focus:border-rose-500" : "border-zinc-200 dark:border-white/10 focus:border-[#FF4F00]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowZapierUrl(!showZapierUrl)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                        title={showZapierUrl ? "Hide URL" : "Show URL"}
                      >
                        {showZapierUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {zapierUrlError ? (
                      <p className="text-[11px] text-rose-500 mt-1.5">{zapierUrlError}</p>
                    ) : (
                      <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                        Paste the unique hooks.zapier.com URL from the Test tab. Leave it blank to disconnect.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                      Each event includes the lead, signup ID, lead magnet, and public page URL. Zapier never blocks the signup or resource email.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!account?.zapierWebhookUrl) {
                          addToast("Please enter your Zapier Catch Hook URL first.", "error");
                          return;
                        }
                        if (!validateUrl(account.zapierWebhookUrl)) {
                          addToast("Invalid Zapier Catch Hook URL format.", "error");
                          return;
                        }
                        try {
                          const res = await fetch("/api/data", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "sendTestZapierAlert",
                              data: { webhookUrl: account.zapierWebhookUrl },
                              email: account.email,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            addToast("⚡ Test Zapier event sent! Check your Zapier test trigger tab.", "success");
                          } else {
                            addToast(data.error || "Failed to send test payload to Zapier. Check the webhook URL.", "error");
                          }
                        } catch (err: any) {
                          addToast(`Error sending test payload: ${err.message}`, "error");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-[#FF4F00]" />
                      Send test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pipedrive Expandable Card */}
          <div className={`${openSections["pipedrive-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
            <div
              onClick={() => toggle("pipedrive-webhook")}
              className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] dark:bg-[#0f2e1b] overflow-hidden p-1.5">
                  <img src="/brand/pipedrive.svg" alt="Pipedrive" className="h-full w-full object-contain" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Pipedrive</h5>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Create or update a person for each signup using their email address.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["pipedrive-webhook"] ? "rotate-180" : ""}`} />
              </div>
            </div>

            {/* Expanded Pipedrive API Token Panel with Smooth Height Animation */}
            <div className={`grid transition-all duration-300 ease-in-out ${openSections["pipedrive-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                      Pipedrive API token
                    </label>
                    <div className="relative">
                      <input
                        type={showPipedriveToken ? "text" : "password"}
                        placeholder="Paste your Pipedrive API token"
                        value={account?.pipedriveApiToken || ""}
                        onChange={(e) => {
                          markDirty("pipedriveApiToken");
                          const token = e.target.value;
                          setAccount((prev) => prev ? { ...prev, pipedriveApiToken: token } : prev);
                        }}
                        onBlur={() => handleSave()}
                        className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#28A745] transition font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPipedriveToken(!showPipedriveToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                        title={showPipedriveToken ? "Hide Token" : "Show Token"}
                      >
                        {showPipedriveToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                      In Pipedrive, open Personal preferences, then API. Paste the API token here. Leave it blank to disconnect.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                      Existing contacts are matched by email. Pipedrive sync never blocks the signup or resource email.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!account?.pipedriveApiToken) {
                          addToast("Please enter your Pipedrive API token first.", "error");
                          return;
                        }
                        try {
                          const res = await fetch("/api/data", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "sendTestPipedriveAlert",
                              data: { apiToken: account.pipedriveApiToken },
                              email: account.email,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            addToast(`🎉 Pipedrive connection successful! Connected as ${data.user}.`, "success");
                          } else {
                            addToast(data.error || "Failed to connect to Pipedrive. Please check your API token.", "error");
                          }
                        } catch (err: any) {
                          addToast(`Error connecting to Pipedrive: ${err.message}`, "error");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1E1E22] text-xs font-semibold text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#25252A] transition shrink-0 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Test connection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kit Expandable Card */}
          <div className={`${openSections["kit-webhook"] ? "md:col-span-2" : "md:col-span-1"} rounded-2xl border border-[#0066B2]/30 bg-white dark:border-[#0066B2]/35 dark:bg-[#121214] overflow-hidden shadow-sm transition-all duration-300 ease-in-out`}>
            <div
              onClick={() => toggle("kit-webhook")}
              className="p-4 flex items-center justify-between hover:bg-[#EFF6FF] dark:hover:bg-[#18181c] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] dark:bg-[#331118]">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-white">Kit</h5>
                  <p className="text-xs text-zinc-500 dark:text-[#9B9085] mt-0.5">Add every signup to Kit and tag the lead magnet they requested.</p>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#0066B2]/30 bg-white text-zinc-500 shadow-sm dark:border-[#0066B2]/30 dark:bg-[#18181B] transition-transform duration-300">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections["kit-webhook"] ? "rotate-180" : ""}`} />
              </div>
            </div>

            {/* Expanded Kit Authorization Panel with Smooth Height Animation */}
            <div className={`grid transition-all duration-300 ease-in-out ${openSections["kit-webhook"] ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-white/5 space-y-4 bg-zinc-50/50 dark:bg-[#151518]">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9B9085] mb-2">
                      Kit API Secret / Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKitKey ? "text" : "password"}
                        placeholder="Paste your Kit API Secret (e.g. FM9REw...) or API Key"
                        value={account?.kitApiKey || ""}
                        onChange={(e) => {
                          markDirty("kitApiKey");
                          const key = e.target.value;
                          setAccount((prev) => prev ? { ...prev, kitApiKey: key, kitConnected: !!key.trim() } : prev);
                        }}
                        onBlur={() => handleSave()}
                        className="w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-[#0E0E10] pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#555] outline-none focus:border-[#FF6A3D] transition font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKitKey(!showKitKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                        title={showKitKey ? "Hide Key" : "Show Key"}
                      >
                        {showKitKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-[#666675] mt-1.5">
                      In Kit, open Settings → Advanced, then copy your API Key. Leave blank to disconnect.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-zinc-500 dark:text-[#666675]">
                      Kit subscriber sync runs automatically after every lead magnet signup.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!account?.kitApiKey && !account?.kitConnected) {
                          addToast("Please enter your Kit V3 API Key first.", "error");
                          return;
                        }
                        try {
                          const res = await fetch("/api/data", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "sendTestKitAlert",
                              data: { apiKey: account?.kitApiKey },
                              email: account?.email,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            setAccount((prev) => prev ? { ...prev, kitConnected: true } : prev);
                            await handleSave({ kitConnected: true });
                            addToast(`🎉 Kit connection successful! Account: ${data.user}`, "success");
                          } else {
                            addToast(data.error || "Failed to verify Kit API Key. Check Settings -> Advanced in Kit.", "error");
                          }
                        } catch (err: any) {
                          addToast(`Error connecting to Kit: ${err.message}`, "error");
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 shadow-sm cursor-pointer ${
                        account?.kitConnected
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-[#FF6A3D] text-white hover:bg-[#E8592E]"
                      }`}
                    >
                      {account?.kitConnected ? "Kit Connected ✓" : "Test & Connect Kit"}
                    </button>
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


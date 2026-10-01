"use client";

import { ArrowRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { type CustomFormField } from "@/lib/data";

export default function MagnetSignupForm({
  cta,
  formTitle,
  formSubtitle,
  formButtonText,
  deliverable,
  accent,
  pageId,
  pageName,
  pageSlug,
  pageOwnerEmail,
  brandColor = "#0066B2",
  highlightIntensity = 100,
  themeMode = "light",
  customPromptQuestion,
  customPromptPlaceholder,
  enableAiPersonalizedDeliverable,
  customFormFields = [],
  username,
  isVariantB = false,
  layout = "standard",
  afterSignupOption = "standard",
  destinationUrl,
}: {
  cta: string;
  formTitle?: string;
  formSubtitle?: string;
  formButtonText?: string;
  deliverable: string;
  accent: string;
  pageId: string;
  pageName: string;
  pageSlug?: string;
  pageOwnerEmail?: string;
  brandColor?: string;
  highlightIntensity?: number;
  themeMode?: "light" | "dark";
  customPromptQuestion?: string;
  customPromptPlaceholder?: string;
  enableAiPersonalizedDeliverable?: boolean;
  customFormFields?: CustomFormField[];
  username?: string;
  isVariantB?: boolean;
  layout?: "standard" | "horizontal-glass" | "split-panel" | "editorial" | "monograph" | "brutalist" | "poster" | "collage-zine" | "premium-night";
  afterSignupOption?: "standard" | "elsewhere" | "custom";
  destinationUrl?: string;
}) {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [personalizedOutput, setPersonalizedOutput] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setErrorMsg(null);
    setLoading(true);
    try {
      let customDeliverable = deliverable;

      if (enableAiPersonalizedDeliverable && customAnswer.trim()) {
        try {
          const aiRes = await fetch("/api/ai/generate-magnet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: customAnswer.trim(),
              deliverableTitle: deliverable,
              pageTitle: pageName,
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            if (aiData.content) {
              customDeliverable = aiData.content;
              setPersonalizedOutput(aiData.content);
            }
          }
        } catch (err) {
          console.warn("AI generation failed, using default deliverable", err);
        }
      }

      let liLeadId = "";
      let liAuthorId = "";
      if (typeof window !== "undefined") {
        try {
          const sp = new URLSearchParams(window.location.search);
          liLeadId = sp.get("li_lead") || "";
          liAuthorId = sp.get("li_author") || sp.get("authorId") || "";
        } catch (_) {}
      }

      const newLead = {
        id: `l_${Date.now()}`,
        name: name.trim() || email.split("@")[0],
        email: email.trim(),
        page: pageName,
        pageId: pageId,
        pageSlug: pageSlug || "",
        userEmail: pageOwnerEmail || "",
        status: "new",
        source: liLeadId || liAuthorId ? "linkedin-comment" : "leadmagnets",
        signedUpAt: new Date().toISOString(),
        tags: enableAiPersonalizedDeliverable ? ["ai-personalized"] : [],
        customAnswer: customAnswer.trim(),
        customFields: {
          ...customFieldValues,
          liLeadId,
          liAuthorId,
        },
        liLeadId,
        liAuthorId,
        isVariantB: Boolean(isVariantB),
        afterSignupOption: afterSignupOption || "standard",
        destinationUrl: destinationUrl || "",
      };

      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addLead", data: newLead }),
      });

      if (res.ok) {
        const json = await res.json();
        // Determine effective redirect option & destination URL (prioritize active prop or server response)
        const effectiveOption = (afterSignupOption === "elsewhere" || json?.afterSignupOption === "elsewhere")
          ? "elsewhere"
          : (afterSignupOption === "custom" || json?.afterSignupOption === "custom")
            ? "custom"
            : (afterSignupOption || json?.afterSignupOption || "standard");

        const effectiveDest = (destinationUrl && destinationUrl.trim())
          || (json?.destinationUrl && json.destinationUrl.trim())
          || "";

        if (json.downloadUrl) {
          setDownloadUrl(json.downloadUrl);
        }
        setDone(true);
        const finalLead = {
          ...newLead,
          deliverable: customDeliverable,
          downloadUrl: json.downloadUrl || null,
        };

        // Update local storage pages signups counter & leads cache instantly
        try {
          const cachedPages = localStorage.getItem("currentUserPages");
          if (cachedPages) {
            const pagesList = JSON.parse(cachedPages);
            const targetPage = pagesList.find((p: any) => p.id === pageId || p.name === pageName);
            if (targetPage) {
              targetPage.signups = (targetPage.signups || 0) + 1;
              if (isVariantB) {
                targetPage.variantBSignups = (targetPage.variantBSignups || 0) + 1;
              } else {
                targetPage.variantASignups = (targetPage.variantASignups || 0) + 1;
              }
              localStorage.setItem("currentUserPages", JSON.stringify(pagesList));
            }
          }
          const cachedLeads = localStorage.getItem("currentUserLeads");
          if (cachedLeads) {
            const leadsList = JSON.parse(cachedLeads);
            leadsList.unshift(finalLead);
            localStorage.setItem("currentUserLeads", JSON.stringify(leadsList));
          } else {
            localStorage.setItem("currentUserLeads", JSON.stringify([finalLead]));
          }
        } catch (_) { }

        // Notify any open dashboard / editor tabs instantly
        try {
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const bc = new BroadcastChannel("leadmagnets_live_sync");
            bc.postMessage({ type: "STATS_UPDATED", pageId });
            bc.close();
          }
        } catch (_) {}

        // If "Send them elsewhere" option is active with a valid destination URL -> Instant external redirect
        if (effectiveOption === "elsewhere" && effectiveDest) {
          const rawUrl = effectiveDest.trim();
          const targetExternalUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
          window.location.href = targetExternalUrl;
          return;
        }

        // Construct redirect URL to thank-you page
        const targetUser = username || "u";
        const targetSlug = pageSlug || pageId;
        const queryParams = new URLSearchParams();
        if (email) queryParams.set("email", email.trim());
        if (name) queryParams.set("name", name.trim());
        if (customAnswer) queryParams.set("answer", customAnswer.trim());
        if (customDeliverable && customDeliverable !== deliverable) {
          queryParams.set("aiOutput", customDeliverable);
        }

        const thankYouRoute = `/${encodeURIComponent(targetUser)}/${encodeURIComponent(targetSlug)}/thank-you?${queryParams.toString()}`;
        
        // Instant smooth redirect to Thank You page
        window.location.href = thankYouRoute;
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMsg(errJson.error || "Failed to submit sign up. Please try again.");
      }
    } catch (err) {
      console.error("Failed to submit lead", err);
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: themeMode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.9)",
    borderColor: themeMode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
    color: themeMode === "dark" ? "#ffffff" : "#000000",
  };

  return (
    <div className="w-full" suppressHydrationWarning>
      {done ? (
        <div className={`rounded-2xl border p-5 text-left transition-colors duration-300 ${themeMode === "dark"
            ? "bg-[#161619] border-[#252529] text-white"
            : "bg-white border-zinc-200 text-zinc-900 shadow-sm"
          }`}>
          <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden="true" />
          <p className={`mt-2 text-sm font-bold ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
            On its way — check <span className={`underline decoration-[#0066B2] font-extrabold ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>{email}</span>
          </p>
          <p className={`mt-1 text-xs leading-5 font-medium ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
            Your resource is being delivered right now.
          </p>

          <a
            href={downloadUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-4 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-98 cursor-pointer w-full text-center"
          >
            <ArrowRight className="h-4 w-4" />
            <span>📥 Click Here to Download Resource Immediately</span>
          </a>
        </div>
      ) : layout === "premium-night" ? (
        (() => {
          const isDark = themeMode === "dark";
          const accentColor = brandColor || "#fb4d6a";

          return (
            <div className="w-full" suppressHydrationWarning style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <form onSubmit={handleSubmit} className="space-y-3.5" suppressHydrationWarning>
                <div className="field">
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                      isDark
                        ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280] focus:border-[#fb4d6a]"
                        : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400 focus:border-[#fb4d6a]"
                    }`}
                  />
                </div>
                <div className="field">
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work email"
                    className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                      isDark
                        ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280] focus:border-[#fb4d6a]"
                        : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400 focus:border-[#fb4d6a]"
                    }`}
                  />
                </div>

                {/* Custom Form Fields */}
                {customFormFields && customFormFields.length > 0 && (
                  <div className="space-y-3">
                    {customFormFields.map((field) => (
                      <div key={field.id} className="field">
                        {field.type === "textarea" ? (
                          <textarea
                            required={field.required}
                            disabled={loading}
                            placeholder={`${field.label || field.placeholder || "Answer"}${field.required ? " *" : ""}`}
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            rows={2}
                            className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                              isDark
                                ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                                : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                            }`}
                          />
                        ) : field.type === "select" ? (
                          <select
                            required={field.required}
                            disabled={loading}
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                              isDark
                                ? "bg-[#0c0d11] border-[#2c2d36] text-white"
                                : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900"
                            }`}
                          >
                            <option value="">{field.label || "Select..."}</option>
                            {field.options?.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type || "text"}
                            required={field.required}
                            disabled={loading}
                            placeholder={`${field.label || field.placeholder || "Answer"}${field.required ? " *" : ""}`}
                            value={customFieldValues[field.id] || ""}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                              isDark
                                ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                                : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Personalized Deliverable Field */}
                {enableAiPersonalizedDeliverable && (
                  <div className="field">
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={customAnswer}
                      onChange={(e) => setCustomAnswer(e.target.value)}
                      placeholder={customPromptPlaceholder || customPromptQuestion || "Your focus / objective"}
                      className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                        isDark
                          ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                          : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-[12px] bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500 text-center">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-3.5 px-6 rounded-[14px] font-extrabold text-sm tracking-[0.01em] shadow-lg transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  style={{ 
                    backgroundColor: accentColor,
                    boxShadow: `0 10px 24px -6px ${accentColor}66`
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </span>
                  ) : (
                    formButtonText || cta || "Get instant access"
                  )}
                </button>
              </form>
            </div>
          );
        })()
      ) : layout === "collage-zine" ? (
        (() => {
          const isDark = themeMode === "dark";

          return (
            <div className="w-full" suppressHydrationWarning>
              <form onSubmit={handleSubmit} className="space-y-2.5 font-dm-sans" suppressHydrationWarning>
                <input
                  required
                  type="text"
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="YOUR NAME"
                  className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                />
                <input
                  required
                  type="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL@ADDRESS.COM"
                  className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                />

                {/* Custom Form Fields */}
                {customFormFields &&
                  customFormFields.map((field) => (
                    <div key={field.id}>
                      {field.type === "textarea" ? (
                        <textarea
                          rows={2}
                          required={field.required}
                          disabled={loading}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          placeholder={`${(field.label || "DETAILS").toUpperCase()}${field.required ? " *" : ""}`}
                          className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none resize-none"
                        />
                      ) : field.type === "select" ? (
                        <select
                          required={field.required}
                          disabled={loading}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] outline-none cursor-pointer"
                        >
                          <option value="">
                            {`${(field.label || "SELECT OPTION").toUpperCase()}${field.required ? " *" : ""}`}
                          </option>
                          {(field.options || []).map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || "text"}
                          required={field.required}
                          disabled={loading}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          placeholder={`${(field.label || "FIELD").toUpperCase()}${field.required ? " *" : ""}`}
                          className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                        />
                      )}
                    </div>
                  ))}

                {/* AI Personalized Deliverable Field */}
                {enableAiPersonalizedDeliverable && (
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    placeholder={(customPromptPlaceholder || customPromptQuestion || "YOUR MAIN FOCUS / OBJECTIVE").toUpperCase()}
                    className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                  />
                )}

                {errorMsg && (
                  <div className="p-2 border-2 border-red-500 bg-red-100 text-red-700 text-xs font-bold font-dm-sans">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full border-2 border-[#141414] bg-[#f5ed21] hover:bg-[#faea00] text-[#141414] p-3.5 font-dm-sans font-extrabold text-xs sm:text-sm tracking-wider uppercase cursor-pointer transition-all disabled:opacity-50 ${
                      isDark
                        ? "shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000]"
                        : "shadow-[4px_4px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#141414]"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#141414]" />
                        <span>SENDING YOUR ZINE...</span>
                      </span>
                    ) : (
                      formButtonText || cta || "YES, SEND IT! ↗"
                    )}
                  </button>
                </div>
              </form>
            </div>
          );
        })()
      ) : layout === "poster" ? (
        (() => {
          const accentColor = brandColor || "#ff5038";
          const isDark = themeMode === "dark";
          const formBoxBg = isDark ? "#f5f1e8" : "#0b0d12";
          const formBoxText = isDark ? "#0b0d12" : "#f5f1e8";
          const formBoxMuted = isDark ? "#4b5563" : "#b9bbc3";
          const formBoxInputBorder = isDark ? "#0b0d12" : "#f5f1e8";

          return (
            <div
              className="p-6 sm:p-7 shadow-2xl transition-all"
              suppressHydrationWarning
              style={{
                backgroundColor: formBoxBg,
                color: formBoxText,
                fontFamily: "'Space Mono', monospace, ui-monospace, sans-serif",
              }}
            >
              <div className="space-y-1 mb-4" suppressHydrationWarning>
                <h2
                  className="font-bebas text-3xl sm:text-4xl tracking-normal uppercase m-0 leading-tight"
                  style={{ color: formBoxText }}
                  suppressHydrationWarning
                >
                  {formTitle || "ENTER THE ARCHIVE"}
                </h2>
                <p
                  className="font-space text-[11px] leading-relaxed m-0"
                  style={{ color: formBoxMuted }}
                  suppressHydrationWarning
                >
                  {formSubtitle || "Receive the complete report and three working templates."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 font-space">
                <div>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="YOUR NAME"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                    style={{
                      borderBottomColor: formBoxInputBorder,
                      color: formBoxText,
                    }}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    placeholder="EMAIL ADDRESS"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                    style={{
                      borderBottomColor: formBoxInputBorder,
                      color: formBoxText,
                    }}
                  />
                </div>

                {customFormFields &&
                  customFormFields.map((field) => (
                    <div key={field.id}>
                      {field.type === "textarea" ? (
                        <textarea
                          rows={2}
                          required={field.required}
                          disabled={loading}
                          placeholder={`${(field.label || "").toUpperCase()}${field.required ? " *" : ""}`}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none resize-none transition-colors"
                          style={{
                            borderBottomColor: formBoxInputBorder,
                            color: formBoxText,
                          }}
                        />
                      ) : field.type === "select" ? (
                        <select
                          required={field.required}
                          disabled={loading}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none cursor-pointer transition-colors"
                          style={{
                            borderBottomColor: formBoxInputBorder,
                            color: formBoxText,
                            backgroundColor: formBoxBg,
                          }}
                        >
                          <option value="">
                            {`${(field.label || "SELECT").toUpperCase()}${field.required ? " *" : ""}`}
                          </option>
                          {(field.options || []).map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          required={field.required}
                          disabled={loading}
                          placeholder={`${(field.label || "").toUpperCase()}${field.required ? " *" : ""}`}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                          style={{
                            borderBottomColor: formBoxInputBorder,
                            color: formBoxText,
                          }}
                        />
                      )}
                    </div>
                  ))}

                {enableAiPersonalizedDeliverable && (
                  <div>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      placeholder={(customPromptPlaceholder || customPromptQuestion || "YOUR PRIMARY OBJECTIVE").toUpperCase()}
                      value={customAnswer}
                      onChange={(e) => setCustomAnswer(e.target.value)}
                      className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                      style={{
                        borderBottomColor: formBoxInputBorder,
                        color: formBoxText,
                      }}
                    />
                  </div>
                )}

                {errorMsg && (
                  <p className="text-red-500 font-space text-[10px] m-0 pt-1">
                    {errorMsg}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-center py-3.5 px-4 font-space font-bold text-xs uppercase cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                    style={{
                      backgroundColor: accentColor,
                      color: isDark ? "#0b0d12" : "#ffffff",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>VERIFYING...</span>
                      </span>
                    ) : (
                      formButtonText || cta || "UNLOCK THE REPORT →"
                    )}
                  </button>
                </div>
              </form>
            </div>
          );
        })()
      ) : layout === "brutalist" ? (
        (() => {
          const accentColor = brandColor || "#f4ff3c";
          const getContrastColor = (hexColor: string) => {
            if (!hexColor || !hexColor.startsWith("#")) return "#000000";
            const hex = hexColor.replace("#", "");
            if (hex.length !== 6) return "#000000";
            const r = parseInt(hex.substring(0, 2), 16) || 0;
            const g = parseInt(hex.substring(2, 4), 16) || 0;
            const b = parseInt(hex.substring(4, 6), 16) || 0;
            const yiq = (r * 299 + g * 587 + b * 114) / 1000;
            return yiq >= 135 ? "#000000" : "#ffffff";
          };
          const isVeryDark = (hexColor: string) => {
            if (!hexColor || !hexColor.startsWith("#")) return false;
            const hex = hexColor.replace("#", "");
            if (hex.length !== 6) return false;
            const r = parseInt(hex.substring(0, 2), 16) || 0;
            const g = parseInt(hex.substring(2, 4), 16) || 0;
            const b = parseInt(hex.substring(4, 6), 16) || 0;
            const yiq = (r * 299 + g * 587 + b * 114) / 1000;
            return yiq < 35;
          };

          const contrastOnAccent = getContrastColor(accentColor);
          const darkAccent = isVeryDark(accentColor) ? "#ffffff" : accentColor;
          const contrastOnDarkAccent = getContrastColor(darkAccent);

          return (
            <form
              onSubmit={handleSubmit}
              className="space-y-0 border-b-2"
              style={{ borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010" }}
            >
              {/* Field 1: Name */}
              <div
                className={`grid grid-cols-[100px_1fr] sm:grid-cols-[115px_1fr] border-t-2 items-stretch ${
                  themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-transparent"
                }`}
              >
                <label
                  className="p-3.5 sm:p-4 font-ibm text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-r-2 flex items-center shrink-0"
                  style={{
                    borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010",
                    color: themeMode === "dark" ? darkAccent : contrastOnAccent,
                  }}
                >
                  NAME
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="TYPE HERE"
                  className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium ${
                    themeMode === "dark"
                      ? "text-white placeholder:text-zinc-600"
                      : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                  }`}
                />
              </div>

              {/* Field 2: Email */}
              <div
                className={`grid grid-cols-[100px_1fr] sm:grid-cols-[115px_1fr] border-t-2 items-stretch ${
                  themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-transparent"
                }`}
              >
                <label
                  className="p-3.5 sm:p-4 font-ibm text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-r-2 flex items-center shrink-0"
                  style={{
                    borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010",
                    color: themeMode === "dark" ? darkAccent : contrastOnAccent,
                  }}
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOU@WORK.COM"
                  className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium ${
                    themeMode === "dark"
                      ? "text-white placeholder:text-zinc-600"
                      : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                  }`}
                />
              </div>

              {/* Custom Form Fields */}
              {customFormFields &&
                customFormFields.map((field) => (
                  <div
                    key={field.id}
                    className={`grid grid-cols-[100px_1fr] sm:grid-cols-[115px_1fr] border-t-2 items-stretch ${
                      themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-transparent"
                    }`}
                  >
                    <label
                      className="p-3.5 sm:p-4 font-ibm text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-r-2 flex items-center shrink-0"
                      style={{
                        borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010",
                        color: themeMode === "dark" ? darkAccent : contrastOnAccent,
                      }}
                    >
                      {field.label?.toUpperCase() || "FIELD"}
                      {field.required ? " *" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={2}
                        required={field.required}
                        disabled={loading}
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "TYPE HERE"}
                        className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium resize-none ${
                          themeMode === "dark"
                            ? "text-white placeholder:text-zinc-600"
                            : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                        }`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        disabled={loading}
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium cursor-pointer ${
                          themeMode === "dark" ? "text-white bg-[#121215]" : (contrastOnAccent === "#ffffff" ? "text-white bg-black/30" : "text-[#101010] bg-white/30")
                        }`}
                      >
                        <option value="" className={themeMode === "dark" ? "bg-[#121215] text-white" : "bg-white text-black"}>
                          {field.placeholder || "SELECT AN OPTION"}
                        </option>
                        {(field.options || []).map((opt, idx) => (
                          <option key={idx} value={opt} className={themeMode === "dark" ? "bg-[#121215] text-white" : "bg-white text-black"}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        required={field.required}
                        disabled={loading}
                        value={customFieldValues[field.id] || ""}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder || "TYPE HERE"}
                        className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium ${
                          themeMode === "dark"
                            ? "text-white placeholder:text-zinc-600"
                            : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                        }`}
                      />
                    )}
                  </div>
                ))}

              {/* AI Personalized Input */}
              {enableAiPersonalizedDeliverable && (
                <div
                  className={`grid grid-cols-[100px_1fr] sm:grid-cols-[115px_1fr] border-t-3 items-stretch ${
                    themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-transparent"
                  }`}
                >
                  <label
                    className="p-3.5 sm:p-4 font-ibm text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border-r-3 flex items-center shrink-0"
                    style={{
                      borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010",
                      color: themeMode === "dark" ? darkAccent : contrastOnAccent,
                    }}
                  >
                    ✨ FOCUS
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    placeholder={customPromptPlaceholder || customPromptQuestion || "YOUR PRIMARY OBJECTIVE"}
                    className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium ${
                      themeMode === "dark"
                        ? "text-white placeholder:text-zinc-600"
                        : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                    }`}
                  />
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-600 text-white font-ibm text-xs font-bold uppercase mt-3">
                  {errorMsg}
                </div>
              )}

              {/* Submit Action Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full p-4 sm:p-5 font-archivo text-sm sm:text-base tracking-wider uppercase border-3 text-center transition duration-150 cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50"
                  style={
                    themeMode === "dark"
                      ? {
                          backgroundColor: darkAccent,
                          color: contrastOnDarkAccent,
                          borderColor: darkAccent,
                          boxShadow: `4px 4px 0px ${darkAccent}`,
                        }
                      : {
                          backgroundColor: "#101010",
                          color: "#ffffff",
                          borderColor: "#101010",
                          boxShadow: "5px 5px 0px rgba(0,0,0,1)",
                        }
                  }
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>TRANSMITTING LEDGER...</span>
                    </span>
                  ) : (
                    <span>{formButtonText || cta || "Send me the PDF ↗"}</span>
                  )}
                </button>
              </div>
            </form>
          );
        })()
      ) : layout === "monograph" ? (
        <form onSubmit={handleSubmit} className="space-y-4 font-manrope">
          <div className="space-y-3.5">
            <div>
              <label
                className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
              >
                FULL NAME
              </label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                disabled={loading}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                  themeMode === "dark"
                    ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                    : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                }`}
              />
            </div>

            <div>
              <label
                className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
              >
                WORK EMAIL
              </label>
              <input
                type="email"
                required
                placeholder="jane@company.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                  themeMode === "dark"
                    ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                    : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                }`}
              />
            </div>

            {customFormFields && customFormFields.map((field) => (
              <div key={field.id}>
                <label
                  className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                  style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                >
                  {field.label?.toUpperCase() || "ADDITIONAL FIELD"}
                  {field.required ? " *" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    rows={2}
                    placeholder={`${field.label}${field.required ? " *" : ""}`}
                    value={customFieldValues[field.id] || ""}
                    disabled={loading}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition resize-none ${
                      themeMode === "dark"
                        ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                        : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                    }`}
                  />
                ) : field.type === "select" ? (
                  <select
                    required={field.required}
                    value={customFieldValues[field.id] || ""}
                    disabled={loading}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                      themeMode === "dark"
                        ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                        : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                    }`}
                  >
                    <option value="">{`${field.label || "Select"}${field.required ? " *" : ""}`}</option>
                    {(field.options || []).map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    required={field.required}
                    placeholder={`${field.label}${field.required ? " *" : ""}`}
                    value={customFieldValues[field.id] || ""}
                    disabled={loading}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                      themeMode === "dark"
                        ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                        : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {enableAiPersonalizedDeliverable && (
            <div className="space-y-1">
              <label
                className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                style={{ color: brandColor || "#c2410c" }}
              >
                ✨ {customPromptQuestion || "What is your main goal or bottleneck?"}
              </label>
              <input
                type="text"
                required
                value={customAnswer}
                disabled={loading}
                onChange={(e) => setCustomAnswer(e.target.value)}
                placeholder={customPromptPlaceholder || "e.g. Scaling outreach, Lead generation"}
                className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                  themeMode === "dark"
                    ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                    : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                }`}
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xs bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500 text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border-0 p-4 text-[13px] font-bold font-manrope text-white cursor-pointer rounded-xs transition hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ backgroundColor: brandColor || "#c2410c" }}
          >
            {loading ? "Sending..." : formButtonText || cta || "Receive the dispatch →"}
          </button>
        </form>
      ) : layout === "editorial" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.15em] opacity-90">
                YOUR NAME
              </label>
              <input
                type="text"
                required
                placeholder="Jane Holloway"
                value={name}
                disabled={loading}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans transition focus:border-[#2544d8] ${
                  themeMode === "dark"
                    ? "bg-black/30 text-white placeholder:text-zinc-500"
                    : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.15em] opacity-90">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                placeholder="jane@studio.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans transition focus:border-[#2544d8] ${
                  themeMode === "dark"
                    ? "bg-black/30 text-white placeholder:text-zinc-500"
                    : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                }`}
              />
            </div>

            {customFormFields && customFormFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.15em] opacity-90">
                  {field.label?.toUpperCase() || "ADDITIONAL FIELD"}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    rows={2}
                    placeholder={`${field.label}${field.required ? " *" : ""}`}
                    value={customFieldValues[field.id] || ""}
                    disabled={loading}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans transition focus:border-[#2544d8] resize-none ${
                      themeMode === "dark"
                        ? "bg-black/30 text-white placeholder:text-zinc-500"
                        : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    required={field.required}
                    placeholder={`${field.label}${field.required ? " *" : ""}`}
                    value={customFieldValues[field.id] || ""}
                    disabled={loading}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans transition focus:border-[#2544d8] ${
                      themeMode === "dark"
                        ? "bg-black/30 text-white placeholder:text-zinc-500"
                        : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500 text-center font-sans">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-center py-3.5 px-4 text-xs font-sans font-bold uppercase tracking-[0.15em] text-white shadow-md transition cursor-pointer hover:brightness-110 disabled:opacity-50 mt-4 bg-[#2544d8]"
            style={{ backgroundColor: brandColor || "#2544d8" }}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>DISPATCHING...</span>
              </span>
            ) : (
              <span>{formButtonText || cta || "SEND THE DIGITAL ISSUE →"}</span>
            )}
          </button>
        </form>
      ) : layout === "horizontal-glass" ? (
        <form onSubmit={handleSubmit}>
          {customFormFields && customFormFields.length > 0 ? (
            <div className="rounded-2xl p-4 bg-black/50 border border-white/15 backdrop-blur-xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                  <span className="text-xs text-zinc-400">👤</span>
                  <input
                    type="text"
                    required
                    placeholder="Name *"
                    value={name}
                    disabled={loading}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10">
                  <span className="text-xs text-zinc-400">✉️</span>
                  <input
                    type="email"
                    required
                    placeholder="Email *"
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                  />
                </div>
                {customFormFields.map((field) => (
                  <div
                    key={field.id}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-black/40 border border-white/10 ${field.type === "textarea" ? "col-span-1 md:col-span-2" : ""}`}
                  >
                    <input
                      type="text"
                      required={field.required}
                      placeholder={`${field.label}${field.required ? " *" : ""}`}
                      value={customFieldValues[field.id] || ""}
                      disabled={loading}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                    />
                  </div>
                ))}
              </div>
              {enableAiPersonalizedDeliverable && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#0066B2] flex items-center gap-1">
                    ✨ {customPromptQuestion || "What is your main goal or bottleneck?"}
                  </label>
                  <input
                    type="text"
                    required
                    value={customAnswer}
                    disabled={loading}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    placeholder={customPromptPlaceholder || "e.g. Scaling outreach, Lead generation"}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-400 outline-none"
                  />
                </div>
              )}
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500 text-center">
                  {errorMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-xs font-extrabold text-white outline-none cursor-pointer transition text-center disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                  boxShadow: `0 4px 16px -4px ${brandColor}88`
                }}
              >
                {loading ? "Submitting..." : (formButtonText || cta || "Send it to me")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl p-1.5 gap-2 bg-black/50 border border-white/15 backdrop-blur-xl">
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
                <span className="text-xs text-zinc-400">👤</span>
                <input
                  type="text"
                  required
                  placeholder="Name *"
                  value={name}
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                />
              </div>
              <div className="hidden sm:block w-px h-5 shrink-0 bg-white/20" />
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
                <span className="text-xs text-zinc-400">✉️</span>
                <input
                  type="email"
                  required
                  placeholder="Email *"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none text-white placeholder:text-zinc-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="shrink-0 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white outline-none cursor-pointer transition disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`, boxShadow: `0 4px 16px -4px ${brandColor}88` }}
              >
                {loading ? "Submitting..." : (formButtonText || cta || "Send it to me")}
              </button>
            </div>
          )}
        </form>
      ) : layout === "split-panel" ? (
        <div className="space-y-3 w-full">
          {formTitle && (
            <h4 className={`w-full text-center text-xs font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
              {formTitle}
            </h4>
          )}
          {formSubtitle && (
            <p className="w-full text-center text-xs text-zinc-400">
              {formSubtitle}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Name *"
                value={name}
                disabled={loading}
                onChange={(e) => setName(e.target.value)}
                className={`min-h-10 h-10 w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition shadow-xs focus:border-[#0066B2] ${
                  themeMode === "dark"
                    ? "border-[#252529] bg-[#18181C] text-white placeholder:text-zinc-500"
                    : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                }`}
              />
              <input
                type="email"
                required
                placeholder="Email *"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className={`min-h-10 h-10 w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition shadow-xs focus:border-[#0066B2] ${
                  themeMode === "dark"
                    ? "border-[#252529] bg-[#18181C] text-white placeholder:text-zinc-500"
                    : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                }`}
              />

              {customFormFields && customFormFields.length > 0 && (
                customFormFields.map((field) => (
                  <div
                    key={field.id}
                    className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}
                  >
                    {field.type === "textarea" ? (
                      <textarea
                        rows={2}
                        required={field.required}
                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                        value={customFieldValues[field.id] || ""}
                        disabled={loading}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition shadow-xs focus:border-[#0066B2] ${
                          themeMode === "dark"
                            ? "border-[#252529] bg-[#18181C] text-white placeholder:text-zinc-500"
                            : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                        }`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={customFieldValues[field.id] || ""}
                        disabled={loading}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className={`min-h-10 h-10 w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition shadow-xs focus:border-[#0066B2] ${
                          themeMode === "dark"
                            ? "border-[#252529] bg-[#18181C] text-white placeholder:text-zinc-500"
                            : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                        }`}
                      >
                        <option value="">{`${field.label}${field.required ? " *" : ""}`}</option>
                        {(field.options || []).map((opt, idx) => (
                          <option key={idx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "checkbox" ? (
                      <label className="flex items-center gap-2 text-xs cursor-pointer h-10 px-1">
                        <input
                          type="checkbox"
                          required={field.required}
                          checked={!!customFieldValues[field.id]}
                          disabled={loading}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                          className="rounded text-[#0066B2] focus:ring-[#0066B2]"
                        />
                        <span className={themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}>
                          {field.label}{field.required ? " *" : ""}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : "text"}
                        required={field.required}
                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                        value={customFieldValues[field.id] || ""}
                        disabled={loading}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className={`min-h-10 h-10 w-full rounded-xl border px-3.5 py-2 text-xs outline-none transition shadow-xs focus:border-[#0066B2] ${
                          themeMode === "dark"
                            ? "border-[#252529] bg-[#18181C] text-white placeholder:text-zinc-500"
                            : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                        }`}
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {enableAiPersonalizedDeliverable && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#0066B2] flex items-center gap-1">
                  ✨ {customPromptQuestion || "What is your main goal or bottleneck?"}
                </label>
                <input
                  type="text"
                  required
                  value={customAnswer}
                  disabled={loading}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder={customPromptPlaceholder || "e.g. Scaling outreach, Lead generation"}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition shadow-xs ${
                    themeMode === "dark"
                      ? "border-[#252529] bg-[#18181C] text-white placeholder:text-zinc-500"
                      : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                  }`}
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500 text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white shadow-md transition duration-150 outline-none border-2 border-transparent hover:border-white/40 focus:border-white cursor-pointer mt-2 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`,
                boxShadow: `0 6px 24px -4px ${brandColor}88`
              }}
            >
              {loading ? "Sending..." : (formButtonText || cta || "Send it to me")}
            </button>
          </form>
        </div>
      ) : (
        <div className={`rounded-2xl border p-5 sm:p-6 lg:p-6 text-left transition-all duration-300 backdrop-blur-sm shadow-xl ${themeMode === "dark"
          ? "text-white"
          : "text-zinc-900"
          }`}
          style={{
            borderColor: `${brandColor}${Math.round((0.15 + ((highlightIntensity ?? 100) / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`,
            boxShadow: (highlightIntensity ?? 100) > 20 ? `0 10px 30px -4px ${brandColor}${Math.round(((highlightIntensity ?? 100) / 100) * 0.35 * 255).toString(16).padStart(2, '0')}` : "0 2px 8px rgba(0,0,0,0.05)",
            background: themeMode === "light" || !themeMode
              ? `linear-gradient(135deg, ${brandColor}${Math.round((0.05 + ((highlightIntensity ?? 100) / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0.95) 60%)`
              : `linear-gradient(135deg, ${brandColor}${Math.round((0.08 + ((highlightIntensity ?? 100) / 100) * 0.3) * 255).toString(16).padStart(2, '0')} 0%, rgba(22, 22, 25, 0.95) 60%)`
          }}
        >
          <p className="text-xl sm:text-2xl font-black text-center tracking-tight">{formTitle || cta || "Download for free"}</p>
          <p className="text-xs sm:text-sm text-[#9B9085] text-center mt-1.5 leading-normal">
            {formSubtitle || "By opting in you consent to receive this resource by email."}
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-3"
          >
            {customFormFields && customFormFields.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={name}
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  style={inputStyle}
                  className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                />
                <input
                  type="email"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  style={inputStyle}
                  className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                />
                {customFormFields.map((field) => (
                  <div
                    key={field.id}
                    className={`space-y-1 ${
                      field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""
                    }`}
                  >
                    {field.type === "text" && (
                      <input
                        type="text"
                        required={field.required}
                        value={customFieldValues[field.id] || ""}
                        disabled={loading}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                        style={inputStyle}
                        className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                      />
                    )}

                    {field.type === "number" && (
                      <input
                        type="number"
                        required={field.required}
                        value={customFieldValues[field.id] || ""}
                        disabled={loading}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                        style={inputStyle}
                        className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                      />
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        rows={2}
                        required={field.required}
                        value={customFieldValues[field.id] || ""}
                        disabled={loading}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                        style={inputStyle}
                        className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        required={field.required}
                        value={customFieldValues[field.id] || ""}
                        disabled={loading}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        style={inputStyle}
                        className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                      >
                        <option value="">{`${field.label}${field.required ? " *" : ""}`}</option>
                        {(field.options || []).map((opt, idx) => (
                          <option key={idx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "checkbox" && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          required={field.required}
                          checked={!!customFieldValues[field.id]}
                          disabled={loading}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
                          className="rounded text-[#0066B2] focus:ring-[#0066B2]"
                        />
                        <span>{field.label}{field.required ? " *" : ""}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={name}
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  style={inputStyle}
                  className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                />
                <input
                  type="email"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  style={inputStyle}
                  className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                />
              </>
            )}

            {enableAiPersonalizedDeliverable && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#0066B2] flex items-center gap-1">
                  ✨ {customPromptQuestion || "What is your main goal or bottleneck?"}
                </label>
                <input
                  type="text"
                  required
                  value={customAnswer}
                  disabled={loading}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder={customPromptPlaceholder || "e.g. Scaling outreach, Lead generation"}
                  style={inputStyle}
                  className="min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs placeholder:text-zinc-400 focus:border-[#0066B2]"
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500 text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: brandColor }}
              className="w-full min-h-11 h-11 inline-flex items-center justify-center rounded-xl hover:opacity-90 px-4 py-2.5 text-sm font-black text-white transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : (formButtonText || cta || "Send it to me")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
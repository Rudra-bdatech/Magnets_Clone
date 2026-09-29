import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X, Sparkles, ShieldCheck, Zap, Lock, ArrowRight, BookOpen } from "lucide-react";
import { type TemplateProps } from "./types";
import { ImageGeneration } from "@/components/agents/image-generation";

export default function Template5(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets,
    bulletsTitle,
    formTitle,
    formSubtitle,
    formButtonText,
    imageUrl,
    customFormFields = [],
    setCustomFormFields,
    fileInputRef,
    uploadProgress,
    isGeneratingAICover,
    handleGenerateAICoverImage,
    headlineRef,
    subheadlineRef,
    pitchRef,
    setHeadline,
    setSubheadline,
    setPitch,
    setBulletsTitle,
    setFormTitle,
    setFormSubtitle,
    setBullets,
    setImageUrl,
    setFormButtonText,
    isEditor = true,
    isSubmitting = false,
    publicFormValues = {},
    setPublicFormValues,
    onSubmitPublicForm,
  } = props as any;

  const brandColor = account?.brandColor || "#0066B2";
  const themeMode = account?.themeMode || "light";
  const isDark = themeMode === "dark";
  const logo = account?.logo || null;
  const businessName = account?.brandName || account?.name || "Creator";
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full flex-1 flex flex-col justify-center py-4 sm:py-8 max-w-3xl mx-auto px-2 sm:px-4">
      {/* Editorial Card Canvas */}
      <article
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-2xl"
        style={{
          backgroundColor: isDark ? "#0f0f12" : "#ffffff",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          boxShadow: isDark
            ? "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)"
            : "0 25px 60px -15px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Subtle Brand Accent Stripe on right edge */}
        <div
          aria-hidden="true"
          className="absolute right-0 top-8 h-20 w-1.5 rounded-l-full pointer-events-none transition-all duration-300"
          style={{ backgroundColor: brandColor }}
        />

        {/* Top Ambient Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: brandColor }}
        />

        {/* 1. EDITORIAL HEADER SECTION */}
        <header
          className={`px-6 py-6 sm:px-10 sm:py-8 relative z-10 border-b ${
            isDark ? "border-zinc-800/80" : "border-zinc-100"
          }`}
        >
          {/* Creator / Publisher Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {logo ? (
                <img
                  src={logo}
                  alt={businessName}
                  className={`w-11 h-11 rounded-full border object-cover shrink-0 shadow-xs ${
                    isDark ? "border-zinc-700" : "border-zinc-200"
                  }`}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ring-2 ring-white/10"
                  style={{ backgroundColor: brandColor }}
                >
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p
                  className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                  style={{ color: brandColor }}
                >
                  Published by
                </p>
                <p
                  className={`truncate text-sm font-semibold ${
                    isDark ? "text-zinc-100" : "text-zinc-900"
                  }`}
                >
                  {businessName}
                </p>
              </div>
            </div>

            {/* Category / Format Pill */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${brandColor}14`,
                color: brandColor,
                border: `1px solid ${brandColor}30`,
              }}
            >
              <Zap className="w-3 h-3" />
              <span>Proven Frameworks</span>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="space-y-3">
            {isEditor ? (
              <textarea
                ref={headlineRef}
                rows={2}
                value={headline || ""}
                onChange={(e) => {
                  setHeadline?.(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="101 Winning Viral Templates That Get Results"
                className={`w-full text-2xl sm:text-4xl md:text-[2.6rem] font-extrabold tracking-tight leading-[1.12] bg-transparent outline-none resize-none transition-colors ${
                  isDark
                    ? "text-zinc-50 placeholder:text-zinc-600"
                    : "text-zinc-950 placeholder:text-zinc-400"
                }`}
              />
            ) : (
              <h1
                className={`text-2xl sm:text-4xl md:text-[2.6rem] font-extrabold tracking-tight leading-[1.12] ${
                  isDark ? "text-zinc-50" : "text-zinc-950"
                }`}
              >
                {headline || "101 Winning Viral Templates That Get Results"}
              </h1>
            )}

            {/* Subheadline */}
            {isEditor ? (
              <textarea
                ref={subheadlineRef}
                rows={2}
                value={subheadline || ""}
                onChange={(e) => {
                  setSubheadline?.(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                placeholder="Stop staring at a blank page. Use field-tested structures pulled from posts that generated millions of impressions."
                className={`w-full text-sm sm:text-base md:text-lg leading-relaxed bg-transparent outline-none resize-none ${
                  isDark
                    ? "text-zinc-300 placeholder:text-zinc-600"
                    : "text-zinc-600 placeholder:text-zinc-400"
                }`}
              />
            ) : subheadline ? (
              <p
                className={`text-sm sm:text-base md:text-lg leading-relaxed ${
                  isDark ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {subheadline}
              </p>
            ) : null}
          </div>
        </header>

        {/* 2. RESOURCE PREVIEW / SHOWCASE SECTION */}
        <section
          aria-label="Resource Preview"
          className={`relative px-6 py-7 sm:px-10 sm:py-9 border-b ${
            isDark
              ? "bg-[#141418]/60 border-zinc-800/80"
              : "bg-zinc-50/70 border-zinc-100"
          }`}
        >
          <div
            className={`relative group rounded-xl sm:rounded-2xl overflow-hidden border shadow-md ${
              isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200/90 bg-zinc-950"
            }`}
          >
            {/* Upload Progress Overlay */}
            {uploadProgress !== null && uploadProgress !== undefined && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-white">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-white">
                      {uploadProgress === 100 ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                      )}
                      {uploadProgress === 100 ? "Ready!" : "Uploading image..."}
                    </span>
                    <span className="font-mono text-sky-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-150 ease-out"
                      style={{ width: `${uploadProgress}%`, backgroundColor: brandColor }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 text-center">Optimizing preview graphic...</p>
                </div>
              </div>
            )}

            {/* AI Generation State */}
            {isGeneratingAICover ? (
              <ImageGeneration
                status="generating"
                prompt={headline || "101 Winning Viral Templates Preview"}
                resolution="1200 × 900"
                label="AI generating custom editorial showcase graphic"
                aspectRatio="16 / 10"
                className="w-full h-full min-h-[260px] sm:min-h-[340px]"
              />
            ) : imageUrl && imageUrl.trim() !== "" ? (
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
                <img
                  src={imageUrl}
                  alt="Resource Preview"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
              </div>
            ) : (
              /* High-Tech Editorial Placeholder Graphic */
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full flex flex-col items-center justify-center p-8 bg-[#0b0c10] text-zinc-300 select-none overflow-hidden">
                {/* Background Tech Grid */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${brandColor} 1px, transparent 0)`,
                    backgroundSize: "24px 24px",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none opacity-25"
                  style={{
                    background: `radial-gradient(ellipse at center, ${brandColor}33 0%, transparent 70%)`,
                  }}
                />

                <div className="relative z-10 flex flex-col items-center text-center space-y-3 max-w-md">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
                    style={{ backgroundColor: `${brandColor}22` }}
                  >
                    <BookOpen className="w-7 h-7" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide">
                      {headline || "101 Winning Viral Templates"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Comprehensive playbook &amp; ready-to-use frameworks
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Editor Action Overlay Controls */}
            {isEditor && (
              <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-lg border border-white/20 backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
                  <span>{imageUrl && imageUrl.trim() !== "" ? "Replace Image" : "Upload Cover"}</span>
                </button>

                {handleGenerateAICoverImage && (
                  <button
                    type="button"
                    onClick={handleGenerateAICoverImage}
                    disabled={isGeneratingAICover}
                    className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black px-3 py-1.5 text-xs font-semibold text-purple-300 shadow-lg border border-purple-500/30 backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>AI Generate</span>
                  </button>
                )}

                {imageUrl && imageUrl.trim() !== "" && setImageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-red-950/90 px-2.5 py-1.5 text-xs font-semibold text-red-400 shadow-lg border border-red-500/30 backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Floating Pill Caption */}
          <div className="flex justify-center -mt-3 relative z-20">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-lg border backdrop-blur-md"
              style={{
                backgroundColor: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)",
                color: isDark ? "#ffffff" : "#09090b",
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
              <span>Previewing: Strategy, Templates &amp; Examples</span>
            </div>
          </div>
        </section>

        {/* 3. VALUE PROPOSITION & FORM SECTION */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-7">
          {/* Pitch Section */}
          {isEditor ? (
            <textarea
              ref={pitchRef}
              rows={2}
              value={pitch || ""}
              onChange={(e) => {
                setPitch?.(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Stop staring at a blank page. Use field-tested structures pulled from posts that generated millions of impressions."
              className={`w-full text-sm sm:text-base leading-relaxed bg-transparent outline-none resize-none ${
                isDark
                  ? "text-zinc-300 placeholder:text-zinc-600"
                  : "text-zinc-700 placeholder:text-zinc-400"
              }`}
            />
          ) : pitch ? (
            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isDark ? "text-zinc-300" : "text-zinc-700"
              }`}
            >
              {pitch}
            </p>
          ) : null}

          {/* "Inside The Guide" Checklist Section */}
          <div className="space-y-4">
            {isEditor ? (
              <input
                type="text"
                value={bulletsTitle || ""}
                onChange={(e) => setBulletsTitle?.(e.target.value)}
                placeholder="INSIDE THE GUIDE"
                className={`w-full text-xs font-bold uppercase tracking-wider bg-transparent outline-none ${
                  isDark
                    ? "text-zinc-400 placeholder:text-zinc-600"
                    : "text-zinc-500 placeholder:text-zinc-400"
                }`}
              />
            ) : (
              <h2
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                {bulletsTitle || "Inside the guide"}
              </h2>
            )}

            {/* Bullets List */}
            {bullets && bullets.length > 0 ? (
              <ul className="grid gap-3.5">
                {bullets.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-sm leading-6">
                    {/* Modern Micro Ring Indicator */}
                    <span
                      aria-hidden="true"
                      className="mt-1 grid size-4 shrink-0 place-items-center rounded-full"
                      style={{ backgroundColor: `${brandColor}18` }}
                    >
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                    </span>

                    {isEditor ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            if (!bullets || !setBullets) return;
                            const u = [...bullets];
                            u[idx] = e.target.value;
                            setBullets(u);
                          }}
                          className={`w-full bg-transparent outline-none text-sm ${
                            isDark ? "text-zinc-200" : "text-zinc-800"
                          }`}
                          placeholder="Bullet point item..."
                        />
                        <button
                          type="button"
                          onClick={() => setBullets?.(bullets.filter((_: any, i: number) => i !== idx))}
                          className={`transition cursor-pointer p-1 ${
                            isDark ? "text-zinc-400 hover:text-red-400" : "text-zinc-500 hover:text-red-500"
                          }`}
                          title="Remove bullet point"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>{item}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : isEditor ? (
              <p
                className={`text-xs italic ${
                  isDark ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                No bullets yet. Click add bullet below.
              </p>
            ) : null}

            {isEditor && setBullets && (
              <button
                type="button"
                onClick={() => setBullets([...(bullets || []), ""])}
                className={`inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isDark
                    ? "border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300"
                    : "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add bullet point</span>
              </button>
            )}
          </div>

          {/* 4. EMBEDDED HIGH-CONVERTING LEAD MAGNET FORM CARD */}
          <div
            className="rounded-2xl border p-6 sm:p-8 space-y-4 shadow-sm relative overflow-hidden"
            style={{
              backgroundColor: isDark ? "rgba(20,20,24,0.85)" : "rgba(248,249,251,0.95)",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
          >
            {/* Form Title & Subtitle */}
            {isEditor ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  className={`w-full text-base font-bold bg-transparent outline-none ${
                    isDark
                      ? "text-zinc-100 placeholder:text-zinc-600"
                      : "text-zinc-900 placeholder:text-zinc-400"
                  }`}
                  placeholder="Get instant access to the templates"
                />
                <input
                  type="text"
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  className={`w-full text-xs bg-transparent outline-none ${
                    isDark
                      ? "text-zinc-400 placeholder:text-zinc-600"
                      : "text-zinc-500 placeholder:text-zinc-400"
                  }`}
                  placeholder="Enter your details below to receive the resource."
                />
              </div>
            ) : (
              <div>
                <h3 className={`text-base font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                  {formTitle || "Get instant access to the templates"}
                </h3>
                {formSubtitle && (
                  <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    {formSubtitle}
                  </p>
                )}
              </div>
            )}

            {isEditor ? (
              /* Editor Form Preview */
              <div className="space-y-3.5">
                <div>
                  <label
                    className={`mb-1 block text-xs font-semibold ${
                      isDark ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    readOnly
                    className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none shadow-2xs cursor-not-allowed ${
                      isDark
                        ? "border-zinc-700/80 bg-[#111114] text-white placeholder:text-zinc-500"
                        : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`mb-1 block text-xs font-semibold ${
                      isDark ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    readOnly
                    className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none shadow-2xs cursor-not-allowed ${
                      isDark
                        ? "border-zinc-700/80 bg-[#111114] text-white placeholder:text-zinc-500"
                        : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                </div>

                {customFormFields.map((field: any) => (
                  <div key={field.id}>
                    <label
                      className={`mb-1 block text-xs font-semibold ${
                        isDark ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      {field.label || "Custom Field"}{field.required ? " *" : ""}
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter ${field.label || "value"}`}
                      readOnly
                      className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none shadow-2xs cursor-not-allowed ${
                        isDark
                          ? "border-zinc-700/80 bg-[#111114] text-white placeholder:text-zinc-500"
                          : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                  </div>
                ))}

                {/* Editable Button */}
                <div className="pt-1">
                  <div className="relative group">
                    <input
                      type="text"
                      value={formButtonText || ""}
                      onChange={(e) => setFormButtonText?.(e.target.value)}
                      onFocus={(e) => {
                        if (e.target.value === "Access the templates" || e.target.value === "Send it to me") {
                          setFormButtonText?.("");
                        } else {
                          e.target.select();
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          setFormButtonText?.("Access the templates");
                        }
                      }}
                      placeholder="Access the templates"
                      className="h-12 w-full text-center rounded-xl px-4 text-xs sm:text-sm font-black text-white cursor-text outline-none border-2 border-transparent hover:border-white/40 focus:border-white transition-all shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                        boxShadow: `0 8px 24px -4px ${brandColor}66`,
                      }}
                    />
                  </div>
                </div>

                <p
                  className={`text-center text-[11px] leading-5 flex items-center justify-center gap-1.5 ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Zero spam. You’ll receive the PDF immediately and high-value insights.</span>
                </p>
              </div>
            ) : (
              /* Public Form Submission */
              <form onSubmit={onSubmitPublicForm} className="space-y-3.5">
                <div>
                  <label
                    className={`mb-1 block text-xs font-semibold ${
                      isDark ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={publicFormValues.name || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                    className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none shadow-2xs transition-all ${
                      isDark
                        ? "border-zinc-700/80 bg-[#111114] text-white placeholder:text-zinc-500 focus:border-sky-500"
                        : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-sky-600"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`mb-1 block text-xs font-semibold ${
                      isDark ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={publicFormValues.email || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                    className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none shadow-2xs transition-all ${
                      isDark
                        ? "border-zinc-700/80 bg-[#111114] text-white placeholder:text-zinc-500 focus:border-sky-500"
                        : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-sky-600"
                    }`}
                  />
                </div>

                {customFormFields.map((field: any) => (
                  <div key={field.id}>
                    <label
                      className={`mb-1 block text-xs font-semibold ${
                        isDark ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <input
                      type="text"
                      required={field.required}
                      placeholder={`Enter ${field.label}`}
                      value={publicFormValues[field.id] || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                      className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none shadow-2xs transition-all ${
                        isDark
                          ? "border-zinc-700/80 bg-[#111114] text-white placeholder:text-zinc-500 focus:border-sky-500"
                          : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-sky-600"
                      }`}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full flex items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-black text-white cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                    boxShadow: `0 8px 24px -4px ${brandColor}66`,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{formButtonText || "Access the templates"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p
                  className={`text-center text-[11px] leading-5 flex items-center justify-center gap-1.5 ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Zero spam. You’ll receive the PDF immediately and high-value insights.</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </article>

      {/* 5. TRUST & SOCIAL PROOF FOOTER */}
      <footer className="mt-8 text-center space-y-4">
        <div
          className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-wider ${
            isDark ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Delivery</span>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified Content</span>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>Updated {currentYear}</span>
          </span>
        </div>

        <p
          className={`text-[11px] uppercase tracking-wider ${
            isDark ? "text-zinc-500" : "text-zinc-400"
          }`}
        >
          © {currentYear} {businessName} · All rights reserved
        </p>
      </footer>
    </div>
  );
}

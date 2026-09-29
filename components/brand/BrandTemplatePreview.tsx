"use client";

import React, { memo } from "react";
import { Check } from "lucide-react";
import type { MagnetPage } from "@/lib/data";
import { hexWithAlpha } from "./brand-utils";

interface BrandTemplatePreviewProps {
  templateId: string;
  latestPage?: MagnetPage;
  themeMode: "light" | "dark";
  brandColor: string;
  highlightIntensity: number;
  logo: string | null;
  businessName: string;
}

const BrandTemplatePreview = memo(function BrandTemplatePreview({
  templateId,
  latestPage,
  themeMode,
  brandColor,
  highlightIntensity,
  logo,
  businessName,
}: BrandTemplatePreviewProps) {
  const intensityRatio = highlightIntensity / 100;

  return (
    <>
      {/* TEMPLATE 1: Modern Split Layout */}
      {templateId === "template1" && (
        <div className={`w-full py-1 ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-7 flex flex-col justify-between h-full py-1">
              <h3 className="text-xl md:text-3xl font-extrabold leading-tight tracking-tight">
                {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
              </h3>

              {latestPage?.subheadline ? (
                <p className={`text-sm font-semibold leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                  {latestPage.subheadline}
                </p>
              ) : (
                <p className={`text-sm font-semibold leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                  Stop staring at a blank page. Start creating content that actually connects.
                </p>
              )}

              {latestPage?.pitch ? (
                <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  {latestPage.pitch}
                </p>
              ) : (
                <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  You know what works on LinkedIn. You&apos;ve seen the posts that blow up.
                  <span className="block mt-2.5">
                    That&apos;s where these templates come in. Real structures pulled from posts that actually performed.
                  </span>
                </p>
              )}

              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9B9085]">
                  {latestPage?.bulletsTitle || "This playbook breaks down:"}
                </p>
                <ul className="space-y-3">
                  {(latestPage?.bullets && latestPage.bullets.length > 0
                    ? latestPage.bullets
                    : [
                        "101 fill-in-the-blank templates for every content scenario",
                        "Proven structures for storytelling, advice, and transformation posts",
                        "Ready-to-use formats that let you focus on your message",
                      ]
                  ).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 transition-all duration-300"
                        style={{
                          backgroundColor: brandColor,
                          opacity: 0.5 + intensityRatio * 0.5,
                          boxShadow:
                            highlightIntensity > 30
                              ? `0 0 ${Math.round(14 * intensityRatio)}px ${hexWithAlpha(brandColor, intensityRatio * 0.8)}`
                              : "none",
                        }}
                      >
                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                      </span>
                      <span className={themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:col-span-5 space-y-3">
              {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                <div className="rounded-xl border aspect-[16/11] w-full overflow-hidden shadow-xs border-zinc-200 dark:border-zinc-800">
                  <img src={latestPage.imageUrl} alt="Lead magnet media" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="rounded-xl border aspect-[16/11] w-full flex items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: hexWithAlpha(brandColor, 0.15 + intensityRatio * 0.5),
                    backgroundColor: hexWithAlpha(brandColor, 0.05 + intensityRatio * 0.25),
                  }}
                />
              )}

              <div
                className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 backdrop-blur-sm aspect-auto min-h-fit flex flex-col justify-center ${
                  themeMode === "dark" ? "text-white" : "text-zinc-900"
                }`}
                style={{
                  borderColor: hexWithAlpha(brandColor, 0.15 + intensityRatio * 0.55),
                  boxShadow:
                    highlightIntensity > 20
                      ? `0 8px 24px -4px ${hexWithAlpha(brandColor, intensityRatio * 0.35)}`
                      : "0 2px 8px rgba(0,0,0,0.05)",
                  background:
                    themeMode === "light"
                      ? `linear-gradient(135deg, ${hexWithAlpha(brandColor, 0.05 + intensityRatio * 0.25)} 0%, rgba(255, 255, 255, 0.95) 60%)`
                      : `linear-gradient(135deg, ${hexWithAlpha(brandColor, 0.08 + intensityRatio * 0.3)} 0%, rgba(22, 22, 25, 0.95) 60%)`,
                }}
              >
                <p className="text-base sm:text-lg font-semibold text-center">{latestPage?.formTitle || "Download for free now"}</p>
                <p className={`text-[11px] text-center mt-1 leading-normal ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  {latestPage?.formSubtitle || "By opting in you consent to receive this resource by email."}
                </p>

                <div className="mt-4 space-y-2.5">
                  <input
                    type="text"
                    placeholder={latestPage?.namePlaceholder || "Name"}
                    className={`w-full rounded-md border p-2.5 text-xs focus:outline-none transition pointer-events-none select-none ${
                      themeMode === "dark"
                        ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                        : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                    }`}
                    readOnly
                  />
                  <input
                    type="email"
                    placeholder={latestPage?.emailPlaceholder || "Email"}
                    className={`w-full rounded-md border p-2.5 text-xs focus:outline-none transition pointer-events-none select-none ${
                      themeMode === "dark"
                        ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                        : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                    }`}
                    readOnly
                  />

                  <button
                    className="w-full rounded-md py-2.5 text-xs font-bold text-white transition duration-200 shadow-md"
                    style={{ backgroundColor: brandColor }}
                  >
                    {latestPage?.formButtonText || latestPage?.cta || "Send it to me"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 2: Lead Capture Split Panel Layout */}
      {templateId === "template2" && (
        <div className="w-full py-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left Panel: Cover Image + Gradient Scrim + Bullets */}
            <div className="md:col-span-7 relative flex flex-col justify-end p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[340px] bg-zinc-900 text-white shadow-xl border border-black/10 dark:border-white/10">
              {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" && (
                <img
                  src={latestPage.imageUrl}
                  alt={latestPage?.name || "Lead capture image"}
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-[#0a0c16]/60 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
                  {latestPage?.headline || latestPage?.name || "Build forms that convert"}
                </h3>
                <p className="text-xs md:text-sm font-semibold text-white/90">
                  {latestPage?.subheadline || "The friendly form builder for growing teams"}
                </p>
                {latestPage?.pitch && (
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {latestPage.pitch}
                  </p>
                )}

                {latestPage?.bullets && latestPage.bullets.length > 0 && (
                  <ul className="space-y-2 pt-2 border-t border-white/10">
                    {latestPage.bullets.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-white/90">
                        <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={brandColor || "#a5b4fc"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right Panel: Form */}
            <div className={`md:col-span-5 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl flex flex-col justify-center border shadow-xl ${themeMode === "dark" ? "border-zinc-800 bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
              <div className="space-y-3">
                <p className="w-full text-center text-lg font-bold">
                  {latestPage?.formTitle || latestPage?.cta || "Send it to me"}
                </p>
                <p className="w-full text-center text-xs text-zinc-400">
                  {latestPage?.formSubtitle || "By opting in you consent to receive this resource by email."}
                </p>

                <div className="pt-2">
                  <div className={latestPage?.customFormFields && latestPage.customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                    <input
                      type="text"
                      placeholder={latestPage?.namePlaceholder || "Name *"}
                      readOnly
                      className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                    />
                    <input
                      type="email"
                      placeholder={latestPage?.emailPlaceholder || "Email *"}
                      readOnly
                      className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                    />

                    {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                      latestPage.customFormFields.map((field) => (
                        <input
                          key={field.id}
                          type="text"
                          placeholder={`${field.label}${field.required ? " *" : ""}`}
                          readOnly
                          className={`w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs ${field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}`}
                        />
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-xl py-3 px-4 text-xs font-bold text-white shadow-md transition duration-200 hover:opacity-95 mt-3"
                    style={{ backgroundColor: brandColor }}
                  >
                    {latestPage?.formButtonText || latestPage?.cta || "Send it to me"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 3: Aurora Reveal */}
      {templateId === "template3" && (
        <div className="w-full py-1">
          <div className="grid grid-cols-12 gap-5 items-stretch">
            {/* LEFT: Aurora Image Tile */}
            <div className="col-span-12 md:col-span-5 relative flex flex-col items-center justify-center min-h-[360px] md:min-h-full">
              {/* Brand Logo & Brand Name Centered above picture, aligned with right-side top text */}
              {(logo || businessName) && (
                <div className="md:absolute md:top-0 md:left-0 md:right-0 flex items-center justify-center gap-2.5 mb-3 md:mb-0">
                  <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-transparent overflow-hidden ${logo ? "border-none" : "border border-dashed border-[#a1a1aa]/45"}`}>
                    {logo ? (
                      <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-sm border border-dashed border-[#a1a1aa]" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-black tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-black"}`}>
                    {businessName || "BDA"}
                  </span>
                </div>
              )}

              <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-xl aspect-[4/3] sm:aspect-[4/5] max-h-[260px] sm:max-h-[340px] w-full border border-black/5 dark:border-white/5">
                {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                  <img
                    src={latestPage.imageUrl}
                    alt={latestPage?.name || "Cover"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#121215]">
                    <div className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/80 text-white">
                      <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" strokeWidth="2" />
                      </svg>
                      <span className="text-xs font-bold text-white">Add a cover image</span>
                    </div>
                  </div>
                )}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: themeMode === "dark" ? "linear-gradient(to right, transparent 55%, #0c0c12 100%)" : "linear-gradient(to right, transparent 55%, #f7f8fc 100%)" }}
                />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
              </div>
            </div>

            {/* RIGHT: Editorial Form Panel */}
            <div className="col-span-12 md:col-span-7 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                  {latestPage?.bulletsTitle || "Free Resource · Instant Access"}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className={`text-xl md:text-2xl font-black leading-tight tracking-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                  {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates"}
                </h3>
                <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  {latestPage?.subheadline || "Stop staring at a blank page. Start creating content that actually connects."}
                </p>
              </div>

              {latestPage?.bullets && latestPage.bullets.length > 0 && (
                <div className="space-y-1.5">
                  {latestPage.bullets.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
                        style={{ background: hexWithAlpha(brandColor, 0.13), border: `1px solid ${hexWithAlpha(brandColor, 0.27)}` }}
                      >
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                          <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`text-[11px] font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Card (Exact match with MagnetSignupForm) */}
              <div
                className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all duration-300 backdrop-blur-md relative overflow-hidden shadow-2xl ${
                  themeMode === "dark" ? "text-white" : "text-zinc-900"
                }`}
                style={{
                  borderColor: hexWithAlpha(brandColor, 0.25),
                  boxShadow: `0 10px 30px -4px ${hexWithAlpha(brandColor, 0.2)}`,
                  background:
                    themeMode === "light"
                      ? `linear-gradient(135deg, ${hexWithAlpha(brandColor, 0.08)} 0%, rgba(255, 255, 255, 0.95) 60%)`
                      : `linear-gradient(135deg, ${hexWithAlpha(brandColor, 0.12)} 0%, rgba(22, 22, 25, 0.95) 60%)`
                }}
              >
                <div className="space-y-1 text-center mb-3">
                  <p className="text-lg sm:text-xl font-black tracking-tight">{latestPage?.formTitle || "Get instant access"}</p>
                  <p className={`text-xs leading-normal ${themeMode === "dark" ? "text-zinc-400" : "text-[#9B9085]"}`}>
                    {latestPage?.formSubtitle || "By opting in you consent to receive this resource by email."}
                  </p>
                </div>

                <div className={latestPage?.customFormFields && latestPage.customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                  <input
                    type="text"
                    placeholder={latestPage?.namePlaceholder || "Name"}
                    readOnly
                    className="min-h-11 h-11 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />
                  <input
                    type="email"
                    placeholder={latestPage?.emailPlaceholder || "Email"}
                    readOnly
                    className="min-h-11 h-11 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />

                  {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                    latestPage.customFormFields.map((field) => (
                      <div key={field.id} className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}>
                        <input
                          type="text"
                          placeholder={`${field.label}${field.required ? " *" : ""}`}
                          readOnly
                          className="min-h-11 h-11 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#0E0E10] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                        />
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  className="w-full rounded-xl py-3 px-4 text-xs font-bold text-white shadow-md transition duration-200 hover:opacity-95 mt-3"
                  style={{ backgroundColor: brandColor }}
                >
                  {latestPage?.formButtonText || latestPage?.cta || "Get instant access"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 4: Neon Orbit */}
      {templateId === "template4" && (
        <div className="w-full py-1">
          <div className="grid grid-cols-12 gap-5 items-center md:items-stretch">
            {/* LEFT: Copy Panel */}
            <div className="col-span-12 md:col-span-6 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}` }}
                />
                <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                  {latestPage?.bulletsTitle || "Free Resource · Limited Time"}
                </span>
              </div>

              <h3 className={`text-xl md:text-2xl font-black leading-tight tracking-tight ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates"}
              </h3>

              <p className={`text-[11px] leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                {latestPage?.subheadline || "Field-tested frameworks. Proven content structures. Built for creators who move fast."}
              </p>

              {latestPage?.pitch && (
                <p className={`text-[11px] leading-relaxed ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  {latestPage.pitch}
                </p>
              )}

              {latestPage?.bullets && latestPage.bullets.length > 0 && (
                <div className="space-y-2">
                  {latestPage.bullets.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md"
                        style={{
                          background: hexWithAlpha(brandColor, 0.09),
                          border: `1px solid ${hexWithAlpha(brandColor, 0.27)}`,
                          boxShadow: highlightIntensity > 40 ? `0 0 8px ${hexWithAlpha(brandColor, 0.27)}` : "none",
                        }}
                      >
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                          <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`text-[11px] font-medium ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300 backdrop-blur-md shadow-xl ${
                  themeMode === "dark" ? "bg-[#14141A]/90 text-white" : "bg-white/90 text-zinc-900"
                }`}
                style={{
                  borderColor: `${brandColor}33`,
                  boxShadow: `0 10px 30px -4px ${brandColor}25`,
                }}
              >
                <div className="space-y-1 text-center mb-3">
                  <p className={`w-full text-center text-sm sm:text-base font-black ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                    {latestPage?.formTitle || "Get instant access"}
                  </p>
                  <p className="text-[11px] text-[#9B9085] text-center leading-normal">
                    {latestPage?.formSubtitle || "By opting in you consent to receive this resource by email."}
                  </p>
                </div>

                <div className={latestPage?.customFormFields && latestPage.customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                  <input
                    type="text"
                    placeholder={latestPage?.namePlaceholder || "Name *"}
                    readOnly
                    className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />
                  <input
                    type="email"
                    placeholder={latestPage?.emailPlaceholder || "Email *"}
                    readOnly
                    className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />

                  {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                    latestPage.customFormFields.map((field) => (
                      <div key={field.id} className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}>
                        <input
                          type="text"
                          placeholder={`${field.label}${field.required ? " *" : ""}`}
                          readOnly
                          className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                        />
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  className="w-full rounded-xl py-3 text-xs font-black text-white tracking-wide transition-all duration-200 relative overflow-hidden mt-3"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor} 0%, ${hexWithAlpha(brandColor, 0.8)} 100%)`,
                    boxShadow: `0 6px 26px -4px ${hexWithAlpha(brandColor, 0.5 + intensityRatio * 0.45)}`,
                  }}
                >
                  <span className="relative z-10">{latestPage?.formButtonText || latestPage?.cta || "Get instant access"}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                </button>
              </div>
            </div>

            {/* RIGHT: Orbital image portal */}
            <div className="col-span-12 md:col-span-6 relative flex flex-col items-center justify-center py-4 min-h-[340px] md:min-h-full">
              {(logo || businessName) && (
                <div className="md:absolute md:top-0 md:left-0 md:right-0 flex items-center justify-center gap-2 mb-4 md:mb-0">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center bg-transparent overflow-hidden shadow-xs ${logo ? "border-none" : "border border-dashed border-[#a1a1aa]/50"}`}>
                    {logo ? (
                      <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-3 w-3 rounded-xs border border-dashed border-[#a1a1aa]" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-black tracking-wider uppercase ${themeMode === "dark" ? "text-white" : "text-zinc-900"}`}>
                    {businessName}
                  </span>
                </div>
              )}

              <div className="relative flex items-center justify-center w-full">
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: "360px",
                    height: "360px",
                    background: `radial-gradient(circle, ${hexWithAlpha(brandColor, 0.12 + intensityRatio * 0.2)} 0%, transparent 70%)`,
                    filter: "blur(28px)",
                  }}
                />
                <div className="absolute rounded-full border border-dashed pointer-events-none" style={{ width: "320px", height: "320px", borderColor: hexWithAlpha(brandColor, 0.15) }} />
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: "275px",
                    height: "275px",
                    border: `1px solid ${hexWithAlpha(brandColor, 0.18 + intensityRatio * 0.3)}`,
                    boxShadow: `0 0 20px ${hexWithAlpha(brandColor, 0.1 + intensityRatio * 0.2)}`,
                  }}
                />
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: "235px",
                    height: "235px",
                    border: `2px solid ${hexWithAlpha(brandColor, 0.35 + intensityRatio * 0.5)}`,
                    boxShadow: `0 0 32px ${hexWithAlpha(brandColor, 0.2 + intensityRatio * 0.35)}, inset 0 0 16px ${hexWithAlpha(brandColor, 0.08 + intensityRatio * 0.15)}`,
                  }}
                />

                <div
                  className="relative rounded-full overflow-hidden z-10"
                  style={{
                    width: "205px",
                    height: "205px",
                    border: `3px solid ${hexWithAlpha(brandColor, 0.5 + intensityRatio * 0.5)}`,
                    boxShadow: `0 0 40px -8px ${hexWithAlpha(brandColor, 0.45 + intensityRatio * 0.55)}`,
                  }}
                >
                  {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                    <img src={latestPage.imageUrl} alt={latestPage?.name || "Cover"} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-2"
                      style={{ background: `linear-gradient(145deg, ${hexWithAlpha(brandColor, 0.5 + intensityRatio * 0.4)} 0%, #0a0018 100%)` }}
                    >
                      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 7px)" }} />
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="opacity-60 relative z-10">
                        <rect x="2" y="2" width="26" height="26" rx="5" stroke="white" strokeWidth="1.2" strokeDasharray="3 2" />
                        <path d="M2 21l7-6 5 4 4-3 10 8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="10" r="2.5" stroke="white" strokeWidth="1.2" />
                      </svg>
                      <span className="text-white text-[7px] font-bold uppercase tracking-[0.2em] opacity-50 relative z-10">Image</span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 100%)" }} />
                </div>

                <div
                  className="absolute z-20 h-3 w-3 rounded-full"
                  style={{
                    right: "calc(50% - 120px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: brandColor,
                    boxShadow: `0 0 10px ${brandColor}, 0 0 20px ${hexWithAlpha(brandColor, 0.4)}`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* BOTTOM TRUST STRIP */}
          <div className={`px-2 pb-2 pt-3 flex flex-wrap items-center justify-between gap-2 border-t mt-3 ${themeMode === "dark" ? "border-white/[0.05]" : "border-zinc-100"}`}>
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={logo} alt="Logo" className="h-5 w-5 rounded object-contain" />
              ) : (
                <div className="h-5 w-5 rounded flex items-center justify-center text-white text-[8px] font-black" style={{ backgroundColor: brandColor }}>
                  {(businessName || "B").charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`text-[10px] font-bold ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{businessName || "Brand"}</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {["10K+ Downloads", "Verified Free", "Instant Access"].map((tag, i) => (
                <span key={i} className={`flex items-center gap-1 text-[9px] font-semibold ${themeMode === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: brandColor }} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 5: Editorial Resource Showcase & Framework Edition */}
      {templateId === "template5" && (
        <div className="w-full flex-1 flex flex-col justify-center py-2 max-w-xl mx-auto px-1 sm:px-2">
          <article
            className="relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl"
            style={{
              backgroundColor: themeMode === "dark" ? "#0f0f12" : "#ffffff",
              borderColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            }}
          >
            {/* Subtle Brand Accent Stripe on right edge */}
            <div
              aria-hidden="true"
              className="absolute right-0 top-6 h-14 w-1.5 rounded-l-full pointer-events-none"
              style={{ backgroundColor: brandColor }}
            />

            {/* Top Ambient Glow */}
            <div
              aria-hidden="true"
              className="absolute -top-16 -left-16 w-44 h-44 rounded-full blur-2xl pointer-events-none opacity-20"
              style={{ backgroundColor: brandColor }}
            />

            {/* 1. HEADER SECTION */}
            <header className={`p-5 relative z-10 border-b ${themeMode === "dark" ? "border-zinc-800/80" : "border-zinc-100"}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt={businessName}
                      className={`w-8 h-8 rounded-full border object-cover shrink-0 ${
                        themeMode === "dark" ? "border-zinc-700" : "border-zinc-200"
                      }`}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      {(businessName || "B").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: brandColor }}>
                      Published by
                    </p>
                    <p className={`truncate text-xs font-semibold ${themeMode === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
                      {businessName || "Brand"}
                    </p>
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${brandColor}14`,
                    color: brandColor,
                    border: `1px solid ${brandColor}30`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                  <span>Proven Frameworks</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight leading-tight ${themeMode === "dark" ? "text-zinc-50" : "text-zinc-950"}`}>
                  {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates That Get Results"}
                </h3>
                <p className={`text-xs leading-relaxed line-clamp-2 ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                  {latestPage?.subheadline || "Stop staring at a blank page. Use field-tested structures pulled from posts that generated millions of impressions."}
                </p>
              </div>
            </header>

            {/* 2. RESOURCE PREVIEW SECTION */}
            <section className={`relative p-5 border-b ${themeMode === "dark" ? "bg-[#141418]/60 border-zinc-800/80" : "bg-zinc-50/70 border-zinc-100"}`}>
              <div className={`relative rounded-xl overflow-hidden border shadow-xs aspect-[16/10] w-full ${themeMode === "dark" ? "border-zinc-800 bg-zinc-950" : "border-zinc-200/90 bg-zinc-950"}`}>
                {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                  <img
                    src={latestPage.imageUrl}
                    alt={latestPage?.name || "Resource"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#0b0c10] text-zinc-300">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${brandColor}22` }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                        <path d="M6 6h10"/>
                        <path d="M6 10h10"/>
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-white">Editorial Showcase Graphic</span>
                  </div>
                )}
              </div>

              {/* Floating Pill */}
              <div className="flex justify-center -mt-2.5 relative z-10">
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider shadow-sm border backdrop-blur-md"
                  style={{
                    backgroundColor: themeMode === "dark" ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)",
                    color: themeMode === "dark" ? "#ffffff" : "#09090b",
                    borderColor: themeMode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                  <span>Previewing: Strategy &amp; Templates</span>
                </div>
              </div>
            </section>

            {/* 3. CONTENT & FORM SECTION */}
            <div className="p-5 space-y-4">
              {latestPage?.pitch && (
                <p className={`text-xs leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                  {latestPage.pitch}
                </p>
              )}

              {/* Bullets */}
              <div className="space-y-2">
                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  {latestPage?.bulletsTitle || "Inside the guide"}
                </h4>
                {latestPage?.bullets && latestPage.bullets.length > 0 && (
                  <div className="space-y-1.5">
                    {latestPage.bullets.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className="grid size-3.5 shrink-0 place-items-center rounded-full"
                          style={{ backgroundColor: `${brandColor}18` }}
                        >
                          <span className="size-1 rounded-full" style={{ backgroundColor: brandColor }} />
                        </span>
                        <span className={`text-xs ${themeMode === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inset Form Card */}
              <div
                className="rounded-xl border p-4 space-y-2.5"
                style={{
                  backgroundColor: themeMode === "dark" ? "rgba(20,20,24,0.85)" : "rgba(248,249,251,0.95)",
                  borderColor: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                }}
              >
                <p className={`text-xs font-bold ${themeMode === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
                  {latestPage?.formTitle || "Get instant access to the templates"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={latestPage?.namePlaceholder || "Full name"}
                    readOnly
                    className={`w-full h-9 rounded-lg border px-3 text-xs outline-none ${
                      themeMode === "dark"
                        ? "border-zinc-700 bg-[#111114] text-white placeholder:text-zinc-500"
                        : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                  <input
                    type="email"
                    placeholder={latestPage?.emailPlaceholder || "Email address"}
                    readOnly
                    className={`w-full h-9 rounded-lg border px-3 text-xs outline-none ${
                      themeMode === "dark"
                        ? "border-zinc-700 bg-[#111114] text-white placeholder:text-zinc-500"
                        : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                </div>

                <button
                  type="button"
                  className="w-full rounded-lg py-2.5 text-xs font-bold text-white cursor-pointer transition shadow-xs"
                  style={{
                    background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
                    boxShadow: `0 4px 14px -3px ${brandColor}66`,
                  }}
                >
                  {latestPage?.formButtonText || latestPage?.cta || "Access the templates"}
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* TEMPLATE 6: Spotlight Hero */}
      {(templateId === "template6" || templateId === "template7") && (
        <div className="w-full py-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* LEFT: Full-bleed image panel */}
            <div className="col-span-12 md:col-span-6 relative overflow-hidden rounded-3xl shadow-2xl aspect-[4/3] max-h-[340px] min-h-[260px]">
              {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                <img
                  src={latestPage.imageUrl}
                  alt={latestPage?.name || "Cover"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(155deg, ${hexWithAlpha(brandColor, 0.6 + intensityRatio * 0.35)} 0%, #060610 55%, #12001a 100%)`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    {[160, 110, 66, 32].map((size, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full border border-white"
                        style={{ width: size, height: size, opacity: 1 - i * 0.2 }}
                      />
                    ))}
                  </div>
                  <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 8px)" }}
                  />
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />
              <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-[1.0] tracking-tight drop-shadow-2xl">
                    {latestPage?.headline || latestPage?.name || "101 Winning Viral Templates"}
                  </h3>
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium drop-shadow-sm">
                    {latestPage?.subheadline || "Content that connects, converts, and compounds."}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Form and details */}
            <div className="col-span-12 md:col-span-6 flex flex-col justify-center space-y-3">
              {/* Eyebrow & Bullets */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: brandColor }}>
                  {latestPage?.bulletsTitle || "Exclusive · Free Access"}
                </p>

                {latestPage?.bullets && latestPage.bullets.length > 0 && (
                  <div className="space-y-1.5">
                    {latestPage.bullets.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div
                          className="flex h-3.5 w-3.5 shrink-0 mt-0.5 items-center justify-center rounded-full"
                          style={{ backgroundColor: hexWithAlpha(brandColor, 0.13), border: `1px solid ${hexWithAlpha(brandColor, 0.33)}` }}
                        >
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                            <path d="M1 3l1.5 1.5L5 1.5" stroke={brandColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className={`text-[10px] leading-relaxed ${themeMode === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enclosed Opt-in Form Card */}
              <div
                className={`rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300 backdrop-blur-sm shadow-xl ${
                  themeMode === "dark" ? "text-white" : "text-zinc-900"
                }`}
                style={{
                  borderColor: hexWithAlpha(brandColor, 0.15 + (intensityRatio) * 0.55),
                  boxShadow: intensityRatio > 0.2 ? `0 10px 30px -4px ${hexWithAlpha(brandColor, 0.35 * intensityRatio)}` : "0 2px 8px rgba(0,0,0,0.05)",
                  background: themeMode === "light"
                    ? `linear-gradient(135deg, ${hexWithAlpha(brandColor, 0.05 + intensityRatio * 0.25)} 0%, rgba(255, 255, 255, 0.95) 60%)`
                    : `linear-gradient(135deg, ${hexWithAlpha(brandColor, 0.08 + intensityRatio * 0.3)} 0%, rgba(22, 22, 25, 0.95) 60%)`
                }}
              >
                <p className="text-base sm:text-lg font-black text-center tracking-tight">
                  {latestPage?.formTitle || "Get instant access"}
                </p>
                <p className="text-[10px] sm:text-xs text-[#9B9085] text-center mt-1 leading-normal">
                  {latestPage?.formSubtitle || "By opting in you consent to receive this resource by email."}
                </p>

                <div className="mt-3 flex flex-col gap-2.5">
                  <div className={latestPage?.customFormFields && latestPage.customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}>
                    <input
                      type="text"
                      placeholder="Name"
                      readOnly
                      className={`min-h-9 h-9 w-full rounded-xl border px-3 py-2 text-xs outline-none transition shadow-xs pointer-events-none ${
                        themeMode === "dark" ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      readOnly
                      className={`min-h-9 h-9 w-full rounded-xl border px-3 py-2 text-xs outline-none transition shadow-xs pointer-events-none ${
                        themeMode === "dark" ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                    {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                      latestPage.customFormFields.map((field: any) => (
                        <div
                          key={field.id}
                          className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}
                        >
                          <input
                            type="text"
                            placeholder={`${field.label || field.placeholder || "Field"}${field.required ? " *" : ""}`}
                            readOnly
                            className={`min-h-9 h-9 w-full rounded-xl border px-3 py-2 text-xs outline-none transition shadow-xs pointer-events-none ${
                              themeMode === "dark" ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                            }`}
                          />
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="w-full min-h-9 h-9 inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-black text-white shadow-md cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    {latestPage?.formButtonText || latestPage?.cta || "Get instant access"}
                  </button>
                </div>
              </div>

              {/* Deliverable Badge */}
              {latestPage?.deliverable && (
                <p className={`flex items-center justify-center gap-1.5 text-[10px] font-medium ${themeMode === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                  <span>🎁</span>
                  <span>{latestPage.deliverable}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default BrandTemplatePreview;

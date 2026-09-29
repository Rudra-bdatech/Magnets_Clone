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

      {/* TEMPLATE 2: Signal / Noise Editorial Edition */}
      {templateId === "template2" && (
        <div
          className={`w-full max-w-5xl mx-auto my-1 rounded-2xl overflow-hidden border shadow-xl transition-colors duration-200 font-sans ${
            themeMode === "dark"
              ? "bg-[#141416] text-[#eae8e3] border-zinc-800"
              : "bg-[#f3f0e8] text-[#151515] border-[#151515]/30"
          }`}
        >
          {/* 1. EDITORIAL MASTHEAD */}
          {(() => {
            const defaultLeft1 = "VOL. 08 · FIELD NOTES";
            const defaultLeft2 = "ISSUE NO. 42";
            const curLeft = latestPage?.mastheadLeft ?? "";
            const isLeftHidden = curLeft === "__hidden__";
            const leftParts = curLeft.includes(":::") ? curLeft.split(":::") : [curLeft, ""];
            const leftLine1 = leftParts[0] || defaultLeft1;
            const leftLine2 = leftParts[1] || defaultLeft2;

            const defaultRight1 = "INDEPENDENT IDEAS";
            const defaultRight2 = "AUTUMN · 2026";
            const curRight = latestPage?.mastheadRight ?? "";
            const isRightHidden = curRight === "__hidden__";
            const rightParts = curRight.includes(":::") ? curRight.split(":::") : [curRight, ""];
            const rightLine1 = rightParts[0] || defaultRight1;
            const rightLine2 = rightParts[1] || defaultRight2;

            return (
              <header
                className={`px-4 sm:px-6 py-3.5 border-b grid grid-cols-1 md:grid-cols-3 items-end gap-3 ${
                  themeMode === "dark" ? "border-white/15" : "border-[#151515]"
                }`}
              >
                <div className="text-left font-sans text-[10px] font-bold uppercase tracking-[0.18em] opacity-90 min-h-[28px] flex items-end">
                  {!isLeftHidden ? (
                    <div>
                      <div>{leftLine1}</div>
                      <div className="mt-0.5">{leftLine2}</div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Center: Brand Logo + Brand Title */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-center">
                  {logo && (
                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg overflow-hidden shadow-xs border border-[#151515]/20 dark:border-white/20 shrink-0 bg-transparent">
                      <img src={logo} alt={businessName} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <h4 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight uppercase font-sans leading-none">
                    {businessName || "EDITORIAL BOARD"}
                  </h4>
                </div>

                <div className="text-left md:text-right font-sans text-[10px] font-bold uppercase tracking-[0.18em] opacity-90 min-h-[28px] flex items-end justify-start md:justify-end">
                  {!isRightHidden ? (
                    <div>
                      <div>{rightLine1}</div>
                      <div className="mt-0.5 font-normal text-[#5a574f] dark:text-zinc-400">
                        {rightLine2}
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              </header>
            );
          })()}

          {/* 2. TICKER BAR */}
          <div
            className={`flex items-center overflow-hidden h-7 text-[10px] font-sans font-bold uppercase tracking-[0.12em] select-none ${
              themeMode === "dark" ? "bg-black text-[#eae8e3]" : "bg-[#151515] text-[#f3f0e8]"
            }`}
          >
            <div
              className="flex items-center px-3 h-full shrink-0 font-black text-white bg-[#ef3d25] text-[9px]"
            >
              <span>NEW ISSUE</span>
            </div>
            <div className="overflow-hidden flex-1 relative flex items-center">
              <div className="text-[9px] font-semibold opacity-90 truncate px-3">
                ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE.
              </div>
            </div>
          </div>

          {/* 3. HERO */}
          <div
            className="relative min-h-[240px] sm:min-h-[280px] flex flex-col justify-between p-5 sm:p-6 border-b border-[#151515] dark:border-white/15 overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(12,12,12,0.92) 0%, rgba(12,12,12,0.6) 55%, rgba(12,12,12,0.15) 100%), url(${latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? latestPage.imageUrl : "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80"})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute top-2 right-4 pointer-events-none select-none">
              <span className="font-serif text-7xl font-bold leading-none block opacity-30 text-white" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.4)", color: "transparent" }}>
                42
              </span>
            </div>

            <div className="relative z-10">
              <span className="px-2.5 py-0.5 bg-[#ef3d25] text-white text-[9px] font-black uppercase tracking-wider font-sans inline-block">
                {latestPage?.accent || "THE ATTENTION ISSUE"}
              </span>
            </div>

            <div className="relative z-10 max-w-xl space-y-2 text-white mt-auto pt-4">
              <h3 className="text-xl sm:text-3xl font-serif text-white leading-tight drop-shadow-md tracking-tight">
                {latestPage?.headline || latestPage?.name || "101 ideas that refuse to vanish."}
              </h3>
              {latestPage?.subheadline && (
                <p className="text-xs sm:text-sm text-white/90 leading-snug font-sans drop-shadow line-clamp-2">
                  {latestPage.subheadline}
                </p>
              )}
              <div className="flex items-center gap-4 pt-2 text-[9px] font-sans font-bold uppercase tracking-wider text-white/80">
                <span>12 MIN READ</span>
                <span>BY {businessName || "MARA VALE"}</span>
                <span>VISUAL ESSAY</span>
              </div>
            </div>
          </div>

          {/* 4. 2-COLUMN LOWER SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            {/* Left 8 Cols */}
            <div className="md:col-span-8 p-5 sm:p-6 space-y-5">
              {(() => {
                const hasCustomBullets = Array.isArray(latestPage?.bullets);
                const displayBullets = hasCustomBullets
                  ? latestPage!.bullets!
                  : [
                      "The first seven seconds ::: Seven opening structures that create curiosity.",
                      "Build a visual memory ::: How contrast, rhythm, and restraint turn information into recognition.",
                      "Anatomy of the share ::: Twelve remarkable posts, dismantled to reveal ideas.",
                    ];

                if (displayBullets.length === 0) return null;

                return (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-[#151515]/20 dark:border-white/15 text-[10px] font-sans font-bold uppercase tracking-wider">
                      <span>{latestPage?.bulletsTitle || "INSIDE THIS ISSUE"}</span>
                      <span>CONTENTS 01—0{displayBullets.length}</span>
                    </div>

                    <div className="divide-y divide-[#151515]/15 dark:divide-white/10">
                      {displayBullets.slice(0, 3).map((item, i) => {
                        const parts = item.includes(":::") ? item.split(":::") : [item, ""];
                        return (
                          <div key={i} className="py-3 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="font-serif italic text-lg text-[#151515] dark:text-[#eae8e3]">
                                0{i + 1}
                              </span>
                              <div>
                                <div className="font-serif font-bold text-sm text-[#151515] dark:text-[#eae8e3]">
                                  {parts[0]}
                                </div>
                                {parts[1] && (
                                  <div className="text-[11px] font-sans opacity-75">
                                    {parts[1]}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-xs opacity-60">↗</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {/* Quote box */}
              {latestPage?.pitch !== "__hidden__" && latestPage?.pitch !== "__none__" && (
                <div className="border-t-2 border-[#2544d8] bg-[#e7e2d7] dark:bg-[#1e1e24] p-4 space-y-1.5">
                  {(() => {
                    const defaultQuotePlaceholder = "“Good work earns attention once. A distinct point of view earns it again.”";
                    const defaultAuthorPlaceholder = `— ${businessName || "EDITORIAL BOARD"}, EDITOR AT LARGE`;
                    const pitchParts = (latestPage?.pitch || "").includes(":::") ? (latestPage?.pitch || "").split(":::") : [latestPage?.pitch || "", ""];
                    const quoteText = pitchParts[0]?.trim() || "";
                    const quoteAuthor = pitchParts[1]?.trim() || "";
                    return (
                      <>
                        <p className="font-serif italic text-xs text-[#151515] dark:text-[#eae8e3]">
                          {quoteText || defaultQuotePlaceholder}
                        </p>
                        <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-[#151515]/80 dark:text-[#eae8e3]/80">
                          {quoteAuthor || defaultAuthorPlaceholder}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right 4 Cols */}
            <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-[#151515]/20 dark:border-white/15 p-5 space-y-4">
              <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#2544d8]">
                DIGITAL EDITION
              </div>
              <div>
                <p className="font-serif text-lg font-normal">
                  {latestPage?.formTitle || "Keep the issue."}
                </p>
                <p className="text-[11px] opacity-75 font-sans">
                  {latestPage?.formSubtitle || "Receive the complete 48-page digital edition."}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-wider">YOUR NAME</span>
                  <input
                    type="text"
                    placeholder="Jane Holloway"
                    readOnly
                    className="w-full border border-[#151515] dark:border-white/30 px-2.5 py-1.5 text-xs bg-[#ece7dc]/50 dark:bg-black/30 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold uppercase tracking-wider">EMAIL ADDRESS</span>
                  <input
                    type="email"
                    placeholder="jane@studio.com"
                    readOnly
                    className="w-full border border-[#151515] dark:border-white/30 px-2.5 py-1.5 text-xs bg-[#ece7dc]/50 dark:bg-black/30 outline-none"
                  />
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 px-3 text-xs font-sans font-bold uppercase tracking-wider text-white bg-[#2544d8] shadow-sm"
                  style={{ backgroundColor: brandColor || "#2544d8" }}
                >
                  {latestPage?.formButtonText || "SEND THE DIGITAL ISSUE →"}
                </button>
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

      {/* TEMPLATE 6: Monograph Editorial Publication */}
      {templateId === "template6" && (
        <div
          className={`w-full py-2 px-1 sm:px-2 transition-colors ${
            themeMode === "dark" ? "text-[#fcfaf8]" : "text-[#1c1917]"
          }`}
          style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif" }}
        >
          {/* Masthead Header */}
          <header
            className={`flex justify-between items-end pb-3 border-b transition-colors ${
              themeMode === "dark" ? "border-[#33302c]" : "border-[#d9d4cf]"
            }`}
          >
            <div>
              <div
                className="text-[8px] font-bold tracking-[0.16em] uppercase"
                style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
              >
                {(latestPage as any)?.mastheadLeft || "Intelligence report · Issue 08"}
              </div>
              <div
                className="font-instrument italic text-[22px] sm:text-[26px] leading-tight mt-0.5"
                style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
              >
                {(latestPage as any)?.mastheadRight || businessName || "The Executive Dispatch"}
              </div>
            </div>

            <div
              className="text-right text-[10px] hidden sm:block font-manrope shrink-0"
              style={{ color: themeMode === "dark" ? "#a89f97" : "#5c554f" }}
            >
              <b className={themeMode === "dark" ? "text-zinc-200" : "text-zinc-900"}>
                Published {new Date().getFullYear()}
              </b>
              <br />
              By {businessName || "Marcus Vane"}
            </div>
          </header>

          {/* Main Grid */}
          <main className="grid grid-cols-1 md:grid-cols-[1.3fr_0.9fr] gap-6 pt-5 items-start">
            {/* Left Column */}
            <section className="space-y-4 min-w-0">
              {/* Visual Cover */}
              <div
                className={`relative w-full aspect-[3/2] rounded-xs overflow-hidden border transition-all ${
                  themeMode === "dark" ? "border-[#33302c] bg-[#1a1918]" : "border-[#ded9d4] bg-[#f5efe9]"
                }`}
              >
                {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                  <img
                    src={latestPage.imageUrl}
                    alt={latestPage?.name || "Cover"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full relative flex items-center justify-center overflow-hidden"
                    style={{
                      background:
                        themeMode === "dark"
                          ? "linear-gradient(135deg, #24201d 0%, #161514 100%)"
                          : "linear-gradient(135deg, #f0e8e0 0%, #ded2c6 100%)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full border flex items-center justify-center font-instrument italic text-base shadow-sm"
                      style={{
                        borderColor: brandColor,
                        color: brandColor,
                        backgroundColor: themeMode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {(businessName || "M").charAt(0)}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Tag */}
              <div>
                <span
                  className="inline-block px-2 py-0.5 text-[8px] font-bold tracking-[0.12em] uppercase rounded-xs"
                  style={{
                    backgroundColor: themeMode === "dark" ? "rgba(194, 65, 12, 0.2)" : "#f5e5dc",
                    color: themeMode === "dark" ? "#fb923c" : "#b53b12",
                  }}
                >
                  {latestPage?.bulletsTitle || "Strategic framework"}
                </span>
              </div>

              {/* Title */}
              <h3
                className="font-instrument font-medium text-[24px] sm:text-[30px] leading-[0.96] tracking-tight m-0"
                style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
              >
                {latestPage?.headline || latestPage?.name || "The Architecture of High-Output Engineering"}
              </h3>

              {/* Subheadline */}
              <p
                className="text-[11px] leading-relaxed m-0"
                style={{ color: themeMode === "dark" ? "#c4bcb3" : "#5c554f" }}
              >
                {latestPage?.subheadline ||
                  "A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."}
              </p>

              {/* Chapters */}
              {((latestPage?.bullets && latestPage.bullets.length > 0 && latestPage.bullets.some((b: string) => b && b.trim().length > 0)) || (!latestPage && true)) && (
                <div
                  className={`pt-4 border-t transition-colors ${
                    themeMode === "dark" ? "border-[#33302c]" : "border-[#ded9d4]"
                  }`}
                >
                  <div
                    className="text-[8px] font-bold tracking-[0.16em] uppercase mb-2"
                    style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                  >
                    Inside this guide
                  </div>

                  <div className="divide-y divide-[#ded9d4] dark:divide-[#33302c]">
                    {(latestPage?.bullets && latestPage.bullets.length > 0
                      ? latestPage.bullets.filter((b: string) => b && b.trim().length > 0).slice(0, 3)
                      : [
                          "The Signal-to-Noise Protocol — Audit attention and eliminate low-leverage activities through the Four Filters.",
                          "Recursive Hiring Loops — Build a talent engine that identifies multipliers before they reach the market.",
                          "Velocity Without Chaos — Replace recurring meetings with lightweight synchronization rituals.",
                        ]
                    ).map((item, idx) => {
                    const numStr = (idx + 1).toString().padStart(2, "0") + " /";
                    let title = item;
                    let desc = "";
                    if (item.includes(" — ")) {
                      const parts = item.split(" — ");
                      title = parts[0];
                      desc = parts.slice(1).join(" — ");
                    } else if (item.includes(" - ")) {
                      const parts = item.split(" - ");
                      title = parts[0];
                      desc = parts.slice(1).join(" - ");
                    }

                    return (
                      <div key={idx} className="grid grid-cols-[30px_1fr] py-2 items-start gap-1.5">
                        <span
                          className="font-instrument italic text-[14px]"
                          style={{ color: brandColor || "#c2410c" }}
                        >
                          {numStr}
                        </span>
                        <div>
                          <h4
                            className="text-[11px] font-bold leading-tight m-0"
                            style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
                          >
                            {title}
                          </h4>
                          {desc && (
                            <p
                              className="text-[9px] leading-tight mt-0.5 m-0"
                              style={{ color: themeMode === "dark" ? "#a89f97" : "#756d66" }}
                            >
                              {desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {latestPage?.pitch && latestPage.pitch !== "__HIDDEN__" && latestPage.pitch.trim().length > 0 && (
                <div
                  className="p-3 sm:p-4 rounded-xs mt-3 transition-colors"
                  style={{
                    backgroundColor: themeMode === "dark" ? "#0d0c0b" : "#1c1917",
                    color: "#fcfaf8",
                    border: themeMode === "dark" ? "1px solid #292524" : "none",
                  }}
                >
                  <div className="font-instrument italic text-[13px] sm:text-[14px] leading-snug">
                    {latestPage.pitch}
                  </div>
                  <small className="block mt-2 font-manrope font-bold text-[8px] tracking-[0.13em] uppercase text-[#a49d96]">
                    {businessName || "Author"} · Author
                  </small>
                </div>
              )}
            </section>

            {/* Right Column (Opt-in card) */}
            <aside className="w-full">
              <div
                className="rounded-xs border p-4 sm:p-5 space-y-3"
                style={{
                  backgroundColor: themeMode === "dark" ? "#1c1917" : "#ffffff",
                  borderColor: themeMode === "dark" ? "#33302c" : "#ddd7d2",
                  boxShadow:
                    themeMode === "dark"
                      ? "0 10px 30px rgba(0,0,0,0.5)"
                      : "0 10px 30px rgba(35,25,18,0.06)",
                }}
              >
                <div>
                  <div
                    className="text-[8px] font-bold tracking-[0.16em] uppercase mb-1"
                    style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                  >
                    Complimentary digital edition
                  </div>
                  <h4
                    className="font-instrument text-[20px] font-medium leading-tight m-0"
                    style={{ color: themeMode === "dark" ? "#fcfaf8" : "#1c1917" }}
                  >
                    {latestPage?.formTitle || "Get the full report"}
                  </h4>
                  <p
                    className="text-[10px] leading-tight mt-1 mb-0"
                    style={{ color: themeMode === "dark" ? "#a89f97" : "#746c65" }}
                  >
                    {latestPage?.formSubtitle ||
                      "The PDF and supplemental worksheets will arrive directly in your inbox."}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label
                      className="block text-[8px] font-bold tracking-[0.16em] uppercase mb-1"
                      style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                    >
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      readOnly
                      className={`w-full p-2 border text-[11px] outline-none rounded-xs ${
                        themeMode === "dark"
                          ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600"
                          : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-[8px] font-bold tracking-[0.16em] uppercase mb-1"
                      style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                    >
                      WORK EMAIL
                    </label>
                    <input
                      type="email"
                      placeholder="jane@company.com"
                      readOnly
                      className={`w-full p-2 border text-[11px] outline-none rounded-xs ${
                        themeMode === "dark"
                          ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600"
                          : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                  </div>

                  {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                    latestPage.customFormFields.map((field: any) => (
                      <div key={field.id}>
                        <label
                          className="block text-[8px] font-bold tracking-[0.16em] uppercase mb-1"
                          style={{ color: themeMode === "dark" ? "#a89f97" : "#786f68" }}
                        >
                          {field.label?.toUpperCase() || "ADDITIONAL FIELD"}
                          {field.required ? " *" : ""}
                        </label>
                        <input
                          type="text"
                          placeholder={field.placeholder || "Enter value"}
                          readOnly
                          className={`w-full p-2 border text-[11px] outline-none rounded-xs ${
                            themeMode === "dark"
                              ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600"
                              : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400"
                          }`}
                        />
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    className="w-full border-0 p-2.5 text-[11px] font-bold font-manrope text-white cursor-pointer rounded-xs transition hover:opacity-90 mt-1"
                    style={{ backgroundColor: brandColor || "#c2410c" }}
                  >
                    {latestPage?.formButtonText || latestPage?.cta || "Receive the dispatch →"}
                  </button>
                </div>

                <p
                  className="text-center text-[8px] font-manrope pt-1 m-0"
                  style={{ color: themeMode === "dark" ? "#8a817a" : "#746c65" }}
                >
                  No noise. Only occasional, high-signal notes.
                </p>
              </div>
            </aside>
          </main>
        </div>
      )}

      {/* TEMPLATE 7: Brutalist Ledger Edition */}
      {templateId === "template7" && (
        <div
          className={`w-full border-3 transition-colors duration-200 ${
            themeMode === "dark"
              ? "bg-[#0d0d0f] border-[#2a2a2e]"
              : "bg-[#f4ff3c] text-[#101010] border-[#101010]"
          }`}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            color: themeMode === "dark" ? (brandColor || "#f4ff3c") : "#101010",
          }}
        >
          {(() => {
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
            const contrastOnAccent = getContrastColor(accentColor);

            return (
              <>
                {/* Masthead Header */}
                <header
                  className={`grid grid-cols-[1fr_auto] gap-2 px-3 py-2 border-b-3 items-center ${
                    themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-[#f4ff3c]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {logo && (
                      <img
                        src={logo}
                        alt="Logo"
                        className="h-6 w-6 object-cover border border-current shrink-0"
                      />
                    )}
                    <div
                      className={`font-archivo text-base sm:text-lg tracking-tight uppercase ${
                        themeMode === "dark" ? "text-white" : "text-[#101010]"
                      }`}
                    >
                      {(latestPage as any)?.mastheadLeft || businessName || "OUTPUT/INDEX"}
                    </div>
                  </div>
                  <div
                    className={`font-ibm text-[9px] font-bold tracking-wider uppercase sm:text-right ${
                      themeMode === "dark" ? "text-zinc-400" : "text-[#101010]"
                    }`}
                  >
                    {(latestPage as any)?.mastheadRight || "FIELD MANUAL 009 · 48 PAGES"}
                  </div>
                </header>

                {/* Hero Section */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-[54%_46%] border-b-3 ${
                    themeMode === "dark" ? "border-[#2a2a2e]" : "border-[#101010]"
                  }`}
                >
                  {/* Copy Column */}
                  <div
                    className={`p-4 sm:p-5 border-b-3 md:border-b-0 md:border-r-3 flex flex-col justify-between ${
                      themeMode === "dark" ? "border-[#2a2a2e]" : "border-[#101010]"
                    }`}
                  >
                    <div>
                      <span
                        className="inline-block font-ibm px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase border-2 mb-2"
                        style={
                          themeMode === "dark"
                            ? { backgroundColor: accentColor, color: contrastOnAccent, borderColor: accentColor }
                            : { backgroundColor: "#101010", color: accentColor, borderColor: "#101010" }
                        }
                      >
                        {latestPage?.bulletsTitle || "SYSTEMS FOR CREATIVE OPERATORS"}
                      </span>

                      <h1
                        className={`font-archivo text-2xl sm:text-4xl leading-[0.9] tracking-tight uppercase mb-3 ${
                          themeMode === "dark" ? "text-white" : "text-[#101010]"
                        }`}
                      >
                        {latestPage?.headline || "Make Better Work. Faster."}
                      </h1>

                      <p
                        className={`font-ibm text-[11px] leading-relaxed max-w-[420px] m-0 ${
                          themeMode === "dark" ? "text-zinc-300" : "text-[#101010]"
                        }`}
                      >
                        {latestPage?.subheadline ||
                          latestPage?.pitch ||
                          "Thirty-seven operating principles for teams that refuse to choose between quality and momentum."}
                      </p>
                    </div>
                  </div>

                  {/* Image Column with Stamp */}
                  <div
                    className={`relative min-h-[160px] sm:min-h-[200px] flex items-center justify-center overflow-hidden ${
                      themeMode === "dark" ? "bg-[#151518]" : "bg-[#e5ef35]"
                    }`}
                  >
                    {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                      <img
                        src={latestPage.imageUrl}
                        alt={latestPage.name || "Cover Image"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <div
                          className="font-archivo text-2xl sm:text-3xl tracking-tighter uppercase p-2 border-3"
                          style={
                            themeMode === "dark"
                              ? {
                                  borderColor: accentColor,
                                  color: accentColor,
                                  backgroundColor: "black",
                                  boxShadow: `3px 3px 0px ${accentColor}`,
                                }
                              : {
                                  borderColor: "black",
                                  color: "black",
                                  backgroundColor: "white",
                                  boxShadow: "3px 3px 0px #101010",
                                }
                          }
                        >
                          MANUAL
                        </div>
                      </div>
                    )}

                    <div
                      className="absolute right-2 bottom-2 font-ibm font-bold text-[9px] tracking-wider uppercase border-2 px-2 py-1"
                      style={
                        themeMode === "dark"
                          ? {
                              backgroundColor: "#18181b",
                              color: accentColor,
                              borderColor: accentColor,
                              boxShadow: `2px 2px 0px ${accentColor}`,
                              transform: "rotate(-3deg)",
                            }
                          : {
                              backgroundColor: accentColor,
                              color: contrastOnAccent,
                              borderColor: "#101010",
                              boxShadow: "2px 2px 0px rgba(0,0,0,1)",
                              transform: "rotate(-3deg)",
                            }
                      }
                    >
                      12,000+ READERS
                    </div>
                  </div>
                </div>

                {/* Lower Section */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Index Column */}
                  <div
                    className={`border-b-2 md:border-b-0 md:border-r-2 flex flex-col justify-between ${
                      themeMode === "dark" ? "border-[#2a2a2e]" : "border-[#101010]"
                    }`}
                  >
                    <div>
                      {(() => {
                        const displayBullets = Array.isArray(latestPage?.bullets)
                          ? latestPage.bullets
                          : [
                              "THE FRICTION AUDIT — Find where good ideas go to die.",
                              "DECISION VELOCITY — Stop waiting for perfect information.",
                              "THE WEEKLY RESET — A 20-minute operating ritual.",
                            ];

                        return (
                          <>
                            <div
                              className="p-2.5 sm:p-3 border-b-2 flex items-center justify-between font-ibm text-[8px] sm:text-[9px] font-bold tracking-wider uppercase"
                              style={
                                themeMode === "dark"
                                  ? { borderColor: "#2a2a2e", backgroundColor: "#121215", color: accentColor }
                                  : { borderColor: "#101010", backgroundColor: "#eef731", color: "#101010" }
                              }
                            >
                              <span>FIELD MANUAL TABLE OF CONTENTS</span>
                              <span>{displayBullets.length} MODULES</span>
                            </div>

                            {displayBullets.length === 0 ? (
                              <div className="p-6 text-center font-ibm text-[10px] opacity-50 uppercase tracking-wider">
                                NO CHAPTER MODULES ADDED
                              </div>
                            ) : (
                              <div className="divide-y-2" style={{ borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010" }}>
                                {displayBullets.map((item: string, idx: number) => {
                                  const numStr = (idx + 1).toString().padStart(2, "0");
                                  const title = item.includes(" — ") ? item.split(" — ")[0] : item;
                                  const desc = item.includes(" — ") ? item.split(" — ")[1] : "";

                                  return (
                                    <div key={idx} className="grid grid-cols-[35px_1fr] p-2.5 sm:p-3 items-start gap-2 border-b-2" style={{ borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010" }}>
                                      <strong
                                        className="font-archivo text-sm sm:text-base"
                                        style={{ color: themeMode === "dark" ? accentColor : "#101010" }}
                                      >
                                        {numStr}
                                      </strong>
                                      <div className="space-y-0.5 min-w-0">
                                        <div
                                          className={`font-archivo text-[10px] sm:text-[11px] uppercase tracking-tight ${
                                            themeMode === "dark" ? "text-white" : "text-[#101010]"
                                          }`}
                                        >
                                          {title}
                                        </div>
                                        {desc && (
                                          <div
                                            className={`font-ibm text-[8px] sm:text-[9px] leading-relaxed ${
                                              themeMode === "dark" ? "text-zinc-400" : "text-black/80"
                                            }`}
                                          >
                                            {desc}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Form Column */}
                  <div
                    className={`p-4 sm:p-5 flex flex-col justify-between ${
                      themeMode === "dark" ? "bg-[#18181b]" : "text-[#101010]"
                    }`}
                    style={
                      themeMode !== "dark"
                        ? { backgroundColor: accentColor !== "#f4ff3c" ? accentColor : "#ff5a36", color: contrastOnAccent }
                        : undefined
                    }
                  >
                    <div>
                      <h2
                        className="font-archivo text-xl sm:text-2xl leading-[0.95] uppercase tracking-tight mb-1.5"
                        style={{ color: themeMode === "dark" ? accentColor : contrastOnAccent }}
                      >
                        {latestPage?.formTitle || "DOWNLOAD HERE"}
                      </h2>

                      {latestPage?.formSubtitle && (
                        <p
                          className={`font-ibm text-[9px] sm:text-[10px] leading-relaxed mb-3 ${
                            themeMode === "dark"
                              ? "text-zinc-300"
                              : (contrastOnAccent === "#ffffff" ? "text-white/90" : "text-[#101010]/90")
                          }`}
                        >
                          {latestPage.formSubtitle}
                        </p>
                      )}

                      <div className="space-y-0 border-b-2" style={{ borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010" }}>
                        <div
                          className={`grid grid-cols-[80px_1fr] border-t-2 items-center ${
                            themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010]"
                          }`}
                        >
                          <label
                            className="p-2 font-ibm text-[8px] font-bold tracking-wider uppercase border-r-2"
                            style={{
                              borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010",
                              color: themeMode === "dark" ? accentColor : contrastOnAccent,
                            }}
                          >
                            NAME
                          </label>
                          <input
                            type="text"
                            readOnly
                            placeholder="TYPE HERE"
                            className={`font-ibm text-[9px] sm:text-[10px] p-2 bg-transparent outline-none ${
                              themeMode === "dark"
                                ? "text-white placeholder:text-zinc-600"
                                : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-black placeholder:text-black/50")
                            }`}
                          />
                        </div>

                        <div
                          className={`grid grid-cols-[80px_1fr] border-t-2 items-center ${
                            themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010]"
                          }`}
                        >
                          <label
                            className="p-2 font-ibm text-[8px] font-bold tracking-wider uppercase border-r-2"
                            style={{
                              borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010",
                              color: themeMode === "dark" ? accentColor : contrastOnAccent,
                            }}
                          >
                            EMAIL
                          </label>
                          <input
                            type="email"
                            readOnly
                            placeholder="YOU@WORK.COM"
                            className={`font-ibm text-[9px] sm:text-[10px] p-2 bg-transparent outline-none ${
                              themeMode === "dark"
                                ? "text-white placeholder:text-zinc-600"
                                : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-black placeholder:text-black/50")
                            }`}
                          />
                        </div>

                        {/* Custom Form Fields if any */}
                        {latestPage?.customFormFields &&
                          latestPage.customFormFields.map((cf: any, i: number) => (
                            <div
                              key={i}
                              className={`grid grid-cols-[80px_1fr] border-t-2 items-center ${
                                themeMode === "dark" ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010]"
                              }`}
                            >
                              <label
                                className="p-2 font-ibm text-[8px] font-bold tracking-wider uppercase border-r-2 truncate"
                                style={{
                                  borderColor: themeMode === "dark" ? "#2a2a2e" : "#101010",
                                  color: themeMode === "dark" ? accentColor : contrastOnAccent,
                                }}
                              >
                                {cf.label || cf.name || "FIELD"}
                              </label>
                              <input
                                type="text"
                                readOnly
                                placeholder={cf.placeholder || "TYPE HERE"}
                                className={`font-ibm text-[9px] sm:text-[10px] p-2 bg-transparent outline-none ${
                                  themeMode === "dark"
                                    ? "text-white placeholder:text-zinc-600"
                                    : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-black placeholder:text-black/50")
                                }`}
                              />
                            </div>
                          ))}
                      </div>

                      <div className="pt-3">
                        <div
                          className="w-full p-2.5 font-archivo text-xs tracking-wider uppercase border-2 text-center font-bold"
                          style={
                            themeMode === "dark"
                              ? {
                                  backgroundColor: accentColor,
                                  color: contrastOnAccent,
                                  borderColor: accentColor,
                                  boxShadow: `3px 3px 0px ${accentColor}`,
                                }
                              : {
                                  backgroundColor: "#101010",
                                  color: "#ffffff",
                                  borderColor: "#101010",
                                  boxShadow: "3px 3px 0px rgba(0,0,0,1)",
                                }
                          }
                        >
                          {latestPage?.formButtonText || latestPage?.cta || "GET INSTANT ACCESS"}
                        </div>
                      </div>

                      {/* Trust info */}
                      <div
                        className="flex items-center justify-between pt-3 font-ibm text-[7px] uppercase tracking-wider opacity-70"
                        style={{ color: themeMode === "dark" ? "#a1a1aa" : contrastOnAccent }}
                      >
                        <span>🔒 ZERO SPAM PROMISE</span>
                        <span>INSTANT DISPATCH</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticker Footer */}
                <footer
                  className={`py-1.5 px-3 border-t-3 overflow-hidden font-ibm text-[9px] font-bold uppercase tracking-widest ${
                    themeMode === "dark" ? "border-[#2a2a2e] bg-black" : "border-[#101010] bg-[#101010]"
                  }`}
                  style={{ color: accentColor }}
                >
                  NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY
                </footer>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
});

export default BrandTemplatePreview;

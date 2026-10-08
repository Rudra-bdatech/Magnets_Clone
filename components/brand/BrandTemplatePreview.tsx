"use client";

import React, { memo } from "react";
import { Check, Image as ImageIcon } from "lucide-react";
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
      {/* TEMPLATE 1: Template 10 — Premium Night (Editorial Dispatch) */}
      {templateId === "template1" && (() => {
        const isDark = themeMode === "dark";
        const isVeryDark = (hexColor: string) => {
          if (!hexColor || typeof hexColor !== "string" || !hexColor.startsWith("#")) return false;
          const hex = hexColor.replace("#", "").trim();
          if (hex.length !== 6 && hex.length !== 3) return false;
          const fullHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
          const r = parseInt(fullHex.substring(0, 2), 16) || 0;
          const g = parseInt(fullHex.substring(2, 4), 16) || 0;
          const b = parseInt(fullHex.substring(4, 6), 16) || 0;
          const yiq = (r * 299 + g * 587 + b * 114) / 1000;
          return yiq < 60;
        };
        const rawAccent = brandColor || "#fb4d6a";
        const accentColor = isDark && isVeryDark(rawAccent) ? "#fb4d6a" : rawAccent;
        const getInitials = (name: string) => {
          if (!name) return "ED";
          const parts = name.trim().split(/\s+/);
          return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
        };
        const initials = getInitials(businessName || "The Executive Dispatch");
        const defaultBullets = [
          "The Signal-to-Noise Protocol — Audit attention and eliminate low-leverage activities through the Four Filters.",
          "Recursive Hiring Loops — Build a talent engine that identifies multipliers before they reach the market.",
          "Velocity Without Chaos — Replace recurring meetings with lightweight synchronization rituals.",
        ];
        const isBulletsHidden = Array.isArray(latestPage?.bullets) && latestPage.bullets.length === 1 && latestPage.bullets[0] === "__hidden__";
        const displayBullets = isBulletsHidden
          ? []
          : Array.isArray(latestPage?.bullets) && latestPage.bullets.length > 0
          ? latestPage.bullets
          : defaultBullets;

        const parseBullet = (item: string) => {
          if (!item) return { title: "", desc: "" };
          if (item.includes(":::")) {
            const parts = item.split(":::");
            if (parts.length >= 3) {
              return { title: parts[1]?.trim() || "", desc: parts.slice(2).join(":::").trim() };
            }
            return { title: parts[0]?.trim() || "", desc: parts.slice(1).join(":::").trim() };
          }
          if (item.includes(" — ")) {
            const [title, ...rest] = item.split(" — ");
            return { title: title.trim(), desc: rest.join(" — ").trim() };
          }
          if (item.includes(" - ")) {
            const [title, ...rest] = item.split(" - ");
            return { title: title.trim(), desc: rest.join(" - ").trim() };
          }
          if (item.includes(": ")) {
            const [title, ...rest] = item.split(": ");
            return { title: title.trim(), desc: rest.join(": ").trim() };
          }
          return { title: item, desc: "" };
        };

        const renderHighlightedHeadline = (text: string) => {
          if (!text) {
            return (
              <>
                The Architecture of <em style={{ fontStyle: "normal", color: accentColor }}>High-Output</em> Engineering
              </>
            );
          }
          const parts = text.split(/(\*[^*]+\*|_[^_]+_|<em>.*?<\/em>)/g);
          return (
            <>
              {parts.map((part, i) => {
                if ((part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
                    (part.startsWith("_") && part.endsWith("_") && part.length > 2)) {
                  return (
                    <em key={i} style={{ fontStyle: "normal", color: accentColor }}>
                      {part.slice(1, -1)}
                    </em>
                  );
                }
                if (part.startsWith("<em>") && part.endsWith("</em>")) {
                  return (
                    <em key={i} style={{ fontStyle: "normal", color: accentColor }}>
                      {part.replace(/<\/?em>/g, "")}
                    </em>
                  );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
              })}
            </>
          );
        };

        const defaultCover = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80";
        const coverImg = latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? latestPage.imageUrl : defaultCover;

        return (
          <div
            className={`w-full py-4 px-3 sm:px-6 relative rounded-2xl overflow-hidden transition-colors duration-200 ${
              isDark ? "bg-[#0c0d11] text-[#f2f3f7]" : "bg-[#f8f9fa] text-[#111217]"
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {/* Ambient Glows */}
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{
                backgroundImage: `radial-gradient(520px 320px at 18% 0%, ${accentColor}1c, transparent 70%), radial-gradient(420px 260px at 88% 96%, ${accentColor}10, transparent 70%)`,
              }}
            />

            <div className="relative max-w-[960px] mx-auto py-2">
              {/* BRAND HEADER */}
              <header className="flex items-center justify-center gap-3.5 mb-8">
                <div
                  className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center font-extrabold text-[14px] tracking-[0.02em] text-white shrink-0 overflow-hidden shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, #7a1830)`,
                    boxShadow: `0 8px 24px ${hexWithAlpha(accentColor, 0.3)}`,
                  }}
                >
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <b className="text-[14px] font-extrabold tracking-[0.22em] uppercase leading-none">
                  {businessName || "The Executive Dispatch"}
                </b>
              </header>

              {/* GRID */}
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
                {/* Left Column */}
                <div className="space-y-0 min-w-0">
                  <h3
                    className={`text-2xl sm:text-3xl lg:text-4xl leading-[1.08] font-extrabold tracking-[-0.02em] mb-4 break-words [overflow-wrap:anywhere] ${
                      isDark ? "text-white" : "text-[#111217]"
                    }`}
                  >
                    {renderHighlightedHeadline(latestPage?.headline || latestPage?.name || "The Architecture of *High-Output* Engineering")}
                  </h3>

                  <p
                    className={`text-[15px] sm:text-[16px] leading-[1.8] max-w-[580px] mb-2 ${
                      isDark ? "text-[#a9acb8]" : "text-[#4b5563]"
                    }`}
                  >
                    {latestPage?.subheadline || "A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."}
                  </p>

                  {displayBullets.length > 0 && (
                    <>
                      <div className="py-8 sm:py-10">
                        <div
                          className="h-[1px] w-full"
                          style={{ backgroundColor: isDark ? "#23242c" : "#e5e7eb" }}
                        />
                      </div>

                      <p
                        className="text-[11px] font-bold tracking-[0.2em] uppercase mb-6"
                        style={{ color: accentColor }}
                      >
                        {latestPage?.bulletsTitle || "What you will create"}
                      </p>

                      <div className="space-y-2">
                        {displayBullets.map((item, idx) => {
                          const parsed = parseBullet(item);
                          return (
                            <div key={idx} className="grid grid-cols-[24px_1fr] gap-3 py-1.5 items-start">
                              <span
                                className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0 mt-0.5 shadow-xs"
                                style={{ backgroundColor: accentColor }}
                              >
                                ✓
                              </span>
                              <div>
                                <h4 className={`text-[14px] font-bold mb-0.5 leading-snug ${isDark ? "text-white" : "text-[#111217]"}`}>
                                  {parsed.title}
                                </h4>
                                {parsed.desc && (
                                  <p className={`text-[12px] leading-[1.6] ${isDark ? "text-[#9a9da9]" : "text-[#6b7280]"}`}>
                                    {parsed.desc}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Quote block */}
                  {latestPage?.pitch !== "__hidden__" && latestPage?.pitch !== "__none__" && latestPage?.pitch !== "__HIDDEN__" && (
                    <div
                      className="mt-6 pl-4 space-y-1"
                      style={{ borderLeft: `3px solid ${accentColor}` }}
                    >
                      <p className={`italic text-[13px] leading-[1.65] ${isDark ? "text-[#c9ccd6]" : "text-[#374151]"}`}>
                        {latestPage?.pitch || "“Speed is often a byproduct of clarity. Build the infrastructure that makes high performance inevitable.”"}
                      </p>
                      <small className={`block text-[9.5px] font-bold tracking-[0.16em] uppercase mt-1.5 ${isDark ? "text-[#8b8e99]" : "text-[#9ca3af]"}`}>
                        {businessName} · Private dispatch
                      </small>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div className="w-full aspect-[3/2] rounded-[18px] overflow-hidden shadow-xl border border-white/10 bg-zinc-900">
                    <img src={coverImg} alt="Cover preview" className="w-full h-full object-cover" />
                  </div>

                  <div
                    className={`rounded-[22px] p-6 sm:p-7 border transition-all ${
                      isDark ? "bg-[#14151b] border-[#26272f] shadow-2xl" : "bg-white border-[#e5e7eb] shadow-xl"
                    }`}
                  >
                    <h4 className={`text-[21px] font-extrabold mb-2 ${isDark ? "text-white" : "text-[#111217]"}`}>
                      {latestPage?.formTitle || "Get the full report"}
                    </h4>
                    <p className={`text-[12.5px] leading-[1.6] mb-5 ${isDark ? "text-[#9a9da9]" : "text-[#6b7280]"}`}>
                      {latestPage?.formSubtitle || "The PDF and supplemental worksheets will arrive directly in your inbox."}
                    </p>

                    <div className="space-y-3.5">
                      <div className="field">
                        <input
                          type="text"
                          placeholder="Full name"
                          readOnly
                          className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition pointer-events-none select-none ${
                            isDark ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]" : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                          }`}
                        />
                      </div>
                      <div className="field">
                        <input
                          type="email"
                          placeholder="Work email"
                          readOnly
                          className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition pointer-events-none select-none ${
                            isDark ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]" : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                          }`}
                        />
                      </div>

                      {/* Custom Form Fields in Brand Preview */}
                      {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                        <div className="space-y-3">
                          {latestPage.customFormFields.map((field: any) => (
                            <div key={field.id} className="field">
                              <input
                                type="text"
                                placeholder={`${field.label || "Custom field"}${field.required ? " *" : ""}`}
                                readOnly
                                className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition pointer-events-none select-none ${
                                  isDark
                                    ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                                    : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Personalized Deliverable Field in Brand Preview */}
                      {latestPage?.enableAiPersonalizedDeliverable && (
                        <div className="field">
                          <input
                            type="text"
                            readOnly
                            placeholder={latestPage?.customPromptPlaceholder || latestPage?.customPromptQuestion || "Your focus / objective"}
                            className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition pointer-events-none select-none ${
                              isDark
                                ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                                : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                            }`}
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        className="w-full text-white py-3.5 px-6 rounded-[14px] font-extrabold text-sm tracking-[0.01em] shadow-lg transition pointer-events-none"
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: `0 10px 24px -6px ${accentColor}66`,
                        }}
                      >
                        {latestPage?.formButtonText || latestPage?.cta || "Get instant access"}
                      </button>
                    </div>

                    <p className={`text-center text-[10.5px] mt-4 ${isDark ? "text-[#7d8090]" : "text-[#9ca3af]"}`}>
                      No noise. Only occasional, high-signal notes.
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <footer
                className="mt-10 pt-4 flex justify-between gap-3 flex-wrap text-[9.5px] font-semibold tracking-[0.14em] uppercase"
                style={{
                  borderTop: `1px solid ${isDark ? "#23242c" : "#e5e7eb"}`,
                  color: isDark ? "#7d8090" : "#9ca3af",
                }}
              >
                <span>© 2026 {businessName || "Vane Strategic Partners"} · Private circulation</span>
                <span>By {businessName || "Marcus Vane"}</span>
              </footer>
            </div>
          </div>
        );
      })()}


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

      {/* TEMPLATE 3: AI with Ambesh Editorial Note */}
      {templateId === "template3" && (() => {
        const isDark = themeMode === "dark";
        const bg = isDark ? "#0c120a" : "#f4f6f0";
        const surface = isDark ? "#171e12" : "#ffffff";
        const surfaceBottom = isDark ? "#141b10" : "#eef2e7";
        const foreground = isDark ? "#edf0e8" : "#141c10";
        const muted = isDark ? "#a7ada0" : "#525c4c";
        const faint = isDark ? "#8d9584" : "#788272";
        const borderCol = isDark ? "#242d1e" : "#d8dfd2";
        const inputBorder = isDark ? "#35402a" : "#c4cec0";
        const accent = isDark ? (brandColor === "#0066B2" ? "#d0e797" : brandColor) : (brandColor === "#0066B2" ? "#4d6b1a" : brandColor);
        const accentInk = isDark ? "#1d2a12" : "#ffffff";
        const panelFill = isDark
          ? "linear-gradient(135deg, #171e12, #141b10)"
          : "linear-gradient(135deg, #ffffff, #f0f4ea)";

        const displayBusinessName = businessName || "AI with Ambesh";
        const displayAuthorName = businessName || "Ambesh Tiwari";
        const brandInitial = (displayBusinessName ? displayBusinessName.charAt(0) : "a").toLowerCase();

        const defaultBenefitCards = [
          {
            title: "AI Updates",
            desc: "Important developments from OpenAI, Google, Anthropic, Microsoft and Meta, explained for business owners.",
          },
          {
            title: "Real Business Examples",
            desc: "See how companies are actually using AI. Understand the problem, the approach, and what you can learn from it.",
          },
          {
            title: "Steal This",
            desc: "Templates, prompts, workflows and checklists. One practical resource you can save and put to use right away.",
          },
          {
            title: "What I'm Testing",
            desc: "Things I'm personally trying inside BDA, the lessons along the way, and what I think is worth your time.",
          },
        ];

        const displayBullets = Array.isArray(latestPage?.bullets) && latestPage.bullets.length > 0
          ? latestPage.bullets
          : defaultBenefitCards.map(c => `${c.title} ::: ${c.desc}`);

        const parseCard = (item: string, idx: number) => {
          if (!item) {
            const def = defaultBenefitCards[idx % defaultBenefitCards.length];
            return { title: def.title, desc: def.desc };
          }
          if (item.includes(":::")) {
            const parts = item.split(":::");
            return { title: parts[0]?.trim() || "", desc: parts.slice(1).join(":::").trim() };
          }
          if (item.includes(" — ")) {
            const [title, ...rest] = item.split(" — ");
            return { title: title.trim(), desc: rest.join(" — ").trim() };
          }
          return { title: item, desc: "" };
        };

        const renderHighlightedHeadline = (text: string) => {
          if (!text) {
            return (
              <>
                Use AI to run a <em style={{ color: accent, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", display: "inline" }}>smarter business.</em>
              </>
            );
          }
          const parts = text.split(/(\*[^*]+\*|_[^_]+_|<em>.*?<\/em>)/g);
          return (
            <>
              {parts.map((part, i) => {
                if ((part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
                    (part.startsWith("_") && part.endsWith("_") && part.length > 2)) {
                  return (
                    <em key={i} style={{ color: accent, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", display: "inline" }}>
                      {part.slice(1, -1)}
                    </em>
                  );
                }
                if (part.startsWith("<em>") && part.endsWith("</em>")) {
                  return (
                    <em key={i} style={{ color: accent, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", display: "inline" }}>
                      {part.replace(/<\/?em>/g, "")}
                    </em>
                  );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
              })}
            </>
          );
        };

        const parsePitch = (raw?: string) => {
          if (!raw || !raw.trim()) {
            return { line1: "Built for people running a business.", line2: "Every idea comes back to the work." };
          }
          if (raw.includes(":::")) {
            const [l1, ...l2] = raw.split(":::");
            return { line1: l1.trim(), line2: l2.join(":::").trim() };
          }
          if (raw.includes("\n")) {
            const [l1, ...l2] = raw.split("\n");
            return { line1: l1.trim(), line2: l2.join(" ").trim() };
          }
          return { line1: raw.trim(), line2: "" };
        };

        const { line1: aside1, line2: aside2 } = parsePitch(latestPage?.pitch);

        return (
          <div
            className="w-full py-2 px-2 sm:px-4 rounded-xl transition-colors duration-200"
            style={{
              backgroundColor: bg,
              color: foreground,
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            {/* Header */}
            <header
              className="h-16 flex items-center justify-between px-2"
              style={{ borderBottom: `1px solid ${borderCol}` }}
            >
              <div className="inline-flex items-center gap-2.5 font-semibold text-sm sm:text-base">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-base leading-none shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: accent,
                    color: accentInk,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : brandInitial}
                </span>
                <span className="font-semibold tracking-tight">{displayBusinessName}</span>
                <span style={{ color: accent }} className="text-lg -ml-1.5">.</span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: muted }}>
                <span className="hidden sm:inline">Read a preview</span>
                <span
                  className="px-3 py-1 rounded-full border text-[11px]"
                  style={{ borderColor: borderCol, color: foreground }}
                >
                  Join the newsletter <span style={{ color: accent }}>↗</span>
                </span>
              </div>
            </header>

            {/* Hero Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 items-start px-2">
              {/* Left Column (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  <p className="text-[10px] font-bold tracking-[2px] uppercase m-0" style={{ color: accent }}>
                    {latestPage?.bulletsTitle || "A weekly note for business minds"}
                  </p>
                </div>

                <h2
                  className="text-2xl sm:text-3xl lg:text-4xl font-normal leading-[1.1] m-0"
                  style={{
                    color: foreground,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  {renderHighlightedHeadline(latestPage?.headline || latestPage?.name || "Use AI to run a *smarter business.*")}
                </h2>

                <p className="text-xs sm:text-sm leading-[1.7] m-0" style={{ color: muted }}>
                  {latestPage?.subheadline || "Every week I filter the AI noise and send you what actually matters: important updates, real business use cases, and one resource you can steal and use."}
                </p>

                <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: muted }}>
                  <span className="flex items-center gap-1"><span style={{ color: accent }}>✓</span> 3-minute read</span>
                  <span className="flex items-center gap-1"><span style={{ color: accent }}>✓</span> No technical jargon</span>
                  <span className="flex items-center gap-1"><span style={{ color: accent }}>✓</span> No AI noise</span>
                </div>

                {/* Author info */}
                <div className="pt-2 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border flex items-center justify-center text-sm shrink-0 overflow-hidden"
                    style={{
                      borderColor: inputBorder,
                      color: accent,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      backgroundColor: isDark ? "#141b10" : "#eef2e7",
                    }}
                  >
                    {latestPage?.imageUrl ? (
                      <img src={latestPage.imageUrl} alt={displayAuthorName} className="w-full h-full object-cover" />
                    ) : (
                      "AT"
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold m-0" style={{ color: foreground }}>
                      {displayAuthorName}
                    </p>
                    <p className="text-[11px] m-0" style={{ color: faint }}>
                      {businessName ? `Founder of ${businessName}` : "Founder of BDA Technologies"} · Author of <em>Accelerate with AI</em>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols) Form Card */}
              <div
                className="md:col-span-5 rounded-xl border p-5 shadow-lg space-y-3"
                style={{
                  background: panelFill,
                  borderColor: borderCol,
                }}
              >
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider m-0" style={{ color: accent }}>
                    Less noise. More useful.
                  </p>
                  <h3
                    className="text-lg font-normal m-0"
                    style={{
                      color: foreground,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                    }}
                  >
                    {latestPage?.formTitle || "Your next business advantage."}
                  </h3>
                  <p className="text-[11px] leading-relaxed mt-1 m-0" style={{ color: muted }}>
                    {latestPage?.formSubtitle || "A little clarity on AI. One useful idea to put to work. In your inbox, every week."}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Your first name"
                    readOnly
                    className="w-full h-9 px-3 rounded-md text-xs border outline-none pointer-events-none"
                    style={{ backgroundColor: bg, borderColor: inputBorder, color: foreground }}
                  />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    readOnly
                    className="w-full h-9 px-3 rounded-md text-xs border outline-none pointer-events-none"
                    style={{ backgroundColor: bg, borderColor: inputBorder, color: foreground }}
                  />

                  {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                    latestPage.customFormFields.map((field: any) => (
                      <input
                        key={field.id}
                        type="text"
                        placeholder={`${field.label || "Custom field"}`}
                        readOnly
                        className="w-full h-9 px-3 rounded-md text-xs border outline-none pointer-events-none"
                        style={{ backgroundColor: bg, borderColor: inputBorder, color: foreground }}
                      />
                    ))
                  )}

                  <button
                    type="button"
                    className="w-full h-10 px-4 rounded-md font-bold text-xs flex items-center justify-between shadow-sm pointer-events-none"
                    style={{
                      backgroundColor: accent,
                      color: accentInk,
                    }}
                  >
                    <span>{latestPage?.formButtonText || latestPage?.cta || "Get AI with Ambesh"}</span>
                    <span>→</span>
                  </button>
                  <p className="text-center text-[9px] m-0" style={{ color: faint }}>
                    Free. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits 4-card grid */}
            <div className="py-6 border-t px-2" style={{ borderColor: borderCol }}>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>
                    A useful inbox habit
                  </p>
                  <h4
                    className="text-lg font-normal m-0"
                    style={{
                      color: foreground,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                    }}
                  >
                    What you&apos;ll get.
                  </h4>
                </div>
                <p className="text-[11px] leading-snug m-0 text-right" style={{ color: muted }}>
                  {aside1}<br />{aside2}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {displayBullets.slice(0, 4).map((item, idx) => {
                  const parsed = parseCard(item, idx);
                  const def = defaultBenefitCards[idx % defaultBenefitCards.length];
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border p-3.5 flex flex-col justify-between"
                      style={{ background: panelFill, borderColor: borderCol }}
                    >
                      <div className="text-xs mb-2" style={{ color: accent }}>
                        {idx === 0 ? "⚡" : idx === 1 ? "💼" : idx === 2 ? "📥" : "🧪"}
                      </div>
                      <div>
                        <h5
                          className="text-xs font-semibold mb-1"
                          style={{
                            color: foreground,
                            fontFamily: "Georgia, 'Times New Roman', serif",
                          }}
                        >
                          {parsed.title || def.title}
                        </h5>
                        <p className="text-[10px] leading-relaxed m-0" style={{ color: muted }}>
                          {parsed.desc || def.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TEMPLATE 4: Night Poster / Day Poster Edition */}
      {templateId === "template4" && (
        (() => {
          const isDark = themeMode === "dark";
          const isVeryDark = (hexColor: string) => {
            if (!hexColor || typeof hexColor !== "string" || !hexColor.startsWith("#")) return false;
            const hex = hexColor.replace("#", "").trim();
            if (hex.length !== 6 && hex.length !== 3) return false;
            const fullHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
            const r = parseInt(fullHex.substring(0, 2), 16) || 0;
            const g = parseInt(fullHex.substring(2, 4), 16) || 0;
            const b = parseInt(fullHex.substring(4, 6), 16) || 0;
            const yiq = (r * 299 + g * 587 + b * 114) / 1000;
            return yiq < 60;
          };
          const canvasBg = isDark ? "#0b0d12" : "#f5f1e8";
          const textColor = isDark ? "#f5f1e8" : "#0b0d12";
          const mutedText = isDark ? "#b9bbc3" : "#4b5563";
          const dimText = isDark ? "#8d9099" : "#6b7280";
          const borderColor = isDark ? "rgba(255, 255, 255, 0.17)" : "rgba(11, 13, 18, 0.16)";
          const rawAccent = brandColor || "#ff5038";
          const accentColor = isDark && isVeryDark(rawAccent) ? "#ff5038" : rawAccent;
          const numberTeal = isDark ? "#2dd4bf" : "#0d9488";
          const formBoxBg = isDark ? "#f5f1e8" : "#0b0d12";
          const formBoxText = isDark ? "#0b0d12" : "#f5f1e8";
          const formBoxMuted = isDark ? "#4b5563" : "#b9bbc3";
          const formBoxInputBorder = isDark ? "#0b0d12" : "#f5f1e8";

          const defaultTracks = [
            {
              title: "Pattern Recognition",
              desc: "Read the cultural signals before they become obvious.",
            },
            {
              title: "Narrative Pressure",
              desc: "Build stories that create momentum without manipulation.",
            },
            {
              title: "Durable Demand",
              desc: "Turn attention into a repeatable commercial system.",
            },
          ];

          const parseTrack = (item: string, idx: number) => {
            if (!item) return defaultTracks[idx % defaultTracks.length];
            if (item.includes(":::")) {
              const parts = item.split(":::");
              return { title: parts[0]?.trim() || "", desc: parts[1]?.trim() || "" };
            }
            if (item.includes(" — ")) {
              const parts = item.split(" — ");
              return { title: parts[0]?.trim() || "", desc: parts[1]?.trim() || "" };
            }
            if (item.includes(" - ")) {
              const parts = item.split(" - ");
              return { title: parts[0]?.trim() || "", desc: parts[1]?.trim() || "" };
            }
            return { title: item, desc: "" };
          };

          const parsePitch = (rawPitch: string | undefined | null) => {
            if (!rawPitch) {
              return {
                statNumber: "48",
                pitchText: "Pages of battle-tested systems for creating authority, holding attention, and turning an original point of view into durable demand.",
                hasStat: true,
              };
            }
            if (rawPitch === "__hidden__" || rawPitch === "__none__") {
              return {
                statNumber: "",
                pitchText: "",
                hasStat: false,
                isHidden: true,
              };
            }
            if (rawPitch.includes(":::")) {
              const parts = rawPitch.split(":::");
              const num = parts[0]?.trim() || "";
              const text = parts.slice(1).join(":::").trim();
              const hasStat = num !== "__none__" && num !== "__hidden__";
              return {
                statNumber: hasStat ? num : "",
                pitchText: text,
                hasStat,
                isHidden: false,
              };
            }
            return {
              statNumber: "48",
              pitchText: rawPitch,
              hasStat: true,
              isHidden: false,
            };
          };

          const parsedPitch = parsePitch(latestPage?.pitch);

          const trackItems = (latestPage?.bullets && latestPage.bullets.length > 0)
            ? latestPage.bullets
            : defaultTracks.map((t) => `${t.title} ::: ${t.desc}`);

          return (
            <div
              className="w-full rounded-lg overflow-hidden border transition-colors selection:bg-rose-500 selection:text-white"
              style={{
                backgroundColor: canvasBg,
                color: textColor,
                borderColor,
                fontFamily: "'Space Mono', monospace, ui-monospace, sans-serif",
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');
                    .font-bebas {
                      font-family: 'Bebas Neue', sans-serif, -apple-system;
                    }
                    .font-space {
                      font-family: 'Space Mono', monospace, ui-monospace;
                    }
                  `,
                }}
              />

              {/* 1. TOP NAV BAR */}
              <header
                className="flex items-center justify-between px-4 py-3 border-b text-[9px] tracking-[0.18em] uppercase"
                style={{ borderColor }}
              >
                <div className="flex items-center gap-2">
                  {logo && (
                    <img
                      src={logo}
                      alt="Logo"
                      className="h-4 w-4 object-cover rounded-xs border"
                      style={{ borderColor }}
                    />
                  )}
                  <b className="font-space truncate">
                    {latestPage?.mastheadLeft || `${(businessName || "NOCTURNE").toUpperCase()} / RESEARCH`}
                  </b>
                </div>

                <div className="font-space text-right text-[8px]" style={{ color: mutedText }}>
                  {latestPage?.mastheadRight || `ISSUE 11 — ${new Date().getFullYear()}`}
                </div>
              </header>

              {/* 2. HERO STAGE */}
              <main className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] min-h-[380px] relative">
                {/* Left Column: Overline, Headline, Intro */}
                <div className="p-5 flex flex-col justify-between relative z-10">
                  <div className="space-y-3">
                    <small
                      className="font-space text-[9px] font-bold uppercase tracking-[0.2em] block"
                      style={{ color: accentColor }}
                    >
                      {latestPage?.bulletsTitle || "A MANUAL FOR INDEPENDENT MINDS"}
                    </small>

                    <h3
                      className="font-bebas text-4xl sm:text-5xl md:text-6xl leading-[0.84] tracking-normal uppercase m-0"
                      style={{ color: textColor }}
                    >
                      {latestPage?.headline || latestPage?.name || "THE SIGNAL CODE"}
                    </h3>

                    {latestPage?.subheadline && (
                      <p
                        className="font-space text-[10px] leading-relaxed m-0"
                        style={{ color: mutedText }}
                      >
                        {latestPage.subheadline}
                      </p>
                    )}
                  </div>

                  {!parsedPitch.isHidden && (
                    <div className="flex items-start gap-3 pt-4">
                      {parsedPitch.hasStat && parsedPitch.statNumber && (
                        <div
                          className="font-bebas text-4xl leading-none select-none shrink-0"
                          style={{ color: numberTeal }}
                        >
                          {parsedPitch.statNumber}
                        </div>
                      )}
                      <p
                        className="font-space text-[9px] leading-relaxed m-0"
                        style={{ color: mutedText }}
                      >
                        {parsedPitch.pitchText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Visual Cover & Floating Formbox */}
                <div className="relative min-h-[280px] md:min-h-full flex flex-col justify-end overflow-hidden group">
                  {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                    <img
                      src={latestPage.imageUrl}
                      alt={latestPage?.name || "Cover"}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center select-none"
                      style={{
                        background: isDark
                          ? "radial-gradient(circle at 60% 40%, #1c202a 0%, #0d0f15 100%)"
                          : "radial-gradient(circle at 60% 40%, #e8e2d5 0%, #d8d0c0 100%)",
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{
                          backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
                          backgroundSize: "28px 28px",
                        }}
                      />
                      <div className="relative z-10 text-center space-y-1 px-4 pointer-events-none">
                        <div
                          className="font-bebas text-3xl opacity-25 tracking-widest uppercase"
                          style={{ color: textColor }}
                        >
                          {businessName || "NOCTURNE"}
                        </div>
                        <div
                          className="font-space text-[7px] tracking-[0.2em] uppercase opacity-40"
                          style={{ color: textColor }}
                        >
                          ARCHIVAL SPECIFICATION
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fade Gradient */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: isDark
                        ? `linear-gradient(90deg, #0b0d12 0%, rgba(11, 13, 18, 0.7) 20%, transparent 55%), linear-gradient(0deg, #0b0d12 0%, transparent 40%)`
                        : `linear-gradient(90deg, #f5f1e8 0%, rgba(245, 241, 232, 0.7) 20%, transparent 55%), linear-gradient(0deg, #f5f1e8 0%, transparent 40%)`,
                    }}
                  />

                  {/* Rotated Sideword */}
                  <div
                    className="hidden md:block absolute right-[-30px] top-[140px] transform rotate-90 font-bebas text-xs tracking-[0.3em] select-none pointer-events-none z-20"
                    style={{
                      color: isDark ? "rgba(255, 255, 255, 0.28)" : "rgba(11, 13, 18, 0.28)",
                    }}
                  >
                    LIMITED DIGITAL RELEASE
                  </div>

                  {/* Floating Formbox Preview */}
                  <div
                    className="relative md:absolute z-30 md:right-3 md:bottom-3 m-3 md:m-0 w-auto md:w-[240px] p-4 shadow-xl"
                    style={{
                      backgroundColor: formBoxBg,
                      color: formBoxText,
                    }}
                  >
                    <p
                      className="font-bebas text-xl uppercase leading-tight m-0"
                      style={{ color: formBoxText }}
                    >
                      {latestPage?.formTitle || "ENTER THE ARCHIVE"}
                    </p>
                    <p
                      className="font-space text-[9px] leading-tight mt-0.5 mb-2.5"
                      style={{ color: isDark ? "#4b5563" : "#9ca3af" }}
                    >
                      {latestPage?.formSubtitle || "Receive the complete report and templates."}
                    </p>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        readOnly
                        placeholder={latestPage?.namePlaceholder || "YOUR NAME"}
                        className="w-full border-0 border-b bg-transparent py-1 px-0.5 font-space text-[9px] outline-none placeholder:text-current placeholder:opacity-40"
                        style={{ borderBottomColor: isDark ? "#0b0d12" : "rgba(245, 241, 232, 0.6)", color: formBoxText }}
                      />
                      <input
                        type="email"
                        readOnly
                        placeholder={latestPage?.emailPlaceholder || "EMAIL ADDRESS"}
                        className="w-full border-0 border-b bg-transparent py-1 px-0.5 font-space text-[9px] outline-none placeholder:text-current placeholder:opacity-40"
                        style={{ borderBottomColor: isDark ? "#0b0d12" : "rgba(245, 241, 232, 0.6)", color: formBoxText }}
                      />

                      {/* Sync Dynamic Custom Form Fields */}
                      {latestPage?.customFormFields && latestPage.customFormFields.length > 0 && (
                        latestPage.customFormFields.map((field) => (
                          <div key={field.id}>
                            <input
                              type="text"
                              readOnly
                              placeholder={`${(field.label || "FIELD").toUpperCase()}${field.required ? " *" : ""}`}
                              className="w-full border-0 border-b bg-transparent py-1 px-0.5 font-space text-[9px] outline-none placeholder:text-current placeholder:opacity-40"
                              style={{ borderBottomColor: isDark ? "#0b0d12" : "rgba(245, 241, 232, 0.6)", color: formBoxText }}
                            />
                          </div>
                        ))
                      )}

                      <button
                        type="button"
                        className="w-full text-center py-2 px-2 font-space font-bold text-[9px] uppercase tracking-wider mt-2 cursor-pointer shadow-md transition"
                        style={{
                          backgroundColor: accentColor,
                          color: isDark ? "#0b0d12" : "#ffffff",
                        }}
                      >
                        {latestPage?.formButtonText || latestPage?.cta || "UNLOCK THE REPORT →"}
                      </button>
                    </div>
                  </div>
                </div>
              </main>

              {/* 3. TRACKS SECTION */}
              <footer
                className="border-t grid grid-cols-1 md:grid-cols-3 text-left"
                style={{ borderColor }}
              >
                {trackItems.slice(0, 3).map((item, idx) => {
                  const trackNum = (idx + 1).toString().padStart(2, "0");
                  const parsed = parseTrack(item, idx);

                  return (
                    <article
                      key={idx}
                      className={`p-3 flex flex-col justify-between ${
                        idx < 2 ? "md:border-r border-b md:border-b-0" : ""
                      }`}
                      style={{ borderColor }}
                    >
                      <small
                        className="font-space text-[8px] font-bold uppercase tracking-wider"
                        style={{ color: numberTeal }}
                      >
                        TRACK / {trackNum}
                      </small>
                      <p
                        className="font-bebas text-base uppercase m-0 leading-tight mt-0.5"
                        style={{ color: textColor }}
                      >
                        {parsed.title}
                      </p>
                      <p
                        className="font-space text-[7px] leading-tight m-0 mt-0.5"
                        style={{ color: dimText }}
                      >
                        {parsed.desc}
                      </p>
                    </article>
                  );
                })}
              </footer>
            </div>
          );
        })()
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
                            ? { backgroundColor: darkAccent, color: contrastOnDarkAccent, borderColor: darkAccent }
                            : { backgroundColor: "#101010", color: "#ffffff", borderColor: "#101010" }
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
                                  borderColor: darkAccent,
                                  color: darkAccent,
                                  backgroundColor: "black",
                                  boxShadow: `3px 3px 0px ${darkAccent}`,
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
                              color: darkAccent,
                              borderColor: darkAccent,
                              boxShadow: `2px 2px 0px ${darkAccent}`,
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
                                  ? { borderColor: "#2a2a2e", backgroundColor: "#121215", color: darkAccent }
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
                                        style={{ color: themeMode === "dark" ? darkAccent : "#101010" }}
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
                        style={{ color: themeMode === "dark" ? darkAccent : contrastOnAccent }}
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
                              color: themeMode === "dark" ? darkAccent : contrastOnAccent,
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
                              color: themeMode === "dark" ? darkAccent : contrastOnAccent,
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
                                  color: themeMode === "dark" ? darkAccent : contrastOnAccent,
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
                                  backgroundColor: darkAccent,
                                  color: contrastOnDarkAccent,
                                  borderColor: darkAccent,
                                  boxShadow: `3px 3px 0px ${darkAccent}`,
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
                  style={{ color: themeMode === "dark" ? darkAccent : "#ffffff" }}
                >
                  NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY
                </footer>
              </>
            );
          })()}
        </div>
      )}

      {/* TEMPLATE 8: Collage Zine Layout */}
      {templateId === "template8" && (
        <div
          className={`w-full transition-colors duration-200 border-2 overflow-hidden ${
            themeMode === "dark"
              ? "bg-[#15161d] border-[#2e303d] text-[#f4f4f5] shadow-[6px_6px_0px_#000000]"
              : "bg-[#f8f4e9] border-[#141414] text-[#141414] shadow-[6px_6px_0px_#141414]"
          }`}
          style={{
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Shrikhand&display=swap');
                .font-shrikhand {
                  font-family: 'Shrikhand', cursive, serif;
                }
                .font-dm-sans {
                  font-family: 'DM Sans', sans-serif;
                }
              `,
            }}
          />

          {(() => {
            const accentColor = brandColor || "#1554db";
            const getContrastColor = (hexColor: string) => {
              if (!hexColor || !hexColor.startsWith("#")) return "#ffffff";
              const hex = hexColor.replace("#", "");
              if (hex.length !== 6) return "#ffffff";
              const r = parseInt(hex.substring(0, 2), 16) || 0;
              const g = parseInt(hex.substring(2, 4), 16) || 0;
              const b = parseInt(hex.substring(4, 6), 16) || 0;
              const yiq = (r * 299 + g * 587 + b * 114) / 1000;
              return yiq >= 135 ? "#141414" : "#ffffff";
            };
            const contrastOnAccent = getContrastColor(accentColor);

            return (
              <>
                {/* 1. Masthead Header */}
                <header
                  className={`flex justify-between items-center px-4 py-3 sm:px-6 sm:py-3.5 border-b-2 transition-colors ${
                    themeMode === "dark" ? "border-[#2e303d] bg-[#121319]" : "border-[#141414] bg-[#f8f4e9]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {logo && (
                      <img
                        src={logo}
                        alt="Logo"
                        className={`h-6 w-6 object-cover border-2 shrink-0 ${
                          themeMode === "dark" ? "border-[#2e303d]" : "border-[#141414]"
                        }`}
                      />
                    )}
                    <span
                      className={`font-shrikhand text-lg sm:text-xl tracking-wide ${
                        themeMode === "dark" ? "text-white" : "text-[#141414]"
                      }`}
                    >
                      {businessName || "Odd Hours"}
                    </span>
                  </div>

                  <span
                    className={`font-dm-sans text-[9px] sm:text-[10px] font-bold tracking-[0.14em] uppercase ${
                      themeMode === "dark" ? "text-zinc-400" : "text-[#141414]"
                    }`}
                  >
                    CREATIVE FIELD NOTES · #07
                  </span>
                </header>

                {/* 2. Hero Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[300px]">
                  {/* Poster Left */}
                  <div
                    className={`md:col-span-5 relative min-h-[220px] sm:min-h-[260px] border-b-2 md:border-b-0 md:border-r-2 overflow-hidden flex items-center justify-center ${
                      themeMode === "dark" ? "border-[#2e303d] bg-[#1a1b24]" : "border-[#141414] bg-[#f5ed21]"
                    }`}
                  >
                    {latestPage?.imageUrl && latestPage.imageUrl.trim() !== "" ? (
                      <img
                        src={latestPage.imageUrl}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full relative flex flex-col justify-between p-4 min-h-[200px]">
                        <span
                          className={`font-dm-sans text-[8px] font-black uppercase px-2 py-0.5 border-2 w-fit ${
                            themeMode === "dark"
                              ? "bg-black text-[#f5ed21] border-[#f5ed21]"
                              : "bg-[#141414] text-white border-[#141414]"
                          }`}
                        >
                          VOL. 2026
                        </span>
                        <div className="text-center my-auto">
                          <div
                            className={`inline-block font-shrikhand text-2xl sm:text-3xl uppercase p-3 border-2 ${
                              themeMode === "dark"
                                ? "bg-[#121319] text-white border-[#2e303d]"
                                : "bg-white text-[#1554db] border-[#141414]"
                            }`}
                          >
                            <span style={{ color: accentColor }}>
                              CREATIVE
                            </span>
                            <br />
                            <span className="text-[#ff315b]">NOTES</span>
                          </div>
                        </div>
                        <span className="font-dm-sans text-[8px] font-bold text-center tracking-widest uppercase">
                          ★ ARCHIVE EDITION ★
                        </span>
                      </div>
                    )}

                    {/* Circular Sticker Badge */}
                    <div
                      className={`absolute top-3 left-3 rounded-full w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] flex flex-col items-center justify-center text-center font-dm-sans font-black text-[8px] sm:text-[9px] leading-tight select-none border-2 ${
                        themeMode === "dark"
                          ? "bg-[#ff3366] text-white border-[#2e303d] shadow-[2px_2px_0px_#000000]"
                          : "bg-[#ff4d73] text-white border-[#141414] shadow-[2px_2px_0px_#141414]"
                      }`}
                      style={{
                        transform: "rotate(-10deg)",
                      }}
                    >
                      <span>FREE</span>
                      <span>EDITION!</span>
                    </div>
                  </div>

                  {/* Copy Right */}
                  <div
                    className={`md:col-span-7 p-4 sm:p-6 flex flex-col justify-between ${
                      themeMode === "dark" ? "bg-[#15161d]" : "bg-[#f8f4e9]"
                    }`}
                  >
                    <div>
                      <span
                        className="font-dm-sans inline-block px-2 py-1 text-[9px] font-black uppercase border-2 border-[#141414] shadow-[2px_2px_0px_#141414] text-[#141414] bg-[#f5ed21] mb-3"
                        style={{ transform: "rotate(2deg)" }}
                      >
                        {latestPage?.bulletsTitle || "A PLAYBOOK FOR PEOPLE WITH IDEAS"}
                      </span>

                      <h3
                        className={`font-shrikhand text-2xl sm:text-3xl md:text-4xl leading-[0.95] tracking-tight mb-3`}
                        style={{
                          color: accentColor,
                        }}
                      >
                        {latestPage?.headline ? (
                          latestPage.headline.includes("Impossible") ? (
                            <>
                              {latestPage.headline.split("Impossible")[0]}
                              <span className="text-[#ff315b]">Impossible</span>
                              {latestPage.headline.split("Impossible")[1]}
                            </>
                          ) : (
                            latestPage.headline
                          )
                        ) : (
                          <>
                            Make Your Work <span className="text-[#ff315b]">Impossible</span> to Ignore.
                          </>
                        )}
                      </h3>

                      <p
                        className={`font-dm-sans text-xs sm:text-sm leading-relaxed ${
                          themeMode === "dark" ? "text-zinc-300" : "text-[#141414]"
                        }`}
                      >
                        {latestPage?.subheadline ||
                          latestPage?.pitch ||
                          "Twenty-one unconventional prompts, narrative tricks, and visual systems for turning 'pretty good' into unmistakably yours."}
                      </p>
                    </div>

                    <div
                      className={`pt-3 mt-3 border-t-2 text-[8px] font-dm-sans font-bold uppercase tracking-wider flex justify-between ${
                        themeMode === "dark" ? "border-[#2e303d] text-zinc-500" : "border-[#141414]/15 text-[#141414]/60"
                      }`}
                    >
                      <span>ZINE DISPATCH</span>
                      <span>EST. 2026</span>
                    </div>
                  </div>
                </div>

                {/* 3. Bottom Section: Bits & Signup */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-12 border-t-2 ${
                    themeMode === "dark" ? "border-[#2e303d]" : "border-[#141414]"
                  }`}
                >
                  {/* Bits Left */}
                  <div
                    className={`md:col-span-7 grid grid-cols-1 ${
                      (latestPage?.bullets || []).length === 1
                        ? "md:grid-cols-1"
                        : (latestPage?.bullets || []).length === 2
                        ? "md:grid-cols-2"
                        : "md:grid-cols-3"
                    } border-b-2 md:border-b-0 md:border-r-2 ${
                      themeMode === "dark" ? "border-[#2e303d] bg-[#121319]" : "border-[#141414] bg-[#f8f4e9]"
                    }`}
                  >
                    {(() => {
                      const defaultBullets = [
                        "01:::Find the strange bit:::Your most specific instinct is your best edge.",
                        "02:::Repeatable worlds:::Cohesive visual and narrative systems.",
                        "03:::Ship quickly:::A practical ritual for weekly momentum.",
                      ];
                      const bList = (Array.isArray(latestPage?.bullets) && latestPage.bullets.length > 0)
                        ? latestPage.bullets
                        : defaultBullets;

                      const parseB = (item: string, defaultIdx: number) => {
                        if (!item) return { num: (defaultIdx + 1).toString().padStart(2, "0"), title: "", desc: "" };
                        if (item.includes(":::")) {
                          const parts = item.split(":::");
                          if (parts.length >= 3) return { num: parts[0], title: parts[1].trim(), desc: parts.slice(2).join(":::").trim() };
                          return { num: (defaultIdx + 1).toString().padStart(2, "0"), title: parts[0].trim(), desc: parts.slice(1).join(":::").trim() };
                        }
                        if (item.includes(" — ")) {
                          const [title, ...rest] = item.split(" — ");
                          return { num: (defaultIdx + 1).toString().padStart(2, "0"), title: title.trim(), desc: rest.join(" — ").trim() };
                        }
                        return { num: (defaultIdx + 1).toString().padStart(2, "0"), title: item, desc: "" };
                      };

                      return bList.map((bullet: string, idx: number) => {
                        const parsed = parseB(bullet, idx);
                        const isNumHidden = parsed.num === "__none__";
                        const displayNum = isNumHidden ? "" : (parsed.num || (idx + 1).toString().padStart(2, "0"));

                        return (
                          <div
                            key={idx}
                            className={`p-3 sm:p-4 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 last:border-r-0 ${
                              themeMode === "dark" ? "border-[#2e303d]" : "border-[#141414]"
                            }`}
                          >
                            <div>
                              {!isNumHidden && displayNum && (
                                <b className="font-shrikhand text-lg text-[#ff315b] block mb-1">
                                  {displayNum}
                                </b>
                              )}
                              <h4
                                className={`font-dm-sans text-[11px] sm:text-xs font-bold leading-tight mb-1 ${
                                  themeMode === "dark" ? "text-white" : "text-[#141414]"
                                }`}
                              >
                                {parsed.title || `Framework ${(idx + 1).toString().padStart(2, "0")}`}
                              </h4>
                              <p
                                className={`font-dm-sans text-[9px] sm:text-[10px] leading-tight ${
                                  themeMode === "dark" ? "text-zinc-400" : "text-[#141414]/80"
                                }`}
                              >
                                {parsed.desc}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Signup Right */}
                  <div
                    className={`md:col-span-5 p-4 sm:p-5 flex flex-col justify-between text-white`}
                    style={{
                      backgroundColor: accentColor,
                    }}
                  >
                    <div>
                      <h4 className="font-shrikhand text-xl text-white mb-0.5">
                        {latestPage?.formTitle || "Want the zine?"}
                      </h4>
                      <p className="font-dm-sans text-[10px] text-white/80 mb-3">
                        {latestPage?.formSubtitle || "We'll send it now. Occasional notes later."}
                      </p>

                      <div className="space-y-1.5">
                        <input
                          type="text"
                          readOnly
                          placeholder="YOUR NAME"
                          className="block w-full border-2 border-[#141414] p-2 text-[10px] font-dm-sans font-bold bg-white text-[#141414] outline-none"
                        />
                        <input
                          type="email"
                          readOnly
                          placeholder="EMAIL@ADDRESS.COM"
                          className="block w-full border-2 border-[#141414] p-2 text-[10px] font-dm-sans font-bold bg-white text-[#141414] outline-none"
                        />

                        <div className="pt-1">
                          <button
                            type="button"
                            className="w-full border-2 border-[#141414] bg-[#f5ed21] text-[#141414] p-2 font-dm-sans font-black text-xs uppercase shadow-[3px_3px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                          >
                            {latestPage?.formButtonText || "YES, SEND IT! ↗"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
});

export default BrandTemplatePreview;

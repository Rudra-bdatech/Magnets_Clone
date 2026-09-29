import React from "react";
import {
  Check,
  Loader2,
  ImageIcon,
  Sparkles,
  Trash2,
  Plus,
  X,
  ArrowUpRight,
  UploadCloud,
} from "lucide-react";
import { type TemplateProps } from "./types";
import { ImageGeneration } from "@/components/agents/image-generation";

export default function Template7(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets,
    bulletsTitle,
    mastheadLeft,
    setMastheadLeft,
    mastheadRight,
    setMastheadRight,
    formTitle,
    formSubtitle,
    formButtonText,
    imageUrl,
    deliverable,
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
    mode = "editor",
    isSubmitting = false,
    publicFormValues = {},
    setPublicFormValues,
    onSubmitPublicForm,
    errorMsg,
    successMsg,
  } = props as any;

  const rawProps = props as any;
  const isEditor = props.mode ? props.mode === "editor" : rawProps.isEditor !== false;

  const brandColor = account?.brandColor || props.brandColor || "#f4ff3c";
  const accentColor = brandColor;
  const themeMode = account?.themeMode || props.themeMode || "light";
  const isDark = themeMode === "dark";
  const businessName = account?.brandName || account?.name || "OUTPUT/INDEX";

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

  // Default bullet items matching the Brutalist Ledger reference
  const defaultBullets = [
    "THE FRICTION AUDIT — Find where good ideas go to die.",
    "DECISION VELOCITY — Stop waiting for perfect information.",
    "THE WEEKLY RESET — A 20-minute operating ritual.",
  ];

  const currentBullets: string[] =
    Array.isArray(bullets) ? bullets : defaultBullets;

  const parseBullet = (item: string) => {
    if (!item) return { title: "", desc: "" };
    if (item.includes(" — ")) {
      const [title, ...rest] = item.split(" — ");
      return { title: title.trim(), desc: rest.join(" — ").trim() };
    }
    if (item.includes(" - ")) {
      const [title, ...rest] = item.split(" - ");
      return { title: title.trim(), desc: rest.join(" - ").trim() };
    }
    if (item.includes(":::")) {
      const [title, ...rest] = item.split(":::");
      return { title: title.trim(), desc: rest.join(":::").trim() };
    }
    if (item.includes("\n")) {
      const [title, ...rest] = item.split("\n");
      return { title: title.trim(), desc: rest.join("\n").trim() };
    }
    return { title: item, desc: "" };
  };

  const handleBulletTitleChange = (index: number, newTitle: string) => {
    if (!setBullets) return;
    const next = [...currentBullets];
    const parsed = parseBullet(next[index] || "");
    next[index] = parsed.desc ? `${newTitle} — ${parsed.desc}` : newTitle;
    setBullets(next);
  };

  const handleBulletDescChange = (index: number, newDesc: string) => {
    if (!setBullets) return;
    const next = [...currentBullets];
    const parsed = parseBullet(next[index] || "");
    next[index] = `${parsed.title || "CHAPTER " + (index + 1)} — ${newDesc}`;
    setBullets(next);
  };

  const handleAddBullet = () => {
    if (!setBullets) return;
    const num = (currentBullets.length + 1).toString().padStart(2, "0");
    setBullets([...currentBullets, `SECTION ${num} — Key operational framework insight.`]);
  };

  const handleRemoveBullet = (index: number) => {
    if (!setBullets) return;
    const next = currentBullets.filter((_, i) => i !== index);
    setBullets(next);
  };

  const handleFieldChange = (key: string, val: string) => {
    if (setPublicFormValues) {
      setPublicFormValues((prev: Record<string, string>) => ({
        ...prev,
        [key]: val,
      }));
    }
  };

  return (
    <div
      className={`template7-root w-full min-h-full flex flex-col justify-between transition-colors duration-200 selection:bg-black selection:text-white ${
        isDark ? "bg-[#0d0d0f]" : "bg-[#f4ff3c] text-[#101010]"
      }`}
      style={{
        fontFamily: "'IBM Plex Mono', monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
        borderColor: isDark ? "#2a2a2e" : "#101010",
        color: isDark ? accentColor : "#101010",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .font-archivo {
              font-family: 'Archivo Black', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .font-ibm {
              font-family: 'IBM Plex Mono', monospace;
            }
            @keyframes brutalistMarquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-brutalist-ticker {
              display: inline-flex;
              white-space: nowrap;
              animation: brutalistMarquee 25s linear infinite;
            }
            .animate-brutalist-ticker:hover {
              animation-play-state: paused;
            }
          `,
        }}
      />

      <div className="w-full flex-1 flex flex-col">
        {/* 1. TOP MASTHEAD BAR */}
        <header
          className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 px-5 py-4 sm:px-7 sm:py-5 border-b-4 items-center transition-colors ${
            isDark ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-[#f4ff3c]"
          }`}
        >
          {/* Logo / Left Brand */}
          <div className="flex items-center gap-3">
            {account?.logo && (
              <img
                src={account.logo}
                alt="Logo"
                className="h-8 w-8 object-cover border-2 border-current shrink-0"
              />
            )}
            {isEditor ? (
              <input
                type="text"
                value={mastheadLeft || ""}
                onChange={(e) => setMastheadLeft?.(e.target.value)}
                placeholder={businessName || "OUTPUT/INDEX"}
                className={`font-archivo text-xl sm:text-2xl tracking-tight uppercase bg-transparent outline-none w-full max-w-md placeholder:opacity-40 ${
                  isDark ? "text-white" : "text-[#101010]"
                }`}
              />
            ) : (
              <div
                className={`font-archivo text-xl sm:text-2xl tracking-tight uppercase ${
                  isDark ? "text-white" : "text-[#101010]"
                }`}
              >
                {mastheadLeft || businessName || "OUTPUT/INDEX"}
              </div>
            )}
          </div>

          {/* Issue / Right Tag */}
          <div className="sm:text-right">
            {isEditor ? (
              <input
                type="text"
                value={mastheadRight || ""}
                onChange={(e) => setMastheadRight?.(e.target.value)}
                placeholder="FIELD MANUAL 009 · FREE PDF"
                className={`font-ibm text-xs sm:text-[11px] font-semibold tracking-wider uppercase bg-transparent outline-none w-full sm:text-right placeholder:opacity-40 ${
                  isDark ? "text-[#a1a1aa]" : "text-[#101010]"
                }`}
              />
            ) : (
              <div
                className={`font-ibm text-xs sm:text-[11px] font-semibold tracking-wider uppercase ${
                  isDark ? "text-[#a1a1aa]" : "text-[#101010]"
                }`}
              >
                {mastheadRight || "FIELD MANUAL 009 · FREE PDF · 48 PAGES"}
              </div>
            )}
          </div>
        </header>

        {/* 2. HERO SECTION: COPY & IMAGE */}
        <section
          className={`grid grid-cols-1 lg:grid-cols-[52%_48%] border-b-4 transition-colors ${
            isDark ? "border-[#2a2a2e]" : "border-[#101010]"
          }`}
        >
          {/* Left Column: Copy */}
          <div
            className={`p-6 sm:p-10 lg:p-11 border-b-4 lg:border-b-0 lg:border-r-4 flex flex-col justify-between transition-colors ${
              isDark ? "border-[#2a2a2e] bg-[#0d0d0f]" : "border-[#101010] bg-[#f4ff3c]"
            }`}
          >
            <div>
              {/* Eyebrow badge */}
              <div className="mb-6">
                {isEditor ? (
                  <input
                    type="text"
                    value={bulletsTitle || ""}
                    onChange={(e) => setBulletsTitle?.(e.target.value)}
                    placeholder="SYSTEMS FOR CREATIVE OPERATORS"
                    style={
                      isDark
                        ? { backgroundColor: accentColor, color: contrastOnAccent, borderColor: accentColor }
                        : { backgroundColor: "#101010", color: accentColor, borderColor: "#101010" }
                    }
                    className="font-ibm inline-block px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-2 outline-none"
                  />
                ) : (
                  <span
                    style={
                      isDark
                        ? { backgroundColor: accentColor, color: contrastOnAccent, borderColor: accentColor }
                        : { backgroundColor: "#101010", color: accentColor, borderColor: "#101010" }
                    }
                    className="font-ibm inline-block px-3 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-2"
                  >
                    {bulletsTitle || "SYSTEMS FOR CREATIVE OPERATORS"}
                  </span>
                )}
              </div>

              {/* Headline */}
              {isEditor ? (
                <textarea
                  ref={headlineRef}
                  value={headline || ""}
                  onChange={(e) => setHeadline?.(e.target.value)}
                  placeholder="Make Better Work. Faster."
                  rows={2}
                  className={`font-archivo w-full text-4xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[88px] leading-[0.88] tracking-tight uppercase bg-transparent outline-none resize-none overflow-wrap-anywhere mb-6 placeholder:opacity-30 ${
                    isDark ? "text-white" : "text-[#101010]"
                  }`}
                  style={{ overflowWrap: "anywhere" }}
                />
              ) : (
                <h1
                  className={`font-archivo text-4xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[88px] leading-[0.88] tracking-tight uppercase mb-6 ${
                    isDark ? "text-white" : "text-[#101010]"
                  }`}
                  style={{ overflowWrap: "anywhere" }}
                >
                  {headline || "Make Better Work. Faster."}
                </h1>
              )}

              {/* Paragraph / Pitch */}
              {isEditor ? (
                <textarea
                  ref={subheadlineRef}
                  value={subheadline || pitch || ""}
                  onChange={(e) => {
                    setSubheadline?.(e.target.value);
                    setPitch?.(e.target.value);
                  }}
                  placeholder="Thirty-seven operating principles for teams that refuse to choose between quality and momentum."
                  rows={3}
                  className={`font-ibm w-full text-sm sm:text-base leading-relaxed bg-transparent outline-none resize-none max-w-[570px] placeholder:opacity-40 ${
                    isDark ? "text-zinc-300" : "text-[#101010]"
                  }`}
                />
              ) : (
                <p
                  className={`font-ibm text-sm sm:text-base leading-relaxed max-w-[570px] ${
                    isDark ? "text-zinc-300" : "text-[#101010]"
                  }`}
                >
                  {subheadline ||
                    pitch ||
                    "Thirty-seven operating principles for teams that refuse to choose between quality and momentum."}
                </p>
              )}
            </div>

            {/* Subtle Industrial Footer Tag */}
            <div
              className={`pt-8 mt-8 border-t-2 text-[10px] font-ibm font-semibold uppercase tracking-widest ${
                isDark ? "border-zinc-800 text-zinc-500" : "border-black/20 text-black/60"
              }`}
            >
              LEDGER REF: LM-{new Date().getFullYear()}-007 · VERIFIED OUTPUT
            </div>
          </div>

          {/* Right Column: Hero Image with Brutalist Stamp */}
          <div
            className={`relative min-h-[380px] sm:min-h-[480px] lg:min-h-[560px] flex items-center justify-center overflow-hidden group ${
              isDark ? "bg-[#151518]" : "bg-[#e5ef35]"
            }`}
          >
            {/* Scoped In-Holder Upload Progress Overlay */}
            {uploadProgress !== null && uploadProgress !== undefined && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6 text-center text-white">
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center border-2 bg-[#101010]"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  {uploadProgress === 100 ? (
                    <Check className="h-6 w-6" style={{ color: accentColor }} />
                  ) : (
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: accentColor }} />
                  )}
                </div>
                <p
                  className="text-xs sm:text-sm font-bold font-archivo tracking-wider uppercase"
                  style={{ color: accentColor }}
                >
                  {uploadProgress === 100 ? "IMAGE PROCESSED 100%" : "UPLOADING LEDGER COVER..."}
                </p>
                <div className="mt-3 w-full max-w-[220px] border border-white bg-black p-0.5">
                  <div
                    className="h-2.5 transition-all duration-150"
                    style={{ width: `${uploadProgress}%`, backgroundColor: accentColor }}
                  />
                </div>
                <span className="mt-1.5 font-ibm text-[10px] text-zinc-300 font-bold tracking-widest">
                  {uploadProgress}% COMPLETE
                </span>
              </div>
            )}
            {/* AI Generation state */}
            {isGeneratingAICover ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <ImageGeneration
                  status="generating"
                  prompt={headline || "Brutalist Ledger Field Manual"}
                  resolution="1200 × 900"
                  label="AI generating brutalist industrial showcase cover"
                  aspectRatio="4 / 3"
                  className="w-full h-full min-h-[340px]"
                />
              </div>
            ) : imageUrl && imageUrl.trim() !== "" ? (
              <img
                src={imageUrl}
                alt={headline || "Cover Image"}
                className="w-full h-full object-cover"
              />
            ) : (
              /* High-contrast Neo-Brutalist Graphic Canvas Fallback */
              <div className="w-full h-full relative flex flex-col justify-between p-8 min-h-[380px] sm:min-h-[480px]">
                {/* Background Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: isDark
                      ? `linear-gradient(${accentColor} 1.5px, transparent 1.5px), linear-gradient(90deg, ${accentColor} 1.5px, transparent 1.5px)`
                      : "linear-gradient(#101010 1.5px, transparent 1.5px), linear-gradient(90deg, #101010 1.5px, transparent 1.5px)",
                    backgroundSize: "32px 32px",
                  }}
                />

                <div className="relative z-10 flex justify-between items-start">
                  <span
                    className="font-ibm text-xs font-bold border-2 px-2.5 py-1 uppercase"
                    style={
                      isDark
                        ? { backgroundColor: "black", color: accentColor, borderColor: accentColor }
                        : { backgroundColor: "black", color: "white", borderColor: "black" }
                    }
                  >
                    FIG. 07 / SCHEMATIC
                  </span>
                  <span
                    className={`font-archivo text-xs px-2 py-1 uppercase ${
                      isDark ? "text-zinc-400" : "text-black"
                    }`}
                  >
                    INDEX // {new Date().getFullYear()}
                  </span>
                </div>

                <div className="relative z-10 my-auto text-center py-8">
                  <div
                    className="inline-block font-archivo text-5xl sm:text-7xl lg:text-8xl tracking-tighter uppercase p-4 border-4"
                    style={
                      isDark
                        ? {
                            borderColor: accentColor,
                            color: accentColor,
                            backgroundColor: "rgba(0,0,0,0.7)",
                            boxShadow: `6px 6px 0px ${accentColor}`,
                          }
                        : {
                            borderColor: "#101010",
                            color: "#101010",
                            backgroundColor: "rgba(255,255,255,0.7)",
                            boxShadow: "6px 6px 0px #101010",
                          }
                    }
                  >
                    MANUAL
                  </div>
                  <p
                    className={`font-ibm text-xs sm:text-sm font-bold uppercase tracking-widest mt-4 ${
                      isDark ? "text-zinc-300" : "text-black"
                    }`}
                  >
                    {mastheadLeft || businessName || "CORE SYSTEMS INDEX"}
                  </p>
                </div>

                <div className="relative z-10 flex justify-between items-end text-[10px] font-ibm font-bold uppercase">
                  <span>SPEC: DIRECT ARCHIVE</span>
                  <span>STATUS: READY</span>
                </div>
              </div>
            )}

            {/* Floating Brutalist Stamp Badge */}
            <div
              className="absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-20 font-ibm font-bold text-xs sm:text-sm tracking-wider uppercase border-3 px-3.5 py-2 sm:px-4 sm:py-2.5 transition-transform duration-200"
              style={
                isDark
                  ? {
                      backgroundColor: "#18181b",
                      color: accentColor,
                      borderColor: accentColor,
                      boxShadow: `4px 4px 0px ${accentColor}`,
                      transform: "rotate(-3deg)",
                    }
                  : {
                      backgroundColor: accentColor,
                      color: contrastOnAccent,
                      borderColor: "#101010",
                      boxShadow: "4px 4px 0px rgba(0,0,0,1)",
                      transform: "rotate(-3deg)",
                    }
              }
            >
              12,000+ READERS
            </div>

            {/* Editor Image Actions Overlay */}
            {isEditor && (
              <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-ibm text-xs font-bold uppercase tracking-wider bg-black text-white border-2 border-white hover:bg-white hover:text-black transition cursor-pointer shadow-[3px_3px_0px_rgba(255,255,255,0.4)]"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>{imageUrl ? "REPLACE" : "UPLOAD COVER"}</span>
                </button>

                {imageUrl && setImageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="flex items-center justify-center p-1.5 font-ibm text-xs font-bold bg-red-600 text-white border-2 border-black hover:bg-red-700 transition cursor-pointer shadow-[3px_3px_0px_#101010]"
                    title="Remove Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 3. LOWER SECTION: CHAPTERS INDEX & FORM */}
        <section
          className={`grid grid-cols-1 lg:grid-cols-2 transition-colors ${
            isDark ? "bg-[#0d0d0f]" : "bg-[#f4ff3c]"
          }`}
        >
          {/* Left Column: Chapters / Index List */}
          <div
            className={`border-b-4 lg:border-b-0 lg:border-r-4 transition-colors flex flex-col justify-between ${
              isDark ? "border-[#2a2a2e]" : "border-[#101010]"
            }`}
          >
            <div>
              {/* Index Header */}
              <div
                className="p-5 sm:p-6 border-b-2 flex items-center justify-between font-ibm text-xs font-bold tracking-wider uppercase"
                style={
                  isDark
                    ? { borderColor: "#2a2a2e", backgroundColor: "#121215", color: accentColor }
                    : { borderColor: "#101010", backgroundColor: "#eef731", color: "#101010" }
                }
              >
                <span>FIELD MANUAL TABLE OF CONTENTS</span>
                <span>{currentBullets.length} MODULES</span>
              </div>

              {/* Rows List */}
              <div className="divide-y-2" style={{ borderColor: isDark ? "#2a2a2e" : "#101010" }}>
                {currentBullets.map((item, idx) => {
                  const numStr = (idx + 1).toString().padStart(2, "0");
                  const parsed = parseBullet(item);

                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[70px_1fr] sm:grid-cols-[90px_1fr] p-5 sm:p-6 items-start gap-4 border-b-2 transition-colors relative group ${
                        isDark
                          ? "border-[#2a2a2e] hover:bg-[#15151a]"
                          : "border-[#101010] hover:bg-[#ebf533]"
                      }`}
                    >
                      {/* Number Column */}
                      <strong
                        className="font-archivo text-2xl sm:text-3xl leading-none"
                        style={{ color: isDark ? accentColor : "#101010" }}
                      >
                        {numStr}
                      </strong>

                      {/* Content Column */}
                      <div className="min-w-0 pr-6 space-y-1">
                        {isEditor ? (
                          <>
                            <input
                              type="text"
                              value={parsed.title}
                              onChange={(e) => handleBulletTitleChange(idx, e.target.value)}
                              placeholder={`CHAPTER ${numStr}`}
                              className={`font-archivo text-base sm:text-lg uppercase tracking-tight bg-transparent outline-none w-full placeholder:opacity-40 ${
                                isDark ? "text-white" : "text-[#101010]"
                              }`}
                            />
                            <textarea
                              value={parsed.desc}
                              onChange={(e) => handleBulletDescChange(idx, e.target.value)}
                              placeholder="Operational description or framework takeaways..."
                              rows={2}
                              className={`font-ibm text-xs sm:text-[13px] leading-relaxed bg-transparent outline-none w-full resize-none placeholder:opacity-40 ${
                                isDark ? "text-zinc-400" : "text-black/80"
                              }`}
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className={`font-archivo text-base sm:text-lg uppercase tracking-tight ${
                                isDark ? "text-white" : "text-[#101010]"
                              }`}
                            >
                              {parsed.title || `CHAPTER ${numStr}`}
                            </div>
                            {parsed.desc && (
                              <div
                                className={`font-ibm text-xs sm:text-[13px] leading-relaxed ${
                                  isDark ? "text-zinc-400" : "text-black/80"
                                }`}
                              >
                                {parsed.desc}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Delete Bullet in Editor */}
                      {isEditor && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(idx)}
                          className="absolute right-3 top-4 p-1.5 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {currentBullets.length === 0 && isEditor && (
                  <div className="p-8 text-center font-ibm text-xs opacity-50 uppercase tracking-wider">
                    NO CHAPTER MODULES ADDED
                  </div>
                )}
              </div>
            </div>

            {/* Add Chapter Button in Editor */}
            {isEditor && (
              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={handleAddBullet}
                  style={
                    isDark
                      ? { borderColor: `${accentColor}66`, color: accentColor }
                      : { borderColor: "rgba(0,0,0,0.4)", color: "#101010" }
                  }
                  className="w-full py-3 px-4 font-ibm text-xs font-bold uppercase tracking-wider border-2 border-dashed flex items-center justify-center gap-2 transition cursor-pointer hover:bg-black/5"
                >
                  <Plus className="h-4 w-4" />
                  <span>ADD CHAPTER ROW</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Brutalist Form Block */}
          <div
            className={`p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-colors ${
              isDark
                ? "bg-[#18181b] border-t-4 lg:border-t-0 border-[#2a2a2e]"
                : "text-[#101010]"
            }`}
            style={
              !isDark
                ? { backgroundColor: accentColor !== "#f4ff3c" ? accentColor : "#ff5a36", color: contrastOnAccent }
                : undefined
            }
          >
            <div>
              {/* Form Title */}
              {isEditor ? (
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  placeholder="Take the manual."
                  style={{ color: isDark ? accentColor : contrastOnAccent }}
                  className="font-archivo text-3xl sm:text-4xl lg:text-[44px] leading-[0.95] uppercase tracking-tight bg-transparent outline-none w-full mb-3 placeholder:opacity-40"
                />
              ) : (
                <h2
                  className="font-archivo text-3xl sm:text-4xl lg:text-[44px] leading-[0.95] uppercase tracking-tight mb-3"
                  style={{ color: isDark ? accentColor : contrastOnAccent }}
                >
                  {formTitle || "Take the manual."}
                </h2>
              )}

              {/* Form Subtitle */}
              {isEditor ? (
                <textarea
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  placeholder="Instant PDF delivery directly to your work inbox."
                  rows={2}
                  className={`font-ibm text-xs sm:text-sm leading-relaxed bg-transparent outline-none w-full resize-none mb-6 placeholder:opacity-40 ${
                    isDark ? "text-zinc-300" : (contrastOnAccent === "#ffffff" ? "text-white/90" : "text-[#101010]/90")
                  }`}
                />
              ) : (
                formSubtitle && (
                  <p
                    className={`font-ibm text-xs sm:text-sm leading-relaxed mb-6 ${
                      isDark ? "text-zinc-300" : (contrastOnAccent === "#ffffff" ? "text-white/90" : "text-[#101010]/90")
                    }`}
                  >
                    {formSubtitle}
                  </p>
                )
              )}

              {/* Form Fields Stack */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onSubmitPublicForm) {
                    onSubmitPublicForm(e);
                  }
                }}
                className="space-y-0 border-b-2"
                style={{ borderColor: isDark ? "#2a2a2e" : "#101010" }}
              >
                {/* Field 1: Name */}
                <div
                  className={`grid grid-cols-[100px_1fr] sm:grid-cols-[115px_1fr] border-t-2 items-stretch ${
                    isDark ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-transparent"
                  }`}
                >
                  <label
                    className="p-3.5 sm:p-4 font-ibm text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-r-2 flex items-center shrink-0"
                    style={{
                      borderColor: isDark ? "#2a2a2e" : "#101010",
                      color: isDark ? accentColor : contrastOnAccent,
                    }}
                  >
                    NAME
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditor}
                    value={publicFormValues?.name || ""}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="TYPE HERE"
                    className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium ${
                      isDark
                        ? "text-white placeholder:text-zinc-600"
                        : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                    }`}
                  />
                </div>

                {/* Field 2: Email */}
                <div
                  className={`grid grid-cols-[100px_1fr] sm:grid-cols-[115px_1fr] border-t-2 items-stretch ${
                    isDark ? "border-[#2a2a2e] bg-[#121215]" : "border-[#101010] bg-transparent"
                  }`}
                >
                  <label
                    className="p-3.5 sm:p-4 font-ibm text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-r-2 flex items-center shrink-0"
                    style={{
                      borderColor: isDark ? "#2a2a2e" : "#101010",
                      color: isDark ? accentColor : contrastOnAccent,
                    }}
                  >
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isEditor}
                    value={publicFormValues?.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="YOU@WORK.COM"
                    className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium ${
                      isDark
                        ? "text-white placeholder:text-zinc-600"
                        : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                    }`}
                  />
                </div>

                {/* Custom Form Fields if any */}
                {customFormFields &&
                  customFormFields.map((cf: any, i: number) => {
                    const fieldKey = cf.name || `field_${i}`;
                    return (
                      <div
                        key={i}
                        className={`grid grid-cols-[100px_1fr] sm:grid-cols-[115px_1fr] border-t-2 items-stretch ${
                          isDark
                            ? "border-[#2a2a2e] bg-[#121215]"
                            : "border-[#101010] bg-transparent"
                        }`}
                      >
                        <label
                          className="p-3.5 sm:p-4 font-ibm text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-r-2 flex items-center shrink-0"
                          style={{
                            borderColor: isDark ? "#2a2a2e" : "#101010",
                            color: isDark ? accentColor : contrastOnAccent,
                          }}
                        >
                          {cf.label || cf.name || "FIELD"}
                          {cf.required ? " *" : ""}
                        </label>
                        <input
                          type={cf.type || "text"}
                          required={cf.required}
                          disabled={isEditor}
                          value={publicFormValues?.[fieldKey] || ""}
                          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                          placeholder={cf.placeholder || "TYPE HERE"}
                          className={`font-ibm text-xs sm:text-sm p-3.5 sm:p-4 bg-transparent outline-none min-w-0 font-medium ${
                            isDark
                              ? "text-white placeholder:text-zinc-600"
                              : (contrastOnAccent === "#ffffff" ? "text-white placeholder:text-white/60" : "text-[#101010] placeholder:text-[#101010]/60")
                          }`}
                        />
                      </div>
                    );
                  })}

                {/* Error / Success Messages */}
                {errorMsg && (
                  <div className="p-3 bg-red-600 text-white font-ibm text-xs font-bold uppercase mt-3">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-emerald-600 text-white font-ibm text-xs font-bold uppercase mt-3">
                    {successMsg}
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-6">
                  {isEditor ? (
                    <div className="space-y-2">
                      <div
                        className="w-full p-4 sm:p-5 font-archivo text-sm sm:text-base tracking-wider uppercase border-3 text-center transition"
                        style={
                          isDark
                            ? {
                                backgroundColor: accentColor,
                                color: contrastOnAccent,
                                borderColor: accentColor,
                                boxShadow: `4px 4px 0px ${accentColor}`,
                              }
                            : {
                                backgroundColor: "#101010",
                                color: "#ffffff",
                                borderColor: "#101010",
                                boxShadow: "4px 4px 0px rgba(0,0,0,1)",
                              }
                        }
                      >
                        {formButtonText || "Send me the PDF ↗"}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-ibm font-bold uppercase opacity-70">
                          BUTTON TEXT:
                        </label>
                        <input
                          type="text"
                          value={formButtonText || ""}
                          onChange={(e) => setFormButtonText?.(e.target.value)}
                          placeholder="Send me the PDF ↗"
                          className="font-ibm text-xs bg-transparent border-b border-current outline-none flex-1 pb-0.5"
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full p-4 sm:p-5 font-archivo text-sm sm:text-base tracking-wider uppercase border-3 text-center transition duration-150 cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px]"
                      style={
                        isDark
                          ? {
                              backgroundColor: accentColor,
                              color: contrastOnAccent,
                              borderColor: accentColor,
                              boxShadow: `5px 5px 0px ${accentColor}`,
                            }
                          : {
                              backgroundColor: "#101010",
                              color: "#ffffff",
                              borderColor: "#101010",
                              boxShadow: "5px 5px 0px rgba(0,0,0,1)",
                            }
                      }
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>TRANSMITTING LEDGER...</span>
                        </span>
                      ) : (
                        <span>{formButtonText || "Send me the PDF ↗"}</span>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Privacy / Security Brutalist Note */}
            <div
              className={`pt-6 mt-6 border-t-2 text-[9px] sm:text-[10px] font-ibm font-bold uppercase tracking-wider flex justify-between items-center ${
                isDark ? "border-zinc-800 text-zinc-500" : (contrastOnAccent === "#ffffff" ? "border-white/20 text-white/80" : "border-black/20 text-black/70")
              }`}
            >
              <span>🔒 ZERO SPAM PROMISE</span>
              <span>INSTANT DISPATCH</span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. BOTTOM TICKER MARQUEE */}
      <footer
        className={`w-full py-3 px-4 border-t-4 overflow-hidden font-ibm text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-colors ${
          isDark ? "border-[#2a2a2e] bg-[#000000]" : "border-[#101010] bg-[#101010]"
        }`}
        style={{ color: accentColor }}
      >
        <div className="overflow-hidden whitespace-nowrap">
          <div className="animate-brutalist-ticker">
            <span className="mr-4">
              NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
              NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
            </span>
            <span className="mr-4">
              NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
              NO FLUFF / NO HACKS / FIELD-TESTED FRAMEWORKS / INSTANT DIGITAL DELIVERY / ZERO GIMMICKS /
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

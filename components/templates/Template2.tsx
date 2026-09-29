import React, { useState } from "react";
import {
  Check,
  Loader2,
  ImageIcon,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  Bookmark,
  Radio,
  Newspaper,
  Compass,
  TrendingUp,
} from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template2(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets = [],
    bulletsTitle,
    formTitle,
    formSubtitle,
    formButtonText,
    imageUrl,
    customFormFields = [],
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
    setFormButtonText,
    isSubmitting = false,
    publicFormValues = {},
    setPublicFormValues,
    onSubmitPublicForm,
  } = props as any;

  const rawProps = props as any;
  const isEditor = props.mode ? props.mode === "editor" : (rawProps.isEditor !== false);

  const brandColor = account?.brandColor || "#ef3d25";
  const themeMode = account?.themeMode || "light";
  const isDark = themeMode === "dark";

  // Editable local states for rich editorial elements with smart defaults
  const [issueNumber, setIssueNumber] = useState("Issue No. 04");
  const [issueTitle, setIssueTitle] = useState("The Attention & Growth Issue");
  const [brandTagline, setBrandTagline] = useState("A Contemporary Editorial Field Guide");
  const [editionType, setEditionType] = useState("Special Edition");
  const [editionSub, setEditionSub] = useState("Published for Visionary Leaders");
  const [tickerBadge, setTickerBadge] = useState("Dispatch");
  const [tickerText, setTickerText] = useState("+++ ESSENTIAL FRAMEWORKS +++ CUT THROUGH THE ALGORITHM NOISE +++ MEASURED FOR HIGH-LEVERAGE TEAMS +++ DOWNLOAD YOUR COPY TODAY +++");
  const [heroTag, setHeroTag] = useState("Lead Essay");
  const [heroReadTime, setHeroReadTime] = useState("12 Min Read • Actionable Blueprint");
  const [heroByline, setHeroByline] = useState(`By ${account?.brandName || account?.name || "Editorial Board"}`);
  const [heroFramework, setHeroFramework] = useState("Verified Framework");
  
  // Executive Abstract & Section Titles (Editable!)
  const [abstractTitle, setAbstractTitle] = useState("Executive Abstract");
  const [abstractSection, setAbstractSection] = useState("Section I");
  const [takeawaysSubtitle, setTakeawaysSubtitle] = useState("Key Takeaways");
  
  // Stat Badges (Editable!)
  const [stat1Value, setStat1Value] = useState("100%");
  const [stat1Label, setStat1Label] = useState("Free Access");
  const [stat2Value, setStat2Value] = useState("Instant");
  const [stat2Label, setStat2Label] = useState("Delivery");
  const [stat3Value, setStat3Value] = useState("Zero");
  const [stat3Label, setStat3Label] = useState("Spam Policy");

  // Requisition Slip Form Badges (Editable!)
  const [formBadge, setFormBadge] = useState("Dispatch Requisition");
  const [formNumber, setFormNumber] = useState("Form 04-A");
  const [formFooterNote, setFormFooterNote] = useState("🔒 Instant delivery to inbox. Unsubscribe in 1-click.");

  // Fallback default bullets if empty
  const defaultBullets = [
    "The 3-second attention hook that stops executive doom-scrolling",
    "How to re-frame high-friction value propositions into urgent necessities",
    "Field-tested distribution strategies for high-leverage growth",
  ];
  const displayBullets = bullets && bullets.length > 0 ? bullets : (isEditor ? [] : defaultBullets);

  const defaultHeroImage =
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";
  const coverImage = imageUrl && imageUrl.trim() !== "" ? imageUrl : defaultHeroImage;

  return (
    <div
      className={`w-full min-h-screen flex flex-col transition-colors duration-200 font-sans ${
        isDark
          ? "bg-[#141416] text-[#eae8e3]"
          : "bg-[#f3f0e8] text-[#151515]"
      }`}
      style={
        {
          "--paper": isDark ? "#141416" : "#f3f0e8",
          "--ink": isDark ? "#eae8e3" : "#151515",
          "--accent": brandColor,
          "--line": isDark ? "rgba(255,255,255,0.15)" : "rgba(21,21,21,0.22)",
        } as React.CSSProperties
      }
    >
      {/* Upload Progress Overlay */}
      {uploadProgress !== null && uploadProgress !== undefined && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-white">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-red-400">
                {uploadProgress === 100 ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {uploadProgress === 100 ? "Image uploaded!" : "Uploading media..."}
              </span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${uploadProgress}%`, backgroundColor: brandColor }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 text-center">Optimizing editorial assets...</p>
          </div>
        </div>
      )}

      {/* Inline styles for smooth ticker marquee */}
      <style>{`
        @keyframes editorialTicker {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .editorial-ticker-content {
          display: inline-flex;
          white-space: nowrap;
          animation: editorialTicker 28s linear infinite;
        }
        .editorial-ticker-content:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. EDITORIAL MASTHEAD */}
      <header
        className={`px-4 sm:px-8 py-5 border-b grid grid-cols-1 md:grid-cols-3 items-end gap-4 ${
          isDark ? "border-white/15" : "border-[#151515]"
        }`}
      >
        <div className="text-left font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-80">
          {isEditor ? (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                <Newspaper className="w-3 h-3" />
                <input
                  type="text"
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                  className="bg-transparent outline-none font-bold uppercase tracking-widest text-[10px] sm:text-xs w-28"
                  placeholder="Issue No. 04"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="bg-transparent outline-none text-[11px] font-semibold tracking-wider opacity-70 w-full"
                  placeholder="The Attention & Growth Issue"
                />
              </div>
            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 mb-1">
                <Newspaper className="w-3 h-3" />
                {issueNumber}
              </span>
              <div className="text-[11px] font-semibold tracking-wider opacity-70">
                {issueTitle}
              </div>
            </>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase font-serif leading-none">
            Signal <span className="font-serif italic font-normal text-red-500" style={{ color: brandColor }}>/</span> Noise
          </h2>
          {isEditor ? (
            <input
              type="text"
              value={brandTagline}
              onChange={(e) => setBrandTagline(e.target.value)}
              className="text-[10px] tracking-widest uppercase font-mono mt-1 opacity-60 bg-transparent outline-none text-center w-full"
              placeholder="A Contemporary Editorial Field Guide"
            />
          ) : (
            <div className="text-[10px] tracking-widest uppercase font-mono mt-1 opacity-60">
              {brandTagline}
            </div>
          )}
        </div>

        <div className="text-left md:text-right font-mono text-[10px] sm:text-xs uppercase tracking-widest opacity-80">
          {isEditor ? (
            <div className="space-y-1">
              <div className="font-bold flex md:justify-end items-center gap-1.5">
                <Compass className="w-3 h-3 text-red-500 shrink-0" style={{ color: brandColor }} />
                <input
                  type="text"
                  value={editionType}
                  onChange={(e) => setEditionType(e.target.value)}
                  className="bg-transparent outline-none font-bold text-left md:text-right w-28 uppercase"
                  placeholder="Special Edition"
                />
              </div>
              <input
                type="text"
                value={editionSub}
                onChange={(e) => setEditionSub(e.target.value)}
                className="block text-[10px] font-normal opacity-70 text-left md:text-right bg-transparent outline-none w-full"
                placeholder="Published for Visionary Leaders"
              />
            </div>
          ) : (
            <>
              <div className="font-bold flex md:justify-end items-center gap-1.5">
                <Compass className="w-3 h-3 text-red-500" style={{ color: brandColor }} />
                {editionType}
              </div>
              <span className="block text-[10px] font-normal opacity-70 mt-0.5">
                {editionSub}
              </span>
            </>
          )}
        </div>
      </header>

      {/* 2. TICKER BAR */}
      <div
        className={`flex items-center overflow-hidden h-8 text-[11px] font-mono uppercase tracking-wider select-none ${
          isDark ? "bg-black text-[#eae8e3]" : "bg-[#151515] text-[#f3f0e8]"
        }`}
      >
        <div
          className="flex items-center gap-1.5 px-3 sm:px-4 h-full shrink-0 font-black text-white z-10 shadow-md"
          style={{ backgroundColor: brandColor }}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" />
          {isEditor ? (
            <input
              type="text"
              value={tickerBadge}
              onChange={(e) => setTickerBadge(e.target.value)}
              className="bg-transparent outline-none font-black text-white text-[11px] uppercase w-20"
              placeholder="Dispatch"
            />
          ) : (
            <span>{tickerBadge}</span>
          )}
        </div>
        <div className="overflow-hidden flex-1 relative flex items-center">
          {isEditor ? (
            <input
              type="text"
              value={tickerText}
              onChange={(e) => setTickerText(e.target.value)}
              className="w-full bg-transparent outline-none text-[10px] sm:text-[11px] font-semibold opacity-90 px-3 truncate"
              placeholder="+++ ESSENTIAL FRAMEWORKS +++ DOWNLOAD YOUR COPY TODAY +++"
            />
          ) : (
            <div className="editorial-ticker-content text-[10px] sm:text-[11px] font-semibold opacity-90">
              <span className="px-4">{tickerText}</span>
              <span className="px-4">{tickerText}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. HERO FEATURE STORY & EDITORIAL CONTENT */}
      <div className="w-full max-w-7xl mx-auto flex-1 px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 space-y-8">
        <div
          className="relative min-h-[360px] sm:min-h-[440px] md:min-h-[480px] rounded-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-8 md:p-10 border shadow-lg group"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(12,12,12,0.92) 0%, rgba(12,12,12,0.65) 55%, rgba(12,12,12,0.25) 100%), url(${coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(21,21,21,0.3)",
          }}
        >
          {/* Top Hero Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isEditor ? (
                <>
                  <input
                    type="text"
                    value={heroTag}
                    onChange={(e) => setHeroTag(e.target.value)}
                    className="px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase text-white font-mono shadow-sm outline-none w-24"
                    style={{ backgroundColor: brandColor }}
                    placeholder="Lead Essay"
                  />
                  <input
                    type="text"
                    value={heroReadTime}
                    onChange={(e) => setHeroReadTime(e.target.value)}
                    className="px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase text-white/90 bg-black/60 backdrop-blur-sm border border-white/20 font-mono outline-none w-56"
                    placeholder="12 Min Read • Actionable Blueprint"
                  />
                </>
              ) : (
                <>
                  <span
                    className="px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase text-white font-mono shadow-sm"
                    style={{ backgroundColor: brandColor }}
                  >
                    {heroTag}
                  </span>
                  <span className="px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase text-white/90 bg-black/60 backdrop-blur-sm border border-white/20 font-mono">
                    {heroReadTime}
                  </span>
                </>
              )}
            </div>

            {/* Editor Image Actions */}
            {isEditor && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-black/80 hover:bg-black px-3 py-1.5 text-xs font-bold text-white shadow-md border border-white/30 backdrop-blur-md transition cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
                  <span>{imageUrl ? "Change Cover" : "Add Cover"}</span>
                </button>

                {handleGenerateAICoverImage && (
                  <button
                    type="button"
                    disabled={isGeneratingAICover}
                    onClick={handleGenerateAICoverImage}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md border border-indigo-400/40 backdrop-blur-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAICover ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                    )}
                    <span>AI Art</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Hero Core Content */}
          <div className="relative z-10 max-w-2xl space-y-3 text-white mt-auto pt-8">
            {isEditor ? (
              <>
                <textarea
                  ref={headlineRef}
                  rows={2}
                  value={headline || ""}
                  onChange={(e) => {
                    setHeadline?.(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-serif text-white bg-transparent outline-none resize-none leading-[1.05] drop-shadow-md placeholder:text-white/50 border-b border-white/20 focus:border-white transition pb-1"
                  placeholder="The Attention Paradox: How to Make High-Value Ideas Impossible to Ignore"
                />

                <textarea
                  ref={subheadlineRef}
                  rows={2}
                  value={subheadline || ""}
                  onChange={(e) => {
                    setSubheadline?.(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full text-sm sm:text-base md:text-lg text-white/90 bg-transparent outline-none resize-none leading-snug font-sans placeholder:text-white/40 border-b border-white/10 focus:border-white/50 transition pb-1"
                  placeholder="A definitive breakdown of pattern interruption, narrative pacing, and asymmetric growth."
                />
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-serif text-white leading-[1.05] drop-shadow-md tracking-tight">
                  {headline || "The Attention Paradox: How to Make High-Value Ideas Impossible to Ignore"}
                </h1>
                {subheadline && (
                  <p className="text-sm sm:text-base md:text-lg text-white/90 leading-snug font-sans drop-shadow">
                    {subheadline}
                  </p>
                )}
              </>
            )}

            {/* Byline */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/20 text-xs font-mono text-white/80">
              {isEditor ? (
                <>
                  <input
                    type="text"
                    value={heroByline}
                    onChange={(e) => setHeroByline(e.target.value)}
                    className="font-bold text-white uppercase tracking-wider bg-transparent outline-none w-48 border-b border-white/20"
                    placeholder="By Editorial Board"
                  />
                  <span>•</span>
                  <input
                    type="text"
                    value={heroFramework}
                    onChange={(e) => setHeroFramework(e.target.value)}
                    className="text-white/80 bg-transparent outline-none w-40 border-b border-white/20"
                    placeholder="Verified Framework"
                  />
                </>
              ) : (
                <>
                  <span className="font-bold text-white uppercase tracking-wider">
                    {heroByline}
                  </span>
                  <span>•</span>
                  <span>{heroFramework}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 4. MAIN EDITORIAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: Executive Abstract + Key Takeaways + Stat Cards */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pitch / Executive Abstract Section (100% EDITABLE!) */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${
                isDark ? "bg-[#18181c] border-white/10" : "bg-white border-[#151515]/20 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2.5 font-mono text-xs uppercase tracking-widest opacity-70">
                <span className="font-bold flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-red-500 shrink-0" style={{ color: brandColor }} />
                  {isEditor ? (
                    <input
                      type="text"
                      value={abstractTitle}
                      onChange={(e) => setAbstractTitle(e.target.value)}
                      placeholder="EXECUTIVE ABSTRACT"
                      className="bg-transparent outline-none font-bold uppercase tracking-widest font-mono text-xs w-48 border-b border-dashed border-black/20 dark:border-white/20 pb-0.5"
                    />
                  ) : (
                    <span>{abstractTitle}</span>
                  )}
                </span>
                
                {isEditor ? (
                  <input
                    type="text"
                    value={abstractSection}
                    onChange={(e) => setAbstractSection(e.target.value)}
                    placeholder="SECTION I"
                    className="bg-transparent outline-none font-mono text-xs text-right w-24 border-b border-dashed border-black/20 dark:border-white/20 pb-0.5"
                  />
                ) : (
                  <span>{abstractSection}</span>
                )}
              </div>

              {isEditor ? (
                <textarea
                  ref={pitchRef}
                  rows={4}
                  value={pitch || ""}
                  onChange={(e) => {
                    setPitch?.(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="Most strategies fail not because the product lacks value, but because they communicate in flat noise. This comprehensive guide uncovers the psychological triggers that captivate and convert high-ticket stakeholders without relying on cheap gimmicks..."
                  className="w-full text-sm leading-relaxed bg-transparent outline-none resize-none font-serif placeholder:opacity-40"
                />
              ) : (
                <div className="text-sm sm:text-base leading-relaxed font-serif opacity-90 first-letter:text-4xl first-letter:font-black first-letter:font-serif first-letter:mr-2 first-letter:float-left first-letter:text-red-500" style={{ "--tw-first-letter": brandColor } as any}>
                  {pitch ||
                    "Most modern strategies fail not because the value proposition is flawed, but because it dissolves in a sea of homogenous messaging. This edition breaks down the specific tactical shifts required to stand out unmistakably."}
                </div>
              )}
            </div>

            {/* Bullets / Core Deliverables */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${
                isDark ? "bg-[#18181c] border-white/10" : "bg-white border-[#151515]/20 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2.5 font-mono text-xs uppercase tracking-widest">
                <span className="font-bold flex items-center gap-1.5 text-red-500" style={{ color: brandColor }}>
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {isEditor ? (
                    <input
                      type="text"
                      value={bulletsTitle || ""}
                      onChange={(e) => setBulletsTitle?.(e.target.value)}
                      placeholder="Inside This Field Guide"
                      className="font-bold bg-transparent outline-none uppercase font-mono text-xs border-b border-dashed border-black/20 dark:border-white/20 pb-0.5"
                    />
                  ) : (
                    bulletsTitle || "Inside This Field Guide"
                  )}
                </span>
                
                {isEditor ? (
                  <input
                    type="text"
                    value={takeawaysSubtitle}
                    onChange={(e) => setTakeawaysSubtitle(e.target.value)}
                    placeholder="Key Takeaways"
                    className="opacity-60 text-[10px] text-right font-mono bg-transparent outline-none w-24"
                  />
                ) : (
                  <span className="opacity-50 text-[10px]">{takeawaysSubtitle}</span>
                )}
              </div>

              <div className="space-y-3 pt-1">
                {displayBullets.map((bullet: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm leading-snug">
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 border"
                      style={{
                        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f3f0e8",
                        borderColor: isDark ? "rgba(255,255,255,0.15)" : "#151515",
                        color: brandColor,
                      }}
                    >
                      0{i + 1}
                    </span>

                    {isEditor ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            if (!bullets || !setBullets) return;
                            const updated = [...bullets];
                            updated[i] = e.target.value;
                            setBullets(updated);
                          }}
                          className="w-full bg-transparent outline-none text-xs sm:text-sm font-sans placeholder:opacity-40 border-b border-dashed border-black/20 dark:border-white/20 pb-0.5"
                          placeholder="Enter key takeaway or lesson..."
                        />
                        <button
                          type="button"
                          onClick={() => setBullets?.(bullets.filter((_: any, idx: number) => idx !== i))}
                          className="text-zinc-400 hover:text-red-500 p-1 transition cursor-pointer"
                          title="Remove bullet"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-sans opacity-90 text-xs sm:text-sm">{bullet}</span>
                    )}
                  </div>
                ))}

                {isEditor && (
                  <button
                    type="button"
                    onClick={() => setBullets?.([...(bullets || []), ""])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-mono font-semibold transition cursor-pointer mt-2"
                    style={{ borderColor: brandColor, color: brandColor }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Key Point</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stat Callout Badges (100% EDITABLE!) */}
            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-[#18181c] border-white/10" : "bg-white border-[#151515]/20 shadow-xs"
                }`}
              >
                {isEditor ? (
                  <>
                    <input
                      type="text"
                      value={stat1Value}
                      onChange={(e) => setStat1Value(e.target.value)}
                      className="text-xl sm:text-2xl font-black font-serif text-center bg-transparent outline-none w-full"
                      style={{ color: brandColor }}
                      placeholder="100%"
                    />
                    <input
                      type="text"
                      value={stat1Label}
                      onChange={(e) => setStat1Label(e.target.value)}
                      className="text-[10px] uppercase opacity-70 text-center bg-transparent outline-none w-full mt-0.5"
                      placeholder="Free Access"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black font-serif" style={{ color: brandColor }}>
                      {stat1Value}
                    </div>
                    <div className="text-[10px] uppercase opacity-70 mt-0.5">{stat1Label}</div>
                  </>
                )}
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-[#18181c] border-white/10" : "bg-white border-[#151515]/20 shadow-xs"
                }`}
              >
                {isEditor ? (
                  <>
                    <input
                      type="text"
                      value={stat2Value}
                      onChange={(e) => setStat2Value(e.target.value)}
                      className="text-xl sm:text-2xl font-black font-serif text-center bg-transparent outline-none w-full"
                      style={{ color: brandColor }}
                      placeholder="Instant"
                    />
                    <input
                      type="text"
                      value={stat2Label}
                      onChange={(e) => setStat2Label(e.target.value)}
                      className="text-[10px] uppercase opacity-70 text-center bg-transparent outline-none w-full mt-0.5"
                      placeholder="Delivery"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black font-serif" style={{ color: brandColor }}>
                      {stat2Value}
                    </div>
                    <div className="text-[10px] uppercase opacity-70 mt-0.5">{stat2Label}</div>
                  </>
                )}
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isDark ? "bg-[#18181c] border-white/10" : "bg-white border-[#151515]/20 shadow-xs"
                }`}
              >
                {isEditor ? (
                  <>
                    <input
                      type="text"
                      value={stat3Value}
                      onChange={(e) => setStat3Value(e.target.value)}
                      className="text-xl sm:text-2xl font-black font-serif text-center bg-transparent outline-none w-full"
                      style={{ color: brandColor }}
                      placeholder="Zero"
                    />
                    <input
                      type="text"
                      value={stat3Label}
                      onChange={(e) => setStat3Label(e.target.value)}
                      className="text-[10px] uppercase opacity-70 text-center bg-transparent outline-none w-full mt-0.5"
                      placeholder="Spam Policy"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black font-serif" style={{ color: brandColor }}>
                      {stat3Value}
                    </div>
                    <div className="text-[10px] uppercase opacity-70 mt-0.5">{stat3Label}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Subscription Slip Form */}
          <div className="lg:col-span-5 sticky top-6">
            <div
              className={`rounded-2xl border-2 p-6 sm:p-7 shadow-2xl relative transition-all ${
                isDark
                  ? "bg-[#18181c] border-white/20 text-[#eae8e3]"
                  : "bg-white border-[#151515] text-[#151515]"
              }`}
            >
              {/* Slip Header Badges */}
              <div className="flex items-center justify-between pb-3 border-b mb-4 font-mono text-[11px] uppercase tracking-wider">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: brandColor }} />
                  {isEditor ? (
                    <input
                      type="text"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="bg-transparent outline-none font-bold uppercase w-36 text-[11px]"
                      placeholder="Dispatch Requisition"
                    />
                  ) : (
                    <span>{formBadge}</span>
                  )}
                </span>
                
                {isEditor ? (
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="font-mono text-[10px] px-2 py-0.5 rounded border border-current opacity-70 bg-transparent outline-none text-right w-20"
                    placeholder="Form 04-A"
                  />
                ) : (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-current opacity-70">
                    {formNumber}
                  </span>
                )}
              </div>

              {/* Form Header */}
              <div className="text-center space-y-1.5 mb-5">
                {isEditor ? (
                  <>
                    <input
                      type="text"
                      value={formTitle || ""}
                      onChange={(e) => setFormTitle?.(e.target.value)}
                      placeholder="Claim Your Field Report"
                      className="w-full text-center text-lg sm:text-xl font-black font-serif bg-transparent outline-none border-b border-dashed border-black/30 dark:border-white/30 pb-1"
                    />
                    <input
                      type="text"
                      value={formSubtitle || ""}
                      onChange={(e) => setFormSubtitle?.(e.target.value)}
                      placeholder="Enter your primary details below for instant PDF access."
                      className="w-full text-center text-xs opacity-70 bg-transparent outline-none font-sans mt-1"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="text-lg sm:text-xl font-black font-serif leading-tight">
                      {formTitle || "Claim Your Field Report"}
                    </h3>
                    {formSubtitle && (
                      <p className="text-xs opacity-75 font-sans leading-relaxed">
                        {formSubtitle}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Form Body */}
              {isEditor ? (
                <div className="space-y-3">
                  <div
                    className={
                      customFormFields && customFormFields.length > 0
                        ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                        : "space-y-2.5"
                    }
                  >
                    <input
                      type="text"
                      placeholder="Your First Name *"
                      readOnly
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none shadow-xs font-mono ${
                        isDark
                          ? "bg-black/40 border-zinc-700 text-white placeholder:text-zinc-500"
                          : "bg-[#f3f0e8] border-[#151515]/30 text-zinc-900 placeholder:text-zinc-500"
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="Your Business Email *"
                      readOnly
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none shadow-xs font-mono ${
                        isDark
                          ? "bg-black/40 border-zinc-700 text-white placeholder:text-zinc-500"
                          : "bg-[#f3f0e8] border-[#151515]/30 text-zinc-900 placeholder:text-zinc-500"
                      }`}
                    />

                    {customFormFields.map((field: any) => (
                      <input
                        key={field.id}
                        type="text"
                        placeholder={`${field.label || "New Field"}${field.required ? " *" : ""}`}
                        readOnly
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none shadow-xs font-mono ${
                          isDark
                            ? "bg-black/40 border-zinc-700 text-white placeholder:text-zinc-500"
                            : "bg-[#f3f0e8] border-[#151515]/30 text-zinc-900 placeholder:text-zinc-500"
                        } ${field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}`}
                      />
                    ))}
                  </div>

                  <input
                    type="text"
                    value={formButtonText || ""}
                    onChange={(e) => setFormButtonText?.(e.target.value)}
                    placeholder="Get Free Instant Access →"
                    className="w-full text-center rounded-xl py-3 px-4 text-xs font-mono font-black uppercase tracking-wider text-white shadow-lg transition duration-150 outline-none border-2 border-transparent hover:brightness-110 cursor-text mt-4"
                    style={{ backgroundColor: brandColor }}
                  />

                  <input
                    type="text"
                    value={formFooterNote}
                    onChange={(e) => setFormFooterNote(e.target.value)}
                    placeholder="🔒 Instant delivery to inbox. Unsubscribe in 1-click."
                    className="text-[10px] text-center font-mono opacity-60 mt-2 bg-transparent outline-none w-full"
                  />
                </div>
              ) : (
                <form onSubmit={onSubmitPublicForm} className="space-y-3">
                  <div
                    className={
                      customFormFields && customFormFields.length > 0
                        ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                        : "space-y-2.5"
                    }
                  >
                    <input
                      type="text"
                      required
                      placeholder="Your First Name *"
                      value={publicFormValues.name || ""}
                      onChange={(e) =>
                        setPublicFormValues?.({ ...publicFormValues, name: e.target.value })
                      }
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none shadow-xs font-mono transition focus:border-red-500 ${
                        isDark
                          ? "bg-black/40 border-zinc-700 text-white placeholder:text-zinc-500"
                          : "bg-[#f3f0e8] border-[#151515]/30 text-zinc-900 placeholder:text-zinc-500"
                      }`}
                    />
                    <input
                      type="email"
                      required
                      placeholder="Your Business Email *"
                      value={publicFormValues.email || ""}
                      onChange={(e) =>
                        setPublicFormValues?.({ ...publicFormValues, email: e.target.value })
                      }
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none shadow-xs font-mono transition focus:border-red-500 ${
                        isDark
                          ? "bg-black/40 border-zinc-700 text-white placeholder:text-zinc-500"
                          : "bg-[#f3f0e8] border-[#151515]/30 text-zinc-900 placeholder:text-zinc-500"
                      }`}
                    />

                    {customFormFields.map((field: any) => (
                      <input
                        key={field.id}
                        type="text"
                        required={field.required}
                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                        value={publicFormValues[field.id] || ""}
                        onChange={(e) =>
                          setPublicFormValues?.({
                            ...publicFormValues,
                            [field.id]: e.target.value,
                          })
                        }
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none shadow-xs font-mono transition focus:border-red-500 ${
                          isDark
                            ? "bg-black/40 border-zinc-700 text-white placeholder:text-zinc-500"
                            : "bg-[#f3f0e8] border-[#151515]/30 text-zinc-900 placeholder:text-zinc-500"
                        } ${field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-mono font-black uppercase tracking-wider text-white shadow-lg transition duration-150 outline-none hover:brightness-110 cursor-pointer mt-4 disabled:opacity-50"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Requisition...</span>
                      </>
                    ) : (
                      <>
                        <span>{formButtonText || "Get Free Instant Access"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center font-mono opacity-60 mt-2">
                    {formFooterNote}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOOTER */}
      <footer
        className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] sm:text-xs uppercase tracking-wider ${
          isDark ? "border-white/10 text-zinc-400 bg-black/40" : "border-[#151515]/20 text-zinc-600 bg-black/5"
        }`}
      >
        <div>
          © {new Date().getFullYear()} {account?.brandName || account?.name || "Signal / Noise Editorial"}. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>Printed & Dispatched Globally</span>
          <span>•</span>
          <span className="font-bold text-red-500" style={{ color: brandColor }}>
            Issue 04
          </span>
        </div>
      </footer>
    </div>
  );
}

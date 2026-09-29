import React from "react";
import {
  Check,
  Loader2,
  ImageIcon,
  Plus,
  X,
  ArrowUpRight,
  Trash2,
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
    mastheadLeft,
    setMastheadLeft,
    mastheadRight,
    setMastheadRight,
    page,
    formTitle,
    formSubtitle,
    formButtonText,
    imageUrl,
    accent,
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
    setImageUrl,
    setFormButtonText,
    isSubmitting = false,
    publicFormValues = {},
    setPublicFormValues,
    onSubmitPublicForm,
  } = props as any;

  const rawProps = props as any;
  const isEditor = props.mode ? props.mode === "editor" : (rawProps.isEditor !== false);

  const brandColor = account?.brandColor || props.brandColor || "#2544d8"; // Royal Blue accent
  const themeMode = account?.themeMode || props.themeMode || "light";
  const isDark = themeMode === "dark";
  const logo = account?.logo || null;
  const businessName = account?.brandName || account?.name || "EDITORIAL BOARD";

  // Default placeholders matching the reference magazine
  const defaultArticlePlaceholders = [
    {
      title: "The first seven seconds",
      desc: "Seven opening structures that create curiosity without manufacturing noise.",
    },
    {
      title: "Build a visual memory",
      desc: "How contrast, rhythm, and restraint turn information into recognition.",
    },
    {
      title: "Anatomy of the share",
      desc: "Twelve remarkable posts, dismantled to reveal the ideas underneath.",
    },
  ];

  const hasCustomBullets = Array.isArray(bullets);
  const displayBullets: string[] = hasCustomBullets
    ? bullets
    : defaultArticlePlaceholders.map((a) => `${a.title} ::: ${a.desc}`);

  const handleBulletTitleChange = (index: number, newTitle: string) => {
    if (!setBullets) return;
    const current = [...displayBullets];
    const parts = (current[index] || "").includes(":::")
      ? current[index].split(":::")
      : [current[index] || "", ""];
    const desc = parts[1] !== undefined ? parts[1].trim() : "";
    current[index] = desc ? `${newTitle} ::: ${desc}` : newTitle;
    setBullets(current);
  };

  const handleBulletDescChange = (index: number, newDesc: string) => {
    if (!setBullets) return;
    const current = [...displayBullets];
    const parts = (current[index] || "").includes(":::")
      ? current[index].split(":::")
      : [current[index] || "", ""];
    const title = parts[0]?.trim() || defaultArticlePlaceholders[index % defaultArticlePlaceholders.length].title;
    current[index] = `${title} ::: ${newDesc}`;
    setBullets(current);
  };

  const handleAddBullet = () => {
    if (!setBullets) return;
    const current = [...displayBullets];
    setBullets([...current, ""]);
  };

  const handleRemoveBullet = (index: number) => {
    if (!setBullets) return;
    const current = [...displayBullets];
    setBullets(current.filter((_: any, i: number) => i !== index));
  };

  const defaultQuotePlaceholder = "“Good work earns attention once. A distinct point of view earns it again.”";
  const defaultAuthorPlaceholder = `— ${businessName || "EDITORIAL BOARD"}, EDITOR AT LARGE`;

  const pitchParts = (pitch || "").includes(":::") ? (pitch || "").split(":::") : [pitch || "", ""];
  const quoteText = pitchParts[0] || "";
  const quoteAuthor = pitchParts[1] || "";

  const defaultHeroImage =
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";
  const coverImage = imageUrl && imageUrl.trim() !== "" ? imageUrl : defaultHeroImage;

  return (
    <div
      className={`w-full min-h-screen flex flex-col font-sans selection:bg-[#ef3d25] selection:text-white transition-colors duration-200 ${
        isDark ? "bg-[#141416] text-[#eae8e3]" : "bg-[#f3f0e8] text-[#151515]"
      }`}
      style={
        {
          "--paper": isDark ? "#141416" : "#f3f0e8",
          "--ink": isDark ? "#eae8e3" : "#151515",
          "--line": isDark ? "rgba(255,255,255,0.18)" : "#151515",
          "--soft": isDark ? "#1e1e24" : "#e7e2d7",
          "--red": "#ef3d25",
          "--blue": brandColor || "#2544d8",
        } as React.CSSProperties
      }
    >
      {/* Upload Progress Overlay */}
      {uploadProgress !== null && uploadProgress !== undefined && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-white">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span className="flex items-center gap-2 text-red-400">
                {uploadProgress === 100 ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {uploadProgress === 100 ? "IMAGE READY" : "UPLOADING ASSET..."}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-none overflow-hidden">
              <div
                className="h-full bg-[#ef3d25] transition-all duration-150 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Marquee Animation Styles */}
      <style>{`
        @keyframes editorialTickerMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .editorial-marquee {
          display: inline-flex;
          white-space: nowrap;
          animation: editorialTickerMarquee 24s linear infinite;
        }
        .editorial-marquee:hover {
          animation-play-state: paused;
        }
        .stroked-watermark {
          -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.35);
          color: transparent;
        }
      `}</style>

      {/* 1. MASTHEAD */}
      {(() => {
        const defaultLeft1 = "VOL. 08 · FIELD NOTES";
        const defaultLeft2 = "ISSUE NO. 42";
        const curLeft = mastheadLeft ?? page?.mastheadLeft ?? "";
        const isLeftHidden = curLeft === "__hidden__";
        const leftParts = curLeft.includes(":::") ? curLeft.split(":::") : [curLeft, ""];
        const leftLine1 = leftParts[0] || "";
        const leftLine2 = leftParts[1] || "";

        const defaultRight1 = "INDEPENDENT IDEAS";
        const defaultRight2 = "AUTUMN · 2026";
        const curRight = mastheadRight ?? page?.mastheadRight ?? "";
        const isRightHidden = curRight === "__hidden__";
        const rightParts = curRight.includes(":::") ? curRight.split(":::") : [curRight, ""];
        const rightLine1 = rightParts[0] || "";
        const rightLine2 = rightParts[1] || "";

        return (
          <header className="w-full border-b border-[#151515] dark:border-white/20 px-6 sm:px-10 py-5 grid grid-cols-1 md:grid-cols-3 items-end gap-4">
            {/* Left: Vol & Issue */}
            <div className="text-left font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] leading-tight opacity-90 relative group min-h-[34px] flex items-end">
              {isLeftHidden ? (
                isEditor && (
                  <button
                    type="button"
                    onClick={() => setMastheadLeft?.("")}
                    className="inline-flex items-center gap-1 border border-dashed border-[#151515]/30 dark:border-white/30 px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Vol / Issue</span>
                  </button>
                )
              ) : (
                <div className="w-full relative">
                  {isEditor && (
                    <button
                      type="button"
                      onClick={() => setMastheadLeft?.("__hidden__")}
                      className="absolute -top-3.5 right-0 p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Remove Left Masthead"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isEditor ? (
                    <div className="space-y-0.5 pr-5">
                      <input
                        type="text"
                        value={leftLine1}
                        onChange={(e) => {
                          const l2 = leftLine2;
                          setMastheadLeft?.(`${e.target.value} ::: ${l2}`);
                        }}
                        className="w-full bg-transparent outline-none font-bold uppercase tracking-[0.18em] placeholder:opacity-50 text-[#151515] dark:text-[#eae8e3]"
                        placeholder={defaultLeft1}
                      />
                      <input
                        type="text"
                        value={leftLine2}
                        onChange={(e) => {
                          const l1 = leftLine1 || defaultLeft1;
                          setMastheadLeft?.(`${l1} ::: ${e.target.value}`);
                        }}
                        className="w-full bg-transparent outline-none font-bold uppercase tracking-[0.18em] placeholder:opacity-50 text-[#151515] dark:text-[#eae8e3]"
                        placeholder={defaultLeft2}
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{leftLine1 || defaultLeft1}</div>
                      <div className="mt-0.5">{leftLine2 || defaultLeft2}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Center: Brand Logo + Brand Title */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 text-center">
              {logo && (
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden shadow-sm border border-[#151515]/20 dark:border-white/20 shrink-0 bg-transparent">
                  <img src={logo} alt={businessName} className="h-full w-full object-cover" />
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.02em] uppercase font-sans leading-none text-[#151515] dark:text-[#eae8e3]">
                {businessName}
              </h1>
            </div>

            {/* Right: Category & Season */}
            <div className="text-left md:text-right font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] leading-tight opacity-90 relative group min-h-[34px] flex items-end justify-start md:justify-end">
              {isRightHidden ? (
                isEditor && (
                  <button
                    type="button"
                    onClick={() => setMastheadRight?.("")}
                    className="inline-flex items-center gap-1 border border-dashed border-[#151515]/30 dark:border-white/30 px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Category / Date</span>
                  </button>
                )
              ) : (
                <div className="w-full relative">
                  {isEditor && (
                    <button
                      type="button"
                      onClick={() => setMastheadRight?.("__hidden__")}
                      className="absolute -top-3.5 left-0 md:left-auto md:right-0 p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Remove Right Masthead"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isEditor ? (
                    <div className="space-y-0.5 pl-0 md:pl-5">
                      <input
                        type="text"
                        value={rightLine1}
                        onChange={(e) => {
                          const r2 = rightLine2;
                          setMastheadRight?.(`${e.target.value} ::: ${r2}`);
                        }}
                        className="w-full bg-transparent outline-none font-bold uppercase tracking-[0.18em] placeholder:opacity-50 text-left md:text-right text-[#151515] dark:text-[#eae8e3]"
                        placeholder={defaultRight1}
                      />
                      <input
                        type="text"
                        value={rightLine2}
                        onChange={(e) => {
                          const r1 = rightLine1 || defaultRight1;
                          setMastheadRight?.(`${r1} ::: ${e.target.value}`);
                        }}
                        className="w-full bg-transparent outline-none font-bold uppercase tracking-[0.18em] placeholder:opacity-50 text-left md:text-right text-[#5a574f] dark:text-zinc-400"
                        placeholder={defaultRight2}
                      />
                    </div>
                  ) : (
                    <div>
                      <div>{rightLine1 || defaultRight1}</div>
                      <div className="mt-0.5 font-normal text-[#5a574f] dark:text-zinc-400">
                        {rightLine2 || defaultRight2}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>
        );
      })()}

      {/* 2. TICKER BAR */}
      <div className="w-full flex items-center overflow-hidden h-8 text-[10px] font-sans font-bold uppercase tracking-[0.12em] select-none bg-[#151515] text-[#f3f0e8]">
        <div className="flex items-center px-4 sm:px-6 h-full shrink-0 font-black text-white bg-[#ef3d25] z-10">
          <span>NEW ISSUE</span>
        </div>
        <div className="overflow-hidden flex-1 relative flex items-center">
          <div className="editorial-marquee text-[10px] font-medium opacity-90">
            <span className="px-4">ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE. • ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE.</span>
            <span className="px-4">ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE. • ATTENTION IS NOT GIVEN. IT IS DESIGNED. • A FIELD GUIDE FOR PEOPLE WHO MAKE IDEAS MOVE.</span>
          </div>
        </div>
      </div>

      {/* 3. HERO SECTION (FEATURE STORY WITH WATERMARK & HEADLINE) */}
      <div
        className="relative min-h-[480px] sm:min-h-[540px] md:min-h-[580px] flex flex-col justify-between p-6 sm:p-10 md:p-14 border-b border-[#151515] dark:border-white/20 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(12,12,12,0.92) 0%, rgba(12,12,12,0.6) 55%, rgba(12,12,12,0.15) 100%), url(${coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Giant Watermark Number in Top-Right */}
        <div className="absolute top-4 right-6 sm:right-12 pointer-events-none select-none z-0">
          <span className="stroked-watermark font-serif text-[120px] sm:text-[180px] md:text-[220px] font-bold leading-none block opacity-80">
            42
          </span>
        </div>

        {/* Top Tag & Editor Actions */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-[#ef3d25] text-white text-[10px] font-black uppercase tracking-[0.15em] font-sans inline-block">
              {accent || "THE ATTENTION ISSUE"}
            </span>
          </div>

          {isEditor && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef?.current?.click()}
                className="flex items-center gap-1.5 bg-black/80 hover:bg-black px-3 py-1.5 text-xs font-bold text-white border border-white/30 backdrop-blur-md transition cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
                <span>{imageUrl && imageUrl.trim() !== "" ? "Change Photo" : "Upload Photo"}</span>
              </button>

              {imageUrl && imageUrl.trim() !== "" && setImageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="flex items-center gap-1.5 bg-black/80 hover:bg-red-950 px-2.5 py-1.5 text-xs font-bold text-red-400 border border-white/30 backdrop-blur-md transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hero Headline & Subheadline */}
        <div className="relative z-10 max-w-3xl space-y-4 text-white mt-auto pt-10">
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
                className="w-full text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white bg-transparent outline-none resize-none leading-[0.98] drop-shadow-md placeholder:text-white/40 border-none transition pb-1"
                placeholder="101 ideas that refuse to vanish."
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
                className="w-full text-base sm:text-lg md:text-xl text-white/90 bg-transparent outline-none resize-none font-sans leading-relaxed placeholder:text-white/40 border-none transition pb-1"
                placeholder="A practical field guide to hooks, visual systems, and narrative devices that turn a passing glance into lasting interest."
              />
            </>
          ) : (
            <>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-[0.98] drop-shadow-md tracking-tight">
                {headline || "101 ideas that refuse to vanish."}
              </h2>
              {subheadline && (
                <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed font-sans max-w-2xl">
                  {subheadline}
                </p>
              )}
            </>
          )}

          {/* Bottom Metadata Byline */}
          <div className="flex flex-wrap items-center gap-6 pt-4 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-white/90">
            <span>12 MIN READ</span>
            <span>BY {businessName}</span>
            <span>VISUAL ESSAY</span>
          </div>
        </div>
      </div>

      {/* 4. MAIN 2-COLUMN LOWER GRID */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* LEFT COLUMN: Table of Contents + Pull Quote (~65% width) */}
        <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            {/* Header: INSIDE THIS ISSUE | CONTENTS 01-03 */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#151515] dark:border-white/20 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em]">
              {isEditor ? (
                <input
                  type="text"
                  value={bulletsTitle || ""}
                  onChange={(e) => setBulletsTitle?.(e.target.value)}
                  className="bg-transparent outline-none font-bold uppercase tracking-[0.18em] w-64 placeholder:opacity-60"
                  placeholder="INSIDE THIS ISSUE"
                />
              ) : (
                <span>{bulletsTitle || "INSIDE THIS ISSUE"}</span>
              )}
              <span>CONTENTS 01—0{displayBullets.length || 3}</span>
            </div>

            {/* Content Rows */}
            <div className="divide-y divide-[#151515]/20 dark:divide-white/10">
              {displayBullets.map((item: string, idx: number) => {
                const placeholderObj = defaultArticlePlaceholders[idx % defaultArticlePlaceholders.length];
                const parts = item.includes(":::") ? item.split(":::") : [item, ""];
                const itemTitle = parts[0] || "";
                const itemDesc = parts[1] || "";
                const numStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;

                return (
                  <div key={idx} className="py-5 sm:py-6 flex items-start justify-between gap-4 group">
                    <div className="flex items-start gap-4 sm:gap-6 flex-1">
                      {/* Large Italic Serif Number */}
                      <span className="font-serif italic text-2xl sm:text-3xl font-normal text-[#151515] dark:text-[#eae8e3] shrink-0 w-8">
                        {numStr}
                      </span>

                      <div className="space-y-1 flex-1">
                        {isEditor ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={itemTitle}
                              onChange={(e) => handleBulletTitleChange(idx, e.target.value)}
                              className="w-full font-serif font-bold text-xl sm:text-2xl bg-transparent outline-none text-[#151515] dark:text-[#eae8e3] placeholder:opacity-40"
                              placeholder={placeholderObj.title}
                            />
                            <input
                              type="text"
                              value={itemDesc}
                              onChange={(e) => handleBulletDescChange(idx, e.target.value)}
                              className="w-full text-xs sm:text-sm font-sans text-[#151515]/80 dark:text-[#eae8e3]/80 bg-transparent outline-none placeholder:opacity-40"
                              placeholder={placeholderObj.desc}
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#151515] dark:text-[#eae8e3] leading-snug">
                              {itemTitle || placeholderObj.title}
                            </h3>
                            <p className="text-xs sm:text-sm font-sans text-[#151515]/80 dark:text-[#eae8e3]/80 leading-relaxed">
                              {itemDesc || placeholderObj.desc}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <ArrowUpRight className="w-5 h-5 text-[#151515] dark:text-[#eae8e3] opacity-60 group-hover:opacity-100 transition-opacity" />
                      {isEditor && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(idx)}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {displayBullets.length === 0 && isEditor && (
                <div className="py-6 text-center text-xs italic opacity-60 font-sans border border-dashed border-[#151515]/20 dark:border-white/20">
                  No article rows. Click "+ ADD ARTICLE ROW" to add one.
                </div>
              )}
            </div>

            {isEditor && (
              <button
                type="button"
                onClick={handleAddBullet}
                className="inline-flex items-center gap-1.5 border border-dashed border-[#151515] dark:border-white/40 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Article Row</span>
              </button>
            )}
          </div>

          {/* Pull Quote Box with Blue Top Bar */}
          {pitch === "__hidden__" || pitch === "__none__" ? (
            isEditor && (
              <button
                type="button"
                onClick={() => setPitch?.(defaultQuotePlaceholder)}
                className="inline-flex items-center gap-1.5 border border-dashed border-[#151515] dark:border-white/40 px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider transition cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pull Quote Card</span>
              </button>
            )
          ) : (
            <div className="w-full overflow-hidden border-t-4 border-[#2544d8] bg-[#e7e2d7] dark:bg-[#1e1e24] p-6 sm:p-8 space-y-3 relative group">
              {isEditor && (
                <button
                  type="button"
                  onClick={() => setPitch?.("__hidden__")}
                  className="absolute top-3 right-3 p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer z-10"
                  title="Remove quote card"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {isEditor ? (
                <div className="space-y-2 pr-6">
                  <textarea
                    ref={pitchRef}
                    rows={2}
                    value={quoteText}
                    onChange={(e) => {
                      const nextVal = quoteAuthor ? `${e.target.value} ::: ${quoteAuthor}` : e.target.value;
                      setPitch?.(nextVal);
                    }}
                    className="w-full font-serif italic text-lg sm:text-xl text-[#151515] dark:text-[#eae8e3] bg-transparent outline-none resize-none leading-snug placeholder:text-[#151515]/60 dark:placeholder:text-[#eae8e3]/60 placeholder:opacity-100"
                    placeholder={defaultQuotePlaceholder}
                  />
                  <div className="pt-1">
                    <input
                      type="text"
                      value={quoteAuthor}
                      onChange={(e) => {
                        const q = quoteText || defaultQuotePlaceholder;
                        setPitch?.(`${q} ::: ${e.target.value}`);
                      }}
                      className="w-full text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#151515]/80 dark:text-[#eae8e3]/80 bg-transparent outline-none placeholder:text-[#151515]/60 dark:placeholder:text-[#eae8e3]/60 placeholder:opacity-100"
                      placeholder={defaultAuthorPlaceholder}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <blockquote className="font-serif italic text-lg sm:text-xl text-[#151515] dark:text-[#eae8e3] leading-snug">
                    {quoteText || defaultQuotePlaceholder}
                  </blockquote>
                  <div className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#151515]/80 dark:text-[#eae8e3]/80">
                    {quoteAuthor || defaultAuthorPlaceholder}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Digital Edition Form Panel (~35% width) */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#151515] dark:border-white/20 p-6 sm:p-10 flex flex-col justify-start space-y-6">
          {/* Eyebrow: DIGITAL EDITION */}
          <div className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#2544d8] dark:text-blue-400">
            DIGITAL EDITION
          </div>

          {/* Form Title & Subtitle */}
          <div className="space-y-2">
            {isEditor ? (
              <>
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  placeholder="Keep the issue."
                  className="w-full font-serif text-3xl sm:text-4xl font-normal text-[#151515] dark:text-[#eae8e3] bg-transparent outline-none placeholder:opacity-50"
                />
                <textarea
                  rows={2}
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  placeholder="Receive the complete 48-page digital edition, including the practical templates and annotated examples."
                  className="w-full text-xs sm:text-sm font-sans opacity-80 bg-transparent outline-none leading-relaxed mt-1 resize-none placeholder:opacity-50"
                />
              </>
            ) : (
              <>
                <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#151515] dark:text-[#eae8e3] leading-tight">
                  {formTitle || "Keep the issue."}
                </h3>
                <p className="text-xs sm:text-sm font-sans opacity-80 leading-relaxed">
                  {formSubtitle || "Receive the complete 48-page digital edition, including the practical templates and annotated examples."}
                </p>
              </>
            )}
          </div>

          {/* Form Fields */}
          {isEditor ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.15em] opacity-90">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  placeholder="Jane Holloway"
                  readOnly
                  className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans ${
                    isDark
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
                  placeholder="jane@studio.com"
                  readOnly
                  className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans ${
                    isDark
                      ? "bg-black/30 text-white placeholder:text-zinc-500"
                      : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                  }`}
                />
              </div>

              {customFormFields.map((field: any) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.15em] opacity-90">
                    {field.label?.toUpperCase() || "ADDITIONAL FIELD"}
                  </label>
                  <input
                    type="text"
                    placeholder={`${field.label || "Value"}${field.required ? " *" : ""}`}
                    readOnly
                    className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans ${
                      isDark
                        ? "bg-black/30 text-white placeholder:text-zinc-500"
                        : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                </div>
              ))}

              <input
                type="text"
                value={formButtonText || ""}
                onChange={(e) => setFormButtonText?.(e.target.value)}
                placeholder="SEND THE DIGITAL ISSUE →"
                className="w-full text-center py-3.5 px-4 text-xs font-sans font-bold uppercase tracking-[0.15em] text-white shadow-md transition outline-none cursor-text mt-4 bg-[#2544d8] hover:brightness-110 placeholder:text-white/70"
                style={{ backgroundColor: brandColor || "#2544d8" }}
              />

              <div className="text-[10px] text-center font-sans opacity-70 mt-2 block">
                One thoughtful issue. No noise.
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmitPublicForm} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.15em] opacity-90">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jane Holloway"
                  value={publicFormValues.name || ""}
                  onChange={(e) =>
                    setPublicFormValues?.({ ...publicFormValues, name: e.target.value })
                  }
                  className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans transition focus:border-[#2544d8] ${
                    isDark
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
                  value={publicFormValues.email || ""}
                  onChange={(e) =>
                    setPublicFormValues?.({ ...publicFormValues, email: e.target.value })
                  }
                  className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans transition focus:border-[#2544d8] ${
                    isDark
                      ? "bg-black/30 text-white placeholder:text-zinc-500"
                      : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                  }`}
                />
              </div>

              {customFormFields.map((field: any) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-[10px] font-sans font-bold uppercase tracking-[0.15em] opacity-90">
                    {field.label?.toUpperCase() || "FIELD"}
                  </label>
                  <input
                    type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
                    required={field.required}
                    placeholder={field.label || ""}
                    value={publicFormValues[field.id] || ""}
                    onChange={(e) =>
                      setPublicFormValues?.({
                        ...publicFormValues,
                        [field.id]: e.target.value,
                      })
                    }
                    className={`w-full border border-[#151515] dark:border-white/30 px-3.5 py-2.5 text-xs outline-none font-sans transition focus:border-[#2544d8] ${
                      isDark
                        ? "bg-black/30 text-white placeholder:text-zinc-500"
                        : "bg-[#ece7dc]/50 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-center py-3.5 px-4 text-xs font-sans font-bold uppercase tracking-[0.15em] text-white shadow-md transition cursor-pointer hover:brightness-110 disabled:opacity-50 mt-4 bg-[#2544d8]"
                style={{ backgroundColor: brandColor || "#2544d8" }}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>DISPATCHING...</span>
                  </span>
                ) : (
                  <span>{formButtonText || "SEND THE DIGITAL ISSUE →"}</span>
                )}
              </button>

              <div className="text-[10px] text-center font-sans opacity-70 mt-2 block">
                One thoughtful issue. No noise.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import {
  Check,
  Loader2,
  ImageIcon,
  Trash2,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  UploadCloud,
} from "lucide-react";
import { type TemplateProps } from "./types";
import { ImageGeneration } from "@/components/agents/image-generation";

export default function Template4(props: TemplateProps) {
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

  // Colors & Brand Settings
  const brandColor = account?.brandColor || props.brandColor || "#ff5038";
  const themeMode = account?.themeMode || props.themeMode || "dark";
  const isDark = themeMode === "dark";
  const logo = account?.logo || null;
  const businessName = account?.brandName || account?.name || "NOCTURNE";
  const currentYear = new Date().getFullYear();

  // Dynamic Theme Colors matching Night Poster / Day Poster
  const canvasBg = isDark ? "#0b0d12" : "#f5f1e8";
  const textColor = isDark ? "#f5f1e8" : "#0b0d12";
  const mutedText = isDark ? "#b9bbc3" : "#4b5563";
  const dimText = isDark ? "#8d9099" : "#6b7280";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.17)" : "rgba(11, 13, 18, 0.16)";
  const rawAccent = brandColor || "#ff5038";
  const accentColor = isDark && isVeryDark(rawAccent) ? "#ff5038" : rawAccent;
  const numberTeal = isDark ? "#2dd4bf" : "#0d9488";

  // Formbox Theme Colors
  const formBoxBg = isDark ? "#f5f1e8" : "#0b0d12";
  const formBoxText = isDark ? "#0b0d12" : "#f5f1e8";
  const formBoxMuted = isDark ? "#4b5563" : "#b9bbc3";
  const formBoxInputBorder = isDark ? "#0b0d12" : "#f5f1e8";
  const formBoxPlaceholder = isDark ? "#8d9099" : "#8d9099";

  // Default Tracks (Bullets)
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
    if (!item) return { title: "", desc: "" };
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

  const hasCustomBullets = Array.isArray(bullets);
  const trackItems: string[] = hasCustomBullets
    ? bullets
    : defaultTracks.map((t) => `${t.title} ::: ${t.desc}`);

  const handleTrackTitleChange = (idx: number, newTitle: string) => {
    if (!setBullets) return;
    const current = [...trackItems];
    const parsed = parseTrack(current[idx] || "", idx);
    current[idx] = parsed.desc ? `${newTitle} ::: ${parsed.desc}` : newTitle;
    setBullets(current);
  };

  const handleTrackDescChange = (idx: number, newDesc: string) => {
    if (!setBullets) return;
    const current = [...trackItems];
    const parsed = parseTrack(current[idx] || "", idx);
    const title = parsed.title || defaultTracks[idx % defaultTracks.length].title;
    current[idx] = `${title} ::: ${newDesc}`;
    setBullets(current);
  };

  const handleAddTrack = () => {
    if (!setBullets) return;
    const num = (trackItems.length + 1).toString().padStart(2, "0");
    setBullets([
      ...trackItems,
      `Core Principle ${num} ::: Strategic insight for high-velocity operators.`,
    ]);
  };

  const handleRemoveTrack = (idx: number) => {
    if (!setBullets) return;
    setBullets(trackItems.filter((_, i) => i !== idx));
  };

  // Stat Number & Pitch parsing
  const parsePitch = (rawPitch: string | undefined | null) => {
    if (!rawPitch) {
      return {
        statNumber: "",
        pitchText: "",
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

  const parsedPitch = parsePitch(pitch);

  const handleStatNumberChange = (val: string) => {
    if (!setPitch) return;
    setPitch(`${val} ::: ${parsedPitch.pitchText}`);
  };

  const handleRemoveStatNumber = () => {
    if (!setPitch) return;
    setPitch(`__none__ ::: ${parsedPitch.pitchText}`);
  };

  const handleAddStatNumber = () => {
    if (!setPitch) return;
    setPitch(`48 ::: ${parsedPitch.pitchText}`);
  };

  const handlePitchTextChange = (val: string) => {
    if (!setPitch) return;
    if (!parsedPitch.hasStat) {
      setPitch(`__none__ ::: ${val}`);
    } else {
      setPitch(`${parsedPitch.statNumber || "48"} ::: ${val}`);
    }
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
      className="w-full min-h-full flex flex-col justify-between selection:bg-rose-500 selection:text-white transition-colors duration-200"
      style={{
        backgroundColor: canvasBg,
        color: textColor,
        fontFamily: "'Space Mono', monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
      }}
    >
      {/* Import Bebas Neue & Space Mono fonts */}
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
            .poster-headline-input::placeholder {
              color: inherit;
              opacity: 0.35;
            }
          `,
        }}
      />

      <div className="w-full flex-1 flex flex-col">
        {/* 1. TOP NAV BAR */}
        <header
          className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-5 border-b text-[10px] tracking-[0.18em] uppercase transition-colors"
          style={{ borderColor }}
        >
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-3 min-w-0">
            {logo && (
              <img
                src={logo}
                alt="Logo"
                className="h-6 w-6 object-cover rounded-xs border shrink-0"
                style={{ borderColor }}
              />
            )}
            {isEditor ? (
              <input
                type="text"
                value={mastheadLeft || ""}
                onChange={(e) => setMastheadLeft?.(e.target.value)}
                placeholder={`${businessName.toUpperCase()} / RESEARCH`}
                className="font-bold font-space bg-transparent outline-none uppercase w-48 sm:w-64 transition-opacity placeholder:opacity-50"
                style={{ color: textColor }}
              />
            ) : (
              <b className="font-space tracking-[0.18em] truncate">
                {mastheadLeft || `${businessName.toUpperCase()} / RESEARCH`}
              </b>
            )}
          </div>

          {/* Right: Edition / Year */}
          <div className="flex items-center gap-2 shrink-0">
            {isEditor ? (
              <input
                type="text"
                value={mastheadRight || ""}
                onChange={(e) => setMastheadRight?.(e.target.value)}
                placeholder={`ISSUE 11 — ${currentYear}`}
                className="font-space text-right bg-transparent outline-none uppercase w-36 sm:w-44 transition-opacity placeholder:opacity-50"
                style={{ color: mutedText }}
              />
            ) : (
              <span className="font-space text-right" style={{ color: mutedText }}>
                {mastheadRight || `ISSUE 11 — ${currentYear}`}
              </span>
            )}
          </div>
        </header>

        {/* 2. MAIN HERO STAGE */}
        <main className="w-full flex-1 flex flex-col">
          <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-[580px] lg:min-h-[640px] relative">
            {/* LEFT COLUMN: Overline, Massive Headline, Intro Stat & Pitch */}
            <div className="p-6 sm:p-10 lg:py-14 lg:px-12 flex flex-col justify-between relative z-10">
              <div className="space-y-5 sm:space-y-6">
                {/* Overline / BulletsTitle */}
                <div>
                  {isEditor ? (
                    <input
                      type="text"
                      value={bulletsTitle || ""}
                      onChange={(e) => setBulletsTitle?.(e.target.value)}
                      placeholder="A MANUAL FOR INDEPENDENT MINDS"
                      className="font-space text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] bg-transparent outline-none w-full placeholder:opacity-50"
                      style={{ color: accentColor }}
                    />
                  ) : (
                    <small
                      className="font-space text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] block"
                      style={{ color: accentColor }}
                    >
                      {bulletsTitle || "A MANUAL FOR INDEPENDENT MINDS"}
                    </small>
                  )}
                </div>

                {/* Massive Hero Headline in Bebas Neue */}
                <div>
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
                      placeholder={"THE SIGNAL CODE"}
                      className="poster-headline-input font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[110px] leading-[0.82] tracking-normal bg-transparent outline-none resize-none w-full uppercase transition-all"
                      style={{ color: textColor }}
                    />
                  ) : (
                    <h1
                      className="font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[110px] leading-[0.82] tracking-normal uppercase m-0 break-words"
                      style={{ color: textColor }}
                    >
                      {headline || (
                        <>
                          THE<br />
                          <span style={{ color: accentColor }}>SIGNAL</span>
                          <br />
                          CODE
                        </>
                      )}
                    </h1>
                  )}
                </div>

                {/* Subheadline (if provided) */}
                {isEditor ? (
                  <textarea
                    ref={subheadlineRef}
                    rows={1}
                    value={subheadline || ""}
                    onChange={(e) => {
                      setSubheadline?.(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    placeholder="Short crisp subtitle (optional)..."
                    className="font-space text-xs sm:text-sm leading-relaxed bg-transparent outline-none resize-none w-full max-w-[480px] placeholder:opacity-40"
                    style={{ color: mutedText }}
                  />
                ) : (
                  subheadline && (
                    <p
                      className="font-space text-xs sm:text-sm leading-relaxed max-w-[480px] m-0"
                      style={{ color: mutedText }}
                    >
                      {subheadline}
                    </p>
                  )
                )}
              </div>

              {/* Intro Stat & Pitch Row */}
              <div className="flex items-start gap-4 sm:gap-6 pt-8 sm:pt-10">
                {/* Number Callout or Add Button */}
                {isEditor ? (
                  parsedPitch.hasStat ? (
                    <div className="relative group shrink-0 flex items-start">
                      <input
                        type="text"
                        value={parsedPitch.statNumber}
                        onChange={(e) => handleStatNumberChange(e.target.value)}
                        placeholder="48"
                        className="font-bebas text-5xl sm:text-6xl md:text-7xl leading-none bg-transparent outline-none w-18 sm:w-24 transition-all placeholder:opacity-30"
                        style={{ color: numberTeal }}
                        title="Stat number callout"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveStatNumber}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove number callout"
                        aria-label="Remove number callout"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={handleAddStatNumber}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 font-space text-[10px] font-bold uppercase rounded-xs border border-dashed transition-all hover:brightness-110 cursor-pointer"
                        style={{
                          color: numberTeal,
                          borderColor: `${numberTeal}66`,
                          backgroundColor: `${numberTeal}10`,
                        }}
                        title="Add stat number callout"
                      >
                        <Plus className="w-3 h-3" />
                        <span>STAT</span>
                      </button>
                    </div>
                  )
                ) : parsedPitch.hasStat && (parsedPitch.statNumber || !pitch) ? (
                  <div
                    className="font-bebas text-5xl sm:text-6xl md:text-7xl leading-none select-none shrink-0"
                    style={{ color: numberTeal }}
                  >
                    {parsedPitch.statNumber || "48"}
                  </div>
                ) : null}

                {/* Pitch Paragraph */}
                <div className="flex-1 max-w-[460px]">
                  {isEditor ? (
                    <textarea
                      ref={pitchRef}
                      rows={3}
                      value={parsedPitch.pitchText}
                      onChange={(e) => {
                        handlePitchTextChange(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Pages of battle-tested systems for creating authority, holding attention, and turning an original point of view into durable demand."
                      className="font-space text-xs sm:text-[13px] leading-relaxed bg-transparent outline-none resize-none w-full placeholder:opacity-50"
                      style={{ color: mutedText }}
                    />
                  ) : (
                    <p
                      className="font-space text-xs sm:text-[13px] leading-relaxed m-0"
                      style={{ color: mutedText }}
                    >
                      {parsedPitch.pitchText ||
                        "Pages of battle-tested systems for creating authority, holding attention, and turning an original point of view into durable demand."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Cover Image Backdrop + Sideword + Floating Formbox */}
            <div className="relative min-h-[480px] lg:min-h-full flex flex-col justify-end overflow-hidden group">
              {/* Cover Image or Fallback Graphic */}
              {isGeneratingAICover ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90">
                  <ImageGeneration
                    status="generating"
                    prompt={headline || "Night Poster Editorial Cover"}
                    resolution="1200 × 630"
                    label="AI agent rendering poster visual..."
                    aspectRatio="16 / 9"
                    className="h-full w-full"
                  />
                </div>
              ) : imageUrl && imageUrl.trim() !== "" ? (
                <img
                  src={imageUrl}
                  alt="Poster Cover"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                /* Fallback Poster Graphic */
                <div
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center select-none"
                  style={{
                    background: isDark
                      ? "radial-gradient(circle at 60% 40%, #1c202a 0%, #0d0f15 100%)"
                      : "radial-gradient(circle at 60% 40%, #e8e2d5 0%, #d8d0c0 100%)",
                  }}
                >
                  {/* Decorative Geometric Grid */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
                      backgroundSize: "48px 48px",
                    }}
                  />
                  <div className="relative z-10 text-center space-y-3 px-6 pointer-events-none">
                    <div
                      className="font-bebas text-6xl sm:text-7xl opacity-20 tracking-widest uppercase"
                      style={{ color: textColor }}
                    >
                      {businessName}
                    </div>
                    <div
                      className="font-space text-[10px] tracking-[0.25em] uppercase opacity-40"
                      style={{ color: textColor }}
                    >
                      ARCHIVAL SPECIFICATION // VOL 04
                    </div>
                  </div>
                </div>
              )}

              {/* Seamless Fade Gradient over image */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: isDark
                    ? `linear-gradient(90deg, #0b0d12 0%, rgba(11, 13, 18, 0.7) 20%, transparent 55%), linear-gradient(0deg, #0b0d12 0%, transparent 40%)`
                    : `linear-gradient(90deg, #f5f1e8 0%, rgba(245, 241, 232, 0.7) 20%, transparent 55%), linear-gradient(0deg, #f5f1e8 0%, transparent 40%)`,
                }}
              />

              {/* Upload Progress Indicator Overlay */}
              {uploadProgress !== null && uploadProgress !== undefined && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-sm text-white">
                  <div className="w-full max-w-xs space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold font-space">
                      {uploadProgress === 100 ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                      )}
                      <span>{uploadProgress === 100 ? "UPLOADED" : "UPLOADING COVER"}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Image Action Bar (Top Right) */}
              {isEditor && (
                <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef?.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold font-space rounded-xs transition-all shadow-md cursor-pointer border bg-black/70 hover:bg-black text-white border-white/20"
                    title="Upload custom cover photo"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{imageUrl ? "REPLACE" : "UPLOAD"}</span>
                  </button>

                  {imageUrl && setImageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="p-1.5 rounded-xs transition-all shadow-md cursor-pointer border bg-red-600/80 hover:bg-red-600 text-white border-red-500/40"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Rotated Sideword */}
              <div
                className="hidden lg:block absolute right-[-45px] top-[240px] transform rotate-90 font-bebas text-lg tracking-[0.3em] select-none pointer-events-none z-20"
                style={{ color: isDark ? "rgba(255, 255, 255, 0.28)" : "rgba(11, 13, 18, 0.28)" }}
              >
                LIMITED DIGITAL RELEASE
              </div>

              {/* Floating Form Box */}
              <aside
                className="relative lg:absolute z-30 lg:right-[4vw] lg:bottom-10 m-5 lg:m-0 w-auto lg:w-[min(390px,90%)] p-6 sm:p-7 shadow-2xl transition-all"
                style={{
                  backgroundColor: formBoxBg,
                  color: formBoxText,
                  boxShadow: isDark
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
                    : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                {/* Form Title & Subtitle */}
                <div className="space-y-1 mb-4">
                  {isEditor ? (
                    <>
                      <input
                        type="text"
                        value={formTitle || ""}
                        onChange={(e) => setFormTitle?.(e.target.value)}
                        placeholder="ENTER THE ARCHIVE"
                        className="font-bebas text-3xl sm:text-4xl tracking-normal uppercase bg-transparent outline-none w-full placeholder:opacity-40"
                        style={{ color: formBoxText }}
                      />
                      <textarea
                        rows={2}
                        value={formSubtitle || ""}
                        onChange={(e) => setFormSubtitle?.(e.target.value)}
                        placeholder="Receive the complete report and three working templates."
                        className="font-space text-[11px] leading-relaxed bg-transparent outline-none resize-none w-full placeholder:opacity-40"
                        style={{ color: formBoxMuted }}
                      />
                    </>
                  ) : (
                    <>
                      <h2
                        className="font-bebas text-3xl sm:text-4xl tracking-normal uppercase m-0 leading-tight"
                        style={{ color: formBoxText }}
                      >
                        {formTitle || "ENTER THE ARCHIVE"}
                      </h2>
                      <p
                        className="font-space text-[11px] leading-relaxed m-0"
                        style={{ color: formBoxMuted }}
                      >
                        {formSubtitle ||
                          "Receive the complete report and three working templates."}
                      </p>
                    </>
                  )}
                </div>

                {/* Form Fields & Submit */}
                {isEditor ? (
                  <div className="space-y-3">
                    {/* Name Input */}
                    <div>
                      <input
                        type="text"
                        readOnly
                        placeholder="YOUR NAME"
                        className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                        style={{
                          borderBottomColor: formBoxInputBorder,
                          color: formBoxText,
                        }}
                      />
                    </div>

                    {/* Email Input */}
                    <div>
                      <input
                        type="email"
                        readOnly
                        placeholder="EMAIL ADDRESS"
                        className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                        style={{
                          borderBottomColor: formBoxInputBorder,
                          color: formBoxText,
                        }}
                      />
                    </div>

                    {/* Custom Form Fields */}
                    {customFormFields &&
                      customFormFields.map((field: any) => (
                        <div key={field.id}>
                          <input
                            type="text"
                            readOnly
                            placeholder={`${(field.label || "Custom Field").toUpperCase()}${
                              field.required ? " *" : ""
                            }`}
                            className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                            style={{
                              borderBottomColor: formBoxInputBorder,
                              color: formBoxText,
                            }}
                          />
                        </div>
                      ))}

                    {/* Editable Button */}
                    <div className="pt-2">
                      <input
                        type="text"
                        value={formButtonText || ""}
                        onChange={(e) => setFormButtonText?.(e.target.value)}
                        placeholder="UNLOCK THE REPORT →"
                        className="w-full text-center py-3.5 px-4 font-space font-bold text-xs uppercase cursor-text outline-none transition-transform hover:brightness-105"
                        style={{
                          backgroundColor: accentColor,
                          color: isDark ? "#0b0d12" : "#ffffff",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmitPublicForm} className="space-y-3">
                    {/* Public Name */}
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="YOUR NAME"
                        value={publicFormValues.name || ""}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                        style={{
                          borderBottomColor: formBoxInputBorder,
                          color: formBoxText,
                        }}
                      />
                    </div>

                    {/* Public Email */}
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="EMAIL ADDRESS"
                        value={publicFormValues.email || ""}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                        style={{
                          borderBottomColor: formBoxInputBorder,
                          color: formBoxText,
                        }}
                      />
                    </div>

                    {/* Public Custom Form Fields */}
                    {customFormFields &&
                      customFormFields.map((field: any) => (
                        <div key={field.id}>
                          {field.type === "textarea" ? (
                            <textarea
                              rows={2}
                              required={field.required}
                              placeholder={`${(field.label || "").toUpperCase()}${
                                field.required ? " *" : ""
                              }`}
                              value={publicFormValues[field.id] || ""}
                              onChange={(e) =>
                                handleFieldChange(field.id, e.target.value)
                              }
                              className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none resize-none transition-colors"
                              style={{
                                borderBottomColor: formBoxInputBorder,
                                color: formBoxText,
                              }}
                            />
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              required={field.required}
                              placeholder={`${(field.label || "").toUpperCase()}${
                                field.required ? " *" : ""
                              }`}
                              value={publicFormValues[field.id] || ""}
                              onChange={(e) =>
                                handleFieldChange(field.id, e.target.value)
                              }
                              className="w-full border-0 border-b bg-transparent py-2.5 px-0.5 font-space text-xs outline-none transition-colors"
                              style={{
                                borderBottomColor: formBoxInputBorder,
                                color: formBoxText,
                              }}
                            />
                          )}
                        </div>
                      ))}

                    {/* Error / Success Feedback */}
                    {errorMsg && (
                      <p className="text-red-500 font-space text-[10px] m-0 pt-1">
                        {errorMsg}
                      </p>
                    )}
                    {successMsg && (
                      <p className="text-emerald-500 font-space text-[10px] m-0 pt-1 font-bold">
                        {successMsg}
                      </p>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full text-center py-3.5 px-4 font-space font-bold text-xs uppercase cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                        style={{
                          backgroundColor: accentColor,
                          color: isDark ? "#0b0d12" : "#ffffff",
                        }}
                      >
                        {isSubmitting
                          ? "VERIFYING..."
                          : formButtonText || "UNLOCK THE REPORT →"}
                      </button>
                    </div>
                  </form>
                )}
              </aside>
            </div>
          </section>

          {/* 3. TRACKS SECTION (BULLETS) */}
          {trackItems.length > 0 ? (
            <section
              className={`border-t grid grid-cols-1 ${
                trackItems.length === 1
                  ? "md:grid-cols-1"
                  : trackItems.length === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-3"
              } transition-colors`}
              style={{ borderColor }}
            >
              {trackItems.map((item, idx) => {
                const trackNum = (idx + 1).toString().padStart(2, "0");
                const parsed = parseTrack(item, idx);

                return (
                  <article
                    key={idx}
                    className={`p-6 sm:py-7 sm:px-8 flex flex-col justify-between relative group ${
                      idx < trackItems.length - 1 ? "md:border-r border-b md:border-b-0" : ""
                    }`}
                    style={{ borderColor }}
                  >
                    <div className="space-y-2">
                      {/* Track Number Tag */}
                      <div className="flex items-center justify-between">
                        <small
                          className="font-space text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: numberTeal }}
                        >
                          TRACK / {trackNum}
                        </small>

                        {isEditor && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(idx)}
                            className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={`Remove Track ${trackNum}`}
                            aria-label={`Remove Track ${trackNum}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Track Title */}
                      <div>
                        {isEditor ? (
                          <input
                            type="text"
                            value={parsed.title}
                            onChange={(e) =>
                              handleTrackTitleChange(idx, e.target.value)
                            }
                            placeholder={`Track ${trackNum} Title`}
                            className="font-bebas text-2xl sm:text-3xl tracking-normal uppercase bg-transparent outline-none w-full placeholder:opacity-40"
                            style={{ color: textColor }}
                          />
                        ) : (
                          <h3
                            className="font-bebas text-2xl sm:text-3xl tracking-normal uppercase m-0 leading-tight"
                            style={{ color: textColor }}
                          >
                            {parsed.title}
                          </h3>
                        )}
                      </div>

                      {/* Track Description */}
                      <div>
                        {isEditor ? (
                          <textarea
                            rows={2}
                            value={parsed.desc}
                            onChange={(e) =>
                              handleTrackDescChange(idx, e.target.value)
                            }
                            placeholder="Describe the principle or framework delivered in this track..."
                            className="font-space text-[10px] sm:text-[11px] leading-relaxed bg-transparent outline-none resize-none w-full placeholder:opacity-40"
                            style={{ color: dimText }}
                          />
                        ) : (
                          <p
                            className="font-space text-[10px] sm:text-[11px] leading-relaxed m-0"
                            style={{ color: dimText }}
                          >
                            {parsed.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : isEditor ? (
            <div
              className="border-t p-6 text-center text-xs font-space text-zinc-500 transition-colors"
              style={{ borderColor }}
            >
              No tracks added. Click &quot;Add Track&quot; below to add one.
            </div>
          ) : null}

          {/* Add Track Button in Editor Mode */}
          {isEditor && (
            <div
              className="p-4 border-t flex justify-center bg-black/10 dark:bg-white/5"
              style={{ borderColor }}
            >
              <button
                type="button"
                onClick={handleAddTrack}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-space text-[11px] font-bold uppercase tracking-wider rounded-xs border transition-all hover:brightness-110 cursor-pointer"
                style={{
                  backgroundColor: `${accentColor}18`,
                  color: textColor,
                  borderColor: `${accentColor}44`,
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD TRACK / 0{(trackItems.length + 1).toString().padStart(2, "0")}</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

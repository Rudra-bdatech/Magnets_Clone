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

export default function Template8(props: TemplateProps) {
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

  const brandColor = account?.brandColor || props.brandColor || "#1554db";
  const accentColor = brandColor;
  const themeMode = account?.themeMode || props.themeMode || "light";
  const isDark = themeMode === "dark";
  const businessName = account?.brandName || account?.name || "Odd Hours";

  // Helper for text contrast calculation
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

  // Default bullet items matching the Collage Zine reference
  const defaultBullets = [
    "Find the strange bit — Your most specific instinct is usually the most valuable one.",
    "Build a repeatable world — Make every idea feel like it came from the same vivid universe.",
    "Ship before permission — A practical weekly ritual for creating momentum.",
  ];

  const currentBullets: string[] =
    Array.isArray(bullets) && bullets.length > 0 ? bullets : defaultBullets;

  const parseBullet = (item: string, defaultIdx: number) => {
    if (!item) return { num: (defaultIdx + 1).toString().padStart(2, "0"), title: "", desc: "" };
    if (item.includes(":::")) {
      const parts = item.split(":::");
      if (parts.length >= 3) {
        return {
          num: parts[0],
          title: parts[1].trim(),
          desc: parts.slice(2).join(":::").trim(),
        };
      }
      return {
        num: (defaultIdx + 1).toString().padStart(2, "0"),
        title: parts[0].trim(),
        desc: parts.slice(1).join(":::").trim(),
      };
    }
    if (item.includes(" — ")) {
      const [title, ...rest] = item.split(" — ");
      return {
        num: (defaultIdx + 1).toString().padStart(2, "0"),
        title: title.trim(),
        desc: rest.join(" — ").trim(),
      };
    }
    if (item.includes(" - ")) {
      const [title, ...rest] = item.split(" - ");
      return {
        num: (defaultIdx + 1).toString().padStart(2, "0"),
        title: title.trim(),
        desc: rest.join(" - ").trim(),
      };
    }
    if (item.includes("\n")) {
      const [title, ...rest] = item.split("\n");
      return {
        num: (defaultIdx + 1).toString().padStart(2, "0"),
        title: title.trim(),
        desc: rest.join("\n").trim(),
      };
    }
    return {
      num: (defaultIdx + 1).toString().padStart(2, "0"),
      title: item,
      desc: "",
    };
  };

  const handleBulletNumberChange = (index: number, newNum: string) => {
    if (!setBullets) return;
    const next = [...currentBullets];
    const parsed = parseBullet(next[index] || "", index);
    const saveNum = newNum === "" ? "__none__" : newNum;
    next[index] = `${saveNum}:::${parsed.title}:::${parsed.desc}`;
    setBullets(next);
  };

  const handleBulletTitleChange = (index: number, newTitle: string) => {
    if (!setBullets) return;
    const next = [...currentBullets];
    const parsed = parseBullet(next[index] || "", index);
    next[index] = `${parsed.num}:::${newTitle}:::${parsed.desc}`;
    setBullets(next);
  };

  const handleBulletDescChange = (index: number, newDesc: string) => {
    if (!setBullets) return;
    const next = [...currentBullets];
    const parsed = parseBullet(next[index] || "", index);
    next[index] = `${parsed.num}:::${parsed.title}:::${newDesc}`;
    setBullets(next);
  };

  const handleAddBullet = () => {
    if (!setBullets) return;
    const num = (currentBullets.length + 1).toString().padStart(2, "0");
    setBullets([...currentBullets, `${num}:::Idea ${num}:::Key perspective or tactic to elevate your creative output.`]);
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

  const localHeadlineRef = React.useRef<HTMLTextAreaElement | null>(null);
  const localSubheadlineRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setHeadlineTextareaRef = (el: HTMLTextAreaElement | null) => {
    localHeadlineRef.current = el;
    if (headlineRef) {
      if (typeof headlineRef === "function") {
        headlineRef(el);
      } else {
        (headlineRef as any).current = el;
      }
    }
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const setSubheadlineTextareaRef = (el: HTMLTextAreaElement | null) => {
    localSubheadlineRef.current = el;
    if (subheadlineRef) {
      if (typeof subheadlineRef === "function") {
        subheadlineRef(el);
      } else {
        (subheadlineRef as any).current = el;
      }
    }
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const autoResizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  React.useEffect(() => {
    autoResizeTextarea(localHeadlineRef.current);
  }, [headline]);

  React.useEffect(() => {
    autoResizeTextarea(localSubheadlineRef.current);
  }, [subheadline, pitch]);

  // Sticker Text fallback
  const stickerText = deliverable
    ? `FREE\n${deliverable.toUpperCase()}\nEDITION!`
    : "FREE\n48-PAGE\nEDITION!";

  return (
    <div
      className={`template8-root w-full min-h-full transition-colors duration-200 selection:bg-[#ff4d73] selection:text-white ${
        isDark ? "bg-[#0d0e12] text-[#f4f4f5]" : "bg-[#eee9df] text-[#141414]"
      }`}
      style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundImage: isDark
          ? "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)"
          : "radial-gradient(rgba(20, 20, 20, 0.18) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        padding: isEditor ? "12px 6px" : "24px 16px",
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
            .zine-shadow {
              box-shadow: 10px 10px 0 #141414;
            }
            .zine-shadow-dark {
              box-shadow: 10px 10px 0 #000000;
            }
            .sticker-shadow {
              box-shadow: 4px 4px 0 #141414;
            }
            .sticker-shadow-dark {
              box-shadow: 4px 4px 0 #000000;
            }
            .btn-shadow {
              box-shadow: 4px 4px 0 #141414;
            }
            .btn-shadow-dark {
              box-shadow: 4px 4px 0 #000000;
            }
            .btn-active:active {
              transform: translate(3px, 3px);
              box-shadow: 1px 1px 0 #141414 !important;
            }
            .btn-active-dark:active {
              transform: translate(3px, 3px);
              box-shadow: 1px 1px 0 #000000 !important;
            }
          `,
        }}
      />

      {/* Main Sheet Container */}
      <div
        className={`w-full max-w-[96%] sm:max-w-[94%] xl:max-w-[92%] 2xl:max-w-[1700px] mx-auto transition-all duration-200 border-2 overflow-hidden ${
          isDark
            ? "bg-[#15161d] border-[#2e303d] zine-shadow-dark"
            : "bg-[#f8f4e9] border-[#141414] zine-shadow"
        }`}
      >
        {/* 1. TOP HEADER / MASTHEAD */}
        <header
          className={`flex flex-wrap justify-between items-center px-5 py-4 sm:px-8 sm:py-5 border-b-2 transition-colors ${
            isDark ? "border-[#2e303d] bg-[#121319]" : "border-[#141414] bg-[#f8f4e9]"
          }`}
        >
          {/* Logo / Left Brand */}
          <div className="flex items-center gap-3">
            {account?.logo && (
              <img
                src={account.logo}
                alt="Logo"
                className={`h-9 w-9 object-cover border-2 shrink-0 ${
                  isDark ? "border-[#2e303d]" : "border-[#141414]"
                }`}
              />
            )}
            {isEditor ? (
              <input
                type="text"
                value={mastheadLeft || ""}
                onChange={(e) => setMastheadLeft?.(e.target.value)}
                placeholder={businessName || "Odd Hours"}
                className={`font-shrikhand text-2xl sm:text-3xl tracking-wide bg-transparent outline-none w-full max-w-sm placeholder:opacity-40 transition-colors ${
                  isDark ? "text-white" : "text-[#141414]"
                }`}
              />
            ) : (
              <div
                className={`font-shrikhand text-2xl sm:text-3xl tracking-wide ${
                  isDark ? "text-white" : "text-[#141414]"
                }`}
              >
                {mastheadLeft || businessName || "Odd Hours"}
              </div>
            )}
          </div>

          {/* Issue / Right Tag */}
          <div className="mt-2 sm:mt-0 text-left sm:text-right">
            {isEditor ? (
              <input
                type="text"
                value={mastheadRight || ""}
                onChange={(e) => setMastheadRight?.(e.target.value)}
                placeholder="CREATIVE FIELD NOTES · #07"
                className={`font-dm-sans text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase bg-transparent outline-none w-full sm:text-right placeholder:opacity-40 ${
                  isDark ? "text-zinc-400" : "text-[#141414]"
                }`}
              />
            ) : (
              <span
                className={`font-dm-sans text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase ${
                  isDark ? "text-zinc-400" : "text-[#141414]"
                }`}
              >
                {mastheadRight || "CREATIVE FIELD NOTES · #07"}
              </span>
            )}
          </div>
        </header>

        {/* 2. HERO SECTION: POSTER (LEFT) + COPY (RIGHT) */}
        <section
          className={`grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] min-h-[520px] transition-colors`}
        >
          {/* Left Column: Poster & Sticker */}
          <div
            className={`relative min-h-[380px] sm:min-h-[460px] lg:min-h-[540px] border-b-2 lg:border-b-0 lg:border-r-2 overflow-hidden flex items-center justify-center group ${
              isDark
                ? "border-[#2e303d] bg-[#1a1b24]"
                : "border-[#141414] bg-[#f5ed21]"
            }`}
          >
            {/* Upload Progress Overlay */}
            {uploadProgress !== null && uploadProgress !== undefined && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6 text-center text-white">
                <div className="mb-3 flex h-12 w-12 items-center justify-center border-2 border-white bg-black">
                  {uploadProgress === 100 ? (
                    <Check className="h-6 w-6 text-[#f5ed21]" />
                  ) : (
                    <Loader2 className="h-6 w-6 animate-spin text-[#f5ed21]" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-bold font-dm-sans tracking-wider uppercase text-[#f5ed21]">
                  {uploadProgress === 100 ? "IMAGE PROCESSED 100%" : "UPLOADING COVER IMAGE..."}
                </p>
                <div className="mt-3 w-full max-w-[220px] border-2 border-white bg-black p-0.5">
                  <div
                    className="h-2.5 bg-[#f5ed21] transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="mt-1.5 font-dm-sans text-[10px] text-zinc-300 font-bold tracking-widest">
                  {uploadProgress}% COMPLETE
                </span>
              </div>
            )}

            {/* AI Generation State */}
            {isGeneratingAICover ? (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <ImageGeneration
                  status="generating"
                  prompt={headline || "Creative Editorial Collage Zine Cover"}
                  resolution="1200 × 900"
                  label="AI generating vibrant collage artwork"
                  aspectRatio="4 / 3"
                  className="w-full h-full min-h-[340px]"
                />
              </div>
            ) : imageUrl && imageUrl.trim() !== "" ? (
              <img
                src={imageUrl}
                alt={headline || "Cover Collage"}
                className="w-full h-full object-cover min-h-[380px]"
              />
            ) : (
              /* Fallback Collage Graphic Art Canvas */
              <div className="w-full h-full relative flex flex-col justify-between p-8 min-h-[380px] select-none">
                {/* Vintage halftone / dot overlay inside poster */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: isDark
                      ? "radial-gradient(#ffffff 2px, transparent 2px)"
                      : "radial-gradient(#141414 2px, transparent 2px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="relative z-10 flex justify-between items-start">
                  <span
                    className={`font-dm-sans text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 border-2 tracking-wider ${
                      isDark
                        ? "bg-black text-[#f5ed21] border-[#f5ed21]"
                        : "bg-[#141414] text-white border-[#141414]"
                    }`}
                  >
                    VOL. {new Date().getFullYear()}
                  </span>
                  <span
                    className={`font-shrikhand text-sm uppercase px-2 py-0.5 ${
                      isDark ? "text-zinc-400" : "text-[#141414]"
                    }`}
                  >
                    #07
                  </span>
                </div>

                <div className="relative z-10 my-auto text-center py-6">
                  <div
                    className={`inline-block font-shrikhand text-4xl sm:text-6xl lg:text-7xl leading-[0.9] tracking-tight uppercase p-5 sm:p-7 border-2 ${
                      isDark
                        ? "bg-[#121319]/90 text-white border-[#2e303d] sticker-shadow-dark"
                        : "bg-white text-[#1554db] border-[#141414] sticker-shadow"
                    }`}
                  >
                    <span style={{ color: accentColor || "#1554db" }}>
                      CREATIVE
                    </span>
                    <br />
                    <span className="text-[#ff315b]">NOTES</span>
                  </div>
                </div>

                <div className="relative z-10 text-center">
                  <span
                    className={`inline-block font-dm-sans text-[11px] font-bold uppercase tracking-widest px-3 py-1 border-2 ${
                      isDark
                        ? "bg-[#252836] text-white border-[#2e303d]"
                        : "bg-[#f8f4e9] text-[#141414] border-[#141414]"
                    }`}
                  >
                    ★ ARCHIVE EDITION ★
                  </span>
                </div>
              </div>
            )}

            {/* Circular Tilted Sticker Badge */}
            <div
              className={`absolute top-6 left-6 rounded-full w-[100px] h-[100px] sm:w-[115px] sm:h-[115px] flex flex-col items-center justify-center text-center font-dm-sans font-black text-[11px] sm:text-[12px] leading-tight select-none border-2 transition-transform duration-300 hover:scale-105 ${
                isDark
                  ? "bg-[#ff3366] text-white border-[#2e303d] sticker-shadow-dark"
                  : "bg-[#ff4d73] text-white border-[#141414] sticker-shadow"
              }`}
              style={{
                transform: "rotate(-10deg)",
              }}
            >
              <span>FREE</span>
              <span>48-PAGE</span>
              <span>EDITION!</span>
            </div>

            {/* Editor Image Hover Overlay & Controls */}
            {isEditor && (
              <div className="absolute inset-0 z-30 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                <p className="text-white font-dm-sans text-xs font-bold uppercase tracking-wider mb-1">
                  Cover Visual Controls
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs">
                  <button
                    type="button"
                    onClick={() => fileInputRef?.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#f5ed21] hover:bg-[#e5dd15] text-[#141414] font-dm-sans text-xs font-bold uppercase border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Upload Image</span>
                  </button>

                  {imageUrl && setImageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-dm-sans text-xs font-bold uppercase border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Copy / Narrative */}
          <div
            className={`p-6 sm:p-10 lg:p-12 flex flex-col justify-between transition-colors ${
              isDark ? "bg-[#15161d]" : "bg-[#f8f4e9]"
            }`}
          >
            <div>
              {/* Taped Category Badge */}
              <div className="mb-6 inline-block">
                {isEditor ? (
                  <input
                    type="text"
                    value={bulletsTitle || ""}
                    onChange={(e) => setBulletsTitle?.(e.target.value)}
                    placeholder="A PLAYBOOK FOR PEOPLE WITH IDEAS"
                    className="font-dm-sans inline-block px-3 py-1.5 text-[11px] font-extrabold tracking-wide uppercase border-2 border-[#141414] outline-none shadow-[2px_2px_0px_#141414] text-[#141414] bg-[#f5ed21]"
                    style={{
                      transform: "rotate(2deg)",
                      width: `${Math.max((bulletsTitle || "A PLAYBOOK FOR PEOPLE WITH IDEAS").length + 2, 34)}ch`,
                      maxWidth: "100%",
                    }}
                  />
                ) : (
                  <span
                    className="font-dm-sans inline-block px-3 py-1.5 text-[11px] font-extrabold tracking-wide uppercase border-2 border-[#141414] shadow-[2px_2px_0px_#141414] text-[#141414] bg-[#f5ed21]"
                    style={{
                      transform: "rotate(2deg)",
                    }}
                  >
                    {bulletsTitle || "A PLAYBOOK FOR PEOPLE WITH IDEAS"}
                  </span>
                )}
              </div>

              {/* Headline */}
              {isEditor ? (
                <textarea
                  ref={setHeadlineTextareaRef}
                  value={headline || ""}
                  onChange={(e) => {
                    setHeadline?.(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Make Your Work Impossible to Ignore."
                  rows={1}
                  className={`font-shrikhand w-full text-4xl sm:text-5xl md:text-6xl lg:text-[62px] xl:text-[72px] leading-[0.92] tracking-tight bg-transparent outline-none resize-none mb-4 overflow-hidden placeholder:opacity-30 ${
                    isDark ? "text-white" : "text-[#1554db]"
                  }`}
                  style={{
                    overflowWrap: "anywhere",
                    color: accentColor || "#1554db",
                  }}
                />
              ) : (
                <h1
                  className={`font-shrikhand text-4xl sm:text-5xl md:text-6xl lg:text-[62px] xl:text-[72px] leading-[0.92] tracking-tight mb-4`}
                  style={{
                    overflowWrap: "anywhere",
                    color: accentColor || "#1554db",
                  }}
                >
                  {headline ? (
                    headline.includes("Impossible") ? (
                      <>
                        {headline.split("Impossible")[0]}
                        <span className="text-[#ff315b]">Impossible</span>
                        {headline.split("Impossible")[1]}
                      </>
                    ) : (
                      headline
                    )
                  ) : (
                    <>
                      Make Your Work <span className="text-[#ff315b]">Impossible</span> to Ignore.
                    </>
                  )}
                </h1>
              )}

              {/* Subheadline & Pitch Paragraph */}
              {isEditor ? (
                <textarea
                  ref={setSubheadlineTextareaRef}
                  value={subheadline || pitch || ""}
                  onChange={(e) => {
                    setSubheadline?.(e.target.value);
                    setPitch?.(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="Twenty-one unconventional prompts, narrative tricks, and visual systems for turning 'pretty good' into unmistakably yours."
                  rows={1}
                  className={`font-dm-sans w-full text-base sm:text-lg leading-relaxed bg-transparent outline-none resize-none max-w-[560px] overflow-hidden font-medium placeholder:opacity-75 ${
                    isDark ? "text-zinc-300 placeholder:text-zinc-300/75" : "text-[#141414] placeholder:text-[#141414]/75"
                  }`}
                />
              ) : (
                <p
                  className={`font-dm-sans text-base sm:text-lg leading-relaxed max-w-[560px] font-medium ${
                    isDark ? "text-zinc-300" : "text-[#141414]"
                  }`}
                >
                  {subheadline ||
                    pitch ||
                    "Twenty-one unconventional prompts, narrative tricks, and visual systems for turning 'pretty good' into unmistakably yours."}
                </p>
              )}
            </div>

            {/* Micro Badge */}
            <div
              className={`pt-6 mt-6 border-t-2 text-[10px] font-dm-sans font-bold uppercase tracking-widest flex items-center justify-between ${
                isDark ? "border-[#2e303d] text-zinc-500" : "border-[#141414]/15 text-[#141414]/60"
              }`}
            >
              <span>ZINE DISPATCH · UNRESTRICTED ACCESS</span>
              <span>EST. {new Date().getFullYear()}</span>
            </div>
          </div>
        </section>

        {/* 3. BOTTOM SECTION: 3 BITS (LEFT) + SIGNUP CARD (RIGHT) */}
        <section
          className={`grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] border-t-2 transition-colors ${
            isDark ? "border-[#2e303d]" : "border-[#141414]"
          }`}
        >
          {/* Left Column: Bits / Features */}
          <div
            className={`border-b-2 lg:border-b-0 lg:border-r-2 flex flex-col justify-between transition-colors ${
              isDark ? "border-[#2e303d] bg-[#121319]" : "border-[#141414] bg-[#f8f4e9]"
            }`}
          >
            {currentBullets.length > 0 ? (
              <div
                className={`grid grid-cols-1 ${
                  currentBullets.length === 1
                    ? "md:grid-cols-1"
                    : currentBullets.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-3"
                } h-full`}
              >
                {currentBullets.map((bullet, idx) => {
                  const parsed = parseBullet(bullet, idx);
                  const isNumHidden = parsed.num === "__none__";
                  const displayNum = isNumHidden ? "" : (parsed.num || (idx + 1).toString().padStart(2, "0"));

                  return (
                    <article
                      key={idx}
                      className={`p-6 sm:p-7 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 last:border-r-0 relative group transition-colors ${
                        isDark ? "border-[#2e303d]" : "border-[#141414]"
                      }`}
                    >
                      <div>
                        {/* Number & Trash Action */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          {isEditor ? (
                            <input
                              type="text"
                              value={displayNum}
                              onChange={(e) => handleBulletNumberChange(idx, e.target.value)}
                              placeholder="01"
                              className="font-shrikhand text-2xl sm:text-3xl text-[#ff315b] bg-transparent outline-none w-24 placeholder:text-[#ff315b]/30"
                              title="Edit number, or delete/backspace to remove it"
                            />
                          ) : (
                            !isNumHidden && displayNum && (
                              <b className="font-shrikhand text-2xl sm:text-3xl text-[#ff315b] block">
                                {displayNum}
                              </b>
                            )
                          )}

                          {isEditor && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBullet(idx)}
                              className="p-1 rounded text-red-500 hover:bg-red-500/10 opacity-40 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Delete this card"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Title */}
                        {isEditor ? (
                          <input
                            type="text"
                            value={parsed.title}
                            onChange={(e) => handleBulletTitleChange(idx, e.target.value)}
                            placeholder="Feature title"
                            className={`font-dm-sans text-sm sm:text-base font-bold bg-transparent outline-none w-full mb-1.5 ${
                              isDark ? "text-white" : "text-[#141414]"
                            }`}
                          />
                        ) : (
                          <h3
                            className={`font-dm-sans text-sm sm:text-base font-bold mb-1.5 ${
                              isDark ? "text-white" : "text-[#141414]"
                            }`}
                          >
                            {parsed.title || `Framework ${(idx + 1).toString().padStart(2, "0")}`}
                          </h3>
                        )}

                        {/* Description */}
                        {isEditor ? (
                          <textarea
                            rows={2}
                            value={parsed.desc}
                            onChange={(e) => handleBulletDescChange(idx, e.target.value)}
                            placeholder="Description of this idea..."
                            className={`font-dm-sans text-xs leading-relaxed bg-transparent outline-none resize-none w-full ${
                              isDark ? "text-zinc-400" : "text-[#141414]/80"
                            }`}
                          />
                        ) : (
                          <p
                            className={`font-dm-sans text-xs leading-relaxed ${
                              isDark ? "text-zinc-400" : "text-[#141414]/80"
                            }`}
                          >
                            {parsed.desc || "A tactical framework designed to deliver instant clarity and execution momentum."}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              isEditor && (
                <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
                  <p className="text-xs font-dm-sans font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    No note cards added
                  </p>
                </div>
              )
            )}

            {/* Editor: Add Bit Button */}
            {isEditor && currentBullets.length < 6 && (
              <div
                className={`p-3 border-t-2 text-center ${
                  isDark ? "border-[#2e303d] bg-[#171822]" : "border-[#141414] bg-[#eee9df]"
                }`}
              >
                <button
                  type="button"
                  onClick={handleAddBullet}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold font-dm-sans uppercase border border-dashed border-current hover:opacity-80 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another Note / Bit</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: High-Impact Signup Box */}
          <aside
            className={`p-6 sm:p-8 xl:p-10 flex flex-col justify-between transition-colors ${
              isDark
                ? "bg-[#181a24] text-white"
                : "text-white"
            }`}
            style={{
              backgroundColor: accentColor || "#1554db",
              color: "#ffffff",
            }}
          >
            <div>
              {/* Form Title */}
              {isEditor ? (
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  placeholder="Want the zine?"
                  className="font-shrikhand text-2xl sm:text-3xl xl:text-4xl text-white bg-transparent outline-none w-full mb-1.5 placeholder:text-white/40"
                  style={{ color: "#ffffff" }}
                />
              ) : (
                <h2 className="font-shrikhand text-2xl sm:text-3xl xl:text-4xl text-white mb-1.5" style={{ color: "#ffffff" }}>
                  {formTitle || "Want the zine?"}
                </h2>
              )}

              {/* Form Subtitle */}
              {isEditor ? (
                <input
                  type="text"
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  placeholder="We'll send it now. Occasional notes later."
                  className="font-dm-sans text-xs sm:text-sm text-white/90 bg-transparent outline-none w-full mb-5 placeholder:text-white/40"
                  style={{ color: "rgba(255, 255, 255, 0.9)" }}
                />
              ) : (
                <p className="font-dm-sans text-xs sm:text-sm text-white/90 mb-5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  {formSubtitle || "We'll send it now. Occasional notes later."}
                </p>
              )}

              {/* Form Fields */}
              {isEditor ? (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    readOnly
                    placeholder="YOUR NAME"
                    className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                  />
                  <input
                    type="email"
                    readOnly
                    placeholder="EMAIL@ADDRESS.COM"
                    className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                  />

                  {customFormFields &&
                    customFormFields.map((cf: any, i: number) => (
                      <input
                        key={i}
                        type="text"
                        readOnly
                        placeholder={cf.label ? cf.label.toUpperCase() : "CUSTOM FIELD"}
                        className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                      />
                    ))}

                  <div className="pt-2">
                    <button
                      type="button"
                      className={`w-full border-2 border-[#141414] bg-[#f5ed21] text-[#141414] p-3.5 font-dm-sans font-extrabold text-xs sm:text-sm tracking-wider uppercase btn-shadow cursor-pointer transition-all ${
                        isDark ? "btn-shadow-dark btn-active-dark" : "btn-shadow btn-active"
                      }`}
                    >
                      {formButtonText || "YES, SEND IT! ↗"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmitPublicForm} className="space-y-2.5">
                  <input
                    required
                    type="text"
                    disabled={isSubmitting}
                    value={publicFormValues.name || ""}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder="YOUR NAME"
                    className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                  />
                  <input
                    required
                    type="email"
                    disabled={isSubmitting}
                    value={publicFormValues.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="EMAIL@ADDRESS.COM"
                    className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                  />

                  {/* Custom Fields */}
                  {customFormFields &&
                    customFormFields.map((field: any) => (
                      <div key={field.id}>
                        {field.type === "textarea" ? (
                          <textarea
                            rows={2}
                            required={field.required}
                            disabled={isSubmitting}
                            value={publicFormValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={`${field.label?.toUpperCase() || "DETAILS"}${field.required ? " *" : ""}`}
                            className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none resize-none"
                          />
                        ) : field.type === "select" ? (
                          <select
                            required={field.required}
                            disabled={isSubmitting}
                            value={publicFormValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] outline-none"
                          >
                            <option value="">
                              {`${field.label?.toUpperCase() || "SELECT OPTION"}${field.required ? " *" : ""}`}
                            </option>
                            {(field.options || []).map((opt: string, idx: number) => (
                              <option key={idx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type || "text"}
                            required={field.required}
                            disabled={isSubmitting}
                            value={publicFormValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={`${field.label?.toUpperCase() || "CUSTOM FIELD"}${field.required ? " *" : ""}`}
                            className="block w-full border-2 border-[#141414] p-3 text-xs font-dm-sans font-bold bg-white text-[#141414] placeholder:text-[#141414]/50 outline-none"
                          />
                        )}
                      </div>
                    ))}

                  {errorMsg && (
                    <div className="p-2 border-2 border-red-500 bg-red-100 text-red-700 text-xs font-bold font-dm-sans">
                      {errorMsg}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2 border-2 border-emerald-500 bg-emerald-100 text-emerald-800 text-xs font-bold font-dm-sans">
                      {successMsg}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full border-2 border-[#141414] bg-[#f5ed21] hover:bg-[#faea00] text-[#141414] p-3.5 font-dm-sans font-extrabold text-xs sm:text-sm tracking-wider uppercase btn-shadow cursor-pointer transition-all disabled:opacity-50 ${
                        isDark ? "btn-shadow-dark btn-active-dark" : "btn-shadow btn-active"
                      }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#141414]" />
                          <span>SENDING YOUR ZINE...</span>
                        </span>
                      ) : (
                        formButtonText || "YES, SEND IT! ↗"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Anti-spam footer */}
            <div className="pt-4 mt-4 border-t border-white/20 text-[9px] font-dm-sans font-bold uppercase tracking-wider text-white/70 flex justify-between items-center">
              <span>🔒 NO SPAM PROMISE</span>
              <span>INSTANT DELIVERY</span>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

import React from "react";
import {
  Loader2,
  Trash2,
  Plus,
  UploadCloud,
  Sparkles,
  Quote as QuoteIcon,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { type TemplateProps } from "./types";
import { ImageGeneration } from "@/components/agents/image-generation";

export default function Template9(props: TemplateProps) {
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

  const brandColor = account?.brandColor || props.brandColor || "#7c3aed";
  const themeMode = account?.themeMode || props.themeMode || "dark";
  const isDark = themeMode !== "light"; // Glass Aurora defaults to lush dark aurora atmosphere
  const businessName = account?.brandName || account?.name || "The Executive Dispatch";
  const logo = account?.logo || (account as any)?.avatar;

  // Extract initials for logo mark if no logo image
  const getInitials = (name: string) => {
    if (!name) return "ED";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const logoInitials = getInitials(businessName);

  // Default bullet items matching the Glass Aurora reference
  const defaultBullets = [
    "01:::The Signal-to-Noise Protocol:::Audit attention and eliminate low-leverage activities through the Four Filters.",
    "02:::Recursive Hiring Loops:::Build a talent engine that identifies multipliers before they reach the market.",
    "03:::Velocity Without Chaos:::Replace recurring meetings with lightweight synchronization rituals.",
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
    setBullets([
      ...currentBullets,
      `${num}:::Core Directive ${num}:::Key operational architecture designed for instant momentum.`,
    ]);
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

  return (
    <div
      className={`template9-root w-full min-h-full transition-colors duration-300 relative selection:bg-[#f0abfc] selection:text-[#2a1052] ${
        isDark ? "bg-[#191038] text-[#f4f2ff]" : "bg-[#140d2e] text-[#f4f2ff]"
      }`}
      style={{
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
            
            .template9-root * {
              box-sizing: border-box;
            }
            .glass-aurora-card {
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.18);
              border-radius: 26px;
              backdrop-filter: blur(22px);
              -webkit-backdrop-filter: blur(22px);
              box-shadow: 0 24px 70px rgba(10, 4, 40, 0.38);
            }
            .glass-aurora-input {
              width: 100%;
              padding: 13px 16px;
              background: rgba(12, 6, 40, 0.45);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 14px;
              outline: 0;
              color: #ffffff;
              font-family: 'Outfit', sans-serif;
              font-size: 14px;
              transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
            }
            .glass-aurora-input:focus {
              border-color: #f0abfc;
              background: rgba(12, 6, 40, 0.65);
              box-shadow: 0 0 0 3px rgba(240, 171, 252, 0.25);
            }
            .glass-aurora-input::placeholder {
              color: #9d94c8;
            }
            .glass-aurora-btn {
              width: 100%;
              border: 0;
              padding: 15px;
              border-radius: 14px;
              font-family: 'Outfit', sans-serif;
              font-weight: 700;
              font-size: 14px;
              color: #2a1052;
              cursor: pointer;
              background: linear-gradient(90deg, #c4b5fd, #f0abfc);
              box-shadow: 0 10px 25px -5px rgba(240, 171, 252, 0.4);
              transition: filter 0.2s, transform 0.15s, box-shadow 0.2s;
            }
            .glass-aurora-btn:hover {
              filter: brightness(1.08);
              transform: translateY(-1px);
              box-shadow: 0 14px 30px -5px rgba(240, 171, 252, 0.55);
            }
            .glass-aurora-btn:active {
              transform: translateY(1px);
              box-shadow: 0 5px 15px -3px rgba(240, 171, 252, 0.4);
            }
            @keyframes aurora-float {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-20px) scale(1.05); }
            }
            .aurora-orb {
              animation: aurora-float 12s ease-in-out infinite alternate;
            }
          `,
        }}
      />

      {/* Aurora Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none">
        <div className="absolute inset-0 bg-[#191038]" />
        <i
          className="aurora-orb absolute rounded-full opacity-75"
          style={{
            width: "560px",
            height: "560px",
            background: "#7c3aed",
            filter: "blur(100px)",
            top: "-160px",
            left: "-120px",
          }}
        />
        <i
          className="aurora-orb absolute rounded-full opacity-75"
          style={{
            width: "480px",
            height: "480px",
            background: "#ec4899",
            filter: "blur(95px)",
            top: "22%",
            right: "-140px",
            animationDelay: "-3s",
          }}
        />
        <i
          className="aurora-orb absolute rounded-full opacity-75"
          style={{
            width: "460px",
            height: "460px",
            background: "#22d3ee",
            filter: "blur(90px)",
            bottom: "-160px",
            left: "30%",
            animationDelay: "-6s",
          }}
        />
        <i
          className="aurora-orb absolute rounded-full opacity-55"
          style={{
            width: "380px",
            height: "380px",
            background: "#4f46e5",
            filter: "blur(85px)",
            top: "40%",
            left: "12%",
            animationDelay: "-9s",
          }}
        />
        {/* Subtle Grain & Vignette Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1000px 500px at 50% -10%, rgba(255, 255, 255, 0.08), transparent 70%)",
          }}
        />
      </div>

      {/* Page Canvas Container */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-9 relative z-10">
        {/* 1. Glass Navbar */}
        <header className="glass-aurora-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 px-5 py-3.5 sm:px-6 sm:py-4 mb-7 sm:mb-9 transition-all">
          <div className="flex items-center gap-3.5">
            {logo ? (
              <img
                src={logo}
                alt="Brand Logo"
                className="w-10 h-10 rounded-xl object-cover border border-white/25 shadow-md shrink-0"
              />
            ) : (
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#f472b6] flex items-center justify-center font-extrabold text-sm text-white shadow-md shrink-0">
                {logoInitials}
              </span>
            )}
            <div>
              {isEditor ? (
                <input
                  type="text"
                  value={mastheadLeft !== undefined ? mastheadLeft : businessName}
                  onChange={(e) => setMastheadLeft?.(e.target.value)}
                  placeholder="The Executive Dispatch"
                  className="font-bold text-base sm:text-lg tracking-wide text-white bg-transparent outline-none w-full border-b border-white/10 focus:border-white/40"
                />
              ) : (
                <div className="font-bold text-base sm:text-lg tracking-wide text-white">
                  {mastheadLeft || businessName}
                </div>
              )}

              {isEditor ? (
                <input
                  type="text"
                  value={mastheadRight !== undefined ? mastheadRight : ""}
                  onChange={(e) => setMastheadRight?.(e.target.value)}
                  placeholder="Intelligence Report · Issue 08 · 2026"
                  className="block font-normal text-[10px] tracking-[0.18em] uppercase text-[#cfc8f2] bg-transparent outline-none mt-0.5 w-full border-b border-transparent hover:border-white/20 focus:border-white/40"
                />
              ) : (
                <small className="block font-normal text-[10.5px] tracking-[0.18em] uppercase text-[#cfc8f2] mt-0.5">
                  {mastheadRight || "Intelligence Report · Issue 08 · 2026"}
                </small>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="px-4 py-2 rounded-full border border-white/25 text-xs font-semibold bg-white/10 text-white backdrop-blur-md whitespace-nowrap shadow-xs">
              {deliverable ? `${deliverable} edition` : "Complimentary edition"}
            </span>
          </div>
        </header>

        {/* 2. Main Glass Hero Section */}
        <main className="glass-aurora-card p-6 sm:p-9 md:p-11 lg:p-12 relative overflow-hidden">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/22 bg-white/9 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#e6e0ff] backdrop-blur-md mb-6">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80] animate-pulse" />
            {isEditor ? (
              <input
                type="text"
                value={bulletsTitle || ""}
                onChange={(e) => setBulletsTitle?.(e.target.value)}
                placeholder="Strategic framework · 42 pages"
                className="bg-transparent outline-none text-[11px] font-semibold tracking-[0.18em] uppercase text-[#e6e0ff] w-48 sm:w-64"
              />
            ) : (
              <span>{bulletsTitle || "Strategic framework · 42 pages"}</span>
            )}
          </div>

          {/* Two Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-9 lg:gap-12 items-start">
            {/* Left Column: Headline, Lead, Bullets, Quote */}
            <section className="flex flex-col">
              {/* Headline */}
              {isEditor ? (
                <textarea
                  ref={setHeadlineTextareaRef}
                  value={headline || ""}
                  onChange={(e) => {
                    setHeadline?.(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="The Architecture of High-Output Engineering"
                  rows={1}
                  className="w-full text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.05] tracking-[-0.025em] bg-transparent text-white outline-none resize-none mb-4 overflow-hidden placeholder:text-white/30"
                />
              ) : (
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.05] tracking-[-0.025em] mb-4 text-white">
                  {headline ? (
                    headline.includes("High-Output") ? (
                      <>
                        {headline.split("High-Output")[0]}
                        <span className="bg-gradient-to-r from-[#a5b4fc] via-[#f0abfc] to-[#67e8f9] bg-clip-text text-transparent">
                          High-Output
                        </span>
                        {headline.split("High-Output")[1]}
                      </>
                    ) : (
                      headline
                    )
                  ) : (
                    <>
                      The Architecture of{" "}
                      <span className="bg-gradient-to-r from-[#a5b4fc] via-[#f0abfc] to-[#67e8f9] bg-clip-text text-transparent">
                        High-Output
                      </span>{" "}
                      Engineering
                    </>
                  )}
                </h1>
              )}

              {/* Lead / Subheadline */}
              {isEditor ? (
                <textarea
                  ref={setSubheadlineTextareaRef}
                  value={subheadline || pitch || ""}
                  onChange={(e) => {
                    setSubheadline?.(e.target.value);
                    setPitch?.(e.target.value);
                    autoResizeTextarea(e.currentTarget);
                  }}
                  placeholder="A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."
                  rows={1}
                  className="w-full text-base sm:text-[15.5px] font-light leading-[1.75] text-[#d9d3f5] bg-transparent outline-none resize-none max-w-[540px] overflow-hidden placeholder:text-[#d9d3f5]/50 mb-7"
                />
              ) : (
                <p className="text-base sm:text-[15.5px] font-light leading-[1.75] text-[#d9d3f5] max-w-[540px] mb-7">
                  {subheadline ||
                    pitch ||
                    "A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."}
                </p>
              )}

              {/* Framework List / Bullets */}
              <div className="space-y-3 mt-2">
                {currentBullets.map((bullet, idx) => {
                  const parsed = parseBullet(bullet, idx);
                  const isNumHidden = parsed.num === "__none__";
                  const displayNum = isNumHidden
                    ? ""
                    : parsed.num || (idx + 1).toString().padStart(2, "0");

                  return (
                    <div
                      key={idx}
                      className="flex gap-3.5 items-start p-3.5 sm:p-4 rounded-[18px] border border-white/14 bg-white/6 backdrop-blur-md relative group transition-all hover:bg-white/9 hover:border-white/20"
                    >
                      {/* Gradient Number Badge */}
                      {isEditor ? (
                        <input
                          type="text"
                          value={displayNum}
                          onChange={(e) => handleBulletNumberChange(idx, e.target.value)}
                          placeholder="01"
                          className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#a78bfa] to-[#f472b6] flex items-center justify-center font-extrabold text-xs text-white text-center outline-none shrink-0"
                          title="Edit step number"
                        />
                      ) : (
                        !isNumHidden &&
                        displayNum && (
                          <span className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#a78bfa] to-[#f472b6] flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-sm">
                            {displayNum}
                          </span>
                        )
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        {isEditor ? (
                          <>
                            <input
                              type="text"
                              value={parsed.title}
                              onChange={(e) => handleBulletTitleChange(idx, e.target.value)}
                              placeholder="Framework directive title"
                              className="block font-semibold text-[14.5px] text-white bg-transparent outline-none w-full border-b border-transparent hover:border-white/20 focus:border-[#f0abfc]"
                            />
                            <textarea
                              rows={2}
                              value={parsed.desc}
                              onChange={(e) => handleBulletDescChange(idx, e.target.value)}
                              placeholder="Actionable takeaway or methodology..."
                              className="block font-light text-[12.5px] leading-[1.55] text-[#c4bce8] bg-transparent outline-none resize-none w-full mt-1 border-b border-transparent hover:border-white/20 focus:border-[#f0abfc]"
                            />
                          </>
                        ) : (
                          <>
                            <b className="block font-semibold text-[14.5px] text-white">
                              {parsed.title || `Protocol ${(idx + 1).toString().padStart(2, "0")}`}
                            </b>
                            <span className="block font-light text-[12.5px] leading-[1.55] text-[#c4bce8] mt-0.5">
                              {parsed.desc ||
                                "Audit attention and eliminate low-leverage activities through the Four Filters."}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Editor Remove Bullet */}
                      {isEditor && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(idx)}
                          className="absolute top-3 right-3 p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete protocol item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Editor Add Bullet Button */}
                {isEditor && (
                  <button
                    type="button"
                    onClick={handleAddBullet}
                    className="w-full py-2.5 px-4 rounded-[14px] border border-dashed border-white/20 hover:border-white/40 text-xs font-semibold text-[#cfc8f2] hover:text-white flex items-center justify-center gap-1.5 transition-all bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Protocol Point</span>
                  </button>
                )}
              </div>

              {/* Quote / Testimonial Card */}
              <div className="mt-6 p-5 sm:p-6 rounded-[18px] border border-white/14 bg-white/6 backdrop-blur-md relative">
                <QuoteIcon className="h-5 w-5 text-[#f0abfc]/40 mb-2" />
                <p className="font-light italic text-[13.5px] leading-[1.7] text-[#e2dcf9] m-0">
                  “Speed is often a byproduct of clarity. Build the infrastructure that makes high performance inevitable.”
                </p>
                <small className="block mt-2.5 font-semibold text-[10px] tracking-[0.16em] uppercase text-[#b1a7dd]">
                  {businessName} · Strategic Intelligence
                </small>
              </div>
            </section>

            {/* Right Column: Media Artwork & Glass Signup Form */}
            <aside className="flex flex-col">
              {/* Media Card / Cover */}
              <div className="relative rounded-[20px] overflow-hidden border border-white/22 group shadow-xl bg-[#140d2e]">
                {isGeneratingAICover ? (
                  <div className="w-full aspect-[3/2] p-4 flex items-center justify-center">
                    <ImageGeneration
                      status="generating"
                      prompt={headline || "Futuristic iridescent glass sculpture report cover"}
                      resolution="1200 × 800"
                      label="AI rendering iridescent aurora cover"
                      aspectRatio="3 / 2"
                      className="w-full h-full min-h-[260px]"
                    />
                  </div>
                ) : imageUrl && imageUrl.trim() !== "" ? (
                  <img
                    src={imageUrl}
                    alt={headline || "Report Visual"}
                    className="w-full aspect-[3/2] object-cover block"
                  />
                ) : (
                  /* Fallback Radiant Glass Aurora Visual */
                  <div className="w-full aspect-[3/2] min-h-[260px] relative flex flex-col justify-between p-6 select-none bg-gradient-to-br from-[#2a1354] via-[#1a0f3d] to-[#0c0628] overflow-hidden">
                    {/* Glowing glass geometric orb graphics */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#f472b6] opacity-30 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-gradient-to-tr from-[#22d3ee] to-[#7c3aed] opacity-30 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex justify-between items-center">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 text-[#e6e0ff] backdrop-blur-md">
                        VOL. {new Date().getFullYear()}
                      </span>
                      <span className="text-[11px] font-mono tracking-widest text-[#f0abfc] font-bold">
                        ISSUE 08
                      </span>
                    </div>

                    <div className="relative z-10 my-auto py-3 text-center">
                      <div className="inline-block px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/25 shadow-lg">
                        <span className="block text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#a5b4fc] via-[#f0abfc] to-[#67e8f9] bg-clip-text text-transparent">
                          AURORA FIELD REPORT
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 text-center">
                      <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#cfc8f2]">
                        ★ SPECIAL EXECUTIVE BRIEFING ★
                      </span>
                    </div>
                  </div>
                )}

                {/* Editor Cover Visual Controls */}
                {isEditor && (
                  <div className="absolute inset-0 z-30 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <p className="text-white text-xs font-bold uppercase tracking-wider mb-1">
                      Cover Visual Controls
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs">
                      <button
                        type="button"
                        onClick={() => fileInputRef?.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#a78bfa] to-[#f472b6] text-white text-xs font-bold rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Upload</span>
                      </button>

                      {imageUrl && setImageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl(null)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Glass Signup Card */}
              <div className="glass-aurora-card p-6 sm:p-7 mt-6 relative">
                {/* Form Title */}
                {isEditor ? (
                  <input
                    type="text"
                    value={formTitle || ""}
                    onChange={(e) => setFormTitle?.(e.target.value)}
                    placeholder="Get the full report"
                    className="text-xl sm:text-2xl font-bold text-white bg-transparent outline-none w-full mb-1 placeholder:text-white/40 border-b border-transparent hover:border-white/20 focus:border-[#f0abfc]"
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {formTitle || "Get the full report"}
                  </h2>
                )}

                {/* Form Subtitle */}
                {isEditor ? (
                  <input
                    type="text"
                    value={formSubtitle || ""}
                    onChange={(e) => setFormSubtitle?.(e.target.value)}
                    placeholder="The PDF and supplemental worksheets will arrive directly in your inbox."
                    className="text-[12.5px] font-light leading-[1.6] text-[#c4bce8] bg-transparent outline-none w-full mb-5 placeholder:text-[#c4bce8]/40 border-b border-transparent hover:border-white/20 focus:border-[#f0abfc]"
                  />
                ) : (
                  <p className="text-[12.5px] font-light leading-[1.6] text-[#c4bce8] mb-5">
                    {formSubtitle || "The PDF and supplemental worksheets will arrive directly in your inbox."}
                  </p>
                )}

                {/* Form Fields */}
                {isEditor ? (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        readOnly
                        placeholder="Full name"
                        className="glass-aurora-input cursor-default"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        readOnly
                        placeholder="Work email"
                        className="glass-aurora-input cursor-default"
                      />
                    </div>

                    {customFormFields &&
                      customFormFields.map((cf: any, i: number) => (
                        <div key={i}>
                          <input
                            type="text"
                            readOnly
                            placeholder={cf.label || "Custom Field"}
                            className="glass-aurora-input cursor-default"
                          />
                        </div>
                      ))}

                    <div className="pt-2">
                      <button
                        type="button"
                        className="glass-aurora-btn cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>{formButtonText || "Receive the dispatch →"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmitPublicForm} className="space-y-3">
                    <div>
                      <input
                        required
                        type="text"
                        disabled={isSubmitting}
                        value={publicFormValues.name || ""}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        placeholder="Full name"
                        className="glass-aurora-input"
                      />
                    </div>
                    <div>
                      <input
                        required
                        type="email"
                        disabled={isSubmitting}
                        value={publicFormValues.email || ""}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        placeholder="Work email"
                        className="glass-aurora-input"
                      />
                    </div>

                    {/* Dynamic Custom Fields */}
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
                              placeholder={`${field.label || "Details"}${field.required ? " *" : ""}`}
                              className="glass-aurora-input resize-none"
                            />
                          ) : field.type === "select" ? (
                            <select
                              required={field.required}
                              disabled={isSubmitting}
                              value={publicFormValues[field.id] || ""}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              className="glass-aurora-input text-white"
                            >
                              <option value="" className="bg-[#191038] text-white">
                                {`${field.label || "Select option"}${field.required ? " *" : ""}`}
                              </option>
                              {(field.options || []).map((opt: string, idx: number) => (
                                <option key={idx} value={opt} className="bg-[#191038] text-white">
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
                              placeholder={`${field.label || "Custom field"}${field.required ? " *" : ""}`}
                              className="glass-aurora-input"
                            />
                          )}
                        </div>
                      ))}

                    {errorMsg && (
                      <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-red-200 text-xs font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    {successMsg && (
                      <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-200 text-xs font-semibold">
                        {successMsg}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="glass-aurora-btn flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-[#2a1052]" />
                            <span>Securing your dispatch...</span>
                          </>
                        ) : (
                          <span>{formButtonText || "Receive the dispatch →"}</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Fine print */}
                <p className="text-center text-[10.5px] font-light text-[#a89fd0] mt-3.5 mb-0">
                  No noise. Only occasional, high-signal notes.
                </p>
              </div>
            </aside>
          </div>
        </main>

        {/* 3. Glass Footer */}
        <footer className="glass-aurora-card mt-7 sm:mt-8 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[10.5px] font-normal tracking-[0.12em] uppercase text-[#b1a7dd]">
          <span>© {new Date().getFullYear()} {businessName} · Private circulation</span>
          <span>By {businessName} Strategic Partners</span>
        </footer>
      </div>
    </div>
  );
}

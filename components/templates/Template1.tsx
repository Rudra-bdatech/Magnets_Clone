import React from "react";
import { Check, ImageIcon, Trash2, Plus, X, Loader2 } from "lucide-react";
import { type TemplateProps } from "./types";
import { ImageGeneration } from "@/components/agents/image-generation";

export default function Template1(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets = [],
    bulletsTitle,
    mastheadLeft,
    mastheadRight,
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
    setBullets,
    setBulletsTitle,
    setMastheadLeft,
    setMastheadRight,
    setFormTitle,
    setFormSubtitle,
    setImageUrl,
    setFormButtonText,
    mode = "editor",
    isSubmitting = false,
    publicFormValues = {},
    setPublicFormValues,
    onSubmitPublicForm,
  } = props as any;

  const rawProps = props as any;
  const isEditor = props.mode ? props.mode === "editor" : rawProps.isEditor !== false;

  const brandColor = account?.brandColor || props.brandColor || "#fb4d6a";
  const accentColor = brandColor;
  const themeMode = account?.themeMode || props.themeMode || "dark";
  const isDark = themeMode === "dark";
  const logo = account?.logo || null;
  const businessName = account?.brandName || account?.name || "The Executive Dispatch";
  const currentYear = new Date().getFullYear();

  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return "ED";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(businessName);

  // Auto-resize textareas so editor matches read-only paragraph heights exactly
  React.useEffect(() => {
    if (headlineRef?.current) {
      headlineRef.current.style.height = "auto";
      headlineRef.current.style.height = `${headlineRef.current.scrollHeight}px`;
    }
    if (subheadlineRef?.current) {
      subheadlineRef.current.style.height = "auto";
      subheadlineRef.current.style.height = `${subheadlineRef.current.scrollHeight}px`;
    }
    if (pitchRef?.current) {
      pitchRef.current.style.height = "auto";
      pitchRef.current.style.height = `${pitchRef.current.scrollHeight}px`;
    }
  }, [headline, subheadline, pitch, headlineRef, subheadlineRef, pitchRef]);

  // Default bullets matching Template 10 — Premium Night reference
  const defaultBulletPlaceholders = [
    {
      title: "The Signal-to-Noise Protocol",
      desc: "Audit attention and eliminate low-leverage activities through the Four Filters.",
    },
    {
      title: "Recursive Hiring Loops",
      desc: "Build a talent engine that identifies multipliers before they reach the market.",
    },
    {
      title: "Velocity Without Chaos",
      desc: "Replace recurring meetings with lightweight synchronization rituals.",
    },
  ];

  const defaultBullets = defaultBulletPlaceholders.map(
    (b) => `${b.title} — ${b.desc}`
  );

  const isBulletsHidden =
    Array.isArray(bullets) && bullets.length === 1 && bullets[0] === "__hidden__";
  const hasCustomBullets = Array.isArray(bullets) && bullets.length > 0 && !isBulletsHidden;
  const currentBullets: string[] = isBulletsHidden
    ? []
    : hasCustomBullets
    ? bullets
    : isEditor
    ? ["", "", ""]
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
    const title = parsed.title;
    next[index] = title ? `${title} — ${newDesc}` : `— ${newDesc}`;
    setBullets(next);
  };

  const handleAddBullet = () => {
    if (!setBullets) return;
    const baseList = currentBullets.length > 0 ? currentBullets : [];
    setBullets([...baseList, ""]);
  };

  const handleRemoveBullet = (index: number) => {
    if (!setBullets) return;
    const next = currentBullets.filter((_, i) => i !== index);
    setBullets(next.length === 0 ? ["__hidden__"] : next);
  };

  // Quote / Pitch parsing
  const defaultQuote =
    "“Speed is often a byproduct of clarity. Build the infrastructure that makes high performance inevitable.”";
  const defaultAuthor = `${account?.name || "Marcus Vane"} · Founder, Arca`;

  const parsePitch = (raw: string | undefined) => {
    if (!raw || !raw.trim()) {
      return { quote: "", author: "" };
    }
    if (raw.includes(":::")) {
      const [q, ...a] = raw.split(":::");
      return { quote: q.trim(), author: a.join(":::").trim() };
    }
    if (raw.includes("\n—") || raw.includes("\n-") || raw.includes("\n–")) {
      const parts = raw.split(/\n[—–-]\s*/);
      return { quote: parts[0].trim(), author: parts.slice(1).join(" ").trim() };
    }
    if (raw.includes(" — ")) {
      const parts = raw.split(" — ");
      return { quote: parts[0].trim(), author: parts.slice(1).join(" — ").trim() };
    }
    return { quote: raw.trim(), author: "" };
  };

  const { quote: parsedQuote, author: parsedAuthor } = parsePitch(pitch);

  const handleQuoteChange = (newQuote: string) => {
    if (!setPitch) return;
    setPitch(parsedAuthor ? `${newQuote} ::: ${parsedAuthor}` : newQuote);
  };

  const handleAuthorChange = (newAuthor: string) => {
    if (!setPitch) return;
    setPitch(`${parsedQuote} ::: ${newAuthor}`);
  };

  // Cover image fallback
  const defaultCoverImage =
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80";
  const coverImage = imageUrl && imageUrl.trim() !== "" ? imageUrl : defaultCoverImage;

  // Headline highlight parser for non-editor mode
  const renderHighlightedHeadline = (text: string) => {
    if (!text) {
      return (
        <>
          The Architecture of <em style={{ fontStyle: "normal", color: accentColor }}>High-Output</em> Engineering
        </>
      );
    }
    // Match *text* or _text_ or <em>text</em>
    const parts = text.split(/(\*[^*]+\*|_[^_]+_|<em>.*?<\/em>)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
              <em key={i} style={{ fontStyle: "normal", color: accentColor }}>
                {part.slice(1, -1)}
              </em>
            );
          }
          if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
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

  return (
    <div
      className={`template1-root w-full min-h-full font-['Plus_Jakarta_Sans',sans-serif] relative transition-colors duration-200 ${
        isDark ? "bg-[#0c0d11] text-[#f2f3f7]" : "bg-[#f8f9fa] text-[#111217]"
      }`}
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Ambient Glows */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(620px 380px at 18% 0%, ${accentColor}1c, transparent 70%), radial-gradient(520px 320px at 88% 96%, ${accentColor}10, transparent 70%)`,
        }}
      />

      {/* Upload progress overlay */}
      {uploadProgress !== null && uploadProgress !== undefined && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center text-white">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border text-white"
            style={{ backgroundColor: `${accentColor}33`, borderColor: `${accentColor}66` }}
          >
            {uploadProgress === 100 ? (
              <Check className="h-6 w-6 text-emerald-400" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            )}
          </div>
          <p className="text-sm font-bold">
            {uploadProgress === 100 ? "Cover image uploaded!" : "Uploading cover image..."}
          </p>
          <div className="mt-3 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800 p-0.5 border border-zinc-700">
            <div
              className="h-2 rounded-full transition-all duration-200"
              style={{
                width: `${uploadProgress}%`,
                background: `linear-gradient(90deg, ${accentColor}, #ff7b92)`,
              }}
            />
          </div>
          <span className="mt-1 font-mono text-xs text-zinc-300 font-bold">{uploadProgress}%</span>
        </div>
      )}

      {/* Main Page Container */}
      <div className="relative max-w-[1260px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
        {/* BRAND HEADER */}
        <header className="flex items-center justify-center gap-3.5 mb-9 sm:mb-12">
          <div
            className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center font-extrabold text-[15px] tracking-[0.02em] text-white shrink-0 overflow-hidden shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #7a1830)`,
              boxShadow: `0 8px 26px ${accentColor}33`,
            }}
          >
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <b className="text-[15px] font-extrabold tracking-[0.22em] uppercase leading-none">
            {businessName}
          </b>
        </header>

        {/* TWO-COLUMN GRID */}
        <main className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-10 sm:gap-14 lg:gap-20 items-start">
          {/* LEFT COLUMN: Editorial Content */}
          <section className="space-y-0 min-w-0">
            {/* Headline */}
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
                className={`w-full text-3xl sm:text-4xl lg:text-[46px] leading-[1.06] font-extrabold tracking-[-0.02em] bg-transparent outline-none resize-none mb-6 sm:mb-7 ${
                  isDark ? "text-white placeholder:text-zinc-600" : "text-[#111217] placeholder:text-zinc-400"
                }`}
                placeholder="The Architecture of *High-Output* Engineering"
              />
            ) : (
              <h1
                className={`text-3xl sm:text-4xl lg:text-[46px] leading-[1.08] font-extrabold tracking-[-0.02em] mb-6 sm:mb-7 break-words [overflow-wrap:anywhere] ${
                  isDark ? "text-white" : "text-[#111217]"
                }`}
              >
                {renderHighlightedHeadline(headline)}
              </h1>
            )}

            {/* Subheadline */}
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
                className={`w-full text-[16.5px] leading-[1.85] bg-transparent outline-none resize-none max-w-[620px] ${
                  isDark ? "text-[#a9acb8] placeholder:text-zinc-600" : "text-[#4b5563] placeholder:text-zinc-400"
                }`}
                placeholder="A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."
              />
            ) : (
              (subheadline || !headline) && (
                <p
                  className={`text-[16.5px] leading-[1.85] max-w-[620px] ${
                    isDark ? "text-[#a9acb8]" : "text-[#4b5563]"
                  }`}
                >
                  {subheadline ||
                    "A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."}
                </p>
              )
            )}

            {/* Divider Rule & Bullets Section */}
            {(isEditor || currentBullets.length > 0) && (
              <>
                <div className="py-8 sm:py-10">
                  <div
                    className="h-[1px] w-full"
                    style={{ backgroundColor: isDark ? "#23242c" : "#e5e7eb" }}
                  />
                </div>

                {/* Kicker / Bullets Title */}
                <div className="mb-6">
                  {isEditor ? (
                    <input
                      type="text"
                      value={bulletsTitle || ""}
                      onChange={(e) => setBulletsTitle?.(e.target.value)}
                      className="text-[11px] font-bold tracking-[0.2em] uppercase bg-transparent outline-none w-full"
                      style={{ color: accentColor }}
                      placeholder="What you will create"
                    />
                  ) : (
                    <p
                      className="text-[11px] font-bold tracking-[0.2em] uppercase"
                      style={{ color: accentColor }}
                    >
                      {bulletsTitle || "What you will create"}
                    </p>
                  )}
                </div>

                {/* Checklist items */}
                <div className="space-y-2">
              {currentBullets.map((item, idx) => {
                const parsed = parseBullet(item);
                const placeholderTitle =
                  defaultBulletPlaceholders[idx % defaultBulletPlaceholders.length]?.title ||
                  "Framework title...";
                const placeholderDesc =
                  defaultBulletPlaceholders[idx % defaultBulletPlaceholders.length]?.desc ||
                  "Key description / takeaway...";
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[26px_1fr] gap-4 sm:gap-5 py-3.5 sm:py-4 items-start group"
                  >
                    <span
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold text-white shrink-0 mt-0.5 shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      ✓
                    </span>
                    <div className="min-w-0">
                      {isEditor ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={parsed.title}
                              onChange={(e) => handleBulletTitleChange(idx, e.target.value)}
                              className={`w-full text-[15px] font-bold bg-transparent outline-none ${
                                isDark ? "text-white placeholder:text-zinc-600" : "text-[#111217] placeholder:text-zinc-400"
                              }`}
                              placeholder={placeholderTitle}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBullet(idx)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition"
                              title="Delete item"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={parsed.desc}
                            onChange={(e) => handleBulletDescChange(idx, e.target.value)}
                            className={`w-full text-[13px] leading-[1.65] bg-transparent outline-none ${
                              isDark ? "text-[#9a9da9] placeholder:text-zinc-600" : "text-[#6b7280] placeholder:text-zinc-400"
                            }`}
                            placeholder={placeholderDesc}
                          />
                        </div>
                      ) : (
                        <>
                          <h3
                            className={`text-[15px] font-bold mb-1 leading-snug ${
                              isDark ? "text-white" : "text-[#111217]"
                            }`}
                          >
                            {parsed.title || placeholderTitle}
                          </h3>
                          {(parsed.desc || (!parsed.title && placeholderDesc)) && (
                            <p
                              className={`text-[13px] leading-[1.65] ${
                                isDark ? "text-[#9a9da9]" : "text-[#6b7280]"
                              }`}
                            >
                              {parsed.desc || placeholderDesc}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

                {isEditor && (
                  currentBullets.length === 0 ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleAddBullet}
                        className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl border border-dashed cursor-pointer transition hover:opacity-80"
                        style={{
                          color: accentColor,
                          borderColor: `${accentColor}66`,
                          backgroundColor: `${accentColor}11`,
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add key framework
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddBullet}
                      className="flex items-center gap-1.5 text-xs font-bold pt-3 cursor-pointer transition hover:opacity-80"
                      style={{ color: accentColor }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add key framework
                    </button>
                  )
                )}
              </div>
            </>
          )}

            {/* Quote / Pitch Block */}
            {pitch === "__hidden__" || pitch === "__none__" || pitch === "__HIDDEN__" ? (
              isEditor && (
                <div className="mt-8 sm:mt-10">
                  <button
                    type="button"
                    onClick={() => setPitch?.(`${defaultQuote} ::: ${defaultAuthor}`)}
                    className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl border border-dashed cursor-pointer transition hover:opacity-80"
                    style={{
                      color: accentColor,
                      borderColor: `${accentColor}66`,
                      backgroundColor: `${accentColor}11`,
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add quote / perspective
                  </button>
                </div>
              )
            ) : (
              <div
                className="mt-8 sm:mt-10 pl-5 sm:pl-6 space-y-2 relative group/quote"
                style={{ borderLeft: `3px solid ${accentColor}` }}
              >
                {isEditor && (
                  <button
                    type="button"
                    onClick={() => setPitch?.("__hidden__")}
                    className={`absolute -top-1.5 right-0 p-1.5 rounded-lg transition-all cursor-pointer z-10 opacity-70 hover:opacity-100 ${
                      isDark ? "text-zinc-400 hover:text-red-400 hover:bg-red-950/40" : "text-zinc-500 hover:text-red-600 hover:bg-red-50"
                    }`}
                    title="Remove quote block"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {isEditor ? (
                  <div className="space-y-1.5 pr-6">
                    <textarea
                      ref={pitchRef}
                      rows={2}
                      value={parsedQuote}
                      onChange={(e) => handleQuoteChange(e.target.value)}
                      className={`w-full italic text-[14px] leading-[1.7] bg-transparent outline-none resize-none ${
                        isDark ? "text-[#c9ccd6] placeholder:text-zinc-600" : "text-[#374151] placeholder:text-zinc-400"
                      }`}
                      placeholder={defaultQuote}
                    />
                    <input
                      type="text"
                      value={parsedAuthor}
                      onChange={(e) => handleAuthorChange(e.target.value)}
                      className={`block text-[10px] font-bold tracking-[0.16em] uppercase bg-transparent outline-none w-full ${
                        isDark ? "text-[#8b8e99] placeholder:text-zinc-600" : "text-[#9ca3af] placeholder:text-zinc-400"
                      }`}
                      placeholder={defaultAuthor}
                    />
                  </div>
                ) : (
                  <>
                    <p
                      className={`italic text-[14px] leading-[1.7] ${
                        isDark ? "text-[#c9ccd6]" : "text-[#374151]"
                      }`}
                    >
                      {parsedQuote || defaultQuote}
                    </p>
                    <small
                      className={`block text-[10px] font-bold tracking-[0.16em] uppercase mt-2 ${
                        isDark ? "text-[#8b8e99]" : "text-[#9ca3af]"
                      }`}
                    >
                      {parsedAuthor || defaultAuthor}
                    </small>
                  </>
                )}
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Media Cover & Lead Capture Card */}
          <aside className="space-y-7 sm:space-y-8">
            {/* Cover Media */}
            <div className="relative w-full aspect-[3/2] rounded-[22px] overflow-hidden shadow-[0_24px_60px_#00000066] border border-white/10 group bg-zinc-900">
              <img
                src={coverImage}
                alt="Report cover preview"
                className="w-full h-full object-cover"
              />

              {isEditor && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef?.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-white text-zinc-900 px-3.5 py-2 text-xs font-bold shadow-xl transition hover:bg-zinc-100 cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>{imageUrl && imageUrl.trim() !== "" ? "Replace Image" : "Upload Cover"}</span>
                  </button>

                  {imageUrl && imageUrl.trim() !== "" && setImageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xl transition cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sign-up Card */}
            <div
              className={`rounded-[22px] p-7 sm:p-8 lg:p-9 border transition-all ${
                isDark
                  ? "bg-[#14151b] border-[#26272f] shadow-2xl"
                  : "bg-white border-[#e5e7eb] shadow-xl"
              }`}
            >
              {/* Card Title */}
              {isEditor ? (
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  className={`w-full text-[21px] font-extrabold mb-2 bg-transparent outline-none ${
                    isDark ? "text-white placeholder:text-zinc-600" : "text-[#111217] placeholder:text-zinc-400"
                  }`}
                  placeholder="Get the full report"
                />
              ) : (
                <h2
                  className={`text-[21px] font-extrabold mb-2 ${
                    isDark ? "text-white" : "text-[#111217]"
                  }`}
                >
                  {formTitle || "Get the full report"}
                </h2>
              )}

              {/* Card Subtitle */}
              {isEditor ? (
                <input
                  type="text"
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  className={`w-full text-[12.5px] leading-[1.6] mb-5 bg-transparent outline-none ${
                    isDark ? "text-[#9a9da9] placeholder:text-zinc-600" : "text-[#6b7280] placeholder:text-zinc-400"
                  }`}
                  placeholder="The PDF and supplemental worksheets will arrive directly in your inbox."
                />
              ) : (
                <p
                  className={`text-[12.5px] leading-[1.6] mb-5 ${
                    isDark ? "text-[#9a9da9]" : "text-[#6b7280]"
                  }`}
                >
                  {formSubtitle ||
                    "The PDF and supplemental worksheets will arrive directly in your inbox."}
                </p>
              )}

              {/* Form Body */}
              {isEditor ? (
                <div className="space-y-3.5">
                  <div className="field">
                    <input
                      type="text"
                      placeholder="Full name"
                      readOnly
                      className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition pointer-events-none select-none ${
                        isDark
                          ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                          : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                  </div>
                  <div className="field">
                    <input
                      type="email"
                      placeholder="Work email"
                      readOnly
                      className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition pointer-events-none select-none ${
                        isDark
                          ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                          : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                      }`}
                    />
                  </div>

                  {/* Custom Form Fields in Editor */}
                  {customFormFields && customFormFields.length > 0 && (
                    <div className="space-y-3">
                      {customFormFields.map((field: any) => (
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

                  <div className="pt-1">
                    <input
                      type="text"
                      value={formButtonText || ""}
                      onChange={(e) => setFormButtonText?.(e.target.value)}
                      className="w-full text-white py-4 px-4 rounded-[14px] font-extrabold text-sm tracking-[0.01em] text-center shadow-lg transition outline-none cursor-text hover:brightness-110"
                      style={{ backgroundColor: accentColor }}
                      placeholder="Receive the dispatch →"
                    />
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmitPublicForm} className="space-y-3.5">
                  <div className="field">
                    <input
                      type="text"
                      required
                      placeholder="Full name"
                      value={publicFormValues.name || ""}
                      onChange={(e) =>
                        setPublicFormValues?.({ ...publicFormValues, name: e.target.value })
                      }
                      className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                        isDark
                          ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280] focus:border-[#fb4d6a]"
                          : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400 focus:border-[#fb4d6a]"
                      }`}
                      style={{
                        borderColor: publicFormValues.name ? accentColor : undefined,
                      }}
                    />
                  </div>
                  <div className="field">
                    <input
                      type="email"
                      required
                      placeholder="Work email"
                      value={publicFormValues.email || ""}
                      onChange={(e) =>
                        setPublicFormValues?.({ ...publicFormValues, email: e.target.value })
                      }
                      className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                        isDark
                          ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280] focus:border-[#fb4d6a]"
                          : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400 focus:border-[#fb4d6a]"
                      }`}
                      style={{
                        borderColor: publicFormValues.email ? accentColor : undefined,
                      }}
                    />
                  </div>

                  {/* Custom Form Fields */}
                  {customFormFields && customFormFields.length > 0 && (
                    <div className="space-y-3">
                      {customFormFields.map((field: any) => (
                        <div key={field.id} className="field">
                          {field.type === "textarea" ? (
                            <textarea
                              required={field.required}
                              placeholder={`${field.label || field.placeholder || "Answer"}${field.required ? " *" : ""}`}
                              value={publicFormValues[field.id] || ""}
                              onChange={(e) =>
                                setPublicFormValues?.({
                                  ...publicFormValues,
                                  [field.id]: e.target.value,
                                })
                              }
                              rows={2}
                              className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                                isDark
                                  ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                                  : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                              }`}
                            />
                          ) : field.type === "select" ? (
                            <select
                              required={field.required}
                              value={publicFormValues[field.id] || ""}
                              onChange={(e) =>
                                setPublicFormValues?.({
                                  ...publicFormValues,
                                  [field.id]: e.target.value,
                                })
                              }
                              className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                                isDark
                                  ? "bg-[#0c0d11] border-[#2c2d36] text-white"
                                  : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900"
                              }`}
                            >
                              <option value="">{field.label || "Select..."}</option>
                              {field.options?.map((opt: string) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || "text"}
                              required={field.required}
                              placeholder={`${field.label || field.placeholder || "Answer"}${field.required ? " *" : ""}`}
                              value={publicFormValues[field.id] || ""}
                              onChange={(e) =>
                                setPublicFormValues?.({
                                  ...publicFormValues,
                                  [field.id]: e.target.value,
                                })
                              }
                              className={`w-full px-4 py-3.5 rounded-[14px] text-sm outline-none border transition ${
                                isDark
                                  ? "bg-[#0c0d11] border-[#2c2d36] text-white placeholder:text-[#6f7280]"
                                  : "bg-[#f8fafc] border-[#cbd5e1] text-zinc-900 placeholder:text-zinc-400"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white py-4 px-4 rounded-[14px] font-extrabold text-sm tracking-[0.01em] shadow-lg transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isSubmitting
                      ? "Processing..."
                      : formButtonText || "Receive the dispatch →"}
                  </button>
                </form>
              )}

              {/* Fine Print Note */}
              <p
                className={`text-center text-[10.5px] mt-4 ${
                  isDark ? "text-[#7d8090]" : "text-[#9ca3af]"
                }`}
              >
                No noise. Only occasional, high-signal notes.
              </p>
            </div>
          </aside>
        </main>

        {/* FOOTER */}
        <footer
          className="mt-12 pt-5 flex justify-between gap-3 flex-wrap text-[10px] font-semibold tracking-[0.14em] uppercase"
          style={{
            borderTop: `1px solid ${isDark ? "#23242c" : "#e5e7eb"}`,
            color: isDark ? "#7d8090" : "#9ca3af",
          }}
        >
          <span>
            © {currentYear} {businessName} · Private circulation
          </span>
          <span>By {account?.name || "Marcus Vane"}</span>
        </footer>
      </div>
    </div>
  );
}

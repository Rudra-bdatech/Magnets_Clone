import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X, ArrowRight, Zap, Briefcase, Download, FlaskConical } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template3(props: TemplateProps) {
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
    customFormFields = [],
    setCustomFormFields,
    fileInputRef,
    uploadProgress,
    headlineRef,
    subheadlineRef,
    pitchRef,
    setHeadline,
    setSubheadline,
    setPitch,
    setBulletsTitle,
    setMastheadLeft,
    setMastheadRight,
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
  const isEditor = props.mode ? props.mode === "editor" : rawProps.isEditor !== false;

  const defaultBrandColor = "#d0e797";
  const brandColor = account?.brandColor || props.brandColor || defaultBrandColor;
  const themeMode = account?.themeMode || props.themeMode || "dark";
  const isDark = themeMode === "dark";
  const logo = account?.logo || null;
  const businessName = account?.brandName || account?.name || "AI with Ambesh";
  const authorName = account?.name || "Ambesh Tiwari";

  // Palette variables based on dark / light mode
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

  // Default Benefit Cards
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

  const isBulletsHidden = Array.isArray(bullets) && bullets.length === 1 && bullets[0] === "__hidden__";
  const hasCustomBullets = Array.isArray(bullets) && bullets.length > 0 && !isBulletsHidden;
  const currentBullets: string[] = isBulletsHidden
    ? []
    : hasCustomBullets
    ? bullets
    : ["", "", "", ""];

  const parseCard = (item: string, idx: number) => {
    if (!item || !item.trim()) {
      return { title: "", desc: "" };
    }
    if (item.includes(":::")) {
      const parts = item.split(":::");
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

  const handleCardTitleChange = (index: number, newTitle: string) => {
    if (!setBullets) return;
    const next = [...currentBullets];
    const parsed = parseCard(next[index] || "", index);
    next[index] = parsed.desc ? `${newTitle} ::: ${parsed.desc}` : newTitle;
    setBullets(next);
  };

  const handleCardDescChange = (index: number, newDesc: string) => {
    if (!setBullets) return;
    const next = [...currentBullets];
    const parsed = parseCard(next[index] || "", index);
    const title = parsed.title;
    next[index] = title ? `${title} ::: ${newDesc}` : `::: ${newDesc}`;
    setBullets(next);
  };

  const handleAddCard = () => {
    if (!setBullets) return;
    const baseList = isBulletsHidden ? [] : currentBullets;
    setBullets([...baseList, ""]);
  };

  const handleRemoveCard = (index: number) => {
    if (!setBullets) return;
    const next = currentBullets.filter((_, i) => i !== index);
    setBullets(next.length === 0 ? ["__hidden__"] : next);
  };

  // Proof Points Parsing
  const isProofHidden = mastheadRight === "__hidden__" || mastheadRight === "__none__";
  const defaultProofPoints = ["3-minute read", "No technical jargon", "No AI noise"];
  const getProofPoints = (): string[] => {
    if (isProofHidden) return [];
    if (!mastheadRight || !mastheadRight.trim()) {
      return defaultProofPoints;
    }
    return mastheadRight.split(":::").map((p: string) => p.trim()).filter(Boolean);
  };
  const currentProofPoints = getProofPoints();

  const handleProofChange = (index: number, val: string) => {
    if (!setMastheadRight) return;
    const points = currentProofPoints.length > 0 ? [...currentProofPoints] : [...defaultProofPoints];
    points[index] = val;
    setMastheadRight(points.join(" ::: "));
  };

  const handleRemoveProofPoint = (index: number) => {
    if (!setMastheadRight) return;
    const points = currentProofPoints.filter((_, i) => i !== index);
    setMastheadRight(points.length === 0 ? "__hidden__" : points.join(" ::: "));
  };

  const handleAddProofPoint = () => {
    if (!setMastheadRight) return;
    const points = isProofHidden || currentProofPoints.length === 0 ? [...defaultProofPoints, "New point"] : [...currentProofPoints, "New point"];
    setMastheadRight(points.join(" ::: "));
  };

  // Eyebrow & Aside Hide Flags
  const isEyebrowHidden = bulletsTitle === "__hidden__" || bulletsTitle === "__none__";
  const isSubheadlineHidden = subheadline === "__hidden__";
  const isPitchHidden = pitch === "__hidden__" || pitch === "__none__";
  const isAuthorBioHidden = mastheadLeft === "__hidden__";

  // Headline highlight parser (matches *text*, _text_, or <em>text</em>)
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

  const defaultAside1 = "Built for people running a business.";
  const defaultAside2 = "Every idea comes back to the work.";
  const parsePitch = (raw?: string) => {
    if (!raw || !raw.trim() || isPitchHidden) {
      return { line1: "", line2: "" };
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

  const { line1: asideLine1, line2: asideLine2 } = parsePitch(pitch);

  // Author mark initials
  const getInitials = (name: string) => {
    if (!name) return "AT";
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };
  const authorInitials = getInitials(authorName);
  const brandInitial = (businessName ? businessName.charAt(0) : "a").toLowerCase();

  return (
    <div
      className="w-full min-h-full transition-colors duration-200"
      style={{
        backgroundColor: bg,
        color: foreground,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-2">
        {/* HEADER */}
        <header
          className="h-20 sm:h-24 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${borderCol}` }}
        >
          <a
            href="#"
            className="inline-flex items-center gap-3 font-semibold text-base sm:text-lg"
            style={{ color: foreground }}
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xl leading-none shrink-0 overflow-hidden shadow-xs"
              style={{
                backgroundColor: accent,
                color: accentInk,
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                brandInitial
              )}
            </span>
            <span className="font-semibold tracking-tight">{businessName}</span>
            <span style={{ color: accent }} className="text-xl -ml-2">.</span>
          </a>

          <nav className="flex items-center gap-4 sm:gap-7 text-xs" style={{ color: muted }}>
            {!isBulletsHidden && (
              <a
                href="#what-you-get"
                className="hidden sm:inline-block transition-colors hover:opacity-100"
                style={{ color: muted }}
              >
                Read a preview
              </a>
            )}
            <a
              href="#newsletter"
              className="px-4 py-2 rounded-full border transition-all hover:brightness-110 flex items-center gap-1.5"
              style={{
                borderColor: borderCol,
                color: foreground,
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              }}
            >
              <span>Join the newsletter</span>
              <span style={{ color: accent }}>↗</span>
            </a>
          </nav>
        </header>

        {/* HERO SECTION (2-Column Grid) */}
        <main>
          <section
            className="grid grid-cols-1 lg:grid-cols-[1.18fr_0.82fr] xl:grid-cols-[1.25fr_0.75fr] gap-10 sm:gap-14 lg:gap-20 py-12 sm:py-16 lg:py-24 items-center"
            style={{ borderBottom: `1px solid ${borderCol}` }}
          >
            {/* LEFT HERO COPY */}
            <div className="space-y-6 sm:space-y-7">
              {/* Eyebrow */}
              {!isEyebrowHidden ? (
                <div className="flex items-center gap-2 relative group/eyebrow">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                  {isEditor ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={bulletsTitle || ""}
                        onChange={(e) => setBulletsTitle?.(e.target.value)}
                        placeholder="A weekly note for business minds"
                        className="text-[11px] font-bold tracking-[2px] uppercase bg-transparent outline-none w-full placeholder:opacity-60"
                        style={{ color: accent }}
                      />
                      <button
                        type="button"
                        onClick={() => setBulletsTitle?.("__hidden__")}
                        className="opacity-0 group-hover/eyebrow:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                        title="Remove eyebrow"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] font-bold tracking-[2px] uppercase m-0" style={{ color: accent }}>
                      {bulletsTitle || "A weekly note for business minds"}
                    </p>
                  )}
                </div>
              ) : isEditor ? (
                <button
                  type="button"
                  onClick={() => setBulletsTitle?.("")}
                  className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-dashed transition cursor-pointer"
                  style={{
                    borderColor: borderCol,
                    color: accent,
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Eyebrow</span>
                </button>
              ) : null}

              {/* Headline (H1) */}
              {isEditor ? (
                <div className="space-y-1">
                  <textarea
                    ref={headlineRef}
                    rows={2}
                    value={headline || ""}
                    onChange={(e) => {
                      setHeadline?.(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    placeholder="Use AI to run a *smarter business.*"
                    className="w-full text-3xl sm:text-4xl lg:text-[54px] font-normal leading-[1.08] bg-transparent outline-none resize-none overflow-hidden scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden placeholder:opacity-50"
                    style={{
                      color: foreground,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                    }}
                  />
                  <p className="text-[10px] italic" style={{ color: faint }}>
                    Tip: Wrap words in *asterisks* to highlight with accent colour.
                  </p>
                </div>
              ) : (
                <h1
                  className="text-3xl sm:text-4xl lg:text-[54px] font-normal leading-[1.08] m-0"
                  style={{
                    color: foreground,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}
                >
                  {renderHighlightedHeadline(headline)}
                </h1>
              )}

              {/* Intro / Subheadline */}
              {!isSubheadlineHidden ? (
                <div className="relative group/subheadline">
                  {isEditor ? (
                    <div className="relative">
                      <textarea
                        ref={subheadlineRef}
                        rows={3}
                        value={subheadline || ""}
                        onChange={(e) => {
                          setSubheadline?.(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder="Every week I filter the AI noise and send you what actually matters: important updates, real business use cases, and one resource you can steal and use."
                        className="w-full text-sm sm:text-base leading-[1.8] bg-transparent outline-none resize-none overflow-hidden scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[540px] placeholder:opacity-50 pr-6"
                        style={{ color: muted }}
                      />
                      <button
                        type="button"
                        onClick={() => setSubheadline?.("__hidden__")}
                        className="absolute top-0 right-0 opacity-0 group-hover/subheadline:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                        title="Remove subheadline"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base leading-[1.8] max-w-[540px] m-0" style={{ color: muted }}>
                      {subheadline ||
                        "Every week I filter the AI noise and send you what actually matters: important updates, real business use cases, and one resource you can steal and use."}
                    </p>
                  )}
                </div>
              ) : isEditor ? (
                <button
                  type="button"
                  onClick={() => setSubheadline?.("")}
                  className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-dashed transition cursor-pointer"
                  style={{
                    borderColor: borderCol,
                    color: accent,
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subheadline</span>
                </button>
              ) : null}

              {/* Proof Points */}
              {!isProofHidden ? (
                <div className="space-y-2 group/proof">
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: muted }}>
                    {currentProofPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-black/10 dark:bg-white/5 px-2.5 py-1 rounded-md border border-white/5 relative group/pt">
                        <span style={{ color: accent }}>✓</span>
                        {isEditor ? (
                          <input
                            type="text"
                            value={pt}
                            onChange={(e) => handleProofChange(idx, e.target.value)}
                            placeholder={defaultProofPoints[idx % defaultProofPoints.length]}
                            className="bg-transparent outline-none text-xs w-auto min-w-[80px] placeholder:opacity-50"
                            style={{ color: muted }}
                          />
                        ) : (
                          <span>{pt}</span>
                        )}
                        {isEditor && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProofPoint(idx)}
                            className="opacity-0 group-hover/pt:opacity-100 p-0.5 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            title="Remove point"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isEditor && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleAddProofPoint}
                          className="p-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                          title="Add proof point"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMastheadRight?.("__hidden__")}
                          className="opacity-0 group-hover/proof:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                          title="Remove all proof points"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : isEditor ? (
                <button
                  type="button"
                  onClick={() => setMastheadRight?.("")}
                  className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-dashed transition cursor-pointer"
                  style={{
                    borderColor: borderCol,
                    color: accent,
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Proof Points</span>
                </button>
              ) : null}

              {/* Author Section */}
              <div className="pt-2 flex items-center gap-3.5 relative group/author">
                <div
                  className="w-12 h-12 rounded-full border flex items-center justify-center text-lg shrink-0 overflow-hidden"
                  style={{
                    borderColor: inputBorder,
                    color: accent,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    backgroundColor: isDark ? "#141b10" : "#eef2e7",
                  }}
                >
                  {imageUrl && imageUrl.trim() !== "" ? (
                    <img src={imageUrl} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    authorInitials
                  )}
                </div>
                <div className="space-y-0.5 flex-1">
                  <p className="text-sm font-semibold m-0" style={{ color: foreground }}>
                    {authorName}
                  </p>
                  {!isAuthorBioHidden ? (
                    <div className="flex items-center gap-2">
                      {isEditor ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={mastheadLeft || ""}
                            onChange={(e) => setMastheadLeft?.(e.target.value)}
                            placeholder={account?.brandName ? `Founder of ${account.brandName} · Author of Accelerate with AI` : "Founder of BDA Technologies · Author of Accelerate with AI"}
                            className="text-xs leading-tight bg-transparent outline-none w-full placeholder:opacity-50"
                            style={{ color: faint }}
                          />
                          <button
                            type="button"
                            onClick={() => setMastheadLeft?.("__hidden__")}
                            className="opacity-0 group-hover/author:opacity-100 p-0.5 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            title="Remove author bio"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs leading-tight m-0" style={{ color: faint }}>
                          {mastheadLeft || (account?.brandName ? `Founder of ${account.brandName} · Author of Accelerate with AI` : "Founder of BDA Technologies · Author of Accelerate with AI")}
                        </p>
                      )}
                    </div>
                  ) : isEditor ? (
                    <button
                      type="button"
                      onClick={() => setMastheadLeft?.("")}
                      className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      + Add bio
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Image upload / change button in Editor */}
              {isEditor && (
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef?.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer"
                    style={{
                      borderColor: borderCol,
                      color: muted,
                      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                    }}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{imageUrl && imageUrl.trim() !== "" ? "Change Author Photo" : "Upload Author Photo"}</span>
                  </button>
                  {imageUrl && imageUrl.trim() !== "" && setImageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 transition cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT HERO SIGNUP PANEL */}
            <div
              id="newsletter"
              className="rounded-2xl border p-6 sm:p-8 shadow-xl transition-all relative overflow-hidden"
              style={{
                background: panelFill,
                borderColor: borderCol,
              }}
            >
              <div className="space-y-1 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: accent }}>
                  Less noise. More useful.
                </p>
                {isEditor ? (
                  <>
                    <input
                      type="text"
                      value={formTitle || ""}
                      onChange={(e) => setFormTitle?.(e.target.value)}
                      placeholder="Your next business advantage."
                      className="w-full text-xl sm:text-2xl font-normal bg-transparent outline-none placeholder:opacity-50"
                      style={{
                        color: foreground,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                      }}
                    />
                    <textarea
                      rows={2}
                      value={formSubtitle || ""}
                      onChange={(e) => {
                        setFormSubtitle?.(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="A little clarity on AI. One useful idea to put to work. In your inbox, every week."
                      className="w-full text-xs leading-relaxed bg-transparent outline-none resize-none overflow-hidden scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-1 placeholder:opacity-50"
                      style={{ color: muted }}
                    />
                  </>
                ) : (
                  <>
                    <h2
                      className="text-xl sm:text-2xl font-normal m-0"
                      style={{
                        color: foreground,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                      }}
                    >
                      {formTitle || "Your next business advantage."}
                    </h2>
                    <p className="text-xs leading-relaxed mt-1 mb-0" style={{ color: muted }}>
                      {formSubtitle || "A little clarity on AI. One useful idea to put to work. In your inbox, every week."}
                    </p>
                  </>
                )}
              </div>

              {/* Form Body */}
              {isEditor ? (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] mb-1.5" style={{ color: muted }}>
                      First name
                    </label>
                    <input
                      type="text"
                      placeholder="Your first name"
                      readOnly
                      className="w-full h-11 px-3.5 rounded-md text-xs outline-none border transition pointer-events-none select-none placeholder:opacity-50"
                      style={{
                        backgroundColor: bg,
                        borderColor: inputBorder,
                        color: foreground,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] mb-1.5" style={{ color: muted }}>
                      Work email
                    </label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      readOnly
                      className="w-full h-11 px-3.5 rounded-md text-xs outline-none border transition pointer-events-none select-none placeholder:opacity-50"
                      style={{
                        backgroundColor: bg,
                        borderColor: inputBorder,
                        color: foreground,
                      }}
                    />
                  </div>

                  {/* Custom Form Fields in Editor */}
                  {customFormFields && customFormFields.length > 0 && (
                    <div className="space-y-3">
                      {customFormFields.map((field: any) => (
                        <div key={field.id}>
                          <label className="block text-[11px] mb-1.5" style={{ color: muted }}>
                            {field.label || "Custom field"}{field.required ? " *" : ""}
                          </label>
                          <input
                            type="text"
                            placeholder={`${field.label || "Enter value"}`}
                            readOnly
                            className="w-full h-11 px-3.5 rounded-md text-xs outline-none border transition pointer-events-none select-none"
                            style={{
                              backgroundColor: bg,
                              borderColor: inputBorder,
                              color: foreground,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <input
                      type="text"
                      value={formButtonText || ""}
                      onChange={(e) => setFormButtonText?.(e.target.value)}
                      placeholder="Get AI with Ambesh"
                      className="w-full h-12 px-4 rounded-md font-bold text-xs sm:text-sm text-center shadow-md transition outline-none cursor-text hover:brightness-105 placeholder:opacity-80"
                      style={{
                        backgroundColor: accent,
                        color: accentInk,
                      }}
                    />
                  </div>

                  <p className="text-center text-[10px] m-0 pt-1" style={{ color: faint }}>
                    Free. Unsubscribe anytime.
                  </p>
                  <p className="text-center text-[10px] m-0 pt-2 border-t" style={{ borderColor: borderCol, color: faint }}>
                    Instant delivery · Direct to your inbox.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmitPublicForm} className="space-y-3.5">
                  <div>
                    <label htmlFor="t3-name" className="block text-[11px] mb-1.5" style={{ color: muted }}>
                      First name
                    </label>
                    <input
                      id="t3-name"
                      type="text"
                      required
                      placeholder="Your first name"
                      value={publicFormValues.name || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-md text-xs outline-none border transition placeholder:opacity-50"
                      style={{
                        backgroundColor: bg,
                        borderColor: inputBorder,
                        color: foreground,
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="t3-email" className="block text-[11px] mb-1.5" style={{ color: muted }}>
                      Work email
                    </label>
                    <input
                      id="t3-email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={publicFormValues.email || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-md text-xs outline-none border transition placeholder:opacity-50"
                      style={{
                        backgroundColor: bg,
                        borderColor: inputBorder,
                        color: foreground,
                      }}
                    />
                  </div>

                  {/* Custom Form Fields */}
                  {customFormFields && customFormFields.length > 0 && (
                    <div className="space-y-3">
                      {customFormFields.map((field: any) => (
                        <div key={field.id}>
                          <label className="block text-[11px] mb-1.5" style={{ color: muted }}>
                            {field.label}{field.required ? " *" : ""}
                          </label>
                          <input
                            type="text"
                            required={field.required}
                            placeholder={`${field.label}`}
                            value={publicFormValues[field.id] || ""}
                            onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                            className="w-full h-11 px-3.5 rounded-md text-xs outline-none border transition"
                            style={{
                              backgroundColor: bg,
                              borderColor: inputBorder,
                              color: foreground,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 px-4 rounded-md font-bold text-xs sm:text-sm flex items-center justify-between shadow-md transition hover:brightness-105 cursor-pointer disabled:opacity-50"
                      style={{
                        backgroundColor: accent,
                        color: accentInk,
                      }}
                    >
                      <span>{isSubmitting ? "Submitting..." : (formButtonText || "Get AI with Ambesh")}</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12h16m-5-5 5 5-5 5" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-center text-[10px] m-0 pt-1" style={{ color: faint }}>
                    Free. Unsubscribe anytime.
                  </p>
                  <p className="text-center text-[10px] m-0 pt-2 border-t" style={{ borderColor: borderCol, color: faint }}>
                    Instant delivery · Direct to your inbox.
                  </p>
                </form>
              )}
            </div>
          </section>

          {/* BENEFITS / "WHAT YOU'LL GET" SECTION */}
          {!isBulletsHidden ? (
            <section id="what-you-get" className="py-14 sm:py-16 relative group/benefits">
              {/* Section Heading */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>
                    A useful inbox habit
                  </p>
                  <div className="flex items-center gap-3">
                    <h2
                      className="text-2xl sm:text-3xl font-normal m-0"
                      style={{
                        color: foreground,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                      }}
                    >
                      What you&apos;ll get.
                    </h2>
                    {isEditor && (
                      <button
                        type="button"
                        onClick={() => setBullets?.(["__hidden__"])}
                        className="opacity-60 group-hover/benefits:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                        title="Remove What You'll Get section"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Aside Note */}
                {!isPitchHidden ? (
                  <div className="relative group/aside">
                    {isEditor ? (
                      <div className="space-y-1 md:text-right pr-6 md:pr-7">
                        <input
                          type="text"
                          value={asideLine1}
                          onChange={(e) => setPitch?.(`${e.target.value} ::: ${asideLine2}`)}
                          placeholder="Built for people running a business."
                          className="text-xs leading-relaxed bg-transparent outline-none md:text-right block w-full placeholder:opacity-50"
                          style={{ color: muted }}
                        />
                        <input
                          type="text"
                          value={asideLine2}
                          onChange={(e) => setPitch?.(`${asideLine1 || defaultAside1} ::: ${e.target.value}`)}
                          placeholder="Every idea comes back to the work."
                          className="text-xs leading-relaxed bg-transparent outline-none md:text-right block w-full placeholder:opacity-50"
                          style={{ color: muted }}
                        />
                        <button
                          type="button"
                          onClick={() => setPitch?.("__hidden__")}
                          className="absolute top-0 right-0 opacity-60 group-hover/aside:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                          title="Remove aside note"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm leading-relaxed m-0 md:text-right" style={{ color: muted }}>
                        {asideLine1 || defaultAside1}
                        {(asideLine2 || defaultAside2) && <><br />{asideLine2 || defaultAside2}</>}
                      </p>
                    )}
                  </div>
                ) : isEditor ? (
                  <button
                    type="button"
                    onClick={() => setPitch?.("")}
                    className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-dashed transition cursor-pointer"
                    style={{
                      borderColor: borderCol,
                      color: accent,
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Aside Note</span>
                  </button>
                ) : null}
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentBullets.map((item, idx) => {
                  const parsed = parseCard(item, idx);
                  const placeholderCard = defaultBenefitCards[idx % defaultBenefitCards.length];

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border p-6 sm:p-7 flex flex-col justify-between min-h-[230px] relative group/card shadow-xs"
                      style={{
                        background: panelFill,
                        borderColor: borderCol,
                      }}
                    >
                      <div>
                        {/* Icon & Remove Cross */}
                        <div className="mb-4 flex items-center justify-between">
                          <div style={{ color: accent }}>
                            {idx % 4 === 0 && <Zap className="w-6 h-6 stroke-[1.5]" />}
                            {idx % 4 === 1 && <Briefcase className="w-6 h-6 stroke-[1.5]" />}
                            {idx % 4 === 2 && <Download className="w-6 h-6 stroke-[1.5]" />}
                            {idx % 4 === 3 && <FlaskConical className="w-6 h-6 stroke-[1.5]" />}
                          </div>
                          {isEditor && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCard(idx)}
                              className="opacity-70 group-hover/card:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                              title="Remove card"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Card Content */}
                        {isEditor ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={parsed.title}
                              onChange={(e) => handleCardTitleChange(idx, e.target.value)}
                              placeholder={placeholderCard.title}
                              className="w-full text-sm font-semibold bg-transparent outline-none placeholder:opacity-50"
                              style={{
                                color: foreground,
                                fontFamily: "Georgia, 'Times New Roman', serif",
                              }}
                            />
                            <textarea
                              rows={4}
                              value={parsed.desc}
                              onChange={(e) => {
                                handleCardDescChange(idx, e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              placeholder={placeholderCard.desc}
                              className="w-full text-xs leading-relaxed bg-transparent outline-none resize-none overflow-hidden scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden placeholder:opacity-50"
                              style={{ color: muted }}
                            />
                          </div>
                        ) : (
                          <>
                            <h3
                              className="text-sm sm:text-base font-normal mb-2"
                              style={{
                                color: foreground,
                                fontFamily: "Georgia, 'Times New Roman', serif",
                              }}
                            >
                              {parsed.title || placeholderCard.title}
                            </h3>
                            <p className="text-xs leading-relaxed m-0" style={{ color: muted }}>
                              {parsed.desc || placeholderCard.desc}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Card button in Editor */}
              {isEditor && (
                <div className="mt-4 flex justify-start">
                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-dashed transition cursor-pointer hover:opacity-80"
                    style={{
                      borderColor: borderCol,
                      color: accent,
                      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Benefit Card</span>
                  </button>
                </div>
              )}
            </section>
          ) : isEditor ? (
            <div className="py-10 text-center border-t" style={{ borderColor: borderCol }}>
              <button
                type="button"
                onClick={() => setBullets?.(["", "", "", ""])}
                className="inline-flex items-center gap-2 text-xs font-bold py-2.5 px-5 rounded-xl border border-dashed cursor-pointer transition hover:opacity-80"
                style={{
                  color: accent,
                  borderColor: borderCol,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                }}
              >
                <Plus className="h-4 w-4" /> Add &ldquo;What You&apos;ll Get&rdquo; Section
              </button>
            </div>
          ) : null}
        </main>

        {/* FOOTER */}
        <footer
          className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: `1px solid ${borderCol}`,
            color: faint,
          }}
        >
          <span>© {new Date().getFullYear()} {businessName} · All rights reserved.</span>
          <span>By {authorName}</span>
        </footer>
      </div>
    </div>
  );
}

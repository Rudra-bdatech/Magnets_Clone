import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template6(props: TemplateProps) {
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
    setBulletsTitle,
    setMastheadLeft,
    setMastheadRight,
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
  } = props as any;

  const isEditor = mode === "editor" || props.mode === "editor";
  const brandColor = account?.brandColor || "#c2410c";
  const themeMode = account?.themeMode || "light";
  const isDark = themeMode === "dark";
  const currentYear = new Date().getFullYear();

  const authorName = account?.name || account?.brandName || "Marcus Vane";
  const brandTitle = mastheadRight || account?.brandName || "The Executive Dispatch";
  const issueKicker = mastheadLeft || "Intelligence report · Issue 08";

  const defaultBullets = [
    "The Signal-to-Noise Protocol — Audit attention and eliminate low-leverage activities through the Four Filters.",
    "Recursive Hiring Loops — Build a talent engine that identifies multipliers before they reach the market.",
    "Velocity Without Chaos — Replace recurring meetings with lightweight synchronization rituals.",
  ];

  const hasCustomBullets = Array.isArray(bullets) && bullets.length > 0;
  const displayBullets: string[] = hasCustomBullets ? bullets : defaultBullets;

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
    if (item.includes(": ")) {
      const [title, ...rest] = item.split(": ");
      return { title: title.trim(), desc: rest.join(": ").trim() };
    }
    return { title: item, desc: "" };
  };

  const handleBulletChange = (index: number, value: string) => {
    if (!setBullets) return;
    const next = [...displayBullets];
    next[index] = value;
    setBullets(next);
  };

  const handleAddBullet = () => {
    if (!setBullets) return;
    setBullets([...displayBullets, ""]);
  };

  const handleRemoveBullet = (index: number) => {
    if (!setBullets) return;
    setBullets(displayBullets.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`monograph-root w-full min-h-full py-4 sm:py-8 px-3 sm:px-6 transition-colors duration-200 ${
        isDark ? "bg-[#141312] text-[#fcfaf8]" : "bg-[#fcfaf8] text-[#1c1917]"
      }`}
      style={{
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap');

        .font-instrument {
          font-family: 'Instrument Serif', Georgia, serif;
        }
        .font-manrope {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      {/* Upload Progress Overlay */}
      {uploadProgress !== null && uploadProgress !== undefined && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center text-white">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#c2410c]/20 border border-[#c2410c]/40 text-[#c2410c]">
            {uploadProgress === 100 ? (
              <Check className="h-6 w-6 text-emerald-400" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-[#c2410c]" />
            )}
          </div>
          <p className="text-sm font-bold font-manrope">
            {uploadProgress === 100 ? "Image uploaded!" : "Uploading cover image..."}
          </p>
          <div className="mt-3 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800 p-0.5 border border-zinc-700">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#c2410c] via-amber-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="mt-1 font-mono text-xs text-zinc-300 font-bold">{uploadProgress}%</span>
        </div>
      )}

      <div className="max-w-[1160px] mx-auto">
        {/* MASTHEAD HEADER */}
        <header
          className={`flex justify-between items-end pb-5 border-b transition-colors ${
            isDark ? "border-[#33302c]" : "border-[#d9d4cf]"
          }`}
        >
          <div>
            {isEditor ? (
              <input
                type="text"
                value={mastheadLeft !== undefined ? mastheadLeft : issueKicker}
                onChange={(e) => setMastheadLeft?.(e.target.value)}
                placeholder="Intelligence report · Issue 08"
                className="text-[10px] font-bold tracking-[0.16em] uppercase bg-transparent outline-none w-full max-w-md placeholder:opacity-50"
                style={{ color: isDark ? "#a89f97" : "#786f68" }}
              />
            ) : (
              <div
                className="text-[10px] font-bold tracking-[0.16em] uppercase"
                style={{ color: isDark ? "#a89f97" : "#786f68" }}
              >
                {issueKicker}
              </div>
            )}

            {isEditor ? (
              <input
                type="text"
                value={mastheadRight !== undefined ? mastheadRight : brandTitle}
                onChange={(e) => setMastheadRight?.(e.target.value)}
                placeholder="The Executive Dispatch"
                className="font-instrument italic text-[28px] sm:text-[34px] leading-tight mt-1 bg-transparent outline-none w-full max-w-lg placeholder:opacity-50"
                style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
              />
            ) : (
              <div
                className="font-instrument italic text-[28px] sm:text-[34px] leading-tight mt-1"
                style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
              >
                {brandTitle}
              </div>
            )}
          </div>

          <div
            className="text-right text-xs hidden sm:block font-manrope shrink-0"
            style={{ color: isDark ? "#a89f97" : "#5c554f" }}
          >
            <b className={isDark ? "text-zinc-200" : "text-zinc-900"}>Published {currentYear}</b>
            <br />
            By {authorName}
          </div>
        </header>

        {/* MAIN 2-COLUMN GRID */}
        <main className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.8fr] gap-10 lg:gap-[70px] pt-8 lg:pt-[52px] items-start">
          {/* LEFT COLUMN: Editorial Presentation */}
          <section className="space-y-7 min-w-0">
            {/* Visual Cover Image */}
            <div
              className={`relative w-full aspect-[3/2] rounded-xs overflow-hidden border transition-all group ${
                isDark ? "border-[#33302c] bg-[#1a1918]" : "border-[#ded9d4] bg-[#f5efe9]"
              }`}
            >
              {imageUrl && imageUrl.trim() !== "" ? (
                <img
                  src={imageUrl}
                  alt={headline || "Monograph Cover Visual"}
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Sophisticated fallback abstract geometry */
                <div
                  className="w-full h-full relative flex items-center justify-center overflow-hidden"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, #24201d 0%, #161514 100%)"
                      : "linear-gradient(135deg, #f0e8e0 0%, #ded2c6 100%)",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(${brandColor} 1px, transparent 1px)`,
                      backgroundSize: "20px 20px",
                    }}
                  />
                  <div className="relative z-10 text-center px-4 space-y-2">
                    <div
                      className="w-16 h-16 mx-auto rounded-full border flex items-center justify-center font-instrument italic text-2xl shadow-sm"
                      style={{
                        borderColor: brandColor,
                        color: brandColor,
                        backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {authorName.charAt(0) || "M"}
                    </div>
                    <p
                      className="font-instrument italic text-lg sm:text-xl"
                      style={{ color: isDark ? "#ded9d4" : "#5c554f" }}
                    >
                      {brandTitle}
                    </p>
                  </div>
                </div>
              )}

              {/* Editor Controls for Cover Image */}
              {isEditor && (
                <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 opacity-95 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef?.current?.click()}
                    className="flex items-center gap-1.5 rounded-sm bg-[#1c1917]/90 hover:bg-[#1c1917] px-3 py-1.5 text-xs font-bold text-white shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-[#c2410c]" />
                    <span>{imageUrl ? "Replace Image" : "Add Image"}</span>
                  </button>

                  {imageUrl && setImageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="flex items-center gap-1.5 rounded-sm bg-red-950/90 hover:bg-red-900 px-2.5 py-1.5 text-xs font-bold text-red-200 shadow-md border border-red-800/40 backdrop-blur-md transition cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tag / Category Badge */}
            <div>
              {isEditor ? (
                <input
                  type="text"
                  value={bulletsTitle || ""}
                  onChange={(e) => setBulletsTitle?.(e.target.value)}
                  placeholder="Strategic framework"
                  className="inline-block px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase rounded-xs outline-none cursor-text transition-colors"
                  style={{
                    backgroundColor: isDark ? "rgba(194, 65, 12, 0.2)" : "#f5e5dc",
                    color: isDark ? "#fb923c" : "#b53b12",
                  }}
                />
              ) : (
                <span
                  className="inline-block px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase rounded-xs"
                  style={{
                    backgroundColor: isDark ? "rgba(194, 65, 12, 0.2)" : "#f5e5dc",
                    color: isDark ? "#fb923c" : "#b53b12",
                  }}
                >
                  {bulletsTitle || "Strategic framework"}
                </span>
              )}
            </div>

            {/* Title / Headline */}
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
                  placeholder="The Architecture of High-Output Engineering"
                  className="w-full font-instrument font-medium text-[36px] sm:text-[48px] lg:text-[62px] xl:text-[70px] leading-[0.94] tracking-tight bg-transparent outline-none resize-none"
                  style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
                />
              ) : (
                <h1
                  className="font-instrument font-medium text-[36px] sm:text-[48px] lg:text-[62px] xl:text-[70px] leading-[0.94] tracking-tight"
                  style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
                >
                  {headline || "The Architecture of High-Output Engineering"}
                </h1>
              )}
            </div>

            {/* Lead / Subheadline */}
            <div className="max-w-[620px]">
              {isEditor ? (
                <textarea
                  ref={subheadlineRef}
                  rows={2}
                  value={subheadline || ""}
                  onChange={(e) => {
                    setSubheadline?.(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."
                  className="w-full text-[17px] sm:text-[19px] leading-[1.6] bg-transparent outline-none resize-none"
                  style={{ color: isDark ? "#c4bcb3" : "#5c554f" }}
                />
              ) : (
                <p
                  className="text-[17px] sm:text-[19px] leading-[1.6]"
                  style={{ color: isDark ? "#c4bcb3" : "#5c554f" }}
                >
                  {subheadline ||
                    "A 42-page field guide to the organizational systems used by ambitious teams to maintain velocity without burning out."}
                </p>
              )}
            </div>

            {/* Chapters / "Inside this guide" Section */}
            <div
              className={`pt-7 border-t transition-colors ${
                isDark ? "border-[#33302c]" : "border-[#ded9d4]"
              }`}
            >
              <div
                className="text-[10px] font-bold tracking-[0.16em] uppercase mb-3"
                style={{ color: isDark ? "#a89f97" : "#786f68" }}
              >
                Inside this guide
              </div>

              <div className="divide-y divide-[#ded9d4] dark:divide-[#33302c]">
                {displayBullets.map((item: string, idx: number) => {
                  const numStr = (idx + 1).toString().padStart(2, "0") + " /";
                  const parsed = parseBullet(item);

                  return (
                    <article
                      key={idx}
                      className="grid grid-cols-[44px_1fr] sm:grid-cols-[48px_1fr] py-5 items-start gap-2 group"
                    >
                      <span
                        className="font-instrument italic text-[19px] sm:text-[21px] select-none"
                        style={{ color: brandColor }}
                      >
                        {numStr}
                      </span>

                      <div className="space-y-1 min-w-0 pr-2">
                        {isEditor ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleBulletChange(idx, e.target.value)}
                              placeholder="Chapter Title — Description of the chapter or lesson"
                              className="w-full text-sm sm:text-base font-semibold bg-transparent outline-none"
                              style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
                            />
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[10px] italic text-zinc-400">
                                Tip: Use &quot;Title — Description&quot; to format
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveBullet(idx)}
                                className="text-zinc-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                title="Remove chapter"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3
                              className="text-[16px] sm:text-[17px] font-bold leading-snug m-0"
                              style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
                            >
                              {parsed.title}
                            </h3>
                            {parsed.desc ? (
                              <p
                                className="text-[13px] leading-[1.5] m-0"
                                style={{ color: isDark ? "#a89f97" : "#756d66" }}
                              >
                                {parsed.desc}
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {isEditor && (
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleAddBullet}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs border text-xs font-bold transition cursor-pointer"
                    style={{
                      borderColor: isDark ? "#44403c" : "#d9d4cf",
                      backgroundColor: isDark ? "#1c1917" : "#ffffff",
                      color: isDark ? "#ded9d4" : "#1c1917",
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" style={{ color: brandColor }} />
                    <span>Add chapter</span>
                  </button>
                </div>
              )}
            </div>

            {/* Inverted Editorial Quote / Pitch Callout */}
            <blockquote
              className="p-7 sm:p-9 rounded-xs transition-colors"
              style={{
                backgroundColor: isDark ? "#0d0c0b" : "#1c1917",
                color: "#fcfaf8",
                border: isDark ? "1px solid #292524" : "none",
              }}
            >
              {isEditor ? (
                <div className="space-y-3">
                  <textarea
                    ref={pitchRef}
                    rows={2}
                    value={pitch || ""}
                    onChange={(e) => {
                      setPitch?.(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    placeholder="“Speed is often a byproduct of clarity. Build the infrastructure that makes high performance inevitable.”"
                    className="w-full font-instrument italic text-[22px] sm:text-[25px] leading-[1.3] bg-transparent text-[#fcfaf8] outline-none resize-none placeholder:text-zinc-500"
                  />
                  <small className="block font-manrope font-bold text-[9px] tracking-[0.13em] uppercase text-[#a49d96]">
                    {authorName} · Author
                  </small>
                </div>
              ) : (
                <>
                  <div className="font-instrument italic text-[22px] sm:text-[25px] leading-[1.3]">
                    {pitch ||
                      "“Speed is often a byproduct of clarity. Build the infrastructure that makes high performance inevitable.”"}
                  </div>
                  <small className="block mt-5 font-manrope font-bold text-[9px] tracking-[0.13em] uppercase text-[#a49d96]">
                    {authorName} · Author
                  </small>
                </>
              )}
            </blockquote>
          </section>

          {/* RIGHT COLUMN: Sticky Opt-In Card */}
          <aside className="w-full">
            <div
              className="sticky top-7 rounded-xs border p-7 sm:p-9 transition-all"
              style={{
                backgroundColor: isDark ? "#1c1917" : "#ffffff",
                borderColor: isDark ? "#33302c" : "#ddd7d2",
                boxShadow: isDark
                  ? "0 18px 50px rgba(0,0,0,0.6)"
                  : "0 18px 50px rgba(35,25,18,0.08)",
              }}
            >
              <div
                className="text-[10px] font-bold tracking-[0.16em] uppercase mb-2"
                style={{ color: isDark ? "#a89f97" : "#786f68" }}
              >
                Complimentary digital edition
              </div>

              {isEditor ? (
                <div className="space-y-1 mb-6">
                  <input
                    type="text"
                    value={formTitle || ""}
                    onChange={(e) => setFormTitle?.(e.target.value)}
                    placeholder="Get the full report"
                    className="w-full font-instrument text-[28px] sm:text-[32px] font-medium leading-tight bg-transparent outline-none"
                    style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
                  />
                  <textarea
                    rows={2}
                    value={formSubtitle || ""}
                    onChange={(e) => setFormSubtitle?.(e.target.value)}
                    placeholder="The PDF and supplemental worksheets will arrive directly in your inbox."
                    className="w-full text-[13px] leading-[1.5] bg-transparent outline-none resize-none"
                    style={{ color: isDark ? "#a89f97" : "#746c65" }}
                  />
                </div>
              ) : (
                <div className="mb-6 space-y-1">
                  <h2
                    className="font-instrument text-[28px] sm:text-[32px] font-medium leading-tight m-0"
                    style={{ color: isDark ? "#fcfaf8" : "#1c1917" }}
                  >
                    {formTitle || "Get the full report"}
                  </h2>
                  <p
                    className="text-[13px] leading-[1.5] m-0"
                    style={{ color: isDark ? "#a89f97" : "#746c65" }}
                  >
                    {formSubtitle ||
                      "The PDF and supplemental worksheets will arrive directly in your inbox."}
                  </p>
                </div>
              )}

              {/* Form Input Fields */}
              {isEditor ? (
                <div className="space-y-4">
                  <div className="space-y-3.5">
                    <div>
                      <label
                        className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                        style={{ color: isDark ? "#a89f97" : "#786f68" }}
                      >
                        Full name
                      </label>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        readOnly
                        className={`w-full p-3.5 border text-[13px] outline-none rounded-xs pointer-events-none ${
                          isDark
                            ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600"
                            : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                        style={{ color: isDark ? "#a89f97" : "#786f68" }}
                      >
                        Work email
                      </label>
                      <input
                        type="email"
                        placeholder="jane@company.com"
                        readOnly
                        className={`w-full p-3.5 border text-[13px] outline-none rounded-xs pointer-events-none ${
                          isDark
                            ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600"
                            : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400"
                        }`}
                      />
                    </div>

                    {customFormFields.map((field: any) => (
                      <div key={field.id}>
                        <label
                          className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                          style={{ color: isDark ? "#a89f97" : "#786f68" }}
                        >
                          {field.label || field.placeholder || "Custom Field"}
                          {field.required ? " *" : ""}
                        </label>
                        <input
                          type="text"
                          placeholder={field.placeholder || "Enter value"}
                          readOnly
                          className={`w-full p-3.5 border text-[13px] outline-none rounded-xs pointer-events-none ${
                            isDark
                              ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600"
                              : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={formButtonText || ""}
                    onChange={(e) => setFormButtonText?.(e.target.value)}
                    placeholder="Receive the dispatch →"
                    className="w-full text-center border-0 p-4 text-[13px] font-bold font-manrope text-white cursor-text outline-none rounded-xs shadow-md transition hover:opacity-95"
                    style={{ backgroundColor: brandColor }}
                  />
                </div>
              ) : (
                <form onSubmit={onSubmitPublicForm} className="space-y-4">
                  <div className="space-y-3.5">
                    <div>
                      <label
                        className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                        style={{ color: isDark ? "#a89f97" : "#786f68" }}
                      >
                        Full name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={publicFormValues.name || ""}
                        onChange={(e) =>
                          setPublicFormValues?.({ ...publicFormValues, name: e.target.value })
                        }
                        className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                          isDark
                            ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                            : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                        style={{ color: isDark ? "#a89f97" : "#786f68" }}
                      >
                        Work email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="jane@company.com"
                        value={publicFormValues.email || ""}
                        onChange={(e) =>
                          setPublicFormValues?.({ ...publicFormValues, email: e.target.value })
                        }
                        className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                          isDark
                            ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                            : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                        }`}
                      />
                    </div>

                    {customFormFields.map((field: any) => (
                      <div key={field.id}>
                        <label
                          className="block text-[10px] font-bold tracking-[0.16em] uppercase mb-1.5"
                          style={{ color: isDark ? "#a89f97" : "#786f68" }}
                        >
                          {field.label || field.placeholder || "Field"}
                          {field.required ? " *" : ""}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            rows={2}
                            required={field.required}
                            placeholder={field.placeholder || "Enter details"}
                            value={publicFormValues[field.id] || ""}
                            onChange={(e) =>
                              setPublicFormValues?.({
                                ...publicFormValues,
                                [field.id]: e.target.value,
                              })
                            }
                            className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                              isDark
                                ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                                : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
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
                            className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                              isDark
                                ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                                : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                            }`}
                          >
                            <option value="">{field.label || "Select an option"}</option>
                            {(field.options || []).map((opt: string, i: number) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            required={field.required}
                            placeholder={field.placeholder || "Enter value"}
                            value={publicFormValues[field.id] || ""}
                            onChange={(e) =>
                              setPublicFormValues?.({
                                ...publicFormValues,
                                [field.id]: e.target.value,
                              })
                            }
                            className={`w-full p-3.5 border text-[13px] outline-none rounded-xs transition ${
                              isDark
                                ? "bg-[#141312] border-[#33302c] text-white placeholder:text-zinc-600 focus:border-[#c2410c]"
                                : "bg-[#fcfaf8] border-[#d9d4cf] text-zinc-900 placeholder:text-zinc-400 focus:border-[#c2410c]"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full border-0 p-4 text-[13px] font-bold font-manrope text-white cursor-pointer rounded-xs transition hover:bg-[#1c1917] disabled:opacity-50"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting
                      ? "Sending report..."
                      : formButtonText || "Receive the dispatch →"}
                  </button>
                </form>
              )}

              {/* Fine Print */}
              <p
                className="text-center text-[9px] font-manrope mt-4.5 m-0"
                style={{ color: isDark ? "#8a817a" : "#746c65" }}
              >
                No noise. Only occasional, high-signal notes.
              </p>
            </div>
          </aside>
        </main>

        {/* FOOTER */}
        <footer
          className={`border-t mt-14 pt-6 pb-4 text-[9px] font-bold tracking-[0.14em] uppercase transition-colors text-center sm:text-left ${
            isDark ? "border-[#33302c] text-[#8a817a]" : "border-[#ded9d4] text-[#8a817a]"
          }`}
        >
          © {currentYear} {account?.brandName || authorName} · Private circulation
        </footer>
      </div>
    </div>
  );
}

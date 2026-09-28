import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template5(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets,
    bulletsTitle,
    formTitle,
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
    setFormTitle,
    setBullets,
    setImageUrl,
    setFormButtonText,
    isEditor = true,
    isSubmitting = false,
    publicFormValues = {},
    setPublicFormValues,
    onSubmitPublicForm,
  } = props as any;

  const brandColor = account?.brandColor || "#0066B2";
  const themeMode = account?.themeMode || "light";
  const isDark = themeMode === "dark";

  return (
    <div className="w-full flex-1 flex flex-col justify-center py-1 lg:py-2 max-w-6xl xl:max-w-7xl mx-auto space-y-0 relative">
      {/* Full-bleed cover image header banner */}
      <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 min-h-[280px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[420px] flex items-end">
        {imageUrl && imageUrl.trim() !== "" ? (
          <img src={imageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[#121215]" />
        )}
        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: `linear-gradient(to right, ${brandColor}33 0%, transparent 60%)` }} />

        {/* Upload Progress Overlay */}
        {uploadProgress !== null && uploadProgress !== undefined && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-white">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-[#0066B2] dark:text-[#38BDF8]">
                  {uploadProgress === 100 ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {uploadProgress === 100 ? "Image uploaded!" : "Uploading image..."}
                </span>
                <span className="font-mono text-[#0066B2] dark:text-[#38BDF8]">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 text-center">Optimizing media assets...</p>
            </div>
          </div>
        )}

        {/* Image Action Overlay Controls (Editor) */}
        {isEditor && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef?.current?.click()}
              className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-black px-3 py-1.5 text-xs font-bold text-white shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
            >
              <ImageIcon className="h-3.5 w-3.5 text-zinc-300" />
              <span>{imageUrl && imageUrl.trim() !== "" ? "Replace Image" : "Add Image"}</span>
            </button>
            {imageUrl && imageUrl.trim() !== "" && setImageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="flex items-center gap-1.5 rounded-xl bg-black/70 hover:bg-red-950/80 px-3 py-1.5 text-xs font-bold text-red-400 shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                <span>Remove</span>
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10 space-y-1">
          {isEditor ? (
            <>
              <textarea
                ref={headlineRef}
                rows={1}
                value={headline || ""}
                onChange={(e) => { setHeadline?.(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                placeholder="Your headline here"
                className="w-full text-2xl md:text-4xl font-black text-white bg-transparent outline-none resize-none leading-tight placeholder:text-white/50"
              />
              <textarea
                ref={subheadlineRef}
                rows={1}
                value={subheadline || ""}
                onChange={(e) => { setSubheadline?.(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                placeholder="Short subhead. say what they will get"
                className="w-full text-sm text-white/80 bg-transparent outline-none resize-none placeholder:text-white/50"
              />
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                {headline || "Free Resource"}
              </h1>
              {subheadline && (
                <p className="text-sm text-white/80">
                  {subheadline}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating glass form tray */}
      <div
        className="relative z-20 mx-4 sm:mx-8 md:mx-12 lg:mx-16 -mt-8 sm:-mt-10 md:-mt-14 rounded-3xl p-6 sm:p-8 space-y-5"
        style={{
          background: isDark ? "rgba(12,12,18,0.92)" : "rgba(255,255,255,0.96)",
          border: `1px solid ${isDark ? `${brandColor}30` : `${brandColor}20`}`,
          backdropFilter: "blur(20px)",
          boxShadow: `0 12px 48px -12px rgba(0,0,0,0.35)`
        }}
      >
        {/* Pitch Area */}
        {isEditor ? (
          <textarea
            ref={pitchRef}
            rows={2}
            value={pitch || ""}
            onChange={(e) => {
              setPitch?.(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Write a short pitch..."
            className={`w-full text-xs sm:text-sm leading-relaxed bg-transparent outline-none resize-none ${isDark ? "text-zinc-300 placeholder:text-zinc-500" : "text-zinc-600 placeholder:text-zinc-400"}`}
          />
        ) : pitch ? (
          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
            {pitch}
          </p>
        ) : null}

        {/* Bullets Section Header */}
        {isEditor ? (
          <input
            type="text"
            value={bulletsTitle || ""}
            onChange={(e) => setBulletsTitle?.(e.target.value)}
            placeholder="What they will learn"
            className={`w-full text-xs font-bold uppercase tracking-wider bg-transparent outline-none ${isDark ? "text-zinc-400 placeholder:text-zinc-500" : "text-zinc-500 placeholder:text-zinc-400"}`}
          />
        ) : bulletsTitle ? (
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            {bulletsTitle}
          </h3>
        ) : null}

        {/* Bullets List */}
        {bullets && bullets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {bullets.map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                  <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                {isEditor ? (
                  <>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => { if (!bullets || !setBullets) return; const u = [...bullets]; u[idx] = e.target.value; setBullets(u); }}
                      className={`w-full bg-transparent outline-none text-xs sm:text-sm ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
                      placeholder="Bullet point item..."
                    />
                    <button
                      type="button"
                      onClick={() => setBullets?.(bullets.filter((_: any, i: number) => i !== idx))}
                      className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                      title="Remove bullet point"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <span className={`text-xs sm:text-sm ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                    {item}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : isEditor ? (
          <p className="text-xs italic text-zinc-500 dark:text-zinc-400/80 my-1">
            No bullets yet. click + to add one.
          </p>
        ) : null}

        {isEditor && setBullets && (
          <button
            type="button"
            onClick={() => setBullets([...(bullets || []), ""])}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-600/60 hover:border-zinc-400 bg-zinc-900/40 hover:bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add bullet</span>
          </button>
        )}

        {/* Form Section */}
        <div className="space-y-3 pt-3 border-t border-zinc-200/20 dark:border-zinc-800/40">
          {isEditor ? (
            <>
              {formTitle !== undefined && (
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  className={`w-full text-center text-xs font-bold uppercase tracking-wider bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
                  placeholder="Get your free copy now"
                />
              )}
              <div className={customFormFields && customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                <input type="text" placeholder="Name *" readOnly className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs" />
                <input type="email" placeholder="Email *" readOnly className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs" />
                {customFormFields.map((field: any) => (
                  <div key={field.id} className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}>
                    <input
                      type="text"
                      placeholder={`${field.label || "New Field"}${field.required ? " *" : ""}`}
                      readOnly
                      className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                    />
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={formButtonText || ""}
                onChange={(e) => setFormButtonText?.(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === "Send it to me" || e.target.value === "Get Instant Access →") {
                    setFormButtonText?.("");
                  } else {
                    e.target.select();
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value.trim()) {
                    setFormButtonText?.("Send it to me");
                  }
                }}
                placeholder="Send it to me"
                className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-text mt-2 outline-none border-2 border-transparent hover:border-white/40 focus:border-white transition duration-150"
                style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`, boxShadow: `0 6px 24px -4px ${brandColor}88` }}
              />
            </>
          ) : (
            <form onSubmit={onSubmitPublicForm} className="space-y-3">
              {formTitle && (
                <h4 className={`w-full text-center text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {formTitle}
                </h4>
              )}
              <div className={customFormFields && customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                <input
                  type="text"
                  required
                  placeholder="Name *"
                  value={publicFormValues.name || ""}
                  onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                  className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                />
                <input
                  type="email"
                  required
                  placeholder="Email *"
                  value={publicFormValues.email || ""}
                  onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                  className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                />
                {customFormFields.map((field: any) => (
                  <div key={field.id} className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}>
                    <input
                      type="text"
                      required={field.required}
                      placeholder={`${field.label}${field.required ? " *" : ""}`}
                      value={publicFormValues[field.id] || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                      className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-pointer mt-2 outline-none border-2 border-transparent hover:border-white/40 transition duration-150 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`, boxShadow: `0 6px 24px -4px ${brandColor}88` }}
              >
                {isSubmitting ? "Submitting..." : (formButtonText || "Send it to me")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

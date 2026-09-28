import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X, Sparkles } from "lucide-react";
import { type TemplateProps } from "./types";
import { ImageGeneration } from "@/components/agents/image-generation";

export default function Template4(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets,
    bulletsTitle,
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
    <div className="w-full max-w-7xl mx-auto py-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* LEFT: Copy + Form */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
            {isEditor ? (
              <input
                type="text"
                value={bulletsTitle || ""}
                onChange={(e) => setBulletsTitle?.(e.target.value)}
                placeholder="Free Resource · Limited Time"
                className={`text-[9px] font-black uppercase tracking-[0.22em] bg-transparent outline-none w-full ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
              />
            ) : (
              <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                {bulletsTitle || "Free Resource · Limited Time"}
              </span>
            )}
          </div>

          {isEditor ? (
            <>
              <textarea ref={headlineRef} rows={1} value={headline || ""} onChange={(e) => { setHeadline?.(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} className={`w-full text-2xl md:text-3xl font-black leading-tight bg-transparent outline-none resize-none ${isDark ? "text-white" : "text-zinc-900"}`} placeholder="Your headline here" />
              <textarea ref={subheadlineRef} rows={1} value={subheadline || ""} onChange={(e) => { setSubheadline?.(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} className={`w-full text-sm bg-transparent outline-none resize-none ${isDark ? "text-zinc-400" : "text-zinc-500"}`} placeholder="Short subhead. say what they will get" />
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
                className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${isDark ? "text-zinc-400 placeholder:text-zinc-500/70" : "text-zinc-600 placeholder:text-zinc-400/70"}`}
              />
            </>
          ) : (
            <>
              <h1 className={`text-2xl md:text-3xl font-black leading-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                {headline || "Free Resource"}
              </h1>
              {subheadline && (
                <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  {subheadline}
                </p>
              )}
              {pitch && (
                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                  {pitch}
                </p>
              )}
            </>
          )}

          {bullets && bullets.length > 0 ? (
            <div className="space-y-2">
              {bullets.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md" style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}44` }}>
                    <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  {isEditor ? (
                    <>
                      <input type="text" value={item} onChange={(e) => { if (!bullets || !setBullets) return; const u = [...bullets]; u[idx] = e.target.value; setBullets(u); }} className={`w-full bg-transparent outline-none text-xs ${isDark ? "text-zinc-300" : "text-zinc-600"}`} placeholder="Bullet point item..." />
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
                    <span className={`text-xs ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
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
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-600/60 hover:border-zinc-400 bg-zinc-900/40 hover:bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition cursor-pointer mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add bullet</span>
            </button>
          )}

          <div
            className={`rounded-2xl border p-5 sm:p-6 text-left transition-all duration-300 backdrop-blur-md shadow-xl ${
              isDark ? "bg-[#14141A]/90 text-white" : "bg-white/90 text-zinc-900"
            }`}
            style={{
              borderColor: `${brandColor}33`,
              boxShadow: `0 10px 30px -4px ${brandColor}25`,
            }}
          >
            {isEditor ? (
              <div className="space-y-3">
                <div className="space-y-1 text-center">
                  <input
                    type="text"
                    value={formTitle || ""}
                    onChange={(e) => setFormTitle?.(e.target.value)}
                    className={`w-full text-center text-base sm:text-lg font-black bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${isDark ? "text-white" : "text-zinc-900"}`}
                    placeholder="Get instant access"
                  />
                  <input
                    type="text"
                    value={formSubtitle || ""}
                    onChange={(e) => setFormSubtitle?.(e.target.value)}
                    className="w-full text-center text-xs text-[#9B9085] bg-transparent outline-none placeholder:text-zinc-500"
                    placeholder="By opting in you consent to receive this resource by email."
                  />
                </div>

                <div className={customFormFields && customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                  <input
                    type="text"
                    placeholder="Name *"
                    readOnly
                    className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    readOnly
                    className="min-h-10 h-10 w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />
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
                    if (e.target.value === "Send it to me" || e.target.value === "Get instant access" || e.target.value === "Unlock Free Access →") {
                      setFormButtonText?.("");
                    } else {
                      e.target.select();
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setFormButtonText?.("Get instant access");
                    }
                  }}
                  placeholder="Get instant access"
                  className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-text mt-2 outline-none border-2 border-transparent hover:border-white/40 focus:border-white transition duration-150"
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`, boxShadow: `0 6px 24px -4px ${brandColor}88` }}
                />
              </div>
            ) : (
              <form onSubmit={onSubmitPublicForm} className="space-y-3">
                <div className="space-y-1 text-center">
                  <h3 className={`w-full text-center text-base sm:text-lg font-black ${isDark ? "text-white" : "text-zinc-900"}`}>
                    {formTitle || "Get instant access"}
                  </h3>
                  <p className="text-xs text-[#9B9085] text-center leading-normal">
                    {formSubtitle || "By opting in you consent to receive this resource by email."}
                  </p>
                </div>

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
                  {isSubmitting ? "Submitting..." : (formButtonText || "Get instant access")}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT: Orbital image */}
        <div className="col-span-12 lg:col-span-6 flex items-center justify-center relative py-6 min-h-[380px] sm:min-h-[440px] lg:min-h-[500px]">
          <div className="absolute rounded-full pointer-events-none" style={{ width: "min(92vw, 520px)", height: "min(92vw, 520px)", background: `radial-gradient(circle, ${brandColor}22 0%, transparent 70%)`, filter: "blur(32px)" }} />
          <div className="absolute rounded-full border border-dashed pointer-events-none" style={{ width: "min(84vw, 460px)", height: "min(84vw, 460px)", borderColor: `${brandColor}25` }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: "min(74vw, 400px)", height: "min(74vw, 400px)", border: `1px solid ${brandColor}33`, boxShadow: `0 0 24px ${brandColor}22` }} />
          <div className="absolute rounded-full pointer-events-none" style={{ width: "min(64vw, 350px)", height: "min(64vw, 350px)", border: `2px solid ${brandColor}55`, boxShadow: `0 0 36px ${brandColor}33` }} />
          <div className="relative rounded-full overflow-hidden z-10 group" style={{ width: "min(56vw, 310px)", height: "min(56vw, 310px)", border: `3.5px solid ${brandColor}88`, boxShadow: `0 0 45px -6px ${brandColor}88` }}>
            {/* Upload Progress Overlay for Orbit circle */}
            {uploadProgress !== null && uploadProgress !== undefined && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white">
                <div className="w-full max-w-[170px] space-y-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">
                    {uploadProgress === 100 ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>{uploadProgress === 100 ? "Done!" : "Uploading"}</span>
                    <span className="font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0066B2] dark:bg-[#38BDF8] rounded-full transition-all duration-150 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400">Optimizing media...</p>
                </div>
              </div>
            )}
            {isGeneratingAICover ? (
              <ImageGeneration
                status="generating"
                prompt={headline || "Digital Strategy Cover"}
                resolution="1200 × 630"
                label="AI agent rendering cover artwork"
                aspectRatio="16 / 9"
                className="h-full w-full min-h-[220px]"
              />
            ) : imageUrl && imageUrl.trim() !== "" ? (
              <>
                <img
                  src={imageUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                {isEditor && (
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white transition duration-200">
                    <button
                      type="button"
                      disabled={isGeneratingAICover}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateAICoverImage?.();
                      }}
                      className="flex items-center gap-1 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white border border-indigo-400/30 backdrop-blur-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAICover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      )}
                      <span>AI Cover</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef?.current?.click();
                      }}
                      className="flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-[11px] font-bold text-white border border-white/30 backdrop-blur-md transition cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Replace</span>
                    </button>
                    {setImageUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl(null);
                        }}
                        className="flex items-center gap-1 rounded-xl bg-red-500/30 hover:bg-red-500/50 px-3 py-1.5 text-[11px] font-bold text-red-300 border border-red-400/40 backdrop-blur-md transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-300" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : isEditor ? (
              <button
                type="button"
                onClick={() => fileInputRef?.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer transition group/btn hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${brandColor}88 0%, #0d0012 100%)` }}
              >
                <ImageIcon className="h-8 w-8 text-white/80 group-hover/btn:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-white">Add Cover Image</span>
                <span className="text-[10px] text-white/60 mt-0.5">Click to upload</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Check, Loader2, ImageIcon, Plus, X, Sparkles } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template2(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets,
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

  const getHeadlineFontSize = (text: string) => {
    const len = text ? text.length : 0;
    if (len > 60) return "text-base sm:text-lg md:text-xl font-bold";
    if (len > 35) return "text-lg sm:text-xl md:text-2xl font-extrabold";
    return "text-xl sm:text-2xl md:text-3xl font-black";
  };

  return (
    <div className="w-full mx-auto py-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-stretch">
        {/* Left Panel: Cover Image + Gradient Scrim + Bullets (~60%) */}
        <div className="lg:col-span-7 relative flex flex-col justify-end p-6 sm:p-8 md:p-10 rounded-3xl overflow-hidden min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] bg-zinc-900 text-white shadow-2xl border border-black/10 dark:border-white/10 group">
          {imageUrl && imageUrl.trim() !== "" && (
            <img
              src={imageUrl}
              alt="Lead capture cover"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c16] via-[#0a0c16]/60 to-transparent pointer-events-none" />

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

          {/* Top Left Image Action Buttons (Editor Mode) */}
          {isEditor && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef?.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-black px-3.5 py-2 text-xs font-bold text-white shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
              >
                <ImageIcon className="h-4 w-4 text-zinc-300" />
                <span>{imageUrl && imageUrl.trim() !== "" ? "Replace Image" : "Add Image"}</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingAICover}
                onClick={handleGenerateAICoverImage}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md border border-indigo-400/30 backdrop-blur-md transition cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAICover ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                )}
                <span>AI Cover</span>
              </button>
            </div>
          )}

          {/* Left Panel Content */}
          <div className="relative z-10 space-y-3">
            {isEditor ? (
              <>
                <textarea
                  ref={headlineRef}
                  rows={1}
                  value={headline || ""}
                  onChange={(e) => {
                    setHeadline?.(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className={`w-full ${getHeadlineFontSize(headline || "")} text-white bg-transparent outline-none resize-none leading-tight drop-shadow-md placeholder:text-white/50`}
                  placeholder="Your headline here"
                />

                <textarea
                  ref={subheadlineRef}
                  rows={1}
                  value={subheadline || ""}
                  onChange={(e) => {
                    setSubheadline?.(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full text-sm text-white/80 bg-transparent outline-none resize-none leading-relaxed placeholder:text-white/40"
                  placeholder="Short subhead. say what they will get"
                />

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
                  className="w-full text-xs text-white/70 bg-transparent outline-none resize-none leading-relaxed placeholder:text-white/30"
                />
              </>
            ) : (
              <>
                <h1 className={`text-white leading-tight drop-shadow-md ${getHeadlineFontSize(headline || "")}`}>
                  {headline || "Free Resource"}
                </h1>
                {subheadline && (
                  <p className="text-sm text-white/80 leading-relaxed">
                    {subheadline}
                  </p>
                )}
                {pitch && (
                  <p className="text-xs text-white/70 leading-relaxed">
                    {pitch}
                  </p>
                )}
              </>
            )}

            {/* Bullets */}
            <div className="space-y-2 pt-1">
              {bullets && bullets.length > 0 ? (
                <ul className="space-y-2">
                  {bullets.map((b: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-200">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 mt-0.5">
                        ✓
                      </span>
                      {isEditor ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={b}
                            onChange={(e) => {
                              if (!bullets || !setBullets) return;
                              const updated = [...bullets];
                              updated[i] = e.target.value;
                              setBullets(updated);
                            }}
                            className="w-full bg-transparent outline-none text-xs text-zinc-200 placeholder:text-white/40"
                            placeholder="Bullet point..."
                          />
                          <button
                            type="button"
                            onClick={() => setBullets?.(bullets.filter((_: any, idx: number) => idx !== i))}
                            className="text-zinc-400 hover:text-white p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span>{b}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : isEditor ? (
                <p className="text-xs italic text-white/60 my-1">
                  No bullets yet. click + to add one.
                </p>
              ) : null}

              {isEditor && setBullets && (
                <button
                  type="button"
                  onClick={() => setBullets([...(bullets || []), ""])}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/30 hover:border-white/60 bg-black/30 hover:bg-black/50 px-3.5 py-1.5 text-xs font-medium text-white transition cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add bullet</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all duration-300 backdrop-blur-md ${isDark ? "border-zinc-800 bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
            <div className="space-y-3">
            {isEditor ? (
              <>
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  placeholder="Send it to me"
                  className="w-full text-center text-lg font-bold bg-transparent outline-none placeholder:text-zinc-400/60"
                />
                <input
                  type="text"
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  placeholder="By opting in you consent to receive this resource by email."
                  className="w-full text-center text-xs text-zinc-400 bg-transparent outline-none placeholder:text-zinc-400/60"
                />
              </>
            ) : (
              <>
                <h2 className="w-full text-center text-lg font-bold">
                  {formTitle || "Send it to me"}
                </h2>
                {formSubtitle && (
                  <p className="w-full text-center text-xs text-zinc-400">
                    {formSubtitle}
                  </p>
                )}
              </>
            )}

            {isEditor ? (
              <div className="pt-2">
                <div className={customFormFields && customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                  <input
                    type="text"
                    placeholder="Name *"
                    readOnly
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    readOnly
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />

                  {customFormFields.map((field: any) => (
                    <input
                      key={field.id}
                      type="text"
                      placeholder={`${field.label || "New Field"}${field.required ? " *" : ""}`}
                      readOnly
                      className={`w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs ${field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}`}
                    />
                  ))}
                </div>

                <input
                  type="text"
                  value={formButtonText || ""}
                  onChange={(e) => setFormButtonText?.(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === "Send it to me" || e.target.value === "Get early access") {
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
                  className="w-full text-center rounded-xl py-3 px-4 text-xs font-extrabold text-white shadow-md transition duration-150 outline-none border-2 border-transparent hover:border-white/40 focus:border-white cursor-text mt-3"
                  style={{ backgroundColor: brandColor }}
                />
              </div>
            ) : (
              <form onSubmit={onSubmitPublicForm} className="pt-2">
                <div className={customFormFields && customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "space-y-2.5"}>
                  <input
                    type="text"
                    required
                    placeholder="Name *"
                    value={publicFormValues.name || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email *"
                    value={publicFormValues.email || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs"
                  />

                  {customFormFields.map((field: any) => (
                    <input
                      key={field.id}
                      type="text"
                      required={field.required}
                      placeholder={`${field.label}${field.required ? " *" : ""}`}
                      value={publicFormValues[field.id] || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                      className={`w-full rounded-xl border border-zinc-200 dark:border-[#252529] bg-white dark:bg-[#18181C] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition shadow-xs ${field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-center rounded-xl py-3 px-4 text-xs font-extrabold text-white shadow-md transition duration-150 outline-none border-2 border-transparent hover:border-white/40 focus:border-white cursor-pointer mt-3 disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  {isSubmitting ? "Submitting..." : (formButtonText || "Send it to me")}
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X, Gift } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template6(props: TemplateProps) {
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
    deliverable,
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
  const highlightIntensity = account?.highlightIntensity ?? 100;
  const isDark = themeMode === "dark";

  return (
    <div className="w-full max-w-7xl mx-auto py-1 relative flex-1 flex flex-col justify-center">
      {/* Upload progress overlay */}
      {uploadProgress !== null && uploadProgress !== undefined && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center text-white rounded-3xl">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0066B2]/20 border border-[#0066B2]/40 text-[#0066B2] dark:text-[#38BDF8]">
            {uploadProgress === 100 ? (
              <Check className="h-6 w-6 text-emerald-400" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-[#0066B2] dark:text-[#38BDF8]" />
            )}
          </div>
          <p className="text-sm font-bold">
            {uploadProgress === 100 ? "Image uploaded!" : "Uploading cover image..."}
          </p>
          <div className="mt-3 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800 p-0.5 border border-zinc-700">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#0066B2] via-sky-400 to-emerald-400 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="mt-1 font-mono text-xs text-zinc-300 font-bold">{uploadProgress}%</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14 items-center w-full">
        {/* LEFT: Full-bleed image panel */}
        <div className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-3xl shadow-2xl min-h-[400px] sm:min-h-[460px] lg:min-h-[520px] xl:min-h-[580px] flex flex-col justify-between border border-black/10 dark:border-white/10 group">
          {imageUrl && imageUrl.trim() !== "" ? (
            <img src={imageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={{ background: `linear-gradient(155deg, ${brandColor}99 0%, #060610 55%, #12001a 100%)` }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                {[160, 110, 66, 32].map((size, i) => (
                  <div key={i} className="absolute rounded-full border border-white" style={{ width: size, height: size, opacity: 1 - i * 0.2 }} />
                ))}
              </div>
            </div>
          )}
          {/* Scrim overlays */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 50%, transparent 80%)" }} />

          {/* Overlaid content */}
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 md:p-10 z-10 pointer-events-auto">
            {/* Top: Image action buttons */}
            {isEditor ? (
              <div className="flex items-center justify-start gap-2 max-w-[260px]">
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-black px-3.5 py-1.5 text-xs font-bold text-white shadow-xl border border-white/30 backdrop-blur-md transition cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
                  <span>{imageUrl ? "Replace Image" : "Add Image"}</span>
                </button>
                {imageUrl && setImageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-red-950 px-3 py-1.5 text-xs font-bold text-red-400 shadow-xl border border-white/30 backdrop-blur-md transition cursor-pointer"
                    title="Remove cover image"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            ) : <div />}

            {/* Bottom: headline + subheadline */}
            <div className="space-y-2 max-w-2xl">
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
                    className="w-full text-3xl sm:text-4xl md:text-5xl lg:text-[2.4rem] xl:text-[3rem] font-black text-white bg-transparent outline-none resize-none leading-tight drop-shadow-2xl"
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
                    className="w-full text-sm sm:text-base md:text-lg font-medium text-white/90 bg-transparent outline-none resize-none leading-relaxed drop-shadow-md"
                    placeholder="Your subheadline"
                  />
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.4rem] xl:text-[3rem] font-black text-white leading-tight drop-shadow-2xl">
                    {headline || "Free Resource"}
                  </h1>
                  {subheadline && (
                    <p className="text-sm sm:text-base md:text-lg font-medium text-white/90 leading-relaxed drop-shadow-md">
                      {subheadline}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Bullets + Opt-in Form Card */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-center space-y-4 w-full">
          {/* Eyebrow & Bullets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor, boxShadow: `0 0 8px ${brandColor}` }} />
              {isEditor ? (
                <input
                  type="text"
                  value={bulletsTitle || ""}
                  onChange={(e) => setBulletsTitle?.(e.target.value)}
                  className="w-full text-[10px] font-black uppercase tracking-[0.2em] bg-transparent outline-none"
                  style={{ color: brandColor }}
                  placeholder="Exclusive · Free Access"
                />
              ) : (
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: brandColor }}>
                  {bulletsTitle || "Exclusive · Free Access"}
                </span>
              )}
            </div>

            {/* Bullets List */}
            {bullets && bullets.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {bullets.map((item: string, idx: number) => (
                  <div key={idx} className="group flex items-start gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 mt-0.5 items-center justify-center rounded-full" style={{ backgroundColor: `${brandColor}22`, border: `1px solid ${brandColor}55` }}>
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    {isEditor ? (
                      <>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            if (!bullets || !setBullets) return;
                            const u = [...bullets];
                            u[idx] = e.target.value;
                            setBullets(u);
                          }}
                          placeholder={`Bullet point ${idx + 1}`}
                          className={`w-full bg-transparent outline-none text-xs sm:text-sm leading-relaxed ${isDark ? "text-zinc-300 placeholder:text-zinc-600" : "text-zinc-600 placeholder:text-zinc-400"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setBullets?.(bullets.filter((_: any, i: number) => i !== idx))}
                          className="text-zinc-400 hover:text-red-400 transition cursor-pointer p-0.5 shrink-0"
                          title="Remove bullet"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs sm:text-sm md:text-base leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                        {item}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : isEditor ? (
              <p className="text-[10px] italic text-zinc-400 my-0.5">
                No bullets yet. click + to add one.
              </p>
            ) : null}

            {isEditor && setBullets && (
              <button
                type="button"
                onClick={() => setBullets([...(bullets || []), ""])}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-black/40 hover:bg-black/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add bullet</span>
              </button>
            )}
          </div>

          {/* Enclosed Opt-In Form Card (Exact match with MagnetSignupForm & Template 1/4) */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 lg:p-6 text-left transition-all duration-300 backdrop-blur-sm shadow-xl ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
            style={{
              borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, '0')}`,
              boxShadow: highlightIntensity > 20 ? `0 10px 30px -4px ${brandColor}${Math.round((highlightIntensity / 100) * 0.35 * 255).toString(16).padStart(2, '0')}` : "0 2px 8px rgba(0,0,0,0.05)",
              background: !isDark
                ? `linear-gradient(135deg, ${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, '0')} 0%, rgba(255, 255, 255, 0.95) 60%)`
                : `linear-gradient(135deg, ${brandColor}${Math.round((0.08 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, '0')} 0%, rgba(22, 22, 25, 0.95) 60%)`
            }}
          >
            {isEditor ? (
              <>
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  placeholder="Get instant access"
                  className={`w-full text-xl sm:text-2xl font-black text-center tracking-tight bg-transparent outline-none ${
                    isDark ? "text-white placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-400"
                  }`}
                />
                <input
                  type="text"
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  placeholder="By opting in you consent to receive this resource by email."
                  className="w-full text-xs sm:text-sm text-[#9B9085] text-center mt-1.5 leading-normal bg-transparent outline-none"
                />
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-black text-center tracking-tight">
                  {formTitle || "Get instant access"}
                </p>
                <p className="text-xs sm:text-sm text-[#9B9085] text-center mt-1.5 leading-normal">
                  {formSubtitle || "By opting in you consent to receive this resource by email."}
                </p>
              </>
            )}

            {/* Inputs Section */}
            {isEditor ? (
              <div className="mt-4 flex flex-col gap-3">
                <div className={customFormFields && customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}>
                  <input
                    type="text"
                    placeholder="Name"
                    readOnly
                    className={`min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs pointer-events-none ${
                      isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    readOnly
                    className={`min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs pointer-events-none ${
                      isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                  {customFormFields.map((field: any) => (
                    <div
                      key={field.id}
                      className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}
                    >
                      <input
                        type="text"
                        placeholder={`${field.label || field.placeholder || "Field"}${field.required ? " *" : ""}`}
                        readOnly
                        className={`min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs pointer-events-none ${
                          isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  value={formButtonText || ""}
                  onChange={(e) => setFormButtonText?.(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === "Send it to me" || e.target.value === "Get instant access") {
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
                  className="w-full min-h-11 h-11 text-center rounded-xl py-2.5 px-4 text-sm font-black text-white cursor-text outline-none shadow-md transition-all active:scale-98"
                  style={{ backgroundColor: brandColor }}
                />
              </div>
            ) : (
              <form onSubmit={onSubmitPublicForm} className="mt-4 flex flex-col gap-3">
                <div className={customFormFields && customFormFields.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={publicFormValues.name || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                    className={`min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs ${
                      isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={publicFormValues.email || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                    className={`min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs ${
                      isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                  />
                  {customFormFields.map((field: any) => (
                    <div
                      key={field.id}
                      className={field.type === "textarea" ? "col-span-1 sm:col-span-2" : ""}
                    >
                      {field.type === "textarea" ? (
                        <textarea
                          rows={2}
                          required={field.required}
                          placeholder={`${field.label || field.placeholder || "Field"}${field.required ? " *" : ""}`}
                          value={publicFormValues[field.id] || ""}
                          onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs ${
                            isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                          }`}
                        />
                      ) : field.type === "select" ? (
                        <select
                          required={field.required}
                          value={publicFormValues[field.id] || ""}
                          onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                          className={`min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs ${
                            isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                          }`}
                        >
                          <option value="">{`${field.label || "Select"}${field.required ? " *" : ""}`}</option>
                          {(field.options || []).map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          required={field.required}
                          placeholder={`${field.label || field.placeholder || "Field"}${field.required ? " *" : ""}`}
                          value={publicFormValues[field.id] || ""}
                          onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                          className={`min-h-11 h-11 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition shadow-xs ${
                            isDark ? "bg-black/40 border-white/15 text-white placeholder:text-zinc-400" : "bg-white/90 border-black/15 text-zinc-900 placeholder:text-zinc-400"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-11 h-11 inline-flex items-center justify-center rounded-xl hover:opacity-90 px-4 py-2.5 text-sm font-black text-white transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: brandColor }}
                >
                  {isSubmitting ? "Sending..." : (formButtonText || "Get instant access")}
                </button>
              </form>
            )}
          </div>

          {/* Deliverable info */}
          {deliverable && (
            <p className={`flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              <Gift className="h-3.5 w-3.5" />
              {deliverable}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

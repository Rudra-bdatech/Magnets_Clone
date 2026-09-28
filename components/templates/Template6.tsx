import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template6(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
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
    headlineRef,
    subheadlineRef,
    setHeadline,
    setSubheadline,
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
    <div className="w-full max-w-7xl mx-auto py-1 relative">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* LEFT: Image panel */}
        <div className="col-span-12 lg:col-span-6 relative overflow-hidden rounded-3xl shadow-2xl aspect-[4/3] max-h-[360px] min-h-[300px]">
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
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />

            {/* Overlaid content */}
            <div className="absolute inset-0 flex flex-col justify-between p-5 z-10 pointer-events-auto">
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
              <div className="space-y-2 max-w-[85%] sm:max-w-[340px]">
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
                      className="w-full text-2xl sm:text-3xl font-black text-white bg-transparent outline-none resize-none leading-tight drop-shadow-2xl"
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
                      className="w-full text-xs sm:text-sm font-medium text-white/75 bg-transparent outline-none resize-none leading-relaxed drop-shadow-md"
                      placeholder="Your subheadline"
                    />
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-2xl">
                      {headline || "Free Resource"}
                    </h1>
                    {subheadline && (
                      <p className="text-xs sm:text-sm font-medium text-white/75 leading-relaxed drop-shadow-md">
                        {subheadline}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        {/* RIGHT: Form and details */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-center space-y-3.5">
            <div className="space-y-0.5">
              {isEditor ? (
                <>
                  <input
                    type="text"
                    value={bulletsTitle || ""}
                    onChange={(e) => setBulletsTitle?.(e.target.value)}
                    className="w-full text-[10px] font-black uppercase tracking-[0.2em] bg-transparent outline-none"
                    style={{ color: brandColor }}
                    placeholder="Category / Tag"
                  />
                  <input
                    type="text"
                    value={formTitle || ""}
                    onChange={(e) => setFormTitle?.(e.target.value)}
                    className={`w-full text-base font-black bg-transparent outline-none ${isDark ? "text-white placeholder:text-zinc-600" : "text-zinc-900 placeholder:text-zinc-400"}`}
                    placeholder="Form Title"
                  />
                  <input
                    type="text"
                    value={formSubtitle || ""}
                    onChange={(e) => setFormSubtitle?.(e.target.value)}
                    className={`w-full text-xs bg-transparent outline-none ${isDark ? "text-zinc-400 placeholder:text-zinc-600" : "text-zinc-500 placeholder:text-zinc-400"}`}
                    placeholder="Form Subtitle"
                  />
                </>
              ) : (
                <>
                  {bulletsTitle && (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] block" style={{ color: brandColor }}>
                      {bulletsTitle}
                    </span>
                  )}
                  <h2 className={`text-base font-black ${isDark ? "text-white" : "text-zinc-900"}`}>
                    {formTitle || "Claim Your Copy"}
                  </h2>
                  {formSubtitle && (
                    <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                      {formSubtitle}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}44, transparent)` }} />
              <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Sign Up Free</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}44, transparent)` }} />
            </div>

            {/* Bullets */}
            <div className="space-y-1.5 pt-1">
              {bullets && bullets.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {bullets.map((item: string, idx: number) => (
                    <div key={idx} className="group flex items-start gap-2">
                      <div className="flex h-3.5 w-3.5 shrink-0 mt-0.5 items-center justify-center rounded-full" style={{ backgroundColor: `${brandColor}22`, border: `1px solid ${brandColor}55` }}>
                        <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M1 3l1.5 1.5L5 1.5" stroke={brandColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                            className={`w-full bg-transparent outline-none text-xs leading-relaxed ${isDark ? "text-zinc-300 placeholder:text-zinc-600" : "text-zinc-600 placeholder:text-zinc-400"}`}
                          />
                          <button
                            type="button"
                            onClick={() => setBullets?.(bullets.filter((_: any, i: number) => i !== idx))}
                            className="text-zinc-400 hover:text-red-400 transition cursor-pointer p-0.5 shrink-0"
                            title="Remove bullet"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
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
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-black/40 hover:bg-black/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md transition cursor-pointer mt-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add bullet</span>
                </button>
              )}
            </div>

            {/* Form fields */}
            {isEditor ? (
              <div className="space-y-2">
                {[{ icon: "name", placeholder: "Full name", type: "text" }, { icon: "email", placeholder: "Email address", type: "email" }].map(({ icon, placeholder, type }) => (
                  <div key={icon} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f4f5f8", border: `1px solid ${isDark ? `${brandColor}22` : `${brandColor}20`}` }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                      {icon === "name" ? <><circle cx="6" cy="4" r="2.5" stroke={brandColor} strokeWidth="1.4" /><path d="M1.5 10.5C1.5 8.567 3.567 7 6 7s4.5 1.567 4.5 3.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" /></> : <><rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke={brandColor} strokeWidth="1.4" /><path d="M1 4l5 3.5L11 4" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" /></>}
                    </svg>
                    <input type={type} placeholder={placeholder} readOnly className={`w-full bg-transparent text-[11px] outline-none pointer-events-none ${isDark ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`} />
                  </div>
                ))}
                {customFormFields.map((field: any) => (
                  <div key={field.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f4f5f8", border: `1px solid ${brandColor}22` }}>
                    <input type="text" placeholder={field.label || field.placeholder || "New Field"} readOnly className={`w-full bg-transparent text-[11px] outline-none pointer-events-none ${isDark ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`} />
                  </div>
                ))}
                <input
                  type="text"
                  value={formButtonText || ""}
                  onChange={(e) => setFormButtonText?.(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === "Send it to me" || e.target.value === "Unlock Free Access") {
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
                  className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-text outline-none border-2 border-transparent hover:border-white/40 focus:border-white transition duration-150"
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}bb 100%)`, boxShadow: `0 0 24px -4px ${brandColor}88, 0 4px 12px rgba(0,0,0,0.2)` }}
                />
              </div>
            ) : (
              <form onSubmit={onSubmitPublicForm} className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f4f5f8", border: `1px solid ${isDark ? `${brandColor}22` : `${brandColor}20`}` }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <circle cx="6" cy="4" r="2.5" stroke={brandColor} strokeWidth="1.4" /><path d="M1.5 10.5C1.5 8.567 3.567 7 6 7s4.5 1.567 4.5 3.5" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    required
                    placeholder="Full name *"
                    value={publicFormValues.name || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                    className={`w-full bg-transparent text-[11px] outline-none ${isDark ? "text-white placeholder:text-zinc-500" : "text-zinc-800 placeholder:text-zinc-400"}`}
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f4f5f8", border: `1px solid ${isDark ? `${brandColor}22` : `${brandColor}20`}` }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <rect x="1" y="2.5" width="10" height="7" rx="1.5" stroke={brandColor} strokeWidth="1.4" /><path d="M1 4l5 3.5L11 4" stroke={brandColor} strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="email"
                    required
                    placeholder="Email address *"
                    value={publicFormValues.email || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                    className={`w-full bg-transparent text-[11px] outline-none ${isDark ? "text-white placeholder:text-zinc-500" : "text-zinc-800 placeholder:text-zinc-400"}`}
                  />
                </div>
                {customFormFields.map((field: any) => (
                  <div key={field.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f4f5f8", border: `1px solid ${brandColor}22` }}>
                    <input
                      type="text"
                      required={field.required}
                      placeholder={`${field.label}${field.required ? " *" : ""}`}
                      value={publicFormValues[field.id] || ""}
                      onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                      className={`w-full bg-transparent text-[11px] outline-none ${isDark ? "text-white placeholder:text-zinc-500" : "text-zinc-800 placeholder:text-zinc-400"}`}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-center rounded-xl py-3 px-4 text-xs font-black text-white cursor-pointer outline-none border-2 border-transparent hover:border-white/40 transition duration-150 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}bb 100%)`, boxShadow: `0 0 24px -4px ${brandColor}88, 0 4px 12px rgba(0,0,0,0.2)` }}
                >
                  {isSubmitting ? "Submitting..." : (formButtonText || "Send it to me")}
                </button>
              </form>
            )}

            {/* Social proof */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex -space-x-2">
                {["#e879f9", "#38bdf8", "#4ade80", "#fb923c"].map((color, i) => (
                  <div key={i} className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-[7px] font-black text-white" style={{ backgroundColor: color, borderColor: isDark ? "#0b0b10" : "#ffffff" }}>
                    {["A", "B", "C", "D"][i]}
                  </div>
                ))}
              </div>
              <span className={`text-[10px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                Joined by <strong className={isDark ? "text-white" : "text-zinc-800"}>1,400+</strong> creators
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}

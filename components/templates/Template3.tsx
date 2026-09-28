import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template3(props: TemplateProps) {
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
  const logo = account?.logo || null;
  const businessName = account?.brandName || account?.name || "";

  return (
    <div className="w-full max-w-7xl mx-auto py-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center lg:items-stretch">
        {/* LEFT: Aurora Image Tile (5 cols) */}
        <div className="col-span-12 lg:col-span-5 relative flex flex-col items-center justify-center min-h-[440px] lg:min-h-full">
          {/* Brand Logo & Brand Name aligned with top of right side content */}
          {(logo || businessName) && (
            <div className="lg:absolute lg:top-0 lg:left-0 lg:right-0 flex items-center justify-center gap-2.5 mb-4 lg:mb-0">
              <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center bg-transparent overflow-hidden shadow-xs ${logo ? "border-none" : "border-2 border-dashed border-[#a1a1aa]/50"}`}>
                {logo ? (
                  <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-4 w-4 rounded-md border-2 border-dashed border-[#a1a1aa]" />
                )}
              </div>
              <span className={`text-base sm:text-lg font-black tracking-wider uppercase ${isDark ? "text-white" : "text-zinc-900"}`}>
                {businessName}
              </span>
            </div>
          )}

          <div className="rounded-3xl overflow-hidden relative shadow-2xl aspect-[4/5] max-h-[380px] w-full border border-black/5 dark:border-white/5 group">
          {imageUrl && imageUrl.trim() !== "" && (
            <img
              src={imageUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Right fade into card */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: isDark ? "linear-gradient(to right, transparent 55%, #0c0c12 100%)" : "linear-gradient(to right, transparent 55%, #f7f8fc 100%)" }}
          />
          {/* Bottom fade */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />

          {/* Upload Progress Indicator Overlay */}
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

          {/* Overlay Image Action Buttons */}
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
              {imageUrl && imageUrl.trim() !== "" && setImageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="flex items-center gap-1.5 rounded-xl bg-black/75 hover:bg-red-950/80 px-3.5 py-2 text-xs font-bold text-red-400 shadow-md border border-white/20 backdrop-blur-md transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          )}
          </div>
        </div>

        {/* RIGHT: Editorial Form Panel (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-center space-y-4">
          {/* Eyebrow / Bullets Title */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
            {isEditor ? (
              <input
                type="text"
                value={bulletsTitle || ""}
                onChange={(e) => setBulletsTitle?.(e.target.value)}
                placeholder="Free Resource · Instant Access"
                className={`text-[9px] font-black uppercase tracking-[0.2em] bg-transparent outline-none w-full ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
              />
            ) : (
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                {bulletsTitle || "Free Resource · Instant Access"}
              </span>
            )}
          </div>

          {/* Headline & Subheadline */}
          <div className="space-y-1.5">
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
                  placeholder="Your headline here"
                  className={`w-full text-xl md:text-2xl font-black leading-tight bg-transparent outline-none resize-none ${isDark ? "text-white" : "text-zinc-900"}`}
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
                  placeholder="Short subhead. say what they will get"
                  className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
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
                  className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${isDark ? "text-zinc-400 placeholder:text-zinc-500/70" : "text-zinc-600 placeholder:text-zinc-400/70"}`}
                />
              </>
            ) : (
              <>
                <h1 className={`text-xl md:text-2xl font-black leading-tight ${isDark ? "text-white" : "text-zinc-900"}`}>
                  {headline || "Free Resource"}
                </h1>
                {subheadline && (
                  <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
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
          </div>

          {/* Bullets */}
          <div className="space-y-2">
            {bullets && bullets.length > 0 ? (
              <div className="space-y-1.5">
                {bullets.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
                      style={{ background: `${brandColor}22`, border: `1px solid ${brandColor}44` }}
                    >
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                        <path d="M1 3.5l1.7 1.7L6 1.5" stroke={brandColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
                          placeholder="Bullet point item..."
                          className={`w-full bg-transparent outline-none text-[11px] font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
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
                      <span className={`text-[11px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
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
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${brandColor}44, transparent)` }} />
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Sign Up Free</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${brandColor}44, transparent)` }} />
          </div>

          {/* Form fields */}
          <div className="space-y-2">
            {isEditor ? (
              <>
                <input type="text" value={formTitle || ""} onChange={(e) => setFormTitle?.(e.target.value)} className={`w-full text-center text-xs font-bold bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${isDark ? "text-white" : "text-zinc-900"}`} placeholder="Claim Your Copy" />
                <input type="text" placeholder="Name *" readOnly className={`w-full rounded-xl px-3 py-2 text-xs opacity-60 outline-none border border-zinc-200 dark:border-[#252529] ${isDark ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`} />
                <input type="email" placeholder="Email *" readOnly className={`w-full rounded-xl px-3 py-2 text-xs opacity-60 outline-none border border-zinc-200 dark:border-[#252529] ${isDark ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`} />
                {customFormFields.map((field: any) => (
                  <input
                    key={field.id}
                    type="text"
                    placeholder={`${field.label || "New Field"}${field.required ? " *" : ""}`}
                    readOnly
                    className={`w-full rounded-xl px-3 py-2 text-xs opacity-60 outline-none border border-zinc-200 dark:border-[#252529] ${isDark ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`}
                  />
                ))}
                <input
                  type="text"
                  value={formButtonText || ""}
                  onChange={(e) => setFormButtonText?.(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === "Send it to me") {
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
                  className="w-full text-center rounded-xl py-2.5 px-4 text-xs font-extrabold text-white shadow-xl transition duration-150 outline-none border-2 border-transparent hover:border-white/40 focus:border-white cursor-text"
                  style={{ backgroundColor: brandColor }}
                />
              </>
            ) : (
              <form onSubmit={onSubmitPublicForm} className="space-y-2">
                {formTitle && (
                  <h3 className={`w-full text-center text-xs font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
                    {formTitle}
                  </h3>
                )}
                <input
                  type="text"
                  required
                  placeholder="Name *"
                  value={publicFormValues.name || ""}
                  onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border border-zinc-200 dark:border-[#252529] ${isDark ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`}
                />
                <input
                  type="email"
                  required
                  placeholder="Email *"
                  value={publicFormValues.email || ""}
                  onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 text-xs outline-none border border-zinc-200 dark:border-[#252529] ${isDark ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`}
                />
                {customFormFields.map((field: any) => (
                  <input
                    key={field.id}
                    type="text"
                    required={field.required}
                    placeholder={`${field.label}${field.required ? " *" : ""}`}
                    value={publicFormValues[field.id] || ""}
                    onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-xs outline-none border border-zinc-200 dark:border-[#252529] ${isDark ? "bg-[#18181C] text-white placeholder:text-zinc-500" : "bg-white text-zinc-800 placeholder:text-zinc-400"}`}
                  />
                ))}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-center rounded-xl py-2.5 px-4 text-xs font-extrabold text-white shadow-xl transition duration-150 outline-none border-2 border-transparent hover:border-white/40 cursor-pointer disabled:opacity-50"
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
  );
}

import React from "react";
import { Check, Loader2, ImageIcon, Trash2, Plus, X, Sparkles } from "lucide-react";
import { type TemplateProps } from "./types";

export default function Template1(props: TemplateProps) {
  const {
    account,
    headline,
    subheadline,
    pitch,
    bullets = [],
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
    setBullets,
    setBulletsTitle,
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

  const isEditor = mode === "editor";
  const brandColor = account?.brandColor || "#0066B2";
  const themeMode = account?.themeMode || "light";
  const highlightIntensity = account?.highlightIntensity ?? 100;
  const isDark = themeMode === "dark";

  const getHeadlineFontSize = (text: string) => {
    const len = text ? text.length : 0;
    if (len > 60) return "text-base sm:text-lg md:text-xl font-bold";
    if (len > 35) return "text-lg sm:text-xl md:text-2xl font-extrabold";
    return "text-xl sm:text-2xl md:text-3xl font-black";
  };

  const handleBulletChange = (index: number, value: string) => {
    if (!setBullets) return;
    const next = [...bullets];
    next[index] = value;
    setBullets(next);
  };

  const handleAddBullet = () => {
    if (!setBullets) return;
    setBullets([...bullets, ""]);
  };

  const handleRemoveBullet = (index: number) => {
    if (!setBullets) return;
    setBullets(bullets.filter((_: any, i: number) => i !== index));
  };

  const displayBullets: string[] =
    bullets && bullets.length > 0
      ? bullets
      : [
          "101 fill-in-the-blank templates for every content scenario",
          "Proven structures for storytelling, advice, and transformation posts",
          "Ready-to-use formats that let you focus on your message",
        ];


  return (
    <div className={`w-full mx-auto py-1 relative ${isDark ? "text-white" : "text-zinc-900"}`}>
      {/* Upload progress overlay */}
      {uploadProgress !== null && uploadProgress !== undefined && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center text-white rounded-2xl">
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Content & Bullets (~58% / 7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between h-full py-1 space-y-4">
          <div className="space-y-3">
            {/* Headline */}
            {isEditor ? (
              <textarea
                ref={headlineRef}
                rows={1}
                value={headline || ""}
                onChange={(e) => {
                  setHeadline?.(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                className={`w-full ${getHeadlineFontSize(headline || "")} bg-transparent outline-none resize-none leading-tight tracking-tight ${
                  isDark ? "text-white placeholder:text-zinc-600" : "text-zinc-900 placeholder:text-zinc-400"
                }`}
                placeholder="101 Winning Viral Templates That Get Results"
              />
            ) : (
              <h1 className={`${getHeadlineFontSize(headline || "")} leading-tight tracking-tight`}>
                {headline || "101 Winning Viral Templates That Get Results"}
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
                className={`w-full text-sm font-semibold leading-relaxed bg-transparent outline-none resize-none ${
                  isDark ? "text-zinc-300 placeholder:text-zinc-600" : "text-zinc-700 placeholder:text-zinc-400"
                }`}
                placeholder="Stop staring at a blank page. Start creating content that actually connects."
              />
            ) : (
              subheadline && (
                <p className={`text-sm font-semibold leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                  {subheadline}
                </p>
              )
            )}

            {/* Pitch */}
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
                className={`w-full text-xs leading-relaxed bg-transparent outline-none resize-none ${
                  isDark ? "text-zinc-400 placeholder:text-zinc-600" : "text-zinc-500 placeholder:text-zinc-400"
                }`}
                placeholder="You know what works on LinkedIn. You've seen the posts that blow up..."
              />
            ) : (
              pitch && (
                <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  {pitch}
                </p>
              )
            )}
          </div>

          {/* Bullets Section */}
          <div className="space-y-3 pt-2">
            {isEditor ? (
              <input
                type="text"
                value={bulletsTitle || ""}
                onChange={(e) => setBulletsTitle?.(e.target.value)}
                className="w-full text-xs font-bold uppercase tracking-wider text-[#9B9085] bg-transparent outline-none"
                placeholder="This playbook breaks down:"
              />
            ) : (
              <p className="text-xs font-bold uppercase tracking-wider text-[#9B9085]">
                {bulletsTitle || "This playbook breaks down:"}
              </p>
            )}

            <ul className="space-y-2.5">
              {displayBullets.map((item: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-xs group">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: brandColor,
                      opacity: 0.5 + (highlightIntensity / 100) * 0.5,
                      boxShadow:
                        highlightIntensity > 30
                          ? `0 0 ${Math.round(14 * (highlightIntensity / 100))}px ${brandColor}${Math.round(
                              (highlightIntensity / 100) * 0.8 * 255
                            ).toString(16).padStart(2, "0")}`
                          : "none",
                    }}
                  >
                    <Check className="h-3 w-3 text-white stroke-[3px]" />
                  </span>

                  {isEditor ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleBulletChange(idx, e.target.value)}
                        className={`flex-1 text-xs bg-transparent outline-none py-0.5 border-b border-transparent focus:border-zinc-400 ${
                          isDark ? "text-zinc-300" : "text-zinc-700"
                        }`}
                        placeholder="Key takeaway or feature bullet..."
                      />
                      {displayBullets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBullet(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition cursor-pointer"
                          title="Remove bullet"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>
                      {item}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {isEditor && (
              <button
                type="button"
                onClick={handleAddBullet}
                className="flex items-center gap-1.5 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline pt-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add key bullet point
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cover Image + Form Card (~42% / 5 cols) */}
        <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Cover Image */}
          <div className="relative rounded-xl border aspect-[16/11] w-full overflow-hidden shadow-xs border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-[#121215] group">
            {imageUrl && imageUrl.trim() !== "" ? (
              <>
                <img src={imageUrl} alt="Lead magnet media" className="w-full h-full object-cover" />
                {isEditor && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef?.current?.click()}
                      className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-black px-3 py-1.5 text-xs font-bold text-white shadow-xl border border-white/30 backdrop-blur-md transition cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-sky-400" /> Replace
                    </button>
                    {setImageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="flex items-center gap-1.5 rounded-xl bg-black/80 hover:bg-red-950 px-2.5 py-1.5 text-xs font-bold text-red-400 shadow-xl border border-white/30 backdrop-blur-md transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-4 text-center transition-all duration-300"
                style={{
                  borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.5) * 255).toString(16).padStart(2, "0")}`,
                  backgroundColor: `${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, "0")}`,
                }}
              >
                <ImageIcon className="h-8 w-8 mb-2 opacity-50" style={{ color: brandColor }} />
                <p className="text-xs font-bold mb-3 text-zinc-500 dark:text-zinc-400">Cover Media Preview</p>

                {isEditor && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef?.current?.click()}
                      className="flex items-center gap-1 rounded-lg bg-[#0066B2] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#005799] transition shadow-xs cursor-pointer"
                    >
                      <ImageIcon className="h-3 w-3" /> Upload Image
                    </button>
                    {handleGenerateAICoverImage && (
                      <button
                        type="button"
                        disabled={isGeneratingAICover}
                        onClick={handleGenerateAICoverImage}
                        className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingAICover ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        {isGeneratingAICover ? "Generating..." : "AI Image"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Card */}
          <div
            className={`rounded-xl border p-4 transition-all duration-300 backdrop-blur-sm flex flex-col justify-between space-y-3 ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
            style={{
              borderColor: `${brandColor}${Math.round((0.15 + (highlightIntensity / 100) * 0.55) * 255).toString(16).padStart(2, "0")}`,
              boxShadow:
                highlightIntensity > 20
                  ? `0 8px 24px -4px ${brandColor}${Math.round((highlightIntensity / 100) * 0.35 * 255).toString(16).padStart(2, "0")}`
                  : "0 2px 8px rgba(0,0,0,0.05)",
              background: isDark
                ? `linear-gradient(135deg, ${brandColor}${Math.round((0.08 + (highlightIntensity / 100) * 0.3) * 255).toString(16).padStart(2, "0")} 0%, rgba(22, 22, 25, 0.95) 60%)`
                : `linear-gradient(135deg, ${brandColor}${Math.round((0.05 + (highlightIntensity / 100) * 0.25) * 255).toString(16).padStart(2, "0")} 0%, rgba(255, 255, 255, 0.95) 60%)`,
            }}
          >
            <div>
              {/* Form Title */}
              {isEditor ? (
                <input
                  type="text"
                  value={formTitle || ""}
                  onChange={(e) => setFormTitle?.(e.target.value)}
                  className={`w-full text-base font-bold text-center bg-transparent outline-none ${
                    isDark ? "text-white placeholder:text-zinc-600" : "text-zinc-900 placeholder:text-zinc-400"
                  }`}
                  placeholder="Download for free now"
                />
              ) : (
                <p className="text-base font-bold text-center">{formTitle || "Download for free now"}</p>
              )}

              {/* Form Subtitle */}
              {isEditor ? (
                <input
                  type="text"
                  value={formSubtitle || ""}
                  onChange={(e) => setFormSubtitle?.(e.target.value)}
                  className={`w-full text-[11px] text-center mt-0.5 bg-transparent outline-none ${
                    isDark ? "text-zinc-400 placeholder:text-zinc-600" : "text-zinc-500 placeholder:text-zinc-400"
                  }`}
                  placeholder="By opting in you consent to receive this resource by email."
                />
              ) : (
                <p className={`text-[11px] text-center mt-1 leading-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  {formSubtitle || "By opting in you consent to receive this resource by email."}
                </p>
              )}
            </div>

            {/* Inputs & Form Button */}
            {isEditor ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="Name"
                  className={`w-full rounded-md border p-2 text-xs focus:outline-none transition pointer-events-none select-none ${
                    isDark ? "bg-[#0E0E10] border-[#252529] text-zinc-400" : "border-[#e4e4e7] text-zinc-400"
                  }`}
                  readOnly
                />
                <input
                  type="email"
                  placeholder="Email"
                  className={`w-full rounded-md border p-2 text-xs focus:outline-none transition pointer-events-none select-none ${
                    isDark ? "bg-[#0E0E10] border-[#252529] text-zinc-400" : "border-[#e4e4e7] text-zinc-400"
                  }`}
                  readOnly
                />

                {customFormFields.map((field: any) => (
                  <input
                    key={field.id}
                    type="text"
                    placeholder={`${field.label || "New Field"}${field.required ? " *" : ""}`}
                    readOnly
                    className={`w-full rounded-md border p-2 text-xs focus:outline-none transition pointer-events-none select-none ${
                      isDark ? "bg-[#0E0E10] border-[#252529] text-zinc-400" : "border-[#e4e4e7] text-zinc-400"
                    }`}
                  />
                ))}

                <div className="pt-1">
                  <input
                    type="text"
                    value={formButtonText || ""}
                    onChange={(e) => setFormButtonText?.(e.target.value)}
                    className="w-full rounded-md py-2.5 px-3 text-xs font-bold text-white text-center shadow-md transition outline-none"
                    style={{ backgroundColor: brandColor }}
                    placeholder="Send it to me"
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmitPublicForm} className="space-y-2 pt-1">
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={publicFormValues.name || ""}
                  onChange={(e) => setPublicFormValues?.({ ...publicFormValues, name: e.target.value })}
                  className={`w-full rounded-md border p-2 text-xs focus:outline-none transition ${
                    isDark
                      ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                      : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                  }`}
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={publicFormValues.email || ""}
                  onChange={(e) => setPublicFormValues?.({ ...publicFormValues, email: e.target.value })}
                  className={`w-full rounded-md border p-2 text-xs focus:outline-none transition ${
                    isDark
                      ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                      : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                  }`}
                />

                {customFormFields.map((field: any) => (
                  <div key={field.id}>
                    {field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        placeholder={`${field.label || field.placeholder || "Answer"}${field.required ? " *" : ""}`}
                        value={publicFormValues[field.id] || ""}
                        onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                        rows={2}
                        className={`w-full rounded-md border p-2 text-xs focus:outline-none transition ${
                          isDark
                            ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                            : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                        }`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={publicFormValues[field.id] || ""}
                        onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                        className={`w-full rounded-md border p-2 text-xs focus:outline-none transition ${
                          isDark
                            ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                            : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                        }`}
                      >
                        <option value="">{field.label || "Select..."}</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        required={field.required}
                        placeholder={`${field.label || field.placeholder || "Answer"}${field.required ? " *" : ""}`}
                        value={publicFormValues[field.id] || ""}
                        onChange={(e) => setPublicFormValues?.({ ...publicFormValues, [field.id]: e.target.value })}
                        className={`w-full rounded-md border p-2 text-xs focus:outline-none transition ${
                          isDark
                            ? "bg-[#0E0E10] border-[#252529] text-white focus:border-zinc-700"
                            : "border-[#e4e4e7] text-zinc-800 focus:border-[#0066B2]/50"
                        }`}
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  {isSubmitting ? "Submitting..." : formButtonText || "Send it to me"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

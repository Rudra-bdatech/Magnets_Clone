"use client";

import React from "react";
import {
  BarChart2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { type MagnetPage, type Account, type CustomFormField } from "@/lib/data";
import { savePages, loadPages } from "@/lib/store";
import TemplateRenderer from "@/components/templates/TemplateRenderer";
import CustomFieldsBuilder from "@/components/leadmagnets/edit/CustomFieldsBuilder";
import LockedPdfSetup from "@/components/leadmagnets/locked-pdf-setup";

export interface LandingPageTabProps {
  account: Account | null;
  page: MagnetPage | undefined;
  templateId: string;
  setTemplateId: (id: string) => void;
  headline: string;
  setHeadline: (val: string) => void;
  subheadline: string;
  setSubheadline: (val: string) => void;
  pitch: string;
  setPitch: (val: string) => void;
  bullets: string[];
  setBullets: (bullets: string[]) => void;
  bulletsTitle: string;
  setBulletsTitle: (val: string) => void;
  mastheadLeft?: string;
  setMastheadLeft?: (val: string) => void;
  mastheadRight?: string;
  setMastheadRight?: (val: string) => void;
  formTitle: string;
  setFormTitle: (val: string) => void;
  formSubtitle: string;
  setFormSubtitle: (val: string) => void;
  formButtonText: string;
  setFormButtonText: (val: string) => void;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  customFormFields: CustomFormField[];
  setCustomFormFields: React.Dispatch<React.SetStateAction<CustomFormField[]>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadProgress: number | null;
  isGeneratingAICover: boolean;
  handleGenerateAICoverImage: () => void;
  headlineRef?: React.RefObject<HTMLTextAreaElement>;
  subheadlineRef?: React.RefObject<HTMLTextAreaElement>;
  pitchRef?: React.RefObject<HTMLTextAreaElement>;
  lockedPdfPages: string[];
  setLockedPdfPages: (pages: string[]) => void;
  lockedPdfFreePages: number;
  setLockedPdfFreePages: (free: number) => void;
  lockedPdfTitle: string;
  setLockedPdfTitle: (title: string) => void;
  setPage: React.Dispatch<React.SetStateAction<MagnetPage | undefined>>;
  update: (patch: Partial<MagnetPage>) => void;
  // A/B Testing Props
  testStarted: boolean;
  setTestStarted: (val: boolean) => void;
  hasVariantB: boolean;
  setHasVariantB: (val: boolean) => void;
  variantBImage: string | null;
  setVariantBImage: (val: string | null) => void;
  variantBTitle: string;
  setVariantBTitle: (val: string) => void;
  variantBFileInputRef: React.RefObject<HTMLInputElement>;
  handleVariantBImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploadingVariantB: boolean;
  uploadProgressVariantB: number;
}

export default function LandingPageTab({
  account,
  page,
  templateId,
  setTemplateId,
  headline,
  setHeadline,
  subheadline,
  setSubheadline,
  pitch,
  setPitch,
  bullets,
  setBullets,
  bulletsTitle,
  setBulletsTitle,
  mastheadLeft,
  setMastheadLeft,
  mastheadRight,
  setMastheadRight,
  formTitle,
  setFormTitle,
  formSubtitle,
  setFormSubtitle,
  formButtonText,
  setFormButtonText,
  imageUrl,
  setImageUrl,
  customFormFields,
  setCustomFormFields,
  fileInputRef,
  handleImageUpload,
  uploadProgress,
  isGeneratingAICover,
  handleGenerateAICoverImage,
  headlineRef,
  subheadlineRef,
  pitchRef,
  lockedPdfPages,
  setLockedPdfPages,
  lockedPdfFreePages,
  setLockedPdfFreePages,
  lockedPdfTitle,
  setLockedPdfTitle,
  setPage,
  update,
  testStarted,
  setTestStarted,
  hasVariantB,
  setHasVariantB,
  variantBImage,
  setVariantBImage,
  variantBTitle,
  setVariantBTitle,
  variantBFileInputRef,
  handleVariantBImageUpload,
  uploadingVariantB,
  uploadProgressVariantB,
}: LandingPageTabProps) {
  if (!page) return null;

  return (
    <>
      <div className="space-y-8">
        {/* Canvas Outer Container - Dynamically switches Light vs Dark depending on account.themeMode */}
        <div
          className={`transition-colors duration-300 relative ${
            templateId === "template2"
              ? "rounded-2xl sm:rounded-3xl overflow-hidden p-0 border border-[#151515]/20 dark:border-white/10 shadow-2xl"
              : "rounded-3xl p-4 sm:p-8"
          }`}
          style={{
            backgroundColor: templateId === "template2"
              ? ((account?.themeMode || "light") === "dark" ? "#141416" : "#f3f0e8")
              : ((account?.themeMode || "light") === "dark" ? "#0E0E10" : "#FAFAFA"),
            color: (account?.themeMode || "light") === "dark" ? "#ffffff" : "#18181b",
            backgroundImage: templateId === "template2"
              ? "none"
              : ((account?.themeMode || "light") === "light"
                ? `radial-gradient(circle at 0% 0%, ${account?.brandColor || "#0066B2"}10 0%, transparent 40%), radial-gradient(circle at 100% 100%, ${account?.brandColor || "#0066B2"}08 0%, transparent 40%)`
                : `radial-gradient(circle at 0% 0%, ${account?.brandColor || "#0066B2"}25 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${account?.brandColor || "#0066B2"}15 0%, transparent 50%)`)
          }}
        >
          {/* Brand Name Header (Hidden for template2, template3, template4, and template5 since it is integrated into their layout) */}
          {templateId !== "template2" && templateId !== "template3" && templateId !== "template4" && templateId !== "template5" && (
            <div className="mb-6 flex items-center justify-center">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-transparent overflow-hidden shadow-xs ${account?.logo ? "border-none" : "border-2 border-dashed border-[#a1a1aa]/50"}`}>
                  {account?.logo ? (
                    <img src={account.logo} alt="Brand Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-4 w-4 rounded-md border-2 border-dashed border-[#a1a1aa]" />
                  )}
                </div>
                <span className={`text-base sm:text-lg font-black tracking-wider uppercase ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                  {account?.brandName || account?.name || "BDA"}
                </span>
              </div>
            </div>
          )}

          {/* Hidden file input available for all templates */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Canvas Main Card - 100% Synced Modular Template Renderer */}
          <TemplateRenderer
            templateId={templateId}
            mode="editor"
            page={page}
            account={account}
            headline={headline}
            subheadline={subheadline}
            pitch={pitch}
            bullets={bullets}
            bulletsTitle={bulletsTitle}
            mastheadLeft={mastheadLeft}
            setMastheadLeft={setMastheadLeft}
            mastheadRight={mastheadRight}
            setMastheadRight={setMastheadRight}
            formTitle={formTitle}
            formSubtitle={formSubtitle}
            formButtonText={formButtonText}
            imageUrl={imageUrl}
            customFormFields={customFormFields}
            setCustomFormFields={setCustomFormFields}
            fileInputRef={fileInputRef}
            uploadProgress={uploadProgress}
            isGeneratingAICover={isGeneratingAICover}
            handleGenerateAICoverImage={handleGenerateAICoverImage}
            headlineRef={headlineRef}
            subheadlineRef={subheadlineRef}
            pitchRef={pitchRef}
            setHeadline={setHeadline}
            setSubheadline={setSubheadline}
            setPitch={setPitch}
            setBulletsTitle={setBulletsTitle}
            setFormTitle={setFormTitle}
            setFormSubtitle={setFormSubtitle}
            setBullets={setBullets}
            setImageUrl={setImageUrl}
            setFormButtonText={setFormButtonText}
            lockedPdfPages={lockedPdfPages}
            lockedPdfFreePages={lockedPdfFreePages}
            lockedPdfTitle={lockedPdfTitle}
            setLockedPdfPages={setLockedPdfPages}
            setLockedPdfFreePages={setLockedPdfFreePages}
            setLockedPdfTitle={setLockedPdfTitle}
          />

          {/* Dynamic Custom Form Field Creator Panel - Shared across all templates */}
          <CustomFieldsBuilder
            account={account}
            customFormFields={customFormFields}
            setCustomFormFields={setCustomFormFields}
          />

          {/* Canvas Footer */}
          {templateId !== "template2" && (
            <div className="mt-8 text-center text-xs text-zinc-400">
              All rights reserved 2026
            </div>
          )}
        </div>

        {/* A/B Testing Section */}
        <div className={`space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "text-zinc-100" : "text-zinc-900"}`}>
          {/* Top Header Bar */}
          <div className={`border-t border-b py-4 my-4 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 px-1">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${(account?.themeMode || "light") === "dark" ? "bg-[#25252B] text-zinc-400" : "bg-zinc-100 text-zinc-600"}`}>
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <h4 className={`text-sm sm:text-base font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                    Test title and image
                  </h4>
                </div>
                <p className={`text-xs mt-2 ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  LeadMagnets splits new visitors evenly and keeps each person on the same version for an accurate result.
                </p>
              </div>

              <button
                onClick={() => {
                  const nextVal = !testStarted;
                  setTestStarted(nextVal);
                  update({ testStarted: nextVal });
                }}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#222228] text-zinc-300 hover:bg-[#2A2A32]" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}`}
              >
                <span className={`h-2 w-2 rounded-full ${testStarted ? "bg-emerald-500" : "bg-zinc-400"}`} />
                <span>{testStarted ? "Pause test" : "Start test"}</span>
              </button>
            </div>
          </div>

          {/* A/B Versions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Control Variant Card */}
            <div className={`rounded-2xl border overflow-hidden shadow-xs transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#1D1D22]" : "border-zinc-200 bg-white"}`}>
              {/* Top Media Area */}
              <div className={`relative h-64 sm:h-72 w-full flex flex-col items-center justify-center border-b ${(account?.themeMode || "light") === "dark" ? "bg-[#141418] border-[#27272C]" : "bg-zinc-50 border-zinc-100"}`}>
                <div className="absolute top-4 left-4 z-10">
                  <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${(account?.themeMode || "light") === "dark" ? "bg-white text-black" : "bg-black text-white"}`}>
                    {hasVariantB ? "CONTROL · 50%" : "CONTROL · 100%"}
                  </span>
                </div>

                {imageUrl && imageUrl.trim() !== "" ? (
                  <img
                    src={imageUrl}
                    alt="Control media"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <ImageIcon className="h-7 w-7 mb-1.5 stroke-[1.5px]" />
                    <span className="text-xs font-medium">No image</span>
                  </div>
                )}
              </div>

              {/* Bottom Section */}
              <div className={`p-5 space-y-3 ${(account?.themeMode || "light") === "dark" ? "bg-[#1D1D22]" : "bg-white"}`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    CURRENT PAGE
                  </span>
                  <h5 className={`text-sm font-black ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>
                    {headline || page.name || "BDA"}
                  </h5>
                </div>

                <div className={`h-px w-full ${(account?.themeMode || "light") === "dark" ? "bg-[#27272C]" : "bg-zinc-100"}`} />

                {testStarted ? (
                  <div className="flex items-center justify-between text-xs pt-0.5 font-medium">
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
                    </span>
                    <span className={`font-semibold ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                      {page?.variantAViews || 0} views · {page?.variantASignups || 0} signups
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 pt-0.5">
                    Results appear after the test starts
                  </p>
                )}
              </div>
            </div>

            {/* Variant B Card if created */}
            {hasVariantB && (
              <div className={`group animate-card-pop-in rounded-2xl border overflow-hidden shadow-xs transition-all duration-300 ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#1D1D22] hover:border-zinc-600" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                {/* Top Media Area */}
                <div className={`relative h-64 sm:h-72 w-full flex flex-col items-center justify-center border-b overflow-hidden ${(account?.themeMode || "light") === "dark" ? "bg-[#141418] border-[#27272C]" : "bg-zinc-50 border-zinc-100"}`}>
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${(account?.themeMode || "light") === "dark" ? "bg-[#27272D] text-zinc-200" : "bg-zinc-200 text-zinc-800"}`}>
                      VERSION B · 50%
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={variantBFileInputRef}
                    onChange={handleVariantBImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Loading Overlay with 0% to 100% Progress Bar */}
                  {uploadingVariantB && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white p-4 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                        <span className="text-xs font-extrabold tracking-wide">
                          Uploading... {uploadProgressVariantB}%
                        </span>
                      </div>
                      <div className="w-full max-w-[180px] h-2 bg-white/20 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-200 ease-out"
                          style={{ width: `${uploadProgressVariantB}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(() => {
                    const activeVariantBImage = (variantBImage && variantBImage.trim() !== "") ? variantBImage : imageUrl;
                    return activeVariantBImage && activeVariantBImage.trim() !== "" ? (
                      <img
                        src={activeVariantBImage}
                        alt="Variant B media"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-400">
                        <ImageIcon className="h-7 w-7 mb-1.5 stroke-[1.5px]" />
                        <span className="text-xs font-medium">No image</span>
                      </div>
                    );
                  })()}

                  {/* Hover Actions Container */}
                  <div className={`absolute bottom-4 right-4 flex items-center gap-2 z-20 transition-opacity duration-200 ${uploadingVariantB ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    <button
                      type="button"
                      disabled={uploadingVariantB}
                      onClick={(e) => {
                        e.stopPropagation();
                        variantBFileInputRef.current?.click();
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-md border transition cursor-pointer pointer-events-auto active:scale-95 disabled:opacity-75 ${(account?.themeMode || "light") === "dark" ? "bg-[#25252B] hover:bg-[#2E2E36] text-zinc-200 border-[#2E2E35]" : "bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200"}`}
                    >
                      {uploadingVariantB ? (
                        <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-zinc-400" />
                      )}
                      <span>{uploadingVariantB ? "Uploading..." : "Replace"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={uploadingVariantB}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHasVariantB(false);
                        setVariantBImage(null);
                        setVariantBTitle("");
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-red-500 shadow-md border transition cursor-pointer pointer-events-auto active:scale-95 disabled:opacity-50 ${(account?.themeMode || "light") === "dark" ? "bg-[#25252B] hover:bg-red-950/40 border-[#2E2E35]" : "bg-white hover:bg-red-50 border-zinc-200"}`}
                      title="Remove Version B split test"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className={`p-5 space-y-3 ${(account?.themeMode || "light") === "dark" ? "bg-[#1D1D22]" : "bg-white"}`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      VERSION TITLE
                    </span>
                    <input
                      type="text"
                      value={variantBTitle}
                      onChange={(e) => setVariantBTitle(e.target.value)}
                      placeholder={headline || "Version B Title"}
                      onBlur={() => {
                        if (page) {
                          const next = { ...page, variantBTitle, hasVariantB: true, updatedAt: "Just now" };
                          savePages(loadPages().map((p) => (p.id === next.id ? next : p)));
                        }
                      }}
                      className={`w-full text-sm font-black outline-none border-b border-transparent focus:border-zinc-400 py-0.5 bg-transparent ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}
                    />
                  </div>

                  <div className={`h-px w-full ${(account?.themeMode || "light") === "dark" ? "bg-[#27272C]" : "bg-zinc-100"}`} />

                  {testStarted ? (
                    <div className="flex items-center justify-between text-xs pt-0.5 font-medium">
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
                      </span>
                      <span className={`font-semibold ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                        {page?.variantBViews || 0} views · {page?.variantBSignups || 0} signups
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 pt-0.5">
                      Results appear after the test starts
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Create Version B Button */}
          {!hasVariantB && (
            <button
              onClick={() => {
                setHasVariantB(true);
                setVariantBTitle(`${headline || page.name} (B)`);
                if (page) {
                  const next = { ...page, hasVariantB: true, variantBTitle: `${headline || page.name} (B)`, updatedAt: "Just now" };
                  savePages(loadPages().map((p) => (p.id === next.id ? next : p)));
                }
              }}
              className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed p-3.5 text-xs font-bold transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-2xs ${(account?.themeMode || "light") === "dark" ? "border-[#2E2E35] bg-[#1D1D22] hover:bg-[#25252B] text-zinc-300" : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"}`}
            >
              <Plus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Create version B</span>
            </button>
          )}
        </div>
      </div>

      {/* LOCKED PDF TAB — only shown when template is locked-pdf */}
      {(templateId as string) === "locked-pdf" && (
        <div className="mt-4">
          <LockedPdfSetup
            magnetId={page.id}
            userEmail={account?.email || ""}
            pdfPages={lockedPdfPages}
            pdfFreePages={lockedPdfFreePages}
            pdfTitle={lockedPdfTitle || page.name}
            appUrl={process.env.NEXT_PUBLIC_APP_URL || "https://magnets.bdatech.in"}
            onSave={async (updates) => {
              setLockedPdfPages(updates.pdfPages);
              setLockedPdfFreePages(updates.pdfFreePages);
              setLockedPdfTitle(updates.pdfTitle);
              setTemplateId("locked-pdf");
              const next = {
                ...page,
                pdfPages: updates.pdfPages,
                pdfFreePages: updates.pdfFreePages,
                pdfTitle: updates.pdfTitle,
                pdfPageCount: updates.pdfPageCount,
                template: "locked-pdf" as any,
                updatedAt: "Just now",
              };
              setPage(next);
              savePages(loadPages().map((p) => p.id === next.id ? next : p));
            }}
          />
        </div>
      )}
    </>
  );
}

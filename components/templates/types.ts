import { type MagnetPage, type Account, type CustomFormField } from "@/lib/data";
import React from "react";

export type TemplateMode = "editor" | "public" | "brand";

export interface TemplateProps {
  templateId: string;
  mode: TemplateMode;
  page?: Partial<MagnetPage>;
  account?: Partial<Account> | null;
  themeMode?: "light" | "dark";
  brandColor?: string;

  // Editable Content
  headline?: string;
  subheadline?: string;
  pitch?: string;
  bullets?: string[];
  bulletsTitle?: string;
  mastheadLeft?: string;
  mastheadRight?: string;
  formTitle?: string;
  formSubtitle?: string;
  formButtonText?: string;
  imageUrl?: string | null;
  customFormFields?: CustomFormField[];
  setCustomFormFields?: React.Dispatch<React.SetStateAction<CustomFormField[]>>;

  // Editor Callbacks & States
  fileInputRef?: React.RefObject<HTMLInputElement>;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateAICoverImage?: () => void;
  isGeneratingAICover?: boolean;
  uploadProgress?: number | null;

  setHeadline?: (val: string) => void;
  setSubheadline?: (val: string) => void;
  setPitch?: (val: string) => void;
  setBullets?: (val: string[]) => void;
  setBulletsTitle?: (val: string) => void;
  setMastheadLeft?: (val: string) => void;
  setMastheadRight?: (val: string) => void;
  setFormTitle?: (val: string) => void;
  setFormSubtitle?: (val: string) => void;
  setFormButtonText?: (val: string) => void;
  setImageUrl?: (val: string | null) => void;

  headlineRef?: React.RefObject<HTMLTextAreaElement>;
  subheadlineRef?: React.RefObject<HTMLTextAreaElement>;
  pitchRef?: React.RefObject<HTMLTextAreaElement>;

  // Locked PDF specific props
  lockedPdfPages?: string[];
  lockedPdfFreePages?: number;
  lockedPdfTitle?: string;
  setLockedPdfPages?: (val: string[]) => void;
  setLockedPdfFreePages?: (val: number) => void;
  setLockedPdfTitle?: (val: string) => void;

  // Public Form Submission Props
  publicFormValues?: Record<string, string>;
  setPublicFormValues?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting?: boolean;
  onSubmitPublicForm?: (e: React.FormEvent) => void;
  errorMsg?: string | null;
  successMsg?: string | null;
}

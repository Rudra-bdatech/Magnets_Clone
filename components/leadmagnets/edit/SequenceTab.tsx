"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Mail,
  Eye,
  Trash2,
  Clock,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  Strikethrough,
  Image as ImageIcon,
  Link2,
  Minus,
  ChevronDown,
  Type,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Video,
  Table as TableIcon,
  Sparkles,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link as LinkExtension } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Image as ImageExtension } from "@tiptap/extension-image";
import { Table as TableExtension } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextAlign } from "@tiptap/extension-text-align";
import { type Account } from "@/lib/data";
import { loadResources } from "@/lib/store";

export interface SequenceEmailItem {
  id: string;
  subject: string;
  delayDays: number;
  delayUnit?: "hours" | "minutes";
  previewText?: string;
  body: string;
}

export interface SequenceTabProps {
  account: Account | null;
  sequenceEnabled: boolean;
  setSequenceEnabled: (enabled: boolean) => void;
  stopOnCall: boolean;
  setStopOnCall: (stop: boolean) => void;
  sequenceEmails: SequenceEmailItem[];
  setSequenceEmails: React.Dispatch<React.SetStateAction<SequenceEmailItem[]>>;
  selectedSequenceIndex: number;
  setSelectedSequenceIndex: (idx: number) => void;
  addSequenceEmail: () => void;
  removeSequenceEmail: (id: string) => void;
  setShowSequencePreviewModal: (show: boolean) => void;
  setPreviewSequenceIndex: (idx: number) => void;
  hostedResources?: any[];
}

export default function SequenceTab({
  account,
  sequenceEnabled,
  setSequenceEnabled,
  stopOnCall,
  setStopOnCall,
  sequenceEmails,
  setSequenceEmails,
  selectedSequenceIndex,
  setSelectedSequenceIndex,
  addSequenceEmail,
  removeSequenceEmail,
  setShowSequencePreviewModal,
  setPreviewSequenceIndex,
  hostedResources: initialResources,
}: SequenceTabProps) {
  const [activeMenu, setActiveMenu] = useState<"headings" | "color" | "lists" | "align" | "table" | null>(null);
  const [showInsertResourceMenu, setShowInsertResourceMenu] = useState(false);
  const [hostedResources, setHostedResources] = useState<any[]>(initialResources || []);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const activeEmail = sequenceEmails[selectedSequenceIndex] || sequenceEmails[0];

  useEffect(() => {
    if (!initialResources || initialResources.length === 0) {
      const res = loadResources();
      if (res && res.length > 0) setHostedResources(res);
    }
  }, [initialResources]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setShowInsertResourceMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tiptap Rich Text Editor Instance for Sequence Email Body
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "outline-none focus:outline-none focus:ring-0 min-h-[220px]",
      },
    },
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      ImageExtension,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#0066B2] dark:text-[#38BDF8] underline font-medium",
        },
      }),
    ],
    content: activeEmail?.body || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setSequenceEmails((prev) =>
        prev.map((item, idx) => (idx === selectedSequenceIndex ? { ...item, body: html } : item))
      );
    },
  });

  // Sync Tiptap content when active selected sequence email changes
  useEffect(() => {
    if (editor && activeEmail) {
      const currentHtml = editor.getHTML();
      const targetHtml = activeEmail.body || "";
      if (currentHtml !== targetHtml) {
        editor.commands.setContent(targetHtml);
      }
    }
  }, [selectedSequenceIndex, activeEmail?.id, editor]);

  return (
    <div className="space-y-6">
      {/* Canvas Outer Wrapper - Adapts dynamically to Brand Theme Mode */}
      <div className={`rounded-2xl border p-4 sm:p-6 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E10] text-white" : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"}`}>
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Top Control Card - Left Panel Background (#18181B) in Dark Mode */}
          <div className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className={`text-base font-extrabold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>Follow-up sequence</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Send extra emails after the lead magnet email. Delays are counted from the previous email or from signup for the first one.
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  LeadMagnets creates the events, templates, and automation for this sequence after your sender domain is ready.
                </p>
              </div>

              {/* Toggle Status Pill */}
              <button
                type="button"
                onClick={() => setSequenceEnabled(!sequenceEnabled)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 border ${sequenceEnabled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-[#25252B] dark:text-zinc-300 dark:border-[#27272A]"
                  }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${sequenceEnabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                <span>{sequenceEnabled ? "Enabled" : "Disabled"}</span>
              </button>
            </div>

            {/* 2 Sub-cards in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Sub-card 1: Stop when a call is booked */}
              <div
                onClick={() => { if (sequenceEnabled) setStopOnCall(!stopOnCall); }}
                className={`rounded-xl border p-3.5 transition shadow-2xs ${sequenceEnabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed"} ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] hover:border-zinc-500 text-white" : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stopOnCall}
                    disabled={!sequenceEnabled}
                    onChange={() => { }}
                    className="rounded border-zinc-300 text-[#FE6F34] focus:ring-[#FE6F34] cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className={`text-xs font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-800"}`}>Stop when a call is booked</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 pl-6 leading-relaxed">
                  Calendly and Cal.com booking-created webhooks stop this magnet&apos;s sequence for that email.
                </p>
              </div>

              {/* Sub-card 2: Calendar connection */}
              <div className={`rounded-xl border p-3.5 transition ${sequenceEnabled ? "" : "opacity-50"} ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white" : "border-zinc-200 bg-[#F9F9FB] text-zinc-900"}`}>
                <span className={`text-xs font-bold block ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-700"}`}>Calendar connection</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Connect Calendly or Cal.com in Configure to let booked calls stop this sequence.
                </p>
              </div>
            </div>
          </div>

          {/* Main Editor Body: 2-Column Sidebar + Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Left Sidebar List of Sequence Emails */}
            <div className={`lg:col-span-4 rounded-2xl border p-4 space-y-3 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Sequence emails ({sequenceEmails.length})
                </span>
                <button
                  type="button"
                  disabled={!sequenceEnabled}
                  onClick={addSequenceEmail}
                  className="flex items-center gap-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add email</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {sequenceEmails.map((item, idx) => {
                  const isSelected = idx === selectedSequenceIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSequenceIndex(idx)}
                      className={`rounded-xl p-3 border transition cursor-pointer flex items-center justify-between gap-2 ${isSelected
                        ? "border-[#0066B2] bg-[#0066B2]/10 dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8] font-bold"
                        : (account?.themeMode || "light") === "dark"
                          ? "border-[#27272A] bg-[#121216] text-zinc-300 hover:bg-[#1C1C22]"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-extrabold truncate">
                          Email {idx + 1}: {item.subject || "Untitled email"}
                        </span>
                        <span className="block text-[11px] text-zinc-400 font-normal truncate mt-0.5">
                          {item.delayDays || 1} {item.delayUnit || "hours"} delay
                        </span>
                      </div>
                      {sequenceEmails.length > 1 && (
                        <button
                          type="button"
                          disabled={!sequenceEnabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSequenceEmail(item.id);
                          }}
                          title="Delete email"
                          className="text-zinc-400 hover:text-red-500 transition p-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Main Email Detail Form */}
            {activeEmail && (
              <div className={`lg:col-span-8 rounded-2xl border p-5 sm:p-6 space-y-5 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
                <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-[#27272A]">
                  <div>
                    <h4 className="text-sm font-bold">
                      Editing Email {selectedSequenceIndex + 1}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">Configure email timing, subject, and rich content.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!sequenceEnabled}
                      onClick={() => {
                        setPreviewSequenceIndex(selectedSequenceIndex + 1);
                        setShowSequencePreviewModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Delay */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Delay from previous email</span>
                  </label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      disabled={!sequenceEnabled}
                      value={activeEmail.delayDays === undefined || activeEmail.delayDays === null || isNaN(activeEmail.delayDays as any) ? "" : activeEmail.delayDays}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? ("" as any) : parseInt(raw, 10);
                        setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, delayDays: val } : item));
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value;
                        const parsed = parseInt(raw, 10);
                        const val = isNaN(parsed) || parsed < 1 ? 1 : Math.min(365, parsed);
                        setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, delayDays: val } : item));
                      }}
                      className={`w-24 rounded-xl border px-3 py-2 text-xs font-bold outline-none disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 focus:border-[#0066B2]"}`}
                    />
                    <select
                      disabled={!sequenceEnabled}
                      value={activeEmail.delayUnit || "hours"}
                      onChange={(e) => {
                        const unit = e.target.value as "hours" | "minutes";
                        setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, delayUnit: unit } : item));
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold outline-none cursor-pointer disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 focus:border-[#0066B2]"}`}
                    >
                      <option value="minutes">minutes</option>
                      <option value="hours">hours</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Subject</label>
                  <input
                    type="text"
                    disabled={!sequenceEnabled}
                    value={activeEmail.subject || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, subject: val } : item));
                    }}
                    placeholder="Quick follow-up"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#121216] text-white placeholder:text-zinc-600 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                  />
                </div>

                {/* Preview Text */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Preview text</label>
                  <input
                    type="text"
                    disabled={!sequenceEnabled}
                    value={activeEmail.previewText || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSequenceEmails(sequenceEmails.map((item, idx) => idx === selectedSequenceIndex ? { ...item, previewText: val } : item));
                    }}
                    placeholder="Short inbox teaser"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition disabled:cursor-not-allowed ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white placeholder:text-zinc-600 focus:border-[#0066B2]" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-[#0066B2]"}`}
                  />
                </div>

                {/* Body + Tiptap Rich Editor Toolbar (100% Identical to DeliveryEmailTab) */}
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Body</label>
                  <div className={`rounded-2xl border overflow-hidden shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B]" : "border-zinc-200/90 bg-white"}`}>
                    {/* Toolbar matching DeliveryEmailTab exact screenshot design + Insert {name} */}
                    <div ref={toolbarRef} className={`flex flex-wrap items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-zinc-300" : "border-zinc-200 bg-[#F9F9FB] text-zinc-600"}`}>
                      
                      {/* Headings Dropdown: T ⌄ */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!sequenceEnabled}
                          title="Headings"
                          onClick={() => setActiveMenu((m) => m === "headings" ? null : "headings")}
                          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer text-zinc-700 dark:text-zinc-200 ${activeMenu === "headings" ? "bg-zinc-200 dark:bg-zinc-800" : ""} disabled:opacity-50`}
                        >
                          <Type className="h-3.5 w-3.5" />
                          <ChevronDown className="h-3 w-3 text-zinc-400" />
                        </button>
                        {activeMenu === "headings" && (
                          <div className="absolute left-0 top-full pt-1 z-50">
                            <div className={`w-32 rounded-lg border shadow-lg p-1 flex flex-col ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                              <button type="button" onClick={() => { editor?.chain().focus().setParagraph().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Paragraph</button>
                              <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 1 }).run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs font-bold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Heading 1</button>
                              <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs font-semibold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Heading 2</button>
                              <button type="button" onClick={() => { editor?.chain().focus().toggleHeading({ level: 3 }).run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Heading 3</button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                      {/* Bold: B */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        title="Bold (Ctrl+B)"
                        className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("bold") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""} disabled:opacity-50`}
                      >
                        <span className="font-extrabold text-sm">B</span>
                      </button>

                      {/* Italic: I */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        title="Italic (Ctrl+I)"
                        className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("italic") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""} disabled:opacity-50`}
                      >
                        <span className="italic font-serif text-sm">I</span>
                      </button>

                      {/* Strikethrough: S */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        title="Strikethrough"
                        className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("strike") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""} disabled:opacity-50`}
                      >
                        <Strikethrough className="h-3.5 w-3.5" />
                      </button>

                      {/* Text Color: A */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!sequenceEnabled}
                          title="Text Color"
                          onClick={() => setActiveMenu((m) => m === "color" ? null : "color")}
                          className={`flex items-center gap-0.5 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${activeMenu === "color" ? "bg-zinc-200 dark:bg-zinc-800" : ""} disabled:opacity-50`}
                        >
                          <span className="font-extrabold text-xs underline decoration-2 decoration-[#0066B2]">A</span>
                        </button>
                        {activeMenu === "color" && (
                          <div className="absolute left-0 top-full pt-1 z-50">
                            <div className={`flex gap-1.5 p-2 rounded-lg border shadow-lg ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24]" : "border-zinc-200 bg-white"}`}>
                              {["#18181b", "#0066B2", "#2563eb", "#059669", "#dc2626", "#d97706", "#7c3aed"].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => { editor?.chain().focus().setColor(color).run(); setActiveMenu(null); }}
                                  className="h-4 w-4 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Clear Format: 🧹 */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                        title="Clear Format"
                        className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                      >
                        <Eraser className="h-3.5 w-3.5" />
                      </button>

                      <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                      {/* Lists: ⋮= ⌄ */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!sequenceEnabled}
                          title="Lists"
                          onClick={() => setActiveMenu((m) => m === "lists" ? null : "lists")}
                          className={`flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${activeMenu === "lists" ? "bg-zinc-200 dark:bg-zinc-800" : ""} disabled:opacity-50`}
                        >
                          <span className="text-xs font-bold">⋮=</span>
                          <ChevronDown className="h-3 w-3 text-zinc-400" />
                        </button>
                        {activeMenu === "lists" && (
                          <div className="absolute left-0 top-full pt-1 z-50">
                            <div className={`w-36 rounded-lg border shadow-lg p-1 flex flex-col ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                              <button
                                type="button"
                                onClick={() => { editor?.chain().focus().toggleBulletList().run(); setActiveMenu(null); }}
                                className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-medium"
                              >
                                Bullet List
                              </button>
                              <button
                                type="button"
                                onClick={() => { editor?.chain().focus().toggleOrderedList().run(); setActiveMenu(null); }}
                                className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-medium"
                              >
                                Numbered List
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Alignment: ≡ ⌄ */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!sequenceEnabled}
                          title="Text Align"
                          onClick={() => setActiveMenu((m) => m === "align" ? null : "align")}
                          className={`flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${activeMenu === "align" ? "bg-zinc-200 dark:bg-zinc-800" : ""} disabled:opacity-50`}
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                          <ChevronDown className="h-3 w-3 text-zinc-400" />
                        </button>
                        {activeMenu === "align" && (
                          <div className="absolute left-0 top-full pt-1 z-50">
                            <div className={`w-32 rounded-lg border shadow-lg p-1 flex flex-col ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                              <button type="button" onClick={() => { editor?.chain().focus().setTextAlign("left").run(); setActiveMenu(null); }} className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><AlignLeft className="h-3.5 w-3.5" /> Left</button>
                              <button type="button" onClick={() => { editor?.chain().focus().setTextAlign("center").run(); setActiveMenu(null); }} className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><AlignCenter className="h-3.5 w-3.5" /> Center</button>
                              <button type="button" onClick={() => { editor?.chain().focus().setTextAlign("right").run(); setActiveMenu(null); }} className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><AlignRight className="h-3.5 w-3.5" /> Right</button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                      {/* Insert Image */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => {
                          const url = prompt("Enter Image URL:");
                          if (url && editor) {
                            editor.chain().focus().setImage({ src: url }).run();
                          }
                        }}
                        title="Insert Image"
                        className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                      </button>

                      {/* Insert Video */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => {
                          const inputUrl = prompt("Enter YouTube or Video URL (e.g. YouTube, Loom, Vimeo):");
                          if (!inputUrl) return;
                          const url = inputUrl.trim();
                          if (!url) return;

                          const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/);
                          const ytId = (ytMatch && ytMatch[2] && ytMatch[2].length === 11) ? ytMatch[2] : null;

                          if (ytId) {
                            const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                            const ytHtml = `<p><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${thumbUrl}" alt="Watch Video on YouTube" /></a></p><p><a href="${url}" target="_blank" rel="noopener noreferrer">▶ Watch Video on YouTube</a></p>`;
                            if (editor) {
                              editor.chain().focus().insertContent(ytHtml).run();
                            }
                          } else {
                            const videoHtml = `<p><a href="${url}" target="_blank" rel="noopener noreferrer">▶ Watch Video (${url})</a></p>`;
                            if (editor) {
                              editor.chain().focus().insertContent(videoHtml).run();
                            }
                          }
                        }}
                        title="Insert Video"
                        className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                      >
                        <Video className="h-3.5 w-3.5" />
                      </button>

                      {/* Insert / Edit Table */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!sequenceEnabled}
                          title="Insert or Manage Table"
                          onClick={() => setActiveMenu((m) => m === "table" ? null : "table")}
                          className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${activeMenu === "table" || editor?.isActive("table") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""} disabled:opacity-50`}
                        >
                          <TableIcon className="h-3.5 w-3.5" />
                        </button>
                        {activeMenu === "table" && (
                          <div className="absolute left-0 top-full pt-1 z-50">
                            <div className={`w-44 rounded-lg border shadow-lg p-1 flex flex-col space-y-0.5 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                              {editor?.isActive("table") ? (
                                <>
                                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TABLE CONTROLS</div>
                                  <button type="button" onClick={() => { editor?.chain().focus().addRowBefore().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Row Above</button>
                                  <button type="button" onClick={() => { editor?.chain().focus().addRowAfter().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Row Below</button>
                                  <button type="button" onClick={() => { editor?.chain().focus().deleteRow().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer">❌ Delete Row</button>
                                  <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 my-1" />
                                  <button type="button" onClick={() => { editor?.chain().focus().addColumnBefore().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Column Left</button>
                                  <button type="button" onClick={() => { editor?.chain().focus().addColumnAfter().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Column Right</button>
                                  <button type="button" onClick={() => { editor?.chain().focus().deleteColumn().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer">❌ Delete Column</button>
                                  <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 my-1" />
                                  <button type="button" onClick={() => { editor?.chain().focus().deleteTable().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs text-rose-600 font-bold rounded hover:bg-rose-500/10 cursor-pointer">🗑️ Delete Table</button>
                                </>
                              ) : (
                                <>
                                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">INSERT TABLE</div>
                                  <button type="button" onClick={() => { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Grid 3 × 3 Table</button>
                                  <button type="button" onClick={() => { editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Grid 2 × 2 Table</button>
                                  <button type="button" onClick={() => { editor?.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Grid 4 × 4 Table</button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Insert / Edit / Remove Hyperlink */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => {
                          if (!editor) return;

                          // Case 1: Cursor is currently inside an existing link -> Edit or Remove
                          if (editor.isActive("link")) {
                            const currentHref = editor.getAttributes("link").href || "";
                            const choice = prompt(`Current Link URL: ${currentHref}\n\nType NEW URL to update, or leave blank to REMOVE link:`, currentHref);
                            if (choice === null) return;
                            const trimmed = choice.trim();
                            if (!trimmed) {
                              editor.chain().focus().unsetLink().run();
                            } else {
                              const formattedUrl = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
                              editor.chain().focus().setLink({ href: formattedUrl }).run();
                            }
                            return;
                          }

                          // Case 2: Text is selected vs No text selected
                          const { from, to } = editor.state.selection;
                          const selectedText = editor.state.doc.textBetween(from, to, " ");

                          if (selectedText && selectedText.trim().length > 0) {
                            // Text IS selected -> attach hyperlink to selected text
                            const rawUrl = prompt(`Enter URL for selected text ("${selectedText.trim()}"):`);
                            if (!rawUrl) return;
                            const trimmed = rawUrl.trim();
                            if (!trimmed) return;
                            const formattedUrl = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
                            editor.chain().focus().setLink({ href: formattedUrl }).run();
                          } else {
                            // NO text selected -> ask for URL + display label
                            const rawUrl = prompt("Enter Link URL (e.g. https://example.com):");
                            if (!rawUrl) return;
                            const trimmedUrl = rawUrl.trim();
                            if (!trimmedUrl) return;
                            const formattedUrl = trimmedUrl.match(/^https?:\/\//i) ? trimmedUrl : `https://${trimmedUrl}`;

                            const displayText = prompt("Enter Text to Display for the link:", trimmedUrl);
                            const finalLabel = (displayText && displayText.trim()) ? displayText.trim() : formattedUrl;

                            editor.chain().focus().insertContent(`<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${finalLabel}</a>`).run();
                          }
                        }}
                        title={editor?.isActive("link") ? "Edit or Remove Hyperlink" : "Insert Hyperlink"}
                        className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("link") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""} disabled:opacity-50`}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Insert Horizontal Divider */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        title="Insert Horizontal Divider"
                        className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-200 disabled:opacity-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                      {/* + Insert Resource Dropdown Button */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={!sequenceEnabled}
                          onClick={() => setShowInsertResourceMenu((v) => !v)}
                          className="hover:text-[#38BDF8] text-[#0066B2] dark:text-[#38BDF8] font-semibold transition px-2 py-1 rounded bg-[#EFF6FF] dark:bg-[#0066B2]/20 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>+ Insert Resource</span>
                          <ChevronDown className="h-3 w-3" />
                        </button>

                        {showInsertResourceMenu && (
                          <div className={`absolute left-0 top-full mt-1.5 w-64 rounded-xl border p-1.5 shadow-xl z-50 space-y-1 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                            <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              SELECT HOSTED RESOURCE
                            </div>
                            {hostedResources.length === 0 ? (
                              <div className="px-2 py-2 text-xs text-zinc-400 italic">
                                No hosted resources found. Upload one in Hosted resources first!
                              </div>
                            ) : (
                              hostedResources.map((res) => (
                                <button
                                  key={res.id}
                                  type="button"
                                  onClick={() => {
                                    if (editor) {
                                      editor.chain().focus().insertContent(`<p><a href="${res.url}" target="_blank" rel="noopener noreferrer">${res.name}</a></p>`).run();
                                    }
                                    setShowInsertResourceMenu(false);
                                  }}
                                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#0066B2]/20 hover:text-[#38BDF8] text-xs transition flex flex-col gap-0.5 cursor-pointer"
                                >
                                  <span className="font-semibold truncate">{res.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono truncate">{res.url}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* + Insert {name} Variable Button */}
                      <button
                        type="button"
                        disabled={!sequenceEnabled}
                        onClick={() => {
                          if (editor) {
                            editor.chain().focus().insertContent(" {name} ").run();
                          }
                        }}
                        title="Insert subscriber name variable"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0066B2]/15 text-[#0066B2] dark:bg-[#0066B2]/25 dark:text-[#38BDF8] font-bold text-xs transition hover:bg-[#0066B2]/25 dark:hover:bg-[#0066B2]/40 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Insert &#123;name&#125;</span>
                      </button>
                    </div>

                    {/* Tiptap Rich Text Body Editor Container */}
                    <div className="p-4 min-h-[220px]">
                      <EditorContent
                        editor={editor}
                        className={`prose dark:prose-invert max-w-none text-sm leading-relaxed outline-none focus:outline-none focus:ring-0 ring-0 border-none min-h-[220px] ${(account?.themeMode || "light") === "dark" ? "text-zinc-100" : "text-zinc-800"}`}
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
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
import {
  Mail,
  Eye,
  Type,
  ChevronDown,
  Strikethrough,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Video,
  Table as TableIcon,
  Link2,
  Minus,
  Sparkles,
} from "lucide-react";
import { type Account } from "@/lib/data";

export interface DeliveryEmailTabProps {
  account: Account | null;
  setShowEmailPreviewModal: (show: boolean) => void;
  emailSubject: string;
  setEmailSubject: (subject: string) => void;
  emailPreviewText: string;
  setEmailPreviewText: (previewText: string) => void;
  editor?: Editor | null;
  showInsertResourceMenu: boolean;
  setShowInsertResourceMenu: React.Dispatch<React.SetStateAction<boolean>>;
  hostedResources: any[];
  emailBody: string;
  setEmailBody: React.Dispatch<React.SetStateAction<string>>;
  enableAiPersonalizedDeliverable: boolean;
  setEnableAiPersonalizedDeliverable: (enable: boolean) => void;
  customPromptQuestion: string;
  setCustomPromptQuestion: (q: string) => void;
  customPromptPlaceholder: string;
  setCustomPromptPlaceholder: (p: string) => void;
}

export default function DeliveryEmailTab({
  account,
  setShowEmailPreviewModal,
  emailSubject,
  setEmailSubject,
  emailPreviewText,
  setEmailPreviewText,
  editor: propEditor,
  showInsertResourceMenu,
  setShowInsertResourceMenu,
  hostedResources,
  emailBody,
  setEmailBody,
  enableAiPersonalizedDeliverable,
  setEnableAiPersonalizedDeliverable,
  customPromptQuestion,
  setCustomPromptQuestion,
  customPromptPlaceholder,
  setCustomPromptPlaceholder,
}: DeliveryEmailTabProps) {
  const internalEditor = useEditor({
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
    content: emailBody,
    onUpdate: ({ editor }) => {
      setEmailBody(editor.getHTML());
    },
  });

  const editor = propEditor || internalEditor;

  React.useEffect(() => {
    if (editor && emailBody && editor.getHTML() !== emailBody && !editor.isFocused) {
      editor.commands.setContent(emailBody);
    }
  }, [emailBody, editor]);

  const [activeMenu, setActiveMenu] = React.useState<"headings" | "color" | "lists" | "align" | "table" | null>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setShowInsertResourceMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowInsertResourceMenu]);

  const renderEmailBlockEditor = (
    val: string,
    onValChange: (next: string) => void,
    isDisabled = false
  ) => {
    return (
      <textarea
        disabled={isDisabled}
        value={val}
        onChange={(e) => onValChange(e.target.value)}
        placeholder="Write your email body content here... Use {name} for subscriber name."
        rows={10}
        className={`w-full p-2 bg-transparent outline-none resize-y min-h-[220px] font-sans text-sm leading-relaxed transition ${isDisabled ? "opacity-50 cursor-not-allowed" : ""
          } ${(account?.themeMode || "light") === "dark" ? "text-zinc-100 placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-400"}`}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Canvas Outer Wrapper - Adapts dynamically to Brand Theme Mode */}
      <div className={`rounded-2xl border p-4 sm:p-8 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#1F1F24] bg-[#0E0E10] text-white" : "border-zinc-200/70 bg-[#F9F9FB] text-zinc-900"}`}>

        {/* Inner Card Container */}
        <div className={`mx-auto max-w-4xl rounded-2xl border p-6 sm:p-8 shadow-xs space-y-6 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>

          {/* Top Header Bar inside Card */}
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A]" : "border-zinc-200"}`}>
            <div className={`flex items-center gap-2 text-sm font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-800"}`}>
              <Mail className="h-4 w-4 text-zinc-400" />
              <span>Delivery email</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-mono">
                LeadMagnets &lt;hello@mail.leadmagnets.so&gt;
              </span>
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(true)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white hover:bg-[#27272A]" : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"}`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 block">Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="What people see in the inbox"
              className={`w-full text-2xl sm:text-3xl font-extrabold bg-transparent outline-none border-b border-transparent focus:border-[#FE6F34] transition py-1 ${(account?.themeMode || "light") === "dark" ? "text-white placeholder:text-zinc-600" : "text-zinc-800 placeholder:text-zinc-300"}`}
            />
          </div>

          {/* Preview text */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 block">Preview text</label>
            <input
              type="text"
              value={emailPreviewText}
              onChange={(e) => setEmailPreviewText(e.target.value)}
              placeholder="A short teaser shown after the subject"
              className={`w-full text-sm font-medium bg-transparent outline-none border-b border-transparent focus:border-[#FE6F34] transition py-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300 placeholder:text-zinc-600" : "text-zinc-600 placeholder:text-zinc-300"}`}
            />
          </div>

          {/* Divider */}
          <div className={`h-px w-full my-4 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-200/80"}`} />

          {/* Body Section */}
          <div className="space-y-2">
            <label className={`text-xs font-bold block ${(account?.themeMode || "light") === "dark" ? "text-zinc-400" : "text-zinc-700"}`}>Body</label>

            {/* Rich Text Editor Container */}
            <div className={`rounded-2xl border overflow-hidden shadow-xs ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B]" : "border-zinc-200/90 bg-white"}`}>
              {/* Toolbar matching exact screenshot design */}
              <div ref={toolbarRef} className={`flex flex-wrap items-center gap-1.5 border-b px-3 py-2 text-xs font-semibold ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#18181B] text-zinc-300" : "border-zinc-200 bg-[#F9F9FB] text-zinc-600"}`}>
                {/* Headings Dropdown: T ⌄ */}
                <div className="relative">
                  <button
                    type="button"
                    title="Headings"
                    onClick={() => setActiveMenu((m) => m === "headings" ? null : "headings")}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer text-zinc-700 dark:text-zinc-200 ${activeMenu === "headings" ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
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
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  title="Bold (Ctrl+B)"
                  className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("bold") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                >
                  <span className="font-extrabold text-sm">B</span>
                </button>

                {/* Italic: I */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  title="Italic (Ctrl+I)"
                  className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("italic") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                >
                  <span className="italic font-serif text-sm">I</span>
                </button>

                {/* Strikethrough: S */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  title="Strikethrough"
                  className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("strike") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>

                {/* Text Color: A */}
                <div className="relative">
                  <button
                    type="button"
                    title="Text Color"
                    onClick={() => setActiveMenu((m) => m === "color" ? null : "color")}
                    className={`flex items-center gap-0.5 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${activeMenu === "color" ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
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
                  onClick={() => editor?.chain().focus().unsetAllMarks().unsetColor().unsetTextAlign().clearNodes().run()}
                  title="Clear Format"
                  className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </button>

                <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                {/* Lists: ⋮= ⌄ */}
                <div className="relative">
                  <button
                    type="button"
                    title="Lists"
                    onClick={() => setActiveMenu((m) => m === "lists" ? null : "lists")}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${activeMenu === "lists" ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
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
                    title="Text Align"
                    onClick={() => setActiveMenu((m) => m === "align" ? null : "align")}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${activeMenu === "align" || editor?.isActive({ textAlign: "center" }) || editor?.isActive({ textAlign: "right" }) ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                  >
                    {editor?.isActive({ textAlign: "right" }) ? (
                      <AlignRight className="h-3.5 w-3.5" />
                    ) : editor?.isActive({ textAlign: "center" }) ? (
                      <AlignCenter className="h-3.5 w-3.5" />
                    ) : (
                      <AlignLeft className="h-3.5 w-3.5" />
                    )}
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </button>
                  {activeMenu === "align" && (
                    <div className="absolute left-0 top-full pt-1 z-50">
                      <div className={`w-32 rounded-lg border shadow-lg p-1 flex flex-col ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                        <button type="button" onClick={() => { editor?.chain().focus().setTextAlign("left").run(); setActiveMenu(null); }} className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${!editor?.isActive({ textAlign: "center" }) && !editor?.isActive({ textAlign: "right" }) ? "font-bold text-[#0066B2] dark:text-[#38BDF8]" : ""}`}><AlignLeft className="h-3.5 w-3.5" /> Left</button>
                        <button type="button" onClick={() => { editor?.chain().focus().setTextAlign("center").run(); setActiveMenu(null); }} className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive({ textAlign: "center" }) ? "font-bold text-[#0066B2] dark:text-[#38BDF8]" : ""}`}><AlignCenter className="h-3.5 w-3.5" /> Center</button>
                        <button type="button" onClick={() => { editor?.chain().focus().setTextAlign("right").run(); setActiveMenu(null); }} className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive({ textAlign: "right" }) ? "font-bold text-[#0066B2] dark:text-[#38BDF8]" : ""}`}><AlignRight className="h-3.5 w-3.5" /> Right</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                {/* Insert Image */}
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Enter Image URL:");
                    if (url && editor) {
                      editor.chain().focus().setImage({ src: url }).run();
                    }
                  }}
                  title="Insert Image"
                  className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>

                {/* Insert Video */}
                <button
                  type="button"
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
                      } else {
                        setEmailBody((prev) => prev + `\n${ytHtml}\n`);
                      }
                    } else {
                      const videoHtml = `<p><a href="${url}" target="_blank" rel="noopener noreferrer">▶ Watch Video (${url})</a></p>`;
                      if (editor) {
                        editor.chain().focus().insertContent(videoHtml).run();
                      } else {
                        setEmailBody((prev) => prev + `\n${videoHtml}\n`);
                      }
                    }
                  }}
                  title="Insert Video"
                  className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Video className="h-3.5 w-3.5" />
                </button>

                {/* Insert / Edit Table */}
                <div className="relative">
                  <button
                    type="button"
                    title="Insert or Manage Table"
                    onClick={() => setActiveMenu((m) => m === "table" ? null : "table")}
                    className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${activeMenu === "table" || editor?.isActive("table") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                  </button>
                  {activeMenu === "table" && (
                    <div className="absolute left-0 top-full pt-1 z-50">
                      <div className={`w-44 rounded-lg border shadow-lg p-1 flex flex-col space-y-0.5 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white" : "border-zinc-200 bg-white text-zinc-800"}`}>
                        {editor?.isActive("table") ? (
                          <>
                            <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TABLE CONTROLS</div>
                            <button type="button" onClick={() => { editor.chain().focus().addRowBefore().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Row Above</button>
                            <button type="button" onClick={() => { editor.chain().focus().addRowAfter().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Row Below</button>
                            <button type="button" onClick={() => { editor.chain().focus().deleteRow().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer">❌ Delete Row</button>
                            <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 my-1" />
                            <button type="button" onClick={() => { editor.chain().focus().addColumnBefore().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Column Left</button>
                            <button type="button" onClick={() => { editor.chain().focus().addColumnAfter().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">➕ Add Column Right</button>
                            <button type="button" onClick={() => { editor.chain().focus().deleteColumn().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer">❌ Delete Column</button>
                            <div className="h-px bg-zinc-200 dark:bg-zinc-700/50 my-1" />
                            <button type="button" onClick={() => { editor.chain().focus().deleteTable().run(); setActiveMenu(null); }} className="text-left px-2.5 py-1.5 text-xs text-rose-600 font-bold rounded hover:bg-rose-500/10 cursor-pointer">🗑️ Delete Table</button>
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
                  className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${editor?.isActive("link") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""}`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>

                {/* Insert Horizontal Divider */}
                <button
                  type="button"
                  onClick={() => {
                    if (editor) {
                      editor.chain().focus().setHorizontalRule().run();
                    } else {
                      setEmailBody((prev) => prev + "\n<hr />\n");
                    }
                  }}
                  title="Insert Horizontal Divider"
                  className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer text-zinc-700 dark:text-zinc-200"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                <div className={`h-4 w-px mx-0.5 ${(account?.themeMode || "light") === "dark" ? "bg-[#27272A]" : "bg-zinc-300"}`} />

                {/* + Insert Resource Dropdown Button (100% Untouched connection to Hosted Resources) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowInsertResourceMenu((v) => !v)}
                    className="hover:text-[#38BDF8] text-[#0066B2] dark:text-[#38BDF8] font-semibold transition px-2 py-1 rounded bg-[#EFF6FF] dark:bg-[#0066B2]/20 flex items-center gap-1 cursor-pointer"
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
                              } else {
                                setEmailBody((prev) => prev + `\n${res.url}\n`);
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
              </div>

              {/* Tiptap Rich Text Body Editor Container */}
              <div className="p-4 min-h-[220px]">
                {editor ? (
                  <EditorContent
                    editor={editor}
                    className={`prose ${(account?.themeMode || "light") === "dark" ? "prose-invert text-zinc-100" : "text-zinc-800"} max-w-none text-sm leading-relaxed outline-none focus:outline-none focus:ring-0 ring-0 border-none min-h-[220px]`}
                  />
                ) : (
                  renderEmailBlockEditor(emailBody, setEmailBody, false)
                )}
              </div>
            </div>
          </div>

          {/* Feature 2: Smart Auto-Personalized Deliverable Config Card */}
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#16161A] text-white" : "border-[#0066B2]/30 bg-gradient-to-br from-[#EFF6FF] to-white text-zinc-900"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0066B2] text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h4 className={`text-sm font-bold ${(account?.themeMode || "light") === "dark" ? "text-white" : "text-zinc-900"}`}>AI Personalization Engine (Feature 2)</h4>
                  <p className="text-xs text-zinc-400">Ask leads a question during signup & generate custom AI action plans automatically.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableAiPersonalizedDeliverable(!enableAiPersonalizedDeliverable)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer border ${enableAiPersonalizedDeliverable
                  ? "bg-[#0066B2] text-white border-[#0066B2]"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
                  }`}
              >
                <span>{enableAiPersonalizedDeliverable ? "Active" : "Disabled"}</span>
              </button>
            </div>

            {enableAiPersonalizedDeliverable && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#0066B2]/20 animate-in fade-in duration-200">
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Signup Form Question</label>
                  <input
                    type="text"
                    value={customPromptQuestion}
                    onChange={(e) => setCustomPromptQuestion(e.target.value)}
                    placeholder="e.g. What is your main goal or bottleneck?"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-[#0066B2] transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white placeholder:text-zinc-500" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"}`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${(account?.themeMode || "light") === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Input Placeholder</label>
                  <input
                    type="text"
                    value={customPromptPlaceholder}
                    onChange={(e) => setCustomPromptPlaceholder(e.target.value)}
                    placeholder="e.g. Scaling outreach, Lead generation"
                    className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-[#0066B2] transition ${(account?.themeMode || "light") === "dark" ? "border-[#27272A] bg-[#1E1E24] text-white placeholder:text-zinc-500" : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"}`}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Banner Card */}
        <div className={`mt-6 mx-auto max-w-4xl rounded-2xl p-6 flex items-center justify-center shadow-lg transition-colors duration-200 ${(account?.themeMode || "light") === "dark" ? "bg-[#080B12]" : "bg-zinc-100/90 border border-zinc-200"}`}>
          <button className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition cursor-pointer ${(account?.themeMode || "light") === "dark" ? "bg-[#181C26] text-white border border-[#272D3C] hover:bg-[#202534]" : "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50"}`}>
            <img
              key={(account?.themeMode || "light")}
              src={(account?.themeMode || "light") === "dark" ? "/brand/gemini-logo-dark.png" : "/brand/gemini-logo.png"}
              alt="LeadMagnets"
              className="h-5 w-5 object-contain shrink-0"
            />
            <span>Build yours free with LeadMagnets</span>
          </button>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { TableDropdownMenu, TableFloatingControls } from "./TableFloatingControls";
import {
  Undo2,
  Redo2,
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
  Plus,
  Trash2,
  Sparkles,
  Paperclip,
  List,
  Quote,
} from "lucide-react";
import { loadResources } from "@/lib/store";

export interface SequenceRichEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  themeMode?: string;
  includeResourceLink?: boolean;
}

export default function SequenceRichEditor({
  initialContent,
  onChange,
  placeholder = "Write your email content here...",
  disabled = false,
  themeMode = "light",
  includeResourceLink = false,
}: SequenceRichEditorProps) {
  const [activeMenu, setActiveMenu] = useState<"headings" | "color" | "lists" | "align" | "table" | null>(null);
  const [tableGridHover, setTableGridHover] = useState<{ rows: number; cols: number }>({ rows: 1, cols: 1 });
  const [showInsertResourceMenu, setShowInsertResourceMenu] = useState(false);
  const [hostedResources, setHostedResources] = useState<any[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic theme detection that syncs with document.documentElement ("dark" class)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return themeMode === "dark";
  });

  useEffect(() => {
    const checkDark = () => {
      if (typeof document !== "undefined") {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      } else {
        setIsDarkMode(themeMode === "dark");
      }
    };
    checkDark();

    window.addEventListener("leadmagnets-theme-changed", checkDark);
    window.addEventListener("storage", checkDark);

    const observer = new MutationObserver(() => {
      checkDark();
    });
    if (typeof document !== "undefined") {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      window.removeEventListener("leadmagnets-theme-changed", checkDark);
      window.removeEventListener("storage", checkDark);
      observer.disconnect();
    };
  }, [themeMode]);

  const currentThemeMode = isDarkMode ? "dark" : "light";

  useEffect(() => {
    const res = loadResources();
    if (res && res.length > 0) {
      setHostedResources(res);
    }
  }, []);

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

  // Format initial content into proper HTML if it's plain text with newlines
  const formattedInitialContent = React.useMemo(() => {
    if (!initialContent) return "";
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(initialContent);
    if (hasHtmlTags) return initialContent;
    return initialContent
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }, [initialContent]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: "outline-none focus:outline-none focus:ring-0 min-h-[200px] text-xs sm:text-sm font-sans leading-relaxed",
      },
      handleKeyDown: (view, event) => {
        // Alignment shortcuts (Ctrl+Shift+L, Ctrl+Shift+E, Ctrl+Shift+R)
        if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
          if (event.key === "L" || event.key === "l") {
            event.preventDefault();
            view.dispatch(view.state.tr);
            editor?.chain().focus().setTextAlign("left").run();
            return true;
          }
          if (event.key === "E" || event.key === "e") {
            event.preventDefault();
            editor?.chain().focus().setTextAlign("center").run();
            return true;
          }
          if (event.key === "R" || event.key === "r") {
            event.preventDefault();
            editor?.chain().focus().setTextAlign("right").run();
            return true;
          }
        }
        return false;
      },
    },
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: {},
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
    content: formattedInitialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Keep editor content in sync when external initialContent changes and editor is not focused
  useEffect(() => {
    if (editor && !editor.isFocused && formattedInitialContent) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== formattedInitialContent && Math.abs(currentHtml.length - formattedInitialContent.length) > 5) {
        editor.commands.setContent(formattedInitialContent);
      }
    }
  }, [formattedInitialContent, editor]);

  return (
    <div className={`rounded-xl border shadow-xs overflow-visible transition-colors ${
      currentThemeMode === "dark" ? "border-zinc-800 bg-[#121212] text-white" : "border-zinc-200/90 bg-white text-zinc-900"
    }`}>
      {/* Formatting Toolbar */}
      <div
        ref={toolbarRef}
        className={`rounded-t-[11px] flex flex-wrap items-center gap-1 border-b px-2 sm:px-3 py-1.5 text-xs font-semibold select-none ${
          currentThemeMode === "dark" ? "border-zinc-800 bg-[#171717] text-zinc-300" : "border-zinc-200 bg-[#F9F9FB] text-zinc-600"
        }`}
      >
        {/* Undo Button */}
        <button
          type="button"
          disabled={disabled || !editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>

        {/* Redo Button */}
        <button
          type="button"
          disabled={disabled || !editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>

        <div className={`h-4 w-px mx-0.5 ${currentThemeMode === "dark" ? "bg-zinc-800" : "bg-zinc-300"}`} />

        {/* Headings & Styles Dropdown: T ⌄ */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            title="Styles & Headings"
            onClick={() => setActiveMenu((m) => (m === "headings" ? null : "headings"))}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer text-zinc-700 dark:text-zinc-200 ${
              activeMenu === "headings" ? "bg-zinc-200 dark:bg-zinc-800" : ""
            } disabled:opacity-50`}
          >
            <Type className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>
          {activeMenu === "headings" && (
            <div className="absolute left-0 top-full pt-1 z-50">
              <div className={`w-52 rounded-xl border shadow-xl p-1.5 flex flex-col space-y-0.5 ${
                currentThemeMode === "dark" ? "border-zinc-800 bg-[#1e1e1e] text-white" : "border-zinc-200 bg-white text-zinc-800"
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().setParagraph().run();
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Paragraph</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Ctrl+Alt+0</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 1 }).run();
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs font-bold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Heading 1</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Alt+1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 2 }).run();
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Heading 2</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Alt+2</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 3 }).run();
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <span>Heading 3</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Alt+3</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`h-4 w-px mx-0.5 ${currentThemeMode === "dark" ? "bg-zinc-800" : "bg-zinc-300"}`} />

        {/* Bold: B */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive("bold") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""
          } disabled:opacity-50`}
        >
          <span className="font-extrabold text-sm">B</span>
        </button>

        {/* Italic: I */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive("italic") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""
          } disabled:opacity-50`}
        >
          <span className="italic font-serif text-sm">I</span>
        </button>

        {/* Strikethrough: S */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Strikethrough (Ctrl+Shift+X)"
          className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive("strike") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""
          } disabled:opacity-50`}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        {/* Blockquote: Quote */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Quote / Callout"
          className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive("blockquote") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""
          } disabled:opacity-50`}
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

        {/* Text Color: A */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            title="Text Color"
            onClick={() => setActiveMenu((m) => (m === "color" ? null : "color"))}
            className={`flex items-center gap-0.5 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${
              activeMenu === "color" ? "bg-zinc-200 dark:bg-zinc-800" : ""
            } disabled:opacity-50`}
          >
            <span className="font-extrabold text-xs underline decoration-2 decoration-[#0066B2]">A</span>
          </button>
          {activeMenu === "color" && (
            <div className="absolute left-0 top-full pt-1 z-50">
              <div className={`flex gap-1.5 p-2 rounded-lg border shadow-lg ${
                currentThemeMode === "dark" ? "border-zinc-800 bg-[#1e1e1e]" : "border-zinc-200 bg-white"
              }`}>
                {["#18181b", "#0066B2", "#2563eb", "#059669", "#dc2626", "#d97706", "#7c3aed"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor?.chain().focus().setColor(color).run();
                      setActiveMenu(null);
                    }}
                    className="h-4 w-4 rounded-full border border-black/10 cursor-pointer hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clear Format: Eraser */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!editor) return;
            editor.chain().focus().clearNodes().unsetAllMarks().unsetTextAlign().run();
          }}
          title="Clear Formatting"
          className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
        >
          <Eraser className="h-3.5 w-3.5" />
        </button>

        <div className={`h-4 w-px mx-0.5 ${currentThemeMode === "dark" ? "bg-zinc-800" : "bg-zinc-300"}`} />

        {/* Lists: ⋮= ⌄ */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            title="Lists"
            onClick={() => setActiveMenu((m) => (m === "lists" ? null : "lists"))}
            className={`flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${
              activeMenu === "lists" || editor?.isActive("bulletList") || editor?.isActive("orderedList")
                ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]"
                : ""
            } disabled:opacity-50`}
          >
            <List className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </button>
          {activeMenu === "lists" && (
            <div className="absolute left-0 top-full pt-1 z-50">
              <div className={`w-52 rounded-xl border shadow-xl p-1.5 flex flex-col space-y-0.5 ${
                currentThemeMode === "dark" ? "border-zinc-800 bg-[#1e1e1e] text-white" : "border-zinc-200 bg-white text-zinc-800"
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().toggleBulletList().run();
                    setActiveMenu(null);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-medium ${
                    editor?.isActive("bulletList") ? "font-bold text-[#0066B2] dark:text-[#38BDF8]" : ""
                  }`}
                >
                  <span>Bulleted List</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Shift+8</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().toggleOrderedList().run();
                    setActiveMenu(null);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer font-medium ${
                    editor?.isActive("orderedList") ? "font-bold text-[#0066B2] dark:text-[#38BDF8]" : ""
                  }`}
                >
                  <span>Numbered List</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Shift+7</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alignment: ≡ ⌄ */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            title="Alignment"
            onClick={() => setActiveMenu((m) => (m === "align" ? null : "align"))}
            className={`flex items-center gap-1 px-1.5 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer ${
              activeMenu === "align" || editor?.isActive({ textAlign: "center" }) || editor?.isActive({ textAlign: "right" })
                ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]"
                : ""
            } disabled:opacity-50`}
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
              <div className={`w-48 rounded-xl border shadow-xl p-1.5 flex flex-col space-y-0.5 ${
                currentThemeMode === "dark" ? "border-zinc-800 bg-[#1e1e1e] text-white" : "border-zinc-200 bg-white text-zinc-800"
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().setTextAlign("left").run();
                    setActiveMenu(null);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                    !editor?.isActive({ textAlign: "center" }) && !editor?.isActive({ textAlign: "right" })
                      ? "font-bold text-[#0066B2] dark:text-[#38BDF8]"
                      : ""
                  }`}
                >
                  <span className="flex items-center gap-2"><AlignLeft className="h-3.5 w-3.5" /> Left</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Shift+L</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().setTextAlign("center").run();
                    setActiveMenu(null);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                    editor?.isActive({ textAlign: "center" }) ? "font-bold text-[#0066B2] dark:text-[#38BDF8]" : ""
                  }`}
                >
                  <span className="flex items-center gap-2"><AlignCenter className="h-3.5 w-3.5" /> Center</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Shift+E</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().setTextAlign("right").run();
                    setActiveMenu(null);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                    editor?.isActive({ textAlign: "right" }) ? "font-bold text-[#0066B2] dark:text-[#38BDF8]" : ""
                  }`}
                >
                  <span className="flex items-center gap-2"><AlignRight className="h-3.5 w-3.5" /> Right</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">Ctrl+Shift+R</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`h-4 w-px mx-0.5 ${currentThemeMode === "dark" ? "bg-zinc-800" : "bg-zinc-300"}`} />

        {/* Insert Image */}
        <button
          type="button"
          disabled={disabled}
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
          disabled={disabled}
          onClick={() => {
            const inputUrl = prompt("Enter YouTube or Video URL (e.g. YouTube, Loom, Vimeo):");
            if (!inputUrl) return;
            const url = inputUrl.trim();
            if (!url) return;

            const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/);
            const ytId = ytMatch && ytMatch[2] && ytMatch[2].length === 11 ? ytMatch[2] : null;

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
            disabled={disabled}
            title="Table Controls"
            onClick={() => setActiveMenu((m) => (m === "table" ? null : "table"))}
            className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${
              activeMenu === "table" || editor?.isActive("table") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""
            } disabled:opacity-50`}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </button>
          {activeMenu === "table" && (
            <div className="absolute left-0 top-full pt-1 z-50">
              {editor?.isActive("table") ? (
                <TableDropdownMenu
                  editor={editor}
                  onClose={() => setActiveMenu(null)}
                  themeMode={currentThemeMode}
                />
              ) : (
                <div className={`w-[212px] rounded-xl border shadow-xl p-3 flex flex-col items-center select-none ${
                  currentThemeMode === "dark" ? "border-zinc-800 bg-[#1e1e1e] text-white" : "border-zinc-200 bg-white text-zinc-800"
                }`}>
                  <div
                    className="grid grid-cols-8 gap-1"
                    onMouseLeave={() => setTableGridHover({ rows: 1, cols: 1 })}
                  >
                    {Array.from({ length: 8 }).map((_, rIdx) =>
                      Array.from({ length: 8 }).map((_, cIdx) => {
                        const r = rIdx + 1;
                        const c = cIdx + 1;
                        const isSelected = r <= tableGridHover.rows && c <= tableGridHover.cols;
                        return (
                          <button
                            key={`${r}-${c}`}
                            type="button"
                            onMouseEnter={() => setTableGridHover({ rows: r, cols: c })}
                            onClick={() => {
                              editor?.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                              setActiveMenu(null);
                              setTableGridHover({ rows: 1, cols: 1 });
                            }}
                            className={`w-5 h-5 shrink-0 p-0 m-0 rounded-[4px] border transition-colors cursor-pointer ${
                                      isSelected
                                        ? "bg-[#ecf2fe] border-[#7cacf8] dark:bg-blue-500/25 dark:border-blue-400"
                                        : "bg-[#f0f4f9] border-transparent dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    }`}
                                    title={`${r} × ${c} Table`}
                            aria-label={`${r} by ${c} table`}
                          />
                        );
                      })
                    )}
                  </div>
                  <div className="pt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {tableGridHover.rows}×{tableGridHover.cols}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Link: Link2 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!editor) return;
            if (editor.isActive("link")) {
              const currentHref = editor.getAttributes("link").href || "";
              const choice = prompt(`Current Link URL: ${currentHref}\n\nType NEW URL to update, or leave blank to REMOVE:`, currentHref);
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

            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, " ");

            if (selectedText && selectedText.trim().length > 0) {
              const rawUrl = prompt(`Enter URL for selected text ("${selectedText.trim()}"):`);
              if (!rawUrl) return;
              const trimmed = rawUrl.trim();
              if (!trimmed) return;
              const formattedUrl = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
              editor.chain().focus().setLink({ href: formattedUrl }).run();
            } else {
              const rawUrl = prompt("Enter Link URL (e.g. https://example.com):");
              if (!rawUrl) return;
              const trimmedUrl = rawUrl.trim();
              if (!trimmedUrl) return;
              const formattedUrl = trimmedUrl.match(/^https?:\/\//i) ? trimmedUrl : `https://${trimmedUrl}`;
              const displayText = prompt("Enter Text to Display for the link:", trimmedUrl);
              const finalLabel = displayText && displayText.trim() ? displayText.trim() : formattedUrl;
              editor.chain().focus().insertContent(`<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${finalLabel}</a>`).run();
            }
          }}
          title={editor?.isActive("link") ? "Edit or Remove Hyperlink (Ctrl+K)" : "Insert Hyperlink (Ctrl+K)"}
          className={`p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive("link") ? "bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]" : ""
          } disabled:opacity-50`}
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>

        {/* Divider: Minus */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          title="Horizontal Divider"
          className="p-1.5 rounded transition hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <div className={`h-4 w-px mx-0.5 ${currentThemeMode === "dark" ? "bg-zinc-800" : "bg-zinc-300"}`} />

        {/* Resource Insertion Dropdown */}
        {hostedResources && hostedResources.length > 0 && (
          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowInsertResourceMenu(!showInsertResourceMenu)}
              title="Insert Download Link to Hosted File"
              className="flex items-center gap-1 rounded bg-[#0066B2]/10 dark:bg-[#0066B2]/20 px-2 py-1 text-xs font-bold text-[#0066B2] dark:text-[#38BDF8] hover:bg-[#0066B2]/20 transition cursor-pointer disabled:opacity-50"
            >
              <Paperclip className="h-3 w-3" />
              <span>+ Insert Resource</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showInsertResourceMenu && (
              <div className={`absolute left-0 top-full mt-1 w-64 rounded-xl border p-1.5 shadow-xl z-50 ${
                currentThemeMode === "dark" ? "border-zinc-800 bg-[#1e1e1e] text-white" : "border-zinc-200 bg-white text-zinc-900"
              }`}>
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Available Files & Downloads
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {hostedResources.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        const fileUrl = res.url || res.downloadUrl || res.path || "";
                        const fileName = res.name || res.title || "Download Resource";
                        if (editor && fileUrl) {
                          editor
                            .chain()
                            .focus()
                            .insertContent(
                              `<p><a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 16px;background-color:#0066B2;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">📥 Download ${fileName}</a></p>`
                            )
                            .run();
                        }
                        setShowInsertResourceMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition truncate flex items-center justify-between"
                    >
                      <span className="truncate">{res.name || res.title || "File"}</span>
                      <span className="text-[10px] text-zinc-400 uppercase shrink-0 ml-2">Link</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Variable Insertion: + {first_name} */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (editor) {
              editor.chain().focus().insertContent("{first_name}").run();
            }
          }}
          title="Insert Subscriber First Name"
          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-[#0066B2]/10 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition cursor-pointer text-xs font-mono font-medium disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          <span>{"{first_name}"}</span>
        </button>

        {/* Dynamic Variable Insertion: + {name} */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (editor) {
              editor.chain().focus().insertContent("{name}").run();
            }
          }}
          title="Insert Subscriber Full Name"
          className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-[#0066B2]/10 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition cursor-pointer text-xs font-mono font-medium disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          <span>{"{name}"}</span>
        </button>

        {/* Dynamic Variable Insertion: + {resource_link} */}
        {includeResourceLink && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (editor) {
                editor.chain().focus().insertContent("{resource_link}").run();
              }
            }}
            title="Insert Funnel Download Link"
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-[#0066B2]/10 hover:text-[#0066B2] dark:hover:text-[#38BDF8] transition cursor-pointer text-xs font-mono font-medium disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            <span>{"{resource_link}"}</span>
          </button>
        )}
      </div>

      {/* Editor Content Area */}
      <div ref={editorContainerRef} className="rounded-b-[11px] relative p-3 sm:p-4 text-xs sm:text-sm pb-14">
        <EditorContent
          editor={editor}
          className={`prose prose-sm ${currentThemeMode === "dark" ? "prose-invert text-zinc-100" : "text-zinc-800"} max-w-none font-sans focus:outline-none min-h-[200px]`}
        />
        <TableFloatingControls
          editor={editor}
          containerRef={editorContainerRef}
          themeMode={currentThemeMode}
        />
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useRef } from "react";
import { type Editor } from "@tiptap/react";
import {
  Plus,
  ChevronDown,
  X,
  Table as TableIcon,
  Trash2,
} from "lucide-react";

export interface TableDropdownMenuProps {
  editor: Editor | null;
  onClose: () => void;
  themeMode?: "light" | "dark" | string;
  className?: string;
}

export function TableDropdownMenu({
  editor,
  onClose,
  themeMode = "light",
  className = "",
}: TableDropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!editor) return null;

  return (
    <div
      ref={menuRef}
      className={`w-56 max-h-[85vh] overflow-y-auto rounded-2xl border shadow-xl p-1.5 flex flex-col space-y-0.5 select-none ${
        themeMode === "dark"
          ? "border-zinc-800 bg-[#1E1E24] text-white"
          : "border-zinc-200/90 bg-white text-zinc-800"
      } ${className}`}
    >
      {/* 1. Insert Row Above */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addRowBefore().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <svg className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 9.5h11a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          <path d="M8 7V2.5m-2 2L8 2.5l2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Insert Row Above</span>
      </button>

      {/* 2. Insert Row Below */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addRowAfter().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <svg className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 2.5h11a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          <path d="M8 9v4.5m-2-2 2 2 2-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Insert Row Below</span>
      </button>

      {/* 3. Insert Column Left */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addColumnBefore().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <svg className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.5 2.5v11a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1Z" />
          <path d="M7 8H2.5m2-2L2.5 8l2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Insert Column Left</span>
      </button>

      {/* 4. Insert Column Right */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().addColumnAfter().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <svg className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 2.5v11a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1Z" />
          <path d="M9 8h4.5m-2-2 2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Insert Column Right</span>
      </button>

      {/* 5. Clear content */}
      <button
        type="button"
        onClick={() => {
          const state = editor.state;
          const $pos = state.selection.$from;
          for (let d = $pos.depth; d > 0; d--) {
            const node = $pos.node(d);
            if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
              editor.chain().focus().deleteRange({ from: $pos.start(d), to: $pos.end(d) }).run();
              break;
            }
          }
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <X className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
        <span>Clear content</span>
      </button>

      {/* 6. Insert / Toggle Header Row */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().toggleHeaderRow().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <TableIcon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
        <span>Insert Header Row</span>
      </button>

      {/* Divider */}
      <div className="h-px bg-zinc-200/70 dark:bg-zinc-800 my-1" />

      {/* 7. Remove Column */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().deleteColumn().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <Trash2 className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
        <span>Remove Column</span>
      </button>

      {/* 8. Remove Row */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().deleteRow().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer text-left w-full text-zinc-700 dark:text-zinc-200"
      >
        <Trash2 className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
        <span>Remove Row</span>
      </button>

      {/* 9. Delete Table */}
      <button
        type="button"
        onClick={() => {
          editor.chain().focus().deleteTable().run();
          onClose();
        }}
        className="flex items-center gap-3 px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer text-left w-full text-rose-500"
      >
        <Trash2 className="h-4 w-4 shrink-0 text-rose-500" />
        <span>Delete Table</span>
      </button>
    </div>
  );
}

export interface TableFloatingControlsProps {
  editor: Editor | null;
  containerRef: React.RefObject<HTMLDivElement>;
  themeMode?: "light" | "dark" | string;
}

export function TableFloatingControls({
  editor,
  containerRef,
  themeMode = "light",
}: TableFloatingControlsProps) {
  const [showCellMenu, setShowCellMenu] = useState(false);
  const [tableRects, setTableRects] = useState<{
    table: { top: number; bottom: number; left: number; right: number; width: number; height: number };
    cell: { top: number; right: number } | null;
  } | null>(null);

  useEffect(() => {
    if (!editor) return;

    const updateRects = () => {
      const container = containerRef.current;
      if (!container || !editor.isActive("table")) {
        setTableRects(null);
        setShowCellMenu(false);
        return;
      }

      const sel = window.getSelection();
      const node = sel?.anchorNode;
      const cellElem = (node instanceof Element ? node : node?.parentElement)?.closest("td, th");
      const tableElem = cellElem?.closest("table") || container.querySelector(".ProseMirror table");

      if (!tableElem) {
        setTableRects(null);
        setShowCellMenu(false);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const tableRect = tableElem.getBoundingClientRect();
      const cellRect = cellElem ? cellElem.getBoundingClientRect() : null;

      setTableRects({
        table: {
          top: tableRect.top - containerRect.top,
          bottom: tableRect.bottom - containerRect.top,
          left: tableRect.left - containerRect.left,
          right: tableRect.right - containerRect.left,
          width: tableRect.width,
          height: tableRect.height,
        },
        cell: cellRect
          ? {
              top: cellRect.top - containerRect.top,
              right: cellRect.right - containerRect.left,
            }
          : null,
      });
    };

    updateRects();

    editor.on("selectionUpdate", updateRects);
    editor.on("transaction", updateRects);
    window.addEventListener("resize", updateRects);
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", updateRects);
    }

    return () => {
      editor.off("selectionUpdate", updateRects);
      editor.off("transaction", updateRects);
      window.removeEventListener("resize", updateRects);
      if (container) {
        container.removeEventListener("scroll", updateRects);
      }
    };
  }, [editor, containerRef]);

  if (!editor || !editor.isActive("table") || !tableRects) {
    return null;
  }

  return (
    <>
      {/* 1. Bottom "+" Bar: Add Row Below */}
      <div
        style={{
          position: "absolute",
          top: tableRects.table.bottom + 4,
          left: tableRects.table.left,
          width: tableRects.table.width,
          height: 22,
        }}
        className="z-10"
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().addRowAfter().run();
          }}
          title="Insert row below"
          className="w-full h-full flex items-center justify-center rounded-md bg-[#f1f3f9] hover:bg-[#e2eaf5] dark:bg-[#1c1c22] dark:hover:bg-[#25252e] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition shadow-2xs border border-[#d4d4d8] dark:border-[#3f3f46] cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 2. Right "+" Bar: Add Column Right */}
      <div
        style={{
          position: "absolute",
          top: tableRects.table.top,
          left: tableRects.table.right + 4,
          width: 22,
          height: tableRects.table.height,
        }}
        className="z-10"
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().addColumnAfter().run();
          }}
          title="Insert column right"
          className="w-full h-full flex items-center justify-center rounded-md bg-[#f1f3f9] hover:bg-[#e2eaf5] dark:bg-[#1c1c22] dark:hover:bg-[#25252e] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition shadow-2xs border border-[#d4d4d8] dark:border-[#3f3f46] cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 3. Cell Chevron Dropdown Trigger with Smart Direction */}
      {tableRects.cell && (() => {
        const isNearBottom = containerRef.current
          ? tableRects.cell.top > (containerRef.current.clientHeight / 2) || tableRects.cell.top > 120
          : false;

        return (
          <div
            style={{
              position: "absolute",
              top: tableRects.cell.top + 3,
              left: tableRects.cell.right - 20,
            }}
            className="z-20"
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCellMenu((prev) => !prev);
              }}
              title="Table options"
              className="w-4 h-4 flex items-center justify-center rounded bg-white/95 dark:bg-zinc-800/95 shadow-xs border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
            {showCellMenu && (
              <div
                className={`absolute right-0 z-50 ${
                  isNearBottom ? "bottom-full pb-1.5" : "top-full pt-1.5"
                }`}
              >
                <TableDropdownMenu
                  editor={editor}
                  onClose={() => setShowCellMenu(false)}
                  themeMode={themeMode}
                />
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}


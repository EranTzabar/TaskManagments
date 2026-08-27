"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { splitTextWithLinks, normalizeLink } from "@/lib/linkify";
import { BoardNote, BoardNoteColor } from "@/lib/types";
import {
  BOARD_NOTE_COLORS,
  BOARD_NOTE_CONTENT_MAX_LENGTH,
  BOARD_NOTE_MAX_HEIGHT,
  BOARD_NOTE_MAX_WIDTH,
  BOARD_NOTE_MIN_HEIGHT,
  BOARD_NOTE_MIN_WIDTH,
} from "@/lib/utils";
import DragHandle from "@/components/ui/DragHandle";

export const NOTE_COLOR_STYLES: Record<
  BoardNoteColor,
  { header: string; body: string; swatch: string }
> = {
  yellow: {
    header: "bg-yellow-300 dark:bg-yellow-600",
    body: "bg-yellow-100 dark:bg-yellow-950/60",
    swatch: "bg-yellow-300",
  },
  green: {
    header: "bg-green-300 dark:bg-green-600",
    body: "bg-green-100 dark:bg-green-950/60",
    swatch: "bg-green-300",
  },
  blue: {
    header: "bg-sky-300 dark:bg-sky-600",
    body: "bg-sky-100 dark:bg-sky-950/60",
    swatch: "bg-sky-300",
  },
  pink: {
    header: "bg-pink-300 dark:bg-pink-600",
    body: "bg-pink-100 dark:bg-pink-950/60",
    swatch: "bg-pink-300",
  },
  purple: {
    header: "bg-purple-300 dark:bg-purple-600",
    body: "bg-purple-100 dark:bg-purple-950/60",
    swatch: "bg-purple-300",
  },
};

export function noteDragId(noteId: number): string {
  return `note-${noteId}`;
}

export function parseNoteDragId(id: string | number): number | null {
  const value = String(id);
  if (!value.startsWith("note-")) {
    return null;
  }

  const noteId = Number(value.slice(5));
  return Number.isNaN(noteId) ? null : noteId;
}

interface StickyNoteProps {
  note: BoardNote;
  isAdmin: boolean;
  isMobile: boolean;
  isDragging?: boolean;
  onContentChange: (noteId: number, content: string) => void;
  onColorChange: (noteId: number, color: BoardNoteColor) => void;
  onSizeChange: (noteId: number, width: number, height: number) => void;
  onDelete: (noteId: number) => void;
}

export default function StickyNote({
  note,
  isAdmin,
  isMobile,
  isDragging = false,
  onContentChange,
  onColorChange,
  onSizeChange,
  onDelete,
}: StickyNoteProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [resizeSize, setResizeSize] = useState<{ width: number; height: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const noteWidth = resizeSize?.width ?? note.width;
  const noteHeight = resizeSize?.height ?? note.height;
  const draggableEnabled = isAdmin && !isMobile;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: noteDragId(note.noteId),
    disabled: !draggableEnabled || isResizing,
  });

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const start = resizeRef.current;
      if (!start) {
        return;
      }

      const deltaX = event.clientX - start.startX;
      const deltaY = event.clientY - start.startY;
      setResizeSize(clampNoteSize(start.startWidth + deltaX, start.startHeight + deltaY));
    };

    const handlePointerUp = (event: PointerEvent) => {
      const start = resizeRef.current;
      if (!start) {
        return;
      }

      const deltaX = event.clientX - start.startX;
      const deltaY = event.clientY - start.startY;
      const nextSize = clampNoteSize(start.startWidth + deltaX, start.startHeight + deltaY);

      resizeRef.current = null;
      setIsResizing(false);
      setResizeSize(null);
      onSizeChange(note.noteId, nextSize.width, nextSize.height);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing, note.noteId, onSizeChange]);

  const handleResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: noteWidth,
      startHeight: noteHeight,
    };
    setIsResizing(true);
    setResizeSize({ width: noteWidth, height: noteHeight });
  };

  useEffect(() => {
    if (!editing) {
      setDraft(note.content);
    }
  }, [editing, note.content]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [editing]);

  const styles = NOTE_COLOR_STYLES[note.color];

  const handleBlur = () => {
    setEditing(false);
    if (draft !== note.content) {
      onContentChange(note.noteId, draft);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      setDraft(note.content);
      setEditing(false);
    }
  };

  const dragStyle = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const noteBody = (
    <>
      <header
        className={`flex items-center gap-1 px-2 py-1.5 ${styles.header} ${
          draggableEnabled ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {draggableEnabled ? (
          <DragHandle
            attributes={attributes}
            listeners={listeners}
            className="text-slate-700/70 hover:text-slate-900 dark:text-slate-900/70 dark:hover:text-slate-950"
          />
        ) : null}

        <div className="flex-1 min-w-0" {...(draggableEnabled ? { ...attributes, ...listeners } : {})} />

        {isAdmin ? (
          <div className="flex items-center gap-1 shrink-0">
            {BOARD_NOTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`צבע ${color}`}
                title={`צבע ${color}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onColorChange(note.noteId, color)}
                className={`w-4 h-4 rounded-full border-2 ${NOTE_COLOR_STYLES[color].swatch} ${
                  note.color === color ? "border-slate-800 dark:border-white" : "border-transparent"
                }`}
              />
            ))}
            <button
              type="button"
              aria-label="מחק פתק"
              title="מחק פתק"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onDelete(note.noteId)}
              className="p-1 rounded-md text-slate-700/80 hover:text-red-700 hover:bg-red-100/60 dark:text-slate-900/80 dark:hover:text-red-900 dark:hover:bg-red-200/40 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : null}
      </header>

      <div
        className={`relative flex-1 min-h-0 p-3 text-sm text-slate-800 whitespace-pre-wrap break-words overflow-auto ${styles.body} dark:text-slate-100`}
        onClick={() => {
          if (isAdmin) {
            setEditing(true);
          }
        }}
      >
        {editing && isAdmin ? (
          <textarea
            ref={textareaRef}
            value={draft}
            maxLength={BOARD_NOTE_CONTENT_MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full min-h-[80px] resize-none bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100"
          />
        ) : note.content.trim() ? (
          <span>
            {splitTextWithLinks(note.content).map((part, index) =>
              part.type === "link" ? (
                <a
                  key={`${index}-${part.value}`}
                  href={normalizeLink(part.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 underline break-all hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200"
                  onClick={(event) => event.stopPropagation()}
                >
                  {part.value}
                </a>
              ) : (
                <span key={`${index}-${part.value}`}>{part.value}</span>
              )
            )}
          </span>
        ) : isAdmin ? (
          <span className="text-slate-500 dark:text-slate-400">לחץ/י לכתיבה...</span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 italic">פתק ריק</span>
        )}
      </div>

      {draggableEnabled ? (
        <button
          type="button"
          aria-label="שנה גודל"
          title="שנה גודל"
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize touch-none text-slate-600/70 hover:text-slate-900 dark:text-slate-900/70 dark:hover:text-slate-950"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M14 14L8 14L14 8Z" />
            <path d="M14 14L14 10L10 14Z" opacity="0.6" />
          </svg>
        </button>
      ) : null}
    </>
  );

  if (isMobile) {
    return (
      <article
        style={{
          width: "100%",
          minHeight: noteHeight,
        }}
        className="relative flex flex-col w-full max-w-full rounded-lg shadow-md border border-black/10 overflow-hidden"
      >
        {noteBody}
      </article>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: note.x,
        top: note.y,
        width: noteWidth,
        height: noteHeight,
        zIndex: isDragging || isResizing ? 9999 : note.zIndex,
        ...dragStyle,
      }}
      className={isDragging ? "opacity-90" : undefined}
    >
      <article className="relative flex flex-col h-full rounded-lg shadow-md border border-black/10 overflow-hidden">
        {noteBody}
      </article>
    </div>
  );
}

export function useIsMobileNotesLayout(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function clampNoteSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.min(Math.max(BOARD_NOTE_MIN_WIDTH, Math.round(width)), BOARD_NOTE_MAX_WIDTH),
    height: Math.min(Math.max(BOARD_NOTE_MIN_HEIGHT, Math.round(height)), BOARD_NOTE_MAX_HEIGHT),
  };
}

export function clampNotePosition(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  noteWidth: number,
  noteHeight: number
): { x: number; y: number } {
  const maxX = Math.max(0, canvasWidth - noteWidth);
  const maxY = Math.max(0, canvasHeight - noteHeight);

  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

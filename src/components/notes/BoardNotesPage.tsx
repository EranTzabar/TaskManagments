"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  createBoardNoteApi,
  deleteBoardNoteApi,
  updateBoardNoteApi,
} from "@/lib/api-client";
import { BoardNote, BoardNoteColor, Project, SessionUser } from "@/lib/types";
import Header from "@/components/layout/Header";
import { useToast } from "@/components/providers/Toast";
import StickyNote, {
  clampNotePosition,
  parseNoteDragId,
  useIsMobileNotesLayout,
} from "./StickyNote";

interface BoardNotesPageProps {
  user: SessionUser;
  project: Project;
  initialNotes: BoardNote[];
}

export default function BoardNotesPage({
  user,
  project,
  initialNotes,
}: BoardNotesPageProps) {
  const { showToast } = useToast();
  const isAdmin = user.role === "admin";
  const isMobile = useIsMobileNotesLayout();
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [notes, setNotes] = useState<BoardNote[]>(initialNotes);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  useEffect(() => {
    return () => {
      Object.values(contentTimers.current).forEach(clearTimeout);
    };
  }, []);

  const getCanvasSize = useCallback(() => {
    const element = canvasRef.current;
    if (!element) {
      return { width: 800, height: 600 };
    }

    return {
      width: element.clientWidth,
      height: element.clientHeight,
    };
  }, []);

  const handleCreateNote = useCallback(async () => {
    try {
      const { note } = await createBoardNoteApi(project.projectId);
      setNotes((current) => [...current, note]);
      showToast("פתק חדש נוצר", "success");
    } catch {
      showToast("שגיאה ביצירת פתק", "error");
    }
  }, [project.projectId, showToast]);

  const handleContentChange = useCallback(
    (noteId: number, content: string) => {
      const previous = notes.find((note) => note.noteId === noteId);
      if (!previous) {
        return;
      }

      setNotes((current) =>
        current.map((note) => (note.noteId === noteId ? { ...note, content } : note))
      );

      if (contentTimers.current[noteId]) {
        clearTimeout(contentTimers.current[noteId]);
      }

      contentTimers.current[noteId] = setTimeout(async () => {
        try {
          const { note } = await updateBoardNoteApi(project.projectId, noteId, { content });
          setNotes((current) =>
            current.map((item) => (item.noteId === noteId ? note : item))
          );
        } catch {
          setNotes((current) =>
            current.map((note) =>
              note.noteId === noteId ? { ...note, content: previous.content } : note
            )
          );
          showToast("שגיאה בשמירת הפתק", "error");
        }
      }, 500);
    },
    [notes, project.projectId, showToast]
  );

  const handleColorChange = useCallback(
    async (noteId: number, color: BoardNoteColor) => {
      const previous = notes.find((note) => note.noteId === noteId);
      if (!previous || previous.color === color) {
        return;
      }

      setNotes((current) =>
        current.map((note) => (note.noteId === noteId ? { ...note, color } : note))
      );

      try {
        const { note } = await updateBoardNoteApi(project.projectId, noteId, { color });
        setNotes((current) => current.map((item) => (item.noteId === noteId ? note : item)));
      } catch {
        setNotes((current) =>
          current.map((note) =>
            note.noteId === noteId ? { ...note, color: previous.color } : note
          )
        );
        showToast("שגיאה בעדכון צבע הפתק", "error");
      }
    },
    [notes, project.projectId, showToast]
  );

  const handleDelete = useCallback(
    async (noteId: number) => {
      const previous = notes;
      setNotes((current) => current.filter((note) => note.noteId !== noteId));

      try {
        await deleteBoardNoteApi(project.projectId, noteId);
        showToast("הפתק נמחק", "success");
      } catch {
        setNotes(previous);
        showToast("שגיאה במחיקת הפתק", "error");
      }
    },
    [notes, project.projectId, showToast]
  );

  const handleSizeChange = useCallback(
    async (noteId: number, width: number, height: number) => {
      const previous = notes.find((note) => note.noteId === noteId);
      if (!previous || (previous.width === width && previous.height === height)) {
        return;
      }

      setNotes((current) =>
        current.map((note) => (note.noteId === noteId ? { ...note, width, height } : note))
      );

      try {
        const { note } = await updateBoardNoteApi(project.projectId, noteId, { width, height });
        setNotes((current) => current.map((item) => (item.noteId === noteId ? note : item)));
      } catch {
        setNotes((current) =>
          current.map((note) =>
            note.noteId === noteId
              ? { ...note, width: previous.width, height: previous.height }
              : note
          )
        );
        showToast("שגיאה בשמירת גודל הפתק", "error");
      }
    },
    [notes, project.projectId, showToast]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const noteId = parseNoteDragId(event.active.id);
      if (noteId == null) {
        return;
      }

      setActiveDragId(noteId);

      const maxZ = notes.reduce((max, note) => Math.max(max, note.zIndex), 0);
      const nextZ = maxZ + 1;

      setNotes((current) =>
        current.map((note) => (note.noteId === noteId ? { ...note, zIndex: nextZ } : note))
      );

      void updateBoardNoteApi(project.projectId, noteId, { zIndex: nextZ }).catch(() => {
        showToast("שגיאה בעדכון סדר הפתקים", "error");
      });
    },
    [notes, project.projectId, showToast]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null);

      const noteId = parseNoteDragId(event.active.id);
      if (noteId == null || (!event.delta.x && !event.delta.y)) {
        return;
      }

      const note = notes.find((item) => item.noteId === noteId);
      if (!note) {
        return;
      }

      const { width, height } = getCanvasSize();
      const nextPosition = clampNotePosition(
        note.x + event.delta.x,
        note.y + event.delta.y,
        width,
        height,
        note.width,
        note.height
      );

      const previous = note;
      setNotes((current) =>
        current.map((item) =>
          item.noteId === noteId ? { ...item, x: nextPosition.x, y: nextPosition.y } : item
        )
      );

      try {
        const { note: updated } = await updateBoardNoteApi(project.projectId, noteId, {
          x: nextPosition.x,
          y: nextPosition.y,
        });
        setNotes((current) => current.map((item) => (item.noteId === noteId ? updated : item)));
      } catch {
        setNotes((current) =>
          current.map((item) =>
            item.noteId === noteId ? { ...item, x: previous.x, y: previous.y } : item
          )
        );
        showToast("שגיאה בשמירת מיקום הפתק", "error");
      }
    },
    [getCanvasSize, notes, project.projectId, showToast]
  );

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
      <Header user={user} />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href={`/?project=${project.projectId}`}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ← חזרה ללוח
            </Link>
            <h2 className="text-2xl font-bold mt-2">פתקים — {project.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin
                ? "גרור/י מהכותרת, שנה/י גודל מהפינה, לחץ/י על הטקסט לעריכה. קישורים מזוהים אוטומטית."
                : "צפייה בפתקים משותפים של הלוח."}
            </p>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => void handleCreateNote()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow self-start sm:self-auto"
            >
              + פתק חדש
            </button>
          ) : null}
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div
            ref={canvasRef}
            className={`relative flex-1 min-h-[480px] md:min-h-[620px] rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm overflow-hidden ${
              isMobile ? "flex flex-col gap-4 p-4" : "bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(rgba(100,116,139,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.2)_1px,transparent_1px)]"
            }`}
          >
            {notes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                {isAdmin ? "אין פתקים עדיין. לחץ/י על \"פתק חדש\"." : "אין פתקים בלוח זה."}
              </div>
            ) : null}

            {notes.map((note) => (
              <StickyNote
                key={note.noteId}
                note={note}
                isAdmin={isAdmin}
                isMobile={isMobile}
                isDragging={activeDragId === note.noteId}
                onContentChange={handleContentChange}
                onColorChange={handleColorChange}
                onSizeChange={handleSizeChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DndContext>
      </main>
    </div>
  );
}

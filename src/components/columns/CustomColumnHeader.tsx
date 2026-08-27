"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CustomColumn } from "@/lib/types";
import DragHandle from "@/components/ui/DragHandle";

interface CustomColumnHeaderProps {
  column: CustomColumn;
  isAdmin?: boolean;
  sortable?: boolean;
  onDelete?: (columnId: number) => void;
}

export default function CustomColumnHeader({
  column,
  isAdmin = false,
  sortable = false,
  onDelete,
}: CustomColumnHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.columnId,
    disabled: !sortable,
  });

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  return (
    <th
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className={`relative border-l border-slate-200 py-3.5 px-3 dark:border-slate-700 text-right select-none ${
        isDragging ? "z-10 bg-slate-100 dark:bg-slate-800 shadow-md" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-1 min-w-0">
        <div className="flex items-center gap-0.5 min-w-0 flex-1">
          <DragHandle attributes={attributes} listeners={listeners} disabled={!sortable} />
          <span className="block truncate text-xs font-semibold pe-1">{column.name}</span>
        </div>
        {isAdmin && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(column.columnId)}
            className="shrink-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
            title="מחק עמודה"
            aria-label={`מחק עמודה ${column.name}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </th>
  );
}

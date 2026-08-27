"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface DragHandleProps {
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  disabled?: boolean;
  className?: string;
}

export default function DragHandle({
  attributes,
  listeners,
  disabled = false,
  className = "",
}: DragHandleProps) {
  if (disabled) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="גרור לשינוי סדר"
      title="גרור לשינוי סדר"
      className={`shrink-0 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 cursor-grab active:cursor-grabbing touch-none transition ${className}`}
      {...attributes}
      {...listeners}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm6-12a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    </button>
  );
}

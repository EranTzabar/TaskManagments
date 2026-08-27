"use client";

import { TaskTableColumnKey } from "@/lib/taskTableColumns";

interface ResizableTableHeaderProps {
  columnKey: TaskTableColumnKey;
  label: string;
  align?: "left" | "center" | "right";
  width: string;
  onResizeStart: (key: TaskTableColumnKey, clientX: number) => void;
  resizable?: boolean;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export default function ResizableTableHeader({
  columnKey,
  label,
  align = "right",
  width,
  onResizeStart,
  resizable = true,
}: ResizableTableHeaderProps) {
  return (
    <th
      className={`relative border-l border-slate-200 py-3.5 px-4 dark:border-slate-700 ${alignClass[align]} select-none`}
      style={{ width }}
    >
      <span className="block truncate pe-2">{label}</span>
      {resizable ? (
        <button
          type="button"
          aria-label={`שנה רוחב עמודת ${label}`}
          onMouseDown={(event) => {
            event.preventDefault();
            onResizeStart(columnKey, event.clientX);
          }}
          className="absolute left-0 top-0 z-10 h-full w-2 -translate-x-1/2 cursor-col-resize touch-none border-0 bg-transparent p-0 hover:bg-indigo-400/10 focus-visible:bg-indigo-400/10"
        />
      ) : null}
    </th>
  );
}

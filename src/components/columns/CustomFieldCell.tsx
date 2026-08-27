"use client";

import { useRef } from "react";
import { CustomColumn, CustomColumnType } from "@/lib/types";

function normalizeLink(value: string): string {
  if (!value.trim()) {
    return "";
  }
  return value.startsWith("http") ? value : `https://${value}`;
}

function toDateInputValue(value: string): string {
  if (!value.trim()) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(value: string): string {
  const iso = toDateInputValue(value);
  if (!iso) {
    return value;
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

const inputClassName =
  "w-full min-w-0 px-2 py-1 text-xs rounded-md border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500";

interface DateFieldCellProps {
  value: string;
  onChange: (value: string) => void;
}

function DateFieldCell({ value, onChange }: DateFieldCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValue = toDateInputValue(value);
  const displayValue = inputValue ? formatDateDisplay(inputValue) : "";

  const openCalendar = () => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div
      className={`${inputClassName} flex w-full items-center gap-1 text-right hover:border-indigo-300 dark:hover:border-indigo-500`}
    >
      <button
        type="button"
        onClick={openCalendar}
        className="flex min-w-0 flex-1 items-center gap-1 text-right"
      >
        <span className={displayValue ? "min-w-0 truncate" : "min-w-0 truncate text-slate-400 dark:text-slate-500"}>
          {displayValue || "בחר תאריך"}
        </span>
        <svg
          className="ms-auto h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
      {inputValue ? (
        <button
          type="button"
          aria-label="נקה תאריך"
          title="נקה תאריך"
          onClick={() => onChange("")}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="date"
        value={inputValue}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

interface CustomFieldCellProps {
  type: CustomColumnType;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

export default function CustomFieldCell({
  type,
  value,
  readOnly = false,
  onChange,
}: CustomFieldCellProps) {
  if (readOnly) {
    if (!value) {
      return <span className="text-xs text-slate-300 dark:text-slate-600">—</span>;
    }

    if (type === "link") {
      const href = normalizeLink(value);
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 truncate block"
        >
          {value}
        </a>
      );
    }

    if (type === "date") {
      return (
        <span className="text-xs text-slate-700 dark:text-slate-200 truncate block">
          {formatDateDisplay(value)}
        </span>
      );
    }

    return (
      <span className="text-xs text-slate-700 dark:text-slate-200 truncate block">{value}</span>
    );
  }

  if (type === "date") {
    return <DateFieldCell value={value} onChange={onChange} />;
  }

  if (type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    );
  }

  if (type === "link") {
    return (
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://"
        className={inputClassName}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClassName}
    />
  );
}

interface CustomFieldCellsProps {
  taskId: number;
  customColumns: CustomColumn[];
  customFields?: Record<string, string>;
  readOnly?: boolean;
  onCustomFieldChange?: (taskId: number, columnId: number, value: string) => void;
  compact?: boolean;
}

export function CustomFieldCells({
  taskId,
  customColumns,
  customFields = {},
  readOnly = false,
  onCustomFieldChange,
  compact = false,
}: CustomFieldCellsProps) {
  const cellClass = compact ? "py-2 px-2 align-top min-w-0" : "py-3 px-3 align-top min-w-0";

  return (
    <>
      {customColumns.map((column) => (
        <td key={column.columnId} className={cellClass}>
          <CustomFieldCell
            type={column.type}
            value={customFields[String(column.columnId)] ?? ""}
            readOnly={readOnly || !onCustomFieldChange}
            onChange={(value) => onCustomFieldChange?.(taskId, column.columnId, value)}
          />
        </td>
      ))}
    </>
  );
}

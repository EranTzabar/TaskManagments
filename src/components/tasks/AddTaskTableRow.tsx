"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { CustomColumn, TaskPriority } from "@/lib/types";
import { TASK_PRIORITIES, TASK_TITLE_MAX_LENGTH } from "@/lib/utils";
import type { AddTaskFormValues } from "./AddTaskModal";

interface AddTaskTableRowProps {
  totalColumnCount: number;
  customColumns?: CustomColumn[];
  onSubmit: (values: AddTaskFormValues) => Promise<void>;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const fieldClassName =
  "w-full min-w-0 px-2 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function AddTaskTableRow({
  totalColumnCount,
  customColumns = [],
  onSubmit,
  expanded,
  onExpandedChange,
}: AddTaskTableRowProps) {
  const formId = useId();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("בינוני");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setPriority("בינוני");
    setDetails("");
    setError(null);
  };

  const handleCollapse = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onExpandedChange(false);
  };

  const handleExpand = () => {
    onExpandedChange(true);
  };

  useEffect(() => {
    if (expanded) {
      titleInputRef.current?.focus();
    }
  }, [expanded]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ title, priority, details });
      resetForm();
      titleInputRef.current?.focus();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "שגיאה ביצירת המשימה"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <tr className="border-t border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/20">
        <td colSpan={totalColumnCount} className="py-2 px-4">
          <button
            type="button"
            onClick={handleExpand}
            className="flex items-center gap-2 ms-auto text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
            aria-label="הוסף משימה"
          >
            <span>הוסף משימה</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-base leading-none dark:border-indigo-800 dark:bg-indigo-950/50">
              +
            </span>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-indigo-200 bg-indigo-50/40 dark:border-indigo-900 dark:bg-indigo-950/20">
      <td className="py-3 px-3 text-center text-xs text-slate-300 dark:text-slate-600 align-top">
        +
      </td>
      <td className="py-3 px-4 align-top" />
      <td className="py-3 px-4 align-top min-w-0">
        <form id={formId} onSubmit={handleSubmit} className="min-w-0">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={TASK_TITLE_MAX_LENGTH}
            placeholder="כותרת משימה"
            className={fieldClassName}
          />
        </form>
      </td>
      <td className="py-3 px-4 text-center align-top">
        <select
          form={formId}
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          className={fieldClassName}
        >
          {TASK_PRIORITIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 px-4 align-top min-w-0">
        <textarea
          form={formId}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={2}
          placeholder="פירוט"
          className={`${fieldClassName} resize-y min-h-[56px]`}
        />
        {error ? (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </td>
      {customColumns.map((column) => (
        <td key={column.columnId} className="py-3 px-3 align-top" />
      ))}
      <td className="py-3 px-4 text-center align-top">
        <div className="flex flex-col items-center gap-2">
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-60"
          >
            {submitting ? "שומר..." : "הוסף"}
          </button>
          <button
            type="button"
            onClick={handleCollapse}
            disabled={submitting}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 transition disabled:opacity-60"
          >
            ביטול
          </button>
        </div>
      </td>
    </tr>
  );
}

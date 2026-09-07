"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { TaskPriority } from "@/lib/types";
import { TASK_PRIORITIES, TASK_TITLE_MAX_LENGTH } from "@/lib/utils";
import type { AddTaskFormValues } from "./AddTaskModal";

interface AddTaskMobileBarProps {
  onSubmit: (values: AddTaskFormValues) => Promise<void>;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

const fieldClassName =
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function AddTaskMobileBar({
  onSubmit,
  expanded,
  onExpandedChange,
}: AddTaskMobileBarProps) {
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
      <button
        type="button"
        onClick={() => onExpandedChange(true)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-indigo-600 dark:border-slate-600 dark:bg-slate-900/30 dark:text-indigo-400"
      >
        <span>הוסף משימה</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-lg leading-none dark:border-indigo-800 dark:bg-indigo-950/50">
          +
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
      <form id={formId} onSubmit={handleSubmit} className="space-y-3">
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
        <select
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
        <textarea
          name="details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          required={false}
          rows={3}
          placeholder="פירוט (לא חובה)"
          className={`${fieldClassName} resize-y min-h-[88px]`}
        />
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!submitting) {
                resetForm();
                onExpandedChange(false);
              }
            }}
            disabled={submitting}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60"
          >
            {submitting ? "שומר..." : "הוסף"}
          </button>
        </div>
      </form>
    </div>
  );
}

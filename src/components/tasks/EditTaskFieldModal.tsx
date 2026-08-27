"use client";

import { FormEvent, useEffect, useState } from "react";
import { Task } from "@/lib/types";
import { TASK_TITLE_MAX_LENGTH, validateTaskTitle } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

export type TaskEditableField = "title" | "details";

interface EditTaskFieldModalProps {
  open: boolean;
  task: Task | null;
  field: TaskEditableField | null;
  onClose: () => void;
  onSubmit: (taskId: number, field: TaskEditableField, value: string) => Promise<void>;
}

const fieldLabels: Record<TaskEditableField, string> = {
  title: "כותרת",
  details: "פירוט",
};

export default function EditTaskFieldModal({
  open,
  task,
  field,
  onClose,
  onSubmit,
}: EditTaskFieldModalProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && task && field) {
      setValue(field === "title" ? task.title : task.details);
      setError(null);
    }
  }, [open, task, field]);

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!task || !field) {
      return;
    }

    const trimmed = value.trim();
    if (field === "title") {
      const titleError = validateTaskTitle(trimmed);
      if (titleError) {
        setError(titleError);
        return;
      }
    } else if (!trimmed) {
      setError(`${fieldLabels[field]} לא יכול להיות ריק`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(task.taskId, field, trimmed);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "שגיאה בעדכון המשימה"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!task || !field) {
    return null;
  }

  const isDetails = field === "details";

  return (
    <Modal open={open} onClose={handleClose} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            עריכת {fieldLabels[field]}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            משימה #{task.taskId}
          </p>
        </div>

        <label className="block space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {fieldLabels[field]}
            </span>
            {!isDetails ? (
              <span className="text-xs text-slate-400 font-mono">
                {value.length}/{TASK_TITLE_MAX_LENGTH}
              </span>
            ) : null}
          </div>
          {isDetails ? (
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 resize-y min-h-[120px]"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
              maxLength={TASK_TITLE_MAX_LENGTH}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
            />
          )}
        </label>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50 transition disabled:opacity-60"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow disabled:opacity-60"
          >
            {submitting ? "שומר..." : "שמור"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

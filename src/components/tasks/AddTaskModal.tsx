"use client";

import { FormEvent, useEffect, useState } from "react";
import { Task, TaskPriority } from "@/lib/types";
import { TASK_PRIORITIES, TASK_TITLE_MAX_LENGTH } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

export interface AddTaskFormValues {
  title: string;
  priority: TaskPriority;
  details: string;
  parentTaskId?: number;
}

interface AddTaskModalProps {
  open: boolean;
  parentTask?: Task | null;
  onClose: () => void;
  onSubmit: (values: AddTaskFormValues) => Promise<void>;
}

export default function AddTaskModal({
  open,
  parentTask = null,
  onClose,
  onSubmit,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("בינוני");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubtask = parentTask != null;

  const resetForm = () => {
    setTitle("");
    setPriority("בינוני");
    setDetails("");
    setError(null);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        title,
        priority,
        details,
        parentTaskId: parentTask?.taskId,
      });
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "שגיאה ביצירת המשימה"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {isSubtask ? "הוסף תת-משימה" : "הוסף משימה"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSubtask
              ? `תת-משימה עבור #${parentTask.taskId} — ${parentTask.title}`
              : "הזן את פרטי המשימה"}
          </p>
        </div>

        <label className="block space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">כותרת</span>
            <span className="text-xs text-slate-400 font-mono">
              {title.length}/{TASK_TITLE_MAX_LENGTH}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={TASK_TITLE_MAX_LENGTH}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">עדיפות</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700"
          >
            {TASK_PRIORITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">פרטים</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 resize-y min-h-[96px]"
          />
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
            {submitting ? "שומר..." : isSubtask ? "הוסף תת-משימה" : "הוסף משימה"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

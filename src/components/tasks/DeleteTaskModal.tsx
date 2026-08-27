"use client";

import { FormEvent, useState } from "react";
import { Task } from "@/lib/types";
import Modal from "@/components/ui/Modal";

interface DeleteTaskModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export default function DeleteTaskModal({
  open,
  task,
  onClose,
  onSubmit,
}: DeleteTaskModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit();
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "שגיאה במחיקת המשימה"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">מחק משימה</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            פעולה זו לא ניתנת לביטול.
          </p>
        </div>

        <div className="rounded-lg border border-red-100 bg-red-50/60 p-3 dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            #{task.taskId} — {task.title}
          </p>
        </div>

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
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition shadow disabled:opacity-60"
          >
            {submitting ? "מוחק..." : "מחק משימה"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

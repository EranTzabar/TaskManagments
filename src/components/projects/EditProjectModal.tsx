"use client";

import { FormEvent, useEffect, useState } from "react";
import { Project } from "@/lib/types";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

interface EditProjectModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSubmit: (projectId: number, name: string) => Promise<void>;
}

export default function EditProjectModal({
  open,
  project,
  onClose,
  onSubmit,
}: EditProjectModalProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && project) {
      setName(project.name);
      setError(null);
    }
  }, [open, project]);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    setName("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(project.projectId, name);
      setName("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "שגיאה בעדכון שם הלוח"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!project) {
    return null;
  }

  const trimmedName = name.trim();
  const unchanged = trimmedName === project.name;

  return (
    <Modal open={open} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">עריכת שם לוח</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            שנה את שם הלוח &quot;{project.name}&quot;
          </p>
        </div>

        <div>
          <label
            htmlFor="edit-project-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            שם הלוח
          </label>
          <input
            id="edit-project-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={PROJECT_NAME_MAX_LENGTH}
            required
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
            disabled={submitting || !trimmedName || unchanged}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow disabled:opacity-60"
          >
            {submitting ? "שומר..." : "שמור"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

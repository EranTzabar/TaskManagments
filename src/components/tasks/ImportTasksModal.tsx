"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  getTaskImportErrorMessage,
  parseTaskImportJson,
  readTaskImportFile,
} from "@/lib/taskImport";
import Modal from "@/components/ui/Modal";

export interface ImportTasksFormValues {
  tasks: import("@/lib/types").TaskImportItem[];
}

interface ImportTasksModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ImportTasksFormValues) => Promise<void>;
}

export default function ImportTasksModal({
  open,
  onClose,
  onSubmit,
}: ImportTasksModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setJsonText("");
    setShowPaste(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const tasks = await readTaskImportFile(file);
      await onSubmit({ tasks });
      resetForm();
    } catch (submitError) {
      setError(getTaskImportErrorMessage(submitError));
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tasks = parseTaskImportJson(jsonText.trim());

      if (tasks.length === 0) {
        throw new Error("יש לכלול לפחות משימה אחת");
      }

      await onSubmit({ tasks });
      resetForm();
    } catch (submitError) {
      setError(getTaskImportErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-lg">
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">ייבוא משימות</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            בחר קובץ JSON מהמחשב, או הדבק תוכן ידנית.
          </p>
          <a
            href="/docs/import-tasks.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mt-1 inline-block"
          >
            מבנה JSON לדוגמה
          </a>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={handlePickFile}
          disabled={submitting}
          className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-medium transition disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300"
        >
          {submitting ? "מייבא..." : "בחר קובץ JSON"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowPaste((current) => !current)}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {showPaste ? "הסתר הדבקה ידנית" : "או הדבק JSON ידנית"}
          </button>
        </div>

        {showPaste ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                תוכן JSON
              </span>
              <textarea
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                required
                rows={8}
                placeholder='{"tasks": [{"title": "...", "priority": "בינוני", "details": "..."}]}'
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 resize-y min-h-[160px]"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !jsonText.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow disabled:opacity-60"
            >
              {submitting ? "מייבא..." : "ייבא מההדבקה"}
            </button>
          </form>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50 transition disabled:opacity-60"
          >
            ביטול
          </button>
        </div>
      </div>
    </Modal>
  );
}

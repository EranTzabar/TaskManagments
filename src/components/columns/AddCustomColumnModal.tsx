"use client";

import { FormEvent, useEffect, useState } from "react";
import { CustomColumnType } from "@/lib/types";
import { CUSTOM_COLUMN_NAME_MAX_LENGTH } from "@/lib/utils";
import Modal from "@/components/ui/Modal";

const COLUMN_TYPE_OPTIONS: { value: CustomColumnType; label: string }[] = [
  { value: "text", label: "טקסט" },
  { value: "number", label: "מספר" },
  { value: "date", label: "תאריך" },
  { value: "link", label: "קישור" },
];

interface AddCustomColumnModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, type: CustomColumnType) => Promise<void>;
}

export default function AddCustomColumnModal({
  open,
  onClose,
  onSubmit,
}: AddCustomColumnModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomColumnType>("text");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setType("text");
      setError(null);
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) {
      return;
    }
    setName("");
    setType("text");
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(name, type);
      setName("");
      setType("text");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "שגיאה ביצירת העמודה"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">עמודה חדשה</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            הוסף עמודה מותאמת אישית ללוח
          </p>
        </div>

        <div>
          <label
            htmlFor="custom-column-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            שם העמודה
          </label>
          <input
            id="custom-column-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={CUSTOM_COLUMN_NAME_MAX_LENGTH}
            required
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="לדוגמה: אחראי"
          />
        </div>

        <div>
          <label
            htmlFor="custom-column-type"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            סוג העמודה
          </label>
          <select
            id="custom-column-type"
            value={type}
            onChange={(event) => setType(event.target.value as CustomColumnType)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {COLUMN_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            disabled={submitting || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow disabled:opacity-60"
          >
            {submitting ? "יוצר..." : "הוסף עמודה"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

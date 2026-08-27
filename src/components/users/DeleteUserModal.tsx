"use client";

import { FormEvent, useState } from "react";
import { UserListItem } from "@/lib/types";
import Modal from "@/components/ui/Modal";

interface DeleteUserModalProps {
  open: boolean;
  user: UserListItem | null;
  onClose: () => void;
  onSubmit: (userId: string) => Promise<void>;
}

export default function DeleteUserModal({ open, user, onClose, onSubmit }: DeleteUserModalProps) {
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
    if (!user) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(user.id);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "שגיאה במחיקת המשתמש");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">מחק משתמש</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            האם למחוק את המשתמש &quot;{user.username}&quot;? לא ניתן לבטל.
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
            {submitting ? "מוחק..." : "מחק משתמש"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

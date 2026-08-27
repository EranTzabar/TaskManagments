"use client";

import { FormEvent, useEffect, useState } from "react";
import { Project, UserRole } from "@/lib/types";
import {
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import UserBoardPermissions from "./UserBoardPermissions";

export interface CreateUserFormValues {
  username: string;
  password: string;
  role: UserRole;
  allowedProjectIds: number[];
}

interface CreateUserModalProps {
  open: boolean;
  projects: Project[];
  onClose: () => void;
  onSubmit: (values: CreateUserFormValues) => Promise<void>;
}

export default function CreateUserModal({
  open,
  projects,
  onClose,
  onSubmit,
}: CreateUserModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [allowedProjectIds, setAllowedProjectIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setRole("user");
      setAllowedProjectIds([]);
      setError(null);
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ username, password, role, allowedProjectIds });
      setUsername("");
      setPassword("");
      setRole("user");
      setAllowedProjectIds([]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "שגיאה ביצירת המשתמש");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">משתמש חדש</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            צור משתמש חדש עם שם משתמש, סיסמה ותפקיד
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">שם משתמש</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={USERNAME_MIN_LENGTH}
            maxLength={USERNAME_MAX_LENGTH}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">סיסמה</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">תפקיד</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="user">צופה</option>
            <option value="admin">מנהל</option>
          </select>
        </label>

        <UserBoardPermissions
          projects={projects}
          selectedIds={allowedProjectIds}
          onChange={setAllowedProjectIds}
          disabled={role === "admin"}
        />

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
            {submitting ? "יוצר..." : "צור משתמש"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

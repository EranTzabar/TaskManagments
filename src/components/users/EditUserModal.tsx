"use client";

import { FormEvent, useEffect, useState } from "react";
import { Project, UserListItem, UserRole } from "@/lib/types";
import { PASSWORD_MIN_LENGTH } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import UserBoardPermissions from "./UserBoardPermissions";

export interface EditUserFormValues {
  role: UserRole;
  password: string;
  allowedProjectIds: number[];
}

interface EditUserModalProps {
  open: boolean;
  user: UserListItem | null;
  projects: Project[];
  onClose: () => void;
  onSubmit: (userId: string, values: EditUserFormValues) => Promise<void>;
}

export default function EditUserModal({
  open,
  user,
  projects,
  onClose,
  onSubmit,
}: EditUserModalProps) {
  const [role, setRole] = useState<UserRole>("user");
  const [password, setPassword] = useState("");
  const [allowedProjectIds, setAllowedProjectIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setRole(user.role);
      setPassword("");
      setAllowedProjectIds(user.allowedProjectIds ?? projects.map((project) => project.projectId));
      setError(null);
    }
  }, [open, projects, user]);

  const handleClose = () => {
    if (submitting) {
      return;
    }

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
      await onSubmit(user.id, { role, password, allowedProjectIds });
      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "שגיאה בעדכון המשתמש");
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
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">עריכת משתמש</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.username}</p>
        </div>

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

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            סיסמה חדשה (אופציונלי)
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={password ? PASSWORD_MIN_LENGTH : undefined}
            placeholder="השאר ריק כדי לא לשנות"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
            {submitting ? "שומר..." : "שמור"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

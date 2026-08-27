"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  CreateTaskError,
  createUserApi,
  deleteUserApi,
  updateUserApi,
} from "@/lib/api-client";
import { SessionUser, Project, UserListItem } from "@/lib/types";
import Header from "@/components/layout/Header";
import { useToast } from "@/components/providers/Toast";
import CreateUserModal, { CreateUserFormValues } from "./CreateUserModal";
import DeleteUserModal from "./DeleteUserModal";
import EditUserModal, { EditUserFormValues } from "./EditUserModal";

interface UsersAdminPageProps {
  user: SessionUser;
  currentUserId: string;
  initialUsers: UserListItem[];
  projects: Project[];
}

function formatBoardAccess(item: UserListItem, projects: Project[]): string {
  if (item.role === "admin" || item.allowedProjectIds === null) {
    return "כל הלוחות";
  }

  if (item.allowedProjectIds.length === 0) {
    return "ללא גישה";
  }

  const names = projects
    .filter((project) => item.allowedProjectIds?.includes(project.projectId))
    .map((project) => project.name);

  if (names.length === 0) {
    return `${item.allowedProjectIds.length} לוחות`;
  }

  if (names.length <= 2) {
    return names.join(", ");
  }

  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleBadgeClass(role: UserListItem["role"]): string {
  return role === "admin"
    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
}

export default function UsersAdminPage({
  user,
  currentUserId,
  initialUsers,
  projects,
}: UsersAdminPageProps) {
  const { showToast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);

  const handleCreateUser = useCallback(
    async (values: CreateUserFormValues) => {
      try {
        const { user: created } = await createUserApi(values);
        setUsers((current) =>
          [...current, created].sort((a, b) => a.username.localeCompare(b.username))
        );
        setCreateOpen(false);
        showToast(`המשתמש "${created.username}" נוצר`, "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }
        throw new Error("שגיאה ביצירת המשתמש");
      }
    },
    [showToast]
  );

  const handleEditUser = useCallback(
    async (userId: string, values: EditUserFormValues) => {
      try {
        const payload: {
          role?: UserListItem["role"];
          password?: string;
          allowedProjectIds?: number[];
        } = {};
        const existing = users.find((item) => item.id === userId);

        if (!existing) {
          throw new Error("המשתמש לא נמצא");
        }

        if (values.role !== existing.role) {
          payload.role = values.role;
        }

        if (values.password.trim()) {
          payload.password = values.password;
        }

        const nextRole = values.role;
        if (nextRole !== "admin") {
          const existingIds =
            existing.allowedProjectIds ?? projects.map((project) => project.projectId);
          const sortedExisting = [...existingIds].sort((a, b) => a - b);
          const sortedNext = [...values.allowedProjectIds].sort((a, b) => a - b);

          if (!arraysEqual(sortedExisting, sortedNext)) {
            payload.allowedProjectIds = sortedNext;
          }
        }

        if (!payload.role && !payload.password && payload.allowedProjectIds === undefined) {
          throw new Error("לא בוצעו שינויים");
        }

        const { user: updated } = await updateUserApi(userId, payload);
        setUsers((current) =>
          current
            .map((item) => (item.id === userId ? updated : item))
            .sort((a, b) => a.username.localeCompare(b.username))
        );
        setEditUser(null);
        showToast(`המשתמש "${updated.username}" עודכן`, "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }
        throw error instanceof Error ? error : new Error("שגיאה בעדכון המשתמש");
      }
    },
    [showToast, users, projects]
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        await deleteUserApi(userId);
        setUsers((current) => current.filter((item) => item.id !== userId));
        setDeleteUser(null);
        showToast("המשתמש נמחק", "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }
        throw new Error("שגיאה במחיקת המשתמש");
      }
    },
    [showToast]
  );

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
      <Header user={user} />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ← חזרה ללוח
            </Link>
            <h2 className="text-2xl font-bold mt-2">ניהול משתמשים</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              צור, ערוך ומחק משתמשים במערכת
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow self-start sm:self-auto"
          >
            + משתמש חדש
          </button>
        </div>

        <div className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                  <th className="py-3 px-4">שם משתמש</th>
                  <th className="py-3 px-4 text-center">תפקיד</th>
                  <th className="py-3 px-4">לוחות</th>
                  <th className="py-3 px-4">נוצר</th>
                  <th className="py-3 px-4">עודכן</th>
                  <th className="py-3 px-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((item) => {
                  const isSelf = item.id === currentUserId;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition"
                    >
                      <td className="py-3 px-4 font-medium">
                        {item.username}
                        {isSelf ? (
                          <span className="ms-2 text-[10px] text-slate-400">(את/ה)</span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${roleBadgeClass(item.role)}`}
                        >
                          {item.role === "admin" ? "מנהל" : "צופה"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatBoardAccess(item, projects)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditUser(item)}
                            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition dark:text-indigo-300 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:border-indigo-800"
                          >
                            ערוך
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteUser(item)}
                            disabled={isSelf}
                            title={isSelf ? "לא ניתן למחוק את המשתמש המחובר" : undefined}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed dark:text-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800"
                          >
                            מחק
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">אין משתמשים להצגה</div>
          ) : null}
        </div>
      </main>

      <CreateUserModal
        open={createOpen}
        projects={projects}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        open={editUser !== null}
        user={editUser}
        projects={projects}
        onClose={() => setEditUser(null)}
        onSubmit={handleEditUser}
      />

      <DeleteUserModal
        open={deleteUser !== null}
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
        onSubmit={handleDeleteUser}
      />
    </div>
  );
}

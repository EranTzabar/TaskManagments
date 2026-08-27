"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setActiveProjectIdCookie } from "@/lib/activeProject";
import { createProjectApi } from "@/lib/api-client";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import Header from "@/components/layout/Header";

interface EmptyProjectsPageProps {
  user: SessionUser;
}

export default function EmptyProjectsPage({ user }: EmptyProjectsPageProps) {
  const router = useRouter();
  const isAdmin = user.role === "admin";
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const { project } = await createProjectApi(name);
      setActiveProjectIdCookie(project.projectId);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "שגיאה ביצירת הלוח"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
      <Header user={user} />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm p-6 text-center">
          <div className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white">אין לוחות עדיין</h2>

          {isAdmin ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                צור לוח חדש כדי להתחיל לנהל משימות
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-right">
                <div>
                  <label
                    htmlFor="empty-project-name"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    שם הלוח
                  </label>
                  <input
                    id="empty-project-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={PROJECT_NAME_MAX_LENGTH}
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="לדוגמה: פרויקט ראשון"
                  />
                </div>

                {error ? (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow disabled:opacity-60"
                >
                  {submitting ? "יוצר..." : "צור לוח"}
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              עדיין לא נוצרו לוחות. פנה למנהל המערכת.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

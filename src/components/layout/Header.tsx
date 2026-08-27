"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionUser } from "@/lib/types";
import { logoutApi } from "@/lib/api-client";
import OnlineUsers from "@/components/presence/OnlineUsers";
import { useTheme } from "@/components/providers/ThemeProvider";

interface HeaderProps {
  user: SessionUser;
}

export default function Header({ user }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      router.refresh();
    }
  };

  const roleLabel = user.role === "admin" ? "מנהל" : "צופה";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-visible">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl dark:bg-emerald-950/50 dark:text-emerald-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Tasks Tracker</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                לוח מעקב אינטראקטיבי לשיפורים ותיקונים
              </p>
            </div>
          </div>
          <OnlineUsers />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user.role === "admin" ? (
            <Link
              href="/users"
              className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition dark:text-indigo-300 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:border-indigo-800"
            >
              ניהול משתמשים
            </Link>
          ) : null}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {user.username}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                user.role === "admin"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {roleLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-700/50 transition"
          >
            התנתק
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:bg-slate-700/50 shrink-0"
            title="שינוי ערכת נושא"
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

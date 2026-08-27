"use client";

import { Task } from "@/lib/types";
import { getCompletionCheer, isTaskDone } from "@/lib/utils";

interface MetricsDashboardProps {
  tasks: Task[];
}

export default function MetricsDashboard({ tasks }: MetricsDashboardProps) {
  const total = tasks.length;
  const completed = tasks.filter((task) => isTaskDone(task.status)).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const isOpen = (task: Task) => !isTaskDone(task.status);

  const criticalRemaining = tasks.filter(
    (task) => task.priority === "קריטי" && isOpen(task)
  ).length;
  const highRemaining = tasks.filter(
    (task) => task.priority === "גבוה" && isOpen(task)
  ).length;
  const mediumRemaining = tasks.filter(
    (task) => task.priority === "בינוני" && isOpen(task)
  ).length;

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col justify-between md:col-span-2 relative overflow-hidden">
        <div className="z-10">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            קצב התקדמות כללי
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">
              {completed}
            </span>
            <span className="text-slate-400 text-sm">מתוך {total} משימות</span>
          </div>
        </div>
        <div className="mt-4 z-10">
          <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-500">
            <span>{percent}% הושלמו</span>
            <span className="text-emerald-500 font-semibold">
              {getCompletionCheer(percent)}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 dark:bg-slate-700">
            <div
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 text-slate-100 dark:text-slate-700/30 pointer-events-none opacity-50">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:col-span-2">
        <div className="bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              קריטי פתוח
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {criticalRemaining}
            </span>
            <span className="text-xs text-slate-400 block mt-1">משימות דחופות</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              גבוה פתוח
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {highRemaining}
            </span>
            <span className="text-xs text-slate-400 block mt-1">בעדיפות גבוהה</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              בינוני פתוח
            </span>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {mediumRemaining}
            </span>
            <span className="text-xs text-slate-400 block mt-1">משימות רקע</span>
          </div>
        </div>
      </div>
    </section>
  );
}

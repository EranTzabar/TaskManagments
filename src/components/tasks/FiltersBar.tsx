"use client";

import { FilterStatus, TaskPriority } from "@/lib/types";
import { getPriorityEmoji, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/utils";

interface FiltersBarProps {
  totalCount: number;
  filteredCount: number;
  searchQuery: string;
  filterPriority: TaskPriority | "all";
  filterStatus: FilterStatus;
  onSearchChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority | "all") => void;
  onStatusChange: (value: FilterStatus) => void;
  onResetFilters: () => void;
}

export default function FiltersBar({
  totalCount,
  filteredCount,
  searchQuery,
  filterPriority,
  filterStatus,
  onSearchChange,
  onPriorityChange,
  onStatusChange,
  onResetFilters,
}: FiltersBarProps) {
  const statusButtonClass = (status: FilterStatus) =>
    filterStatus === status
      ? "flex-1 text-center py-1 px-2 text-[11px] font-medium rounded-md transition-all duration-200 bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-white"
      : "flex-1 text-center py-1 px-2 text-[11px] font-medium rounded-md transition-all duration-200 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200";

  return (
    <section className="bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5 relative">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="חפש משימה, פירוט או מזהה..."
            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:bg-slate-900 dark:border-slate-700 dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="md:col-span-3 flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400 shrink-0">עדיפות:</label>
          <select
            value={filterPriority}
            onChange={(event) =>
              onPriorityChange(event.target.value as TaskPriority | "all")
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 transition"
          >
            <option value="all">כל העדיפויות</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityEmoji(priority)}
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 flex items-center gap-1.5 justify-end">
          <span className="text-xs font-medium text-slate-400 shrink-0 ml-1">מצב:</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full justify-between gap-0.5">
            <button
              type="button"
              onClick={() => onStatusChange("all")}
              className={statusButtonClass("all")}
            >
              הכל
            </button>
            {TASK_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={statusButtonClass(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          נמצאו{" "}
          <span className="font-bold text-slate-700 dark:text-white">{filteredCount}</span>{" "}
          מתוך <span className="font-bold">{totalCount}</span> משימות
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-indigo-600 hover:underline dark:text-indigo-400 font-medium transition"
        >
          אפס סינונים
        </button>
      </div>
    </section>
  );
}

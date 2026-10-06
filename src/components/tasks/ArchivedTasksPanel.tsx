"use client";

import { useMemo, useState } from "react";
import { Task } from "@/lib/types";
import { getStatusBadgeClass, getSubtasks, getTopLevelTasks } from "@/lib/utils";

interface ArchivedTasksPanelProps {
  tasks: Task[];
  isAdmin: boolean;
  restoringTaskId: number | null;
  onRestore: (taskId: number) => void;
  onDeleteSelected: (tasks: Task[]) => void;
}

export default function ArchivedTasksPanel({
  tasks,
  isAdmin,
  restoringTaskId,
  onRestore,
  onDeleteSelected,
}: ArchivedTasksPanelProps) {
  const parents = getTopLevelTasks(tasks);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  const selectedTasks = useMemo(
    () => parents.filter((task) => selectedIds.has(task.taskId)),
    [parents, selectedIds]
  );

  const allSelected = parents.length > 0 && selectedTasks.length === parents.length;

  const toggleTask = (taskId: number, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  const toggleAll = (selected: boolean) => {
    setSelectedIds(selected ? new Set(parents.map((task) => task.taskId)) : new Set());
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">משימות בארכיון</h3>
        {isAdmin && parents.length > 0 ? (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = selectedTasks.length > 0 && !allSelected;
                  }
                }}
                onChange={(event) => toggleAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
              />
              <span>בחר הכל</span>
            </label>
            {selectedTasks.length > 0 ? (
              <button
                type="button"
                onClick={() => onDeleteSelected(selectedTasks)}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition dark:text-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800"
              >
                מחק
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {parents.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">אין משימות בארכיון</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
          {parents.map((task) => {
            const subtaskCount = getSubtasks(tasks, task.taskId).length;
            const restoring = restoringTaskId === task.taskId;
            const checked = selectedIds.has(task.taskId);

            return (
              <li
                key={task.taskId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {isAdmin ? (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleTask(task.taskId, event.target.checked)}
                      aria-label={`בחר משימה ${task.taskId}`}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      #{task.taskId} {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClass(task.status)}`}
                      >
                        {task.status}
                      </span>
                      {subtaskCount > 0 ? (
                        <span className="text-xs text-slate-400">
                          {subtaskCount} תת-משימות
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onRestore(task.taskId)}
                    disabled={restoringTaskId != null}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition disabled:opacity-60 dark:text-indigo-300 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:border-indigo-800"
                  >
                    {restoring ? "משחזר..." : "שחזר"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

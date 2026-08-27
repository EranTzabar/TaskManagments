"use client";

import { Project } from "@/lib/types";

interface UserBoardPermissionsProps {
  projects: Project[];
  selectedIds: number[];
  onChange: (projectIds: number[]) => void;
  disabled?: boolean;
}

export default function UserBoardPermissions({
  projects,
  selectedIds,
  onChange,
  disabled = false,
}: UserBoardPermissionsProps) {
  if (disabled) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        למנהלים יש גישה לכל הלוחות
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-400 dark:border-slate-700">
        אין לוחות במערכת
      </div>
    );
  }

  const toggleProject = (projectId: number) => {
    if (selectedIds.includes(projectId)) {
      onChange(selectedIds.filter((id) => id !== projectId));
      return;
    }

    onChange([...selectedIds, projectId].sort((a, b) => a - b));
  };

  const allSelected = projects.every((project) => selectedIds.includes(project.projectId));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">הרשאות לוחות</span>
        <button
          type="button"
          onClick={() =>
            onChange(allSelected ? [] : projects.map((project) => project.projectId))
          }
          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          {allSelected ? "נקה הכל" : "בחר הכל"}
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
        {projects.map((project) => {
          const checked = selectedIds.includes(project.projectId);

          return (
            <label
              key={project.projectId}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleProject(project.projectId)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">{project.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

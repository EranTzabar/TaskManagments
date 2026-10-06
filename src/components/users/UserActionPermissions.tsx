"use client";

import { UserTaskPermissions } from "@/lib/types";

interface UserActionPermissionsProps {
  value: UserTaskPermissions;
  onChange: (value: UserTaskPermissions) => void;
  disabled?: boolean;
}

const options: Array<{ key: keyof UserTaskPermissions; label: string }> = [
  { key: "canCreateTasks", label: "יצירת משימות" },
  { key: "canDeleteTasks", label: "מחיקת משימות" },
  { key: "canArchiveTasks", label: "העברה לארכיון" },
];

export default function UserActionPermissions({
  value,
  onChange,
  disabled = false,
}: UserActionPermissionsProps) {
  if (disabled) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        למנהלים יש הרשאה ליצור, למחוק ולהעביר לארכיון
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">הרשאות פעולה</span>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
        {options.map((option) => (
          <label
            key={option.key}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <input
              type="checkbox"
              checked={value[option.key]}
              onChange={(event) =>
                onChange({ ...value, [option.key]: event.target.checked })
              }
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

"use client";

import { TaskStatus } from "@/lib/types";
import { getStatusBadgeClass, TASK_STATUSES } from "@/lib/utils";

interface StatusSelectProps {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}

export default function StatusSelect({
  status,
  onChange,
  className = "",
  disabled = false,
  title,
}: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={(event) => onChange(event.target.value as TaskStatus)}
      aria-label="סטטוס"
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded-full text-[11px] font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[108px] ${getStatusBadgeClass(
        status
      )} ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {TASK_STATUSES.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

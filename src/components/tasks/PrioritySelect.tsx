"use client";

import { TaskPriority } from "@/lib/types";
import { getPriorityBadgeClass, TASK_PRIORITIES } from "@/lib/utils";

interface PrioritySelectProps {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  className?: string;
  disabled?: boolean;
}

export default function PrioritySelect({
  priority,
  onChange,
  className = "",
  disabled = false,
}: PrioritySelectProps) {
  return (
    <select
      value={priority}
      onChange={(event) => onChange(event.target.value as TaskPriority)}
      aria-label="עדיפות"
      disabled={disabled}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getPriorityBadgeClass(
        priority
      )} ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {TASK_PRIORITIES.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

"use client";

import { Task } from "@/lib/types";
import { getSubtaskCompletionStats } from "@/lib/utils";

interface SubtaskStatusSummaryProps {
  subtasks: Task[];
  className?: string;
}

export default function SubtaskStatusSummary({
  subtasks,
  className = "",
}: SubtaskStatusSummaryProps) {
  if (subtasks.length === 0) {
    return null;
  }

  const { completed, total } = getSubtaskCompletionStats(subtasks);

  return (
    <span
      className={`text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap ${className}`}
    >
      {completed} מתוך {total} הושלמו
    </span>
  );
}

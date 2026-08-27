import { Task, TaskPriority, TaskStatus } from "./types";

export const TASK_STATUSES: TaskStatus[] = ["ממתין להתחלה", "בטיפול", "הושלם"];

export const TASK_PRIORITIES: TaskPriority[] = ["קריטי", "גבוה", "בינוני", "נמוך"];

export const TASK_TITLE_MAX_LENGTH = 70;

export const PROJECT_NAME_MAX_LENGTH = 50;

export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 6;

export const CUSTOM_COLUMN_NAME_MAX_LENGTH = 50;

export const CUSTOM_COLUMN_TYPES = ["text", "number", "date", "link"] as const;

export const BOARD_NOTE_CONTENT_MAX_LENGTH = 2000;
export const BOARD_NOTE_COLORS = ["yellow", "green", "blue", "pink", "purple"] as const;
export const BOARD_NOTE_WIDTH = 240;
export const BOARD_NOTE_DEFAULT_HEIGHT = 120;
export const BOARD_NOTE_MIN_HEIGHT = 100;
export const BOARD_NOTE_DEFAULT_OFFSET = 28;
export const BOARD_NOTE_MIN_WIDTH = 160;
export const BOARD_NOTE_MAX_WIDTH = 520;
export const BOARD_NOTE_MAX_HEIGHT = 520;

export function validateTaskTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return "כותרת נדרשת";
  }
  if (trimmed.length > TASK_TITLE_MAX_LENGTH) {
    return `כותרת יכולה להכיל עד ${TASK_TITLE_MAX_LENGTH} תווים`;
  }
  return null;
}

export function isTaskDone(status: TaskStatus): boolean {
  return status === "הושלם";
}

export function compareTasksByOrder(a: Task, b: Task): number {
  const orderA = a.sortOrder ?? a.taskId;
  const orderB = b.sortOrder ?? b.taskId;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return a.taskId - b.taskId;
}

export function getStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "ממתין להתחלה":
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
    case "בטיפול":
      return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    case "הושלם":
      return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

export function getPriorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case "קריטי":
      return "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50";
    case "גבוה":
      return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    case "בינוני":
      return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
    case "נמוך":
      return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-600";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
}

export function getPriorityEmoji(priority: TaskPriority): string {
  switch (priority) {
    case "קריטי":
      return "🚨 ";
    case "גבוה":
      return "⚡ ";
    case "בינוני":
      return "📋 ";
    case "נמוך":
      return "⬇️ ";
    default:
      return "";
  }
}

export function hasNotes(notes: string): boolean {
  return notes.trim().length > 0;
}

export function getCompletionCheer(percent: number): string {
  if (percent === 100) return "הכל מוכן! מדהים 🎉";
  if (percent > 80) return "ממש לקראת סיום! 🚀";
  if (percent > 50) return "חצי דרך מאחורינו! 👍";
  if (percent > 20) return "מתקדמים יפה! 🌟";
  if (percent > 0) return "התחלה מצוינת! 💪";
  return "בוא נתחיל! 📋";
}

export function getTopLevelTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.parentTaskId == null)
    .sort(compareTasksByOrder);
}

export function getSubtasks(tasks: Task[], parentTaskId: number): Task[] {
  return tasks
    .filter((task) => task.parentTaskId != null && Number(task.parentTaskId) === parentTaskId)
    .sort(compareTasksByOrder);
}

export function taskHasSubtasks(tasks: Task[], taskId: number): boolean {
  return tasks.some(
    (task) => task.parentTaskId != null && Number(task.parentTaskId) === taskId
  );
}

export function getSubtaskCompletionStats(subtasks: Task[]): {
  completed: number;
  total: number;
} {
  return {
    completed: subtasks.filter((subtask) => isTaskDone(subtask.status)).length,
    total: subtasks.length,
  };
}

function taskMatchesFilters(
  task: Task,
  filterStatus: "all" | TaskStatus,
  filterPriority: TaskPriority | "all",
  query: string
): boolean {
  const matchesStatus = filterStatus === "all" || task.status === filterStatus;
  const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
  const matchesSearch =
    task.title.toLowerCase().includes(query) ||
    task.details.toLowerCase().includes(query) ||
    String(task.taskId).includes(query);

  return matchesStatus && matchesPriority && matchesSearch;
}

export function filterTopLevelTasks(
  tasks: Task[],
  filterStatus: "all" | TaskStatus,
  filterPriority: TaskPriority | "all",
  searchQuery: string
): Task[] {
  const query = searchQuery.toLowerCase();

  return getTopLevelTasks(tasks).filter((task) => {
    if (taskMatchesFilters(task, filterStatus, filterPriority, query)) {
      return true;
    }

    return getSubtasks(tasks, task.taskId).some((subtask) =>
      taskMatchesFilters(subtask, filterStatus, filterPriority, query)
    );
  });
}

export function getVisibleSubtasks(
  tasks: Task[],
  parentTaskId: number,
  filterStatus: "all" | TaskStatus,
  filterPriority: TaskPriority | "all",
  searchQuery: string
): Task[] {
  const query = searchQuery.toLowerCase();

  return getSubtasks(tasks, parentTaskId).filter((subtask) =>
    taskMatchesFilters(subtask, filterStatus, filterPriority, query)
  );
}

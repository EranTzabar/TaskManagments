import { TaskImportItem } from "./types";

export function parseTaskImportJson(raw: string): TaskImportItem[] {
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as TaskImportItem[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "tasks" in parsed &&
    Array.isArray((parsed as { tasks: unknown }).tasks)
  ) {
    return (parsed as { tasks: TaskImportItem[] }).tasks;
  }

  throw new Error('JSON חייב להכיל מערך "tasks" או מערך משימות ישיר');
}

export async function readTaskImportFile(file: File): Promise<TaskImportItem[]> {
  const text = await file.text();
  const tasks = parseTaskImportJson(text.trim());

  if (tasks.length === 0) {
    throw new Error("יש לכלול לפחות משימה אחת");
  }

  return tasks;
}

export function getTaskImportErrorMessage(error: unknown): string {
  if (error instanceof SyntaxError) {
    return "JSON לא תקין";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "שגיאה בייבוא המשימות";
}

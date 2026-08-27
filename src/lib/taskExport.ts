import { Task, TaskImportItem, TaskImportPayload } from "./types";
import { compareTasksByOrder, getTopLevelTasks } from "./utils";

function taskToImportItem(task: Task): TaskImportItem {
  return {
    title: task.title,
    priority: task.priority,
    details: task.details,
    status: task.status,
    notes: task.notes,
  };
}

function groupSubtasksByParent(tasks: Task[]): Map<number, Task[]> {
  const subtasksByParent = new Map<number, Task[]>();

  for (const task of tasks) {
    if (task.parentTaskId == null) {
      continue;
    }

    const parentId = Number(task.parentTaskId);
    if (Number.isNaN(parentId)) {
      continue;
    }

    const siblings = subtasksByParent.get(parentId) ?? [];
    siblings.push(task);
    subtasksByParent.set(parentId, siblings);
  }

  for (const [parentId, subtasks] of Array.from(subtasksByParent.entries())) {
    subtasksByParent.set(
      parentId,
      [...subtasks].sort(compareTasksByOrder)
    );
  }

  return subtasksByParent;
}

export function buildTaskImportPayload(tasks: Task[]): TaskImportPayload {
  const subtasksByParent = groupSubtasksByParent(tasks);

  return {
    tasks: getTopLevelTasks(tasks).map((parent) => {
      const subtasks = subtasksByParent.get(parent.taskId) ?? [];
      const item = taskToImportItem(parent);

      if (subtasks.length > 0) {
        item.subtasks = subtasks.map((subtask) => taskToImportItem(subtask));
      }

      return item;
    }),
  };
}

export function countExportTasks(payload: TaskImportPayload): {
  parents: number;
  subtasks: number;
  total: number;
} {
  const parents = payload.tasks.length;
  const subtasks = payload.tasks.reduce(
    (count, task) => count + (task.subtasks?.length ?? 0),
    0
  );

  return {
    parents,
    subtasks,
    total: parents + subtasks,
  };
}

export function serializeTaskImportPayload(payload: TaskImportPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function downloadTaskImportPayload(payload: TaskImportPayload, filename?: string): void {
  const json = serializeTaskImportPayload(payload);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ?? `tasks-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTasksToJsonFile(
  tasks: Task[],
  filename?: string
): { parents: number; subtasks: number; total: number } {
  const payload = buildTaskImportPayload(tasks);
  downloadTaskImportPayload(payload, filename);
  return countExportTasks(payload);
}

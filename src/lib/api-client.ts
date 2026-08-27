import {
  PresenceSyncResponse,
  Project,
  CustomColumn,
  CustomColumnCreatePayload,
  CustomColumnReorderPayload,
  BoardNote,
  BoardNoteCreatePayload,
  BoardNoteUpdatePayload,
  SessionUser,
  Task,
  UserCreatePayload,
  UserListItem,
  UserUpdatePayload,
  TaskCreatePayload,
  TaskImportPayload,
  TaskReorderPayload,
  TaskUpdatePayload,
} from "./types";

const fetchOptions: RequestInit = {
  credentials: "include",
};

function withProjectId(path: string, projectId: number): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}projectId=${projectId}`;
}

export class CreateTaskError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function loginApi(
  username: string,
  password: string
): Promise<{ user: SessionUser }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    user?: SessionUser;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "שגיאה בהתחברות");
  }

  if (!data.user) {
    throw new Error("שגיאה בהתחברות");
  }

  return { user: data.user };
}

export async function logoutApi(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    ...fetchOptions,
  });
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/me", { ...fetchOptions, cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { user?: SessionUser };
  return data.user ?? null;
}

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects", { cache: "no-store", ...fetchOptions });
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  const data = (await response.json()) as { projects: Project[] };
  return data.projects;
}

export async function createProjectApi(name: string): Promise<{ project: Project }> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    project?: Project;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to create project", response.status);
  }

  if (!data.project) {
    throw new CreateTaskError("Failed to create project", 500);
  }

  return { project: data.project };
}

export async function deleteProjectApi(projectId: number): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to delete project", response.status);
  }
}

export async function updateProjectApi(
  projectId: number,
  name: string
): Promise<{ project: Project }> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    project?: Project;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to update project", response.status);
  }

  if (!data.project) {
    throw new CreateTaskError("Failed to update project", 500);
  }

  return { project: data.project };
}

export async function fetchCustomColumns(projectId: number): Promise<CustomColumn[]> {
  const response = await fetch(`/api/projects/${projectId}/columns`, {
    cache: "no-store",
    ...fetchOptions,
  });
  if (!response.ok) {
    throw new Error("Failed to fetch columns");
  }
  const data = (await response.json()) as { columns: CustomColumn[] };
  return data.columns;
}

export async function createCustomColumnApi(
  projectId: number,
  payload: CustomColumnCreatePayload
): Promise<{ column: CustomColumn }> {
  const response = await fetch(`/api/projects/${projectId}/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    column?: CustomColumn;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to create column", response.status);
  }

  if (!data.column) {
    throw new CreateTaskError("Failed to create column", 500);
  }

  return { column: data.column };
}

export async function deleteCustomColumnApi(
  projectId: number,
  columnId: number
): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/columns/${columnId}`, {
    method: "DELETE",
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to delete column", response.status);
  }
}

export async function reorderCustomColumnsApi(
  projectId: number,
  payload: CustomColumnReorderPayload
): Promise<CustomColumn[]> {
  const response = await fetch(`/api/projects/${projectId}/columns/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    columns?: CustomColumn[];
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to reorder columns", response.status);
  }

  if (!data.columns) {
    throw new CreateTaskError("Failed to reorder columns", 500);
  }

  return data.columns;
}

export async function fetchBoardNotes(projectId: number): Promise<BoardNote[]> {
  const response = await fetch(`/api/projects/${projectId}/notes`, {
    cache: "no-store",
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }

  const data = (await response.json()) as { notes: BoardNote[] };
  return data.notes;
}

export async function createBoardNoteApi(
  projectId: number,
  payload: BoardNoteCreatePayload = {}
): Promise<{ note: BoardNote }> {
  const response = await fetch(`/api/projects/${projectId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    note?: BoardNote;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to create note", response.status);
  }

  if (!data.note) {
    throw new CreateTaskError("Failed to create note", 500);
  }

  return { note: data.note };
}

export async function updateBoardNoteApi(
  projectId: number,
  noteId: number,
  payload: BoardNoteUpdatePayload
): Promise<{ note: BoardNote }> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    note?: BoardNote;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to update note", response.status);
  }

  if (!data.note) {
    throw new CreateTaskError("Failed to update note", 500);
  }

  return { note: data.note };
}

export async function deleteBoardNoteApi(projectId: number, noteId: number): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
    method: "DELETE",
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to delete note", response.status);
  }
}

export async function fetchTasks(projectId: number): Promise<Task[]> {
  const response = await fetch(withProjectId("/api/tasks", projectId), {
    cache: "no-store",
    ...fetchOptions,
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  const data = (await response.json()) as { tasks: Task[] };
  return data.tasks;
}

export async function patchTask(
  projectId: number,
  taskId: number,
  payload: TaskUpdatePayload
): Promise<{ task: Task; parentTask?: Task }> {
  const response = await fetch(withProjectId(`/api/tasks/${taskId}`, projectId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    task?: Task;
    parentTask?: Task;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update task");
  }

  if (!data.task) {
    throw new Error("Failed to update task");
  }

  return { task: data.task, parentTask: data.parentTask };
}

export async function deleteTaskApi(
  projectId: number,
  taskId: number
): Promise<{ deletedTaskIds: number[]; parentTask?: Task }> {
  const response = await fetch(withProjectId(`/api/tasks/${taskId}`, projectId), {
    method: "DELETE",
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    taskId?: number;
    deletedTaskIds?: number[];
    parentTask?: Task;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to delete task", response.status);
  }

  return {
    deletedTaskIds: data.deletedTaskIds ?? [data.taskId ?? taskId],
    parentTask: data.parentTask,
  };
}

export async function deleteAllTasksApi(projectId: number): Promise<number> {
  const response = await fetch(withProjectId("/api/tasks/delete-all", projectId), {
    method: "POST",
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    deletedCount?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to delete all tasks", response.status);
  }

  return data.deletedCount ?? 0;
}

export async function createTaskApi(
  projectId: number,
  payload: TaskCreatePayload
): Promise<{ task: Task; parentTask?: Task }> {
  const response = await fetch(withProjectId("/api/tasks", projectId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    task?: Task;
    parentTask?: Task;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to create task", response.status);
  }

  if (!data.task) {
    throw new CreateTaskError("Failed to create task", 500);
  }

  return { task: data.task, parentTask: data.parentTask };
}

export async function importTasksApi(
  projectId: number,
  payload: TaskImportPayload
): Promise<{ tasks: Task[]; importedCount: number }> {
  const response = await fetch(withProjectId("/api/tasks/import", projectId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    tasks?: Task[];
    importedCount?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to import tasks", response.status);
  }

  if (!data.tasks) {
    throw new CreateTaskError("Failed to import tasks", 500);
  }

  return {
    tasks: data.tasks,
    importedCount: data.importedCount ?? data.tasks.length,
  };
}

export async function reorderTasksApi(
  projectId: number,
  payload: TaskReorderPayload
): Promise<Task[]> {
  const response = await fetch(withProjectId("/api/tasks/reorder", projectId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    tasks?: Task[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to reorder tasks");
  }

  if (!data.tasks) {
    throw new Error("Failed to reorder tasks");
  }

  return data.tasks;
}

export async function resetTasksApi(projectId: number): Promise<Task[]> {
  const response = await fetch(withProjectId("/api/tasks/reset", projectId), {
    method: "POST",
    ...fetchOptions,
  });
  if (!response.ok) {
    throw new Error("Failed to reset tasks");
  }
  const data = (await response.json()) as { tasks: Task[] };
  return data.tasks;
}

export async function syncPresence(
  sessionId?: string | null
): Promise<PresenceSyncResponse> {
  const response = await fetch("/api/sessions/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: sessionId ?? null }),
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error("Failed to sync presence");
  }

  return (await response.json()) as PresenceSyncResponse;
}

export async function fetchUsers(): Promise<UserListItem[]> {
  const response = await fetch("/api/users", {
    cache: "no-store",
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = (await response.json()) as { users: UserListItem[] };
  return data.users;
}

export async function createUserApi(
  payload: UserCreatePayload
): Promise<{ user: UserListItem }> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    user?: UserListItem;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to create user", response.status);
  }

  if (!data.user) {
    throw new CreateTaskError("Failed to create user", 500);
  }

  return { user: data.user };
}

export async function updateUserApi(
  userId: string,
  payload: UserUpdatePayload
): Promise<{ user: UserListItem }> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as {
    user?: UserListItem;
    error?: string;
  };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to update user", response.status);
  }

  if (!data.user) {
    throw new CreateTaskError("Failed to update user", 500);
  }

  return { user: data.user };
}

export async function deleteUserApi(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
    ...fetchOptions,
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new CreateTaskError(data.error ?? "Failed to delete user", response.status);
  }
}

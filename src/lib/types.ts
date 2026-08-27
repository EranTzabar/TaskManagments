export type TaskPriority = "קריטי" | "גבוה" | "בינוני" | "נמוך";

export type TaskStatus = "ממתין להתחלה" | "בטיפול" | "הושלם";

export type FilterStatus = "all" | TaskStatus;

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface SessionUser {
  username: string;
  role: UserRole;
}

export interface UserListItem {
  id: string;
  username: string;
  role: UserRole;
  allowedProjectIds: number[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreatePayload {
  username: string;
  password: string;
  role: UserRole;
  allowedProjectIds?: number[];
}

export interface UserUpdatePayload {
  role?: UserRole;
  password?: string;
  allowedProjectIds?: number[] | null;
}

export interface Project {
  projectId: number;
  name: string;
  sortOrder?: number;
}

export interface ProjectCreatePayload {
  name: string;
}

export interface ProjectUpdatePayload {
  name: string;
}

export type CustomColumnType = "text" | "number" | "date" | "link";

export interface CustomColumn {
  columnId: number;
  projectId: number;
  name: string;
  type: CustomColumnType;
  sortOrder?: number;
}

export interface CustomColumnCreatePayload {
  name: string;
  type: CustomColumnType;
}

export interface CustomColumnReorderPayload {
  orderedColumnIds: number[];
}

export type BoardNoteColor = "yellow" | "green" | "blue" | "pink" | "purple";

export interface BoardNote {
  noteId: number;
  projectId: number;
  content: string;
  color: BoardNoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardNoteCreatePayload {
  content?: string;
  color?: BoardNoteColor;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface BoardNoteUpdatePayload {
  content?: string;
  color?: BoardNoteColor;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
}

export interface Task {
  taskId: number;
  title: string;
  priority: TaskPriority;
  details: string;
  status: TaskStatus;
  notes: string;
  parentTaskId?: number | null;
  sortOrder?: number;
  customFields?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskUpdatePayload {
  notes?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  title?: string;
  details?: string;
  customFields?: Record<string, string>;
}

export interface TaskCreatePayload {
  title: string;
  priority: TaskPriority;
  details: string;
  parentTaskId?: number;
}

export interface TaskCreateInput {
  title: string;
  priority: TaskPriority;
  details: string;
  parentTaskId?: number;
}

export interface TaskCreateResult {
  task: Task;
  parentTask?: Task;
}

export interface TaskImportItem {
  title: string;
  priority: TaskPriority;
  details: string;
  status?: TaskStatus;
  notes?: string;
  subtasks?: TaskImportItem[];
}

export interface TaskImportPayload {
  tasks: TaskImportItem[];
}

export interface TaskReorderPayload {
  parentTaskId?: number | null;
  orderedTaskIds: number[];
}

export interface TaskSeedInput {
  taskId: number;
  title: string;
  priority: TaskPriority;
  details: string;
}

export interface PresenceUser {
  nameLabel: string;
  avatarPath: string;
  nameResourceId?: number;
  avatarResourceId?: number;
  isSelf?: boolean;
}

export interface PresenceSyncResponse {
  sessionId: string | null;
  self: PresenceUser | null;
  others: PresenceUser[];
  activeCount: number;
}

import { normalizeCustomFields, validateCustomFieldsUpdate } from "./customColumns";
import { connectDB } from "./mongodb";
import TaskModel from "./models/Task";
import { TASK_DEFINITIONS } from "./taskData";
import {
  Task,
  TaskCreateInput,
  TaskCreateResult,
  TaskImportItem,
  TaskPriority,
  TaskStatus,
} from "./types";
import { TASK_PRIORITIES, TASK_STATUSES, validateTaskTitle } from "./utils";

function resolveTaskStatus(doc: {
  status?: TaskStatus;
  completed?: boolean;
}): TaskStatus {
  if (doc.status && TASK_STATUSES.includes(doc.status)) {
    return doc.status;
  }

  if (doc.completed === true) {
    return "הושלם";
  }

  return "ממתין להתחלה";
}

function serializeTask(doc: {
  taskId: number;
  title: string;
  priority: Task["priority"];
  details: string;
  status?: TaskStatus;
  completed?: boolean;
  notes: string;
  parentTaskId?: number | null;
  sortOrder?: number;
  customFields?: Map<string, string> | Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}): Task {
  return {
    taskId: doc.taskId,
    title: doc.title,
    priority: doc.priority,
    details: doc.details,
    status: resolveTaskStatus(doc),
    notes: doc.notes,
    parentTaskId:
      doc.parentTaskId != null && doc.parentTaskId !== undefined
        ? Number(doc.parentTaskId)
        : null,
    sortOrder: doc.sortOrder ?? 0,
    customFields: normalizeCustomFields(doc.customFields),
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

function deriveParentStatus(subtasks: { status: TaskStatus }[]): TaskStatus {
  if (subtasks.every((subtask) => subtask.status === "הושלם")) {
    return "הושלם";
  }

  if (subtasks.every((subtask) => subtask.status === "ממתין להתחלה")) {
    return "ממתין להתחלה";
  }

  return "בטיפול";
}

export async function recomputeParentStatus(parentTaskId: number): Promise<Task | null> {
  await connectDB();

  const subtasks = await TaskModel.find({ parentTaskId }).lean();
  if (subtasks.length === 0) {
    return null;
  }

  const newStatus = deriveParentStatus(subtasks);
  const doc = await TaskModel.findOneAndUpdate(
    { taskId: parentTaskId },
    { status: newStatus },
    { new: true, runValidators: true }
  ).lean();

  return doc ? serializeTask(doc) : null;
}

async function validateParentTaskId(projectId: number, parentTaskId: number): Promise<void> {
  const parent = await TaskModel.findOne({ taskId: parentTaskId, projectId }).lean();
  if (!parent) {
    throw new Error("Parent task not found");
  }

  if (parent.parentTaskId != null) {
    throw new Error("Subtasks cannot have subtasks");
  }
}

async function getTaskInProject(taskId: number, projectId: number) {
  return TaskModel.findOne({ taskId, projectId }).lean();
}

async function getNextTaskId(): Promise<number> {
  const latest = await TaskModel.findOne().sort({ taskId: -1 }).lean();
  return latest ? latest.taskId + 1 : 1;
}

function getParentGroupQuery(projectId: number, parentTaskId: number | null) {
  return parentTaskId == null
    ? { projectId, parentTaskId: null }
    : { projectId, parentTaskId };
}

async function getNextSortOrder(
  projectId: number,
  parentTaskId: number | null
): Promise<number> {
  const latest = await TaskModel.findOne(getParentGroupQuery(projectId, parentTaskId))
    .sort({ sortOrder: -1, taskId: -1 })
    .lean();
  return latest ? (latest.sortOrder ?? 0) + 1 : 0;
}

async function ensureSortOrders(projectId: number): Promise<void> {
  const docs = await TaskModel.find({ projectId }).lean();
  const groups = new Map<string, typeof docs>();

  for (const doc of docs) {
    const key = doc.parentTaskId == null ? "root" : String(doc.parentTaskId);
    const group = groups.get(key) ?? [];
    group.push(doc);
    groups.set(key, group);
  }

  for (const group of Array.from(groups.values())) {
    const sorted = [...group].sort((a, b) => {
      const orderA = a.sortOrder ?? a.taskId;
      const orderB = b.sortOrder ?? b.taskId;
      return orderA - orderB || a.taskId - b.taskId;
    });

    const needsUpdate = sorted.some((doc, index) => (doc.sortOrder ?? -1) !== index);
    if (!needsUpdate) {
      continue;
    }

    await Promise.all(
      sorted.map((doc, index) =>
        TaskModel.updateOne({ taskId: doc.taskId, projectId }, { sortOrder: index })
      )
    );
  }
}

export async function getTasks(projectId: number): Promise<Task[]> {
  await connectDB();
  await ensureSortOrders(projectId);
  const docs = await TaskModel.find({ projectId })
    .sort({ sortOrder: 1, taskId: 1 })
    .lean();
  return docs.map((doc) => serializeTask(doc));
}

export async function reorderTasks(
  projectId: number,
  parentTaskId: number | null,
  orderedTaskIds: number[]
): Promise<Task[]> {
  await connectDB();

  if (!Array.isArray(orderedTaskIds) || orderedTaskIds.length === 0) {
    throw new Error("orderedTaskIds is required");
  }

  const siblings = await TaskModel.find(getParentGroupQuery(projectId, parentTaskId)).lean();
  const siblingIds = new Set(siblings.map((task) => task.taskId));

  if (orderedTaskIds.length !== siblingIds.size) {
    throw new Error("Invalid task order");
  }

  const uniqueIds = new Set(orderedTaskIds);
  if (uniqueIds.size !== orderedTaskIds.length) {
    throw new Error("Invalid task order");
  }

  for (const taskId of orderedTaskIds) {
    if (!siblingIds.has(taskId)) {
      throw new Error("Invalid task order");
    }
  }

  await Promise.all(
    orderedTaskIds.map((taskId, index) =>
      TaskModel.updateOne({ taskId, projectId }, { sortOrder: index })
    )
  );

  return getTasks(projectId);
}

export interface TaskUpdateResult {
  task: Task;
  parentTask?: Task;
}

export async function updateTask(
  projectId: number,
  taskId: number,
  payload: {
    notes?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    title?: string;
    details?: string;
    customFields?: Record<string, string>;
  }
): Promise<TaskUpdateResult | null> {
  await connectDB();

  const existing = await getTaskInProject(taskId, projectId);
  if (!existing) {
    return null;
  }

  if (payload.status !== undefined) {
    const subtaskCount = await TaskModel.countDocuments({ parentTaskId: taskId, projectId });
    if (subtaskCount > 0) {
      throw new Error("Parent task status is derived from subtasks");
    }

    if (!TASK_STATUSES.includes(payload.status)) {
      throw new Error("Invalid status");
    }
  }

  const update: {
    notes?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    title?: string;
    details?: string;
    customFields?: Record<string, string>;
  } = {};
  if (typeof payload.notes === "string") {
    update.notes = payload.notes;
  }
  if (typeof payload.title === "string") {
    const title = payload.title.trim();
    const titleError = validateTaskTitle(title);
    if (titleError) {
      throw new Error(titleError);
    }
    update.title = title;
  }
  if (typeof payload.details === "string") {
    const details = payload.details.trim();
    if (!details) {
      throw new Error("Details cannot be empty");
    }
    update.details = details;
  }
  if (payload.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(payload.priority)) {
      throw new Error("Invalid priority");
    }
    update.priority = payload.priority;
  }
  if (payload.status !== undefined) {
    update.status = payload.status;
  }
  if (payload.customFields !== undefined) {
    const validatedFields = await validateCustomFieldsUpdate(projectId, payload.customFields);
    const mergedFields = {
      ...normalizeCustomFields(
        (existing as { customFields?: Map<string, string> | Record<string, string> }).customFields
      ),
      ...validatedFields,
    };

    for (const key of Object.keys(validatedFields)) {
      if (validatedFields[key] === "") {
        delete mergedFields[key];
      }
    }

    update.customFields = mergedFields;
  }

  if (Object.keys(update).length === 0) {
    return null;
  }

  const doc = await TaskModel.findOneAndUpdate({ taskId, projectId }, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!doc) {
    return null;
  }

  const task = serializeTask(doc);
  let parentTask: Task | undefined;

  if (existing.parentTaskId != null && payload.status !== undefined) {
    parentTask = (await recomputeParentStatus(existing.parentTaskId)) ?? undefined;
  }

  return { task, parentTask };
}

export interface TaskDeleteResult {
  deletedTaskIds: number[];
  parentTask?: Task;
}

export async function deleteTask(projectId: number, taskId: number): Promise<TaskDeleteResult> {
  await connectDB();

  const task = await getTaskInProject(taskId, projectId);
  if (!task) {
    return { deletedTaskIds: [] };
  }

  const parentTaskId = task.parentTaskId ?? null;
  const deletedTaskIds: number[] = [];

  const subtasks = await TaskModel.find({ parentTaskId: taskId, projectId }).lean();
  for (const subtask of subtasks) {
    deletedTaskIds.push(subtask.taskId);
  }

  await TaskModel.deleteMany({ parentTaskId: taskId, projectId });
  await TaskModel.deleteOne({ taskId, projectId });
  deletedTaskIds.push(taskId);

  let parentTask: Task | undefined;
  if (parentTaskId != null) {
    parentTask = (await recomputeParentStatus(parentTaskId)) ?? undefined;
  }

  return { deletedTaskIds, parentTask };
}

export function validateTaskCreateInput(
  payload: TaskCreateInput
): { ok: true; data: TaskCreateInput } | { ok: false; error: string } {
  const title = payload.title?.trim();
  const details = payload.details?.trim();

  const titleError = title ? validateTaskTitle(title) : "כותרת נדרשת";
  if (titleError) {
    return { ok: false, error: titleError };
  }

  if (!details) {
    return { ok: false, error: "Details are required" };
  }

  if (!TASK_PRIORITIES.includes(payload.priority)) {
    return { ok: false, error: "Invalid priority" };
  }

  return {
    ok: true,
    data: {
      title,
      priority: payload.priority,
      details,
      parentTaskId: payload.parentTaskId,
    },
  };
}

export async function createTask(
  projectId: number,
  payload: TaskCreateInput
): Promise<TaskCreateResult> {
  const validation = validateTaskCreateInput(payload);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  await connectDB();

  if (validation.data.parentTaskId != null) {
    validation.data.parentTaskId = Number(validation.data.parentTaskId);
    if (Number.isNaN(validation.data.parentTaskId)) {
      throw new Error("Invalid parent task id");
    }
    await validateParentTaskId(projectId, validation.data.parentTaskId);
  }

  const taskId = await getNextTaskId();
  const sortOrder = await getNextSortOrder(projectId, validation.data.parentTaskId ?? null);

  const doc = await TaskModel.create({
    projectId,
    taskId,
    title: validation.data.title,
    priority: validation.data.priority,
    details: validation.data.details,
    status: "ממתין להתחלה",
    notes: "",
    parentTaskId: validation.data.parentTaskId ?? null,
    sortOrder,
  });

  const task = serializeTask(doc.toObject());
  let parentTask: Task | undefined;

  if (validation.data.parentTaskId != null) {
    parentTask = (await recomputeParentStatus(validation.data.parentTaskId)) ?? undefined;
  }

  return { task, parentTask };
}

type ValidatedImportItem = Required<Omit<TaskImportItem, "subtasks">> & {
  subtasks: ValidatedImportItem[];
};

export function validateTaskImportItem(
  payload: TaskImportItem,
  index: number
): { ok: true; data: ValidatedImportItem } | { ok: false; error: string } {
  const base = validateTaskCreateInput(payload);
  if (!base.ok) {
    return { ok: false, error: `Task ${index + 1}: ${base.error}` };
  }

  const notes = typeof payload.notes === "string" ? payload.notes : "";
  const status =
    payload.status !== undefined ? payload.status : ("ממתין להתחלה" as TaskStatus);

  if (!TASK_STATUSES.includes(status)) {
    return { ok: false, error: `Task ${index + 1}: Invalid status` };
  }

  const subtasks: ValidatedImportItem[] = [];
  if (Array.isArray(payload.subtasks)) {
    for (let subIndex = 0; subIndex < payload.subtasks.length; subIndex += 1) {
      const subtask = payload.subtasks[subIndex];
      if (subtask.subtasks?.length) {
        return {
          ok: false,
          error: `Task ${index + 1}, subtask ${subIndex + 1}: Nested subtasks are not allowed`,
        };
      }

      const subResult = validateTaskImportItem(subtask, subIndex);
      if (!subResult.ok) {
        return {
          ok: false,
          error: `Task ${index + 1}, subtask ${subIndex + 1}: ${subResult.error.replace(/^Task \d+: /, "")}`,
        };
      }

      subtasks.push(subResult.data);
    }
  }

  return {
    ok: true,
    data: {
      title: base.data.title,
      priority: base.data.priority,
      details: base.data.details,
      status,
      notes,
      subtasks,
    },
  };
}

export async function importTasks(projectId: number, items: TaskImportItem[]): Promise<Task[]> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Tasks array is required and must not be empty");
  }

  const validated = items.map((item, index) => {
    const result = validateTaskImportItem(item, index);
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result.data;
  });

  await connectDB();

  let nextTaskId = await getNextTaskId();
  let nextTopLevelSortOrder = await getNextSortOrder(projectId, null);
  const created: Task[] = [];

  for (const item of validated) {
    const parentDoc = await TaskModel.create({
      projectId,
      taskId: nextTaskId++,
      title: item.title,
      priority: item.priority,
      details: item.details,
      status: item.status,
      notes: item.notes,
      parentTaskId: null,
      sortOrder: nextTopLevelSortOrder++,
    });

    let parentTask = serializeTask(parentDoc.toObject());
    let subtaskSortOrder = 0;

    for (const subtask of item.subtasks) {
      const subDoc = await TaskModel.create({
        projectId,
        taskId: nextTaskId++,
        title: subtask.title,
        priority: subtask.priority,
        details: subtask.details,
        status: subtask.status,
        notes: subtask.notes,
        parentTaskId: parentTask.taskId,
        sortOrder: subtaskSortOrder++,
      });
      created.push(serializeTask(subDoc.toObject()));
    }

    if (item.subtasks.length > 0) {
      parentTask = (await recomputeParentStatus(parentTask.taskId)) ?? parentTask;
    }

    created.push(parentTask);
  }

  return created.sort((a, b) => {
    if ((a.parentTaskId ?? null) === (b.parentTaskId ?? null)) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.taskId - b.taskId;
    }
    return a.taskId - b.taskId;
  });
}

export async function deleteAllTasks(projectId: number): Promise<number> {
  await connectDB();
  const result = await TaskModel.deleteMany({ projectId });
  return result.deletedCount ?? 0;
}

export async function resetTasks(projectId: number): Promise<Task[]> {
  await connectDB();
  await TaskModel.deleteMany({ projectId });

  const docs = await TaskModel.insertMany(
    TASK_DEFINITIONS.map((task, index) => ({
      ...task,
      projectId,
      status: "ממתין להתחלה" as TaskStatus,
      notes: "",
      parentTaskId: null,
      sortOrder: index,
    }))
  );

  return docs
    .map((doc) => serializeTask(doc.toObject()))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.taskId - b.taskId);
}

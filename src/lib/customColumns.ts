import { connectDB } from "./mongodb";
import CustomColumnModel from "./models/CustomColumn";
import TaskModel from "./models/Task";
import { CustomColumn, CustomColumnType } from "./types";
import { CUSTOM_COLUMN_NAME_MAX_LENGTH, CUSTOM_COLUMN_TYPES } from "./utils";

function serializeCustomColumn(doc: {
  columnId: number;
  projectId: number;
  name: string;
  type: CustomColumnType;
  sortOrder?: number;
}): CustomColumn {
  return {
    columnId: doc.columnId,
    projectId: doc.projectId,
    name: doc.name,
    type: doc.type,
    sortOrder: doc.sortOrder ?? 0,
  };
}

async function getNextColumnId(): Promise<number> {
  const latest = await CustomColumnModel.findOne().sort({ columnId: -1 }).lean();
  return latest ? latest.columnId + 1 : 1;
}

async function getNextColumnSortOrder(projectId: number): Promise<number> {
  const latest = await CustomColumnModel.findOne({ projectId })
    .sort({ sortOrder: -1, columnId: -1 })
    .lean();
  return latest ? (latest.sortOrder ?? 0) + 1 : 0;
}

export function validateCustomColumnName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return "שם העמודה נדרש";
  }

  if (trimmed.length > CUSTOM_COLUMN_NAME_MAX_LENGTH) {
    return `שם העמודה לא יכול לעלות על ${CUSTOM_COLUMN_NAME_MAX_LENGTH} תווים`;
  }

  return null;
}

export function validateCustomColumnType(type: string): type is CustomColumnType {
  return CUSTOM_COLUMN_TYPES.includes(type as CustomColumnType);
}

export function validateCustomFieldValue(type: CustomColumnType, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  switch (type) {
    case "number":
      return Number.isNaN(Number(trimmed)) ? "ערך מספרי לא תקין" : null;
    case "date":
      return Number.isNaN(Date.parse(trimmed)) ? "תאריך לא תקין" : null;
    case "link":
      try {
        const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
        new URL(url);
        return null;
      } catch {
        return "קישור לא תקין";
      }
    default:
      return null;
  }
}

export async function getCustomColumns(projectId: number): Promise<CustomColumn[]> {
  await connectDB();
  const docs = await CustomColumnModel.find({ projectId })
    .sort({ sortOrder: 1, columnId: 1 })
    .lean();
  return docs.map((doc) => serializeCustomColumn(doc));
}

export async function createCustomColumn(
  projectId: number,
  name: string,
  type: CustomColumnType
): Promise<CustomColumn> {
  const nameError = validateCustomColumnName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  if (!validateCustomColumnType(type)) {
    throw new Error("Invalid column type");
  }

  await connectDB();

  const columnId = await getNextColumnId();
  const sortOrder = await getNextColumnSortOrder(projectId);

  const doc = await CustomColumnModel.create({
    columnId,
    projectId,
    name: name.trim(),
    type,
    sortOrder,
  });

  return serializeCustomColumn(doc.toObject());
}

export async function reorderCustomColumns(
  projectId: number,
  orderedColumnIds: number[]
): Promise<CustomColumn[]> {
  await connectDB();

  if (!Array.isArray(orderedColumnIds) || orderedColumnIds.length === 0) {
    throw new Error("orderedColumnIds is required");
  }

  const columns = await CustomColumnModel.find({ projectId }).lean();
  const columnIds = new Set(columns.map((column) => column.columnId));

  if (orderedColumnIds.length !== columnIds.size) {
    throw new Error("Invalid column order");
  }

  const uniqueIds = new Set(orderedColumnIds);
  if (uniqueIds.size !== orderedColumnIds.length) {
    throw new Error("Invalid column order");
  }

  for (const columnId of orderedColumnIds) {
    if (!columnIds.has(columnId)) {
      throw new Error("Invalid column order");
    }
  }

  await Promise.all(
    orderedColumnIds.map((columnId, index) =>
      CustomColumnModel.updateOne({ columnId, projectId }, { sortOrder: index })
    )
  );

  return getCustomColumns(projectId);
}

export async function deleteCustomColumn(projectId: number, columnId: number): Promise<void> {
  await connectDB();

  const column = await CustomColumnModel.findOne({ columnId, projectId }).lean();
  if (!column) {
    throw new Error("Column not found");
  }

  await TaskModel.updateMany(
    { projectId },
    { $unset: { [`customFields.${columnId}`]: "" } }
  );
  await CustomColumnModel.deleteOne({ columnId, projectId });
}

export async function deleteCustomColumnsForProject(projectId: number): Promise<void> {
  await connectDB();
  await CustomColumnModel.deleteMany({ projectId });
}

export function normalizeCustomFields(
  value: Map<string, string> | Record<string, string> | undefined | null
): Record<string, string> {
  if (!value) {
    return {};
  }

  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => typeof fieldValue === "string")
  );
}

export async function validateCustomFieldsUpdate(
  projectId: number,
  customFields: Record<string, string>
): Promise<Record<string, string>> {
  const columns = await getCustomColumns(projectId);
  const columnMap = new Map(columns.map((column) => [String(column.columnId), column]));
  const normalized: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(customFields)) {
    const column = columnMap.get(key);
    if (!column) {
      throw new Error("Invalid custom column");
    }

    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    const valueError = validateCustomFieldValue(column.type, value);
    if (valueError) {
      throw new Error(`${column.name}: ${valueError}`);
    }

    normalized[key] = value;
  }

  return normalized;
}

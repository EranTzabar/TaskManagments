export const TASK_TABLE_COLUMNS = [
  { key: "id", label: "#", align: "center" as const, resizable: true },
  { key: "status", label: "סטטוס", align: "center" as const, resizable: true },
  { key: "title", label: "משימה", align: "right" as const, resizable: true },
  { key: "priority", label: "עדיפות", align: "center" as const, resizable: true },
  { key: "details", label: "פירוט", align: "right" as const, resizable: true },
  { key: "actions", label: "פעולות", align: "center" as const, resizable: false },
] as const;

export type TaskTableColumnKey = (typeof TASK_TABLE_COLUMNS)[number]["key"];

export type TaskTableColumnWidths = Record<TaskTableColumnKey, number>;

export const TASK_TABLE_COLUMN_ORDER: TaskTableColumnKey[] = TASK_TABLE_COLUMNS.map(
  (column) => column.key
);

export const DEFAULT_TASK_TABLE_COLUMN_WIDTHS: TaskTableColumnWidths = {
  id: 48,
  status: 128,
  title: 240,
  priority: 112,
  details: 320,
  actions: 128,
};

export const MIN_TASK_TABLE_COLUMN_WIDTHS: TaskTableColumnWidths = {
  id: 40,
  status: 96,
  title: 120,
  priority: 80,
  details: 100,
  actions: 96,
};

export const TASK_TABLE_COLUMN_WIDTHS_STORAGE_KEY = "task-table-column-widths";

export const FIXED_TASK_TABLE_COLUMN_COUNT = TASK_TABLE_COLUMNS.length;

export const DEFAULT_CUSTOM_COLUMN_WIDTH = 140;

export function clampColumnWidth(key: TaskTableColumnKey, width: number): number {
  return Math.max(MIN_TASK_TABLE_COLUMN_WIDTHS[key], Math.round(width));
}

export function readStoredColumnWidths(): TaskTableColumnWidths | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TASK_TABLE_COLUMN_WIDTHS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<TaskTableColumnWidths>;
    const widths = { ...DEFAULT_TASK_TABLE_COLUMN_WIDTHS };

    for (const key of TASK_TABLE_COLUMN_ORDER) {
      const value = parsed[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        widths[key] = clampColumnWidth(key, value);
      }
    }

    return widths;
  } catch {
    return null;
  }
}

export function getColumnLeftNeighbor(key: TaskTableColumnKey): TaskTableColumnKey | null {
  const index = TASK_TABLE_COLUMN_ORDER.indexOf(key);
  const neighborIndex = index + 1;

  if (neighborIndex >= TASK_TABLE_COLUMN_ORDER.length) {
    return null;
  }

  return TASK_TABLE_COLUMN_ORDER[neighborIndex];
}

export function resizeColumnPair(
  widths: TaskTableColumnWidths,
  key: TaskTableColumnKey,
  neighborKey: TaskTableColumnKey,
  delta: number
): TaskTableColumnWidths {
  const maxGrow = widths[neighborKey] - MIN_TASK_TABLE_COLUMN_WIDTHS[neighborKey];
  const maxShrink = widths[key] - MIN_TASK_TABLE_COLUMN_WIDTHS[key];
  const clampedDelta = Math.max(-maxShrink, Math.min(maxGrow, delta));

  return {
    ...widths,
    [key]: widths[key] + clampedDelta,
    [neighborKey]: widths[neighborKey] - clampedDelta,
  };
}

export function getTotalColumnWidth(widths: TaskTableColumnWidths): number {
  return TASK_TABLE_COLUMN_ORDER.reduce((sum, key) => sum + widths[key], 0);
}

export function getColumnWidthStyles(widths: TaskTableColumnWidths): Record<TaskTableColumnKey, string> {
  const total = getTotalColumnWidth(widths);

  return TASK_TABLE_COLUMN_ORDER.reduce(
    (styles, key) => {
      styles[key] = `${((widths[key] / total) * 100).toFixed(4)}%`;
      return styles;
    },
    {} as Record<TaskTableColumnKey, string>
  );
}

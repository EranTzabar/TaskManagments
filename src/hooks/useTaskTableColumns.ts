"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_TASK_TABLE_COLUMN_WIDTHS,
  getColumnLeftNeighbor,
  readStoredColumnWidths,
  resizeColumnPair,
  TASK_TABLE_COLUMN_ORDER,
  TASK_TABLE_COLUMN_WIDTHS_STORAGE_KEY,
  TaskTableColumnKey,
  TaskTableColumnWidths,
} from "@/lib/taskTableColumns";

interface ResizeState {
  key: TaskTableColumnKey;
  neighborKey: TaskTableColumnKey;
  startX: number;
  startWidths: TaskTableColumnWidths;
}

export function useTaskTableColumns() {
  const [widths, setWidths] = useState<TaskTableColumnWidths>(DEFAULT_TASK_TABLE_COLUMN_WIDTHS);
  const resizeRef = useRef<ResizeState | null>(null);

  useEffect(() => {
    const stored = readStoredColumnWidths();
    if (stored) {
      setWidths(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TASK_TABLE_COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(widths));
  }, [widths]);

  const startResize = useCallback(
    (key: TaskTableColumnKey, clientX: number) => {
      const neighborKey = getColumnLeftNeighbor(key);
      if (!neighborKey) {
        return;
      }

      resizeRef.current = {
        key,
        neighborKey,
        startX: clientX,
        startWidths: widths,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [widths]
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const resize = resizeRef.current;
      if (!resize) {
        return;
      }

      const delta = resize.startX - event.clientX;
      setWidths(() => {
        const base = resize.startWidths;
        return resizeColumnPair(base, resize.key, resize.neighborKey, delta);
      });
    };

    const handleMouseUp = () => {
      if (!resizeRef.current) {
        return;
      }

      resizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const resetWidths = useCallback(() => {
    setWidths({ ...DEFAULT_TASK_TABLE_COLUMN_WIDTHS });
  }, []);

  return {
    widths,
    columnOrder: TASK_TABLE_COLUMN_ORDER,
    startResize,
    resetWidths,
  };
}

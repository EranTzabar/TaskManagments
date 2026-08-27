"use client";

import { useEffect, useRef, useState } from "react";

interface SubtaskBulkBarProps {
  visible: boolean;
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  showDelete?: boolean;
  showSelectAll?: boolean;
  showImportExportMenu?: boolean;
  canExport?: boolean;
  onSelectAll: (selected: boolean) => void;
  onCloseAll: () => void;
  onDeleteSelected: () => void;
  onExport?: () => void;
  onImportFromFile?: () => void;
  onImportJson?: () => void;
}

export default function SubtaskBulkBar({
  visible,
  allSelected,
  someSelected,
  selectedCount,
  showDelete = false,
  showSelectAll = true,
  showImportExportMenu = false,
  canExport = true,
  onSelectAll,
  onCloseAll,
  onDeleteSelected,
  onExport,
  onImportFromFile,
  onImportJson,
}: SubtaskBulkBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  if (!visible) {
    return null;
  }

  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        {showImportExportMenu ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="ייבוא וייצוא"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center p-1 text-slate-500 hover:text-slate-700 transition dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute start-0 top-full z-20 mt-1 min-w-[10rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={!canExport}
                  onClick={() => {
                    setMenuOpen(false);
                    onExport?.();
                  }}
                  className="block w-full px-3 py-2 text-right text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  ייצוא JSON
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onImportFromFile?.();
                  }}
                  className="block w-full px-3 py-2 text-right text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  ייבוא מקובץ
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onImportJson?.();
                  }}
                  className="block w-full px-3 py-2 text-right text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  ייבוא JSON
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {showSelectAll ? (
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someSelected && !allSelected;
                }
              }}
              onChange={(event) => onSelectAll(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
            />
            <span>בחר הכל</span>
            {hasSelection ? (
              <span className="text-xs text-slate-400">({selectedCount} נבחרו)</span>
            ) : null}
          </label>
        ) : null}
      </div>

      {hasSelection ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCloseAll}
            className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition dark:text-indigo-300 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:border-indigo-800"
          >
            סגור הכל
          </button>
          {showDelete ? (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition dark:text-red-300 dark:bg-red-950 dark:hover:bg-red-900 dark:border-red-800"
            >
              מחק
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

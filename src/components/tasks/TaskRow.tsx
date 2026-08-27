"use client";

import { CSSProperties, Ref } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { CustomColumn, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { hasNotes, isTaskDone } from "@/lib/utils";
import { CustomFieldCells } from "@/components/columns/CustomFieldCell";
import DragHandle from "@/components/ui/DragHandle";
import EditPencilButton from "@/components/ui/EditPencilButton";
import NoteIcon from "@/components/ui/NoteIcon";
import PrioritySelect from "./PrioritySelect";
import StatusSelect from "./StatusSelect";
import SubtaskStatusSummary from "./SubtaskStatusSummary";
import SubtaskToggleButton from "./SubtaskToggleButton";
import TaskTitleDisplay from "./TaskTitleDisplay";
import TaskSelectCheckbox from "./TaskSelectCheckbox";
import TruncatedDetails from "./TruncatedDetails";

export interface TaskRowProps {
  task: Task;
  isExpanded: boolean;
  readOnly?: boolean;
  statusDisabled?: boolean;
  subtasks?: Task[];
  subtasksVisible?: boolean;
  onToggleSubtasksVisibility?: () => void;
  onToggleExpand: (taskId: number) => void;
  onNoteChange: (taskId: number, notes: string) => void;
  onPriorityChange: (taskId: number, priority: TaskPriority) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onDeleteRequest: (task: Task) => void;
  onAddSubtaskRequest?: (task: Task) => void;
  onEditTitleRequest?: (task: Task) => void;
  onEditDetailsRequest?: (task: Task) => void;
  showDragHandle?: boolean;
  rowRef?: Ref<HTMLTableRowElement>;
  rowStyle?: CSSProperties;
  isDragging?: boolean;
  dragHandleProps?: {
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  };
  showSubtaskSelection?: boolean;
  isSubtaskParentSelected?: boolean;
  onSelectSubtaskParent?: (taskId: number, selected: boolean) => void;
  customColumns?: CustomColumn[];
  totalColumnCount?: number;
  onCustomFieldChange?: (taskId: number, columnId: number, value: string) => void;
}

function DeleteButton({ task, onDeleteRequest }: { task: Task; onDeleteRequest: (task: Task) => void }) {
  return (
    <button
      type="button"
      onClick={() => onDeleteRequest(task)}
      aria-label={`מחק משימה ${task.taskId}`}
      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}

export default function TaskRow({
  task,
  isExpanded,
  readOnly = false,
  statusDisabled = false,
  subtasks = [],
  subtasksVisible = false,
  onToggleSubtasksVisibility,
  onToggleExpand,
  onNoteChange,
  onPriorityChange,
  onStatusChange,
  onDeleteRequest,
  onAddSubtaskRequest,
  onEditTitleRequest,
  onEditDetailsRequest,
  showDragHandle = false,
  rowRef,
  rowStyle,
  isDragging = false,
  dragHandleProps,
  showSubtaskSelection = false,
  isSubtaskParentSelected = false,
  onSelectSubtaskParent,
  customColumns = [],
  totalColumnCount = 6,
  onCustomFieldChange,
}: TaskRowProps) {
  const notesSet = hasNotes(task.notes);
  const done = isTaskDone(task.status);
  const rowClass = done
    ? "bg-emerald-50/20 dark:bg-emerald-950/5 transition"
    : "hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition";
  const labelClass = done
    ? "line-through text-slate-400 dark:text-slate-500 font-normal"
    : "font-semibold text-slate-800 dark:text-slate-100";
  const controlsDisabled = readOnly || statusDisabled;

  return (
    <>
      <tr
        ref={rowRef}
        style={rowStyle}
        className={`${rowClass} ${isDragging ? "relative z-10 bg-white shadow-md dark:bg-slate-800" : ""}`}
      >
        <td className="py-3 px-3 text-center text-xs text-slate-400 font-mono align-top">
          <div className="flex items-center justify-center gap-0.5">
            <DragHandle
              attributes={dragHandleProps?.attributes}
              listeners={dragHandleProps?.listeners}
              disabled={!showDragHandle}
            />
            <span>{task.taskId}</span>
          </div>
        </td>
        <td className="py-3 px-4 text-center align-top">
          <div className="flex flex-col items-center gap-1">
            <StatusSelect
              status={task.status}
              onChange={(status) => onStatusChange(task.taskId, status)}
              disabled={controlsDisabled}
              title={
                readOnly
                  ? "צפייה בלבד"
                  : statusDisabled
                    ? "סטטוס נגזר מתת-משימות"
                    : undefined
              }
              className="mx-auto"
            />
            <SubtaskStatusSummary subtasks={subtasks} />
          </div>
        </td>
        <td className="py-3 px-4 align-top min-w-0">
          <div className="flex flex-col items-end gap-0.5 min-w-0 w-full">
            <div className="flex items-center gap-1 justify-end min-w-0 w-full">
              {showSubtaskSelection && onSelectSubtaskParent ? (
                <TaskSelectCheckbox
                  checked={isSubtaskParentSelected}
                  onChange={(selected) => onSelectSubtaskParent(task.taskId, selected)}
                  label={`בחר משימה ${task.taskId}`}
                />
              ) : null}
              {subtasks.length > 0 && onToggleSubtasksVisibility ? (
                <SubtaskToggleButton
                  expanded={subtasksVisible}
                  onClick={onToggleSubtasksVisibility}
                />
              ) : null}
              <button
                type="button"
                onClick={() => onToggleExpand(task.taskId)}
                className={`${labelClass} cursor-pointer hover:underline text-right min-w-0 flex-1 overflow-hidden`}
              >
                <TaskTitleDisplay title={task.title} />
              </button>
              {onEditTitleRequest ? (
                <EditPencilButton
                  onClick={() => onEditTitleRequest(task)}
                  label="ערוך כותרת"
                />
              ) : null}
            </div>
            {subtasks.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {subtasks.length} תת-משימות
              </span>
            ) : null}
          </div>
        </td>
        <td className="py-3 px-4 text-center align-top">
          <PrioritySelect
            priority={task.priority}
            onChange={(priority) => onPriorityChange(task.taskId, priority)}
            disabled={readOnly}
            className="mx-auto"
          />
        </td>
        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-sm align-top min-w-0 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 w-full min-w-0">
            <div className="min-w-0 overflow-hidden">
              <TruncatedDetails details={task.details} />
            </div>
            {onEditDetailsRequest ? (
              <EditPencilButton
                onClick={() => onEditDetailsRequest(task)}
                label="ערוך פירוט"
              />
            ) : null}
          </div>
        </td>
        <CustomFieldCells
          taskId={task.taskId}
          customColumns={customColumns}
          customFields={task.customFields}
          readOnly={readOnly}
          onCustomFieldChange={onCustomFieldChange}
        />
        <td className="py-3 px-4 text-center align-top">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onToggleExpand(task.taskId)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              <NoteIcon filled={notesSet} />
              {isExpanded ? "צמצם" : "פרטים"}
            </button>
            {!readOnly ? (
              <DeleteButton task={task} onDeleteRequest={onDeleteRequest} />
            ) : null}
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="bg-indigo-50/10 dark:bg-slate-900/40">
          <td colSpan={totalColumnCount} className="p-4 border-l-4 border-indigo-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  פרטי משימה מלאים
                </h4>
                <p className="text-sm leading-relaxed">{task.details}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <NoteIcon filled={notesSet} />
                    הערות אישיות ועדכונים
                  </h4>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {readOnly ? "צפייה בלבד" : "נשמר אוטומטית"}
                  </span>
                </div>
                <textarea
                  value={task.notes}
                  onChange={(event) => onNoteChange(task.taskId, event.target.value)}
                  readOnly={readOnly}
                  placeholder="הקלד כאן הערות מעקב, קשיים, קישורים או סטטוס פנימי..."
                  className={`w-full h-20 text-sm p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${readOnly ? "opacity-80 cursor-default" : ""}`}
                />
              </div>
            </div>

            {onAddSubtaskRequest && subtasks.length === 0 && !readOnly ? (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onAddSubtaskRequest(task)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  + הוסף תת-משימה
                </button>
              </div>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

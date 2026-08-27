"use client";

import { CSSProperties, Ref } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { hasNotes, isTaskDone } from "@/lib/utils";
import DragHandle from "@/components/ui/DragHandle";
import EditPencilButton from "@/components/ui/EditPencilButton";
import NoteIcon from "@/components/ui/NoteIcon";
import PrioritySelect from "./PrioritySelect";
import StatusSelect from "./StatusSelect";
import SubtaskCardList from "./SubtaskCardList";
import SubtaskStatusSummary from "./SubtaskStatusSummary";
import SubtaskToggleButton from "./SubtaskToggleButton";
import TaskTitleDisplay from "./TaskTitleDisplay";
import TaskSelectCheckbox from "./TaskSelectCheckbox";
import TruncatedDetails from "./TruncatedDetails";

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  readOnly?: boolean;
  statusDisabled?: boolean;
  subtasks?: Task[];
  subtasksVisible?: boolean;
  onToggleSubtasksVisibility?: () => void;
  expandedTaskId: number | null;
  onToggleExpand: (taskId: number) => void;
  onNoteChange: (taskId: number, notes: string) => void;
  onPriorityChange: (taskId: number, priority: TaskPriority) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onDeleteRequest: (task: Task) => void;
  onAddSubtaskRequest?: (task: Task) => void;
  onEditTitleRequest?: (task: Task) => void;
  onEditDetailsRequest?: (task: Task) => void;
  showDragHandle?: boolean;
  cardRef?: Ref<HTMLDivElement>;
  cardStyle?: CSSProperties;
  isDragging?: boolean;
  dragHandleProps?: {
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  };
  showSubtaskSelection?: boolean;
  isSubtaskParentSelected?: boolean;
  onSelectSubtaskParent?: (taskId: number, selected: boolean) => void;
}

export default function TaskCard({
  task,
  isExpanded,
  readOnly = false,
  statusDisabled = false,
  subtasks = [],
  subtasksVisible = false,
  onToggleSubtasksVisibility,
  expandedTaskId,
  onToggleExpand,
  onNoteChange,
  onPriorityChange,
  onStatusChange,
  onDeleteRequest,
  onAddSubtaskRequest,
  onEditTitleRequest,
  onEditDetailsRequest,
  showDragHandle = false,
  cardRef,
  cardStyle,
  isDragging = false,
  dragHandleProps,
  showSubtaskSelection = false,
  isSubtaskParentSelected = false,
  onSelectSubtaskParent,
}: TaskCardProps) {
  const notesSet = hasNotes(task.notes);
  const done = isTaskDone(task.status);
  const cardClass = done
    ? "border-emerald-200 bg-emerald-50/5 dark:border-emerald-950/50 dark:bg-emerald-950/5"
    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800";
  const labelClass = done
    ? "line-through text-slate-400 dark:text-slate-500"
    : "font-bold text-slate-800 dark:text-white";
  const controlsDisabled = readOnly || statusDisabled;

  return (
    <div
      ref={cardRef}
      style={cardStyle}
      className={`border rounded-xl p-4 shadow-sm transition ${cardClass} ${
        isDragging ? "relative z-10 ring-2 ring-indigo-300 dark:ring-indigo-700" : ""
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 flex-wrap">
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
            />
          </div>
          <SubtaskStatusSummary subtasks={subtasks} />
        </div>
        <PrioritySelect
          priority={task.priority}
          onChange={(priority) => onPriorityChange(task.taskId, priority)}
          disabled={readOnly}
          className="text-[10px] py-0.5"
        />
      </div>

      <div className="flex flex-col items-end gap-0.5 mb-2 min-w-0">
        <div className="flex items-center gap-1 min-w-0 w-full">
          <DragHandle
            attributes={dragHandleProps?.attributes}
            listeners={dragHandleProps?.listeners}
            disabled={!showDragHandle}
          />
          {showSubtaskSelection && onSelectSubtaskParent ? (
            <TaskSelectCheckbox
              checked={isSubtaskParentSelected}
              onChange={(selected) => onSelectSubtaskParent(task.taskId, selected)}
              label={`בחר משימה ${task.taskId}`}
            />
          ) : null}
          <span className="text-xs font-mono text-slate-400 shrink-0">#{task.taskId}</span>
          {subtasks.length > 0 && onToggleSubtasksVisibility ? (
            <SubtaskToggleButton
              expanded={subtasksVisible}
              onClick={onToggleSubtasksVisibility}
            />
          ) : null}
          <button
            type="button"
            onClick={() => onToggleExpand(task.taskId)}
            className={`${labelClass} text-sm text-right min-w-0 flex-1 overflow-hidden`}
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

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2 w-full min-w-0">
        <div className="min-w-0 overflow-hidden text-right">
          <TruncatedDetails details={task.details} className="text-xs" />
        </div>
        {onEditDetailsRequest ? (
          <EditPencilButton
            onClick={() => onEditDetailsRequest(task)}
            label="ערוך פירוט"
          />
        ) : null}
      </div>

      {subtasks.length > 0 && subtasksVisible && onAddSubtaskRequest ? (
        <SubtaskCardList
          parentTask={task}
          subtasks={subtasks}
          readOnly={readOnly}
          expandedTaskId={expandedTaskId}
          onToggleExpand={onToggleExpand}
          onNoteChange={onNoteChange}
          onPriorityChange={onPriorityChange}
          onStatusChange={onStatusChange}
          onDeleteRequest={onDeleteRequest}
          onAddSubtaskRequest={onAddSubtaskRequest}
          onEditTitleRequest={onEditTitleRequest}
          onEditDetailsRequest={onEditDetailsRequest}
        />
      ) : null}

      {!readOnly && onAddSubtaskRequest && subtasks.length === 0 ? (
        <button
          type="button"
          onClick={() => onAddSubtaskRequest(task)}
          className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          + הוסף תת-משימה
        </button>
      ) : null}

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onToggleExpand(task.taskId)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1"
        >
          <NoteIcon filled={notesSet} />
          {isExpanded ? "סגור פרטים" : "פרטים והערות"}
        </button>
        {!readOnly ? (
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
        ) : null}
      </div>

      {isExpanded ? (
        <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border-r-2 border-indigo-500 space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              פירוט מלא
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {task.details}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <NoteIcon filled={notesSet} className="w-3 h-3" />
                הערות אישיות
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {readOnly ? "צפייה בלבד" : "נשמר אוטומטית"}
              </span>
            </div>
            <textarea
              value={task.notes}
              onChange={(event) => onNoteChange(task.taskId, event.target.value)}
              readOnly={readOnly}
              placeholder="רשום עדכונים..."
              className={`w-full h-16 text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-indigo-500 ${readOnly ? "opacity-80 cursor-default" : ""}`}
            />
          </div>

          {!readOnly && onAddSubtaskRequest && subtasks.length === 0 ? (
            <button
              type="button"
              onClick={() => onAddSubtaskRequest(task)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              + הוסף תת-משימה
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

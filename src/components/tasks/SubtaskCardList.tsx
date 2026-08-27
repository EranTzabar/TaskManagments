"use client";

import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { hasNotes, isTaskDone } from "@/lib/utils";
import EditPencilButton from "@/components/ui/EditPencilButton";
import NoteIcon from "@/components/ui/NoteIcon";
import PrioritySelect from "./PrioritySelect";
import StatusSelect from "./StatusSelect";
import TaskTitleDisplay from "./TaskTitleDisplay";
import TruncatedDetails from "./TruncatedDetails";

interface SubtaskCardListProps {
  parentTask: Task;
  subtasks: Task[];
  readOnly?: boolean;
  expandedTaskId: number | null;
  onToggleExpand: (taskId: number) => void;
  onNoteChange: (taskId: number, notes: string) => void;
  onPriorityChange: (taskId: number, priority: TaskPriority) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onDeleteRequest: (task: Task) => void;
  onAddSubtaskRequest: (task: Task) => void;
  onEditTitleRequest?: (task: Task) => void;
  onEditDetailsRequest?: (task: Task) => void;
}

export default function SubtaskCardList({
  parentTask,
  subtasks,
  readOnly = false,
  expandedTaskId,
  onToggleExpand,
  onNoteChange,
  onPriorityChange,
  onStatusChange,
  onDeleteRequest,
  onAddSubtaskRequest,
  onEditTitleRequest,
  onEditDetailsRequest,
}: SubtaskCardListProps) {
  return (
    <div className="mt-3 mr-4 sm:mr-6 border-r-[3px] border-indigo-400 dark:border-indigo-500 pr-3 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-l-lg py-2">
      <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        תת-משימות
      </div>

      <div className="space-y-1.5">
        {subtasks.map((subtask) => {
          const notesSet = hasNotes(subtask.notes);
          const done = isTaskDone(subtask.status);
          const isExpanded = expandedTaskId === subtask.taskId;
          const titleClass = done
            ? "line-through text-slate-400"
            : "text-slate-600 dark:text-slate-300";

          return (
            <div
              key={subtask.taskId}
              className="rounded-lg border border-indigo-100/80 bg-white/80 px-2.5 py-2 dark:border-indigo-900/50 dark:bg-slate-800/60"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-1 min-w-0">
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">#{subtask.taskId}</span>
                    <span className={`text-xs font-medium leading-snug min-w-0 flex-1 overflow-hidden ${titleClass}`}>
                      <TaskTitleDisplay title={subtask.title} />
                    </span>
                    {onEditTitleRequest ? (
                      <EditPencilButton
                        onClick={() => onEditTitleRequest(subtask)}
                        label="ערוך כותרת"
                      />
                    ) : null}
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 min-w-0">
                    <div className="min-w-0 overflow-hidden">
                      <TruncatedDetails
                        details={subtask.details}
                        className="text-[11px] text-slate-500 dark:text-slate-400"
                      />
                    </div>
                    {onEditDetailsRequest ? (
                      <EditPencilButton
                        onClick={() => onEditDetailsRequest(subtask)}
                        label="ערוך פירוט"
                      />
                    ) : null}
                  </div>
                </div>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(subtask)}
                    aria-label={`מחק תת-משימה ${subtask.taskId}`}
                    className="p-1 shrink-0 text-slate-400 hover:text-red-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <div className="flex flex-wrap items-center gap-1.5">
                <StatusSelect
                  status={subtask.status}
                  onChange={(status) => onStatusChange(subtask.taskId, status)}
                  disabled={readOnly}
                  className="text-[10px] py-0.5 min-w-[96px]"
                />
                <PrioritySelect
                  priority={subtask.priority}
                  onChange={(priority) => onPriorityChange(subtask.taskId, priority)}
                  disabled={readOnly}
                  className="text-[10px] py-0.5"
                />
                <button
                  type="button"
                  onClick={() => onToggleExpand(subtask.taskId)}
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 mr-auto"
                >
                  <NoteIcon filled={notesSet} className="w-3 h-3" />
                  {isExpanded ? "סגור" : "פרטים"}
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {subtask.details}
                  </p>
                  <textarea
                    value={subtask.notes}
                    onChange={(event) => onNoteChange(subtask.taskId, event.target.value)}
                    readOnly={readOnly}
                    placeholder="הערות..."
                    className={`w-full h-14 text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 ${readOnly ? "opacity-80 cursor-default" : ""}`}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {!readOnly ? (
        <button
          type="button"
          onClick={() => onAddSubtaskRequest(parentTask)}
          className="mt-2 mr-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          + הוסף תת-משימה
        </button>
      ) : null}
    </div>
  );
}

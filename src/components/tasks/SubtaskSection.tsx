"use client";

import { CSSProperties, Fragment, Ref, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CustomColumn, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { hasNotes, isTaskDone } from "@/lib/utils";
import { DEFAULT_CUSTOM_COLUMN_WIDTH } from "@/lib/taskTableColumns";
import { CustomFieldCells } from "@/components/columns/CustomFieldCell";
import DragHandle from "@/components/ui/DragHandle";
import EditPencilButton from "@/components/ui/EditPencilButton";
import NoteIcon from "@/components/ui/NoteIcon";
import PrioritySelect from "./PrioritySelect";
import StatusSelect from "./StatusSelect";
import TaskTitleDisplay from "./TaskTitleDisplay";
import TruncatedDetails from "./TruncatedDetails";
import { TaskTableColumnWidths } from "@/lib/taskTableColumns";

interface SubtaskSectionProps {
  parentTask: Task;
  subtasks: Task[];
  columnWidths: TaskTableColumnWidths;
  customColumns?: CustomColumn[];
  totalColumnCount?: number;
  readOnly?: boolean;
  canReorder?: boolean;
  expandedTaskId: number | null;
  onToggleExpand: (taskId: number) => void;
  onNoteChange: (taskId: number, notes: string) => void;
  onPriorityChange: (taskId: number, priority: TaskPriority) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onDeleteRequest: (task: Task) => void;
  onAddSubtaskRequest?: (task: Task) => void;
  onEditTitleRequest?: (task: Task) => void;
  onEditDetailsRequest?: (task: Task) => void;
  onReorderTasks?: (parentTaskId: number | null, orderedTaskIds: number[]) => void;
  onCustomFieldChange?: (taskId: number, columnId: number, value: string) => void;
}

function SubtaskDeleteButton({
  task,
  onDeleteRequest,
}: {
  task: Task;
  onDeleteRequest: (task: Task) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onDeleteRequest(task)}
      aria-label={`מחק תת-משימה ${task.taskId}`}
      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
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
  );
}

interface SubtaskRowProps {
  subtask: Task;
  readOnly: boolean;
  isExpanded: boolean;
  showDragHandle: boolean;
  rowRef?: Ref<HTMLTableRowElement>;
  rowStyle?: CSSProperties;
  isDragging?: boolean;
  dragHandleProps?: {
    attributes?: DraggableAttributes;
    listeners?: SyntheticListenerMap;
  };
  onToggleExpand: (taskId: number) => void;
  onNoteChange: (taskId: number, notes: string) => void;
  onPriorityChange: (taskId: number, priority: TaskPriority) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onDeleteRequest: (task: Task) => void;
  onEditTitleRequest?: (task: Task) => void;
  onEditDetailsRequest?: (task: Task) => void;
  customColumns?: CustomColumn[];
  onCustomFieldChange?: (taskId: number, columnId: number, value: string) => void;
  expandedColSpan?: number;
}

function SubtaskRow({
  subtask,
  readOnly,
  isExpanded,
  showDragHandle,
  rowRef,
  rowStyle,
  isDragging = false,
  dragHandleProps,
  onToggleExpand,
  onNoteChange,
  onPriorityChange,
  onStatusChange,
  onDeleteRequest,
  onEditTitleRequest,
  onEditDetailsRequest,
  customColumns = [],
  onCustomFieldChange,
  expandedColSpan = 5,
}: SubtaskRowProps) {
  const notesSet = hasNotes(subtask.notes);
  const done = isTaskDone(subtask.status);
  const titleClass = done
    ? "line-through text-slate-400 dark:text-slate-500"
    : "text-slate-600 dark:text-slate-300";

  return (
    <>
      <tr
        ref={rowRef}
        style={rowStyle}
        className={`border-t border-indigo-100/80 dark:border-indigo-900/40 hover:bg-white/70 dark:hover:bg-slate-800/40 transition ${
          isDragging ? "relative z-10 bg-white shadow-md dark:bg-slate-800" : ""
        }`}
      >
        <td className="py-2 px-2 align-top min-w-0">
          <div className="flex items-center gap-1 justify-end min-w-0 w-full">
            <DragHandle
              attributes={dragHandleProps?.attributes}
              listeners={dragHandleProps?.listeners}
              disabled={!showDragHandle}
            />
            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              #{subtask.taskId}
            </span>
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
        </td>
        <td className="py-2 px-2 text-center align-top">
          <StatusSelect
            status={subtask.status}
            onChange={(status) => onStatusChange(subtask.taskId, status)}
            disabled={readOnly}
            className="mx-auto text-[10px] min-w-[96px] py-0.5"
          />
        </td>
        <td className="py-2 px-2 text-center align-top">
          <PrioritySelect
            priority={subtask.priority}
            onChange={(priority) => onPriorityChange(subtask.taskId, priority)}
            disabled={readOnly}
            className="mx-auto text-[10px] py-0.5"
          />
        </td>
        <td className="py-2 px-2 align-top min-w-0 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 w-full min-w-0">
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
        </td>
        <CustomFieldCells
          taskId={subtask.taskId}
          customColumns={customColumns}
          customFields={subtask.customFields}
          readOnly={readOnly}
          onCustomFieldChange={onCustomFieldChange}
          compact
        />
        <td className="py-2 px-2 text-center align-top">
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onToggleExpand(subtask.taskId)}
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-0.5"
            >
              <NoteIcon filled={notesSet} className="w-3 h-3" />
              {isExpanded ? "סגור" : "פרטים"}
            </button>
            {!readOnly ? (
              <SubtaskDeleteButton task={subtask} onDeleteRequest={onDeleteRequest} />
            ) : null}
          </div>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="bg-white/60 dark:bg-slate-900/30">
          <td colSpan={expandedColSpan} className="px-3 pb-3 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mr-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">פירוט מלא</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {subtask.details}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <NoteIcon filled={notesSet} className="w-3 h-3" />
                  הערות
                </span>
                <textarea
                  value={subtask.notes}
                  onChange={(event) => onNoteChange(subtask.taskId, event.target.value)}
                  readOnly={readOnly}
                  placeholder="הערות..."
                  className={`w-full h-14 text-xs p-2 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 ${readOnly ? "opacity-80 cursor-default" : ""}`}
                />
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function SortableSubtaskRow(props: SubtaskRowProps) {
  const { subtask, showDragHandle } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.taskId,
    disabled: !showDragHandle,
  });

  return (
    <SubtaskRow
      {...props}
      rowRef={setNodeRef}
      rowStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandleProps={{ attributes, listeners }}
    />
  );
}

export default function SubtaskSection({
  parentTask,
  subtasks,
  columnWidths,
  customColumns = [],
  totalColumnCount = 6,
  readOnly = false,
  canReorder = false,
  expandedTaskId,
  onToggleExpand,
  onNoteChange,
  onPriorityChange,
  onStatusChange,
  onDeleteRequest,
  onAddSubtaskRequest,
  onEditTitleRequest,
  onEditDetailsRequest,
  onReorderTasks,
  onCustomFieldChange,
}: SubtaskSectionProps) {
  const subtaskIds = useMemo(() => subtasks.map((subtask) => subtask.taskId), [subtasks]);
  const showDragHandle = canReorder && !readOnly;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const titleColumnWidth =
    columnWidths.id + columnWidths.status + columnWidths.title;
  const customWidth = customColumns.length * DEFAULT_CUSTOM_COLUMN_WIDTH;
  const subtaskTotalWidth =
    titleColumnWidth +
    columnWidths.status +
    columnWidths.priority +
    columnWidths.details +
    customWidth +
    columnWidths.actions;

  const subtaskColumnStyles = {
    title: `${((titleColumnWidth / subtaskTotalWidth) * 100).toFixed(4)}%`,
    status: `${((columnWidths.status / subtaskTotalWidth) * 100).toFixed(4)}%`,
    priority: `${((columnWidths.priority / subtaskTotalWidth) * 100).toFixed(4)}%`,
    details: `${((columnWidths.details / subtaskTotalWidth) * 100).toFixed(4)}%`,
    actions: `${((columnWidths.actions / subtaskTotalWidth) * 100).toFixed(4)}%`,
  };
  const nestedColumnCount = 5 + customColumns.length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderTasks) {
      return;
    }

    const oldIndex = subtaskIds.indexOf(Number(active.id));
    const newIndex = subtaskIds.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorderTasks(parentTask.taskId, arrayMove(subtaskIds, oldIndex, newIndex));
  };

  const renderSubtask = (subtask: Task) => {
    const rowProps: SubtaskRowProps = {
      subtask,
      readOnly,
      isExpanded: expandedTaskId === subtask.taskId,
      showDragHandle,
      onToggleExpand,
      onNoteChange,
      onPriorityChange,
      onStatusChange,
      onDeleteRequest,
      onEditTitleRequest,
      onEditDetailsRequest,
      customColumns,
      onCustomFieldChange,
      expandedColSpan: nestedColumnCount,
    };

    return showDragHandle ? (
      <SortableSubtaskRow key={subtask.taskId} {...rowProps} />
    ) : (
      <SubtaskRow key={subtask.taskId} {...rowProps} />
    );
  };

  const tableBody = <tbody>{subtasks.map((subtask) => renderSubtask(subtask))}</tbody>;

  return (
    <tr>
      <td colSpan={totalColumnCount} className="p-0 bg-indigo-50/20 dark:bg-indigo-950/10">
        <div className="mr-8 sm:mr-12 border-r-[3px] border-indigo-400 dark:border-indigo-500 pr-3 py-2">
          <table className="task-data-table w-full text-right border-collapse table-fixed">
            <colgroup>
              <col style={{ width: subtaskColumnStyles.title }} />
              <col style={{ width: subtaskColumnStyles.status }} />
              <col style={{ width: subtaskColumnStyles.priority }} />
              <col style={{ width: subtaskColumnStyles.details }} />
              {customColumns.map((column) => (
                <col key={column.columnId} style={{ width: `${DEFAULT_CUSTOM_COLUMN_WIDTH}px` }} />
              ))}
              <col style={{ width: subtaskColumnStyles.actions }} />
            </colgroup>
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <th className="py-2 px-2">תת-משימה</th>
                <th className="py-2 px-2 text-center">סטטוס</th>
                <th className="py-2 px-2 text-center">עדיפות</th>
                <th className="py-2 px-2">פירוט</th>
                {customColumns.map((column) => (
                  <th key={column.columnId} className="py-2 px-2 truncate">
                    {column.name}
                  </th>
                ))}
                <th className="py-2 px-2 text-center">פעולות</th>
              </tr>
            </thead>
            {showDragHandle ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
                  {tableBody}
                </SortableContext>
              </DndContext>
            ) : (
              tableBody
            )}
          </table>

          {!readOnly && onAddSubtaskRequest ? (
            <button
              type="button"
              onClick={() => onAddSubtaskRequest(parentTask)}
              className="mt-2 mr-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              + הוסף תת-משימה
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

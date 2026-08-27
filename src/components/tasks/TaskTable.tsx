"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CustomColumn, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { getSubtasks, taskHasSubtasks } from "@/lib/utils";
import {
  DEFAULT_CUSTOM_COLUMN_WIDTH,
  FIXED_TASK_TABLE_COLUMN_COUNT,
  getColumnWidthStyles,
  TASK_TABLE_COLUMNS,
} from "@/lib/taskTableColumns";
import { useTaskTableColumns } from "@/hooks/useTaskTableColumns";
import AddCustomColumnModal from "@/components/columns/AddCustomColumnModal";
import CustomColumnHeader from "@/components/columns/CustomColumnHeader";
import AddTaskTableRow from "./AddTaskTableRow";
import type { AddTaskFormValues } from "./AddTaskModal";
import ResizableTableHeader from "./ResizableTableHeader";
import SubtaskSection from "./SubtaskSection";
import TaskRow, { TaskRowProps } from "./TaskRow";

interface TaskTableProps {
  tasks: Task[];
  allTasks: Task[];
  readOnly?: boolean;
  isAdmin?: boolean;
  canReorder?: boolean;
  expandedTaskId: number | null;
  onToggleExpand: (taskId: number) => void;
  onNoteChange: (taskId: number, notes: string) => void;
  onPriorityChange: (taskId: number, priority: TaskPriority) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onDeleteRequest: (task: Task) => void;
  onAddSubtaskRequest: (task: Task) => void;
  onEditTitleRequest?: (task: Task) => void;
  onEditDetailsRequest?: (task: Task) => void;
  onReorderTasks?: (parentTaskId: number | null, orderedTaskIds: number[]) => void;
  isSubtasksVisible: (parentTaskId: number) => boolean;
  onToggleSubtasksVisibility: (parentTaskId: number) => void;
  selectedSubtaskParents?: Set<number>;
  onSelectSubtaskParent?: (taskId: number, selected: boolean) => void;
  showSubtaskSelection?: boolean;
  customColumns?: CustomColumn[];
  onCustomFieldChange?: (taskId: number, columnId: number, value: string) => void;
  onAddCustomColumn?: (name: string, type: CustomColumn["type"]) => Promise<void>;
  onDeleteCustomColumn?: (columnId: number) => Promise<void>;
  onReorderCustomColumns?: (orderedColumnIds: number[]) => Promise<void>;
  onAddTask?: (values: AddTaskFormValues) => Promise<void>;
  addTaskExpanded?: boolean;
  onAddTaskExpandedChange?: (expanded: boolean) => void;
}

function SortableTaskRow({
  task,
  showDragHandle,
  ...rowProps
}: TaskRowProps & { task: Task; showDragHandle: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.taskId,
    disabled: !showDragHandle,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskRow
      task={task}
      showDragHandle={showDragHandle}
      rowRef={setNodeRef}
      rowStyle={style}
      isDragging={isDragging}
      dragHandleProps={{ attributes, listeners }}
      {...rowProps}
    />
  );
}

export default function TaskTable({
  tasks,
  allTasks,
  readOnly = false,
  isAdmin = false,
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
  isSubtasksVisible,
  onToggleSubtasksVisibility,
  selectedSubtaskParents,
  onSelectSubtaskParent,
  showSubtaskSelection = false,
  customColumns = [],
  onCustomFieldChange,
  onAddCustomColumn,
  onDeleteCustomColumn,
  onReorderCustomColumns,
  onAddTask,
  addTaskExpanded = false,
  onAddTaskExpandedChange,
}: TaskTableProps) {
  const { widths, startResize, resetWidths } = useTaskTableColumns();
  const columnStyles = getColumnWidthStyles(widths);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [internalAddTaskExpanded, setInternalAddTaskExpanded] = useState(false);
  const addTaskOpen = onAddTaskExpandedChange ? addTaskExpanded : internalAddTaskExpanded;
  const setAddTaskOpen = onAddTaskExpandedChange ?? setInternalAddTaskExpanded;
  const totalColumnCount = FIXED_TASK_TABLE_COLUMN_COUNT + customColumns.length;
  const taskIds = useMemo(() => tasks.map((task) => task.taskId), [tasks]);
  const columnIds = useMemo(() => customColumns.map((column) => column.columnId), [customColumns]);
  const showDragHandle = canReorder && isAdmin;
  const canReorderColumns = isAdmin && !!onReorderCustomColumns && customColumns.length > 1;
  const showAddTaskRow = isAdmin && !!onAddTask;

  useEffect(() => {
    if (!showAddTaskRow) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "a" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      event.preventDefault();
      setAddTaskOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setAddTaskOpen, showAddTaskRow]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderTasks) {
      return;
    }

    const oldIndex = taskIds.indexOf(Number(active.id));
    const newIndex = taskIds.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorderTasks(null, arrayMove(taskIds, oldIndex, newIndex));
  };

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderCustomColumns) {
      return;
    }

    const oldIndex = columnIds.indexOf(Number(active.id));
    const newIndex = columnIds.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    void onReorderCustomColumns(arrayMove(columnIds, oldIndex, newIndex));
  };

  const customColumnHeaders = customColumns.map((column) => (
    <CustomColumnHeader
      key={column.columnId}
      column={column}
      isAdmin={isAdmin}
      sortable={canReorderColumns}
      onDelete={onDeleteCustomColumn ? (columnId) => void onDeleteCustomColumn(columnId) : undefined}
    />
  ));

  const tableBody = (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
      {tasks.map((task) => {
        const subtasks = getSubtasks(allTasks, task.taskId);
        const hasSubtasks = taskHasSubtasks(allTasks, task.taskId);
        const isExpanded = expandedTaskId === task.taskId;
        const subtasksOpen = isSubtasksVisible(task.taskId);

        const rowProps: Omit<TaskRowProps, "task"> = {
          isExpanded,
          readOnly,
          statusDisabled: hasSubtasks,
          subtasks,
          subtasksVisible: subtasksOpen,
          onToggleSubtasksVisibility: () => onToggleSubtasksVisibility(task.taskId),
          onToggleExpand,
          onNoteChange,
          onPriorityChange,
          onStatusChange,
          onDeleteRequest,
          onAddSubtaskRequest: isAdmin ? onAddSubtaskRequest : undefined,
          onEditTitleRequest: isAdmin ? onEditTitleRequest : undefined,
          onEditDetailsRequest: isAdmin ? onEditDetailsRequest : undefined,
          showSubtaskSelection,
          isSubtaskParentSelected: selectedSubtaskParents?.has(task.taskId) ?? false,
          onSelectSubtaskParent,
          customColumns,
          totalColumnCount,
          onCustomFieldChange,
        };

        return (
          <Fragment key={task.taskId}>
            {showDragHandle ? (
              <SortableTaskRow task={task} showDragHandle {...rowProps} />
            ) : (
              <TaskRow task={task} {...rowProps} />
            )}
            {subtasks.length > 0 && subtasksOpen ? (
              <SubtaskSection
                parentTask={task}
                subtasks={subtasks}
                columnWidths={widths}
                customColumns={customColumns}
                totalColumnCount={totalColumnCount}
                readOnly={readOnly}
                canReorder={showDragHandle}
                expandedTaskId={expandedTaskId}
                onToggleExpand={onToggleExpand}
                onNoteChange={onNoteChange}
                onPriorityChange={onPriorityChange}
                onStatusChange={onStatusChange}
                onDeleteRequest={onDeleteRequest}
                onAddSubtaskRequest={isAdmin ? onAddSubtaskRequest : undefined}
                onEditTitleRequest={isAdmin ? onEditTitleRequest : undefined}
                onEditDetailsRequest={isAdmin ? onEditDetailsRequest : undefined}
                onReorderTasks={onReorderTasks}
                onCustomFieldChange={onCustomFieldChange}
              />
            ) : null}
          </Fragment>
        );
      })}
      {showAddTaskRow ? (
        <AddTaskTableRow
          totalColumnCount={totalColumnCount}
          customColumns={customColumns}
          expanded={addTaskOpen}
          onExpandedChange={setAddTaskOpen}
          onSubmit={onAddTask}
        />
      ) : null}
    </tbody>
  );

  return (
    <div className="hidden md:block bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
      <div className="flex justify-end gap-3 px-3 pt-2">
        {isAdmin && onAddCustomColumn ? (
          <button
            type="button"
            onClick={() => setAddColumnOpen(true)}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
          >
            + הוסף עמודה
          </button>
        ) : null}
        <button
          type="button"
          onClick={resetWidths}
          className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          איפוס רוחב עמודות
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="task-data-table w-full min-w-full text-right border-collapse table-fixed">
          <colgroup>
            {TASK_TABLE_COLUMNS.filter((column) => column.key !== "actions").map((column) => (
              <col key={column.key} style={{ width: columnStyles[column.key] }} />
            ))}
            {customColumns.map((column) => (
              <col
                key={column.columnId}
                style={{ width: `${DEFAULT_CUSTOM_COLUMN_WIDTH}px` }}
              />
            ))}
            <col style={{ width: columnStyles.actions }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
              {TASK_TABLE_COLUMNS.filter((column) => column.key !== "actions").map((column) => (
                <ResizableTableHeader
                  key={column.key}
                  columnKey={column.key}
                  label={column.label}
                  align={column.align}
                  width={columnStyles[column.key]}
                  onResizeStart={startResize}
                  resizable={column.resizable}
                />
              ))}
              {customColumns.length > 0 ? (
                canReorderColumns ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleColumnDragEnd}
                  >
                    <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                      {customColumnHeaders}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                    {customColumnHeaders}
                  </SortableContext>
                )
              ) : null}
              <ResizableTableHeader
                columnKey="actions"
                label="פעולות"
                align="center"
                width={columnStyles.actions}
                onResizeStart={startResize}
                resizable={false}
              />
            </tr>
          </thead>
          {showDragHandle ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                {tableBody}
              </SortableContext>
            </DndContext>
          ) : (
            tableBody
          )}
        </table>
      </div>
      {onAddCustomColumn ? (
        <AddCustomColumnModal
          open={addColumnOpen}
          onClose={() => setAddColumnOpen(false)}
          onSubmit={async (name, type) => {
            await onAddCustomColumn(name, type);
            setAddColumnOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

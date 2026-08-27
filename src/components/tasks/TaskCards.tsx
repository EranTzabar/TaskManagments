"use client";

import { ComponentProps, useMemo } from "react";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { getSubtasks, taskHasSubtasks } from "@/lib/utils";
import TaskCard from "./TaskCard";
import AddTaskMobileBar from "./AddTaskMobileBar";
import type { AddTaskFormValues } from "./AddTaskModal";

interface TaskCardsProps {
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
  onAddTask?: (values: AddTaskFormValues) => Promise<void>;
  addTaskExpanded?: boolean;
  onAddTaskExpandedChange?: (expanded: boolean) => void;
}

function SortableTaskCard({
  task,
  showDragHandle,
  ...cardProps
}: ComponentProps<typeof TaskCard> & { task: Task; showDragHandle: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.taskId,
    disabled: !showDragHandle,
  });

  return (
    <TaskCard
      task={task}
      showDragHandle={showDragHandle}
      cardRef={setNodeRef}
      cardStyle={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandleProps={{ attributes, listeners }}
      {...cardProps}
    />
  );
}

export default function TaskCards({
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
  onAddTask,
  addTaskExpanded = false,
  onAddTaskExpandedChange,
}: TaskCardsProps) {
  const taskIds = useMemo(() => tasks.map((task) => task.taskId), [tasks]);
  const showDragHandle = canReorder && isAdmin;

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

  const cards = tasks.map((task) => {
    const subtasks = getSubtasks(allTasks, task.taskId);
    const cardProps = {
      isExpanded: expandedTaskId === task.taskId,
      readOnly,
      statusDisabled: taskHasSubtasks(allTasks, task.taskId),
      subtasks,
      subtasksVisible: isSubtasksVisible(task.taskId),
      onToggleSubtasksVisibility: () => onToggleSubtasksVisibility(task.taskId),
      expandedTaskId,
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
    };

    return showDragHandle ? (
      <SortableTaskCard key={task.taskId} task={task} showDragHandle {...cardProps} />
    ) : (
      <TaskCard key={task.taskId} task={task} {...cardProps} />
    );
  });

  return (
    <div className="block md:hidden space-y-3">
      {showDragHandle ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {cards}
          </SortableContext>
        </DndContext>
      ) : (
        cards
      )}
      {isAdmin && onAddTask && onAddTaskExpandedChange ? (
        <AddTaskMobileBar
          expanded={addTaskExpanded}
          onExpandedChange={onAddTaskExpandedChange}
          onSubmit={onAddTask}
        />
      ) : null}
    </div>
  );
}

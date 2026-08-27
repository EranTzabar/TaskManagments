"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setActiveProjectIdCookie } from "@/lib/activeProject";
import {
  CreateTaskError,
  createCustomColumnApi,
  createProjectApi,
  createTaskApi,
  deleteCustomColumnApi,
  deleteProjectApi,
  deleteTaskApi,
  fetchCustomColumns,
  fetchBoardNotes,
  fetchTasks,
  importTasksApi,
  patchTask,
  reorderCustomColumnsApi,
  reorderTasksApi,
  updateProjectApi,
} from "@/lib/api-client";
import { exportTasksToJsonFile } from "@/lib/taskExport";
import { getTaskImportErrorMessage, readTaskImportFile } from "@/lib/taskImport";
import { FilterStatus, CustomColumn, CustomColumnType, Project, SessionUser, Task, TaskPriority, TaskStatus } from "@/lib/types";
import {
  filterTopLevelTasks,
  getTopLevelTasks,
  isTaskDone,
} from "@/lib/utils";
import ProjectListBar from "@/components/projects/ProjectListBar";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/providers/Toast";
import AddTaskModal, { AddTaskFormValues } from "./AddTaskModal";
import DeleteSelectedTasksModal from "./DeleteSelectedTasksModal";
import DeleteTaskModal from "./DeleteTaskModal";
import EditTaskFieldModal, { TaskEditableField } from "./EditTaskFieldModal";
import ImportTasksModal, { ImportTasksFormValues } from "./ImportTasksModal";
import FiltersBar from "./FiltersBar";
import MetricsDashboard from "./MetricsDashboard";
import TaskCards from "./TaskCards";
import SubtaskBulkBar from "./SubtaskBulkBar";
import TaskTable from "./TaskTable";

interface TaskTrackerProps {
  initialTasks: Task[];
  initialProjects: Project[];
  activeProjectId: number;
  initialBoardNotesCount?: number;
  user: SessionUser;
}

type ModalName = "celebration" | "addTask" | "importTasks" | null;

function applyTaskUpdates(tasks: Task[], updates: Array<{ task?: Task; parentTask?: Task }>): Task[] {
  let next = [...tasks];

  for (const update of updates) {
    if (update.task) {
      const index = next.findIndex((task) => task.taskId === update.task!.taskId);
      if (index >= 0) {
        next[index] = update.task;
      } else {
        next.push(update.task);
      }
    }

    if (update.parentTask) {
      next = next.map((task) =>
        task.taskId === update.parentTask!.taskId ? update.parentTask! : task
      );
    }
  }

  return next;
}

export default function TaskTracker({
  initialTasks,
  initialProjects,
  activeProjectId: initialActiveProjectId,
  initialBoardNotesCount = 0,
  user,
}: TaskTrackerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isAdmin = user.role === "admin";
  const readOnly = !isAdmin;

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialActiveProjectId);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editField, setEditField] = useState<{
    task: Task;
    field: TaskEditableField;
  } | null>(null);
  const [expandedSubtaskParents, setExpandedSubtaskParents] = useState<Set<number>>(
    () => new Set()
  );
  const [selectedSubtaskParents, setSelectedSubtaskParents] = useState<Set<number>>(
    () => new Set()
  );
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [addTaskExpanded, setAddTaskExpanded] = useState(false);
  const [loading, setLoading] = useState(initialTasks.length === 0);
  const [boardNotesCount, setBoardNotesCount] = useState(initialBoardNotesCount);

  const noteTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const customFieldTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const topLevelTasks = useMemo(() => getTopLevelTasks(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    return filterTopLevelTasks(tasks, filterStatus, filterPriority, searchQuery);
  }, [tasks, filterStatus, filterPriority, searchQuery]);

  const canReorder = useMemo(
    () =>
      isAdmin &&
      filterStatus === "all" &&
      filterPriority === "all" &&
      searchQuery.trim() === "",
    [isAdmin, filterStatus, filterPriority, searchQuery]
  );

  const visibleSelectableParentTasks = useMemo(
    () => filteredTasks.map((task) => task.taskId),
    [filteredTasks]
  );

  const allSubtaskParentsSelected =
    visibleSelectableParentTasks.length > 0 &&
    visibleSelectableParentTasks.every((taskId) => selectedSubtaskParents.has(taskId));

  const someSubtaskParentsSelected = visibleSelectableParentTasks.some((taskId) =>
    selectedSubtaskParents.has(taskId)
  );

  const selectedTasksForDelete = useMemo(
    () => topLevelTasks.filter((task) => selectedSubtaskParents.has(task.taskId)),
    [topLevelTasks, selectedSubtaskParents]
  );

  const totalCount = topLevelTasks.length;
  const completedCount = topLevelTasks.filter((task) => isTaskDone(task.status)).length;

  const activeProject = useMemo(
    () => projects.find((project) => project.projectId === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const resetBoardUiState = useCallback(() => {
    setExpandedTaskId(null);
    setExpandedSubtaskParents(new Set());
    setSelectedSubtaskParents(new Set());
    setSearchQuery("");
    setFilterPriority("all");
    setFilterStatus("all");
  }, []);

  const refreshTasks = useCallback(async (projectId = activeProjectId) => {
    try {
      const nextTasks = await fetchTasks(projectId);
      setTasks(nextTasks);
    } catch {
      showToast("שגיאה בטעינת המשימות", "error");
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, showToast]);

  useEffect(() => {
    if (initialTasks.length === 0) {
      void refreshTasks(activeProjectId);
    }
  }, [activeProjectId, initialTasks.length, refreshTasks]);

  useEffect(() => {
    setProjects(initialProjects);
    setActiveProjectId(initialActiveProjectId);
    setTasks(initialTasks);
    setBoardNotesCount(initialBoardNotesCount);
    setLoading(false);
  }, [initialActiveProjectId, initialBoardNotesCount, initialProjects, initialTasks]);

  useEffect(() => {
    let cancelled = false;

    const loadColumns = async () => {
      try {
        const columns = await fetchCustomColumns(activeProjectId);
        if (!cancelled) {
          setCustomColumns(columns);
        }
      } catch {
        if (!cancelled) {
          setCustomColumns([]);
        }
      }
    };

    void loadColumns();

    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  useEffect(() => {
    let cancelled = false;

    const loadBoardNotesCount = async () => {
      try {
        const notes = await fetchBoardNotes(activeProjectId);
        if (!cancelled) {
          setBoardNotesCount(notes.length);
        }
      } catch {
        if (!cancelled) {
          setBoardNotesCount(0);
        }
      }
    };

    void loadBoardNotesCount();

    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  useEffect(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      const triggered = sessionStorage.getItem("isFullSuccessTriggered");
      if (triggered !== "true") {
        setActiveModal("celebration");
        sessionStorage.setItem("isFullSuccessTriggered", "true");
      }
    } else {
      sessionStorage.removeItem("isFullSuccessTriggered");
    }
  }, [completedCount, totalCount]);

  const closeModal = () => {
    setActiveModal(null);
    setSubtaskParent(null);
  };

  const closeDeleteModal = () => setTaskToDelete(null);

  const handleStatusChange = useCallback(
    async (taskId: number, status: TaskStatus) => {
      const currentTask = tasks.find((task) => task.taskId === taskId);
      if (!currentTask || currentTask.status === status) return;

      setTasks((current) =>
        current.map((task) =>
          task.taskId === taskId ? { ...task, status } : task
        )
      );

      try {
        const { task, parentTask } = await patchTask(activeProjectId, taskId, { status });
        setTasks((current) => applyTaskUpdates(current, [{ task, parentTask }]));
        showToast(`סטטוס משימה ${taskId} עודכן`, "info");
      } catch {
        setTasks((current) =>
          current.map((task) =>
            task.taskId === taskId
              ? { ...task, status: currentTask.status }
              : task
          )
        );
        showToast("שגיאה בעדכון הסטטוס", "error");
      }
    },
    [activeProjectId, showToast, tasks]
  );

  const handlePriorityChange = useCallback(
    async (taskId: number, priority: TaskPriority) => {
      const currentTask = tasks.find((task) => task.taskId === taskId);
      if (!currentTask || currentTask.priority === priority) return;

      setTasks((current) =>
        current.map((task) =>
          task.taskId === taskId ? { ...task, priority } : task
        )
      );

      try {
        const { task } = await patchTask(activeProjectId, taskId, { priority });
        setTasks((current) => applyTaskUpdates(current, [{ task }]));
        showToast(`עדיפות משימה ${taskId} עודכנה`, "info");
      } catch {
        setTasks((current) =>
          current.map((task) =>
            task.taskId === taskId
              ? { ...task, priority: currentTask.priority }
              : task
          )
        );
        showToast("שגיאה בעדכון העדיפות", "error");
      }
    },
    [activeProjectId, showToast, tasks]
  );

  const handleNoteChange = useCallback(
    (taskId: number, notes: string) => {
      const previousTask = tasks.find((task) => task.taskId === taskId);
      if (!previousTask) return;

      setTasks((current) =>
        current.map((task) => (task.taskId === taskId ? { ...task, notes } : task))
      );

      if (noteTimers.current[taskId]) {
        clearTimeout(noteTimers.current[taskId]);
      }

      noteTimers.current[taskId] = setTimeout(async () => {
        try {
          const { task } = await patchTask(activeProjectId, taskId, { notes });
          setTasks((current) => applyTaskUpdates(current, [{ task }]));
        } catch {
          setTasks((current) =>
            current.map((task) =>
              task.taskId === taskId ? { ...task, notes: previousTask.notes } : task
            )
          );
          showToast("שגיאה בשמירת ההערה", "error");
        }
      }, 500);
    },
    [activeProjectId, showToast, tasks]
  );

  const handleCustomFieldChange = useCallback(
    (taskId: number, columnId: number, value: string) => {
      if (!isAdmin) {
        return;
      }

      const fieldKey = String(columnId);
      const timerKey = `${taskId}:${fieldKey}`;
      const previousTask = tasks.find((task) => task.taskId === taskId);
      if (!previousTask) {
        return;
      }

      const previousValue = previousTask.customFields?.[fieldKey] ?? "";

      setTasks((current) =>
        current.map((task) =>
          task.taskId === taskId
            ? {
                ...task,
                customFields: {
                  ...(task.customFields ?? {}),
                  [fieldKey]: value,
                },
              }
            : task
        )
      );

      if (customFieldTimers.current[timerKey]) {
        clearTimeout(customFieldTimers.current[timerKey]);
      }

      customFieldTimers.current[timerKey] = setTimeout(async () => {
        try {
          const { task } = await patchTask(activeProjectId, taskId, {
            customFields: { [fieldKey]: value },
          });
          setTasks((current) => applyTaskUpdates(current, [{ task }]));
        } catch {
          setTasks((current) =>
            current.map((task) =>
              task.taskId === taskId
                ? {
                    ...task,
                    customFields: {
                      ...(task.customFields ?? {}),
                      [fieldKey]: previousValue,
                    },
                  }
                : task
            )
          );
          showToast("שגיאה בשמירת הערך", "error");
        }
      }, 500);
    },
    [activeProjectId, isAdmin, showToast, tasks]
  );

  const handleAddCustomColumn = useCallback(
    async (name: string, type: CustomColumnType) => {
      const { column } = await createCustomColumnApi(activeProjectId, { name, type });
      setCustomColumns((current) => [...current, column]);
      showToast(`העמודה "${column.name}" נוספה`, "success");
    },
    [activeProjectId, showToast]
  );

  const handleDeleteCustomColumn = useCallback(
    async (columnId: number) => {
      await deleteCustomColumnApi(activeProjectId, columnId);
      setCustomColumns((current) => current.filter((column) => column.columnId !== columnId));
      setTasks((current) =>
        current.map((task) => {
          if (!task.customFields?.[String(columnId)]) {
            return task;
          }

          const nextFields = { ...task.customFields };
          delete nextFields[String(columnId)];
          return { ...task, customFields: nextFields };
        })
      );
      showToast("העמודה נמחקה", "success");
    },
    [activeProjectId, showToast]
  );

  const handleReorderCustomColumns = useCallback(
    async (orderedColumnIds: number[]) => {
      const previous = customColumns;

      setCustomColumns((current) => {
        const orderMap = new Map(orderedColumnIds.map((id, index) => [id, index]));
        return [...current]
          .sort(
            (a, b) =>
              (orderMap.get(a.columnId) ?? 0) - (orderMap.get(b.columnId) ?? 0) ||
              a.columnId - b.columnId
          )
          .map((column, index) => ({ ...column, sortOrder: index }));
      });

      try {
        const columns = await reorderCustomColumnsApi(activeProjectId, { orderedColumnIds });
        setCustomColumns(columns);
      } catch {
        setCustomColumns(previous);
        showToast("שגיאה בשמירת סדר העמודות", "error");
      }
    },
    [activeProjectId, customColumns, showToast]
  );

  const handleToggleExpand = useCallback((taskId: number) => {
    setExpandedTaskId((current) => (current === taskId ? null : taskId));
  }, []);

  const isSubtasksVisible = useCallback(
    (parentTaskId: number) => expandedSubtaskParents.has(parentTaskId),
    [expandedSubtaskParents]
  );

  const handleToggleSubtasksVisibility = useCallback((parentTaskId: number) => {
    setExpandedSubtaskParents((current) => {
      const next = new Set(current);
      if (next.has(parentTaskId)) {
        next.delete(parentTaskId);
      } else {
        next.add(parentTaskId);
      }
      return next;
    });
  }, []);

  const handleSelectSubtaskParent = useCallback((parentTaskId: number, selected: boolean) => {
    setSelectedSubtaskParents((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(parentTaskId);
      } else {
        next.delete(parentTaskId);
      }
      return next;
    });
  }, []);

  const handleSelectAllSubtaskParents = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedSubtaskParents(new Set(visibleSelectableParentTasks));
        return;
      }
      setSelectedSubtaskParents(new Set());
    },
    [visibleSelectableParentTasks]
  );

  const handleCloseAllSubtasks = useCallback(() => {
    if (selectedSubtaskParents.size === 0) {
      return;
    }

    setExpandedSubtaskParents((current) => {
      const next = new Set(current);
      for (const taskId of Array.from(selectedSubtaskParents)) {
        next.delete(taskId);
      }
      return next;
    });

    setExpandedTaskId((current) =>
      current != null && selectedSubtaskParents.has(current) ? null : current
    );

    showToast("פרטים נסגרו עבור המשימות שנבחרו", "info");
  }, [selectedSubtaskParents, showToast]);

  const handleDeleteSelectedRequest = useCallback(() => {
    if (selectedSubtaskParents.size === 0) {
      return;
    }
    setDeleteSelectedOpen(true);
  }, [selectedSubtaskParents.size]);

  const handleDeleteSelectedTasks = useCallback(async () => {
    const selectedIds = Array.from(selectedSubtaskParents);
    if (selectedIds.length === 0) {
      return;
    }

    try {
      let remaining = tasks;
      const allDeletedIds: number[] = [];

      for (const taskId of selectedIds) {
        const { deletedTaskIds, parentTask } = await deleteTaskApi(activeProjectId, taskId);
        allDeletedIds.push(...deletedTaskIds);
        remaining = remaining.filter((task) => !deletedTaskIds.includes(task.taskId));
        if (parentTask) {
          remaining = applyTaskUpdates(remaining, [{ parentTask }]);
        }
      }

      setTasks(remaining);
      setExpandedTaskId((current) =>
        current != null && allDeletedIds.includes(current) ? null : current
      );
      setExpandedSubtaskParents((current) => {
        const next = new Set(current);
        for (const taskId of allDeletedIds) {
          next.delete(taskId);
        }
        return next;
      });
      setSelectedSubtaskParents(new Set());
      setDeleteSelectedOpen(false);
      showToast(`${selectedIds.length} משימות נמחקו`, "success");
    } catch (error) {
      if (error instanceof CreateTaskError && error.status === 403) {
        throw new Error("אין הרשאה לבצע פעולה זו");
      }

      if (error instanceof CreateTaskError && error.message) {
        throw new Error(error.message);
      }

      throw new Error("שגיאה במחיקת המשימות");
    }
  }, [activeProjectId, selectedSubtaskParents, showToast, tasks]);

  const handleReorderTasks = useCallback(
    async (parentTaskId: number | null, orderedTaskIds: number[]) => {
      const previous = tasks;

      setTasks((current) => {
        const orderMap = new Map(orderedTaskIds.map((id, index) => [id, index]));
        return current.map((task) => {
          const inGroup =
            parentTaskId == null
              ? task.parentTaskId == null
              : task.parentTaskId === parentTaskId;
          const nextOrder = orderMap.get(task.taskId);

          if (!inGroup || nextOrder === undefined) {
            return task;
          }

          return { ...task, sortOrder: nextOrder };
        });
      });

      try {
        const updated = await reorderTasksApi(activeProjectId, { parentTaskId, orderedTaskIds });
        setTasks(updated);
      } catch {
        setTasks(previous);
        showToast("שגיאה בשמירת סדר המשימות", "error");
      }
    },
    [activeProjectId, showToast, tasks]
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterPriority("all");
    setFilterStatus("all");
    showToast("הסינונים אופסו", "info");
  };

  const handleAddTask = useCallback(
    async (values: AddTaskFormValues) => {
      try {
        const { task, parentTask } = await createTaskApi(activeProjectId, values);
        setTasks((current) => applyTaskUpdates(current, [{ task, parentTask }]));
        if (values.parentTaskId != null) {
          setExpandedSubtaskParents((current) => {
            const next = new Set(current);
            next.add(values.parentTaskId!);
            return next;
          });
          closeModal();
        }
        showToast(
          values.parentTaskId
            ? `תת-משימה ${task.taskId} נוספה בהצלחה`
            : `משימה ${task.taskId} נוספה בהצלחה`,
          "success"
        );
      } catch (error) {
        if (error instanceof CreateTaskError && error.status === 403) {
          throw new Error("אין הרשאה לבצע פעולה זו");
        }

        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }

        throw new Error("שגיאה ביצירת המשימה");
      }
    },
    [activeProjectId, showToast]
  );

  const handleImportTasks = useCallback(
    async (values: ImportTasksFormValues) => {
      try {
        const { tasks: importedTasks, importedCount } = await importTasksApi(activeProjectId, values);
        setTasks((current) =>
          applyTaskUpdates(
            current,
            importedTasks.map((task) => ({ task }))
          )
        );
        setActiveModal(null);
        showToast(`${importedCount} משימות יובאו בהצלחה`, "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.status === 403) {
          throw new Error("אין הרשאה לבצע פעולה זו");
        }

        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }

        throw new Error("שגיאה בייבוא המשימות");
      }
    },
    [activeProjectId, showToast]
  );

  const handleDeleteRequest = useCallback((task: Task) => {
    setTaskToDelete(task);
  }, []);

  const handleEditTitleRequest = useCallback((task: Task) => {
    setEditField({ task, field: "title" });
  }, []);

  const handleEditDetailsRequest = useCallback((task: Task) => {
    setEditField({ task, field: "details" });
  }, []);

  const handleEditFieldSubmit = useCallback(
    async (taskId: number, field: TaskEditableField, value: string) => {
      try {
        const payload = field === "title" ? { title: value } : { details: value };
        const { task, parentTask } = await patchTask(activeProjectId, taskId, payload);
        setTasks((current) => applyTaskUpdates(current, [{ task, parentTask }]));
        showToast(
          field === "title" ? `כותרת משימה ${taskId} עודכנה` : `פירוט משימה ${taskId} עודכן`,
          "success"
        );
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "שגיאה בעדכון המשימה"
        );
      }
    },
    [activeProjectId, showToast]
  );

  const closeEditFieldModal = () => setEditField(null);

  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) {
      return;
    }

    try {
      const { deletedTaskIds, parentTask } = await deleteTaskApi(activeProjectId, taskToDelete.taskId);
        setTasks((current) => {
          const remaining = current.filter((task) => !deletedTaskIds.includes(task.taskId));
          return parentTask
            ? applyTaskUpdates(remaining, [{ parentTask }])
            : remaining;
        });
        setExpandedTaskId((current) =>
          current != null && deletedTaskIds.includes(current) ? null : current
        );
        setExpandedSubtaskParents((current) => {
          const next = new Set(current);
          for (const taskId of deletedTaskIds) {
            next.delete(taskId);
          }
          return next;
        });
        setSelectedSubtaskParents((current) => {
          const next = new Set(current);
          for (const taskId of deletedTaskIds) {
            next.delete(taskId);
          }
          return next;
        });
        setTaskToDelete(null);
        showToast(`משימה ${taskToDelete.taskId} נמחקה`, "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.status === 403) {
          throw new Error("אין הרשאה לבצע פעולה זו");
        }

        if (error instanceof CreateTaskError && error.status === 404) {
          throw new Error("המשימה לא נמצאה");
        }

        throw new Error("שגיאה במחיקת המשימה");
      }
  }, [activeProjectId, showToast, taskToDelete]);

  const openImportTasksModal = () => setActiveModal("importTasks");

  const openImportFilePicker = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFromFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const tasks = await readTaskImportFile(file);
        const { tasks: importedTasks, importedCount } = await importTasksApi(activeProjectId, {
          tasks,
        });
        setTasks((current) =>
          applyTaskUpdates(
            current,
            importedTasks.map((task) => ({ task }))
          )
        );
        showToast(`${importedCount} משימות יובאו מקובץ`, "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.status === 403) {
          showToast("אין הרשאה לבצע פעולה זו", "error");
        } else {
          showToast(getTaskImportErrorMessage(error), "error");
        }
      } finally {
        event.target.value = "";
      }
    },
    [activeProjectId, showToast]
  );

  const handleExportTasks = useCallback(async () => {
    try {
      const tasksToExport = await fetchTasks(activeProjectId);

      if (tasksToExport.length === 0) {
        showToast("אין משימות לייצוא", "info");
        return;
      }

      const filename = activeProject
        ? `tasks-${activeProject.name.replace(/[^\w\u0590-\u05FF-]+/g, "-")}.json`
        : undefined;
      const { parents, subtasks, total } = exportTasksToJsonFile(tasksToExport, filename);

      showToast(
        subtasks > 0
          ? `${total} משימות יוצאו (${parents} ראשיות ו-${subtasks} תת-משימות)`
          : `${total} משימות יוצאו ל-JSON`,
        "success"
      );
    } catch {
      showToast("שגיאה בייצוא המשימות", "error");
    }
  }, [activeProject, activeProjectId, showToast]);

  const handleExportProject = useCallback(
    async (project: Project) => {
      try {
        const tasksToExport = await fetchTasks(project.projectId);

        if (tasksToExport.length === 0) {
          showToast("אין משימות לייצוא", "info");
          return;
        }

        const filename = `tasks-${project.name.replace(/[^\w\u0590-\u05FF-]+/g, "-")}.json`;
        const { parents, subtasks, total } = exportTasksToJsonFile(tasksToExport, filename);

        showToast(
          subtasks > 0
            ? `${total} משימות יוצאו (${parents} ראשיות ו-${subtasks} תת-משימות)`
            : `${total} משימות יוצאו ל-JSON`,
          "success"
        );
      } catch {
        showToast("שגיאה בייצוא המשימות", "error");
      }
    },
    [showToast]
  );

  const handleSelectProject = useCallback(
    async (projectId: number) => {
      if (projectId === activeProjectId) {
        return;
      }

      setActiveProjectIdCookie(projectId);
      setActiveProjectId(projectId);
      setLoading(true);
      resetBoardUiState();
      sessionStorage.removeItem("isFullSuccessTriggered");

      try {
        const nextTasks = await fetchTasks(projectId);
        setTasks(nextTasks);
      } catch {
        showToast("שגיאה בטעינת המשימות", "error");
      } finally {
        setLoading(false);
      }

      router.replace(`?project=${projectId}`, { scroll: false });
    },
    [activeProjectId, resetBoardUiState, router, showToast]
  );

  const handleCreateProject = useCallback(
    async (name: string) => {
      try {
        const { project } = await createProjectApi(name);
        setProjects((current) => [...current, project]);
        setActiveProjectIdCookie(project.projectId);
        setActiveProjectId(project.projectId);
        setTasks([]);
        setLoading(true);
        resetBoardUiState();
        sessionStorage.removeItem("isFullSuccessTriggered");
        router.replace(`?project=${project.projectId}`, { scroll: false });
        showToast(`הלוח "${project.name}" נוצר`, "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }
        throw new Error("שגיאה ביצירת הלוח");
      } finally {
        setLoading(false);
      }
    },
    [resetBoardUiState, router, showToast]
  );

  const handleRenameProject = useCallback(
    async (projectId: number, name: string) => {
      try {
        const { project } = await updateProjectApi(projectId, name);
        setProjects((current) =>
          current.map((item) => (item.projectId === projectId ? project : item))
        );
        showToast(`שם הלוח עודכן ל-"${project.name}"`, "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }
        throw new Error("שגיאה בעדכון שם הלוח");
      }
    },
    [showToast]
  );

  const handleDeleteProject = useCallback(
    async (projectId: number) => {
      try {
        await deleteProjectApi(projectId);

        const remaining = projects.filter((project) => project.projectId !== projectId);
        setProjects(remaining);

        if (remaining.length === 0) {
          router.refresh();
          return;
        }

        if (projectId === activeProjectId) {
          const nextProject = remaining[0];
          setActiveProjectIdCookie(nextProject.projectId);
          setActiveProjectId(nextProject.projectId);
          setLoading(true);
          resetBoardUiState();
          sessionStorage.removeItem("isFullSuccessTriggered");

          try {
            const nextTasks = await fetchTasks(nextProject.projectId);
            setTasks(nextTasks);
          } catch {
            showToast("שגיאה בטעינת המשימות", "error");
          } finally {
            setLoading(false);
          }

          router.replace(`?project=${nextProject.projectId}`, { scroll: false });
        }

        showToast("הלוח נמחק", "success");
      } catch (error) {
        if (error instanceof CreateTaskError && error.message) {
          throw new Error(error.message);
        }
        throw new Error("שגיאה במחיקת הלוח");
      }
    },
    [activeProjectId, projects, resetBoardUiState, router, showToast]
  );

  const handleAddSubtaskRequest = useCallback((task: Task) => {
    setSubtaskParent(task);
    setActiveModal("addTask");
    setExpandedTaskId(task.taskId);
    setExpandedSubtaskParents((current) => {
      const next = new Set(current);
      next.add(task.taskId);
      return next;
    });
  }, []);

  const emptyBoard = !loading && totalCount === 0;
  const noFilterResults = !loading && totalCount > 0 && filteredTasks.length === 0;
  const showTaskBoard = (isAdmin && emptyBoard) || (!emptyBoard && !noFilterResults);

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
      <Header user={user} />

      <ProjectListBar
        projects={projects}
        activeProjectId={activeProjectId}
        isAdmin={isAdmin}
        onSelectProject={(projectId) => void handleSelectProject(projectId)}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onExportProject={(project) => void handleExportProject(project)}
      />

      <input
        ref={importFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={(event) => void handleImportFromFile(event)}
        className="hidden"
      />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            טוען משימות...
          </div>
        ) : (
          <>
            <div className="flex justify-end gap-2 flex-wrap">
              <Link
                href={`/notes?project=${activeProjectId}`}
                title={boardNotesCount > 0 ? `פתקים (${boardNotesCount})` : "פתקים"}
                aria-label={boardNotesCount > 0 ? `פתקים (${boardNotesCount})` : "פתקים"}
                className="relative inline-flex items-center justify-center p-1 transition opacity-90 hover:opacity-100"
              >
                <Image
                  src="/notes-icon.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                {boardNotesCount > 0 ? (
                  <span className="absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                    {boardNotesCount > 99 ? "99+" : boardNotesCount}
                  </span>
                ) : null}
              </Link>
            </div>

            {totalCount > 0 ? <MetricsDashboard tasks={topLevelTasks} /> : null}

            {totalCount > 0 ? (
              <FiltersBar
                totalCount={totalCount}
                filteredCount={filteredTasks.length}
                searchQuery={searchQuery}
                filterPriority={filterPriority}
                filterStatus={filterStatus}
                onSearchChange={setSearchQuery}
                onPriorityChange={setFilterPriority}
                onStatusChange={setFilterStatus}
                onResetFilters={handleResetFilters}
              />
            ) : null}

            <section className="flex-1 flex flex-col">
              {emptyBoard && !isAdmin ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm text-center">
                  <div className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-3">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    אין משימות עדיין
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">הלוח ריק. אין משימות להצגה.</p>
                </div>
              ) : null}

              {emptyBoard && isAdmin ? (
                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                  הלוח ריק. הוסף משימה מהשורה בתחתית הטבלה, או ייבא מקובץ JSON.
                </p>
              ) : null}

              {showTaskBoard ? (
                <>
                  <SubtaskBulkBar
                    visible={
                      isAdmin
                        ? showTaskBoard
                        : visibleSelectableParentTasks.length > 0
                    }
                    allSelected={allSubtaskParentsSelected}
                    someSelected={someSubtaskParentsSelected}
                    selectedCount={selectedSubtaskParents.size}
                    showDelete={isAdmin}
                    showSelectAll={visibleSelectableParentTasks.length > 0}
                    showImportExportMenu={isAdmin}
                    canExport={tasks.length > 0}
                    onSelectAll={handleSelectAllSubtaskParents}
                    onCloseAll={handleCloseAllSubtasks}
                    onDeleteSelected={handleDeleteSelectedRequest}
                    onExport={handleExportTasks}
                    onImportFromFile={openImportFilePicker}
                    onImportJson={openImportTasksModal}
                  />
                  <TaskTable
                    tasks={filteredTasks}
                    allTasks={tasks}
                    readOnly={readOnly}
                    isAdmin={isAdmin}
                    canReorder={canReorder}
                    expandedTaskId={expandedTaskId}
                    onToggleExpand={handleToggleExpand}
                    onNoteChange={handleNoteChange}
                    onPriorityChange={handlePriorityChange}
                    onStatusChange={handleStatusChange}
                    onDeleteRequest={isAdmin ? handleDeleteRequest : () => {}}
                    onAddSubtaskRequest={handleAddSubtaskRequest}
                    onEditTitleRequest={handleEditTitleRequest}
                    onEditDetailsRequest={handleEditDetailsRequest}
                    onReorderTasks={handleReorderTasks}
                    isSubtasksVisible={isSubtasksVisible}
                    onToggleSubtasksVisibility={handleToggleSubtasksVisibility}
                    selectedSubtaskParents={selectedSubtaskParents}
                    onSelectSubtaskParent={handleSelectSubtaskParent}
                    showSubtaskSelection={visibleSelectableParentTasks.length > 0}
                    customColumns={customColumns}
                    onCustomFieldChange={handleCustomFieldChange}
                    onAddCustomColumn={isAdmin ? handleAddCustomColumn : undefined}
                    onDeleteCustomColumn={isAdmin ? handleDeleteCustomColumn : undefined}
                    onReorderCustomColumns={isAdmin ? handleReorderCustomColumns : undefined}
                    onAddTask={isAdmin ? handleAddTask : undefined}
                    addTaskExpanded={addTaskExpanded}
                    onAddTaskExpandedChange={setAddTaskExpanded}
                  />
                  <TaskCards
                    tasks={filteredTasks}
                    allTasks={tasks}
                    readOnly={readOnly}
                    isAdmin={isAdmin}
                    canReorder={canReorder}
                    expandedTaskId={expandedTaskId}
                    onToggleExpand={handleToggleExpand}
                    onNoteChange={handleNoteChange}
                    onPriorityChange={handlePriorityChange}
                    onStatusChange={handleStatusChange}
                    onDeleteRequest={isAdmin ? handleDeleteRequest : () => {}}
                    onAddSubtaskRequest={handleAddSubtaskRequest}
                    onEditTitleRequest={handleEditTitleRequest}
                    onEditDetailsRequest={handleEditDetailsRequest}
                    onReorderTasks={handleReorderTasks}
                    isSubtasksVisible={isSubtasksVisible}
                    onToggleSubtasksVisibility={handleToggleSubtasksVisibility}
                    selectedSubtaskParents={selectedSubtaskParents}
                    onSelectSubtaskParent={handleSelectSubtaskParent}
                    showSubtaskSelection={visibleSelectableParentTasks.length > 0}
                    onAddTask={isAdmin ? handleAddTask : undefined}
                    addTaskExpanded={addTaskExpanded}
                    onAddTaskExpandedChange={setAddTaskExpanded}
                  />
                </>
              ) : null}

              {noFilterResults ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm text-center">
                  <div className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-3">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    לא נמצאו משימות
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    נסה לשנות את הסינון או את מילות החיפוש שלך
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow"
                  >
                    אפס סינונים
                  </button>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 dark:bg-slate-800 dark:border-slate-700 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <div>לוח משימות • 2026</div>
        </div>
      </footer>

      <AddTaskModal
        open={activeModal === "addTask"}
        parentTask={subtaskParent}
        onClose={closeModal}
        onSubmit={handleAddTask}
      />

      <ImportTasksModal
        open={activeModal === "importTasks"}
        onClose={closeModal}
        onSubmit={handleImportTasks}
      />

      <DeleteTaskModal
        open={taskToDelete !== null}
        task={taskToDelete}
        onClose={closeDeleteModal}
        onSubmit={handleDeleteTask}
      />

      <DeleteSelectedTasksModal
        open={deleteSelectedOpen}
        tasks={selectedTasksForDelete}
        onClose={() => setDeleteSelectedOpen(false)}
        onSubmit={handleDeleteSelectedTasks}
      />

      <EditTaskFieldModal
        open={editField !== null}
        task={editField?.task ?? null}
        field={editField?.field ?? null}
        onClose={closeEditFieldModal}
        onSubmit={handleEditFieldSubmit}
      />

      <Modal open={activeModal === "celebration"} onClose={closeModal} className="max-w-md">
        <div className="text-center pt-2">
          <div className="text-5xl mb-4 animate-bounce">🏆</div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">כל הכבוד!</h3>
          <p className="text-emerald-500 font-semibold text-lg mt-1">
            כל {totalCount} המשימות הושלמו בהצלחה!
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            עברת על כל המשימות בהצלחה. כל הכבוד על ההתקדמות! 🚀
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold transition shadow-md shadow-amber-500/20"
            >
              איזה יופי, חזור ללוח
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

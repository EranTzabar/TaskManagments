"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import EditPencilButton from "@/components/ui/EditPencilButton";
import CreateProjectModal from "./CreateProjectModal";
import DeleteProjectModal from "./DeleteProjectModal";
import EditProjectModal from "./EditProjectModal";

interface ProjectListBarProps {
  projects: Project[];
  activeProjectId: number;
  isAdmin: boolean;
  onSelectProject: (projectId: number) => void;
  onCreateProject: (name: string) => Promise<void>;
  onRenameProject: (projectId: number, name: string) => Promise<void>;
  onDeleteProject: (projectId: number) => Promise<void>;
  onExportProject: (project: Project) => void;
}

export default function ProjectListBar({
  projects,
  activeProjectId,
  isAdmin,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onExportProject,
}: ProjectListBarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleCreateProject = async (name: string) => {
    await onCreateProject(name);
    setCreateOpen(false);
  };

  const handleRenameProject = async (projectId: number, name: string) => {
    await onRenameProject(projectId, name);
    setProjectToEdit(null);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      return;
    }

    await onDeleteProject(projectToDelete.projectId);
    setProjectToDelete(null);
  };

  return (
    <>
      <div className="bg-white border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {projects.map((project) => {
              const isActive = project.projectId === activeProjectId;

              return (
                <div
                  key={project.projectId}
                  className={`flex items-center shrink-0 rounded-lg border transition ${
                    isActive
                      ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectProject(project.projectId)}
                    className={`px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {project.name}
                  </button>

                  {isAdmin ? (
                    <>
                      <EditPencilButton
                        onClick={() => setProjectToEdit(project)}
                        label={`ערוך שם לוח ${project.name}`}
                      />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        className="px-2 py-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                        title="מחק לוח"
                        aria-label={`מחק לוח ${project.name}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </>
                  ) : null}
                </div>
              );
            })}

            {isAdmin ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition dark:text-indigo-300 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:border-indigo-800"
                title="לוח חדש"
              >
                +
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateProject}
      />

      <EditProjectModal
        open={projectToEdit != null}
        project={projectToEdit}
        onClose={() => setProjectToEdit(null)}
        onSubmit={handleRenameProject}
      />

      <DeleteProjectModal
        open={projectToDelete != null}
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onExport={() => {
          if (projectToDelete) {
            onExportProject(projectToDelete);
          }
        }}
        onSubmit={handleDeleteProject}
      />
    </>
  );
}

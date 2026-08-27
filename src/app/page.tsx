import LoginPage from "@/components/auth/LoginPage";
import EmptyProjectsPage from "@/components/layout/EmptyProjectsPage";
import TaskTracker from "@/components/tasks/TaskTracker";
import { ACTIVE_PROJECT_COOKIE } from "@/lib/activeProject";
import { getAuthenticatedUserFromCookies } from "@/lib/auth";
import { getProjectsForUser } from "@/lib/projectAccess";
import { resolveActiveProjectId } from "@/lib/projects";
import { getBoardNotes } from "@/lib/boardNotes";
import { getTasks } from "@/lib/tasks";
import { Project, Task } from "@/lib/types";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: { project?: string };
}) {
  const user = await getAuthenticatedUserFromCookies();

  if (!user) {
    return <LoginPage />;
  }

  let projects: Project[] = [];

  try {
    projects = await getProjectsForUser(user);
  } catch (error) {
    console.error("Failed to load projects:", error);
  }

  if (projects.length === 0) {
    return <EmptyProjectsPage user={{ username: user.username, role: user.role }} />;
  }

  const activeProjectId = resolveActiveProjectId(
    projects,
    searchParams?.project ?? cookies().get(ACTIVE_PROJECT_COOKIE)?.value
  );

  if (activeProjectId == null) {
    return <EmptyProjectsPage user={{ username: user.username, role: user.role }} />;
  }

  let tasks: Task[] = [];
  let boardNotesCount = 0;

  try {
    [tasks, boardNotesCount] = await Promise.all([
      getTasks(activeProjectId),
      getBoardNotes(activeProjectId).then((notes) => notes.length),
    ]);
  } catch (error) {
    console.error("Failed to load initial tasks:", error);
  }

  return (
    <TaskTracker
      initialTasks={tasks}
      initialProjects={projects}
      activeProjectId={activeProjectId}
      initialBoardNotesCount={boardNotesCount}
      user={{ username: user.username, role: user.role }}
    />
  );
}

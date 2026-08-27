import BoardNotesPage from "@/components/notes/BoardNotesPage";
import { ACTIVE_PROJECT_COOKIE } from "@/lib/activeProject";
import { getAuthenticatedUserFromCookies } from "@/lib/auth";
import { getBoardNotes } from "@/lib/boardNotes";
import { getProjectsForUser, userHasProjectAccess } from "@/lib/projectAccess";
import { getProjectById, resolveActiveProjectId } from "@/lib/projects";
import { BoardNote, Project } from "@/lib/types";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams?: { project?: string };
}) {
  const user = await getAuthenticatedUserFromCookies();

  if (!user) {
    redirect("/");
  }

  let projects: Project[] = [];

  try {
    projects = await getProjectsForUser(user);
  } catch (error) {
    console.error("Failed to load projects for notes page:", error);
    redirect("/");
  }

  if (projects.length === 0) {
    redirect("/");
  }

  const activeProjectId = resolveActiveProjectId(
    projects,
    searchParams?.project ?? cookies().get(ACTIVE_PROJECT_COOKIE)?.value
  );

  if (activeProjectId == null) {
    redirect("/");
  }

  const hasAccess = await userHasProjectAccess(user, activeProjectId);
  if (!hasAccess) {
    redirect("/");
  }

  let project: Project | null = null;
  let notes: BoardNote[] = [];

  try {
    [project, notes] = await Promise.all([
      getProjectById(activeProjectId),
      getBoardNotes(activeProjectId),
    ]);
  } catch (error) {
    console.error("Failed to load board notes:", error);
    redirect("/");
  }

  if (!project) {
    redirect("/");
  }

  return (
    <BoardNotesPage
      user={{ username: user.username, role: user.role }}
      project={project}
      initialNotes={notes}
    />
  );
}

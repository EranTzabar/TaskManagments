import UsersAdminPage from "@/components/users/UsersAdminPage";
import { getAuthenticatedUserFromCookies } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { getUsers } from "@/lib/users";
import { Project, UserListItem } from "@/lib/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getAuthenticatedUserFromCookies();

  if (!user) {
    redirect("/");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  let users: UserListItem[] = [];
  let projects: Project[] = [];

  try {
    [users, projects] = await Promise.all([getUsers(), getProjects()]);
  } catch (error) {
    console.error("Failed to load users:", error);
  }

  return (
    <UsersAdminPage
      user={{ username: user.username, role: user.role }}
      currentUserId={user.id}
      initialUsers={users}
      projects={projects}
    />
  );
}

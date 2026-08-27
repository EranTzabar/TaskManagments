import { NextRequest, NextResponse } from "next/server";
import { parseProjectIdParam } from "@/lib/activeProject";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { deleteAllTasks } from "@/lib/tasks";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const projectId = parseProjectIdParam(request.nextUrl.searchParams.get("projectId"));
    if (projectId == null) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const deletedCount = await deleteAllTasks(projectId);
    return NextResponse.json({ deletedCount });
  } catch (error) {
    console.error("POST /api/tasks/delete-all failed:", error);
    return NextResponse.json(
      { error: "Failed to delete all tasks" },
      { status: 500 }
    );
  }
}

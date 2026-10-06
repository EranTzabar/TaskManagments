import { NextRequest, NextResponse } from "next/server";
import { parseProjectIdParam } from "@/lib/activeProject";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { setTasksArchived } from "@/lib/tasks";

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

    const body = (await request.json()) as { taskIds?: unknown; archived?: unknown };
    if (!Array.isArray(body.taskIds) || typeof body.archived !== "boolean") {
      return NextResponse.json(
        { error: "taskIds and archived are required" },
        { status: 400 }
      );
    }

    const taskIds = body.taskIds.filter((id): id is number => typeof id === "number");
    const result = await setTasksArchived(projectId, taskIds, body.archived);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update archive";
    console.error("POST /api/tasks/archive failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

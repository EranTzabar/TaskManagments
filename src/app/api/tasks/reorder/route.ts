import { NextRequest, NextResponse } from "next/server";
import { parseProjectIdParam } from "@/lib/activeProject";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { reorderTasks } from "@/lib/tasks";
import { TaskReorderPayload } from "@/lib/types";

function getProjectIdFromRequest(request: NextRequest, bodyProjectId?: unknown): number | null {
  const fromQuery = parseProjectIdParam(request.nextUrl.searchParams.get("projectId"));
  if (fromQuery != null) {
    return fromQuery;
  }

  if (typeof bodyProjectId === "number" && !Number.isNaN(bodyProjectId)) {
    return bodyProjectId;
  }

  if (typeof bodyProjectId === "string") {
    return parseProjectIdParam(bodyProjectId);
  }

  return null;
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const body = (await request.json()) as TaskReorderPayload & { projectId?: number };
    const projectId = getProjectIdFromRequest(request, body.projectId);
    if (projectId == null) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const parentTaskId =
      body.parentTaskId == null || body.parentTaskId === undefined
        ? null
        : Number(body.parentTaskId);

    if (parentTaskId != null && Number.isNaN(parentTaskId)) {
      return NextResponse.json({ error: "Invalid parent task id" }, { status: 400 });
    }

    const tasks = await reorderTasks(projectId, parentTaskId, body.orderedTaskIds);

    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder tasks";
    console.error("PATCH /api/tasks/reorder failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

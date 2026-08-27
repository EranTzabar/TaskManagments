import { NextRequest, NextResponse } from "next/server";
import { parseProjectIdParam } from "@/lib/activeProject";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { deleteTask, updateTask } from "@/lib/tasks";
import { TaskUpdatePayload } from "@/lib/types";

interface RouteParams {
  params: {
    id: string;
  };
}

function getProjectIdFromRequest(request: NextRequest): number | null {
  return parseProjectIdParam(request.nextUrl.searchParams.get("projectId"));
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const projectId = getProjectIdFromRequest(request);
    if (projectId == null) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const taskId = Number(params.id);

    if (Number.isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const body = (await request.json()) as TaskUpdatePayload;

    const hasNotes = typeof body.notes === "string";
    const hasPriority = typeof body.priority === "string";
    const hasStatus = typeof body.status === "string";
    const hasTitle = typeof body.title === "string";
    const hasDetails = typeof body.details === "string";
    const hasCustomFields =
      body.customFields != null && typeof body.customFields === "object";

    if (!hasNotes && !hasPriority && !hasStatus && !hasTitle && !hasDetails && !hasCustomFields) {
      return NextResponse.json(
        {
          error:
            "Payload must include notes, priority, status, title, details, and/or customFields",
        },
        { status: 400 }
      );
    }

    const result = await updateTask(projectId, taskId, body);

    if (!result) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    console.error(`PATCH /api/tasks/${params.id} failed:`, error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const projectId = getProjectIdFromRequest(request);
    if (projectId == null) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const taskId = Number(params.id);

    if (Number.isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
    }

    const { deletedTaskIds, parentTask } = await deleteTask(projectId, taskId);

    if (deletedTaskIds.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ taskId, deletedTaskIds, parentTask });
  } catch (error) {
    console.error(`DELETE /api/tasks/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { parseProjectIdParam } from "@/lib/activeProject";
import { getAuthenticatedUser, requireAdmin, requireAuth } from "@/lib/auth";
import { requireProjectAccess } from "@/lib/projectAccess";
import { createTask, getTasks, validateTaskCreateInput } from "@/lib/tasks";
import { TaskCreatePayload, TaskPriority } from "@/lib/types";

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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const authError = requireAuth(user);
    if (authError) {
      return authError;
    }

    const projectId = getProjectIdFromRequest(request);
    if (projectId == null) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const accessError = await requireProjectAccess(user, projectId);
    if (accessError) {
      return accessError;
    }

    const tasks = await getTasks(projectId);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/tasks failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const body = (await request.json()) as TaskCreatePayload & { projectId?: number };
    const projectId = getProjectIdFromRequest(request, body.projectId);
    if (projectId == null) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const validation = validateTaskCreateInput({
      title: body.title,
      priority: body.priority as TaskPriority,
      details: body.details,
      parentTaskId: body.parentTaskId,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { task, parentTask } = await createTask(projectId, validation.data);
    return NextResponse.json({ task, parentTask }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    console.error("POST /api/tasks failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

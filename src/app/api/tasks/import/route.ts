import { NextRequest, NextResponse } from "next/server";
import { parseProjectIdParam } from "@/lib/activeProject";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { importTasks } from "@/lib/tasks";
import { TaskImportPayload } from "@/lib/types";

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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const body = (await request.json()) as TaskImportPayload & { projectId?: number };
    const projectId = getProjectIdFromRequest(request, body.projectId);
    if (projectId == null) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    if (!Array.isArray(body.tasks)) {
      return NextResponse.json(
        { error: "Payload must include a tasks array" },
        { status: 400 }
      );
    }

    const tasks = await importTasks(projectId, body.tasks);
    return NextResponse.json({ tasks, importedCount: tasks.length }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import tasks";
    console.error("POST /api/tasks/import failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

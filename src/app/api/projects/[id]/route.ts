import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { deleteProject, updateProject, validateProjectName } from "@/lib/projects";
import { ProjectUpdatePayload } from "@/lib/types";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const projectId = Number(params.id);
    if (Number.isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const body = (await request.json()) as ProjectUpdatePayload;
    const nameError = validateProjectName(body.name ?? "");
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const project = await updateProject(projectId, body.name);
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project";
    console.error(`PATCH /api/projects/${params.id} failed:`, error);

    if (message === "Project not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

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

    const projectId = Number(params.id);
    if (Number.isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    await deleteProject(projectId);
    return NextResponse.json({ projectId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete project";
    console.error(`DELETE /api/projects/${params.id} failed:`, error);

    if (message === "Project not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

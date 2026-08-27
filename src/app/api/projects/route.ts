import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAdmin, requireAuth } from "@/lib/auth";
import { createProject, validateProjectName } from "@/lib/projects";
import { getProjectsForUser } from "@/lib/projectAccess";
import { ProjectCreatePayload } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const authError = requireAuth(user);
    if (authError) {
      return authError;
    }

    const projects = await getProjectsForUser(user!);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects failed:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const body = (await request.json()) as ProjectCreatePayload;
    const nameError = validateProjectName(body.name ?? "");
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    const project = await createProject(body.name);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    console.error("POST /api/projects failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

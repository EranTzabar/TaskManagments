import { NextRequest, NextResponse } from "next/server";
import { parseProjectIdParam } from "@/lib/activeProject";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { resetTasks } from "@/lib/tasks";

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

    const tasks = await resetTasks(projectId);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("POST /api/tasks/reset failed:", error);
    return NextResponse.json(
      { error: "Failed to reset tasks" },
      { status: 500 }
    );
  }
}

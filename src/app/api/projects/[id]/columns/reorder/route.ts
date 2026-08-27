import { NextRequest, NextResponse } from "next/server";
import { reorderCustomColumns } from "@/lib/customColumns";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { CustomColumnReorderPayload } from "@/lib/types";

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

    const body = (await request.json()) as CustomColumnReorderPayload;
    if (!Array.isArray(body.orderedColumnIds)) {
      return NextResponse.json({ error: "orderedColumnIds is required" }, { status: 400 });
    }

    const columns = await reorderCustomColumns(projectId, body.orderedColumnIds);
    return NextResponse.json({ columns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder columns";
    console.error(`PATCH /api/projects/${params.id}/columns/reorder failed:`, error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

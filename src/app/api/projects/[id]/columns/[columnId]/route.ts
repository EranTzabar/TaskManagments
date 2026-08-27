import { NextRequest, NextResponse } from "next/server";
import { deleteCustomColumn } from "@/lib/customColumns";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";

interface RouteParams {
  params: {
    id: string;
    columnId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const projectId = Number(params.id);
    const columnId = Number(params.columnId);
    if (Number.isNaN(projectId) || Number.isNaN(columnId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await deleteCustomColumn(projectId, columnId);
    return NextResponse.json({ columnId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete column";
    console.error(
      `DELETE /api/projects/${params.id}/columns/${params.columnId} failed:`,
      error
    );

    if (message === "Column not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

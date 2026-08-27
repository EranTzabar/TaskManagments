import { NextRequest, NextResponse } from "next/server";
import {
  createCustomColumn,
  getCustomColumns,
  validateCustomColumnName,
  validateCustomColumnType,
} from "@/lib/customColumns";
import { getAuthenticatedUser, requireAdmin, requireAuth } from "@/lib/auth";
import { CustomColumnCreatePayload } from "@/lib/types";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    const authError = requireAuth(user);
    if (authError) {
      return authError;
    }

    const projectId = Number(params.id);
    if (Number.isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const columns = await getCustomColumns(projectId);
    return NextResponse.json({ columns });
  } catch (error) {
    console.error(`GET /api/projects/${params.id}/columns failed:`, error);
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body = (await request.json()) as CustomColumnCreatePayload;
    const nameError = validateCustomColumnName(body.name ?? "");
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    if (!validateCustomColumnType(body.type)) {
      return NextResponse.json({ error: "Invalid column type" }, { status: 400 });
    }

    const column = await createCustomColumn(projectId, body.name, body.type);
    return NextResponse.json({ column }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create column";
    console.error(`POST /api/projects/${params.id}/columns failed:`, error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

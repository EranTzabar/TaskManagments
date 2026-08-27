import { NextRequest, NextResponse } from "next/server";
import {
  createBoardNote,
  getBoardNotes,
  validateBoardNoteColor,
  validateBoardNoteContent,
} from "@/lib/boardNotes";
import { getAuthenticatedUser, requireAdmin, requireAuth } from "@/lib/auth";
import { requireProjectAccess } from "@/lib/projectAccess";
import { BoardNoteCreatePayload } from "@/lib/types";

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

    const accessError = await requireProjectAccess(user, projectId);
    if (accessError) {
      return accessError;
    }

    const notes = await getBoardNotes(projectId);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error(`GET /api/projects/${params.id}/notes failed:`, error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
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

    const accessError = await requireProjectAccess(user, projectId);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as BoardNoteCreatePayload;

    if (body.content !== undefined) {
      const contentError = validateBoardNoteContent(body.content);
      if (contentError) {
        return NextResponse.json({ error: contentError }, { status: 400 });
      }
    }

    if (body.color !== undefined && !validateBoardNoteColor(body.color)) {
      return NextResponse.json({ error: "Invalid note color" }, { status: 400 });
    }

    const note = await createBoardNote(projectId, body);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create note";
    console.error(`POST /api/projects/${params.id}/notes failed:`, error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

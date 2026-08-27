import { NextRequest, NextResponse } from "next/server";
import {
  deleteBoardNote,
  updateBoardNote,
  validateBoardNoteColor,
  validateBoardNoteContent,
} from "@/lib/boardNotes";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { requireProjectAccess } from "@/lib/projectAccess";
import { BoardNoteUpdatePayload } from "@/lib/types";

interface RouteParams {
  params: {
    id: string;
    noteId: string;
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
    const noteId = Number(params.noteId);
    if (Number.isNaN(projectId) || Number.isNaN(noteId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const accessError = await requireProjectAccess(user, projectId);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as BoardNoteUpdatePayload;

    if (body.content !== undefined) {
      const contentError = validateBoardNoteContent(body.content);
      if (contentError) {
        return NextResponse.json({ error: contentError }, { status: 400 });
      }
    }

    if (body.color !== undefined && !validateBoardNoteColor(body.color)) {
      return NextResponse.json({ error: "Invalid note color" }, { status: 400 });
    }

    const note = await updateBoardNote(projectId, noteId, body);
    return NextResponse.json({ note });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update note";
    console.error(
      `PATCH /api/projects/${params.id}/notes/${params.noteId} failed:`,
      error
    );

    if (message === "Note not found") {
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
    const noteId = Number(params.noteId);
    if (Number.isNaN(projectId) || Number.isNaN(noteId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const accessError = await requireProjectAccess(user, projectId);
    if (accessError) {
      return accessError;
    }

    await deleteBoardNote(projectId, noteId);
    return NextResponse.json({ noteId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete note";
    console.error(
      `DELETE /api/projects/${params.id}/notes/${params.noteId} failed:`,
      error
    );

    if (message === "Note not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

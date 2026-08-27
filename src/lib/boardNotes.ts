import { connectDB } from "./mongodb";
import BoardNoteModel from "./models/BoardNote";
import {
  BoardNote,
  BoardNoteColor,
  BoardNoteCreatePayload,
  BoardNoteUpdatePayload,
} from "./types";
import {
  BOARD_NOTE_COLORS,
  BOARD_NOTE_CONTENT_MAX_LENGTH,
  BOARD_NOTE_DEFAULT_HEIGHT,
  BOARD_NOTE_DEFAULT_OFFSET,
  BOARD_NOTE_MAX_HEIGHT,
  BOARD_NOTE_MAX_WIDTH,
  BOARD_NOTE_MIN_HEIGHT,
  BOARD_NOTE_MIN_WIDTH,
  BOARD_NOTE_WIDTH,
} from "./utils";

function serializeBoardNote(doc: {
  noteId: number;
  projectId: number;
  content: string;
  color: BoardNoteColor;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}): BoardNote {
  return {
    noteId: doc.noteId,
    projectId: doc.projectId,
    content: doc.content ?? "",
    color: doc.color,
    x: doc.x ?? 40,
    y: doc.y ?? 40,
    width: doc.width ?? BOARD_NOTE_WIDTH,
    height: doc.height ?? BOARD_NOTE_DEFAULT_HEIGHT,
    zIndex: doc.zIndex ?? 1,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

async function getNextNoteId(): Promise<number> {
  const latest = await BoardNoteModel.findOne().sort({ noteId: -1 }).lean();
  return latest ? latest.noteId + 1 : 1;
}

async function getNextZIndex(projectId: number): Promise<number> {
  const latest = await BoardNoteModel.findOne({ projectId }).sort({ zIndex: -1, noteId: -1 }).lean();
  return latest ? (latest.zIndex ?? 0) + 1 : 1;
}

export function validateBoardNoteColor(color: string): color is BoardNoteColor {
  return BOARD_NOTE_COLORS.includes(color as BoardNoteColor);
}

export function validateBoardNoteContent(content: string): string | null {
  if (content.length > BOARD_NOTE_CONTENT_MAX_LENGTH) {
    return `הפתק לא יכול לעלות על ${BOARD_NOTE_CONTENT_MAX_LENGTH} תווים`;
  }

  return null;
}

export function validateBoardNoteDimensions(width: number, height: number): string | null {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < BOARD_NOTE_MIN_WIDTH ||
    width > BOARD_NOTE_MAX_WIDTH ||
    height < BOARD_NOTE_MIN_HEIGHT ||
    height > BOARD_NOTE_MAX_HEIGHT
  ) {
    return "גודל הפתק לא תקין";
  }

  return null;
}

export async function getBoardNotes(projectId: number): Promise<BoardNote[]> {
  await connectDB();
  const docs = await BoardNoteModel.find({ projectId })
    .sort({ zIndex: 1, noteId: 1 })
    .lean();
  return docs.map((doc) =>
    serializeBoardNote({
      noteId: doc.noteId,
      projectId: doc.projectId,
      content: doc.content,
      color: doc.color as BoardNoteColor,
      x: doc.x,
      y: doc.y,
      width: doc.width,
      height: doc.height,
      zIndex: doc.zIndex,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  );
}

export async function createBoardNote(
  projectId: number,
  payload: BoardNoteCreatePayload = {}
): Promise<BoardNote> {
  const content = payload.content ?? "";
  const contentError = validateBoardNoteContent(content);
  if (contentError) {
    throw new Error(contentError);
  }

  const color = payload.color ?? "yellow";
  if (!validateBoardNoteColor(color)) {
    throw new Error("Invalid note color");
  }

  const width = payload.width ?? BOARD_NOTE_WIDTH;
  const height = payload.height ?? BOARD_NOTE_DEFAULT_HEIGHT;
  const sizeError = validateBoardNoteDimensions(width, height);
  if (sizeError) {
    throw new Error(sizeError);
  }

  await connectDB();

  const existingCount = await BoardNoteModel.countDocuments({ projectId });
  const noteId = await getNextNoteId();
  const zIndex = await getNextZIndex(projectId);
  const cascade = existingCount * BOARD_NOTE_DEFAULT_OFFSET;

  const doc = await BoardNoteModel.create({
    noteId,
    projectId,
    content: content.trim(),
    color,
    x: payload.x ?? 40 + cascade,
    y: payload.y ?? 40 + cascade,
    width,
    height,
    zIndex,
  });

  return serializeBoardNote(doc.toObject());
}

export async function updateBoardNote(
  projectId: number,
  noteId: number,
  payload: BoardNoteUpdatePayload
): Promise<BoardNote> {
  const hasContent = payload.content !== undefined;
  const hasColor = payload.color !== undefined;
  const hasX = payload.x !== undefined;
  const hasY = payload.y !== undefined;
  const hasWidth = payload.width !== undefined;
  const hasHeight = payload.height !== undefined;
  const hasZIndex = payload.zIndex !== undefined;

  if (!hasContent && !hasColor && !hasX && !hasY && !hasWidth && !hasHeight && !hasZIndex) {
    throw new Error("No changes provided");
  }

  if (hasContent && payload.content !== undefined) {
    const contentError = validateBoardNoteContent(payload.content);
    if (contentError) {
      throw new Error(contentError);
    }
  }

  if (hasColor && payload.color !== undefined && !validateBoardNoteColor(payload.color)) {
    throw new Error("Invalid note color");
  }

  const nextWidth = hasWidth ? payload.width : undefined;
  const nextHeight = hasHeight ? payload.height : undefined;

  await connectDB();

  const note = await BoardNoteModel.findOne({ noteId, projectId });
  if (!note) {
    throw new Error("Note not found");
  }

  if (nextWidth !== undefined || nextHeight !== undefined) {
    const sizeError = validateBoardNoteDimensions(
      nextWidth ?? note.width ?? BOARD_NOTE_WIDTH,
      nextHeight ?? note.height ?? BOARD_NOTE_DEFAULT_HEIGHT
    );
    if (sizeError) {
      throw new Error(sizeError);
    }
  }

  if (hasContent && payload.content !== undefined) {
    note.content = payload.content.trim();
  }

  if (hasColor && payload.color !== undefined) {
    note.color = payload.color;
  }

  if (hasX && payload.x !== undefined) {
    note.x = payload.x;
  }

  if (hasY && payload.y !== undefined) {
    note.y = payload.y;
  }

  if (hasWidth && payload.width !== undefined) {
    note.width = payload.width;
  }

  if (hasHeight && payload.height !== undefined) {
    note.height = payload.height;
  }

  if (hasZIndex && payload.zIndex !== undefined) {
    note.zIndex = payload.zIndex;
  }

  await note.save();
  return serializeBoardNote(note.toObject());
}

export async function deleteBoardNote(projectId: number, noteId: number): Promise<void> {
  await connectDB();

  const result = await BoardNoteModel.deleteOne({ noteId, projectId });
  if (result.deletedCount === 0) {
    throw new Error("Note not found");
  }
}

export async function deleteBoardNotesForProject(projectId: number): Promise<void> {
  await connectDB();
  await BoardNoteModel.deleteMany({ projectId });
}

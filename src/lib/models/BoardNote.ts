import mongoose, { Document, Model, Schema } from "mongoose";
import { BoardNoteColor } from "../types";
import { BOARD_NOTE_COLORS, BOARD_NOTE_CONTENT_MAX_LENGTH, BOARD_NOTE_DEFAULT_HEIGHT, BOARD_NOTE_WIDTH } from "../utils";

export interface IBoardNoteDocument extends Document {
  noteId: number;
  projectId: number;
  content: string;
  color: BoardNoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const BoardNoteSchema = new Schema<IBoardNoteDocument>(
  {
    noteId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    projectId: {
      type: Number,
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: BOARD_NOTE_CONTENT_MAX_LENGTH,
    },
    color: {
      type: String,
      enum: BOARD_NOTE_COLORS,
      default: "yellow",
      required: true,
    },
    x: {
      type: Number,
      default: 40,
    },
    y: {
      type: Number,
      default: 40,
    },
    width: {
      type: Number,
      default: BOARD_NOTE_WIDTH,
    },
    height: {
      type: Number,
      default: BOARD_NOTE_DEFAULT_HEIGHT,
    },
    zIndex: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.BoardNote) {
  mongoose.deleteModel("BoardNote");
}

const BoardNoteModel: Model<IBoardNoteDocument> =
  mongoose.models.BoardNote ?? mongoose.model<IBoardNoteDocument>("BoardNote", BoardNoteSchema);

export default BoardNoteModel;

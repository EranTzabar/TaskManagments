import mongoose, { Document, Model, Schema } from "mongoose";
import { CustomColumnType } from "../types";
import { CUSTOM_COLUMN_NAME_MAX_LENGTH } from "../utils";

export interface ICustomColumnDocument extends Document {
  columnId: number;
  projectId: number;
  name: string;
  type: CustomColumnType;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomColumnSchema = new Schema<ICustomColumnDocument>(
  {
    columnId: {
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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: CUSTOM_COLUMN_NAME_MAX_LENGTH,
    },
    type: {
      type: String,
      enum: ["text", "number", "date", "link"],
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.CustomColumn) {
  mongoose.deleteModel("CustomColumn");
}

const CustomColumnModel: Model<ICustomColumnDocument> =
  mongoose.models.CustomColumn ??
  mongoose.model<ICustomColumnDocument>("CustomColumn", CustomColumnSchema);

export default CustomColumnModel;

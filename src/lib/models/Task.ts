import mongoose, { Document, Model, Schema } from "mongoose";
import { TaskPriority, TaskStatus } from "../types";
import { TASK_PRIORITIES, TASK_TITLE_MAX_LENGTH } from "../utils";

export interface ITaskDocument extends Document {
  projectId: number;
  taskId: number;
  title: string;
  priority: TaskPriority;
  details: string;
  status: TaskStatus;
  completed?: boolean;
  notes: string;
  parentTaskId?: number | null;
  sortOrder?: number;
  customFields?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    projectId: {
      type: Number,
      required: true,
      index: true,
    },
    taskId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: TASK_TITLE_MAX_LENGTH,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["ממתין להתחלה", "בטיפול", "הושלם"],
      default: "ממתין להתחלה",
    },
    notes: {
      type: String,
      default: "",
    },
    parentTaskId: {
      type: Number,
      default: null,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    customFields: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Task) {
  mongoose.deleteModel("Task");
}

const TaskModel: Model<ITaskDocument> = mongoose.model<ITaskDocument>("Task", TaskSchema);

export default TaskModel;

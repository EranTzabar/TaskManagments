import mongoose, { Document, Model, Schema } from "mongoose";
import { PROJECT_NAME_MAX_LENGTH } from "../utils";

export interface IProjectDocument extends Document {
  projectId: number;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    projectId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: PROJECT_NAME_MAX_LENGTH,
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

if (process.env.NODE_ENV !== "production" && mongoose.models.Project) {
  mongoose.deleteModel("Project");
}

const ProjectModel: Model<IProjectDocument> =
  mongoose.models.Project ?? mongoose.model<IProjectDocument>("Project", ProjectSchema);

export default ProjectModel;

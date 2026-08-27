import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type PresenceResourceType = "avatar" | "name";

export interface IPresenceResourceDocument extends Document {
  resourceId: number;
  type: PresenceResourceType;
  label: string;
  imagePath: string;
  assignedSessionId: string | null;
  assignedAt: Date | null;
}

const PresenceResourceSchema = new Schema<IPresenceResourceDocument>(
  {
    resourceId: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["avatar", "name"],
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    imagePath: {
      type: String,
      default: "",
    },
    assignedSessionId: {
      type: String,
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PresenceResourceSchema.index({ type: 1, resourceId: 1 }, { unique: true });
PresenceResourceSchema.index({ type: 1, assignedSessionId: 1 });

const PresenceResourceModel: Model<IPresenceResourceDocument> =
  mongoose.models.PresenceResource ??
  mongoose.model<IPresenceResourceDocument>("PresenceResource", PresenceResourceSchema);

export default PresenceResourceModel;

export type PopulatedPresenceResource = {
  _id: Types.ObjectId;
  resourceId: number;
  type: PresenceResourceType;
  label: string;
  imagePath: string;
};

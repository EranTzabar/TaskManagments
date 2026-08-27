import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IPresenceResourceDocument } from "./PresenceResource";

export interface IVisitorSessionDocument extends Document {
  sessionId: string;
  nameResource: Types.ObjectId | IPresenceResourceDocument;
  avatarResource: Types.ObjectId | IPresenceResourceDocument;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorSessionSchema = new Schema<IVisitorSessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nameResource: {
      type: Schema.Types.ObjectId,
      ref: "PresenceResource",
      required: true,
    },
    avatarResource: {
      type: Schema.Types.ObjectId,
      ref: "PresenceResource",
      required: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const VisitorSessionModel: Model<IVisitorSessionDocument> =
  mongoose.models.VisitorSession ??
  mongoose.model<IVisitorSessionDocument>("VisitorSession", VisitorSessionSchema);

export default VisitorSessionModel;

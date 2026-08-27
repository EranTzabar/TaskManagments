import mongoose, { Document, Model, Schema } from "mongoose";
import { UserRole } from "../types";

export interface IUserDocument extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  allowedProjectIds?: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      required: true,
    },
    allowedProjectIds: {
      type: [Number],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  mongoose.deleteModel("User");
}

const UserModel: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", UserSchema);

export default UserModel;

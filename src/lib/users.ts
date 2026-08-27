import { connectDB } from "./mongodb";
import UserModel from "./models/User";
import { hashPassword } from "./password";
import {
  normalizeAllowedProjectIds,
  validateAllowedProjectIds,
} from "./projectAccess";
import { UserCreatePayload, UserListItem, UserRole, UserUpdatePayload } from "./types";
import {
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "./utils";

function serializeUser(doc: {
  _id: { toString(): string };
  username: string;
  role: UserRole;
  allowedProjectIds?: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}): UserListItem {
  return {
    id: doc._id.toString(),
    username: doc.username,
    role: doc.role,
    allowedProjectIds:
      doc.allowedProjectIds == null
        ? null
        : [...doc.allowedProjectIds].sort((a, b) => a - b),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();

  if (!trimmed) {
    return "שם משתמש נדרש";
  }

  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return `שם משתמש חייב להכיל לפחות ${USERNAME_MIN_LENGTH} תווים`;
  }

  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return `שם משתמש לא יכול לעלות על ${USERNAME_MAX_LENGTH} תווים`;
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return "שם משתמש יכול להכיל רק אותיות, ספרות, נקודה, מקף וקו תחתון";
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "סיסמה נדרשת";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `סיסמה חייבת להכיל לפחות ${PASSWORD_MIN_LENGTH} תווים`;
  }

  return null;
}

export function validateUserRole(role: string): role is UserRole {
  return role === "admin" || role === "user";
}

async function countAdmins(): Promise<number> {
  return UserModel.countDocuments({ role: "admin" });
}

export async function getUsers(): Promise<UserListItem[]> {
  await connectDB();
  const docs = await UserModel.find().sort({ username: 1 }).lean();
  return docs.map((doc) =>
    serializeUser({
      _id: { toString: () => String(doc._id) },
      username: doc.username,
      role: doc.role as UserRole,
      allowedProjectIds: doc.allowedProjectIds ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })
  );
}

export async function createUser(payload: UserCreatePayload): Promise<UserListItem> {
  const usernameError = validateUsername(payload.username);
  if (usernameError) {
    throw new Error(usernameError);
  }

  const passwordError = validatePassword(payload.password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  if (!validateUserRole(payload.role)) {
    throw new Error("Invalid role");
  }

  await connectDB();

  const username = payload.username.trim();
  const existing = await UserModel.findOne({ username }).lean();
  if (existing) {
    throw new Error("שם המשתמש כבר קיים");
  }

  const passwordHash = await hashPassword(payload.password);
  const allowedProjectIds =
    payload.role === "admin"
      ? null
      : normalizeAllowedProjectIds(payload.allowedProjectIds ?? []);

  if (payload.role === "user") {
    const allowedError = await validateAllowedProjectIds(allowedProjectIds ?? []);
    if (allowedError) {
      throw new Error(allowedError);
    }
  }

  const doc = await UserModel.create({
    username,
    passwordHash,
    role: payload.role,
    allowedProjectIds,
  });

  return serializeUser(doc.toObject());
}

export async function updateUser(
  userId: string,
  payload: UserUpdatePayload,
  actingUserId: string
): Promise<UserListItem> {
  const hasRole = payload.role !== undefined;
  const hasPassword = payload.password !== undefined && payload.password !== "";
  const hasAllowedProjectIds = payload.allowedProjectIds !== undefined;

  if (!hasRole && !hasPassword && !hasAllowedProjectIds) {
    throw new Error("No changes provided");
  }

  if (hasRole && payload.role && !validateUserRole(payload.role)) {
    throw new Error("Invalid role");
  }

  if (hasPassword && payload.password) {
    const passwordError = validatePassword(payload.password);
    if (passwordError) {
      throw new Error(passwordError);
    }
  }

  await connectDB();

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (hasRole && payload.role !== user.role) {
    if (user.role === "admin" && payload.role === "user") {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        throw new Error("לא ניתן להסיר את מנהל המערכת האחרון");
      }

      if (userId === actingUserId) {
        throw new Error("לא ניתן להסיר לעצמך הרשאות מנהל");
      }
    }

    user.role = payload.role!;
  }

  if (hasPassword && payload.password) {
    user.passwordHash = await hashPassword(payload.password);
  }

  const nextRole = hasRole && payload.role ? payload.role : user.role;

  if (hasAllowedProjectIds) {
    if (nextRole === "admin") {
      user.allowedProjectIds = null;
    } else {
      const allowedProjectIds =
        payload.allowedProjectIds == null
          ? null
          : normalizeAllowedProjectIds(payload.allowedProjectIds);

      const allowedError = await validateAllowedProjectIds(allowedProjectIds ?? []);
      if (allowedError) {
        throw new Error(allowedError);
      }

      user.allowedProjectIds = allowedProjectIds;
    }
  } else if (hasRole && payload.role === "admin") {
    user.allowedProjectIds = null;
  } else if (hasRole && payload.role === "user" && user.allowedProjectIds == null) {
    user.allowedProjectIds = [];
  }

  await user.save();
  return serializeUser(user.toObject());
}

export async function deleteUser(userId: string, actingUserId: string): Promise<void> {
  await connectDB();

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (userId === actingUserId) {
    throw new Error("לא ניתן למחוק את המשתמש המחובר");
  }

  if (user.role === "admin") {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      throw new Error("לא ניתן למחוק את מנהל המערכת האחרון");
    }
  }

  await UserModel.deleteOne({ _id: user._id });
}

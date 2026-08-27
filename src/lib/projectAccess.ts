import { connectDB } from "./mongodb";
import UserModel from "./models/User";
import { getProjects } from "./projects";
import { forbiddenResponse, unauthorizedResponse } from "./auth";
import { AuthUser, Project, UserRole } from "./types";
import { NextResponse } from "next/server";

export async function getAllowedProjectIdsForUser(
  userId: string,
  role: UserRole
): Promise<number[] | null> {
  if (role === "admin") {
    return null;
  }

  await connectDB();
  const doc = await UserModel.findById(userId).select("allowedProjectIds").lean();
  if (!doc) {
    return [];
  }

  if (doc.allowedProjectIds == null) {
    return null;
  }

  return doc.allowedProjectIds;
}

export async function userHasProjectAccess(user: AuthUser, projectId: number): Promise<boolean> {
  if (user.role === "admin") {
    return true;
  }

  const allowed = await getAllowedProjectIdsForUser(user.id, user.role);
  if (allowed === null) {
    return true;
  }

  return allowed.includes(projectId);
}

export async function requireProjectAccess(
  user: AuthUser | null,
  projectId: number
): Promise<NextResponse | null> {
  if (!user) {
    return unauthorizedResponse();
  }

  const hasAccess = await userHasProjectAccess(user, projectId);
  return hasAccess ? null : forbiddenResponse();
}

export async function getProjectsForUser(user: AuthUser): Promise<Project[]> {
  const allProjects = await getProjects();
  if (user.role === "admin") {
    return allProjects;
  }

  const allowed = await getAllowedProjectIdsForUser(user.id, user.role);
  if (allowed === null) {
    return allProjects;
  }

  return allProjects.filter((project) => allowed.includes(project.projectId));
}

export async function validateAllowedProjectIds(projectIds: number[]): Promise<string | null> {
  if (projectIds.length === 0) {
    return null;
  }

  const uniqueIds = [...new Set(projectIds)];
  if (uniqueIds.length !== projectIds.length) {
    return "רשימת לוחות לא תקינה";
  }

  const projects = await getProjects();
  const validIds = new Set(projects.map((project) => project.projectId));

  for (const projectId of projectIds) {
    if (!validIds.has(projectId)) {
      return "לוח לא קיים";
    }
  }

  return null;
}

export function normalizeAllowedProjectIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => Number(item)).filter((item) => !Number.isNaN(item)))];
}

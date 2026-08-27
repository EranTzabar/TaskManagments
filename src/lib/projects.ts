import { deleteCustomColumnsForProject } from "./customColumns";
import { deleteBoardNotesForProject } from "./boardNotes";
import { connectDB } from "./mongodb";
import ProjectModel from "./models/Project";
import TaskModel from "./models/Task";
import { Project } from "./types";
import { PROJECT_NAME_MAX_LENGTH } from "./utils";

const DEFAULT_PROJECT_NAME = "פרויקט ראשון";

function serializeProject(doc: {
  projectId: number;
  name: string;
  sortOrder?: number;
}): Project {
  return {
    projectId: doc.projectId,
    name: doc.name,
    sortOrder: doc.sortOrder ?? 0,
  };
}

async function getNextProjectId(): Promise<number> {
  const latest = await ProjectModel.findOne().sort({ projectId: -1 }).lean();
  return latest ? latest.projectId + 1 : 1;
}

async function getNextProjectSortOrder(): Promise<number> {
  const latest = await ProjectModel.findOne().sort({ sortOrder: -1, projectId: -1 }).lean();
  return latest ? (latest.sortOrder ?? 0) + 1 : 0;
}

export function validateProjectName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return "שם הלוח נדרש";
  }

  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) {
    return `שם הלוח לא יכול לעלות על ${PROJECT_NAME_MAX_LENGTH} תווים`;
  }

  return null;
}

export async function ensureDefaultProject(): Promise<void> {
  await connectDB();

  const projectCount = await ProjectModel.countDocuments();
  if (projectCount > 0) {
    const tasksWithoutProject = await TaskModel.countDocuments({
      $or: [{ projectId: { $exists: false } }, { projectId: null }],
    });

    if (tasksWithoutProject > 0) {
      const firstProject = await ProjectModel.findOne()
        .sort({ sortOrder: 1, projectId: 1 })
        .lean();

      if (firstProject) {
        await TaskModel.updateMany(
          { $or: [{ projectId: { $exists: false } }, { projectId: null }] },
          { projectId: firstProject.projectId }
        );
      }
    }

    return;
  }

  const taskCount = await TaskModel.countDocuments();
  if (taskCount > 0) {
    await ProjectModel.create({
      projectId: 1,
      name: DEFAULT_PROJECT_NAME,
      sortOrder: 0,
    });
    await TaskModel.updateMany({}, { projectId: 1 });
  }
}

export async function getProjects(): Promise<Project[]> {
  await connectDB();
  await ensureDefaultProject();

  const docs = await ProjectModel.find().sort({ sortOrder: 1, projectId: 1 }).lean();
  return docs.map((doc) => serializeProject(doc));
}

export function resolveActiveProjectId(
  projects: Project[],
  cookieValue: string | undefined
): number | null {
  if (projects.length === 0) {
    return null;
  }

  const parsed = cookieValue ? Number(cookieValue) : Number.NaN;
  if (!Number.isNaN(parsed) && projects.some((project) => project.projectId === parsed)) {
    return parsed;
  }

  return projects[0].projectId;
}

export async function createProject(name: string): Promise<Project> {
  const nameError = validateProjectName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  await connectDB();
  await ensureDefaultProject();

  const trimmedName = name.trim();
  const projectId = await getNextProjectId();
  const sortOrder = await getNextProjectSortOrder();

  const doc = await ProjectModel.create({
    projectId,
    name: trimmedName,
    sortOrder,
  });

  return serializeProject(doc.toObject());
}

export async function updateProject(projectId: number, name: string): Promise<Project> {
  const nameError = validateProjectName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  await connectDB();

  const trimmedName = name.trim();
  const doc = await ProjectModel.findOneAndUpdate(
    { projectId },
    { name: trimmedName },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) {
    throw new Error("Project not found");
  }

  return serializeProject(doc);
}

export async function deleteProject(projectId: number): Promise<void> {
  await connectDB();

  const project = await ProjectModel.findOne({ projectId }).lean();
  if (!project) {
    throw new Error("Project not found");
  }

  await TaskModel.deleteMany({ projectId });
  await deleteCustomColumnsForProject(projectId);
  await deleteBoardNotesForProject(projectId);
  await ProjectModel.deleteOne({ projectId });
}

export async function getProjectById(projectId: number): Promise<Project | null> {
  await connectDB();
  await ensureDefaultProject();

  const doc = await ProjectModel.findOne({ projectId }).lean();
  return doc ? serializeProject(doc) : null;
}

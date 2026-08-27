import { randomUUID } from "crypto";
import { connectDB } from "./mongodb";
import PresenceResourceModel, {
  IPresenceResourceDocument,
  PopulatedPresenceResource,
} from "./models/PresenceResource";
import VisitorSessionModel, { IVisitorSessionDocument } from "./models/Session";
import {
  MAX_ONLINE_USERS,
  PRESENCE_AVATAR_CATALOG,
  PRESENCE_NAME_CATALOG,
  PRESENCE_STALE_MS,
} from "./presenceCatalog";
import { PresenceSyncResponse, PresenceUser } from "./types";

type PopulatedVisitorSession = Omit<IVisitorSessionDocument, "nameResource" | "avatarResource"> & {
  nameResource: PopulatedPresenceResource;
  avatarResource: PopulatedPresenceResource;
};

async function ensurePresenceResources(): Promise<void> {
  const expectedCount =
    PRESENCE_NAME_CATALOG.length + PRESENCE_AVATAR_CATALOG.length;
  const count = await PresenceResourceModel.countDocuments();
  if (count >= expectedCount) {
    return;
  }

  await Promise.all([
    ...PRESENCE_NAME_CATALOG.map((entry) =>
      PresenceResourceModel.updateOne(
        { type: "name", resourceId: entry.resourceId },
        {
          $setOnInsert: {
            type: "name",
            resourceId: entry.resourceId,
            label: entry.label,
            imagePath: "",
            assignedSessionId: null,
            assignedAt: null,
          },
        },
        { upsert: true }
      )
    ),
    ...PRESENCE_AVATAR_CATALOG.map((entry) =>
      PresenceResourceModel.updateOne(
        { type: "avatar", resourceId: entry.resourceId },
        {
          $setOnInsert: {
            type: "avatar",
            resourceId: entry.resourceId,
            label: "",
            imagePath: entry.imagePath,
            assignedSessionId: null,
            assignedAt: null,
          },
        },
        { upsert: true }
      )
    ),
  ]);
}

async function purgeStaleSessions(): Promise<void> {
  const cutoff = new Date(Date.now() - PRESENCE_STALE_MS);
  const staleSessions = await VisitorSessionModel.find({
    lastSeenAt: { $lt: cutoff },
  }).lean();

  if (staleSessions.length === 0) {
    return;
  }

  const staleSessionIds = staleSessions.map((session) => session.sessionId);

  await PresenceResourceModel.updateMany(
    { assignedSessionId: { $in: staleSessionIds } },
    { $set: { assignedSessionId: null, assignedAt: null } }
  );

  await VisitorSessionModel.deleteMany({
    sessionId: { $in: staleSessionIds },
  });
}

async function pickAndAssignResource(
  type: "name" | "avatar",
  sessionId: string
): Promise<IPresenceResourceDocument | null> {
  const available = await PresenceResourceModel.find({
    type,
    assignedSessionId: null,
  }).lean();

  if (available.length === 0) {
    return null;
  }

  const picked = available[Math.floor(Math.random() * available.length)];

  return PresenceResourceModel.findOneAndUpdate(
    { _id: picked._id, assignedSessionId: null },
    {
      $set: {
        assignedSessionId: sessionId,
        assignedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
}

async function releaseResourcesForSession(sessionId: string): Promise<void> {
  await PresenceResourceModel.updateMany(
    { assignedSessionId: sessionId },
    { $set: { assignedSessionId: null, assignedAt: null } }
  );
}

async function createVisitorSession(): Promise<IVisitorSessionDocument | null> {
  const activeAvatars = await PresenceResourceModel.countDocuments({
    type: "avatar",
    assignedSessionId: { $ne: null },
  });

  if (activeAvatars >= MAX_ONLINE_USERS) {
    return null;
  }

  const sessionId = randomUUID();
  const nameResource = await pickAndAssignResource("name", sessionId);

  if (!nameResource) {
    return null;
  }

  const avatarResource = await pickAndAssignResource("avatar", sessionId);

  if (!avatarResource) {
    await releaseResourcesForSession(sessionId);
    return null;
  }

  return VisitorSessionModel.create({
    sessionId,
    nameResource: nameResource._id,
    avatarResource: avatarResource._id,
    lastSeenAt: new Date(),
  });
}

function toPresenceUser(
  session: PopulatedVisitorSession,
  isSelf = false
): PresenceUser {
  return {
    nameLabel: session.nameResource.label,
    avatarPath: session.avatarResource.imagePath,
    nameResourceId: session.nameResource.resourceId,
    avatarResourceId: session.avatarResource.resourceId,
    isSelf,
  };
}

async function getPopulatedSessions(): Promise<PopulatedVisitorSession[]> {
  return VisitorSessionModel.find()
    .populate<{ nameResource: PopulatedPresenceResource }>("nameResource")
    .populate<{ avatarResource: PopulatedPresenceResource }>("avatarResource")
    .sort({ createdAt: 1 })
    .lean() as Promise<PopulatedVisitorSession[]>;
}

async function getPopulatedSession(
  sessionId: string
): Promise<PopulatedVisitorSession | null> {
  return VisitorSessionModel.findOne({ sessionId })
    .populate<{ nameResource: PopulatedPresenceResource }>("nameResource")
    .populate<{ avatarResource: PopulatedPresenceResource }>("avatarResource")
    .lean() as Promise<PopulatedVisitorSession | null>;
}

export async function syncPresence(
  sessionId?: string | null
): Promise<PresenceSyncResponse> {
  await connectDB();
  await ensurePresenceResources();
  await purgeStaleSessions();

  let currentSession: IVisitorSessionDocument | null = null;

  if (sessionId) {
    currentSession = await VisitorSessionModel.findOne({ sessionId });

    if (currentSession) {
      currentSession.lastSeenAt = new Date();
      await currentSession.save();
    }
  }

  if (!currentSession) {
    currentSession = await createVisitorSession();
  }

  const allSessions = await getPopulatedSessions();
  const activeCount = allSessions.length;

  if (!currentSession) {
    return {
      sessionId: null,
      self: null,
      others: allSessions.slice(0, MAX_ONLINE_USERS).map((session) => toPresenceUser(session)),
      activeCount,
    };
  }

  const populatedSelf = await getPopulatedSession(currentSession.sessionId);

  if (!populatedSelf) {
    return {
      sessionId: null,
      self: null,
      others: allSessions.slice(0, MAX_ONLINE_USERS).map((session) => toPresenceUser(session)),
      activeCount,
    };
  }

  const others = allSessions
    .filter((session) => session.sessionId !== currentSession.sessionId)
    .slice(0, MAX_ONLINE_USERS - 1)
    .map((session) => toPresenceUser(session));

  return {
    sessionId: currentSession.sessionId,
    self: toPresenceUser(populatedSelf, true),
    others,
    activeCount,
  };
}

export async function seedPresenceResources(): Promise<void> {
  await connectDB();
  await PresenceResourceModel.collection.drop().catch(() => undefined);
  await ensurePresenceResources();
}

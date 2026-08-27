import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();
import mongoose from "mongoose";
import PresenceResourceModel from "../src/lib/models/PresenceResource";
import VisitorSessionModel from "../src/lib/models/Session";

const MONGODB_URI = process.env.MONGODB_URI;

async function clearSessions() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  console.log("Releasing assigned presence resources...");
  const resourceResult = await PresenceResourceModel.updateMany(
    { assignedSessionId: { $ne: null } },
    { $set: { assignedSessionId: null, assignedAt: null } }
  );

  console.log("Deleting all visitor sessions...");
  const sessionResult = await VisitorSessionModel.deleteMany({});

  console.log(
    `Done. Removed ${sessionResult.deletedCount ?? 0} session(s) and released ${resourceResult.modifiedCount ?? 0} resource(s).`
  );

  await mongoose.disconnect();
}

clearSessions().catch((error) => {
  console.error("Clear sessions failed:", error);
  process.exit(1);
});

import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();
import mongoose from "mongoose";
import TaskModel from "../src/lib/models/Task";

const MONGODB_URI = process.env.MONGODB_URI;

async function clearTasks() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  console.log("Deleting all tasks...");
  const result = await TaskModel.deleteMany({});

  console.log(`Done. Removed ${result.deletedCount ?? 0} task(s).`);

  await mongoose.disconnect();
}

clearTasks().catch((error) => {
  console.error("Clear tasks failed:", error);
  process.exit(1);
});

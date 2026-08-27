import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import mongoose from "mongoose";
import UserModel from "../src/lib/models/User";
import { hashPassword } from "../src/lib/password";

const MONGODB_URI = process.env.MONGODB_URI;

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (value && !value.startsWith("--")) {
      args[key] = value;
      index += 1;
    }
  }

  return args;
}

async function createUser() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  const args = parseArgs(process.argv.slice(2));
  const username = args.username?.trim();
  const password = args.password;
  const type = args.type?.trim();

  if (!username || !password || !type) {
    console.error(
      "Usage: npm run create-user -- --username <name> --password <pass> --type <admin|user>"
    );
    process.exit(1);
  }

  if (type !== "admin" && type !== "user") {
    throw new Error('Type must be "admin" or "user"');
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const existing = await UserModel.findOne({ username });
  if (existing) {
    throw new Error(`User "${username}" already exists`);
  }

  const passwordHash = await hashPassword(password);
  await UserModel.create({ username, passwordHash, role: type });

  console.log(`Created ${type} user "${username}"`);

  await mongoose.disconnect();
}

createUser().catch((error) => {
  console.error("Create user failed:", error);
  process.exit(1);
});

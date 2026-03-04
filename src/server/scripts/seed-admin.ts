import "dotenv/config";
import crypto from "crypto";
import mongoose from "mongoose";
import { User } from "../models/User";

function generatePassword(length = 16): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function seedAdmin() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--email");
  const passIdx = args.indexOf("--password");
  const reset = args.includes("--reset");
  const deleteUser = args.includes("--delete");

  const email = emailIdx >= 0 ? args[emailIdx + 1] : undefined;
  const password = passIdx >= 0 ? args[passIdx + 1] : undefined;

  if (!email) {
    console.error(
      "Usage: npx ts-node src/server/scripts/seed-admin.ts --email <email> [--password <pass>] [--reset] [--delete]",
    );
    process.exit(1);
  }

  if (!reset && !deleteUser && !password) {
    console.error("Provide --password <pass>, --reset, or --delete");
    process.exit(1);
  }

  if (password && password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is required");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (deleteUser) {
    if (!existing) {
      console.log(`User ${email} not found — nothing to delete`);
    } else {
      await existing.deleteOne();
      console.log(`Deleted user ${email} (id: ${existing._id})`);
    }
    await mongoose.disconnect();
    return;
  }

  if (reset) {
    if (!existing) {
      console.error(`User ${email} not found — cannot reset password`);
      await mongoose.disconnect();
      process.exit(1);
    }
    const newPass = password || generatePassword();
    await existing.setPassword(newPass);
    await existing.save();
    console.log(`Password reset for ${email} (id: ${existing._id})`);
    console.log(`New password: ${newPass}`);
    await mongoose.disconnect();
    return;
  }

  if (existing) {
    console.log(`Admin user ${email} already exists (id: ${existing._id})`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const user = new User({
    email: email.toLowerCase(),
    name: "Admin",
    role: "admin",
    passwordHash: "placeholder",
  });
  await user.setPassword(password!);
  await user.save();

  console.log(`Admin user created: ${user.email} (id: ${user._id})`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

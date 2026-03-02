import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User";

async function seedAdmin() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--email");
  const passIdx = args.indexOf("--password");

  const email = emailIdx >= 0 ? args[emailIdx + 1] : undefined;
  const password = passIdx >= 0 ? args[passIdx + 1] : undefined;

  if (!email || !password) {
    console.error(
      "Usage: npx ts-node src/server/scripts/seed-admin.ts --email <email> --password <pass>",
    );
    process.exit(1);
  }

  if (password.length < 8) {
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
  await user.setPassword(password);
  await user.save();

  console.log(`Admin user created: ${user.email} (id: ${user._id})`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

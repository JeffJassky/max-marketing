import mongoose from "mongoose";
import { logger } from "../logger";

/**
 * Strip connection-string options that the current MongoDB driver no longer supports.
 * DigitalOcean managed databases include keepAlive which was removed in driver v4+.
 */
function sanitizeUri(raw: string): string {
  return raw
    .replace(/[&?]keepAlive(InitialDelay)?=[^&]*/gi, "")
    .replace(/\?&/, "?")
    .replace(/\?$/, "");
}

export async function connectMongoDB(): Promise<void> {
  const uri = sanitizeUri(process.env.MONGODB_URI || "");
  if (!uri) {
    logger.warn("MONGODB_URI not set — skipping MongoDB connection. Auth features will be unavailable.");
    return;
  }

  try {
    await mongoose.connect(uri);
    logger.info("MongoDB connected successfully");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
    throw err;
  }

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}

import path from "path";
import fs from "fs";
import { execSync } from "child_process";

async function globalSetup() {
  // Load real .env from project root
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

  // Validate MONGODB_URI is set
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set in .env. E2E tests require a real MongoDB connection.\n" +
        'Set it in your .env file, e.g.: MONGODB_URI=mongodb://localhost:27017/maxmarketing',
    );
  }

  // Override port for test server
  process.env.PORT = "3044";

  // Build client if dist doesn't exist
  const clientDist = path.resolve(__dirname, "../src/client/dist");
  if (!fs.existsSync(path.join(clientDist, "index.html"))) {
    console.log("Building client for E2E tests...");
    execSync("yarn build:client", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });
  }

  // Connect mongoose to real MongoDB via the app's connectMongoDB (handles URI sanitization)
  const { connectMongoDB } = require("../src/server/db/mongoose");
  await connectMongoDB();

  // Import and start the real server (app.listen is guarded by require.main check)
  const { app } = require("../src/server/index");

  // Initialize BigQuery models (same as the server's listen callback)
  try {
    const {
      clientAccountModel,
    } = require("../src/server/models/ClientAccount");
    const {
      accountSettingsModel,
    } = require("../src/server/models/AccountSettingsModel");
    await clientAccountModel.initialize();
    await accountSettingsModel.initialize();
  } catch (err) {
    console.warn(
      "E2E: BigQuery model initialization skipped:",
      (err as Error).message,
    );
  }

  const server = await new Promise<any>((resolve) => {
    const s = app.listen(3044, () => {
      console.log("E2E test server listening on port 3044");
      resolve(s);
    });
  });

  (globalThis as any).__E2E_SERVER__ = server;
}

export default globalSetup;

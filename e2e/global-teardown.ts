import mongoose from "mongoose";

async function globalTeardown() {
  // Clean up test data
  try {
    const { User } = require("../src/server/models/User");
    const {
      AccountMembership,
    } = require("../src/server/models/AccountMembership");

    // Only delete users/memberships created by tests (prefixed emails)
    const testUsers = await User.find({
      email: { $regex: /^e2e-test-/ },
    });
    const testUserIds = testUsers.map((u: any) => u._id);

    if (testUserIds.length > 0) {
      await AccountMembership.deleteMany({ userId: { $in: testUserIds } });
      await User.deleteMany({ email: { $regex: /^e2e-test-/ } });
      console.log(`E2E: Cleaned up ${testUsers.length} test user(s)`);
    }
  } catch (err) {
    console.error("E2E: Cleanup error:", err);
  }

  const server = (globalThis as any).__E2E_SERVER__;
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  await mongoose.disconnect();
}

export default globalTeardown;

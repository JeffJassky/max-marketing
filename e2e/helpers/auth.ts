import type { Page, APIRequestContext } from "@playwright/test";
import mongoose from "mongoose";
import crypto from "crypto";

// Use dynamic imports to get models (they register on the mongoose instance from global-setup)
function getUserModel() {
  return mongoose.model("User");
}

function getAccountMembershipModel() {
  return mongoose.model("AccountMembership");
}

/**
 * Create a test user directly in MongoDB. Returns credentials for login.
 * All test users have email prefix "e2e-test-" for safe cleanup.
 */
export async function createTestUser(
  overrides: {
    name?: string;
    email?: string;
    password?: string;
    role?: "admin" | "user";
  } = {},
) {
  const User = getUserModel();
  const suffix = crypto.randomBytes(4).toString("hex");
  const email = overrides.email || `e2e-test-${suffix}@test.com`;
  const password = overrides.password || "TestPass123!";
  const name = overrides.name || `Test User ${suffix}`;
  const role = overrides.role || "user";

  const user: any = new User({
    email: email.toLowerCase(),
    name,
    role,
    passwordHash: "placeholder",
  });
  await user.setPassword(password);
  await user.save();

  return { id: user._id.toString(), email, password, name, role };
}

/**
 * Create an AccountMembership linking a user to an account.
 */
export async function createMembership(userId: string, accountId: string) {
  const AccountMembership = getAccountMembershipModel();
  const membership = await AccountMembership.create({
    userId,
    accountId,
    role: "owner",
  });
  return { id: membership._id!.toString(), accountId, role: "owner" };
}

/**
 * Login via the UI (fills form and submits).
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

/**
 * Login via the API (faster, for test setup). Sets session cookie on the context.
 */
export async function loginViaAPI(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const res = await request.post("/api/auth/login", {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Login API failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Clean up all test users and their memberships.
 * Call in beforeEach/afterAll as needed.
 */
export async function cleanTestData() {
  const User = getUserModel();
  const AccountMembership = getAccountMembershipModel();

  const testUsers = await User.find({ email: { $regex: /^e2e-test-/ } });
  const testUserIds = testUsers.map((u: any) => u._id);

  if (testUserIds.length > 0) {
    await AccountMembership.deleteMany({ userId: { $in: testUserIds } });
  }
  await User.deleteMany({ email: { $regex: /^e2e-test-/ } });

  // Also clear sessions for test users
  const db = mongoose.connection.db;
  if (db) {
    try {
      await db.collection("sessions").deleteMany({
        session: { $regex: /e2e-test-/ },
      });
    } catch {
      // sessions collection might not exist yet
    }
  }
}

/**
 * Create a reset token directly in the DB for a user (bypasses email flow).
 * Returns the raw (unhashed) token for use in the reset URL.
 */
export async function createResetToken(
  userId: string,
  options?: { expired?: boolean },
) {
  const User = getUserModel();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expires = options?.expired
    ? new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    : new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  await User.findByIdAndUpdate(userId, {
    resetToken: hashedToken,
    resetTokenExpires: expires,
  });

  return rawToken;
}

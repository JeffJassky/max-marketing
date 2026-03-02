import { test as base } from "@playwright/test";
import { createTestUser, cleanTestData } from "./auth";

type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
};

type AuthFixtures = {
  adminUser: TestUser;
  regularUser: TestUser;
};

/**
 * Extended test with pre-created admin and regular user fixtures.
 * Test data is cleaned before each test.
 */
export const test = base.extend<AuthFixtures>({
  adminUser: async ({}, use) => {
    await cleanTestData();
    const user = await createTestUser({ role: "admin", name: "E2E Admin" });
    await use(user);
  },

  regularUser: async ({}, use) => {
    const user = await createTestUser({ role: "user", name: "E2E Regular" });
    await use(user);
  },
});

export { expect } from "@playwright/test";

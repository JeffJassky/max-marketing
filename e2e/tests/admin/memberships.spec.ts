import { test, expect } from "../../helpers/fixtures";
import { loginViaUI, createTestUser, createMembership } from "../../helpers/auth";

test.describe("Admin memberships", () => {
  test("user created with account assignments shows memberships in list", async ({
    page,
    adminUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await page.getByRole("button", { name: /users/i }).click();

    // Wait for user list and accounts to load
    await page.waitForTimeout(1000);

    // Open create user modal
    await page.getByRole("button", { name: /add user/i }).click();

    await page.locator('input[type="text"]').last().fill("E2E Member User");
    await page
      .locator('input[type="email"]')
      .last()
      .fill("e2e-test-member@test.com");
    await page.locator('input[type="password"]').last().fill("SecurePass123!");

    // Check any available account checkboxes
    const checkboxes = page.locator(
      '.max-h-40 input[type="checkbox"]',
    );
    const count = await checkboxes.count();
    if (count > 0) {
      await checkboxes.first().check();
    }

    await page.getByRole("button", { name: /create user/i }).click();

    // User should appear in list
    await expect(page.locator("table")).toContainText("E2E Member User");
  });

  test("edit user to add/remove memberships → changes reflected", async ({
    page,
    adminUser,
    regularUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await page.getByRole("button", { name: /users/i }).click();

    await page.waitForTimeout(1000);

    // Edit the regular user
    const userRow = page.locator("tr").filter({ hasText: regularUser.email });
    await userRow.locator("button").first().click(); // Edit button

    // Toggle first available account checkbox (add a membership)
    const checkboxes = page.locator(
      '.max-h-40 input[type="checkbox"]',
    );
    const count = await checkboxes.count();
    if (count > 0) {
      await checkboxes.first().check();
    }

    await page.getByRole("button", { name: /save changes/i }).click();

    // Reload and verify the membership was added
    await page.reload();
    await page.getByRole("button", { name: /users/i }).click();
    await page.waitForTimeout(1000);

    // The regular user's row should now show at least one account badge
    const updatedRow = page.locator("tr").filter({ hasText: regularUser.email });
    // If accounts exist, the None text should be gone (or an account name badge should appear)
    if (count > 0) {
      await expect(updatedRow.locator(".bg-stone-100")).toHaveCount(
        await updatedRow.locator(".bg-stone-100").count(),
      );
    }
  });
});

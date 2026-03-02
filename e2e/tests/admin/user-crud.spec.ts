import { test, expect } from "../../helpers/fixtures";
import { loginViaUI } from "../../helpers/auth";

test.describe("Admin user CRUD", () => {
  test("admin sees user list", async ({ page, adminUser }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");

    // Switch to Users tab
    await page.getByRole("button", { name: /users/i }).click();

    // The admin user should be listed
    await expect(page.locator("table")).toContainText(adminUser.name);
    await expect(page.locator("table")).toContainText(adminUser.email);
  });

  test("admin creates user → appears in list", async ({
    page,
    adminUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await page.getByRole("button", { name: /users/i }).click();

    // Open create modal
    await page.getByRole("button", { name: /add user/i }).click();

    // Fill form
    await page.locator('input[type="text"]').last().fill("E2E Created User");
    await page.locator('input[type="email"]').last().fill("e2e-test-created@test.com");
    await page.locator('input[type="password"]').last().fill("SecurePass123!");

    // Submit
    await page.getByRole("button", { name: /create user/i }).click();

    // Modal should close and user should appear in list
    await expect(page.locator("table")).toContainText("E2E Created User");
    await expect(page.locator("table")).toContainText("e2e-test-created@test.com");
  });

  test("admin edits user name and role → changes reflected", async ({
    page,
    adminUser,
    regularUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await page.getByRole("button", { name: /users/i }).click();

    // Find the regular user's row and click edit
    const userRow = page.locator("tr").filter({ hasText: regularUser.email });
    await userRow.locator("button").first().click(); // Edit button

    // Update name
    const nameInput = page.locator('input[type="text"]').last();
    await nameInput.clear();
    await nameInput.fill("Updated Name");

    // Change role to admin
    await page.locator("select").last().selectOption("admin");

    // Save
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify changes in the list
    await expect(page.locator("table")).toContainText("Updated Name");
    await expect(
      page.locator("tr").filter({ hasText: regularUser.email }),
    ).toContainText("admin");
  });

  test("admin deletes user → removed from list", async ({
    page,
    adminUser,
    regularUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await page.getByRole("button", { name: /users/i }).click();

    // Confirm the regular user exists
    await expect(page.locator("table")).toContainText(regularUser.email);

    // Handle the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());

    // Find the regular user's row and click delete (second button)
    const userRow = page.locator("tr").filter({ hasText: regularUser.email });
    await userRow.locator("button").nth(1).click(); // Delete button

    // User should be removed
    await expect(page.locator("table")).not.toContainText(regularUser.email);
  });

  test("short password on create shows error", async ({
    page,
    adminUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await page.getByRole("button", { name: /users/i }).click();

    await page.getByRole("button", { name: /add user/i }).click();

    await page.locator('input[type="text"]').last().fill("Short Pass User");
    await page.locator('input[type="email"]').last().fill("e2e-test-short@test.com");
    await page.locator('input[type="password"]').last().fill("short");

    await page.getByRole("button", { name: /create user/i }).click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("duplicate email on create shows error", async ({
    page,
    adminUser,
    regularUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await page.goto("/admin");
    await page.getByRole("button", { name: /users/i }).click();

    await page.getByRole("button", { name: /add user/i }).click();

    await page.locator('input[type="text"]').last().fill("Duplicate User");
    await page
      .locator('input[type="email"]')
      .last()
      .fill(regularUser.email); // Already exists
    await page.locator('input[type="password"]').last().fill("SecurePass123!");

    await page.getByRole("button", { name: /create user/i }).click();

    await expect(
      page.getByText("A user with this email already exists"),
    ).toBeVisible();
  });
});

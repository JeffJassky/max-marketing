import { test, expect } from "../../helpers/fixtures";
import { loginViaUI } from "../../helpers/auth";

test.describe("Login", () => {
  test("successful login redirects to / and shows user initials in header", async ({
    page,
    adminUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);

    await expect(page).toHaveURL("/");
    // Header should show user initials (E2E Admin → "EA")
    await expect(page.locator("header")).toContainText("EA");
  });

  test("wrong password shows error and stays on /login", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, "WrongPassword123!");

    await expect(page).toHaveURL("/login");
    await expect(page.locator("text=Invalid email or password")).toBeVisible();
  });

  test("non-existent email shows error", async ({ page, adminUser }) => {
    // adminUser fixture ensures cleanup happened; we use a fake email
    await loginViaUI(page, "e2e-test-nonexistent@test.com", "SomePass123!");

    await expect(page).toHaveURL("/login");
    await expect(page.locator("text=Invalid email or password")).toBeVisible();
  });

  test("forgot password link navigates to /forgot-password", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot your password/i }).click();

    await expect(page).toHaveURL("/forgot-password");
  });
});

import { test, expect } from "../../helpers/fixtures";

test.describe("Forgot password", () => {
  test("valid email shows 'Check your email' success message", async ({
    page,
    regularUser,
  }) => {
    await page.goto("/forgot-password");
    await page.getByPlaceholder("you@company.com").fill(regularUser.email);
    await page.getByRole("button", { name: /send reset link/i }).click();

    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("non-existent email shows same success (no email enumeration)", async ({
    page,
    adminUser, // fixture for cleanup
  }) => {
    await page.goto("/forgot-password");
    await page
      .getByPlaceholder("you@company.com")
      .fill("e2e-test-nobody@test.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should still show success (server always returns success)
    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("'Back to sign in' link navigates to /login", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/forgot-password");
    await page.getByRole("link", { name: /back to sign in/i }).click();

    await expect(page).toHaveURL("/login");
  });
});

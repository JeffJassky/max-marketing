import { test, expect } from "../../helpers/fixtures";
import { createResetToken, loginViaUI } from "../../helpers/auth";

test.describe("Reset password", () => {
  test("valid token → password reset → login with new password works", async ({
    page,
    regularUser,
  }) => {
    const token = await createResetToken(regularUser.id);
    const newPassword = "NewSecurePass456!";

    await page.goto(
      `/reset-password?token=${token}&email=${encodeURIComponent(regularUser.email)}`,
    );

    await page.getByPlaceholder("At least 8 characters").fill(newPassword);
    await page.getByPlaceholder("Repeat your password").fill(newPassword);
    await page.getByRole("button", { name: /reset password/i }).click();

    // Should show success
    await expect(page.getByText("Password reset!")).toBeVisible();

    // Wait for redirect to /login
    await expect(page).toHaveURL("/login", { timeout: 5000 });

    // Login with new password
    await loginViaUI(page, regularUser.email, newPassword);
    await expect(page).toHaveURL("/");
  });

  test("expired token shows error", async ({ page, regularUser }) => {
    const token = await createResetToken(regularUser.id, { expired: true });

    await page.goto(
      `/reset-password?token=${token}&email=${encodeURIComponent(regularUser.email)}`,
    );

    await page.getByPlaceholder("At least 8 characters").fill("NewPass123!");
    await page.getByPlaceholder("Repeat your password").fill("NewPass123!");
    await page.getByRole("button", { name: /reset password/i }).click();

    await expect(
      page.getByText("Invalid or expired reset token"),
    ).toBeVisible();
  });

  test("mismatched passwords shows client-side error", async ({
    page,
    regularUser,
  }) => {
    const token = await createResetToken(regularUser.id);

    await page.goto(
      `/reset-password?token=${token}&email=${encodeURIComponent(regularUser.email)}`,
    );

    await page.getByPlaceholder("At least 8 characters").fill("Password1!");
    await page.getByPlaceholder("Repeat your password").fill("DifferentPass!");
    await page.getByRole("button", { name: /reset password/i }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("missing token/email in URL shows 'Invalid or missing reset link'", async ({
    page,
    adminUser, // fixture for cleanup
  }) => {
    await page.goto("/reset-password");

    await expect(
      page.getByText("Invalid or missing reset link"),
    ).toBeVisible();
  });

  test("short password shows validation error", async ({
    page,
    regularUser,
  }) => {
    const token = await createResetToken(regularUser.id);

    await page.goto(
      `/reset-password?token=${token}&email=${encodeURIComponent(regularUser.email)}`,
    );

    await page.getByPlaceholder("At least 8 characters").fill("short");
    await page.getByPlaceholder("Repeat your password").fill("short");
    await page.getByRole("button", { name: /reset password/i }).click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });
});

import { test, expect } from "../../helpers/fixtures";
import { loginViaUI } from "../../helpers/auth";

test.describe("Logout", () => {
  test("logout via header dropdown redirects to /login", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL("/");

    // Open user dropdown (avatar button with chevron)
    await page.locator("header button").filter({ has: page.locator(".rounded-full") }).click();
    // Click "Sign out"
    await page.getByRole("button", { name: /sign out/i }).click();

    await expect(page).toHaveURL("/login");
  });

  test("after logout, protected routes redirect to /login", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL("/");

    // Logout via dropdown
    await page.locator("header button").filter({ has: page.locator(".rounded-full") }).click();
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL("/login");

    // Try navigating to a protected route
    await page.goto("/overviews");
    await expect(page).toHaveURL("/login");
  });
});

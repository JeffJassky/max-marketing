import { test, expect } from "../../helpers/fixtures";
import { loginViaUI } from "../../helpers/auth";

test.describe("Route guards", () => {
  test("unauthenticated user visiting / is redirected to /login", async ({
    page,
    adminUser, // fixture ensures cleanup
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("unauthenticated user visiting /overviews is redirected to /login", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/overviews");
    await expect(page).toHaveURL("/login");
  });

  test("authenticated user visiting /login is redirected to /", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL("/");

    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("authenticated user visiting /forgot-password is redirected to /", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL("/");

    await page.goto("/forgot-password");
    await expect(page).toHaveURL("/");
  });

  test("non-admin visiting /admin is redirected to /", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL("/");

    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("admin can access /admin and sees Admin in sidebar", async ({
    page,
    adminUser,
  }) => {
    await loginViaUI(page, adminUser.email, adminUser.password);
    await expect(page).toHaveURL("/");

    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    // Sidebar should show "Admin" link
    await expect(page.locator("aside")).toContainText("Admin");
  });

  test("non-admin sidebar does NOT show Admin link", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL("/");

    // The sidebar admin section should not be visible
    const adminNav = page.locator("aside").getByText("Admin", { exact: true });
    await expect(adminNav).toHaveCount(0);
  });
});

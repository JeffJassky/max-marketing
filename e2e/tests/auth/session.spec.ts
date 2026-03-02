import { test, expect } from "../../helpers/fixtures";
import { loginViaUI, loginViaAPI, createMembership } from "../../helpers/auth";

test.describe("Session persistence", () => {
  test("session persists across page reload", async ({
    page,
    regularUser,
  }) => {
    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL("/");

    // Reload
    await page.reload();

    // Should still be on / (not redirected to /login)
    await expect(page).toHaveURL("/");
    // Header should still show user initials
    await expect(page.locator("header")).toContainText("ER"); // "E2E Regular" → "ER"
  });

  test("GET /api/auth/me returns correct user data and memberships", async ({
    request,
    regularUser,
  }) => {
    await loginViaAPI(request, regularUser.email, regularUser.password);

    // Create a membership for this user
    await createMembership(regularUser.id, "test-account-123");

    const res = await request.get("/api/auth/me");
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.email).toBe(regularUser.email);
    expect(data.name).toBe(regularUser.name);
    expect(data.role).toBe("user");
    expect(data.memberships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ accountId: "test-account-123", role: "owner" }),
      ]),
    );
  });
});

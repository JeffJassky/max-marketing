import { test, expect } from "../../helpers/fixtures";
import { loginViaAPI } from "../../helpers/auth";

test.describe("Access control (API level)", () => {
  test("non-admin API call to /api/admin/users returns 403", async ({
    request,
    regularUser,
  }) => {
    await loginViaAPI(request, regularUser.email, regularUser.password);

    const res = await request.get("/api/admin/users");
    expect(res.status()).toBe(403);

    const body = await res.json();
    expect(body.error).toBe("Admin access required");
  });

  test("unauthenticated API call to /api/auth/me returns 401", async ({
    request,
    adminUser, // fixture for cleanup
  }) => {
    // Make request without logging in (fresh context)
    const res = await request.get("/api/auth/me");
    expect(res.status()).toBe(401);
  });

  test("non-member PUT /api/accounts/:id returns 403", async ({
    request,
    regularUser,
  }) => {
    await loginViaAPI(request, regularUser.email, regularUser.password);

    // Try to update an account the user has no membership for
    const res = await request.put("/api/accounts/nonexistent-account-id", {
      data: { name: "Hacked Account" },
    });

    // Should be 403 (access denied) since user has no membership
    expect(res.status()).toBe(403);
  });

  test("admin bypasses account access check (not 403)", async ({
    request,
    adminUser,
  }) => {
    await loginViaAPI(request, adminUser.email, adminUser.password);

    // Admin should not get 403 even for an account they don't have membership for
    // The actual response may be 404 (account not found) or 200, but NOT 403
    const res = await request.put("/api/accounts/nonexistent-account-id", {
      data: { name: "Admin Update" },
    });

    expect(res.status()).not.toBe(403);
  });
});

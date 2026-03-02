Plan to implement

E2E Test Plan for Authentication System

Context

The auth system (Passport/express-session + MongoDB + Vue 3 frontend) was just implemented. There are currently no E2E tests. The project has Vitest 4.0.14 installed but no Playwright, no test
config, and only one CLI unit test. We need comprehensive E2E tests covering all auth flows.

---

Approach: Playwright + mongodb-memory-server

- Playwright for browser E2E tests (login forms, route guards, admin UI)
- mongodb-memory-server for an in-process test MongoDB (no external DB needed)
- Tests run against the real Express server serving the built Vue client
- Single worker, serial execution (auth tests are stateful)
- Test port 3044 to avoid conflicting with dev servers

---

Step 1: Install dependencies + configure

Install:
yarn add -D @playwright/test mongodb-memory-server
npx playwright install chromium

Add to root package.json scripts:
"test:e2e": "npx playwright test --config e2e/playwright.config.ts",
"test:e2e:headed": "npx playwright test --config e2e/playwright.config.ts --headed",
"test:e2e:debug": "npx playwright test --config e2e/playwright.config.ts --debug"

Create e2e/playwright.config.ts:

- testDir: ./tests
- globalSetup/Teardown pointing to setup files
- workers: 1 (serial), baseURL: http://localhost:3044
- Chromium only, trace on first retry, screenshots on failure

---

Step 2: Refactor src/server/index.ts for testability

The server currently calls app.listen() at module level, making it impossible to import app without starting the listener. Minimal change:

1.  Export app
2.  Wrap app.listen() in if (require.main === module) guard

This is backward-compatible — the server works identically when run directly.

---

Step 3: Test infrastructure files

e2e/global-setup.ts

1.  Start MongoMemoryServer → get connection URI
2.  Set env vars (MONGODB_URI, SESSION_SECRET, PORT=3044, delete SENDGRID_API_KEY)
3.  Build client if src/client/dist doesn't exist
4.  Connect mongoose, import app, call app.listen(3044)
5.  Store server + mongod references on globalThis for teardown

e2e/global-teardown.ts

- Close HTTP server, disconnect mongoose, stop MongoMemoryServer

e2e/helpers/test-server.ts

- startTestServer(port): connects mongoose, dynamic-imports app from ../../src/server/index, listens on test port

e2e/helpers/auth.ts

- createTestUser(overrides?) — inserts user directly into MongoDB (bcrypt hash, returns email+password+id)
- createMembership(userId, accountId) — inserts AccountMembership doc
- loginViaUI(page, email, password) — fills login form + clicks submit
- loginViaAPI(context, email, password) — POST /api/auth/login via Playwright request API (faster, for setup)
- cleanAuthData() — drops users, accountmemberships, sessions collections

e2e/helpers/fixtures.ts

- Extended Playwright test with adminUser and regularUser fixtures

---

Step 4: Test files

e2e/tests/auth/login.spec.ts (4 tests)

- Successful login → redirects to /, user initials in header
- Wrong password → error message, stays on /login
- Non-existent email → error message
- Forgot password link navigates to /forgot-password

e2e/tests/auth/logout.spec.ts (2 tests)

- Logout via header dropdown → redirects to /login
- After logout, protected routes redirect to /login

e2e/tests/auth/session.spec.ts (2 tests)

- Session persists across page reload
- GET /api/auth/me returns correct user data + memberships

e2e/tests/auth/route-guards.spec.ts (6 tests)

- Unauthenticated → / redirects to /login
- Unauthenticated → /overviews redirects to /login
- Authenticated → /login redirects to /
- Authenticated → /forgot-password redirects to /
- Non-admin → /admin redirects to /
- Admin → /admin works, "Admin" visible in sidebar
- Non-admin sidebar does NOT show "Admin" link

e2e/tests/password/forgot-password.spec.ts (3 tests)

- Valid email → shows "Check your email" success
- Non-existent email → same success (no email enumeration)
- "Back to sign in" link works

e2e/tests/password/reset-password.spec.ts (5 tests)

- Valid token → password reset → login with new password works
- Expired token → error message
- Mismatched passwords → client-side error
- Missing token/email in URL → "Invalid or missing reset link"
- Short password (<8 chars) → validation error

e2e/tests/admin/user-crud.spec.ts (6 tests)

- Admin sees user list
- Admin creates user → appears in list
- Admin edits user (name + role) → changes reflected
- Admin deletes user → removed from list
- Short password on create → error
- Duplicate email on create → error

e2e/tests/admin/memberships.spec.ts (2 tests)

- Create user with account assignments → memberships shown
- Edit user to add/remove memberships → changes reflected
- (Uses page.route() to mock /api/accounts since accounts are in BigQuery)

e2e/tests/admin/access-control.spec.ts (4 tests)

- Non-admin API call to /api/admin/users → 403
- Unauthenticated API call to /api/auth/me → 401
- Non-member PUT /api/accounts/:id → 403
- Admin bypasses account access check (not 403)

Total: ~34 test cases across 9 spec files

---

File structure

e2e/
playwright.config.ts
global-setup.ts
global-teardown.ts
helpers/
test-server.ts
auth.ts
fixtures.ts
tests/
auth/
login.spec.ts
logout.spec.ts
session.spec.ts
route-guards.spec.ts
password/
forgot-password.spec.ts
reset-password.spec.ts
admin/
user-crud.spec.ts
memberships.spec.ts
access-control.spec.ts

Files modified

┌─┬─┐
FileChange
├─┼─┤
package.json Add devDeps (@playwright/test, mongodb-memory-server), add test scripts
├─┼─┤
src/server/index.ts Export app, guard app.listen() with require.main === module
├─┼─┤
.gitignore Add e2e/playwright-report/, e2e/test-results/
└─┴─┘

Key implementation notes

- BigQuery routes: Auth tests don't need BigQuery. The test server skips clientAccountModel.initialize(). Admin tests that need account names use page.route() to mock /api/accounts.
- SendGrid: SENDGRID_API_KEY is unset in test env so emails log to console (existing fallback in services/email.ts).
- Reset token seeding: Tests create tokens directly in MongoDB (bypassing the forgot-password email flow) to test the reset form.
- Data isolation: cleanAuthData() runs in beforeEach to reset users/memberships/sessions between tests.

Verification

1.  yarn test:e2e — all 34 tests pass
2.  yarn test:e2e:headed — visually verify browser interactions
3.  Check that dev server still starts normally (yarn dev:server)
    ──

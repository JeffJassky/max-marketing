User Authentication & Management Plan

Context

MaxMarketing currently has no authentication — all routes and data are publicly accessible. "Max Accounts" (business accounts with 3P connections) exist but have no user ownership. We need to add
user accounts with role-based access control, authentication via Passport/express-session, password reset via SendGrid, and frontend auth flows.

Database Decision: MongoDB (not BigQuery)

BigQuery is unsuitable for auth workloads — it's an analytics warehouse with 2-5s query latency, no efficient single-row lookups, and DML rate limits. MongoDB provides ~1-5ms lookups, proper
indexing for email/token queries, and connect-mongo for session storage. User will provision a MongoDB instance and provide a connection URI via MONGODB_URI env var.

---

Phase 1: Dependencies & MongoDB Connection

1.1 Install packages

Root package.json — add:
passport, passport-local, express-session, mongoose, connect-mongo, bcryptjs, @sendgrid/mail
@types/passport, @types/passport-local, @types/express-session, @types/bcryptjs (devDeps)

1.2 New env vars (.env)

MONGODB_URI=mongodb+srv://...
SESSION_SECRET=<random-64-char-hex>
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@maxedmarketing.com
APP_URL=http://localhost:5173

1.3 MongoDB connection module

New file: src/server/db/mongoose.ts

- Export connectMongoDB() — connects with retry, logs status
- Called from server startup in src/server/index.ts alongside existing BigQuery model init

---

Phase 2: User & Membership Models (Mongoose)

2.1 User model

New file: src/server/models/User.ts

interface IUser {
email: string; // unique, indexed, lowercase
passwordHash: string; // bcrypt hash
name: string;
role: 'admin' | 'user'; // system-wide role
resetToken?: string; // hashed token for password reset
resetTokenExpires?: Date;
createdAt: Date;
updatedAt: Date;
}

Instance methods:

- comparePassword(candidate: string): Promise<boolean> — bcrypt compare
- setPassword(plain: string): Promise<void> — bcrypt hash + assign

  2.2 Account Membership model

New file: src/server/models/AccountMembership.ts

interface IAccountMembership {
userId: ObjectId; // ref → User
accountId: string; // matches ClientAccount.id (BigQuery)
role: 'owner'; // only owner role for now (member deferred)
createdAt: Date;
}

Compound unique index on (userId, accountId). Index on accountId for listing members.

2.3 Permission semantics (simplified — two roles only)

┌─────────────┬──────────────┬──────────────────────────────────────────────────────────────────────┐
│ System Role │ Account Role │ Can do │
├─────────────┼──────────────┼──────────────────────────────────────────────────────────────────────┤
│ admin │ (any) │ Everything — manage all accounts, users, settings │
├─────────────┼──────────────┼──────────────────────────────────────────────────────────────────────┤
│ user │ owner │ Full access to their assigned accounts (settings, connections, data) │
└─────────────┴──────────────┴──────────────────────────────────────────────────────────────────────┘

Note: "Member" role deferred. For now, non-admin users are always owner on their assigned accounts.

---

Phase 3: Passport & Session Configuration

New file: src/server/auth/passport.ts

- Configure passport-local strategy (email + password lookup)
- serializeUser: store user.\_id
- deserializeUser: fetch User by \_id, attach to req.user

In src/server/index.ts — add middleware (before routes, after body parsing):
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';

app.use(session({
secret: process.env.SESSION_SECRET,
store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
resave: false,
saveUninitialized: false,
cookie: { maxAge: 7 _ 24 _ 60 _ 60 _ 1000, httpOnly: true, sameSite: 'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());

---

Phase 4: Auth Middleware

New file: src/server/auth/middleware.ts

Three middleware functions:

1.  requireAuth — returns 401 if !req.isAuthenticated()
2.  requireAdmin — returns 403 if req.user.role !== 'admin'
3.  requireAccountAccess(roleRequired?: 'owner') — checks AccountMembership for req.params.id (account ID). Admins bypass. Returns 403 if no membership or insufficient role.

Apply to src/server/index.ts:

- Auth routes (/api/auth/\*) — public, no middleware
- All other /api/\* routes — requireAuth
- Account-specific routes (/api/accounts/:id/\*) — requireAccountAccess()
- Admin routes (/api/admin/\*) — requireAdmin

---

Phase 5: Auth API Routes

New file: src/server/routes/auth.ts (Express Router)

┌───────────────────────────┬────────┬────────┬─────────────────────────────────────────────────┐
│ Route │ Method │ Auth │ Description │
├───────────────────────────┼────────┼────────┼─────────────────────────────────────────────────┤
│ /api/auth/login │ POST │ Public │ Passport local authenticate, return user │
├───────────────────────────┼────────┼────────┼─────────────────────────────────────────────────┤
│ /api/auth/logout │ POST │ Auth │ req.logout(), destroy session │
├───────────────────────────┼────────┼────────┼─────────────────────────────────────────────────┤
│ /api/auth/me │ GET │ Auth │ Return current user + their account memberships │
├───────────────────────────┼────────┼────────┼─────────────────────────────────────────────────┤
│ /api/auth/forgot-password │ POST │ Public │ Generate reset token, send email via SendGrid │
├───────────────────────────┼────────┼────────┼─────────────────────────────────────────────────┤
│ /api/auth/reset-password │ POST │ Public │ Validate token, set new password │
└───────────────────────────┴────────┴────────┴─────────────────────────────────────────────────┘

Forgot password flow:

1.  Generate random token via crypto.randomBytes(32)
2.  Hash token with SHA-256, store hash + expiry (1 hour) on User doc
3.  Send email with link: ${APP_URL}/reset-password?token=<unhashed-token>&email=<email>
4.  Always return success (don't leak whether email exists)

Reset password flow:

1.  Hash incoming token, find User with matching hash + non-expired
2.  Set new password via user.setPassword()
3.  Clear reset fields, save

---

Phase 6: Admin API Routes

New file: src/server/routes/admin.ts (Express Router, all requireAdmin)

┌────────────────────────────────────────────────────┬────────┬────────────────────────────────────────────────────────────────┐
│ Route │ Method │ Description │
├────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────┤
│ /api/admin/users │ GET │ List all users with their memberships │
├────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────┤
│ /api/admin/users │ POST │ Create user (email, name, role, password, account assignments) │
├────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────┤
│ /api/admin/users/:userId │ PUT │ Update user (name, role, email) │
├────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────┤
│ /api/admin/users/:userId │ DELETE │ Delete user + their memberships │
├────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────┤
│ /api/admin/users/:userId/memberships │ GET │ Get user's account memberships │
├────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────┤
│ /api/admin/users/:userId/memberships │ POST │ Add user to account with role │
├────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────┤
│ /api/admin/users/:userId/memberships/:membershipId │ DELETE │ Remove user from account │
└────────────────────────────────────────────────────┴────────┴────────────────────────────────────────────────────────────────┘

---

Phase 7: SendGrid Email Service

New file: src/server/services/email.ts

- Initialize @sendgrid/mail with SENDGRID_API_KEY
- Export sendPasswordResetEmail(to, resetUrl) — sends branded HTML email with reset link
- Graceful error handling (log but don't crash if email fails)

---

Phase 8: Frontend — Auth Store & HTTP Integration

8.1 Auth store

New file: src/client/src/stores/auth.ts (Pinia)

state: {
user: AuthUser | null, // { id, email, name, role, memberships }
loading: boolean,
initialized: boolean // true after first /me check completes
}
actions: {
checkAuth() // GET /api/auth/me — called on app mount
login(email, password) // POST /api/auth/login
logout() // POST /api/auth/logout
forgotPassword(email) // POST /api/auth/forgot-password
resetPassword(token, email, password) // POST /api/auth/reset-password
}
getters: {
isAuthenticated, isAdmin, accountRole(accountId)
}

8.2 Fetch wrapper update

Currently, all fetch calls are raw fetch(). We'll need to handle 401 responses globally. Add a small utility:

New file: src/client/src/utils/api.ts
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
const res = await fetch(url, { ...options, credentials: 'include' });
if (res.status === 401) {
// Redirect to login (except on auth routes)
window.location.href = '/login';
throw new Error('Unauthorized');
}
return res;
}

Existing fetch() calls in views/composables can be migrated incrementally; the route guard is the primary protection.

---

Phase 9: Frontend — Auth Views

9.1 Login page

New file: src/client/src/views/LoginView.vue

- Email + password form
- "Forgot password?" link → /forgot-password
- Calls authStore.login(), redirects to / on success
- Shows error messages on failure
- Styled to match amplify theme (dark centered card with brand accents)

  9.2 Forgot password page

New file: src/client/src/views/ForgotPasswordView.vue

- Email input form
- Calls authStore.forgotPassword()
- Shows success message ("If an account exists, we sent a reset link")
- Link back to login

  9.3 Reset password page

New file: src/client/src/views/ResetPasswordView.vue

- Reads token and email from URL query params
- New password + confirm password fields
- Calls authStore.resetPassword()
- Redirects to /login with success message on completion

---

Phase 10: Frontend — Route Guards & Layout Changes

10.1 Router updates (src/client/src/router/index.ts)

Add new routes:
{ path: '/login', name: 'login', component: LoginView, meta: { public: true } }
{ path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView, meta: { public: true } }
{ path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { public: true } }
{ path: '/admin', name: 'admin', component: AdminView, meta: { requiresAdmin: true } }

Add global beforeEach guard:
router.beforeEach(async (to) => {
const auth = useAuthStore();
if (!auth.initialized) await auth.checkAuth();
if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' };
if (to.meta.public && auth.isAuthenticated) return { name: 'dashboard' };
if (to.meta.requiresAdmin && !auth.isAdmin) return { name: 'dashboard' };
});

10.2 App.vue changes

- Conditionally render Sidebar + HeaderBar + ChatWidget only when authenticated
- For public routes (login/forgot/reset), render just the RouterView (no chrome)
- On mount, call authStore.checkAuth() before showing content (show loading spinner until initialized)

  10.3 HeaderBar.vue changes

- Replace hardcoded "AL" avatar with user initials from auth store
- Add user dropdown menu with "Logout" option

  10.4 Sidebar.vue changes

- Add "Admin" nav item linking to /admin — only visible if authStore.isAdmin
- The existing "Settings" link stays for account-level settings

---

Phase 11: Admin UI — Separate /admin Route

11.1 New AdminView

New file: src/client/src/views/AdminView.vue

- Dedicated admin page at /admin route (admin-only, guarded)
- Two sections/tabs: Accounts and Users

Accounts section:

- Migrate the existing account CRUD from SettingsView.vue into this admin view
- List all MaxAccounts with platform connections
- Create/edit/delete accounts (same functionality as current SettingsView)

Users section:

- List all users with name, email, system role, assigned accounts
- "Add User" button → form with: name, email, temporary password, system role, account assignments
- Edit user → change name, email, role, account memberships
- Delete user with confirmation
- For each user row, show which MaxAccounts they're assigned to

  11.2 SettingsView.vue simplification

The existing SettingsView becomes an account-level settings page for owners:

- Shows only accounts the current user owns
- Retains platform connection management (link Google Ads, Meta, etc.)
- No user management here — that's in /admin

  11.3 Account member management (in AdminView)

In the account detail/edit panel within AdminView:

- List users assigned to this account
- "Assign User" dropdown to add existing users as owners
- Remove user from account button

---

Phase 12: Seed Admin User

New file: src/server/scripts/seed-admin.ts

- CLI script to create initial admin user
- Usage: npx ts-node src/server/scripts/seed-admin.ts --email admin@example.com --password <pass>
- Checks if admin exists, creates if not
- Used for first-time setup

---

Account Access Integration

Currently, GET /api/accounts returns ALL accounts. After auth:

- Admin: sees all accounts (unchanged)
- Non-admin: GET /api/accounts filtered to only accounts the user has membership in
- Account-specific routes (/api/accounts/:id/\*, /api/reports/:reportId/live with accountId param) check membership
- The selectedAccount flow in App.vue continues to work — just limited to accounts the user can access

---

Files Modified (Existing)

┌─────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ File │ Changes │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ package.json │ Add auth/mongoose/sendgrid dependencies │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ .env │ Add MONGODB_URI, SESSION_SECRET, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, APP_URL │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ src/server/index.ts │ Add session/passport middleware, import route files, apply auth guards, filter accounts by user │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ src/client/src/router/index.ts │ Add auth routes, beforeEach guard │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ src/client/src/App.vue │ Conditional layout (auth vs public), auth initialization │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ src/client/src/views/SettingsView.vue │ Simplify to account-level settings for owners (remove account CRUD — moved to admin) │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ src/client/src/components/HeaderBar.vue │ User avatar from auth store, logout dropdown │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ src/client/src/components/Sidebar.vue │ Admin-only nav items │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ src/client/vite.config.ts │ May need to proxy /api/auth routes (already covered by /api proxy) │
└─────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────┘

Files Created (New)

┌─────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ File │ Purpose │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/db/mongoose.ts │ MongoDB connection │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/models/User.ts │ User Mongoose model │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/models/AccountMembership.ts │ Account ↔ User junction model │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/auth/passport.ts │ Passport local strategy config │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/auth/middleware.ts │ requireAuth, requireAdmin, requireAccountAccess │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/routes/auth.ts │ Auth routes (login, logout, me, forgot/reset password) │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/routes/admin.ts │ Admin user/membership CRUD routes │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/services/email.ts │ SendGrid email service │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/server/scripts/seed-admin.ts │ CLI to seed first admin user │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/client/src/stores/auth.ts │ Pinia auth store │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/client/src/utils/api.ts │ Fetch wrapper for 401 handling │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/client/src/views/LoginView.vue │ Login page │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/client/src/views/ForgotPasswordView.vue │ Forgot password page │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/client/src/views/ResetPasswordView.vue │ Reset password page │
├─────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ src/client/src/views/AdminView.vue │ Admin panel (user CRUD + account management) │
└─────────────────────────────────────────────┴────────────────────────────────────────────────────────┘

---

Implementation Order

1.  Install dependencies
2.  MongoDB connection (db/mongoose.ts)
3.  User + AccountMembership models
4.  Passport config + session middleware
5.  Auth middleware (requireAuth, requireAdmin, requireAccountAccess)
6.  Auth routes (login, logout, me)
7.  SendGrid email service
8.  Password reset routes (forgot + reset)
9.  Admin routes (user CRUD + membership management)
10. Apply auth middleware to all existing routes in index.ts
11. Seed admin script
12. Frontend auth store
13. Frontend auth views (login, forgot password, reset password)
14. Router guards + App.vue conditional layout
15. HeaderBar user menu + Sidebar admin nav
16. Settings page user management UI
17. Filter accounts by user membership

Verification

1.  Start MongoDB — ensure MONGODB_URI connects
2.  Run seed script — creates admin user
3.  Start server — verify session middleware loads, no crashes
4.  Visit app — should redirect to /login
5.  Login as admin — should see all accounts, settings page with users tab
6.  Create a regular user — assign to specific accounts
7.  Login as regular user — should only see assigned accounts
8.  Test forgot password — request reset, check email arrives, follow link, set new password
9.  Test route protection — unauthenticated requests to /api/\* return 401
10. Test account access — member can't edit account settings, owner can

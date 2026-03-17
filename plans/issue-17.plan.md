# Implementation Plan: Issue #17 — Platform Connection Prompts & Windsor Account Connection

## Summary

Users need a clear call-to-action when viewing overview tabs for platforms they haven't connected yet. Instead of showing empty/no-data states, each disconnected platform tab should display a branded prompt with the platform icon and a "Request Connection to {Platform}" button. Clicking the button opens `/api/connect-accounts` in a new window, which orchestrates Windsor token assignment and redirects the user to Windsor's co-user-login page for authentication.

This issue covers two main workstreams:
1. **Frontend:** A new `PlatformConnectPrompt` component that replaces tab content when a platform is not connected.
2. **Backend:** A new BigQuery table for Windsor access tokens, and a new `/api/connect-accounts` endpoint that manages token assignment and Windsor redirect logic.

---

## Affected Files & Modules

### New Files
| File | Purpose |
|------|---------|
| `src/client/src/components/PlatformConnectPrompt.vue` | Reusable component shown when a platform tab is not connected |
| `src/server/models/WindsorAccessToken.ts` | BigQuery model for the `app_data.windsor_access_tokens` table |
| `src/server/routes/connect-accounts.ts` | Express route handler for `/api/connect-accounts` |

### Modified Files
| File | Change |
|------|--------|
| `src/client/src/views/OverviewsView.vue` | Add connection-status check per tab; render `PlatformConnectPrompt` for disconnected platforms |
| `src/server/index.ts` | Register the new `/api/connect-accounts` route |
| `src/server/config.ts` | Add `WINDSOR_CO_USER_LOGIN_URL` env var (optional, with default) |

---

## Step-by-Step Implementation

### Step 1: Define the Platform-to-AccountField Mapping

Create a shared mapping from each `PlatformTab` to the corresponding field on `ClientAccount`. This determines whether a platform is "connected."

| Platform Tab | Account Field |
|-------------|---------------|
| `GOOGLE` | `googleAdsId` |
| `META` | `facebookAdsId` |
| `GA4` | `ga4Id` |
| `SHOPIFY` | `shopifyId` |
| `INSTAGRAM` | `instagramId` |
| `FACEBOOK_ORGANIC` | `facebookPageId` |
| `GSC` | `gscId` |

The `OVERVIEW` tab is always shown (it aggregates whatever is connected).

---

### Step 2: Create `PlatformConnectPrompt.vue` Component

**Location:** `src/client/src/components/PlatformConnectPrompt.vue`

**Props:**
- `platformName: string` — Display name (e.g., "Google Ads")
- `platformIcon: Component` — Lucide icon component
- `accountId: string` — Current Maxed account ID (passed to the connect endpoint)

**Behavior:**
- Renders a centered card with:
  - The platform icon (large, muted color)
  - Heading: "Connect {platformName}"
  - Subtext: "This platform isn't connected to your account yet."
  - A primary button: **"Request Connection to {platformName}"**
- Button click opens `/api/connect-accounts?accountId={accountId}` in a new browser tab (`window.open`).

**Design:** Tailwind-styled to match the existing empty-state pattern (see the `!reportData.rows.length` block in OverviewsView). Centered vertically within the content area. Uses indigo accent colors consistent with the app theme.

---

### Step 3: Integrate `PlatformConnectPrompt` into `OverviewsView.vue`

**Logic change in `<template>` section:**

After the `<UnifiedOverview>` block and before the existing `<template v-else>` block, add a connection check:

```
computed: isPlatformConnected — checks selectedAccount[platformFieldForTab] is truthy
```

Add a mapping object `tabToPlatformField`:
```typescript
const tabToPlatformField: Record<PlatformTab, keyof MaxAccount | null> = {
  OVERVIEW: null,       // Always shown
  GOOGLE: 'googleAdsId',
  META: 'facebookAdsId',
  GA4: 'ga4Id',
  SHOPIFY: 'shopifyId',
  INSTAGRAM: 'instagramId',
  FACEBOOK_ORGANIC: 'facebookPageId',
  GSC: 'gscId',
};
```

Add a computed:
```typescript
const isPlatformConnected = computed(() => {
  const field = tabToPlatformField[activeTab.value];
  if (!field) return true; // OVERVIEW tab is always "connected"
  return !!selectedAccount?.value?.[field];
});
```

In the template, wrap the platform-specific content block:
```html
<!-- Not connected → show connect prompt -->
<PlatformConnectPrompt
  v-if="activeTab !== PlatformTab.OVERVIEW && !isPlatformConnected"
  :platformName="tabs.find(t => t.id === activeTab)?.label ?? ''"
  :platformIcon="tabs.find(t => t.id === activeTab)?.icon"
  :accountId="selectedAccount?.id ?? ''"
/>

<!-- Connected → show existing report content -->
<template v-else-if="activeTab !== PlatformTab.OVERVIEW">
  <!-- existing loading/error/empty/data states -->
</template>
```

The `loadReport` function should also early-return when the platform is not connected (avoid unnecessary API calls).

---

### Step 4: Create `WindsorAccessToken` BigQuery Model

**Location:** `src/server/models/WindsorAccessToken.ts`

**Schema (Zod):**
```typescript
const WindsorAccessTokenSchema = z.object({
  access_token: z.string(),
  maxed_account_id: z.string().nullable(),
  status: z.string(),           // 'available' | 'assigned' | 'invalid'
  assigned_at: z.date().nullable(),
});
```

**Class:** `WindsorAccessTokenModel extends AppDataModel`
- `datasetId`: `"app_data"`
- `tableId`: `"windsor_access_tokens"`

**Additional query methods:**
- `findByAccountId(accountId: string)` — Find the token assigned to a given account.
- `findFirstAvailable()` — Fetch one token with `status = 'available'` and `maxed_account_id IS NULL`.
- `assignToAccount(token: string, accountId: string)` — Update token row: set `maxed_account_id`, `status = 'assigned'`, `assigned_at = CURRENT_TIMESTAMP()`.
- `markInvalid(token: string)` — Update token row: set `status = 'invalid'`.

These methods use parameterized BigQuery queries (not the generic `update()`) to avoid SQL injection and ensure atomicity.

---

### Step 5: Add Config for Windsor Co-User-Login URL

**Location:** `src/server/config.ts`

Add to `envSchema`:
```typescript
WINDSOR_CO_USER_LOGIN_URL: z.string().default("https://app.windsor.ai/co-user-login"),
```

This makes the Windsor login base URL configurable without hardcoding.

---

### Step 6: Create `/api/connect-accounts` Route

**Location:** `src/server/routes/connect-accounts.ts`

**Method:** `GET /api/connect-accounts`

**Query params:** `accountId` (required)

**Middleware:** `requireAuth` (user must be logged in)

**Flow:**
1. Validate `accountId` query param exists.
2. Verify the authenticated user has membership to this account (query `AccountMembership`).
3. Look up existing assigned token for `accountId` via `WindsorAccessTokenModel.findByAccountId()`.
4. **If token exists:**
   a. Verify token validity by making a HEAD/GET request to `${WINDSOR_CO_USER_LOGIN_URL}?access_token=${token}`.
   b. If response is `200`: redirect user (`res.redirect`) to that URL.
   c. If response is `401` or non-200: mark token as `invalid`, proceed to step 5.
5. **If no valid token:**
   a. Fetch an available token via `findFirstAvailable()`.
   b. If none available: render a simple HTML error page telling the user to contact support (no available tokens in pool).
   c. If available: assign it via `assignToAccount()`, then verify it at Windsor.
   d. If verification succeeds: redirect to `${WINDSOR_CO_USER_LOGIN_URL}?access_token=${token}`.
   e. If verification fails: mark as `invalid` and render the "contact support" error page.

**Error page:** A minimal HTML response (inline, not a template) with the MAXED branding and a message: "No connection tokens are available. Please contact support at support@maxedmarketing.com."

---

### Step 7: Register the Route in `src/server/index.ts`

```typescript
import connectAccountsRoutes from "./routes/connect-accounts";
// ...
app.use("/api/connect-accounts", requireAuth, connectAccountsRoutes);
```

---

### Step 8: Initialize the BigQuery Table on Startup

In the server startup sequence (where `clientAccountModel.initialize()` and `accountSettingsModel.initialize()` are called), add:

```typescript
import { windsorAccessTokenModel } from "./models/WindsorAccessToken";
await windsorAccessTokenModel.initialize();
```

This ensures the `app_data.windsor_access_tokens` table exists before any requests hit it.

---

## Data Model Details

### `app_data.windsor_access_tokens` Table

| Column | Type | Mode | Description |
|--------|------|------|-------------|
| `access_token` | STRING | REQUIRED | Windsor one-time access token |
| `maxed_account_id` | STRING | NULLABLE | The Maxed account ID it's assigned to (null = unassigned) |
| `status` | STRING | REQUIRED | `available`, `assigned`, or `invalid` |
| `assigned_at` | TIMESTAMP | NULLABLE | When the token was assigned |

Tokens are manually inserted with:
```sql
INSERT INTO app_data.windsor_access_tokens (access_token, maxed_account_id, status, assigned_at)
VALUES ('token-value-here', NULL, 'available', NULL);
```

---

## Testing Strategy

### Unit / Integration Tests

1. **WindsorAccessTokenModel tests:**
   - `findByAccountId` returns the correct token (or null).
   - `findFirstAvailable` returns an unassigned token.
   - `assignToAccount` correctly updates status and assigned_at.
   - `markInvalid` correctly sets status to `invalid`.

2. **`/api/connect-accounts` route tests:**
   - Returns 401 if user is not authenticated.
   - Returns 403 if user doesn't have membership to the account.
   - Returns 400 if `accountId` query param is missing.
   - Redirects to Windsor when a valid token is found.
   - Assigns a new token and redirects when existing token is invalid.
   - Returns error HTML when no tokens are available in the pool.

3. **`PlatformConnectPrompt.vue` component tests:**
   - Renders platform name and icon correctly.
   - Button opens correct URL in new tab.

### Manual / QA Tests

1. **Disconnected platform flow:**
   - Create an account with no platform IDs set.
   - Navigate to Overviews → click each platform tab.
   - Verify the connect prompt appears instead of empty data.
   - Verify the Overview (unified) tab still renders normally.

2. **Connect button flow:**
   - Click "Request Connection to Google Ads."
   - Verify a new tab opens to `/api/connect-accounts?accountId=...`.
   - With a valid token in the pool: verify redirect to Windsor co-user-login.
   - With no tokens: verify error page appears.

3. **Token lifecycle:**
   - Insert test tokens into BigQuery.
   - Verify assignment flow works end-to-end.
   - Invalidate a token and verify reassignment from pool.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Token pool exhaustion** — No available tokens when user clicks connect | Medium | Show a clear error message directing user to contact support. Consider adding an admin alert/notification when pool is low. |
| **Windsor API availability** — co-user-login endpoint may be down or slow | Medium | Add timeout (10s) on the verification fetch. If verification fails due to network error, still attempt redirect and let Windsor handle it. |
| **Race condition on token assignment** — Two users simultaneously claim the same token | Low | Use a BigQuery `UPDATE ... WHERE status = 'available' LIMIT 1` pattern. BigQuery DML is serializable, so concurrent updates won't double-assign. |
| **Breaking existing empty states** — The new connect prompt might mask legitimate "no data for this period" states | Low | Only show the connect prompt when the account field (e.g., `googleAdsId`) is null/empty. If a platform IS connected but has no data, the existing empty state still shows. |
| **Session expiry during redirect** — User's session expires between clicking button and the new tab opening | Low | The `/api/connect-accounts` endpoint checks auth and returns 401 if expired. User can re-login and retry. |
| **BigQuery table initialization** — First deploy may fail if table creation races with requests | Low | Table initialization runs at server startup before the Express server begins accepting requests. |

---

## Future Considerations

- **Post-authorization callback:** If Windsor supports a redirect parameter on co-user-login, pass the app's overview URL so users return automatically after authorization.
- **Real-time status updates:** After a user completes Windsor auth, a webhook or polling mechanism could update the platform connection status without requiring a page refresh.
- **Token pool monitoring:** Add an admin dashboard widget or alert that warns when the available token count drops below a threshold.
- **Automatic token generation:** If Windsor exposes a token generation API in the future, automate pool replenishment.

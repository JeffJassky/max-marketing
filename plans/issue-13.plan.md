# Issue #13: Change "Ready to win" to "Let's go"

## Summary

Update the dashboard greeting header from **"Ready to win, (brand)?"** to **"Let's go, (brand)!"** across the codebase. This is a straightforward copy change on the main dashboard page.

## Affected Files and Modules

| File | Type | Change |
|------|------|--------|
| `src/client/src/views/DashboardView.vue` | **Vue component (primary)** | Update the greeting template string on line 269 |
| `plans/dashboard-updates/shopify-dashboard-layout.html` | HTML mockup | Update static greeting text (line 680) |
| `plans/dashboard-updates/brand-dashboard-layout.html` | HTML mockup | Update static greeting text (line 700) |

### Primary change

In `DashboardView.vue`, the current code at line 269:

```vue
{{ selectedAccount ? `Ready to win, ${selectedAccount.name}?` : 'Welcome to Maxed' }}
```

Will be changed to:

```vue
{{ selectedAccount ? `Let's go, ${selectedAccount.name}!` : 'Welcome to Maxed' }}
```

### Secondary changes (mockups)

The two HTML layout files in `plans/dashboard-updates/` contain static mockup text that should also be updated for consistency.

## Step-by-step Implementation

1. **Update `DashboardView.vue`** — Change the template expression from `Ready to win, ${selectedAccount.name}?` to `Let's go, ${selectedAccount.name}!`
2. **Update `shopify-dashboard-layout.html`** — Change `"Ready to win, DR Strings?"` to `"Let's go, DR Strings!"`
3. **Update `brand-dashboard-layout.html`** — Change `"Ready to win, Eastman Guitars?"` to `"Let's go, Eastman Guitars!"`

## Testing Strategy

- **Visual verification**: Load the dashboard with a selected account and confirm the header reads "Let's go, (brand)!".
- **Fallback check**: Verify the fallback text "Welcome to Maxed" still displays when no account is selected.
- **No automated tests required** — this is a static copy change with no logic impact.

## Risk Assessment

**Risk: Very Low**

- This is a simple text/copy change with no logic, data, or styling implications.
- The fallback greeting ("Welcome to Maxed") is unchanged.
- No API, routing, or state management code is affected.

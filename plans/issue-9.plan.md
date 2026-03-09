# Implementation Plan: Improve Header Bar (#9)

## Summary

Three changes to the header bar across the application:

1. **Change header background from dark theme to white/page color** — make it feel like part of the page content rather than a separate fixed app element.
2. **Show actual date range alongside preset labels** — when a preset like "Last Month" is selected, display the computed dates in a muted style, e.g. "Last Month (Jan 1 – Jan 31)".
3. **Remove the main title from the header bar** — each page should have its own in-page title instead, eliminating redundancy. Add titles to pages that currently lack them.

## Affected Files and Modules

| File | Change |
|---|---|
| `src/client/src/components/HeaderBar.vue` | Change background from dark to white; remove title `<h2>` element; update text/icon/border colors for light theme |
| `src/client/src/components/GlobalDateSelector.vue` | Update trigger button styling for light header; add date range detail text below/beside preset label |
| `src/client/src/components/GlobalMonthSelector.vue` | Update styling for light header (dark-on-light instead of light-on-dark) |
| `src/client/src/composables/useDateRange.ts` | No logic changes needed (already exposes `startDate`/`endDate`) |
| `src/client/src/views/DashboardView.vue` | Add page title "My Momentum" |
| `src/client/src/views/OverviewsView.vue` | Add page title "Overviews" |
| `src/client/src/views/MonitorsView.vue` | Add page title "Monitors" |
| `src/client/src/views/CreativeLabView.vue` | Add page title "Creative Lab" |
| `src/client/src/views/GoogleAdsView.vue` | Add page title "Google Ads Suite" |
| `src/client/src/views/BrandVoiceView.vue` | Add page title "Brand Voice Tracker" |
| `src/client/src/views/SuperlativesView.vue` | Add page title "Superlatives" |
| `src/client/src/views/ReportBuilderView.vue` | Add page title "Report Builder" |
| `src/client/src/views/AdminView.vue` | Add page title "Admin" |
| `src/client/src/views/SettingsView.vue` | Add page title "Settings" |

## Step-by-Step Implementation

### Step 1: Update HeaderBar.vue — Light Theme Background

**Current:** `bg-amplify-dark border-b border-slate-800` (dark navy header)

**Change to:** `bg-white border-b border-slate-200` (white header matching page content area)

Update all child element colors to work on a light background:
- Search input: `bg-slate-100 border-slate-200` with `text-slate-800 placeholder-slate-400`
- Notification bell: `text-slate-500 hover:text-slate-800`
- User avatar dropdown trigger: keep indigo-600 avatar, update chevron to `text-slate-400`
- User dropdown menu: keep existing `bg-slate-900` dark dropdown (it's an overlay, not part of header)

### Step 2: Remove Title from HeaderBar.vue

Remove the entire left-side title `<div>` containing the `<h2>{{ title }}</h2>`. Also remove the `title` computed property and related route-name-to-title mapping since it will no longer be needed.

Keep the left side of the header for possible future use or just let the flex layout push everything right, or add back a minimal left section with just spacing.

### Step 3: Add Page Titles to Views

For each view that lacks a title, add a heading as the first element inside the main content wrapper. Use a consistent style:

```html
<h1 class="text-2xl font-bold text-slate-800 mb-6">Page Title</h1>
```

Pages and their titles:
- `DashboardView.vue` → "My Momentum"
- `OverviewsView.vue` → "Overviews"
- `MonitorsView.vue` → "Monitors"
- `CreativeLabView.vue` → "Creative Lab"
- `GoogleAdsView.vue` → "Google Ads Suite"
- `BrandVoiceView.vue` → "Brand Voice Tracker"
- `SuperlativesView.vue` → "Superlatives"
- `ReportBuilderView.vue` → "Report Builder"
- `AdminView.vue` → "Admin"
- `SettingsView.vue` → "Settings"

Note: `SocialSparkView.vue` already has its own title — no change needed.

### Step 4: Update GlobalDateSelector.vue — Show Date Range with Preset

Modify the `formattedRange` computed property and the trigger button template:

**Current behavior:** Shows just the preset name (e.g., "Last Month") or a formatted date range for custom selections.

**New behavior:** Always show both the preset label AND the actual dates. Structure:

```html
<span class="font-bold text-slate-800">{{ selectedPreset }}</span>
<span class="font-normal text-slate-400 ml-1.5" v-if="selectedPreset !== 'Custom Range'">
  ({{ shortDateRange }})
</span>
```

Add a new `shortDateRange` computed that formats dates concisely:
```ts
const shortDateRange = computed(() => {
  if (!startDate.value || !endDate.value) return '';
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const startStr = fmt(startDate.value);
  const endStr = fmt(endDate.value);
  // Include year on end date if it differs from start or is not current year
  const endYear = endDate.value.getFullYear();
  const startYear = startDate.value.getFullYear();
  const currentYear = new Date().getFullYear();
  if (startYear !== endYear || endYear !== currentYear) {
    return `${startStr}, ${startYear} – ${endStr}, ${endYear}`;
  }
  return `${startStr} – ${endStr}`;
});
```

For "Custom Range", keep the existing behavior (show just the date range as the main label).

### Step 5: Update GlobalDateSelector.vue — Light Theme Trigger Button

**Current:** `bg-slate-900 border-slate-700 text-slate-200` (dark button for dark header)

**Change to:** `bg-white border-slate-300 text-slate-700 hover:border-indigo-500 hover:bg-slate-50` (light button for light header)

### Step 6: Update GlobalMonthSelector.vue — Light Theme Styling

**Current:** `bg-slate-900 border-slate-700 text-slate-200` (dark select for dark header)

**Change to:** `bg-white border-slate-300 text-slate-700 hover:border-indigo-500 hover:bg-slate-50` (light select for light header)

## Testing Strategy

1. **Visual verification** — Run the dev server (`npm run dev`) and verify:
   - Header bar is now white with a subtle bottom border on all pages
   - No dark-on-dark contrast issues remain in header elements
   - Date selector trigger shows both preset name and date range in correct styles
   - Each page has its own title heading that is visible and consistent
   - User menu dropdown still works correctly (opens/closes)
   - Date picker dropdown still functions correctly (presets, calendar, manual input)
   - Month selector dropdown still functions correctly

2. **Route-by-route check** — Visit each page and confirm:
   - Title displays correctly in the page content area
   - Header elements (search, bell, avatar) render properly on white background
   - Date/month selectors appear on the correct pages

3. **Responsive testing** — Check header at various viewport widths:
   - Search bar hidden on mobile (existing `hidden md:flex`)
   - Selectors and avatar still accessible on smaller screens

4. **Edge cases for date display:**
   - "Today" and "Yesterday" presets showing single date correctly
   - Cross-year ranges displaying year info
   - "Custom Range" still showing just the date range without a preset label

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Existing page content may already have top padding/margins that create visual gap when title is added | Low | Inspect each view's template structure and adjust spacing as needed |
| Light header may reduce contrast for some interactive elements | Low | Test each element's hover/focus states on white background |
| Date range text may overflow on smaller screens when showing both label and dates | Medium | Use responsive text sizing or truncation; consider wrapping on narrow viewports |
| User dropdown and date picker overlays use z-index — ensure no layering issues with new background | Low | z-index values are already set (50, 100) and should work regardless of background color |
| Removing title from header may break layout if flex depends on both sides having content | Low | Test with empty left side; add min-height or placeholder if needed |

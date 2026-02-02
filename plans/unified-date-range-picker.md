# Plan: Unified Date Range Picker

## 1. Research Findings

### Current State
Date selection is currently fragmented across the application. Each view implements its own logic, or lacks date control entirely.

| View | Current Date Handling | Support for Custom Ranges |
| :--- | :--- | :--- |
| **Dashboard** | Fixed 30-day executive summary; 90/30d spend mix. | **No UI control**, but backend `/live` reports support it. |
| **Overviews** | Ad-hoc dropdown (This Month, Last Month, etc.). | **Yes**, uses `/live` endpoints with `start`/`end` dates. |
| **Monitors** | Unified feed (recent). | **Partial**, backend supports sorting but not yet filtering by range. |
| **Charts (Superlatives)** | Monthly dropdown. | **Locked to Monthly**, pre-aggregated for history/streaks. |
| **Creative Lab** | Ad-hoc dropdown (30d, 90d, This Month, etc.). | **Yes**, uses `/live` endpoints. |
| **AI Report Builder** | Monthly dropdown. | **Locked to Monthly**, depends on Superlatives. |
| **Google Ads Suite** | No date control. | **Partial**, anomaly endpoints need `start`/`end` support. |

### Technical Feasibility
- **Backend**: `src/shared/data/queryBuilder.ts` (used by `/live` reports) already supports `startDate` and `endDate`.
- **API**: `/api/executive/summary` and `/api/monitors/anomalies` need to be updated to accept `start` and `end` parameters.
- **Data Constraints**: Superlatives are calculated on a monthly cadence for "Month-over-Month" streaks and positions. Custom ranges (e.g., 12 days) would require a different aggregation logic that doesn't currently exist in the "Story Engine".

---

## 2. Proposed Solution

### Architecture
1.  **Global Date State**: Implement a `useDateRange` composable (or Pinia store if preferred, though composable is standard here) to keep all views in sync.
2.  **Unified Component**: A central `DateRangePicker` component using `@vuepic/vue-datepicker`.
3.  **API Standardization**: All data-fetching endpoints will transition to accepting `start_date` and `end_date` (YYYY-MM-DD).

### Date Range Presets
- Today
- Yesterday
- This Week (Mon-Today)
- Last Week (Sun-Sat)
- This Month
- Last Month
- Last 7 Days
- Last 30 Days (Default)
- Last 60 Days
- Last 90 Days
- Year to Date
- Custom Range (Calendar)

---

## 3. Implementation Plan

### Phase 1: Infrastructure Updates (Backend)
1.  **Update `/api/executive/summary`**:
    - Add `start` and `end` query params.
    - If provided, use them instead of the `days` lookback.
2.  **Update `/api/monitors/anomalies`**:
    - Add `start` and `end` query params.
    - Filter `detected_at` in the BigQuery SQL.

### Phase 2: Global State & Component (Frontend)
1.  **Install Dependency**: `yarn add @vuepic/vue-datepicker`.
2.  **Create `useDateRange` Composable**:
    - Centralized reactive state for `startDate` and `endDate`.
    - Helper functions to calculate preset dates.
3.  **Create `GlobalDateSelector.vue`**:
    - Integrated in the `Sidebar.vue` or a new top header bar.
    - Features the dual-pane picker: Presets + Calendar.

### Phase 3: View Refactoring
1.  **Refactor `OverviewsView.vue`, `CreativeLabView.vue`**:
    - Remove local date state.
    - Watch the global `useDateRange` and re-fetch.
2.  **Refactor `DashboardView.vue`**:
    - Connect the executive summary and spend mix to the global range.
3.  **Refactor `GoogleAdsView.vue`, `MonitorsView.vue`**:
    - Add date filtering support.
4.  **Handle "Monthly" Views (`Superlatives`, `ReportBuilder`)**:
    - If the global range is not exactly a single month, these views should either:
        a) Display the superlatives for the *latest* month within the selected range.
        b) Show a warning/info badge that rankings are monthly.

---

## 4. Design Guidelines
- **Visual Style**: Follow the "Executive/Focus" aesthetic (indigo/slate tones).
- **UX**: The picker should be "one-click" for presets, but allow precise selection for audits.
- **Consistency**: The date range should persist across navigation (managed by global state).

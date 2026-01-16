# Engineering Plan: Unified Reporting Architecture

## Philosophy: "Define Once, Run Anywhere"
We will reuse the existing `AggregateReport` definitions as the single source of truth for both:
1.  **Background Monitoring:** Scheduled snapshots (already implemented).
2.  **Interactive Dashboards:** Live, date-range specific queries (new).

## 1. Shared Query Builder (`src/shared/data/queryBuilder.ts`)

We need to extract the SQL generation logic from `AggregateReportExecutor` into a standalone builder that can handle dynamic date ranges and grains.

```typescript
interface QueryOptions {
  startDate: string;
  endDate: string;
  timeGrain?: 'daily' | 'total'; // 'total' is default
}

export function buildReportQuery(report: AggregateReport<any>, options: QueryOptions): string {
  // 1. Identify Source Table (Entity FQN)
  // 2. Resolve Dimensions (Report Grain + optional 'date' if daily)
  // 3. Resolve Metrics (Sum/Count/etc defined in Report)
  // 4. Resolve Derived Fields (ROAS, etc defined in Report)
  // 5. Apply Report Predicate (Filters) + Date Range Filters
  // 6. Return SQL
}
```

## 2. Server API Updates (`src/server/index.ts`)

Add a standardized endpoint for live reporting.

### Endpoint: `GET /api/reports/:reportId/live`

**Parameters:**
*   `start`: YYYY-MM-DD
*   `end`: YYYY-MM-DD
*   `grain`: 'daily' | 'total' (default 'total')
*   `...accountIds`: Standard account filtering

**Behavior:**
1.  Finds the `AggregateReport` instance by `reportId`.
2.  Calls `buildReportQuery` with the provided parameters.
3.  Executes query against BigQuery (caching could be added here later).
4.  Returns standardized JSON result.

## 3. Client Implementation (`OverviewsView.vue`)

*   **State:** `dateRange` (e.g., "This Month"), `activeTab` (Report ID).
*   **Fetching:**
    *   On load/change, call `/live` endpoint with `grain=daily`.
    *   This returns an array like: `[{ date: '...', campaign: '...', spend: 100 }, ...]`.
*   **Processing:**
    *   **Totals:** Aggregated client-side from the daily data (Sum of spend) OR fetched via a separate `grain=total` call if pagination is needed (for now, client-side agg is fine for <10k rows).
    *   **Sparklines:** Group by the Report's primary grain (e.g., Campaign) and map the daily sequence to a sparkline component.

## 4. Implementation Checklist

- [ ] Extract `buildQuery` logic from `AggregateReportExecutor`.
- [ ] Create `/api/reports/:reportId/live` endpoint.
- [ ] Update `OverviewsView` to include a Date Picker.
- [ ] Update `OverviewsView` to use the new live endpoint.
- [ ] Add Sparkline visualization to the data table.
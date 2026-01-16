# Platform Overview: Aggregate Reports Plan

This document outlines the plan to implement high-level "Rollup" Aggregate Reports for each supported platform. These reports will power the platform-specific dashboard views, offering a concise scorecard and performance breakdown.

## 1. Google Ads

### Report: `google_ads_campaign_performance`
*   **Goal:** High-level campaign performance summary.
*   **Source Entity:** `adsDaily`
*   **Filter:** `platform = 'google'`
*   **Grain (Breakdown):** `campaign_name`
*   **Metrics:**
    *   `spend` (Sum)
    *   `impressions` (Sum)
    *   `clicks` (Sum)
    *   `conversions` (Sum)
    *   `revenue` (Sum)
*   **Derived Metrics:**
    *   `roas`: `revenue / spend`
    *   `cpa`: `spend / conversions`
    *   `ctr`: `clicks / impressions`

## 2. Meta Ads (Facebook & Instagram)

### Report: `meta_ads_campaign_performance`
*   **Goal:** High-level campaign performance summary.
*   **Source Entity:** `adsDaily`
*   **Filter:** `platform = 'facebook'`
*   **Grain (Breakdown):** `campaign_name`
*   **Metrics:**
    *   `spend` (Sum)
    *   `impressions` (Sum)
    *   `clicks` (Sum)
    *   `conversions` (Sum)
    *   `revenue` (Sum)
*   **Derived Metrics:**
    *   `roas`: `revenue / spend`
    *   `cpa`: `spend / conversions`
    *   `ctr`: `clicks / impressions`

## 3. Google Analytics 4 (GA4)

### Report: `ga4_acquisition_performance`
*   **Goal:** Traffic source and acquisition quality.
*   **Source Entity:** `ga4Daily`
*   **Grain (Breakdown):** `channel_group` (e.g., "Organic Search", "Paid Social")
*   **Metrics:**
    *   `sessions` (Sum)
    *   `engaged_sessions` (Sum)
    *   `conversions` (Sum)
    *   `revenue` (Sum)
*   **Derived Metrics:**
    *   `engagement_rate`: `engaged_sessions / sessions`
    *   `conversion_rate`: `conversions / sessions`

## 4. Shopify

### Update Required
*   **Action:** Update `shopifyDaily` entity to include `source` dimension from `shopifyOrders` import.
*   **Reason:** To enable breakdown by sales channel (e.g., "web", "pos").

### Report: `shopify_source_performance`
*   **Goal:** Sales breakdown by origin/channel.
*   **Source Entity:** `shopifyDaily`
*   **Grain (Breakdown):** `source`
*   **Metrics:**
    *   `orders` (Sum)
    *   `revenue` (Sum)
    *   `refunds` (Sum)
*   **Derived Metrics:**
    *   `aov`: `revenue / orders`
    *   `refund_rate`: `refunds / revenue`

## 5. Social Media (Organic)

### Update Required
*   **Action:** Update `socialMediaDaily` entity to include `shares` metric.
*   **Source:** `instagramMedia` (`media_shares`). `facebookOrganicPosts` will be 0/NULL.

### Report: `social_media_platform_performance`
*   **Goal:** Comparative performance between Instagram and Facebook Organic.
*   **Source Entity:** `socialMediaDaily`
*   **Grain (Breakdown):** `platform`
*   **Metrics:**
    *   `impressions` (Sum)
    *   `likes` (Sum)
    *   `comments` (Sum)
    *   `shares` (Sum)
    *   `engagement` (Sum)
*   **Derived Metrics:**
    *   `engagement_rate`: `engagement / impressions`

## Implementation Steps

1.  **Update `shopifyDaily`**: Add `source` to dimensions and grain.
2.  **Update `socialMediaDaily`**: Add `shares` metric.
3.  **Create Report Files**:
    *   `src/jobs/entities/ads-daily/aggregateReports/google-ads-campaign.aggregateReport.ts`
    *   `src/jobs/entities/ads-daily/aggregateReports/meta-ads-campaign.aggregateReport.ts`
    *   `src/jobs/entities/ga4-daily/aggregateReports/ga4-acquisition.aggregateReport.ts`
    *   `src/jobs/entities/shopify-daily/aggregateReports/shopify-source.aggregateReport.ts`
    *   `src/jobs/entities/social-media-daily/aggregateReports/social-platform.aggregateReport.ts`
3.  **Register Reports**: Ensure they are exported in `src/jobs/entities/*/index.ts` (if applicable) or discovered by CLI.
4.  **CLI Discovery**: Verify `cli` picks up the new files.

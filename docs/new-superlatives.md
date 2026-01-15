# Roadmap: Future Superlatives & Insights

This document categorizes potential insights by the effort required to implement them, identifying the specific data dependencies for each.

---

## 🟢 Level 1: Quick Wins
*Uses data already being imported. Requires only new Entity logic or Award definitions.*

### 1. "The Viral Hit" (Shopify)
*   **What**: Product with the highest % increase in units sold month-over-month.
*   **Data Needed**: Already exists in `shopifyProductDaily`.
*   **Work**: Create a new `GrowthAward` definition that compares `currentItem.metric_value` vs `previousItem.metric_value`.

### 2. "SEO Rockstar" (GA4)
*   **What**: The non-paid page path generating the most organic sessions and revenue.
*   **Data Needed**: Already exists in `ga4Daily`.
*   **Work**: Create a new `Measure` with a filter for `source_medium == 'organic'`.

### 3. "The Gold Mine" (Google Ads)
*   **What**: A search term with low spend (<$50) but a 100% conversion rate.
*   **Data Needed**: Already exists in `keywordDaily`.
*   **Work**: Create a new `AwardDefinition` with a specific threshold check.

---

## 🟡 Level 2: Strategic Extensions
*Requires adding fields to existing imports or creating 1-2 new Bronze Imports.*

### 1. "The Thumb Stopper" (Meta Ads)
*   **What**: The specific Ad Creative (Image/Video) with the highest CTR.
*   **New Import**: `metaAdCreativeImport` (needs `ad_id`, `creative_id`, `preview_url`).
*   **New Entity**: `adCreativeDaily`.
*   **Work**: High value for creative teams to see which visuals are winning.

### 2. "The Refund King" (Shopify)
*   **What**: Product with the highest refund-to-sales ratio.
*   **Update Import**: Add `order_refunds_line_item_quantity` to `shopifyProducts`.
*   **Work**: Essential for identifying quality control issues or "misleading" marketing.

### 3. "The Whale Hunter" (Shopify)
*   **What**: The acquisition channel bringing in customers with the highest LTV (Lifetime Value).
*   **Update Import**: Add `customer_total_spent` and `customer_orders_count` to `shopifyOrders`.
*   **Work**: Helps shift focus from "cheap clicks" to "high-value humans."

---

## 🔴 Level 3: Advanced Ecosystem Joins
*Requires complex SQL joins between different data sources (e.g., GA4 + Shopify).*

### 1. "The Window Shopper" (GA4 + Shopify)
*   **What**: Products with the highest views (GA4) but the lowest purchase rate (Shopify).
*   **The Join**: Join `ga4Daily` (on `page_path`) with `shopifyProductDaily` (on `product_handle/title`).
*   **Work**: Requires mapping URL paths to Product IDs. High effort, but solves the "why isn't this selling?" question.

### 2. "The Assisted Assist" (Google/Meta + GA4)
*   **What**: A campaign that never gets the "Final Click" but appears in the most "Assisted" conversion paths.
*   **New Import**: Windsor `google_ads_assisted_conversions`.
*   **Work**: Moves beyond last-click attribution to show the true value of awareness campaigns.

### 3. "The Inventory Prophet" (Shopify + Ads)
*   **What**: Campaigns driving traffic to products that are currently Out of Stock (OOS).
*   **Data Needed**: Shopify Inventory levels joined with Google/Meta Ad Destination URLs.
*   **Work**: High operational impact (prevents wasted spend).
### Dimension (part of an address)

Any non-measurement property. IE: campaign name, campaign ID, ad group name, ad group ID, keyword, etc.

### Metric (a numeric measurement)

Any property that contains a numeric measurement. IE: impressions, clicks, sessions, page views, add to cart value, conversion value…

### Grain (full address)

A combination of dimensions that fully identify the location of a set of metrics. IE: (date x campaign)

# 2-Dimensional Example

Dimensions: Date, Campaign

Grain: date x campaign

Metrics: impressions, clicks, sessions, page views, add to cart value, conversion value

### 2-Dimensional table (date x campaign)

|  | Campaign 1 | Campaign 2 … |
| --- | --- | --- |
| 2025-01-01 | impressions, clicks, sessions, page views, add to cart value, conversion value… | … |
| 2025-01-02 | … | … |

Actual schema example

|  | Campaign name | impressions | clicks | sessions | avg page views | avg add to cart value | conv. value |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2025-01-01 | Fall Whatever | 2342 | 20 | 28 | 4.23 | 229.82 | 159.22 |
| 2025-01-02 | Fall Whatever | 2455 | 18 | 24 | 3.423 | 323.82 | 221.33 |

# Colors

1. **Bronze = raw API responses**
2. **Silver = shared grains (conformed around business concepts)** 
3. **Gold = fully refined reports**



                    ┌─────────────────────────────────────────────────────────┐
                    │                      API DATA                           │
                    │       *Raw, unmodeled, API-shaped data*                 │
                    └─────────────────────────────────────────────────────────┘
                                   ▲            ▲                ▲
                                   │            │                │
                               Raw APIs     Raw APIs         Raw APIs
                          (Google Ads API,  Meta/Facebook,   GA4, TikTok,
                           YouTube, IG,     Shopify, etc.)    etc.)
                                   │            │                │
                                   ▼            ▼                ▼
         ┌────────────────────────────────────────────────────────────────────────┐
         │                     BRONZE DATA TYPES (RAW)                            │
         │                                                                        │
         │ - GoogleAds_KeywordStatsRaw                                            │
         │ - GoogleAds_SearchTermsRaw                                             │
         │ - GoogleAds_AdGroupStatsRaw                                            │
         │ - GA4_EventsRaw                                                        │
         │ - Shopify_OrdersRaw                                                    │
         │ - MetaAds_AdSetInsightsRaw                                             │
         │ - YouTube_ChannelStatsRaw                                              │
         │ ... (all direct API dump tables)                                       │
         └────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │  (Bronze → Silver ETL)
                                    ▼
             ┌──────────────────────────────────────────────────────────────┐
             │                SILVER ENTITY TYPES (FEATURE VIEWS)           │
             │     *Normalized, typed, grain-stable analytical views*       │
             │                                                              │
             │   These are your “typed tables” (entity = typed IR).         │
             │                                                              │
             │   CampaignPerformance              (grain: campaign_id)      │
             │   AdGroupPerformance              (grain: adgroup_id)        │
             │   KeywordPerformance              (grain: keyword_id)        │
             │   SearchTermPerformance           (grain: search_term)       │
             │   CreativePerformance             (grain: ad_id / asset_id)  │
             │   GeoPerformance                  (grain: geo, device, etc.) │
             │   AudiencePerformance             (grain: audience_id)       │
             │   EcommercePerformance            (grain: order_id or sku)   │
             │   TrafficPerformance              (grain: session or source) │
             │                                                              │
             │   Each provides:                                              │
             │   - fixed grain                                                │
             │   - canonical metrics (cost, clicks, conv, ROAS…)             │
             │   - cleaned dimensions (platform, device, geo…)               │
             └──────────────────────────────────────────────────────────────┘
                                    │
                                    │  (Silver → Gold: run all rules on entities)
                                    ▼
                     ┌────────────────────────────────────────────────────────┐
                     │                   GOLD OUTPUT TYPES  (Signal)                   │
                     │                                                        │
                     │  These are NOT row-level data: they are insights.      │
                     │                                                        │
                     │  Signal (base type):                                   │
                     │  {                                                    │
                     │    signalId,                                          │
                     │    signalType: deterministic | statistical | heuristic | exploratory │
                     │    intent: issue | opportunity | win | observation     │
                     │    direction: positive | negative | neutral            │
                     │    entityType: e.g. "CampaignPerformance"              │
                     │    entityId                                            │
                     │    metrics (snapshot)                                  │
                     │    summary { deterministic, llm }                      │
                     │    actions { deterministic, llm }                      │
                     │    impactEstimate?                                     │
                     │  }                                                     │
                     │                                                        │
                     │  Gold Dataset Includes:                                 │
                     │  - Issues (wasted spend, tracking errors)               │
                     │  - Opportunities (scale budget, improve structure)      │
                     │  - Wins (big ROAS spike, CPA drop, creative breakout)  │
                     │  - Observations (clusters, anomalies, trends)          │
                     └────────────────────────────────────────────────────────┘

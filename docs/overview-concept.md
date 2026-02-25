**DEVELOPER SPECIFICATION**

**Platform Overviews — “Your Overview” Tab**

A unified cross-platform metrics view for the Overview section

Date: February 22, 2026   |   Version: 1.0   |   Status: Ready for Development

**Overview**

This document specifies a new first tab within the Platform Overviews section called “Your Overview.” This tab provides users with combined cross-platform metrics that cannot be found on any individual platform tab. It aggregates data from all connected sources through Windsor AI to give users a single, unified view of their total marketing performance.

**Key principle:** Every metric on this tab combines data from multiple platforms. If a metric could be seen on a single platform’s own tab, it does not belong here. This is the only place in Maxed where users see their total, blended marketing picture.

**Where This Fits**

This tab appears as the first tab in the Platform Overviews section, before the existing platform-specific tabs (Google Ads, Meta Ads, Google Analytics, Shopify, Instagram, Facebook, Search Console). It inherits the global time period selector already in use across Overview.

**Data Source**

All data is pulled from the Windsor AI integration, which connects to the user’s actual accounts across all platforms. Data flows into our data lake and is normalized before being served to this view. The specific Windsor connectors used are: Google Ads, Meta Ads, TikTok Ads, Google Analytics (GA4), Google Search Console, Instagram (organic), Facebook (organic), TikTok (organic), and Shopify.

**Period-Over-Period Comparison**

Every metric on this tab must display a percentage change indicator comparing the current selected period to the equivalent prior period (e.g., last 30 days vs. the 30 days before that). Use green for positive change and red for negative change, consistent with existing Dashboard patterns.

**Layout Approach**

The tab uses a grouped section container layout rather than equal-sized individual cards. Each group gets a full-width row with a labeled section header. Within each group, metrics can vary in visual size and weight based on importance. This follows established dashboard UX best practices for visual hierarchy and grouped KPI display.

**Layout Structure**

The page is organized into three horizontal rows, each representing a logical grouping of metrics. Each row has a subtle section label and contains its metrics within a single visual container.

| **ROW 1** | **PAID MEDIA**
5 metrics  |  Hero + supporting pattern  |  2 large hero cards + 3 smaller supporting cards |
| --- | --- |
| **ROW 2** | **ORGANIC SOCIAL**
4 metrics  |  Hero + supporting pattern  |  2 large hero cards + 2 smaller supporting cards |
| **ROW 3** | **SEARCH & SITE**
2 metrics  |  Equal weight  |  2 equal-sized cards side by side |

**Visual Hierarchy Within Groups**

Each group uses a “hero + supporting” pattern. Hero metrics are displayed at approximately 1.5–2x the width of supporting metrics within the same row container. Hero metrics answer the primary question a user has about that category. Supporting metrics provide context.

**Row 1 (Paid Media):** Total Ad Spend and Total Ad Conversions are the hero metrics (answering “how much did I spend?” and “what did I get?”). Total Impressions, Total Clicks, and Blended CPC are the supporting metrics.

**Row 2 (Organic Social):** Total Organic Reach and Total Social Engagement are the hero metrics (answering “who saw my content?” and “are they interacting?”). Total Followers and Engagement Rate are the supporting metrics.

**Row 3 (Search & Site):** Total Search Visibility and Total Website Sessions are displayed at equal size. These two tell the “are people finding me and showing up?” story.

**Row 1: Paid Media**

This group aggregates all paid advertising data across Google Ads, Meta Ads, and TikTok Ads. It contains 5 metrics: 2 hero-sized and 3 supporting-sized.

| **Metric Name**                 | **Data Sources (Windsor)**                                                    | **Calculation**                                            | **Display Format**                                |
| ------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| **Total Ad Spend (HERO)**       | Google Ads: cost Meta Ads: spend TikTok Ads: spend                            | Sum all platform spend values for the selected period      | Currency ($X,XXX.XX) % change vs prior period     |
| **Total Ad Conversions (HERO)** | Google Ads: conversions Meta Ads: actions (purchases) TikTok Ads: conversions | Sum all platform conversion counts for the selected period | Whole number % change vs prior period             |
| **Total Ad Impressions**        | Google Ads: impressions Meta Ads: impressions TikTok Ads: impressions         | Sum all platform impression counts for the selected period | Whole number with commas % change vs prior period |
| **Total Ad Clicks**             | Google Ads: clicks Meta Ads: clicks TikTok Ads: clicks                        | Sum all platform click counts for the selected period      | Whole number with commas % change vs prior period |
| **Blended CPC**                 | Derived from above metrics                                                    | Total Ad Spend ÷ Total Ad Clicks                           | Currency ($X.XX) % change vs prior period         |

**Row 2: Organic Social**

This group aggregates organic social media performance across Instagram, Facebook, and TikTok organic accounts. It contains 4 metrics: 2 hero-sized and 2 supporting-sized.

| **Metric Name**                    | **Data Sources (Windsor)**                                                                                  | **Calculation**                                                                                                                        | **Display Format**                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Total Organic Reach (HERO)**     | Instagram: impressions Facebook: impressions TikTok: impressions                                            | Sum all organic platform impression counts for the selected period                                                                     | Whole number with commas % change vs prior period |
| **Total Social Engagement (HERO)** | Instagram: likes, comments, shares, saves Facebook: likes, comments, shares TikTok: likes, comments, shares | Sum all available engagement metrics across all organic platforms for the selected period. Use every engagement type Windsor provides. | Whole number with commas % change vs prior period |
| **Total Followers**                | Instagram: followers Facebook: page_fans / followers TikTok: followers                                      | Sum current follower counts across all organic social platforms                                                                        | Whole number with commas % change vs prior period |
| **Content Engagement Rate**        | Derived from above metrics                                                                                  | Total Social Engagement ÷ Total Organic Reach × 100                                                                                    | Percentage (X.XX%) % point change vs prior period |

**Note on engagement types:** Use all engagement metrics available through Windsor for each platform. This includes but is not limited to: likes, comments, shares, saves, reactions, and any other interaction types exposed by the API. If Windsor adds new engagement types in the future, they should be included automatically.

**Row 3: Search & Site**

This group combines search visibility with overall site traffic. It contains 2 metrics displayed at equal size, side by side.

| **Metric Name**             | **Data Sources (Windsor)**                                              | **Calculation**                                                                                                                                                  | **Display Format**                                                                                |
| --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Total Search Visibility** | Google Search Console: impressions, clicks GA4: organic search sessions | Display Search Console impressions as the primary number. Show Search Console clicks and GA4 organic search sessions as supporting context within the same card. | Primary: impressions (whole number) Secondary: clicks + organic sessions % change vs prior period |
| **Total Website Sessions**  | GA4: sessions (all channels)                                            | Total session count from GA4 across all traffic sources for the selected period                                                                                  | Whole number with commas % change vs prior period                                                 |

**Note on Search Visibility:** This card is intentionally richer than the others because it bridges two data sources (Search Console and GA4) within one concept. The primary display is the Search Console impression count (how often the site appeared in search). Below that, show Search Console clicks and GA4 organic search sessions as supporting data points. This gives users a complete picture of search performance from visibility through arrival.

**Technical Requirements**

**Data Integration**

- All data is sourced from Windsor AI connectors already in use for the individual platform tabs
- Aggregation calculations happen on our side — Windsor provides the per-platform raw data, we sum and derive blended metrics
- If a platform is not connected for a given user, exclude it from the aggregation and note which platforms are included (e.g., “From 2 of 3 ad platforms”)
- Time period inherits from the global time period selector already in the Overview section

**Period-Over-Period Logic**

- Each metric shows a percentage change comparing the current selected period to the equivalent prior period
- Example: if “Last 30 Days” is selected, compare to the 30 days immediately before that
- Green indicator for positive change, red for negative change, consistent with existing Dashboard styling
- For Content Engagement Rate, show percentage point change (not percentage of percentage change)

**Edge Cases**

- Missing platform: If a user has not connected one or more platforms, the aggregated metrics should still calculate from whatever is available. Display a subtle indicator showing which platforms are contributing (e.g., a small icon set or tooltip)
- No data: If a user has no platforms connected for a given group, show a clear empty state encouraging them to connect their accounts
- Zero values: Display $0.00 or 0, not blank. Zero is meaningful data
- Division by zero: For Blended CPC and Engagement Rate, if the denominator is zero, display “N/A” with a tooltip explaining why

**Tab Placement & Navigation**

The “Your Overview” tab is the first tab in the Platform Overviews section. The tab order becomes:

1. **Your Overview (NEW — this specification)**
2. Google Ads
3. Meta Ads
4. Google Analytics
5. Shopify
6. Instagram
7. Facebook
8. Search Console

This tab is the default landing view when a user navigates to the Overviews section. It should be the selected/active tab on page load.

**Complete Metric Summary**

For quick reference, here is every metric on the “Your Overview” tab with its group, role, and source platforms:

| **#** | **Metric**                  | **Role** | **Group**      | **Platforms Combined**        |
| ----- | --------------------------- | -------- | -------------- | ----------------------------- |
| 1     | **Total Ad Spend**          | Hero     | Paid Media     | Google Ads + Meta + TikTok    |
| 2     | **Total Ad Conversions**    | Hero     | Paid Media     | Google Ads + Meta + TikTok    |
| 3     | Total Ad Impressions        | Support  | Paid Media     | Google Ads + Meta + TikTok    |
| 4     | Total Ad Clicks             | Support  | Paid Media     | Google Ads + Meta + TikTok    |
| 5     | Blended CPC                 | Support  | Paid Media     | Derived from #1 and #4        |
| 6     | **Total Organic Reach**     | Hero     | Organic Social | Instagram + Facebook + TikTok |
| 7     | **Total Social Engagement** | Hero     | Organic Social | Instagram + Facebook + TikTok |
| 8     | Total Followers             | Support  | Organic Social | Instagram + Facebook + TikTok |
| 9     | Content Engagement Rate     | Support  | Organic Social | Derived from #6 and #7        |
| 10    | Total Search Visibility     | Equal    | Search & Site  | Search Console + GA4          |
| 11    | Total Website Sessions      | Equal    | Search & Site  | GA4 (all channels)            |

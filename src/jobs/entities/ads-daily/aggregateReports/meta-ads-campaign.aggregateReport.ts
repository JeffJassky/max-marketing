import { AggregateReport } from "../../../base";
import { adsDaily } from "../ads-daily.entity";
import { z } from "zod";

export const metaAdsCampaignPerformance = new AggregateReport({
  id: "metaAdsCampaignPerformance",
  description: "High-level campaign performance rollup for Meta Ads.",
  source: adsDaily,
  predicate: "platform = 'facebook' AND spend > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "campaign_id", "campaign_name"],
    metrics: {
      spend: { aggregation: "sum", display: { format: "currency", description: "Total ad spend on Meta platforms. This covers everything from boosted posts to high-conversion Instagram Story ads." } },
      conversions_value: { aggregation: "sum", display: { format: "currency", description: "Revenue from purchase events tracked by the Meta Pixel. This is filtered to purchase-type conversions only (via action_values), so it represents actual sales revenue, not general conversion value." } },
      impressions: { aggregation: "sum", display: { format: "number", description: "Total exposure. This measures the scale of your 'interruption' marketing, showing how many times your creative appeared in user feeds." } },
      clicks: { aggregation: "sum", display: { format: "number", description: "Engagement volume. This represents the number of users who stopped scrolling and clicked to learn more about your brand." } },
      conversions: { aggregation: "sum", display: { format: "number", description: "Total results. These are the specific outcomes—like sales or leads—that Meta identifies as coming directly from your social ads." } },
    },
    derivedFields: {
      roas: {
        expression: "SAFE_DIVIDE(conversions_value, spend)",
        type: z.number(),
        display: { format: "ratio", description: "Return on Ad Spend for Meta. Shows revenue generated per dollar spent on Facebook and Instagram ads." },
      },
      cpa: {
        expression: "SAFE_DIVIDE(spend, conversions)",
        type: z.number(),
        display: { format: "currency", description: "Cost Per Acquisition on Meta. Average spend required to generate one conversion." },
      },
      ctr: {
        expression: "SAFE_DIVIDE(clicks, impressions)",
        type: z.number(),
        display: { format: "percent", description: "Click-Through Rate. Percentage of people who clicked after seeing your ad. Reflects creative and targeting effectiveness." },
      },
    },
  },
  orderBy: { field: "spend", direction: "desc" },
});

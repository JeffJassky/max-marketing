import { AggregateReport } from "../../../base";
import { adsDaily } from "../ads-daily.entity";
import { z } from "zod";

export const googleAdsCampaignPerformance = new AggregateReport({
  id: "googleAdsCampaignPerformance",
  description: "High-level campaign performance rollup for Google Ads.",
  source: adsDaily,
  predicate: "platform = 'google' AND spend > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "campaign_id", "campaign_name"],
    metrics: {
      spend: { aggregation: "sum", display: { format: "currency", description: "Total amount billed by Google for your search, display, and video ads. This represents your raw investment into capturing search intent." } },
      conversions_value: { aggregation: "sum", display: { format: "currency", label: "Purchase Revenue", description: "The total dollar value of all conversion actions tracked by Google Ads. Note: this includes all conversion types (purchases, leads, signups, etc.), not just sales revenue." } },
      impressions: { aggregation: "sum", display: { format: "number", description: "Visibility count. This shows how many times your brand appeared in front of potential customers, regardless of whether they clicked." } },
      clicks: { aggregation: "sum", display: { format: "number", description: "Total traffic generated. This measures the number of users who found your ad compelling enough to take the first step toward your site." } },
      conversions: { aggregation: "sum", display: { format: "number", description: "Success count. This tracks the total number of users who completed a high-value action, such as a purchase, after clicking your Google ad." } },
    },
    derivedFields: {
      roas: {
        expression: "SAFE_DIVIDE(conversions_value, spend)",
        type: z.number(),
        display: { format: "ratio", description: "Return on Ad Spend. For every dollar spent, this shows how much revenue was generated. Higher is better." },
      },
      cpa: {
        expression: "SAFE_DIVIDE(spend, conversions)",
        type: z.number(),
        display: { format: "currency", description: "Cost Per Acquisition. The average cost to acquire one conversion. Lower is typically better." },
      },
      ctr: {
        expression: "SAFE_DIVIDE(clicks, impressions)",
        type: z.number(),
        display: { format: "percent", description: "Click-Through Rate. The percentage of impressions that resulted in a click. Indicates ad relevance and appeal." },
      },
    },
  },
  orderBy: { field: "spend", direction: "desc" },
});

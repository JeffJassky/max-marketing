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
      spend: { aggregation: "sum" },
      impressions: { aggregation: "sum" },
      clicks: { aggregation: "sum" },
      conversions: { aggregation: "sum" },
      conversions_value: { aggregation: "sum" },
    },
    derivedFields: {
      roas: {
        expression: "SAFE_DIVIDE(conversions_value, spend)",
        type: z.number(),
      },
      cpa: {
        expression: "SAFE_DIVIDE(spend, conversions)",
        type: z.number(),
      },
      ctr: {
        expression: "SAFE_DIVIDE(clicks, impressions)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "spend", direction: "desc" },
});

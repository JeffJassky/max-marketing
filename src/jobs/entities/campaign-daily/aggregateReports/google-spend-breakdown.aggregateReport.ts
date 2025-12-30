import { AggregateReport } from "../../../base";
import { campaignDaily } from "../campaign-daily.entity";
import { z } from "zod";

export const googleSpendBreakdown = new AggregateReport({
  id: "googleSpendBreakdown",
  description: "Aggregated Google Ads spend by channel category.",
  source: campaignDaily,
  predicate: "spend > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "category"],
    metrics: {
      spend: { aggregation: "sum" },
      conversions: { aggregation: "sum" },
      impressions: { aggregation: "sum" },
      clicks: { aggregation: "sum" },
      conversions_value: { aggregation: "sum" },
    },
    derivedFields: {
      roas: {
        expression:
          "CASE WHEN spend > 0 THEN conversions_value / spend ELSE 0 END",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "spend", direction: "desc" },
});

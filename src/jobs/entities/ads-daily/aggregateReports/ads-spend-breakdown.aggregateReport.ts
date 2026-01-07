import { AggregateReport } from "../../../base";
import { adsDaily } from "../ads-daily.entity";
import { z } from "zod";

export const adsSpendBreakdown = new AggregateReport({
  id: "adsSpendBreakdown",
  description: "Unified ad spend breakdown by platform and channel group.",
  source: adsDaily,
  predicate: "spend > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "platform", "channel_group"],
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

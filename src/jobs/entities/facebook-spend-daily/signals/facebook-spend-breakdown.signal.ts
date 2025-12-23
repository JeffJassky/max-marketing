import { Signal } from "../../../base";
import { facebookSpendDaily } from "../facebook-spend-daily.entity";
import { z } from "zod";

export const facebookSpendBreakdown = new Signal({
  id: "facebookSpendBreakdown",
  description: "Aggregated Facebook spend by placement category.",
  source: facebookSpendDaily,
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
    },
    derivedFields: {
      roas: {
        expression: "0", // Facebook API often doesn't give value easily without complex mapping, defaulting to 0 for now or calculated in frontend if value exists
        type: z.number(),
      },
    },
  },
  orderBy: { field: "spend", direction: "desc" },
});

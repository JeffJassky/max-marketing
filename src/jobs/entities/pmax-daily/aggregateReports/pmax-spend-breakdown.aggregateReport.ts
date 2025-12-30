import { AggregateReport } from "../../../base";
import { pmaxDaily } from "../pmax-daily.entity";
import { z } from "zod";

export const pmaxSpendBreakdown = new AggregateReport({
  id: "pmaxSpendBreakdown",
  description:
    "Breakdown of PMax spend into Shopping vs Other (Search, Display, Video).",
  source: pmaxDaily,
  predicate: "total_spend > 0", // Return all active PMax campaigns
  window: {
    id: "last_30d",
    lookbackDays: 30,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "campaign_id", "campaign"],
    metrics: {
      total_spend: {
        expression: "SUM(total_spend)",
        type: z.number(),
      },
      shopping_spend: {
        expression: "SUM(shopping_spend)",
        type: z.number(),
      },
      youtube_spend: {
        expression: "SUM(youtube_spend)",
        type: z.number(),
      },
      display_spend: {
        expression: "SUM(display_spend)",
        type: z.number(),
      },
      search_spend: {
        expression: "SUM(search_spend)",
        type: z.number(),
      },
      other_spend: {
        expression: "SUM(other_spend)",
        type: z.number(),
      },
      total_conversions: {
        expression: "SUM(total_conversions)",
        type: z.number(),
      },
    },
    derivedFields: {
      shopping_share: {
        expression: "SAFE_DIVIDE(shopping_spend, total_spend)",
        type: z.number(),
      },
    },
  },
  orderBy: { field: "total_spend", direction: "desc" },
});

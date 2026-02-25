import { AggregateReport } from "../../../base";
import { ga4Daily } from "../ga4-daily.entity";
import { z } from "zod";

export const ga4AcquisitionPerformance = new AggregateReport({
  id: "ga4AcquisitionPerformance",
  description: "Traffic source and acquisition quality rollup for GA4.",
  source: ga4Daily,
  predicate: "sessions > 0",
  window: {
    id: "last_90d",
    lookbackDays: 90,
    dateDimension: "date",
  },
  output: {
    grain: ["account_id", "channel_group"],
    metrics: {
      revenue: { aggregation: "sum", display: { format: "currency", description: "Total purchase revenue tracked by Google Analytics. May differ from Shopify due to attribution methodology." } },
      sessions: { aggregation: "sum", display: { format: "number", description: "Total visits to your site. A session starts when a user arrives and ends after 30 minutes of inactivity." } },
      conversions: { aggregation: "sum", display: { format: "number", description: "The total number of high-value actions taken on your site. This includes purchases and other 'milestone' actions like adding an item to the cart." } },
      engaged_sessions: { aggregation: "sum", display: { format: "number", description: "Sessions where users spent 10+ seconds, had 2+ page views, or completed a conversion. Quality engagement indicator." } },
      // Added for GA4 Overview spec compliance
      active_users: { aggregation: "sum", display: { format: "number", description: "The number of distinct users who visited your site during this period." } },
      event_count: { aggregation: "sum", display: { format: "number", description: "Total number of events triggered across all users and sessions." } },
      user_engagement_duration: { aggregation: "sum", display: { format: "duration", description: "The total amount of time your website was actively in users' foreground across all sessions." } },
    },
    derivedFields: {
      engagement_rate: {
        expression: "SAFE_DIVIDE(engaged_sessions, sessions)",
        type: z.number(),
        display: { format: "percent", description: "This measures traffic quality. A high engagement rate means your visitors are actually interacting with your content rather than leaving immediately." },
      },
      conversion_rate: {
        expression: "SAFE_DIVIDE(conversions, sessions)",
        type: z.number(),
        display: { format: "percent", description: "The percentage of sessions that resulted in a conversion. Higher rates indicate more effective traffic and site experience." },
      },
      // Spec: Average Engagement Time = Total Engagement Time / Active Users
      avg_engagement_time: {
        expression: "SAFE_DIVIDE(user_engagement_duration, active_users)",
        type: z.number(),
        display: { format: "duration", description: "The average time a user spends actively looking at your site. For high-ticket items, longer times often indicate higher purchase intent." },
      },
      // Spec: Event Count per User = Total Event Count / Total Users
      events_per_user: {
        expression: "SAFE_DIVIDE(event_count, active_users)",
        type: z.number(),
        display: { format: "number", description: "This shows how 'busy' your users are. More events per user generally mean they are exploring multiple products or reading deep into your content." },
      },
    },
  },
  orderBy: { field: "sessions", direction: "desc" },
});

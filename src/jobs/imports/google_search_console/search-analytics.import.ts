import { BronzeImport } from "../../base";
import { z } from "zod";

/**
 * Google Search Console - Search Analytics Import
 *
 * Raw search performance data from Google Search Console via Windsor connector.
 * Includes queries, pages, clicks, impressions, CTR, and position data.
 */
export const googleSearchConsoleAnalytics = new BronzeImport({
  id: "googleSearchConsoleAnalytics",
  description: "Raw search analytics data from Google Search Console including queries, pages, clicks, impressions, and ranking positions.",
  platform: "searchconsole",
  endpoint: "searchconsole",
  version: 1,
  partitionBy: "date",
  clusterBy: ["account_id", "query", "page"],
  uniquenessKey: ["date", "account_id", "query", "page", "device", "country"],
  params: {
    date_preset: "last_7d", // Using 7 days due to high data volume with granular dimensions
  },
  dimensions: {
    // Core identifiers
    account_id: z.string().describe("The Site URL (property identifier)"),
    account_name: z.string().describe("The Site name"),
    date: z.string().describe("The date of the search data"),

    // Query & Page
    query: z.string().describe("The search query that triggered the result"),
    page: z.string().describe("The full page URL that appeared in search results"),

    // Segmentation
    device: z.string().describe("Device type: DESKTOP, MOBILE, or TABLET"),
    country: z.string().describe("Country code of the searcher"),
    search_type: z.string().describe("Type of search: web, image, video, or news"),

    // Derived dimensions
    branded_vs_nonbranded: z.string().describe("Whether query contains brand name"),
    hostname: z.string().describe("Domain name of the page"),
    pagepath: z.string().describe("Path portion of the page URL"),
  },
  metrics: {
    clicks: z.number().describe("Number of clicks from search results"),
    impressions: z.number().describe("Number of times the page appeared in search results"),
    ctr: z.number().describe("Click-through rate (clicks / impressions)"),
    position: z.number().describe("Average ranking position in search results"),
  },
});

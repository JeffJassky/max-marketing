import { getGeminiClient } from "../../shared/vendors/google/gemini";
import { createBigQueryClient } from "../../shared/vendors/google/bigquery/bigquery";
import { buildReportQuery } from "../../shared/data/queryBuilder";
import { coreMonitors, allAggregateReports } from "../registry";
import { Monitor } from "../../shared/data/monitor";
import { SchemaType } from "@google/generative-ai";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export class MarketingAgent {
  private bq = createBigQueryClient();

  constructor(private accountContext: Record<string, string>) {}

  async chat(history: ChatMessage[]) {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are Max, an expert marketing analyst. 
      You have access to the user's Google Ads, Meta Ads, and Shopify data.
      You can query performance summaries and active anomalies.
      ALWAYS verify data using tools before making claims.
      The current user context is: ${JSON.stringify(this.accountContext)}.
      Stay focused on marketing performance and actionable insights.`,
      tools: [{
        functionDeclarations: [
          {
            name: "get_performance_summary",
            description: "Get high-level scorecard metrics (MER, Spend, Revenue) for the current account.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                days: { type: SchemaType.NUMBER, description: "Lookback period in days (default 30)" }
              }
            }
          },
          {
            name: "list_active_anomalies",
            description: "List recent performance alerts and anomalies across all platforms.",
            parameters: { type: SchemaType.OBJECT, properties: {} }
          },
          {
            name: "query_data",
            description: "Query detailed metrics for a specific platform (ads, shopify, or ga4) over a date range.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                platform: { type: SchemaType.STRING, enum: ["ads", "shopify", "ga4"], format: "enum", description: "The data source to query" },
                metric: { type: SchemaType.STRING, description: "The metric to sum (e.g., spend, revenue, clicks, conversions)" },
                dimensions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Dimensions to group by (e.g., campaign_name, platform, source)" },
                days: { type: SchemaType.NUMBER, description: "Lookback period in days (default 30)" }
              },
              required: ["platform", "metric"]
            }
          }
        ]
      }]
    });

    const chat = model.startChat({
      history: history.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }))
    });

    // Initial Send
    const userMessage = history[history.length - 1].text;
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Agent Loop for Tool Calls
    let iterations = 0;
    while (response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && iterations < 5) {
      const toolCalls = response.candidates[0].content.parts.filter(p => p.functionCall);
      const toolResponses = await Promise.all(toolCalls.map(async (call) => {
        const { name, args } = call.functionCall!;
        console.log(`[Agent] Calling tool: ${name}`, args);
        
        let output: any = null;
        try {
          if (name === "get_performance_summary") {
            const days = (args as any).days || 30;
            output = await this.getPerformanceSummary(Number(days));
          } else if (name === "list_active_anomalies") {
            output = await this.listAnomalies();
          } else if (name === "query_data") {
            output = await this.queryData(args as any);
          }
        } catch (e: any) {
          output = { error: e.message };
        }

        return {
          functionResponse: {
            name,
            response: { content: output }
          }
        };
      }));

      result = await chat.sendMessage(toolResponses);
      response = result.response;
      iterations++;
    }

    return response.text();
  }

  private async getPerformanceSummary(days: number) {
    const accountIds = Object.values(this.accountContext).filter(Boolean);
    if (!accountIds.length) return { error: "No active account IDs found." };

    // Simply returning the count of data for now to prove tool use
    return {
      status: "Success",
      context: `Analyzing data for ${accountIds.join(', ')} over the last ${days} days.`,
      metrics: {
        note: "I am ready to help you analyze trends or specific platform performance."
      }
    };
  }

  private async listAnomalies() {
    const accountIds = Object.values(this.accountContext).filter(Boolean);
    const anomalies = await Monitor.getUnifiedAnomalies(coreMonitors, accountIds, 5);
    return anomalies;
  }

  private async queryData(args: { platform: string; metric: string; dimensions?: string[]; days?: number }) {
    const { platform, metric, dimensions = [], days = 30 } = args;
    const accountIds = Object.values(this.accountContext).filter(Boolean);
    
    const tableMap: Record<string, string> = {
      ads: "entities.ads_daily",
      shopify: "entities.shopify_daily",
      ga4: "entities.ga_4_daily"
    };

    const table = tableMap[platform];
    if (!table) throw new Error(`Unknown platform: ${platform}`);

    const selectDims = dimensions.length > 0 ? dimensions.join(", ") + ", " : "";
    const groupDims = dimensions.length > 0 ? `GROUP BY ${dimensions.join(", ")}` : "";

    const query = `
      SELECT 
        ${selectDims}
        SUM(${metric}) as ${metric}
      FROM \`${table}\`
      WHERE account_id IN UNNEST(@accountIds)
      AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
      ${groupDims}
      ORDER BY ${metric} DESC
      LIMIT 10
    `;

    const [rows] = await this.bq.query({
      query,
      params: { accountIds, days }
    });

    return rows;
  }
}

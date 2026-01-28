import { getGeminiClient } from "../../shared/vendors/google/gemini";
import { createBigQueryClient } from "../../shared/vendors/google/bigquery/bigquery";
import { buildReportQuery } from "../../shared/data/queryBuilder";
import {
  coreMonitors,
  allAggregateReports,
  getSchemaCatalog,
  allEntities,
  allImports,
} from "../registry";
import { Monitor } from "../../shared/data/monitor";
import { SchemaType } from "@google/generative-ai";

export interface ChatMessage {
  role: "user" | "model" | "ai";
  text: string;
}

export class MarketingAgent {
  private bq = createBigQueryClient();

  constructor(private accountContext: Record<string, string>) {}

  async chat(history: ChatMessage[]) {
    const catalog = getSchemaCatalog();

    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: `You are Max, an expert marketing analyst and assistant.
      Your goal is to provide deep, data-driven insights to help the user grow their business.
      
      PERSONA & PRIVACY RULES:
      1. NEVER mention "BigQuery", "SQL", "Virtual Tables", or internal table names like "adsDaily" or "shopifyDaily".
      2. If asked about your capabilities, describe them in business terms (e.g., "I can analyze your ad spend efficiency across Meta and Google, or deep-dive into your Shopify sales trends").
      3. Never show the literal SQL you write to the user.
      4. Speak like a human consultant, not a database interface.

      BUSINESS SAFETY & CONSERVATISM:
      1. Refrain from suggesting business actions (e.g., reallocating spend, shutting off campaigns, changing budgets) unless the user EXPLICITLY asks for a recommendation.
      2. Even when asked, only provide a recommendation if you have extremely high confidence (near 100%) based on the data.
      3. CRITICAL: Before giving any recommendation, you MUST verify the trend from multiple angles (e.g., check both platform-reported data and Shopify truth, compare multiple time ranges, and analyze secondary metrics like conversion rate vs. click volume) to rule out one-day flukes or tracking anomalies.
      4. Always error on the side of caution and conservatism. If there is ANY ambiguity, describe the data patterns you see rather than telling the user what to do.
      5. Never use forceful language like "You must" or "I strongly recommend". Use objective language like "The data indicates..." or "You may want to investigate...".
      
      DATA KNOWLEDGE (INTERNAL USE ONLY):
      - Use the provided schema catalog to understand what metrics and dimensions are available.
      - Always perform a query using 'execute_sql' before making definitive claims about performance.
      - KEY FORMULAS:
        * Holistic MER = Total Shopify Revenue / Total Ad Spend (Google + Meta).
        * True CAC (tCAC) = Total Ad Spend / Shopify New Customers (where customer_type = 'new').
        * Platform ROAS = conversions_value / spend (from adsDaily).
        * Platform CAC = spend / conversions (from adsDaily).
      
      CATALOG:
      ${JSON.stringify(catalog, null, 2)}

      RULES:
      1. Use 'execute_sql' to run queries. Always use the VIRTUAL TABLE names from the catalog in your code.
      2. Data is already filtered for the current user. Do not attempt to guess or ask for account IDs.
      3. CRITICAL (Case Sensitivity): BigQuery is case-sensitive by default. ALWAYS use the 'LOWER()' function for string comparisons (e.g., 'WHERE LOWER(platform) = "instagram"') to ensure case-insensitive matching. 
      4. Use 'get_distinct_values' if you are unsure what categories exist in a column.
      5. Check 'knownValues' in the CATALOG for platform and category strings.
      
      CURRENT CONTEXT: ${JSON.stringify(this.accountContext)}`,
      tools: [
        {
          functionDeclarations: [
            {
              name: "get_distinct_values",
              description:
                "Get the unique values for a specific dimension in a table. Use this to see what categories exist (e.g., campaign names, countries).",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  entityId: {
                    type: SchemaType.STRING,
                    description: "The virtual table name.",
                  },
                  dimension: {
                    type: SchemaType.STRING,
                    description: "The column name.",
                  },
                },
                required: ["entityId", "dimension"],
              },
            },
            {
              name: "execute_sql",
              description:
                "Execute a read-only BigQuery SQL statement against virtual tables. Support CTEs, JOINs, and complex aggregations.",
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  sql: {
                    type: SchemaType.STRING,
                    description:
                      "The SQL query to run using virtual table names.",
                  },
                },
                required: ["sql"],
              },
            },
          ],
        },
      ],
    });

    const chat = model.startChat({
      history: history.slice(0, -1).map((m) => ({
        role: m.role === "ai" ? "model" : m.role,
        parts: [{ text: m.text }],
      })),
    });

    // Initial Send
    const userMessage = history[history.length - 1].text;
    console.log(`\n[User] ${userMessage}`);
    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    // Agent Loop for Tool Calls
    const MAX_ITERATIONS = 5;
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      const parts = response.candidates?.[0]?.content?.parts || [];
      const toolCalls = parts.filter((p) => p.functionCall);

      if (toolCalls.length === 0) break;

      const toolResponses = await Promise.all(
        toolCalls.map(async (call) => {
          const { name, args } = call.functionCall!;
          console.log(
            `\n[Agent][Round ${iterations + 1}] >>> Tool Call: ${name}`,
          );
          if ((args as any).sql)
            console.log(`[Agent][Virtual SQL]: ${(args as any).sql}`);

          let output: any = null;
          try {
            if (name === "execute_sql") {
              output = await this.executeSecureSql((args as any).sql);
            } else if (name === "get_distinct_values") {
              output = await this.getDistinctValues(
                (args as any).entityId,
                (args as any).dimension,
              );
            }
            if (Array.isArray(output)) {
              console.log(
                `[Agent][Round ${iterations + 1}] <<< Tool Response: [${
                  output.length
                } rows returned]`,
              );
            } else {
              console.log(
                `[Agent][Round ${
                  iterations + 1
                }] <<< Tool Response: [Object returned]`,
              );
            }
          } catch (e: any) {
            console.error(
              `[Agent][Round ${iterations + 1}] !!! Tool Error in ${name}:`,
              e.message,
            );
            output = { error: e.message };
          }

          return {
            functionResponse: {
              name,
              response: { content: output },
            },
          };
        }),
      );

      result = await chat.sendMessage(toolResponses);
      response = result.response;
      iterations++;
    }

    if (iterations >= MAX_ITERATIONS) {
      return "I've hit my maximum complexity limit for this question to prevent an infinite loop. Could you try breaking your question down into smaller parts?";
    }

    const finalResponse = response.text();
    console.log(
      `[Agent] Final Response: ${finalResponse.substring(0, 100)}...`,
    );
    return finalResponse;
  }

  /**
   * The Secure SQL Proxy.
   * Transforms AI-generated "Virtual SQL" into multi-tenant "Secure BigQuery SQL".
   */
  private async executeSecureSql(virtualSql: string) {
    const normalized = virtualSql.toLowerCase().trim();
    if (!normalized.startsWith("select") && !normalized.startsWith("with")) {
      throw new Error("Only SELECT queries are allowed.");
    }
    if (
      normalized.includes("drop") ||
      normalized.includes("delete") ||
      normalized.includes("update") ||
      normalized.includes("insert")
    ) {
      throw new Error("DML and DDL operations are strictly forbidden.");
    }

    const accountIds = Object.values(this.accountContext).filter(Boolean);
    if (!accountIds.length)
      throw new Error("No account access identified for this session.");

    const catalog = getSchemaCatalog();
    const sortedVirtualNames = Object.keys(catalog).sort(
      (a, b) => b.length - a.length,
    );

    let secureSql = virtualSql;

    for (const virtualName of sortedVirtualNames) {
      let realTableFqn = "";

      const entity = allEntities.find((e) => e.id === virtualName);
      const imp = allImports.find((i) => i.id === virtualName);

      if (entity) {
        realTableFqn = entity.fqn;
      } else if (imp) {
        realTableFqn = imp.fqn;
      } else if (virtualName === "Anomalies") {
        realTableFqn = "reports.anomalies";
      } else if (virtualName === "Superlatives") {
        realTableFqn = "reports.superlatives_monthly";
      }

      if (!realTableFqn) continue;

      const tableRegex = new RegExp(`\\b${virtualName}\\b`, "g");
      const filteredSubquery = `(SELECT * FROM \`${realTableFqn}\` WHERE account_id IN UNNEST(@accountIds))`;
      secureSql = secureSql.replace(tableRegex, filteredSubquery);
    }

    // Enforce safety limit
    if (!normalized.includes("limit")) {
      secureSql += " LIMIT 100";
    }

    console.log(`[Agent][BigQuery SQL]: ${secureSql.replace(/\n/g, " ")}`);

    const [rows] = await this.bq.query({
      query: secureSql,
      params: { accountIds },
    });

    return rows;
  }

  private async getDistinctValues(entityId: string, dimension: string) {
    const accountIds = Object.values(this.accountContext).filter(Boolean);

    const entity = allEntities.find((e) => e.id === entityId);
    const imp = allImports.find((i) => i.id === entityId);
    let realTable = "";

    if (entity) realTable = entity.fqn;
    else if (imp) realTable = imp.fqn;
    else throw new Error(`Table ${entityId} not found for distinct values.`);

    const query = `
      SELECT DISTINCT \`${dimension}\` 
      FROM \`${realTable}\` 
      WHERE account_id IN UNNEST(@accountIds)
      ORDER BY 1 ASC
      LIMIT 50
    `;

    const [rows] = await this.bq.query({
      query,
      params: { accountIds },
    });

    return rows.map((r: any) => r[dimension]);
  }
}

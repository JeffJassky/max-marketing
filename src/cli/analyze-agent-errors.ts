import { createBigQueryClient } from "../shared/vendors/google/bigquery/bigquery";
import { generateContent } from "../shared/vendors/google/gemini";
import chalk from "chalk";
import { config as loadEnv } from "dotenv";

loadEnv();

async function analyzeErrors() {
  console.log(chalk.blue("Fetching failed queries from BigQuery..."));
  
  const bq = createBigQueryClient();
  const datasetId = "monitoring";
  const failedTable = "failed_queries";
  const successTable = "successful_queries";

  const projectId = process.env.BIGQUERY_PROJECT;
  if (!projectId) {
    console.error(chalk.red("BIGQUERY_PROJECT env var is required."));
    return;
  }

  const bt = String.fromCharCode(96);

  // Fetch failed queries from the last 7 days
  const failedQuery = `
    SELECT 
      user_message, 
      virtual_sql, 
      error_message, 
      chat_history
    FROM ${bt}${projectId}.${datasetId}.${failedTable}${bt}
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    LIMIT 50
  `;

  // Fetch successful queries that followed failures
  const successQuery = `
    SELECT 
      user_message, 
      virtual_sql as successful_sql, 
      failed_attempts
    FROM ${bt}${projectId}.${datasetId}.${successTable}${bt}
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    LIMIT 50
  `;

  try {
    let failedRows = [];
    let successRows = [];

    try {
      const [rows] = await bq.query(failedQuery);
      failedRows = rows;
    } catch (e: any) {
      if (e.message.includes("Not found")) {
        console.log(chalk.gray("failed_queries table not found yet. Skipping."));
      } else {
        throw e;
      }
    }

    try {
      const [rows] = await bq.query(successQuery);
      successRows = rows;
    } catch (e: any) {
      if (e.message.includes("Not found")) {
        console.log(chalk.gray("successful_queries table not found yet. Skipping."));
      } else {
        throw e;
      }
    }

    if (failedRows.length === 0 && successRows.length === 0) {
      console.log(chalk.yellow("No recent errors found to analyze."));
      return;
    }

    console.log(chalk.blue(`Found ${failedRows.length} failures and ${successRows.length} successful corrections.`));
    console.log(chalk.blue("Sending to Gemini for analysis..."));

    const analysisPrompt = `
      You are an expert AI systems engineer and analyst.
      Below is data from a marketing AI assistant named Max. 
      Max generates BigQuery SQL based on user requests using virtual table names.
      Sometimes Max makes mistakes, resulting in SQL errors.
      
      FAILED QUERIES (Last 7 Days):
      JSON.stringify(failedRows, null, 2)

      SUCCESSFUL CORRECTIONS (Where Max failed initially but then succeeded):
      JSON.stringify(successRows, null, 2)

      TASK:
      1. Identify common patterns of mistakes (e.g., incorrect syntax, wrong table names, case sensitivity issues, logic errors).
      2. Synthesize these findings into a concise list of "HINTS" or "RULES".
      3. Format these HINTS so they can be directly appended to Max's system instruction to improve its future performance.
      
      Please provide a clear summary of the patterns found, followed by the suggested system prompt additions.
    `;

    const analysis = await generateContent(analysisPrompt);

    console.log(chalk.green("\n--- ANALYSIS & SUGGESTED PROMPT AUGMENTATION ---"));
    console.log(analysis);
    console.log(chalk.green("--------------------------------------------------\n"));

  } catch (error: any) {
    console.error(chalk.red("Error during analysis:"), error.message);
  }
}

analyzeErrors();
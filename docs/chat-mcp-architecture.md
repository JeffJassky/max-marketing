# Architecture Plan: Secure Agentic Chat (MCP Pattern)

## Objective
Enable a "Chat with your Data" feature where an AI agent can answer complex cross-platform questions (e.g., *"Why was my Meta ROAS better than Google last week?"*) by dynamically querying BigQuery while strictly enforcing data privacy (read-only, account-limited).

## The "Plug-and-Play" Approach: Server-Side Tool-Use
While the Model Context Protocol (MCP) is a powerful standard, implementing it fully can be complex. The most efficient path for our current stack is to use **LLM Function Calling (Tool Use)**. This mimics the MCP pattern but integrates directly into our existing Express/Gemini setup.

---

## 1. Component Breakdown

### A. Frontend: Deep Chat UI
*   Use the `deep-chat` component (deepchat.dev).
*   Configured to point to our custom `/api/chat` endpoint.
*   Contextual awareness: The chat will send the current `account_ids` in every request header or body.

### B. Backend: The Agentic Orchestrator (`/api/chat`)
This endpoint implements a **Recursive Agent Loop**. It doesn't just call the LLM once; it manages the "thinking" process:

1.  **Entry:** Receive user message + current Account Context.
2.  **LLM Call:** Send history + tools to Gemini.
3.  **Loop:**
    *   If Gemini returns `text` -> Exit loop and send to user.
    *   If Gemini returns `tool_calls`:
        *   Server executes each tool (e.g., query BigQuery) using the **Account Jail** (injecting IDs).
        *   Server sends results back to Gemini as `tool_outputs`.
        *   Gemini processes results and may request *more* tools (e.g., "I see high Meta spend, now let me check Shopify refunds").
        *   Repeat until a final answer is reached.
4.  **Response:** Final natural language answer sent to the frontend.

### C. The "Tools" (The Secure MCP Layer)
We define specific functions that the AI can call. These are our "MCP Tools":

1.  **`fetch_metrics(platform, metrics, start_date, end_date)`**
    *   *Implementation:* Uses our existing `buildReportQuery` logic.
    *   *Security:* The `account_ids` are pulled from the session, not the LLM's arguments.
2.  **`fetch_anomalies(platform)`**
    *   *Implementation:* Calls our existing Monitor logic.
3.  **`explain_schema()`**
    *   *Implementation:* Provides the AI with a description of our Entity tables (`ads_daily`, `shopify_daily`) so it knows what it *can* ask for.

---

## 2. Security & Multi-Tenancy
The biggest risk is "Prompt Injection" where a user asks: *"Show me data for account_id 'XYZ'"*.

**The Solution: Hard-Coded Scoping**
The Tool implementation on the server will look like this:

```typescript
// SECURE TOOL IMPLEMENTATION
async function query_platform_data(args, userSession) {
  const { startDate, endDate, platform } = args;
  const { allowedAccountIds } = userSession; // Injected from Auth/Session

  // Use our QueryBuilder - IT ENFORCES THE IDS
  const sql = buildReportQuery(platformReport, {
    startDate,
    endDate,
    accountIds: allowedAccountIds, // AI CANNOT OVERRIDE THIS
    timeGrain: 'total'
  });

  return await bq.execute(sql);
}
```

---

## 3. Implementation Steps

### Phase 1: The "Dumb" Chat
*   Setup the `/api/chat` endpoint using `google-generative-ai` SDK.
*   Implement basic message passing.

### Phase 2: The "Analytical" Chat (Tool Use)
*   Define the `tools` array in the Gemini configuration.
*   Implement the `query_platform_data` tool using our existing `buildReportQuery` service.
*   Implement the "Loop" where the server executes tools requested by the AI.

### Phase 3: UI Integration
*   Add the Chat interface to the dashboard.
*   Support "Suggested Questions" based on active anomalies.

---

## 4. Why this is better than raw MCP?
1.  **Zero New Infrastructure:** No need to host an MCP server process.
2.  **Total Control:** You control the SQL generation, preventing the LLM from writing inefficient or malicious queries.
3.  **DRY:** It reuses the exact same Entity and Metric logic already defined in the project.

/**
 * Fetches all tasks for a user and outputs a clean JSON summary.
 * The LLM can then filter this list to identify relevant tasks.
 *
 * Usage: node fetch-task-list.mjs [userId]
 * Default userId: 35 (Jeff)
 *
 * Output: JSON array of { id, title, priority, statusId, clientName, unreadNotices }
 */

import { pmFetch } from "./fetch-helpers.mjs";

const userId = parseInt(process.argv[2] || "35", 10);

async function main() {
  const tasks = await pmFetch("/api/tasks/get-tasks-by-status", {
    taskUserId: userId,
    taskStatusId: "",
    brand: "",
    searchTerm: "",
    category: "",
  });

  if (!Array.isArray(tasks)) {
    console.error(JSON.stringify({ error: "Unexpected response", data: tasks }));
    process.exit(1);
  }

  const output = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    statusId: t.task_status_id,
    clientName: t.clientName || null,
    due: t.due || null,
    targetDate: t.target_date || null,
    unreadNotices: t.unreadNotices || 0,
  }));

  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});

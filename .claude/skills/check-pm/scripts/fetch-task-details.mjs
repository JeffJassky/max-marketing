/**
 * Fetches full details for one or more tasks: description, recent notes, and todos.
 * Resolves user IDs to names and strips HTML for clean output.
 *
 * Usage: node fetch-task-details.mjs <taskId> [taskId2] [taskId3] ...
 *
 * Output: JSON array of task detail objects.
 */

import { pmFetch, stripHtml, resolveUserName } from "./fetch-helpers.mjs";

const taskIds = process.argv.slice(2).map((id) => parseInt(id, 10));

if (taskIds.length === 0) {
  console.error(
    JSON.stringify({ error: "Provide at least one task ID as argument" })
  );
  process.exit(1);
}

async function fetchOneTask(taskId) {
  const [details, notices, todos] = await Promise.all([
    pmFetch("/api/tasks/get-task-details", { taskId }),
    pmFetch("/api/notices/get-notices", { taskId }),
    pmFetch("/api/todos/get-todos-by-task-id", { taskId }),
  ]);

  // Process details
  const description = details.error
    ? null
    : stripHtml(details.content);

  // Process notices — only human-written notes
  let recentNotes = [];
  if (Array.isArray(notices)) {
    const notes = notices.filter(
      (n) => n.action === "note_created" && n.message
    );
    // Take last 10 notes (most recent)
    recentNotes = await Promise.all(
      notes.slice(-10).map(async (n) => ({
        date: n.created?.substring(0, 10) || null,
        author: await resolveUserName(n.user_id),
        message: stripHtml(n.message),
        pinned: !!n.pinned,
      }))
    );
  }

  // Process document uploads from notices
  let documents = [];
  if (Array.isArray(notices)) {
    documents = notices
      .filter((n) => n.action === "document_created" && n.documentName)
      .map((n) => ({
        date: n.created?.substring(0, 10) || null,
        author: n.user_id,
        name: n.documentName,
        filename: n.filename,
      }));
  }

  // Process todos
  let todoList = [];
  if (Array.isArray(todos)) {
    todoList = todos.map((t) => ({
      id: t.id,
      content: t.todo_content,
      complete: !!t.complete,
      priority: t.priority,
    }));
  }

  return {
    id: taskId,
    title: details.title || null,
    statusId: details.task_status_id || null,
    assignedTo: details.assignedTo || null,
    description,
    recentNotes,
    documents,
    todos: todoList,
  };
}

async function main() {
  const results = await Promise.all(taskIds.map(fetchOneTask));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});

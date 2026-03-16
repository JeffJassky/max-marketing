# Accessing the Amplify11 Project Manager (projects.amplify11.com)

This document explains how to programmatically access task data from the Amplify11 project manager, a Next.js app using NextAuth for authentication.

## Authentication

The PM uses **NextAuth with a credentials provider**. Authentication is a 3-step process:

### Step 1: Get CSRF Token

```
GET https://projects.amplify11.com/api/auth/csrf
```

Returns: `{ "csrfToken": "<token>" }`

Save cookies from this response (specifically `__Host-next-auth.csrf-token` and `__Secure-next-auth.callback-url`).

### Step 2: Sign In

```
POST https://projects.amplify11.com/api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

username=Jeff&password=A11-CodeKing%23&csrfToken=<csrf_token_from_step_1>
```

- The `#` in the password must be URL-encoded as `%23`.
- Send cookies from Step 1.
- On success, returns a **302 redirect** and sets a `__Secure-next-auth.session-token` cookie.
- Save/persist all cookies for subsequent requests.

### Step 3: Verify Session (optional)

```
GET https://projects.amplify11.com/api/auth/session
```

Returns: `{ "user": { "userId": 35 }, "expires": "..." }`

Jeff's user ID is **35**.

## curl Example (full auth flow)

```bash
# 1. Get CSRF token (saves cookies)
CSRF=$(curl -s -c /tmp/pm_cookies.txt \
  "https://projects.amplify11.com/api/auth/csrf" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])")

# 2. Sign in (appends session cookie)
curl -s -c /tmp/pm_cookies.txt -b /tmp/pm_cookies.txt \
  -X POST "https://projects.amplify11.com/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=Jeff&password=A11-CodeKing%23&csrfToken=$CSRF" \
  -o /dev/null

# 3. Verify (optional)
curl -s -b /tmp/pm_cookies.txt "https://projects.amplify11.com/api/auth/session"
```

## API Endpoints

All endpoints require the session cookie from authentication. All POST endpoints expect `Content-Type: application/json`.

### Task List

```
POST /api/tasks/get-tasks-by-status
Body: {
  "taskUserId": 35,
  "taskStatusId": "",   // filter by status ID, or "" for all
  "brand": "",          // filter by brand ID, or "" for all
  "searchTerm": "",     // text search
  "category": ""        // filter by category ID, or "" for all
}
```

Returns an array of task summary objects:

```json
{
  "user_task_id": 31941,
  "priority": 1,
  "id": 28879,
  "task_status_id": 1,
  "title": "MAXED Reporting",
  "due": null,
  "time_release_date": null,
  "target_date": null,
  "estimated_hours": null,
  "restrict_access": 0,
  "clientName": "A11",
  "unreadNotices": 0
}
```

### Task Details

```
POST /api/tasks/get-task-details
Body: { "taskId": 28879 }
```

Returns full task with HTML content:

```json
{
  "id": 28879,
  "user_id": 3,
  "title": "MAXED Reporting",
  "content": "<p>HTML description...</p>",
  "brand": 48,
  "task_status_id": 1,
  "due": null,
  "target_date": null,
  "estimated_hours": null,
  "time_release_date": null,
  "restrict_access": 0,
  "assignedTo": "35",
  "followers": "8",
  "categories": null
}
```

### Notices (Comments/Activity)

```
POST /api/notices/get-notices
Body: { "taskId": 28879 }
```

Returns an array of notice objects. Key fields:

| Field | Description |
|-------|-------------|
| `id` | Notice ID |
| `user_id` | Author (35 = Jeff, 3 = Tracy) |
| `message` | HTML content of the notice |
| `action` | Type: `note_created`, `emoji_reaction`, `document_created`, `status_change`, etc. |
| `created` | ISO timestamp |
| `pinned` | Whether pinned to task |
| `documentName` | Attached document name (if `action` = `document_created`) |
| `filename` | Original filename |

Filter by `action == "note_created"` to get only human-written notes.

### Todos (Checklists)

```
POST /api/todos/get-todos-by-task-id
Body: { "taskId": 28879 }
```

Returns an array:

```json
{
  "id": 1246,
  "todo_content": "Get Shopify App working",
  "task_id": 28879,
  "priority": 1,
  "last_activity": null,
  "last_activity_by": null,
  "complete": null  // null = incomplete, truthy = complete
}
```

### Documents

```
POST /api/documents/get-documents-by-task
Body: { "taskId": 28879 }
```

### Other Endpoints (discovered but not tested)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tasks/edit-task-date-and-status` | POST | Update task status/dates |
| `/api/tasks/update-task-description` | POST | Update task content |
| `/api/tasks/update-task-priority` | POST | Reorder tasks |
| `/api/tasks/delete-task` | POST | Delete a task |
| `/api/todos/add-todos` | POST | Create todos |
| `/api/todos/update-todo-by-id` | POST | Update a todo |
| `/api/todos/delete-todo` | POST | Delete a todo |
| `/api/notices/add-notice` | POST | Add a comment |
| `/api/notices/edit-notice` | POST | Edit a comment |
| `/api/notices/delete-notice` | POST | Delete a comment |
| `/api/notices/pin-notice` / `un-pin-notice` | POST | Pin/unpin |
| `/api/notices/mark-notices-as-read` | POST | Mark as read |
| `/api/notices/mark-notices-by-id-as-read` | POST | Mark specific notice read |
| `/api/documents/add-document` | POST | Upload document |
| `/api/documents/add-document-to-task` | POST | Attach doc to task |
| `/api/documents/remove-document-from-task` | POST | Detach doc |
| `/api/documents/get-token-for-document` | POST | Get download token |
| `/api/emojis/add-or-delete-emoji` | POST | React to notice |
| `/api/emojis/get-notice-emojis` | POST | Get reactions |
| `/api/notifications/get-notifications` | POST | Get notifications |
| `/api/users/get-users` | GET | List all users |
| `/api/brands/get-all-brands` | GET | List all brands/clients |
| `/api/categories/get-all-categories` | GET | List all categories |

## Recommended Order of Operations

1. **Authenticate** (CSRF + credentials POST)
2. **Fetch task list** for user 35 with no filters to get all tasks
3. **Identify relevant tasks** by title (MAXED/Maxed tasks are MaxMarketing-related)
4. **Fetch details** for each relevant task via `get-task-details`
5. **Fetch notices** for each task, filter to `action == "note_created"` for notes
6. **Fetch todos** for each task

## Notes for LLMs

- **This is a Next.js App Router application.** Page content is client-side rendered. You cannot get task data by fetching HTML pages — you must use the API endpoints directly.
- **The `content` and `message` fields contain HTML.** Strip tags with regex (`re.sub(r'<[^>]+>', ' ', text)`) for readable output.
- **JSON responses may contain control characters** in HTML content fields. Use `strict=False` when parsing: `json.loads(text, strict=False)`.
- **Cookie persistence is required.** Use `-c` and `-b` with the same cookie jar file for all curl requests.
- **User IDs:** Jeff = 35, Tracy = 3.
- **Task status_id = 1** appears to mean "active/open."
- **`taskStatusId` in the list API** accepts empty string for all statuses, not null.
- **MaxMarketing task IDs** (as of 2026-03-16): 28879, 29301, 29366, 29134, 29150, 29180, 29031, 28959, 28957. These will change over time — always search by title keywords like "MAXED", "Maxed", "Max" to find current tasks.
- **Jeff's task list URL:** `https://projects.amplify11.com/tasks/list/35`
- **API endpoints were discovered** by downloading and searching the JavaScript bundle chunks, not from documentation. If endpoints stop working, re-download the page's JS chunks and search for `/api/` patterns.

---
name: check-pm
description: Checks the online project manager for updates on this project.
---

This skill uses Node scripts to fetch data from the Amplify11 PM (projects.amplify11.com) via its REST API. The scripts handle auth, cookie management, HTML stripping, and user name resolution. Your job is to interpret the results.

Scripts are in: `.claude/skills/check-pm/scripts/`

## Step 1: Authenticate

```bash
node .claude/skills/check-pm/scripts/auth.mjs
```

Outputs `{ success: true, userId: 35, cookieJar: "<path>" }` on success. Session cookies are saved to a temp file and reused by subsequent scripts. You only need to run this once per session — if later scripts return auth errors, re-run this.

## Step 2: Fetch Task List

```bash
node .claude/skills/check-pm/scripts/fetch-task-list.mjs
```

Returns a JSON array of all tasks assigned to Jeff (userId 35). Each task has: `id`, `title`, `priority`, `statusId`, `clientName`, `due`, `targetDate`, `unreadNotices`.

**Your job:** Review the list and identify tasks related to this repository (MaxMarketing / MAXED). Look for titles containing "MAXED", "Maxed", "Max", or related feature names (Brand Pulse, Post Pilot, Google Ads Optimizer, etc.). Note which task IDs are relevant.

## Step 3: Fetch Details for Relevant Tasks

```bash
node .claude/skills/check-pm/scripts/fetch-task-details.mjs <taskId1> [taskId2] [taskId3] ...
```

Pass the relevant task IDs from Step 2. The script fetches details, recent notes, documents, and todos for each task **in parallel** and returns clean JSON with:

- `title`, `description` (HTML already stripped)
- `recentNotes[]` — last 10 human-written notes with `date`, `author` (name, not ID), `message`, `pinned`
- `documents[]` — attached files with `date`, `name`, `filename`
- `todos[]` — checklist items with `content`, `complete`, `priority`

**Your job:** Summarize the findings. Highlight recent activity, new information, open todos, and anything actionable. Connect updates to the current state of the codebase where relevant.

## Reference

For full API documentation including all discovered endpoints, see `docs/check-pm.md`.

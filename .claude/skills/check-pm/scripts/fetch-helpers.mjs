/**
 * Shared helpers for making authenticated requests to the PM.
 */

import { readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const BASE_URL = "https://projects.amplify11.com";
const COOKIE_JAR = join(tmpdir(), "a11-pm-cookies.json");

let cookies = null;

function loadCookies() {
  if (cookies) return;
  try {
    cookies = JSON.parse(readFileSync(COOKIE_JAR, "utf-8"));
  } catch {
    console.error(
      JSON.stringify({ error: "No cookie jar found. Run auth.mjs first." })
    );
    process.exit(1);
  }
}

function cookieHeaderForUrl(requestUrl) {
  loadCookies();
  const url = new URL(requestUrl);
  const pairs = [];
  for (const c of Object.values(cookies)) {
    if (url.hostname.endsWith(c.domain) && url.pathname.startsWith(c.path)) {
      pairs.push(`${c.name}=${c.value}`);
    }
  }
  return pairs.join("; ");
}

export async function pmFetch(endpoint, body) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeaderForUrl(url),
    },
    body: JSON.stringify(body),
  };

  const res = await fetch(url, options);
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    // PM sometimes returns HTML instead of JSON (e.g. session expired)
    if (text.includes("404") || text.includes("not-found")) {
      return { error: "Not found", endpoint };
    }
    if (text.includes("login") || text.includes("signin")) {
      return { error: "Session expired. Re-run auth.mjs.", endpoint };
    }
    return { error: "Unparseable response", raw: text.substring(0, 200) };
  }
}

export function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Known user IDs. Augmented at runtime by fetch-users. */
const KNOWN_USERS = {
  35: "Jeff",
  3: "Tracy",
};

let usersLoaded = false;

export async function resolveUserName(userId) {
  if (KNOWN_USERS[userId]) return KNOWN_USERS[userId];
  if (!usersLoaded) {
    await loadUsers();
    usersLoaded = true;
  }
  return KNOWN_USERS[userId] || `User ${userId}`;
}

async function loadUsers() {
  try {
    const url = `${BASE_URL}/api/users/get-users`;
    const res = await fetch(url, {
      headers: { Cookie: cookieHeaderForUrl(url) },
    });
    const users = await res.json();
    if (Array.isArray(users)) {
      for (const u of users) {
        const name =
          u.name || u.username || `${u.first_name || ""} ${u.last_name || ""}`.trim();
        if (u.id && name) KNOWN_USERS[u.id] = name;
      }
    }
  } catch {
    // Silently fall back to known users
  }
}

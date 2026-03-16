/**
 * Authenticates with the Amplify11 PM and writes session cookies to a temp file.
 * Outputs the cookie jar path on success.
 *
 * Usage: node auth.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

// Load .env from project root
const envPath = resolve(process.cwd(), ".env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx);
    const value = trimmed.substring(eqIdx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {};

const BASE_URL = "https://projects.amplify11.com";
const COOKIE_JAR = join(tmpdir(), "a11-pm-cookies.json");
const USERNAME = process.env.A11_PM_USERNAME || "Jeff";
const PASSWORD = process.env.A11_PM_PASSWORD;

/** Simple cookie store: { [domain+path+name]: { name, value, domain, path, expires } } */
let cookies = {};

function parseCookiesFromHeaders(headers, requestUrl) {
  const url = new URL(requestUrl);
  const setCookies = headers.getSetCookie?.() || [];
  for (const sc of setCookies) {
    const parts = sc.split(";").map((p) => p.trim());
    const [nameVal, ...attrs] = parts;
    const eqIdx = nameVal.indexOf("=");
    const name = nameVal.substring(0, eqIdx);
    const value = nameVal.substring(eqIdx + 1);

    let domain = url.hostname;
    let path = "/";
    let expires = null;

    for (const attr of attrs) {
      const [k, v] = attr.split("=").map((s) => s.trim());
      const kl = k.toLowerCase();
      if (kl === "domain") domain = v.replace(/^\./, "");
      if (kl === "path") path = v;
      if (kl === "expires") expires = v;
    }

    cookies[`${domain}:${path}:${name}`] = { name, value, domain, path, expires };
  }
}

function cookieHeaderForUrl(requestUrl) {
  const url = new URL(requestUrl);
  const pairs = [];
  for (const c of Object.values(cookies)) {
    if (url.hostname.endsWith(c.domain) && url.pathname.startsWith(c.path)) {
      pairs.push(`${c.name}=${c.value}`);
    }
  }
  return pairs.join("; ");
}

async function fetchWithCookies(url, options = {}) {
  const headers = { ...options.headers };
  const ch = cookieHeaderForUrl(url);
  if (ch) headers["Cookie"] = ch;

  const res = await fetch(url, {
    ...options,
    headers,
    redirect: "manual",
  });

  parseCookiesFromHeaders(res.headers, url);

  // Follow redirects manually to capture cookies at each step
  const location = res.headers.get("location");
  if (location && res.status >= 300 && res.status < 400) {
    const redirectUrl = new URL(location, url).toString();
    parseCookiesFromHeaders(res.headers, redirectUrl);
  }

  return res;
}

async function main() {
  if (!PASSWORD) {
    console.error(JSON.stringify({ error: "A11_PM_PASSWORD env variable is required" }));
    process.exit(1);
  }

  // Step 1: Get CSRF token
  const csrfRes = await fetchWithCookies(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  if (!csrfToken) {
    console.error(JSON.stringify({ error: "Failed to get CSRF token" }));
    process.exit(1);
  }

  // Step 2: Sign in
  const body = new URLSearchParams({
    username: USERNAME,
    password: PASSWORD,
    csrfToken,
  });

  const loginRes = await fetchWithCookies(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  // Step 3: Verify session
  const sessionRes = await fetchWithCookies(`${BASE_URL}/api/auth/session`);
  const session = await sessionRes.json();

  if (!session?.user?.userId) {
    console.error(JSON.stringify({ error: "Authentication failed", session }));
    process.exit(1);
  }

  // Save cookies to file
  writeFileSync(COOKIE_JAR, JSON.stringify(cookies, null, 2));

  console.log(
    JSON.stringify({
      success: true,
      userId: session.user.userId,
      cookieJar: COOKIE_JAR,
    })
  );
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});

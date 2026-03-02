export async function apiFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, { ...options, credentials: "include" });
  if (res.status === 401 && !url.includes("/api/auth/")) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}

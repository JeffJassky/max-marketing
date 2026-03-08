export const getRedisConnectionOpts = () => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set. Please configure it in your .env file.");
  }

  // Parse Redis URL into host/port/password for BullMQ compatibility
  const parsed = new URL(url);
  const useTls = parsed.protocol === "rediss:" || process.env.REDIS_TLS === "1";

  console.log(
    `[Redis] Connecting to ${parsed.hostname}:${parsed.port || 6379} (TLS: ${useTls ? "yes" : "no"})`
  );

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    maxRetriesPerRequest: null as null,
    connectTimeout: 10_000,
    enableReadyCheck: true,
    ...(useTls && { tls: { rejectUnauthorized: false } }),
  };
};

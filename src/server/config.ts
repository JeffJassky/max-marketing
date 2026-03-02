import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Required
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  BIGQUERY_PROJECT: z.string().min(1, "BIGQUERY_PROJECT is required"),
  GOOGLE_APPLICATION_CREDENTIALS_BASE64: z
    .string()
    .min(1, "GOOGLE_APPLICATION_CREDENTIALS_BASE64 is required"),

  // Optional with defaults
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  APP_URL: z.string().default("http://localhost:5173"),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().default("noreply@maxedmarketing.com"),
  GEMINI_API_KEY: z.string().optional(),
  WINDSOR_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

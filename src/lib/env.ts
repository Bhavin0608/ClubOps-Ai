import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/clubops_ai?schema=public"),
  AUTH_SECRET: z.string().min(16).default("f9b4c27891ae5d342c819bc2456e7921a8d0e74f63c84b12384a2b97c8d9e0f1"),
  GEMINI_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().default("gemini-2.5-flash"),
  EMBEDDING_MODEL: z.string().default("text-embedding-004"),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  MAX_UPLOAD_MB: z.coerce.number().default(4),
  RAG_TOP_K: z.coerce.number().default(5),
  RAG_MIN_SCORE: z.coerce.number().default(0.35),
  DEMO_MODE: z.string().transform((v) => v === "true").default(true),
});

export const env = envSchema.parse(process.env);

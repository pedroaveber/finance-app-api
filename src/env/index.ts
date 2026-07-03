import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().optional().default(3333),
  HOST: z.string().optional().default('0.0.0.0'),
  DATABASE_URL: z.url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url().default('http://localhost:3333'),
  CLIENT_ORIGIN: z.url().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GEMINI_API_KEY: z.string().min(1),
  OTEL_LOGS_EXPORTER: z.string(),
  OTEL_TRACES_EXPORTER: z.string(),
  OTEL_METRICS_EXPORTER: z.string(),
  OTEL_EXPORTER_OTLP_PROTOCOL: z.string(),
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: z.string(),
  OTEL_METRIC_EXPORT_INTERVAL: z.coerce.number().optional().default(5_000),
  OTEL_METRIC_EXPORT_TIMEOUT: z.coerce.number().optional().default(5_000),
  RESEND_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)

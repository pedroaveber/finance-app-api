import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url().default('http://localhost:3333'),
  CLIENT_ORIGIN: z.url().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GEMINI_API_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)

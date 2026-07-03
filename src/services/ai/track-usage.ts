import { db } from '@/database/drizzle/connection'
import { aiUsageLogs } from '@/database/drizzle/schemas'

type LogAiUsageParams = {
  userId: string
  model: string
  route: string
  inputTokens: number
  outputTokens: number
  durationMs: number | null
}

export async function logAiUsage(params: LogAiUsageParams) {
  await db.insert(aiUsageLogs).values({
    userId: params.userId,
    model: params.model,
    route: params.route,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalTokens: params.inputTokens + params.outputTokens,
    durationMs: params.durationMs,
  })
}

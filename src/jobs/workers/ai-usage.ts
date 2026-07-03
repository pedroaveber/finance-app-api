import { db } from '@/database/drizzle/connection'
import { aiUsageLogs } from '@/database/drizzle/schemas'
import { createWorker } from '@/lib/queue'
import { QUEUE_NAMES } from '../queues'

type AiUsagePayload = {
  userId: string
  model: string
  route: string
  inputTokens: number
  outputTokens: number
  durationMs: number | null
}

export const aiUsageWorker = createWorker<AiUsagePayload>(
  QUEUE_NAMES.AI_USAGE,
  async (job) => {
    const { userId, model, route, inputTokens, outputTokens, durationMs } =
      job.data

    await db.insert(aiUsageLogs).values({
      userId,
      model,
      route,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      durationMs,
    })
  },
)

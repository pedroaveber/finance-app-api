import { aiUsageQueue } from '@/jobs'

type LogAiUsageParams = {
  userId: string
  model: string
  route: string
  inputTokens: number
  outputTokens: number
  durationMs: number | null
}

export async function logAiUsage(params: LogAiUsageParams) {
  await aiUsageQueue.add('log-usage', params)
}

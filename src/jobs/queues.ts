import { createQueue } from '@/lib/queue'

export const QUEUE_NAMES = {
  AI_PROCESSING: 'ai-processing',
  AI_USAGE: 'ai-usage',
} as const

export const aiProcessingQueue = createQueue(QUEUE_NAMES.AI_PROCESSING)
export const aiUsageQueue = createQueue(QUEUE_NAMES.AI_USAGE)

import { createQueue } from '@/lib/queue'

export const QUEUE_NAMES = {
  AI_PROCESSING: 'ai-processing',
  AI_USAGE: 'ai-usage',
  CREDIT_CARD_IMPORT: 'credit-card-import',
} as const

export const aiProcessingQueue = createQueue(QUEUE_NAMES.AI_PROCESSING)
export const aiUsageQueue = createQueue(QUEUE_NAMES.AI_USAGE)
export const creditCardImportQueue = createQueue(QUEUE_NAMES.CREDIT_CARD_IMPORT)

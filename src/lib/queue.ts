import { Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq'
import { getRedis } from '@/database/redis'

export function createQueue<TPayload = unknown>(
  name: string,
  opts?: Partial<QueueOptions>,
) {
  return new Queue<TPayload>(name, {
    connection: getRedis(),
    ...opts,
  })
}

export function createWorker<TPayload = unknown, TReturn = unknown>(
  name: string,
  processor: (job: import('bullmq').Job<TPayload, TReturn>) => Promise<TReturn>,
  opts?: Partial<WorkerOptions>,
) {
  return new Worker<TPayload, TReturn>(name, processor, {
    connection: getRedis(),
    ...opts,
  })
}

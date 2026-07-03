import { Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from '@/env'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    })
  }
  return redis
}

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

export async function closeRedis() {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

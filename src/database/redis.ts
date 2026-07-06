import { Redis } from 'ioredis'
import { env } from '@/env'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    })
  }
  return redis
}

export async function closeRedis() {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

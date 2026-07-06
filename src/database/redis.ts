import { Redis } from 'ioredis'
import { env } from '@/env'

let redis: Redis | null = null
let subscriberRedis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    })
  }
  return redis
}

export function getSubscriberRedis(): Redis {
  if (!subscriberRedis) {
    subscriberRedis = new Redis(env.REDIS_URL)
  }
  return subscriberRedis
}

export async function closeRedis() {
  if (redis) {
    await redis.quit()
    redis = null
  }
  if (subscriberRedis) {
    await subscriberRedis.quit()
    subscriberRedis = null
  }
}

import { Redis, type RedisOptions } from 'ioredis'
import { env } from '@/env'

let redis: Redis | null = null
let subscriberRedis: Redis | null = null

function getRedisOptions(): RedisOptions {
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  }

  if (env.REDIS_URL.startsWith('rediss://')) {
    options.tls = {}
  }

  return options
}

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, getRedisOptions())
  }
  return redis
}

export function getSubscriberRedis(): Redis {
  if (!subscriberRedis) {
    subscriberRedis = new Redis(env.REDIS_URL, getRedisOptions())
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

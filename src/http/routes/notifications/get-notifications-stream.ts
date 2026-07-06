import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { getRedis } from '@/database/redis'

export const notificationStream: FastifyPluginCallbackZod = (app) => {
  app.get('/notifications/stream', { sse: true }, async (request, reply) => {
    const redis = getRedis()
    const channel = `notifications:${request.userId}`

    await redis.subscribe(channel)

    redis.on('message', (_channel, message) => {
      reply.sse.send({ data: message })
    })

    reply.sse.onClose(async () => {
      await redis.unsubscribe(channel)
      await redis.quit()
    })
  })
}

import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { getSubscriberRedis } from '@/database/redis'

export const notificationStream: FastifyPluginCallbackZod = (app) => {
  app.get('/notifications/stream', { sse: true }, async (request, reply) => {
    const subscriber = getSubscriberRedis()
    const channel = `notifications:${request.userId}`

    const onMessage = (_channel: string, message: string) => {
      if (_channel !== channel) return
      reply.sse.send({ data: message })
    }

    subscriber.on('message', onMessage)
    await subscriber.subscribe(channel)

    reply.sse.onClose(async () => {
      subscriber.removeListener('message', onMessage)
      await subscriber.unsubscribe(channel)
    })
  })
}

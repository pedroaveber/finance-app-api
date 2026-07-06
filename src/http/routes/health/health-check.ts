import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const healthCheck: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/health-check',
    {
      schema: {
        tags: ['Health Check'],
        summary: 'Health check endpoint',
        description: 'Check if the server is running',
        operationId: 'healthCheck',
        response: {
          200: z.object({
            message: z.literal('OK'),
          }),
        },
      },
    },
    async (_request, reply) => {
      return reply.status(200).send({ message: 'OK' })
    },
  )
}

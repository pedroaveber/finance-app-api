import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

export const createCategory: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/categories',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Create custom category',
        operationId: 'createCategory',
        body: z.object({
          name: z.string().min(1),
          type: z.enum(['income', 'expense']),
        }),
        response: {
          201: z.object({
            id: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, type } = request.body

      const [category] = await db
        .insert(schema.categories)
        .values({
          userId: request.userId,
          name,
          type,
        })
        .returning({ id: schema.categories.id })

      return reply.status(201).send({ id: category.id })
    },
  )
}

import { and, eq, isNull, or } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas/categories'

export const getCategories: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/categories',
    {
      schema: {
        tags: ['Categories'],
        summary: 'List categories',
        operationId: 'getCategories',
        querystring: z.object({
          type: z.enum(['income', 'expense']).optional(),
        }),
        response: {
          200: z.object({
            data: z.array(
              z.object({
                id: z.string(),
                userId: z.string().nullable(),
                name: z.string(),
                type: z.enum(['income', 'expense']),
                createdAt: z.date(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { type } = request.query

      const conditions = [
        or(
          eq(schema.categories.userId, request.userId),
          isNull(schema.categories.userId),
        ),
      ]

      if (type) {
        conditions.push(eq(schema.categories.type, type))
      }

      const result = await db
        .select()
        .from(schema.categories)
        .where(and(...conditions))

      return reply.status(200).send({ data: result })
    },
  )
}

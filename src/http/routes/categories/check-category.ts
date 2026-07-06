import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import { checkSimilarCategories } from '@/services/ai/check-similar-categories'

export const checkCategory: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/categories/check',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Check for similar categories before creating',
        operationId: 'checkCategory',
        querystring: z.object({
          name: z.string().min(1),
          type: z.enum(['income', 'expense']),
        }),
        response: {
          200: z.object({
            status: z.enum(['ok', 'warning']),
            similarCategories: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                type: z.enum(['income', 'expense']),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, type } = request.query

      const existingCategories = await db
        .select({
          id: schema.categories.id,
          name: schema.categories.name,
          type: schema.categories.type,
        })
        .from(schema.categories)
        .where(eq(schema.categories.type, type))

      const similarCategories = await checkSimilarCategories(
        name,
        existingCategories,
        request.userId,
      )

      const status = similarCategories.length > 0 ? 'warning' : 'ok'
      return reply.status(200).send({ status, similarCategories })
    },
  )
}

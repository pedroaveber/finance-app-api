import { count, eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import {
  BadRequestException,
  ResourceNotFoundException,
} from '@/http/exceptions'

export const deleteCategory: FastifyPluginCallbackZod = (app) => {
  app.delete(
    '/categories/:id',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Delete custom category',
        operationId: 'deleteCategory',
        params: z.object({
          id: z.string(),
        }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const [existing] = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, id))

      if (!existing || existing.userId !== request.userId) {
        throw new ResourceNotFoundException('Categoria não encontrada')
      }

      const [result] = await db
        .select({ count: count() })
        .from(schema.transactions)
        .where(eq(schema.transactions.categoryId, id))

      if (result.count > 0) {
        throw new BadRequestException('Categoria possui transações vinculadas')
      }

      await db.delete(schema.categories).where(eq(schema.categories.id, id))

      return reply.status(204).send()
    },
  )
}

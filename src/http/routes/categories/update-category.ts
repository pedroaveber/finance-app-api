import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas/categories'
import { ResourceNotFoundException } from '@/http/exceptions'

export const updateCategory: FastifyPluginCallbackZod = (app) => {
  app.put(
    '/categories/:id',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Update custom category',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          name: z.string().min(1).optional(),
          type: z.enum(['income', 'expense']).optional(),
          icon: z.string().min(1).optional(),
        }),
        response: {
          204: z.void(),
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

      await db
        .update(schema.categories)
        .set(request.body)
        .where(eq(schema.categories.id, id))

      return reply.status(204).send()
    },
  )
}

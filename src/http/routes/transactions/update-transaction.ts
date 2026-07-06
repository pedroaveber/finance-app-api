import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import { ResourceNotFoundException } from '@/http/exceptions'

export const updateTransaction: FastifyPluginCallbackZod = (app) => {
  app.put(
    '/transactions/:id',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Update transaction',
        operationId: 'updateTransaction',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          description: z.string().min(1),
          amountInCents: z.number().int().positive(),
          type: z.enum(['income', 'expense']),
          date: z.string(),
          categoryId: z.string(),
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
        .from(schema.transactions)
        .where(eq(schema.transactions.id, id))

      if (!existing || existing.userId !== request.userId) {
        throw new ResourceNotFoundException('Transação não encontrada')
      }

      await db
        .update(schema.transactions)
        .set({
          type: request.body.type,
          date: request.body.date,
          amountInCents: request.body.amountInCents,
          categoryId: request.body.categoryId,
          description: request.body.description,
        })
        .where(eq(schema.transactions.id, id))

      return reply.status(204).send()
    },
  )
}

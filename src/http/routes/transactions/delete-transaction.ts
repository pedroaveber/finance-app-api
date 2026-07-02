import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { transactions } from '@/database/drizzle/schemas'
import { ResourceNotFoundException } from '@/http/exceptions'

export const deleteTransaction: FastifyPluginCallbackZod = (app) => {
  app.delete(
    '/transactions/:id',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Delete transaction',
        params: z.object({
          id: z.string(),
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
        .from(transactions)
        .where(eq(transactions.id, id))

      if (!existing || existing.userId !== request.userId) {
        throw new ResourceNotFoundException('Transação não encontrada')
      }

      await db.delete(transactions).where(eq(transactions.id, id))

      return reply.status(204).send()
    },
  )
}

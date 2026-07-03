import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

export const createTransactionBatch: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/transactions/batch',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Create transactions in batch',
        body: z.object({
          creditCardId: z.string(),
          transactions: z.array(
            z.object({
              description: z.string().min(1),
              type: z.enum(['income', 'expense']).default('expense'),
              categoryId: z.string(),
              amount: z.number().positive(),
              createdAt: z.string(),
              installment: z
                .object({ current: z.number(), total: z.number() })
                .nullable(),
              nickname: z.string().nullable(),
            }),
          ),
        }),
        response: {
          202: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { creditCardId, transactions } = request.body

      await db.insert(schema.transactions).values(
        transactions.map((transaction) => ({
          userId: request.userId,
          creditCardId,
          description: transaction.description,
          type: transaction.type,
          categoryId: transaction.categoryId,
          amount: String(transaction.amount),
          date: transaction.createdAt,
          installment: transaction.installment,
          nickname: transaction.nickname,
        })),
      )

      return reply.status(202).send(null)
    },
  )
}

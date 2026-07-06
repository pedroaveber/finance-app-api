import { eq } from 'drizzle-orm'
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
        operationId: 'createTransactionBatch',
        body: z.object({
          creditCardId: z.string(),
          batchTransactionsId: z.string(),
          transactions: z.array(
            z.object({
              description: z.string().min(1),
              type: z.enum(['income', 'expense']).default('expense'),
              categoryId: z.string(),
              amountInCents: z.number().int().positive(),
              createdAt: z.string(),
              installment: z
                .object({ current: z.number(), total: z.number() })
                .nullable(),
              nickname: z.string().nullable(),
            }),
          ),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { creditCardId, batchTransactionsId, transactions } = request.body

      await db.transaction(async (tx) => {
        await tx.insert(schema.transactions).values(
          transactions.map((transaction) => ({
            userId: request.userId,
            creditCardId,
            description: transaction.description,
            type: transaction.type,
            categoryId: transaction.categoryId,
            amountInCents: transaction.amountInCents,
            date: transaction.createdAt,
            installment: transaction.installment,
            nickname: transaction.nickname,
          })),
        )

        await tx
          .update(schema.batchTransactions)
          .set({
            status: 'finished',
            updatedAt: new Date(),
          })
          .where(eq(schema.batchTransactions.id, batchTransactionsId))
      })

      return reply.status(201).send(null)
    },
  )
}

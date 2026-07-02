import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

export const createTransaction: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/transactions',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Create transaction',
        body: z.object({
          description: z.string().min(1),
          amount: z.number().positive(),
          type: z.enum(['income', 'expense']),
          date: z.iso.datetime(),
          categoryId: z.string(),
          aiSuggest: z.boolean().optional().default(false),
        }),
        response: {
          201: z.object({
            id: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { description, amount, type, date, categoryId, aiSuggest } =
        request.body

      if (aiSuggest && !categoryId) {
        // IA
      }

      const [transaction] = await db
        .insert(schema.transactions)
        .values({
          userId: request.userId,
          description,
          amount: String(amount),
          type,
          date,
          categoryId,
        })
        .returning({ id: schema.transactions.id })

      return reply.status(201).send({
        id: transaction.id,
      })
    },
  )
}

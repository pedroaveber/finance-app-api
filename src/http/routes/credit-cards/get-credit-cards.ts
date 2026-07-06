import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { creditCards } from '@/database/drizzle/schemas'

export const getCreditCards: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/credit-cards',
    {
      schema: {
        tags: ['Credit Cards'],
        summary: 'List credit cards',
        operationId: 'getCreditCards',
        response: {
          200: z.object({
            data: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                bank: z.string(),
                closingDay: z.number(),
                paymentDay: z.number(),
                createdAt: z.date(),
                updatedAt: z.date(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const result = await db
        .select()
        .from(creditCards)
        .where(eq(creditCards.userId, request.userId))

      return reply.status(200).send({ data: result })
    },
  )
}

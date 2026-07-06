import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

const dayRange = z.number().int().min(1).max(31)

export const createCreditCard: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/credit-cards',
    {
      schema: {
        tags: ['Credit Cards'],
        summary: 'Create credit card',
        operationId: 'createCreditCard',
        body: z.object({
          name: z.string().min(1),
          bank: z.string().min(1),
          closingDay: dayRange,
          paymentDay: dayRange,
        }),
        response: {
          201: z.object({
            id: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, bank, closingDay, paymentDay } = request.body

      const [creditCard] = await db
        .insert(schema.creditCards)
        .values({
          userId: request.userId,
          name,
          bank,
          closingDay,
          paymentDay,
        })
        .returning({ id: schema.creditCards.id })

      return reply.status(201).send({ id: creditCard.id })
    },
  )
}

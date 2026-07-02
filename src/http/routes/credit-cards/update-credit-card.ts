import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { creditCards } from '@/database/drizzle/schemas'
import { ResourceNotFoundException } from '@/http/exceptions'

const dayRange = z.number().int().min(1).max(31)

export const updateCreditCard: FastifyPluginCallbackZod = (app) => {
  app.put(
    '/credit-cards/:id',
    {
      schema: {
        tags: ['Credit Cards'],
        summary: 'Update credit card',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          name: z.string().min(1).optional(),
          bank: z.string().min(1).optional(),
          closingDay: dayRange.optional(),
          paymentDay: dayRange.optional(),
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
        .from(creditCards)
        .where(eq(creditCards.id, id))

      if (!existing || existing.userId !== request.userId) {
        throw new ResourceNotFoundException('Cartão não encontrado')
      }

      await db
        .update(creditCards)
        .set(request.body)
        .where(eq(creditCards.id, id))

      return reply.status(204).send()
    },
  )
}

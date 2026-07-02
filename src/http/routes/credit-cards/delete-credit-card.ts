import { count, eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { creditCards, invoiceUploads } from '@/database/drizzle/schemas'
import {
  BadRequestException,
  ResourceNotFoundException,
} from '@/http/exceptions'

export const deleteCreditCard: FastifyPluginCallbackZod = (app) => {
  app.delete(
    '/credit-cards/:id',
    {
      schema: {
        tags: ['Credit Cards'],
        summary: 'Delete credit card',
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
        .from(creditCards)
        .where(eq(creditCards.id, id))

      if (!existing || existing.userId !== request.userId) {
        throw new ResourceNotFoundException('Cartão não encontrado')
      }

      const [result] = await db
        .select({ count: count() })
        .from(invoiceUploads)
        .where(eq(invoiceUploads.creditCardId, id))

      if (result.count > 0) {
        throw new BadRequestException('Cartão possui faturas vinculadas')
      }

      await db.delete(creditCards).where(eq(creditCards.id, id))

      return reply.status(204).send()
    },
  )
}

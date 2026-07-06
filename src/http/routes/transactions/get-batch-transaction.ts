import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import { batchTransactions } from '@/database/drizzle/schemas'
import { ResourceNotFoundException } from '@/http/exceptions'

export const getBatchTransaction: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/transactions/batch/:id',
    {
      schema: {
        tags: ['Transactions'],
        summary: 'Get batch transaction',
        operationId: 'getBatchTransaction',
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            jobId: z.string(),
            creditCardId: z.string().nullable(),
            fileHash: z.string(),
            data: z.unknown().nullable(),
            userId: z.string().nullable(),
            status: z.string(),
            createdAt: z.date(),
            updatedAt: z.date().nullable(),
          }),
        },
      },
    },
    async (request) => {
      const { id } = request.params

      const [result] = await db
        .select()
        .from(batchTransactions)
        .where(eq(batchTransactions.id, id))

      if (!result || result.userId !== request.userId) {
        throw new ResourceNotFoundException('Batch transaction não encontrada')
      }

      return result
    },
  )
}

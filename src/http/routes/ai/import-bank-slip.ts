import { and, eq, isNull, or } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import { BadRequestException } from '@/http/exceptions'
import { parseBankSlip } from '@/services/ai/import-bank-slip'

export const importBankSlip: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/ai/import-bank-slip',
    {
      schema: {
        tags: ['AI'],
        summary: 'Import a bank slip PDF and extract payment data',
        operationId: 'importBankSlip',
        consumes: ['multipart/form-data'],
        response: {
          200: z.object({
            amountInCents: z.number().int(),
            dueDate: z.string(),
            description: z.string(),
            suggestedCategory: z
              .object({
                id: z.string(),
                name: z.string(),
              })
              .nullable(),
          }),
        },
      },
    },
    async (request, reply) => {
      const file = await request.file()

      if (!file) {
        throw new BadRequestException('Nenhum arquivo enviado')
      }

      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('O arquivo deve ser um PDF')
      }

      const chunks: Buffer[] = []
      for await (const chunk of file.file) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)

      const categories = await db
        .select({
          id: schema.categories.id,
          name: schema.categories.name,
        })
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.type, 'expense'),
            or(
              isNull(schema.categories.userId),
              eq(schema.categories.userId, request.userId),
            ),
          ),
        )

      const result = await parseBankSlip(
        buffer,
        categories.map((c) => c.name),
        request.userId,
      )

      const suggestedCategory = result.suggestedCategory

      const matchedCategory = suggestedCategory
        ? categories.find(
            (c) => c.name.toLowerCase() === suggestedCategory.toLowerCase(),
          )
        : null

      return reply.status(200).send({
        amountInCents: Math.round(result.amount * 100),
        dueDate: result.dueDate,
        description: result.description,
        suggestedCategory: matchedCategory ?? null,
      })
    },
  )
}

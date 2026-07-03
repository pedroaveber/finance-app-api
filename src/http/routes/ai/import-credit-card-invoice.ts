import { and, eq, isNull, or } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import { BadRequestException } from '@/http/exceptions'
import { parseCreditCardInvoice } from '@/services/ai/import-credit-card-invoice'

const invoiceItemResponse = z.object({
  description: z.string(),
  amount: z.number(),
  installment: z.string().nullable(),
  suggestedCategory: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
})

export const importCreditCardInvoice: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/ai/import-credit-card-invoice',
    {
      schema: {
        tags: ['AI'],
        summary: 'Import a credit card invoice PDF and extract purchases',
        consumes: ['multipart/form-data'],
        response: {
          200: z.object({
            items: z.array(invoiceItemResponse),
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

      const result = await parseCreditCardInvoice(
        buffer,
        categories.map((c) => c.name),
        request.userId,
      )

      const items = result.items.map((item) => {
        const matchedCategory = item.suggestedCategory
          ? categories.find(
              (c) =>
                c.name.toLowerCase() === item.suggestedCategory?.toLowerCase(),
            )
          : null

        return {
          description: item.description,
          amount: item.amount,
          installment: item.installment,
          suggestedCategory: matchedCategory ?? null,
        }
      })

      return reply.status(200).send({ items })
    },
  )
}

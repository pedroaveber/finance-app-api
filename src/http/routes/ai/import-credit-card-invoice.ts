import { createHash } from 'node:crypto'
import { and, eq, isNull, or } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import { BadRequestException } from '@/http/exceptions'
import { creditCardImportQueue } from '@/jobs'

export const importCreditCardInvoice: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/ai/import-credit-card-invoice',
    {
      schema: {
        tags: ['AI'],
        summary: 'Import a credit card invoice PDF and extract purchases',
        operationId: 'importCreditCardInvoice',
        consumes: ['multipart/form-data'],
        response: {
          202: z.object({
            batchId: z.string(),
            jobId: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const parts = request.parts()

      let pdfBuffer: Buffer | null = null
      let creditCardId: string | null = null

      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.mimetype !== 'application/pdf') {
            throw new BadRequestException('O arquivo deve ser um PDF')
          }
          const chunks: Buffer[] = []
          for await (const chunk of part.file) {
            chunks.push(chunk)
          }
          pdfBuffer = Buffer.concat(chunks)
        } else if (part.type === 'field' && part.fieldname === 'creditCardId') {
          creditCardId = part.value as string
        }
      }

      if (!pdfBuffer) {
        throw new BadRequestException('Nenhum arquivo enviado')
      }

      if (!creditCardId) {
        throw new BadRequestException('creditCardId é obrigatório')
      }

      const fileHash = createHash('sha256').update(pdfBuffer).digest('hex')

      const existing = await db
        .select({ id: schema.batchTransactions.id })
        .from(schema.batchTransactions)
        .where(
          and(
            eq(schema.batchTransactions.fileHash, fileHash),
            eq(schema.batchTransactions.userId, request.userId),
          ),
        )
        .limit(1)

      if (existing.length > 0) {
        throw new BadRequestException(
          'Esta fatura já foi importada anteriormente',
        )
      }

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

      const [batchTransaction] = await db
        .insert(schema.batchTransactions)
        .values({
          jobId: '',
          userId: request.userId,
          creditCardId,
          fileHash,
        })
        .returning({ id: schema.batchTransactions.id })

      const job = await creditCardImportQueue.add(
        'import-credit-card-invoice',
        {
          pdfBuffer: Array.from(pdfBuffer),
          userId: request.userId,
          creditCardId,
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
          batchTransactionId: batchTransaction.id,
        },
      )

      await db
        .update(schema.batchTransactions)
        .set({ jobId: job.id ?? '' })
        .where(eq(schema.batchTransactions.id, batchTransaction.id))

      return reply.status(202).send({
        batchId: batchTransaction.id,
        jobId: job.id ?? '',
      })
    },
  )
}

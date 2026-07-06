import { eq } from 'drizzle-orm'
import { db } from '@/database/drizzle/connection'
import { batchTransactions, notifications } from '@/database/drizzle/schemas'
import { getRedis } from '@/database/redis'
import { createWorker } from '@/lib/queue'
import { parseCreditCardInvoice } from '@/services/ai/import-credit-card-invoice'
import { QUEUE_NAMES } from '../queues'

type CategoryItem = { id: string; name: string }

type CreditCardImportPayload = {
  pdfBuffer: number[]
  userId: string
  creditCardId: string
  categories: CategoryItem[]
  batchTransactionId: string
}

export const creditCardImportWorker = createWorker<CreditCardImportPayload>(
  QUEUE_NAMES.CREDIT_CARD_IMPORT,
  async (job) => {
    const { pdfBuffer, userId, creditCardId, categories, batchTransactionId } =
      job.data

    try {
      const result = await parseCreditCardInvoice(
        Buffer.from(pdfBuffer),
        categories.map((c) => c.name),
        userId,
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

      await db
        .update(batchTransactions)
        .set({
          data: { items },
          status: 'awaiting_manual_approve',
          updatedAt: new Date(),
        })
        .where(eq(batchTransactions.id, batchTransactionId))

      const [notification] = await db
        .insert(notifications)
        .values({
          userId,
          type: 'success',
          title: 'Fatura processada',
          message: `${items.length} transações encontradas. Revise e confirme.`,
          data: { batchTransactionId, creditCardId },
        })
        .returning()

      await publishNotification(userId, notification)
    } catch {
      await db
        .update(batchTransactions)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(batchTransactions.id, batchTransactionId))

      const [notification] = await db
        .insert(notifications)
        .values({
          userId,
          type: 'error',
          title: 'Falha ao processar fatura',
          message: 'Não foi possível processar a fatura. Tente novamente.',
          data: { batchTransactionId, creditCardId },
        })
        .returning()

      await publishNotification(userId, notification)
    }
  },
)

async function publishNotification(
  userId: string,
  notification: typeof notifications.$inferSelect,
) {
  await getRedis().publish(
    `notifications:${userId}`,
    JSON.stringify(notification),
  )
}

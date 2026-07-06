import { faker } from '@faker-js/faker'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

type BatchTransactionOverrides = {
  userId?: string
  creditCardId?: string | null
  jobId?: string
  fileHash?: string
  status?: 'awaiting_ai_analysis' | 'failed' | 'finished' | 'awaiting_manual_approve'
}

export async function makeBatchTransaction(overrides: BatchTransactionOverrides = {}) {
  const [batch] = await db
    .insert(schema.batchTransactions)
    .values({
      userId: overrides.userId ?? null,
      creditCardId: overrides.creditCardId ?? null,
      jobId: overrides.jobId ?? faker.string.uuid(),
      fileHash: overrides.fileHash ?? faker.string.hexadecimal({ length: 64 }),
      data: {
        items: [
          {
            description: faker.commerce.productName(),
            amount: faker.number.float({ fraction: 2 }),
            installment: null,
            suggestedCategory: null,
          },
        ],
      },
      status: overrides.status ?? faker.helpers.arrayElement([
        'awaiting_ai_analysis',
        'failed',
        'finished',
        'awaiting_manual_approve',
      ]),
    })
    .returning()

  return batch
}

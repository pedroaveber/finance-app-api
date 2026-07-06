import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

type TransactionOverrides = {
  userId: string
  categoryId: string
  creditCardId?: string
  description?: string
  amountInCents?: number
  type?: 'income' | 'expense'
  date?: string
}

export async function makeTransaction(overrides: TransactionOverrides) {
  const [transaction] = await db
    .insert(schema.transactions)
    .values({
      userId: overrides.userId,
      categoryId: overrides.categoryId,
      creditCardId: overrides.creditCardId ?? null,
      description: overrides.description ?? faker.commerce.productName(),
      amountInCents:
        overrides.amountInCents ?? faker.number.int({ min: 100, max: 1000000 }),
      type: overrides.type ?? faker.helpers.arrayElement(['income', 'expense']),
      date: overrides.date ?? dayjs().format('YYYY-MM-DD'),
    })
    .returning()

  return transaction
}

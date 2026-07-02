import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

type TransactionOverrides = {
  userId: string
  categoryId: string
  creditCardId?: string
  description?: string
  amount?: number
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
      amount: String(
        overrides.amount ?? faker.number.int({ min: 1, max: 10000 }),
      ),
      type: overrides.type ?? faker.helpers.arrayElement(['income', 'expense']),
      date: overrides.date ?? dayjs().format('YYYY-MM-DD'),
    })
    .returning()

  return transaction
}

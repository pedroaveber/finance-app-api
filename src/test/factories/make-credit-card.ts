import { faker } from '@faker-js/faker'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

type CreditCardOverrides = {
  userId: string
  name?: string
  bank?: string
  closingDay?: number
  paymentDay?: number
}

export async function makeCreditCard(overrides: CreditCardOverrides) {
  const [creditCard] = await db
    .insert(schema.creditCards)
    .values({
      userId: overrides.userId,
      name: overrides.name ?? faker.finance.creditCardIssuer(),
      bank: overrides.bank ?? faker.company.name(),
      closingDay: overrides.closingDay ?? faker.number.int({ min: 1, max: 28 }),
      paymentDay: overrides.paymentDay ?? faker.number.int({ min: 1, max: 28 }),
    })
    .returning()

  return creditCard
}

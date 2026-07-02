import { faker } from '@faker-js/faker'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

type CategoryOverrides = {
  userId: string
  name?: string
  type?: 'income' | 'expense'
}

export async function makeCategory(overrides: CategoryOverrides) {
  const [category] = await db
    .insert(schema.categories)
    .values({
      userId: overrides.userId,
      name: overrides.name ?? faker.commerce.department(),
      type: overrides.type ?? faker.helpers.arrayElement(['income', 'expense']),
    })
    .returning()

  return category
}

import { faker } from '@faker-js/faker'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'

type NotificationOverrides = {
  userId: string
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message?: string | null
  data?: unknown | null
  read?: boolean
}

export async function makeNotification(overrides: NotificationOverrides) {
  const [notification] = await db
    .insert(schema.notifications)
    .values({
      userId: overrides.userId,
      type:
        overrides.type ??
        faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
      title: overrides.title ?? faker.lorem.sentence(),
      message:
        overrides.message !== undefined
          ? overrides.message
          : faker.lorem.sentence(),
      data: overrides.data ?? null,
      read: overrides.read ?? false,
    })
    .returning()

  return notification
}

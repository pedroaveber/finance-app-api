import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { db } from '@/database/drizzle/connection'
import { notifications } from '@/database/drizzle/schemas'
import { createSession } from '@/test/create-session'
import { makeNotification } from '@/test/factories/make-notification'

describe('Read Notification Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should mark notification as read', async () => {
    const { cookie, userId } = await createSession()

    const notification = await makeNotification({ userId, read: false })

    const response = await request(app.server)
      .patch(`/notifications/${notification.id}/read`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(204)

    const [updated] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id))

    expect(updated.read).toBe(true)
  })

  it('should return 204 for non-existent notification', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .patch('/notifications/non-existent-id/read')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(204)
  })

  it('should not mark another users notification as read', async () => {
    const { cookie: cookieA, userId: userIdA } = await createSession()
    const { userId: userIdB } = await createSession()

    const notification = await makeNotification({
      userId: userIdA,
      read: false,
    })

    const response = await request(app.server)
      .patch(`/notifications/${notification.id}/read`)
      .set('Cookie', cookieA)

    expect(response.statusCode).toEqual(204)

    const [updated] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notification.id))

    expect(updated.read).toBe(true)
  })
})

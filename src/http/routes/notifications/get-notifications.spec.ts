import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeNotification } from '@/test/factories/make-notification'

describe('Get Notifications Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list notifications', async () => {
    const { cookie, userId } = await createSession()

    await makeNotification({ userId })
    await makeNotification({ userId })

    const response = await request(app.server)
      .get('/notifications')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      data: [
        { userId, read: false },
        { userId, read: false },
      ],
      hasMore: false,
    })
    expect(typeof response.body.nextCursor).toBe('number')
  })

  it('should return empty list when no notifications', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/notifications')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      data: [],
      nextCursor: null,
      hasMore: false,
    })
  })

  it('should paginate with cursor', async () => {
    const { cookie, userId } = await createSession()

    const notifications = await Promise.all(
      Array.from({ length: 5 }, () => makeNotification({ userId })),
    )

    const firstPage = await request(app.server)
      .get('/notifications')
      .query({ limit: 2 })
      .set('Cookie', cookie)

    expect(firstPage.statusCode).toEqual(200)
    expect(firstPage.body.data).toHaveLength(2)
    expect(firstPage.body.hasMore).toBe(true)
    expect(firstPage.body.nextCursor).toEqual(firstPage.body.data[1].cursorId)

    const secondPage = await request(app.server)
      .get('/notifications')
      .query({ limit: 2, cursor: firstPage.body.nextCursor })
      .set('Cookie', cookie)

    expect(secondPage.statusCode).toEqual(200)
    expect(secondPage.body.data).toHaveLength(2)
    expect(secondPage.body.hasMore).toBe(true)
  })

  it('should only return notifications for the authenticated user', async () => {
    const { cookie: cookieA, userId: userIdA } = await createSession()
    const { userId: userIdB } = await createSession()

    await makeNotification({ userId: userIdA })
    await makeNotification({ userId: userIdB })

    const response = await request(app.server)
      .get('/notifications')
      .set('Cookie', cookieA)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].userId).toEqual(userIdA)
  })

  it('should respect limit parameter', async () => {
    const { cookie, userId } = await createSession()

    await Promise.all(
      Array.from({ length: 50 }, () => makeNotification({ userId })),
    )

    const response = await request(app.server)
      .get('/notifications')
      .query({ limit: 5 })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toHaveLength(5)
    expect(response.body.hasMore).toBe(true)
  })
})

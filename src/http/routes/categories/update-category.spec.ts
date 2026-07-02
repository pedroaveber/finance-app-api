import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'

describe('Update Category Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should update a category', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })

    const response = await request(app.server)
      .put(`/categories/${category.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Updated Name' })

    expect(response.statusCode).toEqual(204)
  })

  it('should return 404 when updating another users category', async () => {
    const { cookie } = await createSession()
    const { userId: otherUserId } = await createSession()

    const category = await makeCategory({
      userId: otherUserId,
      type: 'expense',
    })

    const response = await request(app.server)
      .put(`/categories/${category.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Updated Name' })

    expect(response.statusCode).toEqual(404)
  })

  it('should return 404 for non-existent category', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .put(`/categories/${crypto.randomUUID()}`)
      .set('Cookie', cookie)
      .send({ name: 'Updated Name' })

    expect(response.statusCode).toEqual(404)
  })
})

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'
import { makeTransaction } from '@/test/factories/make-transaction'

describe('Delete Transaction Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should delete a transaction', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })
    const transaction = await makeTransaction({
      userId,
      categoryId: category.id,
    })

    const response = await request(app.server)
      .delete(`/transactions/${transaction.id}`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(204)
  })

  it('should return 404 for another users transaction', async () => {
    const { cookie } = await createSession()
    const { userId: otherUserId } = await createSession()

    const category = await makeCategory({
      userId: otherUserId,
      type: 'expense',
    })
    const transaction = await makeTransaction({
      userId: otherUserId,
      categoryId: category.id,
    })

    const response = await request(app.server)
      .delete(`/transactions/${transaction.id}`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(404)
  })
})

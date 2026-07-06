import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'

describe('Create Transaction Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create a transaction', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })

    const response = await request(app.server)
      .post('/transactions')
      .set('Cookie', cookie)
      .send({
        description: 'Supermercado',
        amountInCents: 25050,
        type: 'expense',
        date: '2025-01-15T00:00:00.000Z',
        categoryId: category.id,
      })

    expect(response.statusCode).toEqual(201)
    expect(response.body).toMatchObject({
      id: expect.any(String),
    })
  })

  it('should return 400 with invalid amount', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })

    const response = await request(app.server)
      .post('/transactions')
      .set('Cookie', cookie)
      .send({
        description: 'Supermercado',
        amountInCents: -50,
        type: 'expense',
        date: '2025-01-15T00:00:00.000Z',
        categoryId: category.id,
      })

    expect(response.statusCode).toEqual(400)
  })
})

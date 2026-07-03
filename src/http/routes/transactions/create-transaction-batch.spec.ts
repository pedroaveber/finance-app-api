import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'
import { makeCreditCard } from '@/test/factories/make-credit-card'

describe('Create Transaction Batch Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create transactions in batch', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })
    const creditCard = await makeCreditCard({ userId })

    const response = await request(app.server)
      .post('/transactions/batch')
      .set('Cookie', cookie)
      .send({
        creditCardId: creditCard.id,
        transactions: [
          {
            description: 'Supermercado',
            type: 'expense',
            categoryId: category.id,
            amount: 250.5,
            createdAt: '2025-01-15',
            installment: null,
            nickname: null,
          },
          {
            description: 'Gasolina',
            type: 'expense',
            categoryId: category.id,
            amount: 180.0,
            createdAt: '2025-01-16',
            installment: { current: 1, total: 3 },
            nickname: 'Posto Shell',
          },
        ],
      })

    expect(response.statusCode).toEqual(202)
    expect(response.body).toBeNull()
  })

  it('should return 400 with invalid amount', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })
    const creditCard = await makeCreditCard({ userId })

    const response = await request(app.server)
      .post('/transactions/batch')
      .set('Cookie', cookie)
      .send({
        creditCardId: creditCard.id,
        transactions: [
          {
            description: 'Supermercado',
            type: 'expense',
            categoryId: category.id,
            amount: -50,
            createdAt: '2025-01-15',
            installment: null,
            nickname: null,
          },
        ],
      })

    expect(response.statusCode).toEqual(400)
  })

  it('should return 400 with empty description', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })
    const creditCard = await makeCreditCard({ userId })

    const response = await request(app.server)
      .post('/transactions/batch')
      .set('Cookie', cookie)
      .send({
        creditCardId: creditCard.id,
        transactions: [
          {
            description: '',
            type: 'expense',
            categoryId: category.id,
            amount: 100,
            createdAt: '2025-01-15',
            installment: null,
            nickname: null,
          },
        ],
      })

    expect(response.statusCode).toEqual(400)
  })

  it('should return 401 without authentication', async () => {
    const response = await request(app.server)
      .post('/transactions/batch')
      .send({
        creditCardId: 'any-id',
        transactions: [],
      })

    expect(response.statusCode).toEqual(401)
  })
})

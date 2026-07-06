import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { db } from '@/database/drizzle/connection'
import * as schema from '@/database/drizzle/schemas'
import { createSession } from '@/test/create-session'
import { makeBatchTransaction } from '@/test/factories/make-batch-transaction'
import { makeCategory } from '@/test/factories/make-category'
import { makeCreditCard } from '@/test/factories/make-credit-card'

describe('Create Transaction Batch Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create transactions in batch and mark batch as finished', async () => {
    const { cookie, userId } = await createSession()

    const category = await makeCategory({ userId, type: 'expense' })
    const creditCard = await makeCreditCard({ userId })
    const batch = await makeBatchTransaction({
      userId,
      creditCardId: creditCard.id,
    })

    const response = await request(app.server)
      .post('/transactions/batch')
      .set('Cookie', cookie)
      .send({
        creditCardId: creditCard.id,
        batchTransactionsId: batch.id,
        transactions: [
          {
            description: 'Supermercado',
            type: 'expense',
            categoryId: category.id,
            amountInCents: 25050,
            createdAt: '2025-01-15',
            installment: null,
            nickname: null,
          },
          {
            description: 'Gasolina',
            type: 'expense',
            categoryId: category.id,
            amountInCents: 18000,
            createdAt: '2025-01-16',
            installment: { current: 1, total: 3 },
            nickname: 'Posto Shell',
          },
        ],
      })

    expect(response.statusCode).toEqual(201)
    expect(response.body).toBeNull()

    const updatedBatch = await db
      .select()
      .from(schema.batchTransactions)
      .where(eq(schema.batchTransactions.id, batch.id))
      .then((rows) => rows[0])

    expect(updatedBatch.status).toBe('finished')
    expect(updatedBatch.updatedAt).toBeTruthy()
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
        batchTransactionsId: 'any-id',
        transactions: [
          {
            description: 'Supermercado',
            type: 'expense',
            categoryId: category.id,
            amountInCents: -50,
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
        batchTransactionsId: 'any-id',
        transactions: [
          {
            description: '',
            type: 'expense',
            categoryId: category.id,
            amountInCents: 100,
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
        batchTransactionsId: 'any-id',
        transactions: [],
      })

    expect(response.statusCode).toEqual(401)
  })
})

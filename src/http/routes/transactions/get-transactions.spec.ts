import dayjs from 'dayjs'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'
import { makeTransaction } from '@/test/factories/make-transaction'

describe('Get Transactions Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list user transactions with metadata', async () => {
    const { cookie, userId } = await createSession()

    const incomeCategory = await makeCategory({ userId, type: 'income' })
    const expenseCategory = await makeCategory({ userId, type: 'expense' })

    await makeTransaction({
      userId,
      categoryId: incomeCategory.id,
      type: 'income',
      amountInCents: 500000,
    })
    await makeTransaction({
      userId,
      categoryId: expenseCategory.id,
      type: 'expense',
      amountInCents: 100000,
    })

    const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD')
    const endDate = dayjs().format('YYYY-MM-DD')

    const response = await request(app.server)
      .get('/transactions')
      .query({ startDate, endDate })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toHaveLength(2)
    expect(response.body).toMatchObject({
      total: 2,
      page: 1,
      limit: 50,
    })
    expect(response.body.metadata).toMatchObject({
      totalIncomes: 500000,
      totalExpenses: 100000,
      balance: 400000,
    })
  })

  it('should return 400 for period exceeding 90 days', async () => {
    const { cookie } = await createSession()

    const startDate = dayjs().subtract(100, 'days').format('YYYY-MM-DD')
    const endDate = dayjs().format('YYYY-MM-DD')

    const response = await request(app.server)
      .get('/transactions')
      .query({ startDate, endDate })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(400)
  })
})

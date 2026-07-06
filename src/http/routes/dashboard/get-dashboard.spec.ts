import dayjs from 'dayjs'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'
import { makeCreditCard } from '@/test/factories/make-credit-card'
import { makeTransaction } from '@/test/factories/make-transaction'

describe('Get Dashboard Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return financial summary for a period', async () => {
    const { cookie, userId } = await createSession()

    const incomeCategory = await makeCategory({ userId, type: 'income' })
    const expenseCategory = await makeCategory({ userId, type: 'expense' })
    const creditCard = await makeCreditCard({ userId })

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
      creditCardId: creditCard.id,
    })
    await makeTransaction({
      userId,
      categoryId: expenseCategory.id,
      type: 'expense',
      amountInCents: 50000,
    })

    const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD')
    const endDate = dayjs().format('YYYY-MM-DD')

    const response = await request(app.server)
      .get('/dashboard')
      .query({ startDate, endDate })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      startDate,
      endDate,
      totalIncome: 500000,
      totalExpenses: 150000,
      balance: 350000,
    })
    expect(response.body.byCategory).toHaveLength(1)
    expect(response.body.byCategory[0]).toMatchObject({
      category: { id: expenseCategory.id, name: expenseCategory.name },
      total: 150000,
      transactionCount: 2,
    })
    expect(response.body.byCard).toHaveLength(1)
    expect(response.body.byCard[0]).toMatchObject({
      cardId: creditCard.id,
      cardName: creditCard.name,
      total: 100000,
    })
  })

  it('should return 400 for period exceeding 90 days', async () => {
    const { cookie } = await createSession()

    const startDate = dayjs().subtract(100, 'days').format('YYYY-MM-DD')
    const endDate = dayjs().format('YYYY-MM-DD')

    const response = await request(app.server)
      .get('/dashboard')
      .query({ startDate, endDate })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(400)
  })

  it('should return empty summary when no transactions', async () => {
    const { cookie } = await createSession()

    const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD')
    const endDate = dayjs().format('YYYY-MM-DD')

    const response = await request(app.server)
      .get('/dashboard')
      .query({ startDate, endDate })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      byCategory: [],
      byCard: [],
    })
  })
})

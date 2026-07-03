import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'

vi.mock('@/services/ai/import-credit-card-invoice', () => ({
  parseCreditCardInvoice: vi.fn(),
}))

import { parseCreditCardInvoice } from '@/services/ai/import-credit-card-invoice'

const pdfPath = `${import.meta.dirname}/../../../../tmp/Supergasbras_4402707_20260715_1_0202.PDF`

describe('Import Credit Card Invoice Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should parse invoice and return matched categories', async () => {
    const { cookie, userId } = await createSession()

    await makeCategory({
      userId,
      name: 'Alimentação',
      type: 'expense',
    })

    await makeCategory({
      userId,
      name: 'Lazer',
      type: 'expense',
    })

    vi.mocked(parseCreditCardInvoice).mockResolvedValueOnce({
      items: [
        {
          description: 'Supermercado Extra',
          amount: 350.0,
          installment: null,
          suggestedCategory: 'Alimentação',
        },
        {
          description: 'Steam Games',
          amount: 99.0,
          installment: '1/3',
          suggestedCategory: 'Lazer',
        },
      ],
    })

    const response = await request(app.server)
      .post('/ai/import-credit-card-invoice')
      .attach('file', pdfPath)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.items).toHaveLength(2)
    expect(response.body.items[0]).toMatchObject({
      description: 'Supermercado Extra',
      amount: 350.0,
      installment: null,
      suggestedCategory: { name: 'Alimentação' },
    })
    expect(response.body.items[1]).toMatchObject({
      description: 'Steam Games',
      amount: 99.0,
      installment: '1/3',
      suggestedCategory: { name: 'Lazer' },
    })
  })

  it('should return null category when no match found', async () => {
    const { cookie } = await createSession()

    vi.mocked(parseCreditCardInvoice).mockResolvedValueOnce({
      items: [
        {
          description: 'Compra desconhecida',
          amount: 50.0,
          installment: null,
          suggestedCategory: null,
        },
      ],
    })

    const response = await request(app.server)
      .post('/ai/import-credit-card-invoice')
      .attach('file', pdfPath)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0]).toMatchObject({
      description: 'Compra desconhecida',
      amount: 50.0,
      installment: null,
      suggestedCategory: null,
    })
  })

  it('should return 400 when file is not a PDF', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .post('/ai/import-credit-card-invoice')
      .attach('file', Buffer.from('not a pdf content'), 'test.txt')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(400)
  })

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/ai/import-credit-card-invoice')
      .attach('file', pdfPath)

    expect(response.statusCode).toEqual(401)
  })
})

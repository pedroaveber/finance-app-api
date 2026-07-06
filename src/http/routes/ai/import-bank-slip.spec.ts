import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'

vi.mock('@/services/ai/import-bank-slip', () => ({
  parseBankSlip: vi.fn(),
}))

import { parseBankSlip } from '@/services/ai/import-bank-slip'

const pdfPath = `${import.meta.dirname}/../../../../tmp/Supergasbras_4402707_20260715_1_0202.PDF`

describe('Import Bank Slip Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should parse bank slip and return matched category', async () => {
    const { cookie, userId } = await createSession()

    await makeCategory({
      userId,
      name: 'Gás',
      type: 'expense',
    })

    vi.mocked(parseBankSlip).mockResolvedValueOnce({
      amount: 150.0,
      dueDate: '2026-07-15',
      description: 'Supergasbras',
      suggestedCategory: 'Gás',
    })

    const response = await request(app.server)
      .post('/ai/import-bank-slip')
      .attach('file', pdfPath)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.amountInCents).toEqual(15000)
    expect(response.body.dueDate).toEqual('2026-07-15')
    expect(response.body.description).toEqual('Supergasbras')
    expect(response.body.suggestedCategory).toMatchObject({ name: 'Gás' })
  })

  it('should return null category when no match found', async () => {
    const { cookie } = await createSession()

    vi.mocked(parseBankSlip).mockResolvedValueOnce({
      amount: 250.0,
      dueDate: '2026-08-01',
      description: 'Seguro de vida',
      suggestedCategory: null,
    })

    const response = await request(app.server)
      .post('/ai/import-bank-slip')
      .attach('file', pdfPath)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toMatchObject({
      amountInCents: 25000,
      dueDate: '2026-08-01',
      description: 'Seguro de vida',
      suggestedCategory: null,
    })
  })

  it('should return 400 when file is not a PDF', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .post('/ai/import-bank-slip')
      .attach('file', Buffer.from('not a pdf content'), 'test.txt')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(400)
  })

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/ai/import-bank-slip')
      .attach('file', pdfPath)

    expect(response.statusCode).toEqual(401)
  })
})

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'

describe('Create Credit Card Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create a credit card', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .post('/credit-cards')
      .set('Cookie', cookie)
      .send({
        name: 'Nubank',
        bank: 'Nubank',
        closingDay: 15,
        paymentDay: 22,
      })

    expect(response.statusCode).toEqual(201)
    expect(response.body).toMatchObject({
      id: expect.any(String),
    })
  })

  it('should return 400 with invalid day range', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .post('/credit-cards')
      .set('Cookie', cookie)
      .send({
        name: 'Nubank',
        bank: 'Nubank',
        closingDay: 32,
        paymentDay: 22,
      })

    expect(response.statusCode).toEqual(400)
  })
})

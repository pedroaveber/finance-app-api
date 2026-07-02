import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCreditCard } from '@/test/factories/make-credit-card'

describe('Update Credit Card Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should update a credit card', async () => {
    const { cookie, userId } = await createSession()

    const creditCard = await makeCreditCard({ userId })

    const response = await request(app.server)
      .put(`/credit-cards/${creditCard.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Updated Name' })

    expect(response.statusCode).toEqual(204)
  })

  it('should return 404 when updating another users credit card', async () => {
    const { cookie } = await createSession()
    const { userId: otherUserId } = await createSession()

    const creditCard = await makeCreditCard({ userId: otherUserId })

    const response = await request(app.server)
      .put(`/credit-cards/${creditCard.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Updated Name' })

    expect(response.statusCode).toEqual(404)
  })
})

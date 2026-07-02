import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCreditCard } from '@/test/factories/make-credit-card'

describe('Delete Credit Card Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should delete a credit card', async () => {
    const { cookie, userId } = await createSession()

    const creditCard = await makeCreditCard({ userId })

    const response = await request(app.server)
      .delete(`/credit-cards/${creditCard.id}`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(204)
  })

  it('should return 404 for another users credit card', async () => {
    const { cookie } = await createSession()
    const { userId: otherUserId } = await createSession()

    const creditCard = await makeCreditCard({ userId: otherUserId })

    const response = await request(app.server)
      .delete(`/credit-cards/${creditCard.id}`)
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(404)
  })
})

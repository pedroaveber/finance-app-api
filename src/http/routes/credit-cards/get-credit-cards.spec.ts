import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCreditCard } from '@/test/factories/make-credit-card'

describe('Get Credit Cards Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list user credit cards', async () => {
    const { cookie, userId } = await createSession()

    await makeCreditCard({ userId, name: 'Nubank' })
    await makeCreditCard({ userId, name: 'Inter' })

    const response = await request(app.server)
      .get('/credit-cards')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toHaveLength(2)
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Nubank' }),
        expect.objectContaining({ name: 'Inter' }),
      ]),
    )
  })

  it('should return empty list when user has no credit cards', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .get('/credit-cards')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toEqual([])
  })
})

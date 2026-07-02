import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'
import { makeCategory } from '@/test/factories/make-category'

describe('Get Categories Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list user categories', async () => {
    const { cookie, userId } = await createSession()

    await makeCategory({ userId, name: 'Comida', type: 'expense' })
    await makeCategory({ userId: userId, name: 'Salário', type: 'income' })

    const response = await request(app.server)
      .get('/categories')
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Comida', type: 'expense' }),
        expect.objectContaining({ name: 'Salário', type: 'income' }),
      ]),
    )
  })

  it('should filter categories by type', async () => {
    const { cookie, userId } = await createSession()

    await makeCategory({ userId, name: 'Comida', type: 'expense' })
    await makeCategory({ userId, name: 'Salário', type: 'income' })

    const response = await request(app.server)
      .get('/categories')
      .query({ type: 'income' })
      .set('Cookie', cookie)

    expect(response.statusCode).toEqual(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0]).toMatchObject({
      name: 'Salário',
      type: 'income',
    })
  })

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).get('/categories')

    expect(response.statusCode).toEqual(401)
  })
})

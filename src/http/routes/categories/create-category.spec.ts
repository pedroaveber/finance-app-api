import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'
import { createSession } from '@/test/create-session'

describe('Create Category Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create a category', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .post('/categories')
      .set('Cookie', cookie)
      .send({
        name: 'Transporte',
        type: 'expense',
      })

    expect(response.statusCode).toEqual(201)
    expect(response.body).toMatchObject({
      id: expect.any(String),
    })
  })

  it('should return 400 with invalid body', async () => {
    const { cookie } = await createSession()

    const response = await request(app.server)
      .post('/categories')
      .set('Cookie', cookie)
      .send({
        name: '',
        type: 'invalid',
      })

    expect(response.statusCode).toEqual(400)
  })
})

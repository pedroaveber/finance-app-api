import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '@/app'

describe('Health Check Route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return 200 with OK message', async () => {
    const response = await request(app.server).get('/health-check')

    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({ message: 'OK' })
  })
})
